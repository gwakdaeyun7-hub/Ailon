"""
융합 아이디어 그래프 - LangGraph 기반 AI+학문 융합 아이디어 생성

5 노드 선형 파이프라인:
  pain_point → problem_identifier → idea_generator → feasibility → problem_solver
"""

import json
from typing import TypedDict

from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END

from agents.config import get_llm
from agents.tools import fetch_pain_points


class IdeaGraphState(TypedDict):
    news_articles: list
    today_principle: dict
    discipline_info: dict
    pain_points: list
    problems: list
    raw_ideas: list
    evaluated_ideas: list
    final_ideas: list


def parse_llm_json(text: str):
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    if text.startswith("json"):
        text = text[4:].strip()
    return json.loads(text)


# ─── Node 1: pain_point ───
def pain_point_node(state: IdeaGraphState) -> dict:
    print("\n[pain_point_node] Reddit RSS + StackExchange + YouTube 고충 수집 중...")
    pain_points = fetch_pain_points()
    print(f"  [OK] {len(pain_points)}개 고충 수집 완료")
    return {"pain_points": pain_points}


# ─── Node 2: problem_identifier ───
def problem_identifier_node(state: IdeaGraphState) -> dict:
    print("\n[problem_identifier_node] 미해결 문제 3개 식별 중...")
    llm = get_llm(temperature=0.8, max_tokens=4096)
    discipline_name = state["discipline_info"].get("name", "알 수 없음")
    today_principle = state["today_principle"]

    news_text = "".join(
        f"- {a['title']}: {a.get('summary', a.get('description', ''))[:150]}\n"
        for a in state["news_articles"][:5]
    )
    top_pains = sorted(state["pain_points"], key=lambda x: x.get("social_score", 0), reverse=True)[:5]
    pain_text = "".join(f"- [{p.get('source', '')}] {p['title']}\n" for p in top_pains)
    principle_text = f"{today_principle.get('title', '알 수 없음')}: {today_principle.get('description', '')}"

    prompt = f"""오늘의 AI 뉴스, {discipline_name} 원리, 사용자 고충을 바탕으로 가장 중요한 미해결 문제 3개를 식별해주세요.

## 오늘의 AI 뉴스
{news_text}

## 오늘의 학문 원리 ({discipline_name})
{principle_text}

## 사용자 고충 (상위 5개)
{pain_text}

반드시 JSON 배열로만 응답하세요:
[
  {{
    "problem_id": 1,
    "title": "문제 제목",
    "description": "문제 설명 2-3문장",
    "pain_source": "어떤 고충에서 발견했는지",
    "urgency": 8,
    "market_size": "크다/중간/작다"
  }}
]"""
    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        problems = parse_llm_json(result.content)
    except Exception as e:
        print(f"  [WARNING] problem_identifier_node 파싱 실패: {e}")
        problems = [{
            "problem_id": 1,
            "title": "AI 도구 접근성 문제",
            "description": "AI 도구들이 너무 복잡하고 비용이 높아 일반 사용자가 활용하기 어려워요.",
            "pain_source": "Reddit 커뮤니티 고충",
            "urgency": 7,
            "market_size": "크다",
        }]
    print(f"  [OK] {len(problems)}개 문제 식별 완료")
    return {"problems": problems}


# ─── Node 3: idea_generator ───
def idea_generator_node(state: IdeaGraphState) -> dict:
    print("\n[idea_generator_node] AI-학문 융합 아이디어 생성 중...")
    llm = get_llm(temperature=0.9, max_tokens=4096)
    discipline_name = state["discipline_info"].get("name", "알 수 없음")
    today_principle = state["today_principle"]
    news_articles = state["news_articles"]
    news_title = news_articles[0]["title"] if news_articles else "AI 뉴스"
    news_link = news_articles[0].get("link", "") if news_articles else ""
    problems_text = json.dumps(state["problems"], ensure_ascii=False, indent=2)

    prompt = f"""다음 문제들을 {discipline_name} 원리와 AI 기술을 융합해 창의적으로 해결하는 아이디어를 생성해주세요.

## 학문 원리
원리명: {today_principle.get('title', '')}
설명: {today_principle.get('description', '')}
AI 관련성: {today_principle.get('aiRelevance', '')}

## 식별된 문제들
{problems_text}

각 문제에 대해 1개씩 총 {len(state['problems'])}개 아이디어를 생성해주세요.

반드시 JSON 배열로만 응답하세요:
[
  {{
    "concept_name": "아이디어 이름",
    "problem_addressed": "해결하는 문제",
    "description": "아이디어 설명 2-3문장",
    "narrative": "스토리텔링 형식의 아이디어 설명",
    "key_innovation": "핵심 혁신 포인트",
    "target_users": "주요 사용자",
    "implementation_sketch": "구현 스케치",
    "required_tech": ["필요 기술 1", "필요 기술 2"],
    "tags": ["태그1", "태그2", "태그3"],
    "news_source": {{"title": "{news_title}", "link": "{news_link}"}},
    "principle_source": {{"title": "{today_principle.get('title','')}", "category": "{today_principle.get('category','')}", "superCategory": "{today_principle.get('superCategory','')}"}},
    "first_step": "오늘 당장 실행할 수 있는 첫 번째 단계"
  }}
]"""
    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        raw_ideas = parse_llm_json(result.content)
    except Exception as e:
        print(f"  [WARNING] idea_generator_node 파싱 실패: {e}")
        raw_ideas = [{
            "concept_name": f"{discipline_name} X AI 융합 솔루션",
            "problem_addressed": state["problems"][0]["title"] if state["problems"] else "AI 접근성 문제",
            "description": f"{discipline_name}의 원리를 AI에 적용한 혁신적인 솔루션이에요.",
            "narrative": "사용자가 일상에서 쉽게 활용할 수 있는 AI 도구예요.",
            "key_innovation": f"{discipline_name} 원리 기반 AI 최적화",
            "target_users": "AI 학습자 및 실무자",
            "implementation_sketch": "Python + LLM API + 웹 인터페이스",
            "required_tech": ["Python", "LLM API", "React"],
            "tags": ["AI", discipline_name, "혁신"],
            "news_source": {"title": news_title, "link": news_link},
            "principle_source": {
                "title": today_principle.get("title", ""),
                "category": today_principle.get("category", ""),
                "superCategory": today_principle.get("superCategory", ""),
            },
            "first_step": "아이디어 검증을 위한 프로토타입 제작 시작",
        }]
    print(f"  [OK] {len(raw_ideas)}개 아이디어 생성 완료")
    return {"raw_ideas": raw_ideas}


# ─── Node 4: feasibility ───
def feasibility_node(state: IdeaGraphState) -> dict:
    print("\n[feasibility_node] 3축 평가 + 로드맵 + 시장분석 중...")
    llm = get_llm(temperature=0.7, max_tokens=4096)
    ideas_text = json.dumps(state["raw_ideas"], ensure_ascii=False, indent=2)
    prompt = f"""다음 아이디어들을 평가하고 로드맵과 시장분석을 추가해주세요.

아이디어:
{ideas_text}

각 아이디어에 대해 추가:
1. 3축 평가 (각 1~10점):
   - feasibility_score: 기술적 실현가능성
   - novelty_score: 참신성
   - impact_score: 시장/사용자 임팩트
   - total_score: 세 점수 합

2. technical_roadmap:
   {{"phases": [{{"phase": 1, "title": "단계명", "duration": "기간", "tasks": ["작업1"], "techStack": ["기술1"]}}], "totalDuration": "3개월", "techStack": ["기술 스택"]}}

3. market_feasibility:
   {{"tam": "전체 시장 규모", "competitors": ["경쟁자"], "differentiation": "차별화", "revenueModel": "수익 모델", "feasibilityScore": 7}}

4. challenges: ["도전과제 1", "도전과제 2"]
5. improvements: ["개선 제안 1", "개선 제안 2"]

기존 모든 필드를 유지하고 새 필드를 추가한 JSON 배열로 응답하세요."""
    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        evaluated_ideas = parse_llm_json(result.content)
    except Exception as e:
        print(f"  [WARNING] feasibility_node 파싱 실패: {e}")
        evaluated_ideas = state["raw_ideas"]
        for idea in evaluated_ideas:
            idea.setdefault("feasibility_score", 7)
            idea.setdefault("novelty_score", 7)
            idea.setdefault("impact_score", 7)
            idea.setdefault("total_score", 21)
            idea.setdefault("challenges", [])
            idea.setdefault("improvements", [])
            idea.setdefault("technical_roadmap", {
                "phases": [], "totalDuration": "3개월",
                "techStack": idea.get("required_tech", []),
            })
            idea.setdefault("market_feasibility", {
                "tam": "", "competitors": [],
                "differentiation": idea.get("key_innovation", ""),
                "revenueModel": "", "feasibilityScore": 7,
            })
    print(f"  [OK] {len(evaluated_ideas)}개 아이디어 평가 완료")
    return {"evaluated_ideas": evaluated_ideas}


# ─── Node 5: problem_solver ───
def problem_solver_node(state: IdeaGraphState) -> dict:
    print("\n[problem_solver_node] 1위 아이디어 구체적 구현 방법 제시 중...")
    llm = get_llm(temperature=0.7, max_tokens=4096)
    evaluated_ideas = sorted(state["evaluated_ideas"], key=lambda x: x.get("total_score", 0), reverse=True)
    top_idea = evaluated_ideas[0] if evaluated_ideas else {}

    if top_idea:
        top_idea_text = json.dumps(top_idea, ensure_ascii=False, indent=2)
        prompt = f"""다음 최우수 아이디어의 구체적인 구현 방법을 제시해주세요.

아이디어:
{top_idea_text}

시간대별 구체적 구현 방법 (오늘/이번주/이번달):
JSON 형식으로만 응답하세요:
{{
  "today": "오늘 당장 할 수 있는 구체적인 첫 단계 (코드/명령어/프롬프트 포함)",
  "this_week": "이번 주 목표와 구체적 작업 내용",
  "this_month": "이번 달 목표와 마일스톤"
}}"""
        try:
            result = llm.invoke([HumanMessage(content=prompt)])
            implementation = parse_llm_json(result.content)
            top_idea["implementation_plan"] = implementation
            if "today" in implementation:
                top_idea["first_step"] = implementation["today"]
        except Exception as e:
            print(f"  [WARNING] problem_solver_node 파싱 실패: {e}")
            top_idea.setdefault("implementation_plan", {
                "today": top_idea.get("first_step", "프로토타입 설계 시작"),
                "this_week": "핵심 기능 MVP 개발",
                "this_month": "베타 버전 출시 및 사용자 피드백 수집",
            })

    final_ideas = evaluated_ideas[:3]
    print(f"  [OK] 구현 방법 제시 완료: {top_idea.get('concept_name', 'N/A')}")
    return {"evaluated_ideas": evaluated_ideas, "final_ideas": final_ideas}


# ─── 그래프 구성 ───
_idea_graph = StateGraph(IdeaGraphState)
_idea_graph.add_node("pain_point", pain_point_node)
_idea_graph.add_node("problem_identifier", problem_identifier_node)
_idea_graph.add_node("idea_generator", idea_generator_node)
_idea_graph.add_node("feasibility", feasibility_node)
_idea_graph.add_node("problem_solver", problem_solver_node)
_idea_graph.set_entry_point("pain_point")
_idea_graph.add_edge("pain_point", "problem_identifier")
_idea_graph.add_edge("problem_identifier", "idea_generator")
_idea_graph.add_edge("idea_generator", "feasibility")
_idea_graph.add_edge("feasibility", "problem_solver")
_idea_graph.add_edge("problem_solver", END)
_idea_app = _idea_graph.compile()


def run_idea_graph(
    news_articles: list = None,
    today_principle: dict = None,
    discipline_info: dict = None,
) -> dict:
    """융합 아이디어 그래프 실행 (generate_daily.py 호환)"""
    print("=" * 60)
    print("[START] 융합 아이디어 그래프 시작 (LangGraph, 5 노드)")
    print("=" * 60)
    initial: IdeaGraphState = {
        "news_articles": news_articles or [],
        "today_principle": today_principle or {},
        "discipline_info": discipline_info or {},
        "pain_points": [],
        "problems": [],
        "raw_ideas": [],
        "evaluated_ideas": [],
        "final_ideas": [],
    }
    result = _idea_app.invoke(initial)
    print(f"\n[DONE] 융합 아이디어 그래프 완료")
    print(f"  문제: {len(result['problems'])}개 → 아이디어: {len(result['raw_ideas'])}개 → 최종: {len(result['final_ideas'])}개")
    return {
        "pain_points": result["pain_points"],
        "problems": result["problems"],
        "raw_ideas": result["raw_ideas"],
        "evaluated_ideas": result["evaluated_ideas"],
        "final_ideas": result["final_ideas"],
    }
