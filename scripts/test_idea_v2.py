"""
AI 융합 아이디어 그래프 v2 테스트 스크립트
메커니즘 기반 매칭 파이프라인 테스트
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from agents.idea_graph_v2 import run_idea_graph

def main():
    print("🧪 AI 융합 아이디어 그래프 v2 테스트 (메커니즘 기반 매칭)")
    print("=" * 70)
    
    # 테스트 데이터: 기능 2의 출력 시뮬레이션
    test_principle = {
        "title": "X-선 결정학",
        "category": "physics",
        "superCategory": "기초과학",
        "foundation": {
            "title": "X-선 회절",
            "principle": "X-선을 결정 구조에 쪼이면 규칙적으로 배열된 원자들이 특정 패턴으로 회절돼요",
            "keyIdea": "회절 패턴으로 원자 배치를 알 수 있어요",
        },
        "application": {
            "applicationField": "구조 생물학",
            "mechanism": "생물학적 분자에 X-선 회절 기술을 적용하여 3차원 구조 분석",
            "bridgeRole": "물리학의 측정 기술을 생명과학의 구조 분석 도구로 변환",
        },
        "integration": {
            "title": "DNA 이중나선 구조 발견",
            "problemSolved": "생명 분자의 3차원 구조를 알 수 없었던 문제",
            "solution": "X-선 회절 사진으로 DNA의 이중나선 구조를 밝혀냈어요",
            "targetField": "생물학",
            "whyItWorks": "물리학의 정밀 측정이 생명의 미시 세계를 볼 수 있게 했어요",
        },
    }
    
    test_discipline = {
        "name": "물리학",
        "focus": "X-선 회절",
    }
    
    test_news = [
        {
            "title": "ChatGPT-5 발표 예정",
            "link": "https://example.com",
            "summary": "OpenAI의 차세대 모델 발표",
        }
    ]
    
    print("\n📚 테스트 데이터:")
    print(f"  - 원리: {test_principle['title']}")
    print(f"  - 학문: {test_discipline['name']}")
    print(f"  - 융합 사례: {test_principle['integration']['title']}")
    
    print("\n" + "=" * 70)
    print("🚀 파이프라인 시작...")
    print("=" * 70)
    
    result = run_idea_graph(
        news_articles=test_news,
        today_principle=test_principle,
        discipline_info=test_discipline,
    )
    
    if result.get("final_ideas"):
        print("\n" + "=" * 70)
        print("✅ 결과 요약")
        print("=" * 70)
        
        # 핵심 메커니즘
        cm = result.get("core_mechanism", {})
        print(f"\n🔬 추출된 메커니즘:")
        print(f"  - 핵심: {cm.get('coreMechanism', 'N/A')}")
        print(f"  - 패턴: {cm.get('abstractPattern', 'N/A')[:100]}...")
        print(f"  - 유형: {cm.get('mechanismType', 'N/A')}")
        
        # 매칭된 문제
        problems = result.get("matched_problems", [])
        print(f"\n🎯 매칭된 AI 문제 ({len(problems)}개):")
        for i, p in enumerate(problems, 1):
            print(f"  {i}. {p.get('title', 'N/A')}")
            print(f"     연관도: {p.get('relevanceScore', 0):.2f} | 출처: {p.get('source', 'N/A')}")
        
        # 생성된 아이디어
        ideas = result.get("final_ideas", [])
        print(f"\n💡 생성된 AI 융합 아이디어 ({len(ideas)}개):")
        for i, idea in enumerate(ideas, 1):
            print(f"\n  [{i}] {idea.get('concept_name', 'N/A')}")
            print(f"      문제: {idea.get('problem_addressed', 'N/A')}")
            print(f"      원리 적용: {idea.get('principle_applied', 'N/A')}")
            print(f"      연결: {idea.get('how_it_connects', 'N/A')[:100]}...")
            print(f"      점수: {idea.get('total_score', 0)}/30 "
                  f"(실현={idea.get('feasibility_score', 0)}, "
                  f"참신={idea.get('novelty_score', 0)}, "
                  f"임팩트={idea.get('impact_score', 0)})")
            
            # 검증 결과
            verification = idea.get('verification', {})
            verified_icon = "✅" if verification.get('verified') else "⚠️"
            print(f"      {verified_icon} 검증: {verification.get('noveltyCheck', 'N/A')[:80]}...")
            print(f"         신뢰도: {verification.get('confidence', 0)*100:.0f}%")
    else:
        print("\n❌ 아이디어 생성 실패")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    main()
