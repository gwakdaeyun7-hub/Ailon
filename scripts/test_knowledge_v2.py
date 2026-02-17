"""
학문 원리 그래프 v2 테스트 스크립트
역방향 파이프라인 (융합→응용→기본→검증) 테스트
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from agents.knowledge_graph_v2 import run_knowledge_graph

def main():
    print("🧪 Academic Snaps v2 테스트 (역방향 파이프라인)")
    print("=" * 70)
    
    # 물리학 테스트 (Simulated Annealing이 나올 가능성 높음)
    print("\n📚 테스트: 물리학 (physics)")
    print("-" * 70)
    
    result = run_knowledge_graph(discipline_key="physics")
    
    if result.get("final_principle"):
        fp = result["final_principle"]
        print("\n" + "=" * 70)
        print("✅ 결과 요약")
        print("=" * 70)
        print(f"제목: {fp.get('title', 'N/A')}")
        print(f"카테고리: {fp.get('category', 'N/A')} ({fp.get('superCategory', 'N/A')})")
        
        # Foundation
        foundation = fp.get("foundation", {})
        print(f"\n📘 기본 원리:")
        print(f"  - 설명: {foundation.get('principle', 'N/A')[:100]}...")
        print(f"  - 핵심: {foundation.get('keyIdea', 'N/A')}")
        
        # Application
        application = fp.get("application", {})
        print(f"\n🔬 응용 원리:")
        print(f"  - 분야: {application.get('applicationField', 'N/A')}")
        print(f"  - 메커니즘: {application.get('mechanism', 'N/A')}")
        
        # Integration
        integration = fp.get("integration", {})
        print(f"\n🚀 융합 사례:")
        print(f"  - 해결 문제: {integration.get('problemSolved', 'N/A')}")
        print(f"  - 영향 분야: {integration.get('impactField', 'N/A')}")
        examples = integration.get('realWorldExamples', [])
        if examples:
            print(f"  - 실제 사례: {', '.join(examples)}")
        
        # Verification
        verification = fp.get("verification", {})
        verified_icon = "✅" if verification.get("verified") else "⚠️"
        confidence = verification.get("confidence", 0.0)
        print(f"\n{verified_icon} 검증 결과:")
        print(f"  - 신뢰도: {confidence * 100:.0f}%")
        print(f"  - 팩트체크: {verification.get('factCheck', 'N/A')[:150]}...")
        
        sources = verification.get("sources", [])
        if sources:
            print(f"  - 검증 소스:")
            for i, source in enumerate(sources[:3], 1):
                print(f"    {i}. {source.get('title', 'N/A')}")
                print(f"       {source.get('url', 'N/A')}")
    else:
        print("\n❌ 원리 생성 실패")
        if result.get("error"):
            print(f"오류: {result['error']}")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    main()
