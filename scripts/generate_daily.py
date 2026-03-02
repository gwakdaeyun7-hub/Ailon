# -*- coding: utf-8 -*-
"""
일일 콘텐츠 파이프라인
Step 1: 뉴스 에이전트 팀 → daily_news 컬렉션
Step 2: 학제간 원리 파이프라인 → daily_principles 컬렉션
Step 3: 데이터 정리

매일 GitHub Actions에서 실행됩니다.
"""

import argparse
import sys
import os
import time
from datetime import datetime, timedelta
from firebase_admin import firestore

# scripts 디렉토리를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.config import initialize_firebase, get_firestore_client
from agents.news_team import run_news_pipeline
from agents.principle_team import run_principle_pipeline
from notifications import send_news_notification
from generate_features import (
    _article_id,
    save_articles_collection, find_related_articles,
    generate_daily_briefing, generate_daily_quiz,
    accumulate_glossary, build_timeline,
)


def _validate_output(result: dict) -> list[str]:
    """저장 전 품질 검증. 경고 목록 반환."""
    warnings = []
    highlights = result.get("highlights", [])
    categorized = result.get("categorized_articles", {})
    source_articles = result.get("source_articles", {})

    if len(highlights) < 2:
        warnings.append(f"하이라이트 {len(highlights)}/3개 (최소 2)")
    for i, h in enumerate(highlights):
        if not h.get("image_url"):
            warnings.append(f"하이라이트 {i+1} 썸네일 없음")

    for cat in ["research", "models_products", "industry_business"]:
        count = len(categorized.get(cat, []))
        if count < 5:
            warnings.append(f"카테고리 {cat}: {count}/10개 (최소 5)")
        no_img = sum(1 for a in categorized.get(cat, []) if not a.get("image_url"))
        if no_img > 0:
            warnings.append(f"카테고리 {cat}: 썸네일 없는 기사 {no_img}개")

    active_sources = sum(1 for v in source_articles.values() if len(v) > 0)
    if active_sources < 2:
        warnings.append(f"한국 소스 {active_sources}/5개만 활성")

    return warnings


def _merge_articles(existing: list[dict], new: list[dict]) -> list[dict]:
    """link 기준 병합. 중복 시 신규(최신 수집) 우선."""
    seen = {}
    for a in new:
        link = a.get("link", "")
        if link:
            seen[link] = a
    for a in existing:
        link = a.get("link", "")
        if link and link not in seen:
            seen[link] = a
    return list(seen.values())


def save_news_to_firestore(result: dict):
    """뉴스 결과를 Firestore에 저장 (3-Section 구조: highlights + categorized + source_articles)"""
    db = get_firestore_client()
    today = datetime.now().strftime("%Y-%m-%d")

    def _flatten_list(articles: list[dict]) -> list[dict]:
        return [
            {
                "article_id": _article_id(a.get("link", "")),
                "title": a.get("title", ""),
                "display_title": a.get("display_title", "") or a.get("title", ""),
                "summary": a.get("summary", "") or a.get("description", "")[:300],
                "one_line": a.get("one_line", ""),
                "key_points": a.get("key_points", []),
                "why_important": a.get("why_important", ""),
                "display_title_en": a.get("display_title_en", ""),
                "one_line_en": a.get("one_line_en", ""),
                "key_points_en": a.get("key_points_en", []),
                "why_important_en": a.get("why_important_en", ""),
                "link": a.get("link", ""),
                "published": a.get("published", ""),
                "source": a.get("source", ""),
                "source_key": a.get("source_key", ""),
                "image_url": a.get("image_url", ""),
                "score": a.get("_total_score", 0),
                "rank": a.get("_rank", 0),
                "category": a.get("_llm_category", ""),
                "background": a.get("background", ""),
                "background_en": a.get("background_en", ""),
                "tags": a.get("tags", []),
                "glossary": a.get("glossary", []),
                "glossary_en": a.get("glossary_en", []),
                "ai_filtered": bool(a.get("_ai_filtered", False)),
                "dedup_of": a.get("_dedup_of", ""),
            }
            for a in articles
        ]

    highlights = _flatten_list(result.get("highlights", []))
    categorized_articles = {
        cat: _flatten_list(articles)
        for cat, articles in result.get("categorized_articles", {}).items()
    }
    source_articles = {
        src: _flatten_list(articles)
        for src, articles in result.get("source_articles", {}).items()
    }

    # AI 필터 제외/중복 기사 — 경량 저장 (확장 뷰에서만 사용)
    def _flatten_light(articles: list[dict]) -> list[dict]:
        return [
            {
                "title": a.get("title", ""),
                "display_title": a.get("display_title", "") or a.get("title", ""),
                "one_line": a.get("one_line", ""),
                "display_title_en": a.get("display_title_en", ""),
                "one_line_en": a.get("one_line_en", ""),
                "link": a.get("link", ""),
                "published": a.get("published", ""),
                "source": a.get("source", ""),
                "source_key": a.get("source_key", ""),
                "image_url": a.get("image_url", ""),
                "score": a.get("_total_score", 0),
                "rank": a.get("_rank", 0),
                "category": a.get("_llm_category", ""),
                "dedup_of": a.get("_dedup_of", ""),
            }
            for a in articles
        ]

    filtered_articles = _flatten_light(result.get("filtered_articles", []))
    deduped_articles = {
        cat: _flatten_light(articles)
        for cat, articles in result.get("deduped_articles", {}).items()
    }

    doc_ref = db.collection("daily_news").document(today)

    # ─── 기존 문서와 병합 (오전+오후 수집 결과 보존) ───
    try:
        existing_doc = doc_ref.get()
    except Exception:
        existing_doc = None

    if existing_doc and existing_doc.exists:
        old = existing_doc.to_dict()
        print("  [병합] 기존 문서 발견 — 오전+오후 병합 수행")

        # highlights: 병합 → 카테고리별 최고 점수 1개씩
        merged_hl = _merge_articles(old.get("highlights", []), highlights)
        hl_by_cat: dict[str, dict] = {}
        for a in merged_hl:
            cat = a.get("category", "")
            prev = hl_by_cat.get(cat)
            if not prev or a.get("score", 0) > prev.get("score", 0):
                hl_by_cat[cat] = a
        highlights = sorted(
            hl_by_cat.values(),
            key=lambda a: (a.get("score", 0), a.get("published", "")),
            reverse=True,
        )

        # categorized_articles: 카테고리별 병합 (크로스-카테고리 중복 제거) → score 내림차순
        old_cat = old.get("categorized_articles", {})
        # 신규 categorized 기사 link 수집 → 기존 모든 카테고리에서 제거
        # (카테고리 변경 시 이전 카테고리의 구 데이터 잔존 방지)
        new_cat_links: set[str] = set()
        for cat_arts in categorized_articles.values():
            for a in cat_arts:
                link = a.get("link", "")
                if link:
                    new_cat_links.add(link)
        cleaned_old_cat = {
            cat: [a for a in arts if a.get("link", "") not in new_cat_links]
            for cat, arts in old_cat.items()
        }
        all_cats = set(list(cleaned_old_cat.keys()) + list(categorized_articles.keys()))
        categorized_articles = {
            cat: sorted(
                _merge_articles(cleaned_old_cat.get(cat, []), categorized_articles.get(cat, [])),
                key=lambda a: a.get("score", 0), reverse=True,
            )
            for cat in all_cats
        }

        # source_articles: 소스별 병합
        old_src = old.get("source_articles", {})
        all_srcs = set(list(old_src.keys()) + list(source_articles.keys()))
        source_articles = {
            src: _merge_articles(old_src.get(src, []), source_articles.get(src, []))
            for src in all_srcs
        }

        # filtered_articles: 병합
        filtered_articles = _merge_articles(old.get("filtered_articles", []), filtered_articles)

        # deduped_articles: 카테고리별 병합 (크로스-카테고리 중복 제거)
        old_dedup = old.get("deduped_articles", {})
        # 신규 dedup 기사의 link 수집 → 기존 모든 카테고리에서 해당 link 제거
        # (카테고리 이동 + score 갱신 보장)
        new_dedup_links: set[str] = set()
        for cat_arts in deduped_articles.values():
            for a in cat_arts:
                link = a.get("link", "")
                if link:
                    new_dedup_links.add(link)
        cleaned_old_dedup = {
            cat: [a for a in arts if a.get("link", "") not in new_dedup_links]
            for cat, arts in old_dedup.items()
        }
        all_dedup_cats = set(list(cleaned_old_dedup.keys()) + list(deduped_articles.keys()))
        deduped_articles = {
            cat: _merge_articles(cleaned_old_dedup.get(cat, []), deduped_articles.get(cat, []))
            for cat in all_dedup_cats
        }
        # 빈 카테고리 제거 + 모든 dedup 기사 score=0 강제 (구 데이터 score=20 잔존 방지)
        deduped_articles = {cat: arts for cat, arts in deduped_articles.items() if arts}
        for arts in deduped_articles.values():
            for a in arts:
                a["score"] = 0

    # category_order, source_order: 합집합(순서 유지)
    def _union_order(existing_order: list, new_order: list) -> list:
        seen = set()
        merged = []
        for item in new_order + existing_order:
            if item not in seen:
                seen.add(item)
                merged.append(item)
        return merged

    category_order = result.get("category_order", [])
    source_order = result.get("source_order", [])
    if existing_doc and existing_doc.exists:
        old = existing_doc.to_dict()
        category_order = _union_order(old.get("category_order", []), category_order)
        source_order = _union_order(old.get("source_order", []), source_order)

    # total_count 재계산
    total_count = sum(len(v) for v in categorized_articles.values())

    doc_data = {
        "date": today,
        "highlights": highlights,
        "categorized_articles": categorized_articles,
        "category_order": category_order,
        "source_articles": source_articles,
        "source_order": source_order,
        "filtered_articles": filtered_articles,
        "deduped_articles": deduped_articles,
        "total_count": total_count,
        "updated_at": firestore.SERVER_TIMESTAMP,
    }
    try:
        doc_ref.set(doc_data)
    except Exception as e:
        print(f"  [RETRY] Firestore 저장 실패: {e}, 5초 후 재시도...")
        time.sleep(5)
        doc_ref.set(doc_data)

    cat_count = sum(len(v) for v in categorized_articles.values())
    src_count = sum(len(v) for v in source_articles.values())
    print(f"  뉴스 저장 완료: 하이라이트 {len(highlights)}개 + 카테고리 {cat_count}개 + 소스별 {src_count}개")


def cleanup_old_data(keep_days: int = 30):
    """30일보다 오래된 데이터를 Firestore에서 삭제"""
    db = get_firestore_client()
    cutoff_date = (datetime.now() - timedelta(days=keep_days)).strftime("%Y-%m-%d")

    collections = ["daily_news", "daily_principles"]
    total_deleted = 0

    for col_name in collections:
        col_ref = db.collection(col_name)
        from google.cloud.firestore_v1.base_query import FieldFilter
        old_docs = col_ref.where(filter=FieldFilter("date", "<", cutoff_date)).stream()

        deleted = 0
        for doc in old_docs:
            doc.reference.delete()
            deleted += 1

        if deleted > 0:
            print(f"  {col_name}: {deleted}개 문서 삭제 (기준: {cutoff_date} 이전)")
        total_deleted += deleted

    if total_deleted == 0:
        print(f"  정리할 데이터 없음 (최근 {keep_days}일 이내만 존재)")
    else:
        print(f"  총 {total_deleted}개 문서 정리 완료")


def run_news():
    """뉴스 파이프라인만 실행"""
    print("\n" + "-" * 40)
    print("뉴스 파이프라인")
    print("-" * 40)
    start = time.time()
    news_result = run_news_pipeline()
    elapsed = time.time() - start
    print(f"\n  파이프라인 소요: {elapsed:.1f}초")

    warnings = _validate_output(news_result)
    if warnings:
        print("\n  [검증 경고]")
        for w in warnings:
            print(f"    - {w}")

    save_news_to_firestore(news_result)

    # ─── AI 기능 파이프라인 (6개) ───
    print("\n  [AI 기능] 시작...")
    try:
        save_articles_collection(news_result)
    except Exception as e:
        print(f"  [articles 저장 실패] {e}")
    try:
        find_related_articles(news_result)
    except Exception as e:
        print(f"  [관련기사 실패] {e}")
    try:
        generate_daily_briefing(news_result)
    except Exception as e:
        print(f"  [브리핑 실패] {e}")
    try:
        generate_daily_quiz(news_result)
    except Exception as e:
        print(f"  [퀴즈 실패] {e}")
    try:
        accumulate_glossary(news_result)
    except Exception as e:
        print(f"  [용어사전 실패] {e}")
    try:
        build_timeline(news_result)
    except Exception as e:
        print(f"  [타임라인 실패] {e}")
    print("  [AI 기능] 완료")

    try:
        send_news_notification(article_count=news_result.get("total_count", 0))
    except Exception as e:
        print(f"  [알림 실패] {e} — 파이프라인은 계속 진행")

    return news_result


def run_principle(force: bool = False):
    """원리 파이프라인만 실행. force=True면 기존 콘텐츠 덮어쓰기."""
    print("\n" + "-" * 40)
    print("학제간 원리 파이프라인")
    print("-" * 40)

    today = datetime.now().strftime("%Y-%m-%d")
    if not force:
        try:
            db = get_firestore_client()
            existing = db.collection("daily_principles").document(today).get()
            if existing.exists:
                print(f"  [스킵] 오늘({today}) 원리 콘텐츠가 이미 존재합니다. (--force로 덮어쓰기 가능)")
                return None
        except Exception:
            pass

    start = time.time()
    result = run_principle_pipeline()
    elapsed = time.time() - start
    print(f"\n  파이프라인 소요: {elapsed:.1f}초")

    if result:
        discipline = result.get("discipline_info", {}).get("name", "?")
        focus = result.get("discipline_info", {}).get("focus", "?")
        print(f"  원리 생성 완료: {discipline} — {focus}")
    else:
        print("  [경고] 원리 파이프라인 결과 없음")

    return result


def main():
    """일일 콘텐츠 파이프라인

    사용법:
      python generate_daily.py          # 전체 (뉴스 + 원리 + 정리)
      python generate_daily.py news     # 뉴스만
      python generate_daily.py principle # 원리만 (하루 1회)
      python generate_daily.py principle --force  # 원리 강제 재생성
    """
    parser = argparse.ArgumentParser(description="Ailon 일일 콘텐츠 파이프라인")
    parser.add_argument("target", nargs="?", default="all", choices=["all", "news", "principle"],
                        help="실행 대상: all(전체), news(뉴스만), principle(원리만)")
    parser.add_argument("--force", action="store_true",
                        help="원리 파이프라인: 오늘 콘텐츠가 있어도 강제 재생성")
    args = parser.parse_args()

    print("=" * 60)
    print(f"Ailon Daily Pipeline — target: {args.target}")
    print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    initialize_firebase()

    news_result = None
    principle_result = None

    if args.target in ("all", "news"):
        news_result = run_news()

    if args.target in ("all", "principle"):
        try:
            principle_result = run_principle(force=args.force)
        except Exception as e:
            print(f"  [원리 파이프라인 실패] {e}")

    # ─── 오래된 데이터 정리 ───
    print("\n" + "-" * 40)
    print("데이터 정리")
    print("-" * 40)
    cleanup_old_data(keep_days=30)

    # ─── 완료 ───
    print("\n" + "=" * 60)
    parts = []
    if news_result:
        parts.append(f"뉴스 {news_result.get('total_count', 0)}개")
    if principle_result:
        parts.append("원리 생성 완료")
    print(f"완료! {' / '.join(parts) if parts else args.target + ' 완료'}")
    print("=" * 60)


if __name__ == "__main__":
    main()
