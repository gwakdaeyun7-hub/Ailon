"""
학문 원리 에이전트 팀 - LangGraph 기반 매일 동적 생성
DisciplineExpertAgent → AIRelevanceAgent → QualityReviewerAgent
매일 순환하는 10개 학문 분야에서 핵심 원리를 생성합니다.

v2: 친근한 한국어 톤, "알고 계셨나요?" 훅, 일상 비유,
    강화된 AI 연결성, learn_more_links, 5개 원리 생성
"""

import json
from typing import TypedDict
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END

from agents.config import (
    get_llm,
    get_today_discipline_key,
    get_discipline_info,
    DISCIPLINES,
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
    raw_principles: list[dict]
    enriched_principles: list[dict]
    final_principles: list[dict]
    today_principle: dict


# ─── Agent 1: DisciplineExpertAgent ───
def discipline_expert_node(state: KnowledgeState) -> dict:
    """특정 학문 분야의 핵심 원리를 생성 (LLM 1회) - 친근한 톤 + 알고 계셨나요? 훅 + 일상 비유"""
    info = state["discipline_info"]
    print(f"\n📚 [DisciplineExpertAgent] {info['name']} 분야 핵심 원리 생성 중...")

    llm = get_llm(temperature=0.8, max_tokens=8192)

    prompt = f"""안녕하세요! 당신은 {info['name']} 분야의 세계적인 전문가예요.
AI를 공부하는 학생들에게 따뜻하고 친근한 말투로 {info['name']}의 핵심 원리를 알려주세요.

학문 분야: {info['name']}
초점 영역: {info['focus']}
AI와의 연결: {info['ai_connection']}

핵심 원리 5개를 생성해주세요. 각 원리는 다음을 포함해야 해요:
- title: 원리의 이름 (한국어)
- hook: "알고 계셨나요?" 스타일의 흥미로운 도입 문장 1개 (한국어, ~이에요/~해요 체로 작성)
  예: "알고 계셨나요? 우리 뇌가 꿈을 꿀 때도 신경망이 학습을 계속하고 있다는 사실! 이것이 바로 오프라인 학습의 원리예요."
- description: 한 줄 요약 (한국어, ~이에요/~해요 체)
- explanation: 상세 설명 2-3문장 (한국어, ~이에요/~해요 체, 비전공자도 이해할 수 있게 친근하게)
- everydayAnalogy: 일상 비유 2-3문장 (한국어, ~이에요/~해요 체)
  예: "이건 마치 레시피를 따라 요리하는 것과 비슷해요. 재료(입력)를 넣고, 레시피(알고리즘)를 따르면, 맛있는 요리(출력)가 나오는 것처럼요!"
  반드시 학생들이 일상에서 공감할 수 있는 비유를 사용하세요 (요리, 게임, SNS, 쇼핑, 음악 등).
- realWorldExample: 실생활 예시 1-2문장 (한국어, ~이에요/~해요 체)
- applicationIdeas: AI에 적용할 수 있는 아이디어 3개 (한국어, 배열, ~이에요/~해요 체)

기본적이지만 깊이 있는 원리를 선택하세요. 너무 전문적이거나 너무 상식적인 것은 피하세요.
매번 다양한 원리를 제공하기 위해 창의적으로 선택해주세요.
모든 텍스트는 반드시 친근한 ~이에요/~해요 체로 작성해주세요. 딱딱한 ~이다/~한다 체는 사용하지 마세요.

반드시 JSON 배열로만 응답하세요:
[
  {{
    "title": "원리 이름",
    "hook": "알고 계셨나요? ...",
    "description": "한 줄 요약이에요",
    "explanation": "상세 설명이에요...",
    "everydayAnalogy": "일상 비유예요...",
    "realWorldExample": "실생활 예시예요...",
    "applicationIdeas": ["AI 적용 1이에요", "AI 적용 2예요", "AI 적용 3이에요"]
  }}
]"""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        principles = parse_llm_json(response.content)
        print(f"  ✓ {len(principles)}개 원리 생성 완료")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  ⚠ 원리 생성 파싱 실패: {e}")
        principles = [{
            "title": f"{info['name']}의 기본 원리",
            "hook": f"알고 계셨나요? {info['name']}에는 AI와 깊이 연결된 흥미로운 원리들이 숨어 있어요!",
            "description": f"{info['name']}의 핵심 개념이에요.",
            "explanation": f"{info['focus']}에 관한 기본 원리예요. 쉽게 말하면 우리 주변에서 흔히 볼 수 있는 현상이에요.",
            "everydayAnalogy": "이건 마치 퍼즐을 맞추는 것과 비슷해요. 조각 하나하나가 모여 큰 그림을 완성하는 거예요.",
            "realWorldExample": "다양한 분야에서 활용되고 있어요.",
            "applicationIdeas": [info['ai_connection']],
        }]

    return {"raw_principles": principles}


# ─── Agent 2: AIRelevanceAgent ───
def ai_relevance_node(state: KnowledgeState) -> dict:
    """생성된 원리에 AI 관련성과 타 학문 연결고리를 추가 (LLM 1회) - 강화된 AI 연결성"""
    print("\n🤖 [AIRelevanceAgent] AI 관련성 및 학문 간 연결 분석 중...")

    principles = state["raw_principles"]
    info = state["discipline_info"]

    if not principles:
        return {"enriched_principles": []}

    llm = get_llm(temperature=0.7, max_tokens=8192)

    principles_text = json.dumps(principles, ensure_ascii=False, indent=2)

    # 다른 학문 분야 목록
    other_disciplines = []
    for super_cat, disc_dict in DISCIPLINES.items():
        for key, disc_info in disc_dict.items():
            if key != state["discipline_key"]:
                other_disciplines.append(f"{disc_info['name']} ({super_cat})")

    prompt = f"""안녕하세요! 당신은 AI와 학제간 연구의 전문가예요.
다음 {info['name']} 원리들에 대해 AI 관련성과 타 학문 연결고리를 분석해주세요.

원리들:
{principles_text}

다른 학문 분야: {', '.join(other_disciplines)}

각 원리에 대해 다음을 추가해주세요. 모든 텍스트는 ~이에요/~해요 체로 친근하게 작성해주세요:

- aiRelevance: "이것이 AI에 중요한 이유" 섹션이에요.
  반드시 구체적인 AI 기술/모델/연구 사례를 언급하면서 3-4문장으로 작성해주세요.
  예를 들어 "이 원리는 GPT 시리즈의 어텐션 메커니즘에 직접 적용돼요" 같이 구체적으로요.
  추상적인 설명("AI 발전에 도움이 돼요") 대신, 실제 AI 시스템/알고리즘/연구에서 어떻게 사용되는지 명확하게 설명해주세요.
  포맷: "이것이 AI에 중요한 이유: [구체적 설명]"

- crossDisciplineLinks: 이 원리와 연결되는 다른 학문 분야 2-3개와 연결 이유 (한국어, 배열, ~해요 체)
  각 항목은 "학문명: 연결 이유" 형식이에요.

- difficulty: 난이도 ("beginner", "intermediate", "advanced")

반드시 JSON 배열로만 응답하세요. 원래 필드를 모두 유지하고 새 필드를 추가하세요:
[
  {{
    "title": "...",
    "hook": "...",
    "description": "...",
    "explanation": "...",
    "everydayAnalogy": "...",
    "realWorldExample": "...",
    "applicationIdeas": [...],
    "aiRelevance": "이것이 AI에 중요한 이유: ...",
    "crossDisciplineLinks": ["수학: 연결 이유예요", "뇌과학: 연결 이유예요"],
    "difficulty": "intermediate"
  }}
]"""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        enriched = parse_llm_json(response.content)
        print(f"  ✓ {len(enriched)}개 원리에 AI 관련성 추가 완료")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  ⚠ AI 관련성 파싱 실패, 기본값 추가: {e}")
        enriched = principles
        for p in enriched:
            p["aiRelevance"] = f"이것이 AI에 중요한 이유: {info.get('ai_connection', '')}와(과) 깊이 연결되어 있어요."
            p["crossDisciplineLinks"] = []
            p["difficulty"] = "intermediate"

    return {"enriched_principles": enriched}


# ─── Agent 3: QualityReviewerAgent ───
def quality_reviewer_node(state: KnowledgeState) -> dict:
    """정확성, 실용성, 이해도를 검증하고 최종 다듬기 + learn_more_links 생성 (LLM 1회)"""
    print("\n✅ [QualityReviewerAgent] 품질 검증 및 최종 다듬기 중...")

    principles = state["enriched_principles"]
    info = state["discipline_info"]

    if not principles:
        return {"final_principles": [], "today_principle": {}}

    llm = get_llm(temperature=0.5, max_tokens=8192)

    principles_text = json.dumps(principles, ensure_ascii=False, indent=2)

    prompt = f"""안녕하세요! 당신은 교육 콘텐츠 품질 검수 전문가예요.
다음 {info['name']} 원리들을 검수하고 최종 버전을 작성해주세요.

검수 기준:
1. 정확성: 학문적으로 정확한가요?
2. 이해도: 비전공자 대학생이 이해할 수 있나요?
3. 실용성: AI를 공부하는 사람에게 실질적 도움이 되나요?
4. 흥미도: 읽고 싶어지는 내용인가요?
5. 톤: 모든 텍스트가 ~이에요/~해요 체의 친근한 말투인가요?

다음을 수행하세요:
- 설명이 너무 전문적이면 쉽고 친근하게 수정해주세요
- 예시가 약하면 더 좋은 예시로 교체해주세요
- AI 관련성이 피상적이면 구체적인 AI 기술/모델을 언급해서 보강해주세요
- "알고 계셨나요?" 훅이 매력적인지 확인하고 필요하면 개선해주세요
- 일상 비유(everydayAnalogy)가 공감 가능한지 확인하고 필요하면 개선해주세요
- ~이다/~한다 체가 있으면 ~이에요/~해요 체로 수정해주세요
- 가장 품질이 높은 원리 1개를 "best"로 선택해주세요
- 각 원리마다 learn_more_links를 2-3개 추가해주세요

learn_more_links 작성 규칙:
- 각 원리의 주제와 직접 관련된 위키피디아 한국어 페이지, 유튜브 교육 영상, 관련 기사/블로그를 추천해주세요
- 위키피디아 링크는 한국어 위키피디아(ko.wikipedia.org)를 우선으로 해주세요
- 유튜브 링크는 해당 개념을 잘 설명하는 교육 채널의 영상을 추천해주세요
- 형식: [{{"type": "wikipedia", "title": "페이지 제목", "url": "https://ko.wikipedia.org/wiki/..."}}, {{"type": "youtube", "title": "영상 제목", "url": "https://www.youtube.com/watch?v=..."}}, {{"type": "article", "title": "기사 제목", "url": "https://..."}}]

반드시 다음 JSON 형식으로만 응답하세요:
{{
  "principles": [
    {{
      "title": "...",
      "hook": "알고 계셨나요? ...",
      "description": "...",
      "explanation": "...",
      "everydayAnalogy": "...",
      "realWorldExample": "...",
      "applicationIdeas": [...],
      "aiRelevance": "이것이 AI에 중요한 이유: ...",
      "crossDisciplineLinks": [...],
      "difficulty": "...",
      "learn_more_links": [
        {{"type": "wikipedia", "title": "...", "url": "..."}},
        {{"type": "youtube", "title": "...", "url": "..."}},
        {{"type": "article", "title": "...", "url": "..."}}
      ]
    }}
  ],
  "best_index": 0
}}

원리들:
{principles_text}"""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        result = parse_llm_json(response.content)
        final_principles = result.get("principles", principles)
        best_idx = result.get("best_index", 0)

        # 메타데이터 추가
        for p in final_principles:
            p["category"] = state["discipline_key"]
            p["superCategory"] = info.get("superCategory", "")
            # learn_more_links가 없으면 빈 배열로 초기화
            if "learn_more_links" not in p:
                p["learn_more_links"] = []

        today_principle = final_principles[best_idx] if best_idx < len(final_principles) else final_principles[0]
        print(f"  ✓ 품질 검증 완료, 오늘의 원리: {today_principle['title']}")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  ⚠ 품질 검증 파싱 실패, 원본 사용: {e}")
        final_principles = principles
        for p in final_principles:
            p["category"] = state["discipline_key"]
            p["superCategory"] = info.get("superCategory", "")
            if "learn_more_links" not in p:
                p["learn_more_links"] = []
        today_principle = final_principles[0] if final_principles else {}

    return {"final_principles": final_principles, "today_principle": today_principle}


# ─── 학문 원리 에이전트 팀 그래프 빌드 ───
def build_knowledge_team_graph():
    """학문 원리 생성 에이전트 팀 그래프"""
    graph = StateGraph(KnowledgeState)

    graph.add_node("expert", discipline_expert_node)
    graph.add_node("ai_relevance", ai_relevance_node)
    graph.add_node("quality_review", quality_reviewer_node)

    graph.add_edge(START, "expert")
    graph.add_edge("expert", "ai_relevance")
    graph.add_edge("ai_relevance", "quality_review")
    graph.add_edge("quality_review", END)

    return graph.compile()


def run_knowledge_team(discipline_key: str = None) -> dict:
    """학문 원리 에이전트 팀 실행"""
    if discipline_key is None:
        discipline_key = get_today_discipline_key()

    info = get_discipline_info(discipline_key)

    print("=" * 60)
    print(f"🚀 학문 원리 에이전트 팀 시작 - {info['name']} ({info['superCategory']})")
    print("=" * 60)

    graph = build_knowledge_team_graph()
    initial_state = {
        "discipline_key": discipline_key,
        "discipline_info": info,
        "raw_principles": [],
        "enriched_principles": [],
        "final_principles": [],
        "today_principle": {},
    }

    result = graph.invoke(initial_state)

    print(f"\n✅ 학문 원리 에이전트 팀 완료: {len(result['final_principles'])}개 원리 생성")
    return result
