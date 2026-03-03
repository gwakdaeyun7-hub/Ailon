# -*- coding: utf-8 -*-
"""
AI 기능 파이프라인 (7개 기능)
1. articles 독립 컬렉션 저장
2. 관련 기사 매칭
3. 데일리 브리핑
4. 용어 사전 축적
5. 타임라인 빌드
6. 스토리 타임라인 생성

generate_daily.py에서 호출됩니다.
"""

import hashlib
import re
from datetime import datetime, timedelta, timezone
from firebase_admin import firestore
from langchain_core.messages import HumanMessage
from agents.config import get_firestore_client

_KST = timezone(timedelta(hours=9))


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
        today = datetime.now(_KST).strftime("%Y-%m-%d")
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
                "tags_en": a.get("tags_en", []),
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
        except Exception as e:
            print(f"  [WARN] article_ids 업데이트 실패: {e}")

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
        resp = llm.invoke([HumanMessage(content=prompt)])
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
        today = datetime.now(_KST).strftime("%Y-%m-%d")
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
        # EN glossary를 term 기준 dict로 변환 (인덱스 대신 term 매칭)
        en_by_term = {g.get("term", "").strip().lower(): g for g in g_en if isinstance(g, dict)} if g_en else {}
        for i, item in enumerate(g_ko):
            if not isinstance(item, dict):
                continue
            term_ko = item.get("term", "").strip()
            desc_ko = item.get("desc", "").strip()
            term_en = ""
            desc_en = ""
            # term 기반 매칭: KO 용어의 term을 키로 EN dict에서 lookup
            en_match = en_by_term.get(term_ko.lower())
            if en_match:
                term_en = en_match.get("term", "").strip()
                desc_en = en_match.get("desc", "").strip()
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


_TIMELINE_STOP_TERMS = {
    "ai", "artificialintelligence", "machinelearning",
    "ml", "technology", "tech", "deeplearning",
    "llm", "model", "api",
    "data", "cloud", "software", "hardware",
}


def _normalize_term(name: str) -> str:
    """entity/tag 이름 정규화 — 공백·하이픈 제거, 소문자."""
    return re.sub(r'[\s\-_]+', '', name.lower())


# ─── 6. 타임라인 빌드 ───────────────────────────────────────────────────
def build_timeline(result: dict):
    """오늘 기사의 entity/tags로 최근 90일(3개월) 과거 기사와 연결."""
    try:
        db = get_firestore_client()
        today = datetime.now(_KST).strftime("%Y-%m-%d")
        cutoff = (datetime.now(_KST) - timedelta(days=90)).strftime("%Y-%m-%d")

        unique_today = _collect_unique_articles(result)
        if not unique_today:
            return

        from google.cloud.firestore_v1.base_query import FieldFilter
        past_docs = db.collection("articles").where(
            filter=FieldFilter("date", ">=", cutoff)
        ).where(
            filter=FieldFilter("date", "<", today)
        ).select(["entities", "tags", "date"]).stream()

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
            t_entities = {_normalize_term(e.get("name", "")) for e in target.get("entities", []) if isinstance(e, dict)}
            t_tags = {_normalize_term(t) for t in target.get("tags", []) if isinstance(t, str)}
            t_terms = (t_entities | t_tags) - _TIMELINE_STOP_TERMS
            if not t_terms:
                continue

            scores = []
            for pa in past_articles:
                p_entities = {_normalize_term(e.get("name", "")) for e in pa.get("entities", []) if isinstance(e, dict)}
                p_tags = {_normalize_term(t) for t in pa.get("tags", []) if isinstance(t, str)}
                p_terms = (p_entities | p_tags) - _TIMELINE_STOP_TERMS
                overlap = len(t_terms & p_terms)
                if overlap >= 2:
                    scores.append((overlap, pa))

            scores.sort(key=lambda x: x[0], reverse=True)
            timeline_ids = [s[1]["_doc_id"] for s in scores[:3] if s[1].get("_doc_id")]
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


# ─── 6b. daily_news에 related_ids/timeline_ids 패치 ─────────────────────
def patch_daily_news_ids(result: dict):
    """AI 기능 파이프라인 완료 후, daily_news 문서 내 기사들에 related_ids/timeline_ids를 반영.

    save_news_to_firestore가 find_related_articles/build_timeline보다 먼저 실행되므로,
    이 함수로 사후 패치한다.
    """
    try:
        db = get_firestore_client()
        today = datetime.now(_KST).strftime("%Y-%m-%d")
        doc_ref = db.collection("daily_news").document(today)
        doc = doc_ref.get()
        if not doc.exists:
            return

        # news_result에서 link → {related_ids, timeline_ids} 매핑 구축
        unique = _collect_unique_articles(result)
        id_map: dict[str, dict] = {}
        for a in unique:
            link = a.get("link", "")
            if not link:
                continue
            tl_ids = a.get("timeline_ids", [])
            id_map[link] = {
                "related_ids": a.get("related_ids", []),
                "timeline_ids": tl_ids,
                "timeline_count": len(tl_ids),
            }

        if not id_map:
            return

        data = doc.to_dict()
        changed = False

        def _patch_list(articles: list[dict]) -> bool:
            patched = False
            for a in articles:
                link = a.get("link", "")
                if link in id_map:
                    ids = id_map[link]
                    a["related_ids"] = ids["related_ids"]
                    a["timeline_ids"] = ids["timeline_ids"]
                    a["timeline_count"] = ids["timeline_count"]
                    patched = True
            return patched

        # highlights
        if _patch_list(data.get("highlights", [])):
            changed = True
        # categorized_articles
        for cat, arts in data.get("categorized_articles", {}).items():
            if _patch_list(arts):
                changed = True
        # source_articles
        for src, arts in data.get("source_articles", {}).items():
            if _patch_list(arts):
                changed = True

        if changed:
            doc_ref.update({
                "highlights": data["highlights"],
                "categorized_articles": data["categorized_articles"],
                "source_articles": data["source_articles"],
            })
            patched_count = sum(1 for v in id_map.values() if v["related_ids"] or v["timeline_ids"])
            print(f"  daily_news 패치: {patched_count}개 기사에 related_ids/timeline_ids 반영")
    except Exception as e:
        print(f"  [WARN] daily_news 패치 실패: {e}")


# ─── 7. 스토리 타임라인 생성 ──────────────────────────────────────────
def generate_story_timeline(result: dict):
    """오늘 기사를 entity/tag 기반으로 클러스터링하고, 과거 기사와 결합하여
    LLM이 내러티브 스토리 타임라인을 생성한 뒤 Firestore에 저장."""
    try:
        from agents.config import get_llm
        from agents.news_team import _parse_llm_json, _llm_invoke_with_retry

        db = get_firestore_client()
        today = datetime.now(_KST).strftime("%Y-%m-%d")
        cutoff = (datetime.now(_KST) - timedelta(days=90)).strftime("%Y-%m-%d")

        # ── 1. Collect today's articles ──
        unique_today = _collect_unique_articles(result)
        if len(unique_today) < 2:
            print("  스토리 타임라인 생략: 기사 부족")
            return

        # ── 2. Extract terms per article ──
        article_terms: list[tuple[dict, set[str]]] = []
        for a in unique_today:
            entities = {_normalize_term(e.get("name", ""))
                        for e in a.get("entities", []) if isinstance(e, dict)}
            tags = {_normalize_term(t)
                    for t in a.get("tags", []) if isinstance(t, str)}
            terms = (entities | tags) - _TIMELINE_STOP_TERMS
            article_terms.append((a, terms))

        # ── 3. Cluster by union-find (>= 2 shared terms) ──
        n = len(article_terms)
        parent = list(range(n))

        def find(x: int) -> int:
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        def union(x: int, y: int) -> None:
            px, py = find(x), find(y)
            if px != py:
                parent[px] = py

        for i in range(n):
            for j in range(i + 1, n):
                if len(article_terms[i][1] & article_terms[j][1]) >= 1:
                    union(i, j)

        clusters: dict[int, list[int]] = {}
        for i in range(n):
            root = find(i)
            clusters.setdefault(root, []).append(i)

        # Only clusters with >= 2 today articles
        clusters = {k: v for k, v in clusters.items() if len(v) >= 2}
        if not clusters:
            print("  스토리 타임라인 생략: 유효한 클러스터 없음")
            return

        # ── 4. Collect cluster terms & find past articles ──
        from google.cloud.firestore_v1.base_query import FieldFilter
        past_docs = db.collection("articles").where(
            filter=FieldFilter("date", ">=", cutoff)
        ).where(
            filter=FieldFilter("date", "<", today)
        ).select(["article_id", "display_title", "display_title_en",
                   "one_line", "one_line_en", "source", "link",
                   "image_url", "date", "entities", "tags"]).stream()

        past_articles = []
        for d in past_docs:
            data = d.to_dict()
            data.setdefault("article_id", d.id)
            past_articles.append(data)

        # Build enriched clusters: today articles + matching past articles
        enriched_clusters: list[dict] = []
        for root, indices in clusters.items():
            # Merge terms across cluster
            cluster_terms: set[str] = set()
            for idx in indices:
                cluster_terms |= article_terms[idx][1]

            # Find past articles with >= 1 overlapping terms
            matched_past = []
            for pa in past_articles:
                p_entities = {_normalize_term(e.get("name", ""))
                              for e in pa.get("entities", []) if isinstance(e, dict)}
                p_tags = {_normalize_term(t)
                          for t in pa.get("tags", []) if isinstance(t, str)}
                p_terms = (p_entities | p_tags) - _TIMELINE_STOP_TERMS
                if len(cluster_terms & p_terms) >= 1:
                    matched_past.append(pa)

            today_articles = [article_terms[idx][0] for idx in indices]
            total_count = len(today_articles) + len(matched_past)
            if total_count < 2:
                continue

            enriched_clusters.append({
                "today_articles": today_articles,
                "past_articles": matched_past[:10],  # cap past articles
                "total_count": total_count,
            })

        if not enriched_clusters:
            print("  스토리 타임라인 생략: 유효한 클러스터 없음")
            return

        # ── 5. Select top 1-3 clusters ──
        enriched_clusters.sort(key=lambda c: c["total_count"], reverse=True)
        enriched_clusters = enriched_clusters[:3]

        # ── 6. Build prompt ──
        clusters_text = ""
        all_cluster_articles: list[list[dict]] = []  # per-cluster article lists
        global_idx = 0
        for ci, cluster in enumerate(enriched_clusters):
            clusters_text += f"\n--- Cluster {ci + 1} ---\n"
            cluster_articles: list[dict] = []
            # Combine past + today, sorted chronologically
            combined = []
            for pa in cluster["past_articles"]:
                combined.append({
                    "article": pa,
                    "date": pa.get("date", ""),
                    "title": pa.get("display_title", "") or pa.get("title", ""),
                    "one_line": pa.get("one_line", ""),
                    "source": pa.get("source", ""),
                })
            for ta in cluster["today_articles"]:
                combined.append({
                    "article": ta,
                    "date": today,
                    "title": ta.get("display_title", "") or ta.get("title", ""),
                    "one_line": ta.get("one_line", ""),
                    "source": ta.get("source", ""),
                })
            combined.sort(key=lambda x: x["date"])

            for item in combined:
                clusters_text += (
                    f"[{global_idx}] ({item['date']}) {item['title']} "
                    f"| {item['one_line']} | {item['source']}\n"
                )
                cluster_articles.append(item["article"])
                global_idx += 1
            all_cluster_articles.append(cluster_articles)

        prompt = f"""IMPORTANT: Output ONLY a valid JSON object. No markdown. Start with open brace.

You are an AI news curator. Given grouped news article clusters, create story timelines that narrate how events unfolded.

Rules:
- Korean: 해요체, conversational. Proper nouns in English.
- English: casual but informative
- Each narration: 1-2 sentences, connecting articles naturally
- Only create stories where articles have REAL connections
- Max 3 stories. If no good stories exist, return {{"stories": []}}

Output format:
{{"stories": [{{"title_ko": "...", "title_en": "...", "nodes": [{{"type": "narration", "text_ko": "...", "text_en": "...", "date": "YYYY-MM-DD"}}, {{"type": "article", "index": 0, "date": "YYYY-MM-DD"}}, ...], "summary_ko": "...", "summary_en": "..."}}]}}

Article clusters:
{clusters_text}"""

        llm = get_llm(temperature=0.3, max_tokens=8192, thinking=False, json_mode=True)
        data = None
        for _attempt in range(2):
            try:
                content = _llm_invoke_with_retry(llm, prompt, max_retries=2)
                data = _parse_llm_json(content)
                if isinstance(data, dict) and "stories" in data:
                    break
                data = None
            except Exception as parse_err:
                print(f"  [스토리 타임라인] 파싱 재시도 ({_attempt+1}/2): {parse_err}")
                data = None
        if not isinstance(data, dict) or "stories" not in data:
            print("  [스토리 타임라인 실패] 잘못된 응답 형식")
            return

        stories_raw = data.get("stories", [])
        if not stories_raw:
            print("  스토리 타임라인: LLM이 유효한 스토리 없다고 판단")
            return

        # ── 7. Map article indices back to real data ──
        # Flatten all cluster articles into one list (matches global_idx)
        flat_articles: list[dict] = []
        for ca in all_cluster_articles:
            flat_articles.extend(ca)

        stories = []
        for si, story in enumerate(stories_raw):
            title_ko = story.get("title_ko", "")
            story_id = f"{today}_{si}_{hashlib.md5(title_ko.encode()).hexdigest()[:6]}"
            nodes = []
            for node in story.get("nodes", []):
                if node.get("type") == "narration":
                    nodes.append({
                        "type": "narration",
                        "text_ko": node.get("text_ko", ""),
                        "text_en": node.get("text_en", ""),
                        "date": node.get("date", ""),
                    })
                elif node.get("type") == "article":
                    idx = node.get("index")
                    try:
                        idx = int(idx)
                    except (ValueError, TypeError):
                        continue
                    if idx < 0 or idx >= len(flat_articles):
                        continue
                    a = flat_articles[idx]
                    nodes.append({
                        "type": "article",
                        "article_id": a.get("article_id") or _article_id(a.get("link", "")),
                        "title_ko": a.get("display_title", "") or a.get("title", ""),
                        "title_en": a.get("display_title_en", ""),
                        "source": a.get("source", ""),
                        "link": a.get("link", ""),
                        "image_url": a.get("image_url", ""),
                        "date": a.get("date", today),
                    })
            if not nodes:
                continue
            stories.append({
                "story_id": story_id,
                "title_ko": title_ko,
                "title_en": story.get("title_en", ""),
                "nodes": nodes,
                "summary_ko": story.get("summary_ko", ""),
                "summary_en": story.get("summary_en", ""),
            })

        if not stories:
            print("  스토리 타임라인: 매핑 후 유효한 스토리 없음")
            return

        # ── 8. Save to Firestore ──
        db.collection("daily_story_timeline").document(today).set({
            "date": today,
            "stories": stories,
            "updated_at": firestore.SERVER_TIMESTAMP,
        })
        print(f"  스토리 타임라인: {len(stories)}개 스토리 저장 완료")

    except Exception as e:
        print(f"  [스토리 타임라인 실패] {e}")
