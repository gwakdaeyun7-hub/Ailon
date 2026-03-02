# -*- coding: utf-8 -*-
"""
AI 기능 파이프라인 (6개 기능)
1. articles 독립 컬렉션 저장
2. 관련 기사 매칭
3. 데일리 브리핑
4. 퀴즈 생성
5. 용어 사전 축적
6. 타임라인 빌드

generate_daily.py에서 호출됩니다.
"""

import hashlib
from datetime import datetime, timedelta
from firebase_admin import firestore
from agents.config import get_firestore_client


def _article_id(url: str) -> str:
    """URL에서 안정적인 article ID 생성 (SHA256 앞 12자)."""
    return hashlib.sha256(url.encode()).hexdigest()[:12]


def _collect_unique_articles(result: dict) -> list[dict]:
    """결과에서 중복 제거된 전체 기사 목록 수집."""
    all_articles = list(result.get("highlights", []))
    for arts in result.get("categorized_articles", {}).values():
        all_articles.extend(arts)
    for arts in result.get("source_articles", {}).values():
        all_articles.extend(arts)
    seen = set()
    unique = []
    for a in all_articles:
        url = a.get("link", "")
        if url and url not in seen:
            seen.add(url)
            unique.append(a)
    return unique


# ─── 1. articles 독립 컬렉션 저장 ────────────────────────────────────────
def save_articles_collection(result: dict):
    """기사를 articles/{article_id} 컬렉션에 개별 저장 (듀얼 라이트)."""
    try:
        db = get_firestore_client()
        today = datetime.now().strftime("%Y-%m-%d")
        unique = _collect_unique_articles(result)
        if not unique:
            return

        batch = db.batch()
        batch_count = 0
        article_ids = []
        for a in unique:
            aid = _article_id(a.get("link", ""))
            article_ids.append(aid)
            doc_ref = db.collection("articles").document(aid)
            a_data = {
                "article_id": aid,
                "title": a.get("title", ""),
                "display_title": a.get("display_title", "") or a.get("title", ""),
                "display_title_en": a.get("display_title_en", ""),
                "one_line": a.get("one_line", ""),
                "one_line_en": a.get("one_line_en", ""),
                "key_points": a.get("key_points", []),
                "key_points_en": a.get("key_points_en", []),
                "why_important": a.get("why_important", ""),
                "why_important_en": a.get("why_important_en", ""),
                "link": a.get("link", ""),
                "published": a.get("published", ""),
                "source": a.get("source", ""),
                "source_key": a.get("source_key", ""),
                "image_url": a.get("image_url", ""),
                "score": a.get("score") or a.get("_total_score", 0),
                "category": a.get("_llm_category", "") or a.get("category", ""),
                "background": a.get("background", ""),
                "background_en": a.get("background_en", ""),
                "tags": a.get("tags", []),
                "glossary": a.get("glossary", []),
                "glossary_en": a.get("glossary_en", []),
                "entities": a.get("entities", []),
                "topic_cluster_id": a.get("topic_cluster_id", ""),
                "related_ids": a.get("related_ids", []),
                "timeline_ids": a.get("timeline_ids", []),
                "date": today,
                "updated_at": firestore.SERVER_TIMESTAMP,
            }
            batch.set(doc_ref, a_data, merge=True)
            batch_count += 1
            if batch_count >= 450:
                batch.commit()
                batch = db.batch()
                batch_count = 0
        if batch_count > 0:
            batch.commit()

        # daily_news에 article_ids 참조 추가
        try:
            db.collection("daily_news").document(today).update({"article_ids": article_ids})
        except Exception:
            pass  # daily_news 문서가 아직 없을 수 있음

        print(f"  articles 컬렉션: {len(unique)}개 기사 저장")
    except Exception as e:
        print(f"  [WARN] articles 저장 실패: {e}")


# ─── 2. 관련 기사 매칭 ───────────────────────────────────────────────────
def find_related_articles(result: dict):
    """entity/cluster 기반으로 각 기사에 related_ids를 할당."""
    unique = _collect_unique_articles(result)
    if len(unique) < 3:
        return

    for target in unique:
        t_entities = {e.get("name", "").lower() for e in target.get("entities", []) if isinstance(e, dict)}
        t_cluster = target.get("topic_cluster_id", "")
        t_domain = t_cluster.split("/")[0] if "/" in t_cluster else ""
        t_cat = target.get("_llm_category", "") or target.get("category", "")

        scores = []
        for a in unique:
            if a.get("link") == target.get("link"):
                continue
            a_entities = {e.get("name", "").lower() for e in a.get("entities", []) if isinstance(e, dict)}
            a_cluster = a.get("topic_cluster_id", "")
            a_domain = a_cluster.split("/")[0] if "/" in a_cluster else ""
            a_cat = a.get("_llm_category", "") or a.get("category", "")

            score = len(t_entities & a_entities) * 3
            if t_cluster and t_cluster == a_cluster:
                score += 5
            elif t_domain and t_domain == a_domain:
                score += 2
            if t_cat and t_cat == a_cat:
                score += 1
            if score > 0:
                scores.append((score, a))

        scores.sort(key=lambda x: x[0], reverse=True)
        target["related_ids"] = [_article_id(a.get("link", "")) for _, a in scores[:3]]

    print(f"  관련 기사 매칭 완료: {len(unique)}개 기사")


# ─── 3. 데일리 브리핑 생성 ───────────────────────────────────────────────
def generate_daily_briefing(result: dict):
    """하이라이트 + 카테고리 Top 기사 기반 한/영 브리핑 생성."""
    try:
        from agents.config import get_llm
        from agents.news_team import _parse_llm_json

        highlights = result.get("highlights", [])[:3]
        cat_articles = result.get("categorized_articles", {})
        top_cats = [arts[0] for arts in cat_articles.values() if arts]
        all_articles = highlights + top_cats[:4]
        if len(all_articles) < 2:
            print("  브리핑 생략: 기사 부족")
            return None

        articles_text = ""
        for i, a in enumerate(all_articles):
            title = a.get("display_title", "") or a.get("title", "")
            one_line = a.get("one_line", "")
            why = a.get("why_important", "")
            articles_text += f"[{i}] {title} | {one_line} | {why}\n"

        prompt = f"""IMPORTANT: Output ONLY a valid JSON object. No markdown, no explanation. Start with open brace.

Write a 2-3 minute AI news briefing covering today's top stories.
Korean: 해요체. Proper nouns stay in English. 5-7 stories, fact-focused.
Open with greeting, close with sign-off.

Output format:
{{"briefing_ko": "안녕하세요...", "briefing_en": "Hello...", "story_count": 5, "mentioned_indices": [0,1,2]}}

Articles:
{articles_text}"""

        llm = get_llm(temperature=0.3, max_tokens=4096, thinking=False, json_mode=True)
        resp = llm.invoke(prompt)
        data = _parse_llm_json(resp.content if hasattr(resp, "content") else str(resp))
        if not isinstance(data, dict) or "briefing_ko" not in data:
            print("  [브리핑 실패] 잘못된 응답 형식")
            return None

        mentioned = data.get("mentioned_indices", [])
        article_ids = []
        for idx in mentioned:
            try:
                idx = int(idx)
            except (ValueError, TypeError):
                continue
            if 0 <= idx < len(all_articles):
                article_ids.append(_article_id(all_articles[idx].get("link", "")))

        db = get_firestore_client()
        today = datetime.now().strftime("%Y-%m-%d")
        db.collection("daily_briefings").document(today).set({
            "date": today,
            "briefing_ko": data.get("briefing_ko", ""),
            "briefing_en": data.get("briefing_en", ""),
            "story_count": data.get("story_count", 0),
            "article_ids": article_ids,
            "updated_at": firestore.SERVER_TIMESTAMP,
        })
        print(f"  브리핑 저장 완료: {data.get('story_count', 0)}개 스토리")
        return data
    except Exception as e:
        print(f"  [브리핑 실패] {e}")
        return None


# ─── 4. 퀴즈 생성 ───────────────────────────────────────────────────────
def generate_daily_quiz(result: dict):
    """당일 주요 기사 기반 5문제 4지선다 퀴즈 생성."""
    try:
        from agents.config import get_llm
        from agents.news_team import _parse_llm_json

        highlights = result.get("highlights", [])[:3]
        cat_articles = result.get("categorized_articles", {})
        top_cats = [arts[0] for arts in cat_articles.values() if arts]
        all_articles = highlights + top_cats[:4]
        if len(all_articles) < 3:
            print("  퀴즈 생략: 기사 부족")
            return None

        articles_text = ""
        for i, a in enumerate(all_articles):
            title = a.get("display_title", "") or a.get("title", "")
            one_line = a.get("one_line", "")
            kps = a.get("key_points", [])
            kps_str = " | ".join(kps) if isinstance(kps, list) else str(kps)
            articles_text += f"[{i}] {title} | {one_line} | {kps_str}\n"

        prompt = f"""IMPORTANT: Output ONLY a valid JSON array. No markdown, no explanation. Start with '['.

Generate exactly 5 multiple-choice quiz questions based on today's AI news.
Every correct answer MUST be directly stated in the articles.
Mix difficulty: 2 easy, 2 medium, 1 hard.
Korean: 해요체. Proper nouns in English. correct_index is 0-based (0-3).
Each question references a DIFFERENT article.

Output 5 items:
[{{"question_ko":"...","question_en":"...","options_ko":["A","B","C","D"],"options_en":["A","B","C","D"],"correct_index":0,"difficulty":"easy","explanation_ko":"...","explanation_en":"...","source_article_index":0}}]

Articles:
{articles_text}"""

        llm = get_llm(temperature=0.2, max_tokens=4096, thinking=False, json_mode=True)
        resp = llm.invoke(prompt)
        quizzes = _parse_llm_json(resp.content if hasattr(resp, "content") else str(resp))
        if isinstance(quizzes, dict):
            quizzes = next((v for v in quizzes.values() if isinstance(v, list)), [])
        if not isinstance(quizzes, list) or len(quizzes) == 0:
            print("  [퀴즈 실패] 잘못된 응답 형식")
            return None

        # 5문제 미달 시 1회 재시도 (실패해도 기존 결과 보존)
        if len(quizzes) < 5:
            print(f"  [퀴즈] {len(quizzes)}/5문제 — 재시도...")
            try:
                resp2 = llm.invoke(prompt)
                retry = _parse_llm_json(resp2.content if hasattr(resp2, "content") else str(resp2))
                if isinstance(retry, dict):
                    retry = next((v for v in retry.values() if isinstance(v, list)), [])
                if isinstance(retry, list) and len(retry) > len(quizzes):
                    quizzes = retry
            except Exception as e:
                print(f"  [퀴즈 재시도 실패] {e} — 기존 {len(quizzes)}문제 사용")

        for q in quizzes:
            if isinstance(q, dict):
                src_idx = q.get("source_article_index", -1)
                try:
                    src_idx = int(src_idx)
                except (ValueError, TypeError):
                    src_idx = -1
                if 0 <= src_idx < len(all_articles):
                    q["source_article_id"] = _article_id(all_articles[src_idx].get("link", ""))

        db = get_firestore_client()
        today = datetime.now().strftime("%Y-%m-%d")
        db.collection("daily_quizzes").document(today).set({
            "date": today,
            "questions": quizzes,
            "updated_at": firestore.SERVER_TIMESTAMP,
        })
        print(f"  퀴즈 저장 완료: {len(quizzes)}문제")
        return quizzes
    except Exception as e:
        print(f"  [퀴즈 실패] {e}")
        return None


# ─── 5. 용어 사전 축적 ──────────────────────────────────────────────────
def accumulate_glossary(result: dict):
    """기사의 glossary 데이터를 glossary_terms 컬렉션에 축적."""
    all_articles = list(result.get("highlights", []))
    for arts in result.get("categorized_articles", {}).values():
        all_articles.extend(arts)

    term_map = {}
    for a in all_articles:
        aid = _article_id(a.get("link", ""))
        g_ko = a.get("glossary", [])
        g_en = a.get("glossary_en", [])
        for i, item in enumerate(g_ko):
            if not isinstance(item, dict):
                continue
            term_ko = item.get("term", "").strip()
            desc_ko = item.get("desc", "").strip()
            term_en = ""
            desc_en = ""
            if i < len(g_en) and isinstance(g_en[i], dict):
                term_en = g_en[i].get("term", "").strip()
                desc_en = g_en[i].get("desc", "").strip()
            if not term_ko and not term_en:
                continue
            normalized = (term_en or term_ko).lower().replace(" ", "_").replace("/", "_")[:64]
            if normalized not in term_map:
                term_map[normalized] = {
                    "term_ko": term_ko, "term_en": term_en or term_ko,
                    "desc_ko": desc_ko, "desc_en": desc_en or desc_ko,
                    "article_ids": [],
                }
            if aid and aid not in term_map[normalized]["article_ids"]:
                term_map[normalized]["article_ids"].append(aid)

    if not term_map:
        print("  용어 없음")
        return 0

    db = get_firestore_client()
    batch = db.batch()
    batch_count = 0
    total = 0
    for term_normalized, data in term_map.items():
        doc_ref = db.collection("glossary_terms").document(term_normalized)
        batch.set(doc_ref, {
            "term_en": data["term_en"],
            "term_ko": data["term_ko"],
            "desc_en": data["desc_en"],
            "desc_ko": data["desc_ko"],
            "article_ids": firestore.ArrayUnion(data["article_ids"]),
            "updated_at": firestore.SERVER_TIMESTAMP,
        }, merge=True)
        batch_count += 1
        total += 1
        if batch_count >= 450:
            batch.commit()
            batch = db.batch()
            batch_count = 0
    if batch_count > 0:
        try:
            batch.commit()
        except Exception as e:
            print(f"  [WARN] glossary 배치 저장 실패: {e}")

    print(f"  용어 사전: {total}개 용어 축적 완료")
    return total


# ─── 6. 타임라인 빌드 ───────────────────────────────────────────────────
def build_timeline(result: dict):
    """오늘 기사의 entity/tags로 최근 30일 과거 기사와 연결."""
    try:
        db = get_firestore_client()
        today = datetime.now().strftime("%Y-%m-%d")
        cutoff = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

        unique_today = _collect_unique_articles(result)
        if not unique_today:
            return

        from google.cloud.firestore_v1.base_query import FieldFilter
        past_docs = db.collection("articles").where(
            filter=FieldFilter("date", ">=", cutoff)
        ).where(
            filter=FieldFilter("date", "<", today)
        ).stream()

        past_articles = []
        for d in past_docs:
            data = d.to_dict()
            data["_doc_id"] = d.id
            past_articles.append(data)

        if not past_articles:
            print("  타임라인: 과거 기사 없음")
            return

        updated = 0
        batch = db.batch()
        batch_count = 0
        for target in unique_today:
            t_entities = {e.get("name", "").lower() for e in target.get("entities", []) if isinstance(e, dict)}
            t_tags = {t.lower() for t in target.get("tags", []) if isinstance(t, str)}
            t_terms = t_entities | t_tags
            if not t_terms:
                continue

            scores = []
            for pa in past_articles:
                p_entities = {e.get("name", "").lower() for e in pa.get("entities", []) if isinstance(e, dict)}
                p_tags = {t.lower() for t in pa.get("tags", []) if isinstance(t, str)}
                overlap = len(t_terms & (p_entities | p_tags))
                if overlap > 0:
                    scores.append((overlap, pa))

            scores.sort(key=lambda x: x[0], reverse=True)
            timeline_ids = [s[1]["_doc_id"] for s in scores[:5] if s[1].get("_doc_id")]
            if timeline_ids:
                target["timeline_ids"] = timeline_ids
                aid = _article_id(target.get("link", ""))
                batch.set(db.collection("articles").document(aid), {"timeline_ids": timeline_ids}, merge=True)
                batch_count += 1
                updated += 1
                if batch_count >= 450:
                    batch.commit()
                    batch = db.batch()
                    batch_count = 0
        if batch_count > 0:
            batch.commit()
        print(f"  타임라인: {updated}개 기사에 과거 연결 완료")
    except Exception as e:
        print(f"  [타임라인 실패] {e}")
