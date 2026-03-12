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
from datetime import datetime, timedelta, timezone
from firebase_admin import firestore

# scripts 디렉토리를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.config import initialize_firebase, get_firestore_client
from agents.news_team import run_news_pipeline
from agents.principle_team import run_principle_pipeline
from agents.ci_utils import (
    ci_warning, ci_error,
    get_collected_warnings, get_collected_errors,
    reset_collected, write_job_summary,
)
from notifications import send_news_notification
from generate_features import (
    _article_id,
    save_articles_collection, find_related_articles,
    generate_daily_briefing, generate_daily_tools,
    accumulate_glossary, build_timeline,
    patch_daily_news_ids,
)

_KST = timezone(timedelta(hours=9))


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
    """link 기준 병합. 중복 시 신규(최신 수집) 우선. link 없으면 title 폴백."""
    seen = {}
    for a in new:
        link = a.get("link", "")
        key = link if link else a.get("title", "")
        if not key:
            continue
        seen[key] = a
    for a in existing:
        link = a.get("link", "")
        key = link if link else a.get("title", "")
        if not key:
            continue
        if key not in seen:
            seen[key] = a
    return list(seen.values())


def save_news_to_firestore(result: dict):
    """뉴스 결과를 Firestore에 저장 (3-Section 구조: highlights + categorized + source_articles)"""
    db = get_firestore_client()
    today = datetime.now(_KST).strftime("%Y-%m-%d")

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
                "tags_en": a.get("tags_en", []),
                "glossary": a.get("glossary", []),
                "glossary_en": a.get("glossary_en", []),
                "related_ids": a.get("related_ids", []),
                "timeline_ids": a.get("timeline_ids", []),
                "timeline_count": len(a.get("timeline_ids", [])),
                "date_estimated": bool(a.get("date_estimated", False)),
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

    # 필터/중복 기사는 더 이상 분리하지 않음 — 빈 값으로 기존 데이터 덮어쓰기
    filtered_articles: list[dict] = []
    deduped_articles: dict[str, list[dict]] = {}

    doc_ref = db.collection("daily_news").document(today)

    # ─── 기존 문서와 병합 (오전+오후 수집 결과 보존) ───
    try:
        existing_doc = doc_ref.get()
    except Exception as e:
        ci_warning(f"기존 문서 조회 실패 (신규로 저장): {type(e).__name__}: {e}")
        existing_doc = None

    if existing_doc and existing_doc.exists:
        old = existing_doc.to_dict()
        print("  [병합] 기존 문서 발견 — 오전+오후 병합 수행")

        # highlights: 최신 실행 결과 사용 (병합 안 함 — GitHub Actions 로그와 모바일 일치)
        # 기존 하이라이트 중 신규에 없는 기사 → 카테고리로 복원 예정
        new_hl_links = {a.get("link", "") for a in highlights if a.get("link")}

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

        # 기존 하이라이트 중 신규 하이라이트/카테고리에 없는 기사 → 카테고리로 복원
        existing_cat_links = set()
        for arts in categorized_articles.values():
            for a in arts:
                if a.get("link"):
                    existing_cat_links.add(a["link"])
        for a in old.get("highlights", []):
            link = a.get("link", "")
            if link and link not in new_hl_links and link not in existing_cat_links:
                cat = a.get("category", "industry_business")
                if cat not in categorized_articles:
                    categorized_articles[cat] = []
                categorized_articles[cat].append(a)

        # 하이라이트 제거 + 카테고리별 Top 25 제한 (병합 후 초과 방지 — 로그와 모바일 일치)
        hl_links = {a.get("link", "") for a in highlights if a.get("link")}
        categorized_articles = {
            cat: sorted(
                [a for a in arts if a.get("link", "") not in hl_links],
                key=lambda a: a.get("score", 0), reverse=True,
            )[:25]
            for cat, arts in categorized_articles.items()
        }

        # source_articles: 소스별 병합
        old_src = old.get("source_articles", {})
        all_srcs = set(list(old_src.keys()) + list(source_articles.keys()))
        source_articles = {
            src: _merge_articles(old_src.get(src, []), source_articles.get(src, []))
            for src in all_srcs
        }

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
            ci_warning(f"검증: {w}")

    save_news_to_firestore(news_result)

    # ─── AI 기능 파이프라인 (6개) ───
    print("\n  [AI 기능] 시작...")
    try:
        save_articles_collection(news_result)
    except Exception as e:
        ci_error(f"articles 저장 실패: {e}")
    try:
        find_related_articles(news_result)
    except Exception as e:
        ci_error(f"관련기사 실패: {e}")
    briefing_data = None
    try:
        briefing_data = generate_daily_briefing(news_result)
    except Exception as e:
        ci_error(f"브리핑 실패: {e}")
    try:
        generate_daily_tools(news_result)
    except Exception as e:
        ci_error(f"도구 추천 실패: {e}")
    glossary_count = 0
    try:
        glossary_count = accumulate_glossary(news_result) or 0
    except Exception as e:
        ci_error(f"용어사전 실패: {e}")
    try:
        build_timeline(news_result)
    except Exception as e:
        ci_error(f"타임라인 실패: {e}")
    try:
        patch_daily_news_ids(news_result)
    except Exception as e:
        ci_warning(f"daily_news 패치 실패: {e}")
    print("  [AI 기능] 완료")

    try:
        send_news_notification(
            article_count=news_result.get("total_count", 0),
            news_result=news_result,
        )
    except Exception as e:
        print(f"  [알림 실패] {e} — 파이프라인은 계속 진행")

    return news_result, briefing_data, glossary_count


def run_principle(force: bool = False):
    """원리 파이프라인만 실행. force=True면 기존 콘텐츠 덮어쓰기."""
    print("\n" + "-" * 40)
    print("학제간 원리 파이프라인")
    print("-" * 40)

    today = datetime.now(_KST).strftime("%Y-%m-%d")
    if not force:
        try:
            db = get_firestore_client()
            existing = db.collection("daily_principles").document(today).get()
            if existing.exists:
                print(f"  [스킵] 오늘({today}) 원리 콘텐츠가 이미 존재합니다. (--force로 덮어쓰기 가능)")
                return None
        except Exception as e:
            ci_warning(f"기존 원리 콘텐츠 확인 실패 (새로 생성 진행): {type(e).__name__}: {e}")

    start = time.time()
    result = run_principle_pipeline()
    elapsed = time.time() - start
    print(f"\n  파이프라인 소요: {elapsed:.1f}초")

    if result:
        disc_info = result.get("discipline_info", {})
        principle_info = result.get("principle", {})
        discipline = disc_info.get("name", "?")
        focus = disc_info.get("focus", "?")
        print(f"\n  ── Principle 파이프라인 결과 요약 ──")
        print(f"    학문 분야:     {discipline}")
        print(f"    원리:          {focus}")
        print(f"    AI 연결:       {disc_info.get('ai_connection', '?')[:60]}")
        print(f"    superCategory: {disc_info.get('superCategory', '?')}")
        print(f"    title:         {principle_info.get('title', '?')[:70]}")
        print(f"    difficulty:    {principle_info.get('difficulty', '?')}")
        print(f"    connectionType:{principle_info.get('connectionType', '?')}")
        v = principle_info.get("verification", {})
        print(f"    검증:          confidence={v.get('confidence', '?')}, verified={v.get('verified', '?')}")
        print(f"    날짜:          {result.get('date', '?')}")
    else:
        ci_warning("원리 파이프라인 결과 없음 — LLM 호출 실패 또는 시드 선택 오류 가능성")

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
    print(f"{datetime.now(_KST).strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    reset_collected()
    pipeline_start = time.time()
    initialize_firebase()

    news_result = None
    briefing_data = None
    glossary_count = 0
    principle_result = None

    if args.target in ("all", "news"):
        news_result, briefing_data, glossary_count = run_news()

    if args.target in ("all", "principle"):
        try:
            principle_result = run_principle(force=args.force)
        except Exception as e:
            ci_error(f"원리 파이프라인 실패: {e}")

    # ─── 오래된 데이터 정리 ───
    print("\n" + "-" * 40)

    # ─── 완료 ───
    total_elapsed = time.time() - pipeline_start
    print("\n" + "=" * 60)
    parts = []
    if news_result:
        parts.append(f"뉴스 {news_result.get('total_count', 0)}개")
    if principle_result:
        parts.append("원리 생성 완료")
    print(f"완료! {' / '.join(parts) if parts else args.target + ' 완료'}")
    print("=" * 60)

    # ─── Job Summary 작성 ───
    _write_job_summary(
        args.target, news_result, principle_result,
        total_elapsed, briefing_data, glossary_count,
    )


def _write_job_summary(
    target: str,
    news_result: dict | None,
    principle_result: dict | None,
    total_elapsed: float,
    briefing_data: dict | None = None,
    glossary_count: int = 0,
):
    """$GITHUB_STEP_SUMMARY에 마크다운 요약 작성."""
    today = datetime.now(_KST).strftime("%Y-%m-%d")
    minutes = int(total_elapsed // 60)
    seconds = int(total_elapsed % 60)

    lines = [f"## Ailon Daily Pipeline — {today}", ""]

    # 뉴스 섹션
    if news_result:
        cat = news_result.get("categorized_articles", {})
        cat_detail = " / ".join(
            f"{k} {len(v)}" for k, v in sorted(cat.items())
        )
        src_count = sum(len(v) for v in news_result.get("source_articles", {}).values())
        lines.extend([
            "### 뉴스",
            "| 항목 | 결과 |",
            "|------|------|",
            f"| 하이라이트 | {len(news_result.get('highlights', []))}/3 |",
            f"| 카테고리 | {cat_detail} |",
            f"| 소스 섹션 | {src_count}개 |",
            f"| 총 기사 | {news_result.get('total_count', 0)}개 |",
            f"| 용어 사전 | {glossary_count}개 축적 |",
            "",
        ])

    # 브리핑 섹션
    if briefing_data:
        briefing_ko = briefing_data.get("briefing_ko", "")
        story_count = briefing_data.get("story_count", 0)
        # 브리핑 텍스트 첫 200자 미리보기
        preview = briefing_ko[:200].replace("\n", " ")
        if len(briefing_ko) > 200:
            preview += "…"
        lines.extend([
            "### 브리핑",
            "| 항목 | 결과 |",
            "|------|------|",
            f"| 스토리 수 | {story_count}개 |",
            f"| KO 길이 | {len(briefing_ko)}자 |",
            f"| EN 길이 | {len(briefing_data.get('briefing_en', ''))}자 |",
            "",
            "<details><summary>브리핑 미리보기</summary>",
            "",
            f"{preview}",
            "",
            "</details>",
            "",
        ])

    # 원리 섹션
    if principle_result:
        disc = principle_result.get("discipline_info", {})
        principle = principle_result.get("principle", {})
        v = principle.get("verification", {})
        confidence = v.get("confidence", "?")
        verified = v.get("verified", "?")
        check = "✓" if verified else "✗"
        lines.extend([
            "### 원리",
            "| 항목 | 결과 |",
            "|------|------|",
            f"| 분야 | {disc.get('name', '?')} |",
            f"| 원리 | {disc.get('focus', '?')} |",
            f"| 검증 | confidence={confidence} {check} |",
            "",
        ])

    # 소요 시간
    lines.append(f"**소요 시간**: {minutes}분 {seconds}초")
    lines.append("")

    # 경고/에러 섹션
    warnings = get_collected_warnings()
    errors = get_collected_errors()
    if warnings or errors:
        lines.append("### 경고/에러")
        for e in errors:
            lines.append(f"- ❌ {e}")
        for w in warnings:
            lines.append(f"- ⚠ {w}")
        lines.append("")

    write_job_summary("\n".join(lines))


if __name__ == "__main__":
    main()
