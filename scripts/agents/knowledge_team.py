"""
학문 원리 에이전트 팀 - LangGraph 기반 매일 동적 생성
DisciplineExpertAgent -> AIRelevanceAgent -> QualityReviewerAgent -> FriendlyExplainerAgent
매일 순환하는 10개 학문 분야에서 핵심 원리를 생성합니다.

v3: 3개 학문 분야 동시 처리, 분야당 1개 원리,
    FriendlyExplainerAgent 추가 (친절한 설명가),
    friendlyExplanation + simpleSummary 필드 추가,
    한국 학생 일상 앱(카톡, 유튜브, 배달앱 등) 비유 강화
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
    ALL_DISCIPLINE_KEYS,
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


def get_adjacent_discipline_keys(center_key: str) -> list[str]:
    """주어진 학문 분야 키의 전후 인접 키를 포함해 3개 반환 (순환)"""
    keys = ALL_DISCIPLINE_KEYS
    total = len(keys)
    try:
        idx = keys.index(center_key)
    except ValueError:
        idx = 0
    prev_idx = (idx - 1) % total
    next_idx = (idx + 1) % total
    return [keys[prev_idx], keys[idx], keys[next_idx]]


# ─── 상태 정의 ───
class KnowledgeState(TypedDict):
    discipline_key: str
    discipline_info: dict
    raw_principles: list[dict]
    enriched_principles: list[dict]
    final_principles: list[dict]
    friendly_principles: list[dict]
    today_principle: dict


# ─── Agent 1: DisciplineExpertAgent ───
def discipline_expert_node(state: KnowledgeState) -> dict:
    """특정 학문 분야의 핵심 원리 1개를 생성 (LLM 1회) - 친근한 톤 + 알고 계셨나요? 훅 + 일상 비유"""
    info = state["discipline_info"]
    print(f"\n📚 [DisciplineExpertAgent] {info['name']} 분야 핵심 원리 생성 중...")

    llm = get_llm(temperature=0.8, max_tokens=4096)

    prompt = f"""안녕하세요! 당신은 {info['name']} 분야의 세계적인 전문가예요.
AI를 공부하는 학생들에게 따뜻하고 친근한 말투로 {info['name']}의 핵심 원리를 알려주세요.

학문 분야: {info['name']}
초점 영역: {info['focus']}
AI와의 연결: {info['ai_connection']}

가장 핵심적이고 AI와 연결이 깊은 원리 1개만 생성해주세요. 원리는 다음을 포함해야 해요:
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

반드시 JSON 배열로만 응답하세요 (원리 1개를 담은 배열):
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
        # 혹시 여러 개가 왔으면 첫 번째만 사용
        if isinstance(principles, list) and len(principles) > 1:
            principles = [principles[0]]
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

    llm = get_llm(temperature=0.7, max_tokens=4096)

    principles_text = json.dumps(principles, ensure_ascii=False, indent=2)

    # 다른 학문 분야 목록
    other_disciplines = []
    for super_cat, disc_dict in DISCIPLINES.items():
        for key, disc_info in disc_dict.items():
            if key != state["discipline_key"]:
                other_disciplines.append(f"{disc_info['name']} ({super_cat})")

    prompt = f"""안녕하세요! 당신은 AI와 학제간 연구의 전문가예요.
다음 {info['name']} 원리에 대해 AI 관련성과 타 학문 연결고리를 분석해주세요.

원리:
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
    """정확성, 실용성, 이해도를 검증하고 최종 다듬기 + learn_more_links 생성 (LLM 1회) - 1개 원리 최종 선별"""
    print("\n✅ [QualityReviewerAgent] 품질 검증 및 최종 다듬기 중...")

    principles = state["enriched_principles"]
    info = state["discipline_info"]

    if not principles:
        return {"final_principles": [], "today_principle": {}}

    llm = get_llm(temperature=0.5, max_tokens=4096)

    principles_text = json.dumps(principles, ensure_ascii=False, indent=2)

    prompt = f"""안녕하세요! 당신은 교육 콘텐츠 품질 검수 전문가예요.
다음 {info['name']} 원리를 검수하고 최종 버전을 작성해주세요.

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
- 가장 품질이 높은 원리 1개만 최종 결과로 반환해주세요
- 원리에 learn_more_links를 2-3개 추가해주세요

learn_more_links 작성 규칙:
- 원리의 주제와 직접 관련된 위키피디아 한국어 페이지, 유튜브 교육 영상, 관련 기사/블로그를 추천해주세요
- 위키피디아 링크는 한국어 위키피디아(ko.wikipedia.org)를 우선으로 해주세요
- 유튜브 링크는 해당 개념을 잘 설명하는 교육 채널의 영상을 추천해주세요
- 형식: [{{"type": "wikipedia", "title": "페이지 제목", "url": "https://ko.wikipedia.org/wiki/..."}}, {{"type": "youtube", "title": "영상 제목", "url": "https://www.youtube.com/watch?v=..."}}, {{"type": "article", "title": "기사 제목", "url": "https://..."}}]

반드시 다음 JSON 형식으로만 응답하세요 (최종 원리 1개만):
{{
  "principle": {{
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
}}

원리:
{principles_text}"""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        result = parse_llm_json(response.content)

        # 새로운 형식: 단일 principle 객체
        if "principle" in result:
            best_principle = result["principle"]
        # 이전 형식 호환: principles 배열
        elif "principles" in result:
            all_principles = result.get("principles", principles)
            best_idx = result.get("best_index", 0)
            best_principle = all_principles[best_idx] if best_idx < len(all_principles) else all_principles[0]
        else:
            # result 자체가 원리일 수 있음
            best_principle = result

        # 메타데이터 추가
        best_principle["category"] = state["discipline_key"]
        best_principle["superCategory"] = info.get("superCategory", "")
        if "learn_more_links" not in best_principle:
            best_principle["learn_more_links"] = []

        final_principles = [best_principle]
        today_principle = best_principle
        print(f"  ✓ 품질 검증 완료, 최종 원리: {today_principle['title']}")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  ⚠ 품질 검증 파싱 실패, 원본 사용: {e}")
        final_principles = principles[:1] if principles else []
        for p in final_principles:
            p["category"] = state["discipline_key"]
            p["superCategory"] = info.get("superCategory", "")
            if "learn_more_links" not in p:
                p["learn_more_links"] = []
        today_principle = final_principles[0] if final_principles else {}

    return {"final_principles": final_principles, "today_principle": today_principle}


# ─── Agent 4: FriendlyExplainerAgent (친절한 설명가) ───
def friendly_explainer_node(state: KnowledgeState) -> dict:
    """최종 원리에 친근한 설명, 일상 앱 비유, 중학생 요약을 추가 (LLM 1회)"""
    print("\n😊 [FriendlyExplainerAgent] 친절한 설명 및 일상 비유 강화 중...")

    principles = state["final_principles"]
    info = state["discipline_info"]

    if not principles:
        return {"friendly_principles": [], "today_principle": {}}

    llm = get_llm(temperature=0.9, max_tokens=4096)

    principles_text = json.dumps(principles, ensure_ascii=False, indent=2)

    prompt = f"""안녕하세요! 당신은 어려운 개념을 누구나 이해할 수 있게 설명하는 천재적인 설명가예요.
한국 10대~20대 학생들이 매일 사용하는 앱과 서비스로 학문 원리를 설명하는 것이 특기예요.

다음 {info['name']} 원리를 더 친근하고 이해하기 쉽게 보강해주세요.

원리:
{principles_text}

각 원리에 대해 다음 작업을 수행해주세요:

1. **비유법 강화 (everydayAnalogy 개선)**:
   - 기존 everydayAnalogy를 한국 학생들이 매일 사용하는 앱/서비스로 비유를 강화해주세요
   - 카카오톡, 넷플릭스, 배달의민족/쿠팡이츠, 유튜브 알고리즘, 인스타그램, 틱톡, 당근마켓, 쿠팡, 네이버, 멜론, 리그오브레전드/발로란트 등
   - 비유가 원리의 핵심을 정확하게 전달하는지 확인해주세요

2. **톤 체크 및 수정**:
   - 모든 텍스트가 ~이에요/~해요 체인지 다시 한번 확인하고, ~이다/~한다 체가 남아있으면 수정해주세요
   - 딱딱하거나 교과서적인 표현을 자연스럽고 대화하듯 편한 표현으로 바꿔주세요

3. **friendlyExplanation 필드 추가**:
   - 2-3문장으로 이 원리를 일상 앱/서비스 비유로 설명해주세요
   - 반드시 구체적인 앱 이름을 사용하세요 (카카오톡, 넷플릭스, 배달앱, 유튜브, 인스타그램, 쿠팡 등)
   - 예시: "넷플릭스가 내 취향을 귀신같이 아는 것, 경험해 보셨죠? 이게 바로 협업 필터링이에요. 나와 비슷한 취향의 사람들이 좋아한 콘텐츠를 추천해주는 거예요. 배달앱에서 '이 메뉴를 시킨 사람들이 함께 주문한 메뉴'를 보여주는 것도 같은 원리예요!"
   - 예시: "카카오톡에서 단톡방에 메시지를 보내면 모든 사람에게 동시에 전달되죠? 이것이 바로 브로드캐스트 통신의 원리예요. 유튜브 알림도 마찬가지로 구독자 전체에게 한 번에 알림이 가는 거예요!"

4. **simpleSummary 필드 추가**:
   - 중학생도 이해할 수 있는 한 줄 요약이에요
   - 최대한 쉬운 단어만 사용하고, 전문 용어는 피해주세요
   - 예시: "컴퓨터가 많은 예시를 보고 스스로 규칙을 찾아내는 방법이에요"
   - 예시: "여러 명이 함께 문제를 풀면 혼자보다 더 정확한 답을 찾을 수 있어요"

반드시 다음 JSON 배열 형식으로만 응답하세요. 기존 필드를 모두 유지하고 개선하며, 새 필드를 추가하세요:
[
  {{
    "title": "...",
    "hook": "...",
    "description": "...",
    "explanation": "...",
    "everydayAnalogy": "(강화된 버전)...",
    "realWorldExample": "...",
    "applicationIdeas": [...],
    "aiRelevance": "...",
    "crossDisciplineLinks": [...],
    "difficulty": "...",
    "learn_more_links": [...],
    "category": "...",
    "superCategory": "...",
    "friendlyExplanation": "카카오톡/넷플릭스/배달앱 등을 활용한 2-3문장 설명...",
    "simpleSummary": "중학생도 이해할 수 있는 한 줄 요약이에요"
  }}
]"""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        friendly = parse_llm_json(response.content)

        # 메타데이터가 누락되었을 수 있으므로 보존
        for i, p in enumerate(friendly):
            if "category" not in p or not p["category"]:
                p["category"] = state["discipline_key"]
            if "superCategory" not in p or not p["superCategory"]:
                p["superCategory"] = info.get("superCategory", "")
            if "learn_more_links" not in p:
                p["learn_more_links"] = []
            if "friendlyExplanation" not in p:
                p["friendlyExplanation"] = p.get("everydayAnalogy", "")
            if "simpleSummary" not in p:
                p["simpleSummary"] = p.get("description", "")

        today_principle = friendly[0] if friendly else state.get("today_principle", {})
        print(f"  ✓ 친절한 설명 추가 완료: {today_principle.get('title', 'N/A')}")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  ⚠ 친절한 설명 파싱 실패, 기본값 추가: {e}")
        friendly = principles
        for p in friendly:
            if "friendlyExplanation" not in p:
                p["friendlyExplanation"] = p.get("everydayAnalogy", "")
            if "simpleSummary" not in p:
                p["simpleSummary"] = p.get("description", "")
        today_principle = friendly[0] if friendly else state.get("today_principle", {})

    return {"friendly_principles": friendly, "today_principle": today_principle}


# ─── 학문 원리 에이전트 팀 그래프 빌드 ───
def build_knowledge_team_graph():
    """학문 원리 생성 에이전트 팀 그래프 (4단계)"""
    graph = StateGraph(KnowledgeState)

    graph.add_node("expert", discipline_expert_node)
    graph.add_node("ai_relevance", ai_relevance_node)
    graph.add_node("quality_review", quality_reviewer_node)
    graph.add_node("friendly_explainer", friendly_explainer_node)

    graph.add_edge(START, "expert")
    graph.add_edge("expert", "ai_relevance")
    graph.add_edge("ai_relevance", "quality_review")
    graph.add_edge("quality_review", "friendly_explainer")
    graph.add_edge("friendly_explainer", END)

    return graph.compile()


def run_knowledge_team(discipline_key: str = None, discipline_keys: list[str] = None) -> dict:
    """학문 원리 에이전트 팀 실행

    Args:
        discipline_key: 단일 학문 분야 키 (하위 호환용, discipline_keys보다 우선순위 낮음)
        discipline_keys: 처리할 학문 분야 키 목록. None이면 오늘 학문 + 전후 인접 학문 3개 자동 선택.

    Returns:
        dict: 하위 호환 필드(final_principles, today_principle 등) + 새 필드(disciplines_results, all_principles)
    """
    # discipline_keys 결정
    if discipline_keys is not None:
        keys_to_process = discipline_keys
    elif discipline_key is not None:
        keys_to_process = get_adjacent_discipline_keys(discipline_key)
    else:
        today_key = get_today_discipline_key()
        keys_to_process = get_adjacent_discipline_keys(today_key)

    print("=" * 60)
    print(f"🚀 학문 원리 에이전트 팀 시작 - {len(keys_to_process)}개 학문 분야 처리")
    for k in keys_to_process:
        k_info = get_discipline_info(k)
        print(f"   • {k_info.get('name', k)} ({k_info.get('superCategory', '')})")
    print("=" * 60)

    graph = build_knowledge_team_graph()

    disciplines_results = []
    all_principles = []

    for dk in keys_to_process:
        info = get_discipline_info(dk)
        if not info:
            print(f"\n⚠ 학문 분야 '{dk}'를 찾을 수 없어요. 건너뛸게요.")
            continue

        print(f"\n{'─' * 40}")
        print(f"📘 [{info['name']}] 파이프라인 시작")
        print(f"{'─' * 40}")

        initial_state = {
            "discipline_key": dk,
            "discipline_info": info,
            "raw_principles": [],
            "enriched_principles": [],
            "final_principles": [],
            "friendly_principles": [],
            "today_principle": {},
        }

        try:
            result = graph.invoke(initial_state)

            friendly = result.get("friendly_principles", [])
            final = result.get("final_principles", [])
            # friendly_principles가 있으면 우선 사용, 없으면 final_principles 사용
            output_principles = friendly if friendly else final

            discipline_result = {
                "discipline_key": dk,
                "discipline_info": info,
                "principles": output_principles,
                "today_principle": result.get("today_principle", {}),
            }

            disciplines_results.append(discipline_result)
            all_principles.extend(output_principles)

            print(f"  ✓ [{info['name']}] 완료: {len(output_principles)}개 원리 생성")

        except Exception as e:
            print(f"  ✗ [{info['name']}] 파이프라인 실패: {e}")
            disciplines_results.append({
                "discipline_key": dk,
                "discipline_info": info,
                "principles": [],
                "today_principle": {},
                "error": str(e),
            })

    # 3개 학문 분야 중 가장 좋은 원리를 today_principle로 선택
    # 기본적으로 오늘의 학문(가운데 키)의 원리를 best로 사용
    best_principle = {}
    if disciplines_results:
        # 가운데(오늘) 학문의 원리를 우선
        center_idx = len(disciplines_results) // 2
        center_result = disciplines_results[center_idx]
        if center_result.get("today_principle"):
            best_principle = center_result["today_principle"]
        else:
            # 가운데가 실패했으면 첫 번째 성공한 결과에서 선택
            for dr in disciplines_results:
                if dr.get("today_principle"):
                    best_principle = dr["today_principle"]
                    break

    print(f"\n{'=' * 60}")
    print(f"✅ 학문 원리 에이전트 팀 완료: {len(all_principles)}개 원리 생성 (학문 {len(disciplines_results)}개)")
    if best_principle:
        print(f"   오늘의 원리: {best_principle.get('title', 'N/A')}")
    print(f"{'=' * 60}")

    # 하위 호환 + 새 필드 모두 반환
    # 하위 호환: discipline_key, discipline_info, final_principles, today_principle
    center_key = keys_to_process[len(keys_to_process) // 2] if keys_to_process else ""
    center_info = get_discipline_info(center_key) if center_key else {}

    return {
        # 하위 호환 필드
        "discipline_key": center_key,
        "discipline_info": center_info,
        "final_principles": all_principles,
        "today_principle": best_principle,
        # 새 필드
        "disciplines_results": disciplines_results,
        "all_principles": all_principles,
    }
