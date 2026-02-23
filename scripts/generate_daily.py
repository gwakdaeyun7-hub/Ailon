# -*- coding: utf-8 -*-
"""
일일 뉴스 파이프라인
뉴스 에이전트 팀 → daily_news 컬렉션

매일 GitHub Actions에서 실행됩니다.
"""

import sys
import os
import time
from datetime import datetime, timedelta
from firebase_admin import firestore

# scripts 디렉토리를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.config import initialize_firebase, get_firestore_client
from agents.news_team import run_news_pipeline


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

    for cat in ["model_research", "product_tools", "industry_business"]:
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


def save_news_to_firestore(result: dict):
    """뉴스 결과를 Firestore에 저장 (3-Section 구조: highlights + categorized + source_articles)"""
    db = get_firestore_client()
    today = datetime.now().strftime("%Y-%m-%d")

    def _flatten_list(articles: list[dict]) -> list[dict]:
        return [
            {
                "title": a.get("title", ""),
                "display_title": a.get("display_title", "") or a.get("title", ""),
                "description": a.get("description", ""),
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

    doc_ref = db.collection("daily_news").document(today)
    doc_data = {
        "date": today,
        "highlights": highlights,
        "categorized_articles": categorized_articles,
        "category_order": result.get("category_order", []),
        "source_articles": source_articles,
        "source_order": result.get("source_order", []),
        "total_count": result.get("total_count", 0),
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

    collections = ["daily_news"]
    total_deleted = 0

    for col_name in collections:
        col_ref = db.collection(col_name)
        old_docs = col_ref.where("date", "<", cutoff_date).stream()

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


def main():
    """일일 뉴스 파이프라인 실행"""
    print("=" * 60)
    print("AI News Pipeline")
    print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    initialize_firebase()

    # ─── 뉴스 수집 + 번역/요약 + 스코어링 + 분류 ───
    print("\n" + "-" * 40)
    print("Step 1: 뉴스 파이프라인")
    print("-" * 40)
    start = time.time()
    news_result = run_news_pipeline()
    elapsed = time.time() - start
    print(f"\n  파이프라인 소요: {elapsed:.1f}초")

    # ─── 저장 전 검증 ───
    warnings = _validate_output(news_result)
    if warnings:
        print("\n  [검증 경고]")
        for w in warnings:
            print(f"    - {w}")

    save_news_to_firestore(news_result)

    # ─── 오래된 데이터 정리 ───
    print("\n" + "-" * 40)
    print("Step 2: 데이터 정리")
    print("-" * 40)
    cleanup_old_data(keep_days=30)

    # ─── 완료 ───
    print("\n" + "=" * 60)
    print(f"완료! 뉴스 {news_result.get('total_count', 0)}개 수집")
    print("=" * 60)


if __name__ == "__main__":
    main()
