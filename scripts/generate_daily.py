"""
일일 전체 파이프라인 - 3개 에이전트 팀 순차 실행
1. 뉴스 에이전트 팀 → daily_news 컬렉션
2. 학문 원리 에이전트 팀 → daily_principles 컬렉션
3. 융합 아이디어 에이전트 팀 → daily_ideas + synergy_ideas 컬렉션

매일 GitHub Actions에서 실행됩니다.
"""

import sys
import os
from datetime import datetime, timedelta
from firebase_admin import firestore

# scripts 디렉토리를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.config import (
    initialize_firebase,
    get_firestore_client,
    get_today_discipline_key,
    get_discipline_info,
)
from agents.news_team import run_news_team
from agents.knowledge_team import run_knowledge_team
from agents.idea_team import run_idea_team


def save_news_to_firestore(result: dict):
    """뉴스 결과를 Firestore에 저장

    Saved fields per article:
        title, description, link, published, source, source_type,
        summary, category, category_name, type, howToGuide,
        importance_score, social_score, theme
    Top-level fields:
        date, articles, count, daily_overview, highlight,
        themes, categories, agent_metadata, updated_at
    """
    db = get_firestore_client()
    today = datetime.now().strftime("%Y-%m-%d")

    doc_ref = db.collection("daily_news").document(today)
    doc_data = {
        "date": today,
        "articles": result["final_articles"],
        "count": len(result["final_articles"]),
        "daily_overview": result.get("daily_overview", ""),
        "highlight": result.get("highlight", {}),
        "themes": result.get("themes", []),
        "categories": result.get("categories", {}),
        "agent_metadata": {
            "collected_count": len(result.get("raw_articles", [])),
            "analyzed_count": len(result.get("analyzed_articles", [])),
            "curated_count": len(result.get("curated_articles", [])),
            "final_count": len(result["final_articles"]),
            "run_timestamp": datetime.now().isoformat(),
        },
        "updated_at": firestore.SERVER_TIMESTAMP,
    }
    doc_ref.set(doc_data)
    print(f"  💾 뉴스 {len(result['final_articles'])}개 저장 완료")


def save_principles_to_firestore(result: dict):
    """학문 원리 결과를 Firestore에 저장 (3개 분야 × 1원리)

    Supports both single-discipline (legacy) and multi-discipline (new) results.
    """
    db = get_firestore_client()
    today = datetime.now().strftime("%Y-%m-%d")

    # New multi-discipline format
    all_principles = result.get("all_principles", result.get("final_principles", []))
    for principle in all_principles:
        if "learn_more_links" not in principle:
            principle["learn_more_links"] = []

    today_principle = result.get("today_principle", {})
    if today_principle and "learn_more_links" not in today_principle:
        today_principle["learn_more_links"] = []

    # Build per-discipline summary for storage
    disciplines_results = result.get("disciplines_results", [])
    disciplines_summary = []
    for dr in disciplines_results:
        disciplines_summary.append({
            "discipline_key": dr.get("discipline_key", ""),
            "discipline_info": dr.get("discipline_info", {}),
            "principle": dr.get("today_principle", dr.get("final_principles", [{}])[0] if dr.get("final_principles") else {}),
        })

    doc_ref = db.collection("daily_principles").document(today)
    doc_data = {
        "date": today,
        "discipline_key": result.get("discipline_key", disciplines_summary[0]["discipline_key"] if disciplines_summary else ""),
        "discipline_info": result.get("discipline_info", disciplines_summary[0]["discipline_info"] if disciplines_summary else {}),
        "principles": all_principles,
        "disciplines": disciplines_summary,
        "today_principle": today_principle,
        "count": len(all_principles),
        "updated_at": firestore.SERVER_TIMESTAMP,
    }
    doc_ref.set(doc_data)
    print(f"  💾 학문 원리 {len(all_principles)}개 저장 완료 (3개 분야)")


def save_ideas_to_firestore(result: dict, news_result: dict, knowledge_result: dict):
    """융합 아이디어 결과를 Firestore daily_ideas 컬렉션에 저장

    Each idea includes extended fields from the upgraded pipeline:
        concept_name, problem_addressed, description, narrative,
        key_innovation, target_users, implementation_sketch, required_tech,
        feasibility_score, novelty_score, impact_score, total_score,
        challenges, improvements, tags, news_source, principle_source,
        technical_roadmap ({phases, totalDuration, techStack}),
        market_feasibility ({tam, competitors, differentiation,
                             revenueModel, feasibilityScore})
    """
    db = get_firestore_client()
    today = datetime.now().strftime("%Y-%m-%d")

    ideas = result.get("final_ideas", [])

    # Ensure every idea carries technical_roadmap and market_feasibility
    for idea in ideas:
        if "technical_roadmap" not in idea:
            idea["technical_roadmap"] = {
                "phases": [],
                "totalDuration": "",
                "techStack": idea.get("required_tech", []),
            }
        if "market_feasibility" not in idea:
            idea["market_feasibility"] = {
                "tam": "",
                "competitors": [],
                "differentiation": idea.get("key_innovation", ""),
                "revenueModel": "",
                "feasibilityScore": idea.get("feasibility_score", 0),
            }

    doc_ref = db.collection("daily_ideas").document(today)
    doc_data = {
        "date": today,
        "ideas": ideas,
        "count": len(ideas),
        "source_news_count": len(news_result.get("final_articles", [])),
        "source_discipline": knowledge_result.get("discipline_key", ""),
        "source_principle": knowledge_result.get("today_principle", {}).get("title", ""),
        "agent_metadata": {
            "problems_found": len(result.get("problems", [])),
            "ideas_generated": len(result.get("raw_ideas", [])),
            "ideas_evaluated": len(result.get("evaluated_ideas", [])),
            "ideas_final": len(ideas),
            "run_timestamp": datetime.now().isoformat(),
        },
        "updated_at": firestore.SERVER_TIMESTAMP,
    }
    doc_ref.set(doc_data)
    print(f"  💾 융합 아이디어 {len(ideas)}개 저장 완료 (daily_ideas)")


def save_synergy_ideas_to_firestore(result: dict, news_result: dict, knowledge_result: dict):
    """융합 아이디어를 synergy_ideas 컬렉션에 저장

    synergy_ideas는 daily_ideas와 동일한 데이터이지만
    technical_roadmap, market_feasibility를 포함하는 확장 컬렉션으로,
    프론트엔드의 useSynergyIdeas hook이 이 컬렉션을 읽습니다.

    DailySynergyIdeas 타입과 매칭됩니다:
        date, ideas (SynergyIdea[]), count,
        source_news_count, source_discipline, source_principle,
        agent_metadata, updated_at
    """
    db = get_firestore_client()
    today = datetime.now().strftime("%Y-%m-%d")

    ideas = result.get("final_ideas", [])

    # Ensure every idea carries technical_roadmap and market_feasibility
    for idea in ideas:
        if "technical_roadmap" not in idea:
            idea["technical_roadmap"] = {
                "phases": [],
                "totalDuration": "",
                "techStack": idea.get("required_tech", []),
            }
        if "market_feasibility" not in idea:
            idea["market_feasibility"] = {
                "tam": "",
                "competitors": [],
                "differentiation": idea.get("key_innovation", ""),
                "revenueModel": "",
                "feasibilityScore": idea.get("feasibility_score", 0),
            }

    doc_ref = db.collection("synergy_ideas").document(today)
    doc_data = {
        "date": today,
        "ideas": ideas,
        "count": len(ideas),
        "source_news_count": len(news_result.get("final_articles", [])),
        "source_discipline": knowledge_result.get("discipline_key", ""),
        "source_principle": knowledge_result.get("today_principle", {}).get("title", ""),
        "agent_metadata": {
            "problems_found": len(result.get("problems", [])),
            "ideas_generated": len(result.get("raw_ideas", [])),
            "ideas_evaluated": len(result.get("evaluated_ideas", [])),
            "ideas_final": len(ideas),
            "run_timestamp": datetime.now().isoformat(),
        },
        "updated_at": firestore.SERVER_TIMESTAMP,
    }
    doc_ref.set(doc_data)
    print(f"  💾 시너지 아이디어 {len(ideas)}개 저장 완료 (synergy_ideas)")


def cleanup_old_data(keep_days: int = 30):
    """30일보다 오래된 데이터를 Firestore에서 삭제"""
    db = get_firestore_client()
    cutoff_date = (datetime.now() - timedelta(days=keep_days)).strftime("%Y-%m-%d")

    collections = ["daily_news", "daily_principles", "daily_ideas", "synergy_ideas"]
    total_deleted = 0

    for col_name in collections:
        col_ref = db.collection(col_name)
        # date 필드가 cutoff_date보다 이전인 문서 조회
        old_docs = col_ref.where("date", "<", cutoff_date).stream()

        deleted = 0
        for doc in old_docs:
            doc.reference.delete()
            deleted += 1

        if deleted > 0:
            print(f"  🗑 {col_name}: {deleted}개 문서 삭제 (기준: {cutoff_date} 이전)")
        total_deleted += deleted

    if total_deleted == 0:
        print(f"  ✓ 정리할 데이터 없음 (최근 {keep_days}일 이내만 존재)")
    else:
        print(f"  ✓ 총 {total_deleted}개 문서 정리 완료")


def main():
    """전체 일일 파이프라인 실행"""
    print("=" * 60)
    print("🚀 AI Learning Companion - Daily Agent Pipeline")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Firebase 초기화
    initialize_firebase()

    # ─── Step 1: 뉴스 에이전트 팀 ───
    print("\n" + "─" * 40)
    print("📰 Step 1/3: 뉴스 에이전트 팀")
    print("─" * 40)
    news_result = run_news_team()
    save_news_to_firestore(news_result)

    # ─── Step 2: 학문 원리 에이전트 팀 (3개 분야) ───
    print("\n" + "─" * 40)
    print("📚 Step 2/3: 학문 원리 에이전트 팀 (3개 분야)")
    print("─" * 40)
    knowledge_result = run_knowledge_team()
    save_principles_to_firestore(knowledge_result)

    # ─── Step 3: 융합 아이디어 에이전트 팀 (PainPointHunter 포함) ───
    print("\n" + "─" * 40)
    print("💡 Step 3/3: 융합 아이디어 에이전트 팀")
    print("─" * 40)
    idea_result = run_idea_team(
        news_articles=news_result.get("final_articles", []),
        today_principle=knowledge_result.get("today_principle", {}),
        discipline_info=knowledge_result.get("discipline_info", {}),
    )
    save_ideas_to_firestore(idea_result, news_result, knowledge_result)
    save_synergy_ideas_to_firestore(idea_result, news_result, knowledge_result)

    # ─── Step 4: 30일 초과 데이터 정리 ───
    print("\n" + "─" * 40)
    print("🧹 Step 4: 오래된 데이터 정리")
    print("─" * 40)
    cleanup_old_data(keep_days=30)

    # ─── 완료 리포트 ───
    print("\n" + "=" * 60)
    print("✅ Daily Agent Pipeline 완료!")
    print(f"   📰 뉴스: {len(news_result.get('raw_articles', []))}개 수집 → {len(news_result.get('final_articles', []))}개 큐레이션")
    all_principles = knowledge_result.get("all_principles", knowledge_result.get("final_principles", []))
    print(f"   📚 원리: 3개 분야 → {len(all_principles)}개 생성")
    print(f"   💡 아이디어: {len(idea_result.get('problems', []))}개 문제 → {len(idea_result.get('final_ideas', []))}개 융합 아이디어")
    print("=" * 60)


if __name__ == "__main__":
    main()
