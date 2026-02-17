"""
기능3 Synergy Lab 테스트 스크립트 (간소화 버전)

기능1 뉴스와 기능2 원리를 직접 주입하여 빠르게 테스트합니다.
"""

import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.idea_graph_v2 import run_idea_graph

# 테스트 데이터
SAMPLE_NEWS = [
    {
        "title": "[arXiv] Large Language Models Struggle with Long-Term Memory Management",
        "description": "연구진은 GPT-4와 Claude가 긴 대화에서 이전 맥락을 잊어버리는 문제를 발견했습니다. 토큰 제한과 주의 메커니즘의 한계로 인해 장기 기억 유지가 어렵습니다.",
        "link": "https://arxiv.org/example1",
        "published": datetime.now().isoformat(),
        "source": "arXiv",
        "source_type": "arxiv",
        "importance_score": 92,
        "social_score": 150,
    },
    {
        "title": "[GitHub] Hyperparameter Tuning Takes 72 Hours for GPT-5 Training",
        "description": "OpenAI 엔지니어들이 하이퍼파라미터 튜닝에만 72시간이 걸린다고 보고했습니다. Grid Search와 Random Search는 비효율적이며 비용이 너무 높습니다.",
        "link": "https://github.com/example",
        "published": datetime.now().isoformat(),
        "source": "GitHub",
        "source_type": "github",
        "importance_score": 88,
        "social_score": 500,
    },
    {
        "title": "[VentureBeat] AI Recommendation Systems Still Suffer from Cold Start Problem",
        "description": "신규 사용자나 아이템에 대한 추천이 여전히 어렵습니다. 데이터가 부족한 초기 단계에서 정확한 추천을 제공하지 못합니다.",
        "link": "https://venturebeat.com/example",
        "published": datetime.now().isoformat(),
        "source": "VentureBeat AI",
        "source_type": "venturebeat",
        "importance_score": 75,
        "social_score": 80,
    },
    {
        "title": "[Reddit] Stable Diffusion Training OOM Errors - How to Optimize?",
        "description": "GPU 메모리 부족으로 Stable Diffusion 파인튜닝이 실패합니다. 배치 크기를 줄이면 학습이 불안정해집니다.",
        "link": "https://reddit.com/example",
        "published": datetime.now().isoformat(),
        "source": "Reddit r/MachineLearning",
        "source_type": "reddit",
        "importance_score": 65,
        "social_score": 45,
    },
    {
        "title": "[TechCrunch] AI Agents Struggle with Multi-Step Reasoning",
        "description": "복잡한 다단계 추론이 필요한 작업에서 AI 에이전트가 중간에 실패하는 경우가 많습니다. 단계별 검증 메커니즘이 부족합니다.",
        "link": "https://techcrunch.com/example",
        "published": datetime.now().isoformat(),
        "source": "TechCrunch AI",
        "source_type": "techcrunch",
        "importance_score": 82,
        "social_score": 120,
    },
]

SAMPLE_PRINCIPLE = {
    "title": "시뮬레이티드 어닐링: 물리학이 최적화 문제를 푸는 법",
    "category": "최적화 이론",
    "superCategory": "물리학",
    "foundation": {
        "principle": "금속의 어닐링(annealing) 과정",
        "keyIdea": "금속을 천천히 냉각하면 원자들이 에너지 최소 상태로 정렬되어 결정 구조가 안정화됩니다.",
        "everydayAnalogy": "뜨거운 물에 설탕을 녹인 후 천천히 식히면 큰 결정이 생기는 것과 같아요. 빠르게 식히면 작고 불규칙한 결정이 생깁니다.",
    },
    "application": {
        "applicationField": "조합 최적화",
        "description": "시뮬레이티드 어닐링은 복잡한 최적화 문제를 푸는 확률적 알고리즘이에요.",
        "mechanism": "초기에는 큰 변화를 허용하다가(높은 온도) 점차 작은 변화만 수용하면서(온도 하강) 최적해를 탐색합니다.",
        "bridgeRole": "물리 법칙을 수학적 알고리즘으로 변환",
        "technicalTerms": "에너지 함수, 온도 파라미터, 수용 확률, 메트로폴리스 기준",
    },
    "integration": {
        "problemSolved": "외판원 문제(TSP)와 같은 NP-hard 문제를 현실적 시간 내에 해결",
        "solution": "전역 최적해 근처까지 도달하면서도 지역 최적해에 갇히지 않음",
        "realWorldExamples": [
            "VLSI 회로 설계 최적화",
            "물류 배송 경로 최적화",
            "단백질 접힘 구조 예측",
        ],
        "impactField": "컴퓨터 과학, 운영 연구",
        "whyItWorks": "초기 높은 온도에서는 나쁜 해도 확률적으로 수용하여 지역 최적해 탈출이 가능하고, 온도가 낮아지면서 점차 안정화됩니다.",
    },
    "learn_more_links": [
        {"title": "Wikipedia - Simulated Annealing", "url": "https://en.wikipedia.org/wiki/Simulated_annealing"},
    ],
}

SAMPLE_DISCIPLINE = {
    "key": "physics",
    "name": "물리학",
    "superCategory": "기초과학",
    "color": "#3B82F6",
    "icon": "⚛️",
}


def main():
    """기능3 간단 테스트"""
    print("=" * 70)
    print("🧪 기능3 Synergy Lab 테스트")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    print("\n📋 테스트 데이터:")
    print(f"  📰 뉴스: {len(SAMPLE_NEWS)}개")
    print(f"  📚 원리: {SAMPLE_PRINCIPLE['title']}")
    print(f"  🔬 학문: {SAMPLE_DISCIPLINE['name']}")
    
    print("\n" + "─" * 70)
    print("🚀 기능3 파이프라인 시작...")
    print("─" * 70)
    
    # 기능3 실행
    result = run_idea_graph(
        news_articles=SAMPLE_NEWS,
        today_principle=SAMPLE_PRINCIPLE,
        discipline_info=SAMPLE_DISCIPLINE,
    )
    
    # 결과 출력
    print("\n" + "=" * 70)
    print("✅ 기능3 파이프라인 완료!")
    print("=" * 70)
    
    print("\n📊 결과 요약:")
    print(f"  🔍 핵심 메커니즘: {result['core_mechanism'].get('coreMechanism', 'N/A')}")
    print(f"  🎯 발견된 문제: {len(result['matched_problems'])}개")
    print(f"  💡 생성된 아이디어: {len(result['raw_ideas'])}개")
    print(f"  ⭐ 최종 선정: {len(result['final_ideas'])}개")
    
    print("\n" + "─" * 70)
    print("🎯 발견된 AI 문제:")
    print("─" * 70)
    for i, problem in enumerate(result["matched_problems"], 1):
        print(f"\n{i}. {problem.get('title', 'N/A')}")
        print(f"   출처: {problem.get('source', 'N/A')}")
        print(f"   연관도: {problem.get('relevanceScore', 0):.2f}")
        print(f"   이유: {problem.get('relevanceReason', 'N/A')}")
    
    print("\n" + "─" * 70)
    print("💡 생성된 융합 아이디어:")
    print("─" * 70)
    for i, idea in enumerate(result["final_ideas"], 1):
        print(f"\n{'=' * 70}")
        print(f"아이디어 {i}: {idea.get('concept_name', 'N/A')}")
        print(f"{'=' * 70}")
        print(f"📌 해결 문제: {idea.get('problem_addressed', 'N/A')}")
        print(f"🔬 적용 원리: {idea.get('principle_applied', 'N/A')}")
        print(f"\n📝 설명:")
        print(f"   {idea.get('description', 'N/A')}")
        print(f"\n📖 스토리:")
        print(f"   {idea.get('narrative', 'N/A')}")
        print(f"\n💎 핵심 혁신:")
        print(f"   {idea.get('key_innovation', 'N/A')}")
        print(f"\n👥 대상 사용자:")
        print(f"   {idea.get('target_users', 'N/A')}")
        print(f"\n📊 평가 점수:")
        print(f"   실현가능성: {idea.get('feasibility_score', 0)}/10")
        print(f"   참신성: {idea.get('novelty_score', 0)}/10")
        print(f"   임팩트: {idea.get('impact_score', 0)}/10")
        print(f"   총점: {idea.get('total_score', 0)}/30")
        
        roadmap = idea.get("technical_roadmap", {})
        if roadmap.get("phases"):
            print(f"\n🗺️  기술 로드맵 ({roadmap.get('totalDuration', 'N/A')}):")
            for phase in roadmap["phases"][:3]:  # 최대 3개만 표시
                print(f"   Phase {phase.get('phase', '?')}: {phase.get('title', 'N/A')} ({phase.get('duration', 'N/A')})")
        
        market = idea.get("market_feasibility", {})
        if market.get("tam"):
            print(f"\n💼 시장성:")
            print(f"   TAM: {market.get('tam', 'N/A')}")
            print(f"   경쟁사: {', '.join(market.get('competitors', [])[:3])}")
            print(f"   차별화: {market.get('differentiation', 'N/A')}")
        
        verification = idea.get("verification", {})
        if verification.get("verified"):
            print(f"\n🔍 검증 결과:")
            print(f"   신뢰도: {verification.get('confidence', 0)*100:.0f}%")
            print(f"   평가: {verification.get('noveltyCheck', 'N/A')}")
            if verification.get("priorArt"):
                print(f"   선행 사례: {len(verification['priorArt'])}건 발견")
    
    print("\n" + "=" * 70)
    print("🎉 테스트 완료!")
    print("=" * 70)


if __name__ == "__main__":
    main()
