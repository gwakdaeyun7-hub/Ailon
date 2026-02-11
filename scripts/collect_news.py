"""
AI 뉴스 수집 및 요약 스크립트
LangGraph 기반 에이전트 팀이 협력하여 뉴스를 수집, 분석, 큐레이션, 요약합니다.
매일 GitHub Actions에서 실행됩니다.
"""

import sys
import os
from datetime import datetime
from firebase_admin import firestore

# scripts 디렉토리를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.config import initialize_firebase, get_firestore_client
from agents.news_team import run_news_team


def save_to_firestore(result: dict):
    """에이전트 팀 결과를 Firestore에 저장"""
    print("\n💾 Saving to Firestore...")

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
    print(f"✓ Saved {len(result['final_articles'])} articles for {today}")


def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("🚀 AI News Collection - Agent Team Pipeline")
    print("=" * 60)

    # Firebase 초기화
    initialize_firebase()

    # 뉴스 에이전트 팀 실행
    result = run_news_team()

    if not result["final_articles"]:
        print("\n⚠ No articles collected. Exiting.")
        return

    # Firestore 저장
    save_to_firestore(result)

    print("\n" + "=" * 60)
    print("✅ News collection completed successfully!")
    print(f"   수집: {len(result.get('raw_articles', []))}개 → "
          f"분석: {len(result.get('analyzed_articles', []))}개 → "
          f"최종: {len(result['final_articles'])}개")
    print("=" * 60)


if __name__ == "__main__":
    main()
