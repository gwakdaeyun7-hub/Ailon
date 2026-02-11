"""
융합 아이디어 에이전트 팀 - LangGraph 기반 AI+학문 융합 아이디어 생성
ProblemIdentifierAgent → IdeaGeneratorAgent → FeasibilityCheckerAgent → SynthesizerAgent
오늘의 뉴스와 학문 원리를 결합하여 창의적이고 실용적인 아이디어를 생성합니다.
"""

import json
from typing import TypedDict
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END

from agents.config import get_llm


# ─── 상태 정의 ───
class IdeaState(TypedDict):
    news_articles: list[dict]
    today_principle: dict
    discipline_info: dict
    problems: list[dict]
    raw_ideas: list[dict]
    evaluated_ideas: list[dict]
    final_ideas: list[dict]


# ─── Agent 1: ProblemIdentifierAgent ───
def problem_identifier_node(state: IdeaState) -> dict:
    """뉴스 + 원리를 바탕으로 미해결 문제 및 개선 기회를 식별 (LLM 1회)"""
    print("\n🔎 [ProblemIdentifierAgent] 미해결 문제 및 개선 기회 식별 중...")

    news = state["news_articles"]
    principle = state["today_principle"]
    discipline = state["discipline_info"]

    llm = get_llm(temperature=0.8, max_tokens=3072)

    # 뉴스 요약
    news_text = ""
    for a in news[:5]:
        news_text += f"- {a['title']}: {a.get('summary', a.get('description', ''))[:150]}\n"

    prompt = f"""당신은 AI 연구의 미해결 문제와 혁신 기회를 찾는 전문가입니다.

오늘의 AI 뉴스:
{news_text}

오늘의 학문 원리:
- 분야: {discipline.get('name', '')} ({discipline.get('superCategory', '')})
- 원리: {principle.get('title', '')}
- 설명: {principle.get('explanation', '')}
- AI 관련성: {principle.get('aiRelevance', discipline.get('ai_connection', ''))}

위 정보를 바탕으로 다음을 식별해주세요:
1. 현재 AI가 아직 해결하지 못하고 있는 구체적인 문제 2-3개
2. {discipline.get('name', '')}의 원리를 AI에 접목하면 해결하거나 크게 개선할 수 있는 기회

각 문제에 대해:
- problem: 문제/기회의 이름
- description: 왜 이것이 중요한 문제인지 2-3문장
- current_limitation: 현재 AI의 한계가 무엇인지
- discipline_opportunity: {discipline.get('name', '')} 원리가 어떻게 도움될 수 있는지

반드시 JSON 배열로만 응답하세요:
[{{"problem": "...", "description": "...", "current_limitation": "...", "discipline_opportunity": "..."}}]"""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        text = response.content.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        if text.startswith("json"):
            text = text[4:].strip()

        problems = json.loads(text)
        print(f"  ✓ {len(problems)}개 문제/기회 식별 완료")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  ⚠ 문제 식별 파싱 실패: {e}")
        problems = [{
            "problem": f"AI + {discipline.get('name', '')} 융합 과제",
            "description": "AI와 해당 학문의 융합을 통한 혁신 기회",
            "current_limitation": "현재 접근 방식의 한계",
            "discipline_opportunity": "학문 원리를 통한 해결 가능성",
        }]

    return {"problems": problems}


# ─── Agent 2: IdeaGeneratorAgent ───
def idea_generator_node(state: IdeaState) -> dict:
    """식별된 문제에 대한 구체적인 융합 아이디어 생성 (LLM 1-2회)"""
    print("\n💡 [IdeaGeneratorAgent] 융합 아이디어 생성 중...")

    problems = state["problems"]
    principle = state["today_principle"]
    discipline = state["discipline_info"]

    if not problems:
        return {"raw_ideas": []}

    llm = get_llm(temperature=0.9, max_tokens=4096)

    problems_text = json.dumps(problems, ensure_ascii=False, indent=2)

    prompt = f"""당신은 AI와 {discipline.get('name', '')}을(를) 융합하는 혁신 아이디어 생성 전문가입니다.

핵심 학문 원리: {principle.get('title', '')}
원리 설명: {principle.get('explanation', '')}

다음 문제/기회들에 대해 각각 구체적이고 창의적인 융합 아이디어를 생성하세요:
{problems_text}

각 아이디어는 반드시 다음을 포함해야 합니다:
- concept_name: 아이디어의 이름 (한국어, 창의적이고 기억에 남는)
- problem_addressed: 해결하려는 문제
- description: 아이디어 상세 설명 3-4문장 (한국어)
- key_innovation: 핵심 혁신 포인트 1문장
- target_users: 이 아이디어의 대상 사용자
- implementation_sketch: 구현 방향 2-3문장 (한국어)
- required_tech: 필요한 기술/자원 목록

실현 가능하면서도 혁신적인 아이디어를 제안하세요.
단순한 아이디어가 아니라 구체적인 구현 방향까지 제시해주세요.

반드시 JSON 배열로만 응답하세요."""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        text = response.content.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        if text.startswith("json"):
            text = text[4:].strip()

        ideas = json.loads(text)
        print(f"  ✓ {len(ideas)}개 융합 아이디어 생성 완료")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  ⚠ 아이디어 생성 파싱 실패: {e}")
        ideas = []

    return {"raw_ideas": ideas}


# ─── Agent 3: FeasibilityCheckerAgent ───
def feasibility_checker_node(state: IdeaState) -> dict:
    """아이디어의 실현가능성, 혁신성, 영향력 평가 (LLM 1회)"""
    print("\n📊 [FeasibilityCheckerAgent] 실현가능성 평가 중...")

    ideas = state["raw_ideas"]
    if not ideas:
        return {"evaluated_ideas": []}

    llm = get_llm(temperature=0.3, max_tokens=4096)

    ideas_text = json.dumps(ideas, ensure_ascii=False, indent=2)

    prompt = f"""당신은 기술 혁신의 실현가능성을 평가하는 전문가입니다.

다음 AI 융합 아이디어들을 엄격하게 평가해주세요:
{ideas_text}

각 아이디어에 대해 다음 기준으로 1~10점을 매기세요:
- feasibility_score: 기술적 실현가능성 (현재 기술로 가능한가?)
- novelty_score: 혁신성 (기존에 없는 새로운 접근인가?)
- impact_score: 영향력 (실제로 구현되면 얼마나 가치 있는가?)
- challenges: 주요 도전 과제 2-3개 (한국어, 배열)
- improvements: 아이디어를 더 좋게 만들 수 있는 제안 1-2개 (한국어, 배열)

반드시 JSON 배열로만 응답하세요. 원래 필드를 모두 유지하고 평가 필드를 추가하세요."""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        text = response.content.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        if text.startswith("json"):
            text = text[4:].strip()

        evaluated = json.loads(text)

        # 종합 점수 계산 및 정렬
        for idea in evaluated:
            f = idea.get("feasibility_score", 5)
            n = idea.get("novelty_score", 5)
            i = idea.get("impact_score", 5)
            idea["total_score"] = f + n + i

        evaluated.sort(key=lambda x: x.get("total_score", 0), reverse=True)
        print(f"  ✓ {len(evaluated)}개 아이디어 평가 완료")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  ⚠ 평가 파싱 실패, 원본 사용: {e}")
        evaluated = ideas
        for idea in evaluated:
            idea["feasibility_score"] = 5
            idea["novelty_score"] = 5
            idea["impact_score"] = 5
            idea["total_score"] = 15

    return {"evaluated_ideas": evaluated}


# ─── Agent 4: SynthesizerAgent ───
def synthesizer_node(state: IdeaState) -> dict:
    """최종 아이디어를 선별하고 스토리텔링 형식으로 정리 (LLM 1회)"""
    print("\n✨ [SynthesizerAgent] 최종 아이디어 정리 및 스토리텔링 중...")

    ideas = state["evaluated_ideas"]
    news = state["news_articles"]
    principle = state["today_principle"]
    discipline = state["discipline_info"]

    if not ideas:
        return {"final_ideas": []}

    # 상위 3개 선택
    top_ideas = ideas[:3]

    llm = get_llm(temperature=0.8, max_tokens=4096)

    ideas_text = json.dumps(top_ideas, ensure_ascii=False, indent=2)
    news_titles = ", ".join([a.get("title", "") for a in news[:3]])

    prompt = f"""당신은 혁신 아이디어를 매력적인 스토리로 전달하는 전문가입니다.

배경:
- 오늘의 AI 뉴스: {news_titles}
- 오늘의 학문 원리: {principle.get('title', '')} ({discipline.get('name', '')})
- 평가된 아이디어: {len(top_ideas)}개

다음 상위 아이디어들을 한국어로 최종 정리해주세요:
{ideas_text}

각 아이디어를 다음 형식으로 작성하세요:
- concept_name: 아이디어 이름
- narrative: 스토리텔링 형식의 설명 (3-5문단, 각 2-3문장)
  * 1문단: 문제 인식 - 현재 AI의 한계 또는 미해결 과제
  * 2문단: 학문 원리 연결 - {discipline.get('name', '')}의 원리가 주는 영감
  * 3문단: 핵심 아이디어 - 구체적인 융합 솔루션
  * 4문단: 기대 효과 - 실현되면 어떤 변화가 생기는지
  * (선택) 5문단: 실행 가능한 첫 걸음
- tags: 관련 키워드 태그 3-5개 (한국어)

흥미롭고, 영감을 주며, 실용적인 톤으로 작성하세요.
AI를 공부하는 사람이 "이거 해보고 싶다!"라고 느낄 수 있게 작성하세요.

반드시 JSON 배열로만 응답하세요. 원래 필드(점수 등)를 유지하고 narrative와 tags를 추가하세요."""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        text = response.content.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        if text.startswith("json"):
            text = text[4:].strip()

        final_ideas = json.loads(text)

        # 뉴스/원리 소스 정보 추가
        for idea in final_ideas:
            idea["news_source"] = {
                "title": news[0].get("title", "") if news else "",
                "link": news[0].get("link", "") if news else "",
            }
            idea["principle_source"] = {
                "title": principle.get("title", ""),
                "category": discipline.get("key", ""),
                "superCategory": discipline.get("superCategory", ""),
            }

        print(f"  ✓ {len(final_ideas)}개 최종 아이디어 정리 완료")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  ⚠ 최종 정리 파싱 실패, 원본 사용: {e}")
        final_ideas = top_ideas

    return {"final_ideas": final_ideas}


# ─── 융합 아이디어 에이전트 팀 그래프 빌드 ───
def build_idea_team_graph():
    """융합 아이디어 생성 에이전트 팀 그래프"""
    graph = StateGraph(IdeaState)

    graph.add_node("problem_identifier", problem_identifier_node)
    graph.add_node("idea_generator", idea_generator_node)
    graph.add_node("feasibility_checker", feasibility_checker_node)
    graph.add_node("synthesizer", synthesizer_node)

    graph.add_edge(START, "problem_identifier")
    graph.add_edge("problem_identifier", "idea_generator")
    graph.add_edge("idea_generator", "feasibility_checker")
    graph.add_edge("feasibility_checker", "synthesizer")
    graph.add_edge("synthesizer", END)

    return graph.compile()


def run_idea_team(news_articles: list[dict], today_principle: dict, discipline_info: dict) -> dict:
    """융합 아이디어 에이전트 팀 실행"""
    print("=" * 60)
    print("🚀 융합 아이디어 에이전트 팀 시작")
    print("=" * 60)

    graph = build_idea_team_graph()
    initial_state = {
        "news_articles": news_articles,
        "today_principle": today_principle,
        "discipline_info": discipline_info,
        "problems": [],
        "raw_ideas": [],
        "evaluated_ideas": [],
        "final_ideas": [],
    }

    result = graph.invoke(initial_state)

    print(f"\n✅ 융합 아이디어 에이전트 팀 완료: {len(result['final_ideas'])}개 아이디어 생성")
    return result
