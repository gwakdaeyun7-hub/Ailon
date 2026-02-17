"""
학문 원리 에이전트 팀 - LangGraph 기반 기본-응용-융합 구조
FoundationAgent -> ApplicationAgent -> IntegrationAgent

매일 1개 학문 분야에서 3단계 콘텐츠 생성:
- 기본(Foundation): 해당 학문의 기본 원리
- 응용(Application): 원리를 다른 영역에 응용
- 융합(Integration): 다른 학문의 문제를 해결한 융합 사례

예시: Simulated Annealing (물리학)
- 기본: 담금질 원리 (금속을 높은 온도로 가열 후 천천히 냉각)
- 응용: 확률적 최적화 알고리즘
- 융합: AI 로컬 미니마 문제, 물류 최적화, 반도체 설계
"""

import json
from typing import TypedDict
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END

from agents.config import (
    get_llm,
    get_today_discipline_key,
    get_discipline_info,
)


# ─── JSON 파싱 유틸리티 ───
def parse_llm_json(text: str):
    """LLM 응답에서 markdown 코드 블록을 제거하고 JSON 파싱"""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    if text.startswith("json"):
        text = text[4:].strip()
    return json.loads(text)


# ─── 상태 정의 ───
class KnowledgeState(TypedDict):
    discipline_key: str
    discipline_info: dict
    foundation: dict
    application: dict
    integration: dict
    final_principle: dict


# ─── Agent 1: FoundationAgent ───
def foundation_agent_node(state: KnowledgeState) -> dict:
    """해당 학문의 기본 원리를 쉽고 친근하게 설명 (LLM 1회)"""
    info = state["discipline_info"]
    print(f"\n📚 [FoundationAgent] {info['name']} 분야 기본 원리 생성 중...")

    llm = get_llm(temperature=0.8, max_tokens=4096)

    prompt = f"""안녕하세요! 당신은 {info['name']} 분야의 세계적인 전문가예요.
AI를 공부하는 학생들에게 따뜻하고 친근한 말투로 {info['name']}의 핵심 원리를 알려주세요.

학문 분야: {info['name']}
초점 영역: {info['focus']}
AI와의 연결: {info['ai_connection']}

Simulated Annealing의 '담금질' 원리처럼, 다른 학문에 응용되거나 융합될 수 있는 
**근본적이고 강력한 원리** 1개를 선정해 설명해주세요.

원리는 다음을 포함해야 해요:
- title: 원리의 이름 (한국어, 핵심 개념을 담은 명확한 제목)
  예: "담금질(Annealing)", "경사하강법", "양자 중첩"
- principle: 기본 원리 설명 (200-300자, ~이에요/~해요 체)
  핵심 메커니즘과 작동 방식을 포함하세요.
  예: "금속을 높은 온도로 가열했다가 천천히 냉각시키면, 원자들이 가장 안정적인 결정 구조를 갖게 돼요. 
       급하게 식히면 불순물이 갇히지만, 천천히 식히면 에너지가 가장 낮은 안정한 상태에 도달하게 된답니다."
- keyIdea: 핵심 아이디어 한 줄 (50자 이내, ~이에요/~해요 체)
  예: "천천히 식히면 에너지가 가장 낮은 안정한 상태에 도달해요"
- everydayAnalogy: 일상 비유 (100-150자, ~이에요/~해요 체)
  예: "이건 마치 퍼즐 조각을 맞출 때 급하게 억지로 끼우는 대신, 
       여유롭게 하나씩 정확한 위치를 찾아가는 것과 비슷해요."

다른 분야에 응용될 수 있는 보편적인 원리를 선택하세요.
모든 텍스트는 반드시 친근한 ~이에요/~해요 체로 작성해주세요.

반드시 JSON으로만 응답하세요:
{{
  "title": "원리 이름",
  "principle": "기본 원리 설명이에요...",
  "keyIdea": "핵심 아이디어예요",
  "everydayAnalogy": "일상 비유예요..."
}}"""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        foundation = parse_llm_json(response.content)
        print(f"  ✓ 기본 원리 생성 완료: {foundation.get('title', 'N/A')}")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  ⚠ 원리 생성 파싱 실패: {e}")
        foundation = {
            "title": f"{info['name']}의 기본 원리",
            "principle": f"{info['focus']}에 관한 핵심 원리예요. 자연 현상이나 수학적 법칙에서 유래한 보편적인 개념이에요.",
            "keyIdea": "기본 메커니즘을 이해하는 것이 중요해요",
            "everydayAnalogy": "일상에서 흔히 볼 수 있는 현상과 비슷해요.",
        }

    return {"foundation": foundation}


# ─── Agent 2: ApplicationAgent ───
def application_agent_node(state: KnowledgeState) -> dict:
    """기본 원리를 다른 영역에 응용한 사례 생성 (LLM 1회)"""
    print("\n🔧 [ApplicationAgent] 응용 사례 생성 중...")

    foundation = state["foundation"]
    info = state["discipline_info"]

    if not foundation:
        return {"application": {}}

    llm = get_llm(temperature=0.7, max_tokens=4096)

    foundation_text = json.dumps(foundation, ensure_ascii=False, indent=2)

    prompt = f"""안녕하세요! 당신은 학제간 응용 전문가예요.
다음 {info['name']} 원리를 다른 영역(통계, 계산, 공학 등)에 응용한 사례를 설명해주세요.

기본 원리:
{foundation_text}

Simulated Annealing의 예시처럼:
- 기본 원리: 물리학의 담금질
- 응용: 통계 물리학/최적화 알고리즘으로 확장
  "높은 '온도(변수)'를 설정해 무작위로 답을 찾다가, 시간이 흐를수록 '온도'를 낮추며 
   정답 확률이 높은 쪽으로 탐색 범위를 좁혀가는 방식이에요."

다음을 생성해주세요 (~이에요/~해요 체):
- applicationField: 응용된 분야 (예: "통계 물리학/최적화 알고리즘")
- description: 어떻게 응용되는지 설명 (200-300자)
  원리가 새로운 맥락에서 어떻게 작동하는지 구체적으로 설명하세요.
- mechanism: 응용된 메커니즘 한 줄 (50-80자)
  예: "온도를 낮추며 탐색 범위를 좁혀가는 방식이에요"
- technicalTerms: 관련 기술 용어 3-5개 (배열)
  예: ["확률적 탐색", "전역 최적화", "메트로폴리스 알고리즘"]

반드시 JSON으로만 응답하세요:
{{
  "applicationField": "응용 분야",
  "description": "응용 설명이에요...",
  "mechanism": "메커니즘이에요",
  "technicalTerms": ["용어1", "용어2", "용어3"]
}}"""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        application = parse_llm_json(response.content)
        print(f"  ✓ 응용 사례 생성 완료: {application.get('applicationField', 'N/A')}")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  ⚠ 응용 사례 파싱 실패: {e}")
        application = {
            "applicationField": "수학/컴퓨터과학",
            "description": "이 원리는 복잡한 계산 문제를 해결하는 데 응용될 수 있어요.",
            "mechanism": "기본 원리를 알고리즘으로 변환하는 방식이에요",
            "technicalTerms": ["알고리즘", "최적화", "계산"],
        }

    return {"application": application}


# ─── Agent 3: IntegrationAgent ───
def integration_agent_node(state: KnowledgeState) -> dict:
    """다른 학문의 실제 문제를 해결한 융합 사례 생성 (LLM 1회)"""
    print("\n🌐 [IntegrationAgent] 융합 사례 생성 중...")

    foundation = state["foundation"]
    application = state["application"]
    info = state["discipline_info"]

    if not foundation or not application:
        return {"integration": {}}

    llm = get_llm(temperature=0.7, max_tokens=4096)

    foundation_text = json.dumps(foundation, ensure_ascii=False, indent=2)
    application_text = json.dumps(application, ensure_ascii=False, indent=2)

    prompt = f"""안녕하세요! 당신은 학제간 융합 연구 전문가예요.
다음 원리와 응용 사례를 바탕으로, 실제로 다른 학문의 문제를 해결한 융합 사례를 설명해주세요.

기본 원리:
{foundation_text}

응용 사례:
{application_text}

Simulated Annealing의 예시처럼:
- 문제: AI 로컬 미니마 문제
- 해결: 담금질 기법으로 확률적 도박을 허용하여 전역 최솟값 탐색
- 실제 사례: 물류 배송 최적화, 반도체 칩 설계(VLSI), 단백질 폴딩 예측
- 영향 분야: AI, 물류, 반도체, 생명과학

**중요**: AI 문제만 다룰 필요는 없어요. 다른 학문 분야의 문제를 해결한 사례도 좋아요.
예: 경제학 → 게임 이론 → 통신망 설계, 생물학 → 진화 알고리즘 → 공학 최적화 등

다음을 생성해주세요 (~이에요/~해요 체):
- problemSolved: 해결한 문제 (간결하게, 50자 이내)
  예: "AI 로컬 미니마 문제", "복잡한 물류 경로 최적화"
- solution: 어떻게 해결했는지 (150-200자)
  원리와 응용이 어떻게 결합되어 문제를 해결했는지 설명하세요.
- realWorldExamples: 실제 사례 3-4개 (배열, 각 30자 이내)
  예: ["물류 배송 경로 최적화", "반도체 칩 설계(VLSI)", "단백질 폴딩 예측"]
- impactField: 영향을 미친 분야들 (쉼표로 구분, 80자 이내)
  예: "AI, 물류, 반도체, 생명과학"
- whyItWorks: 왜 효과적인지 (100-150자)
  이 융합이 왜 성공적인지 핵심 이유를 설명하세요.

반드시 JSON으로만 응답하세요:
{{
  "problemSolved": "해결한 문제",
  "solution": "해결 방법이에요...",
  "realWorldExamples": ["사례1", "사례2", "사례3"],
  "impactField": "영향 분야들",
  "whyItWorks": "효과적인 이유예요..."
}}"""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        integration = parse_llm_json(response.content)
        print(f"  ✓ 융합 사례 생성 완료: {integration.get('problemSolved', 'N/A')}")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  ⚠ 융합 사례 파싱 실패: {e}")
        integration = {
            "problemSolved": "복잡한 문제 해결",
            "solution": "이 원리를 응용하여 여러 분야의 문제를 해결할 수 있어요.",
            "realWorldExamples": ["공학 문제", "산업 최적화", "과학 연구"],
            "impactField": "공학, 산업, 과학",
            "whyItWorks": "보편적인 원리를 다양한 맥락에 적용할 수 있기 때문이에요.",
        }

    return {"integration": integration}


# ─── 최종 통합 노드 ───
def finalize_node(state: KnowledgeState) -> dict:
    """3단계 콘텐츠를 하나의 principle 객체로 통합"""
    print("\n✅ [Finalizer] 최종 원리 통합 중...")

    foundation = state.get("foundation", {})
    application = state.get("application", {})
    integration = state.get("integration", {})
    info = state["discipline_info"]

    # 최종 principle 객체 구성
    final_principle = {
        "title": foundation.get("title", f"{info['name']}의 원리"),
        "category": state["discipline_key"],
        "superCategory": info.get("superCategory", ""),
        "foundation": foundation,
        "application": application,
        "integration": integration,
        # 추가 학습 자료 (간단한 예시)
        "learn_more_links": [
            {
                "type": "wikipedia",
                "title": f"{foundation.get('title', '원리')} - 위키피디아",
                "url": f"https://ko.wikipedia.org/wiki/{foundation.get('title', '')}",
            }
        ],
    }

    print(f"  ✓ 최종 통합 완료: {final_principle['title']}")

    return {"final_principle": final_principle}


# ─── 학문 원리 에이전트 팀 그래프 빌드 ───
def build_knowledge_team_graph():
    """학문 원리 생성 에이전트 팀 그래프 (3단계 + 최종화)"""
    graph = StateGraph(KnowledgeState)

    graph.add_node("foundation", foundation_agent_node)
    graph.add_node("application", application_agent_node)
    graph.add_node("integration", integration_agent_node)
    graph.add_node("finalize", finalize_node)

    graph.add_edge(START, "foundation")
    graph.add_edge("foundation", "application")
    graph.add_edge("application", "integration")
    graph.add_edge("integration", "finalize")
    graph.add_edge("finalize", END)

    return graph.compile()


def run_knowledge_team(discipline_key: str = None) -> dict:
    """학문 원리 에이전트 팀 실행 (하루 1개 학문)

    Args:
        discipline_key: 학문 분야 키. None이면 오늘의 학문 자동 선택.

    Returns:
        dict: discipline_key, discipline_info, final_principle 포함
    """
    # discipline_key 결정
    if discipline_key is None:
        discipline_key = get_today_discipline_key()

    print("=" * 60)
    print(f"🚀 학문 원리 에이전트 팀 시작 - {discipline_key}")
    print("=" * 60)

    info = get_discipline_info(discipline_key)
    if not info:
        print(f"\n⚠ 학문 분야 '{discipline_key}'를 찾을 수 없어요.")
        return {
            "discipline_key": discipline_key,
            "discipline_info": {},
            "final_principle": {},
        }

    print(f"\n📘 학문 분야: {info['name']} ({info.get('superCategory', '')})")
    print(f"   초점 영역: {info['focus']}")
    print(f"   AI 연결: {info['ai_connection']}")

    graph = build_knowledge_team_graph()

    initial_state = {
        "discipline_key": discipline_key,
        "discipline_info": info,
        "foundation": {},
        "application": {},
        "integration": {},
        "final_principle": {},
    }

    try:
        result = graph.invoke(initial_state)

        final_principle = result.get("final_principle", {})

        print(f"\n{'=' * 60}")
        print(f"✅ 학문 원리 에이전트 팀 완료")
        print(f"   원리: {final_principle.get('title', 'N/A')}")
        print(f"{'=' * 60}")

        return {
            "discipline_key": discipline_key,
            "discipline_info": info,
            "final_principle": final_principle,
        }

    except Exception as e:
        print(f"\n✗ 파이프라인 실패: {e}")
        return {
            "discipline_key": discipline_key,
            "discipline_info": info,
            "final_principle": {},
            "error": str(e),
        }
