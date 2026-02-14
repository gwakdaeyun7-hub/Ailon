"""
학문 원리 그래프 - LangGraph 기반 학문 원리 생성

4 노드 선형 파이프라인 (학문당):
  expert → relevance → review → friendly

3개 인접 학문 순환 처리
"""

import json
from typing import TypedDict

from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END

from agents.config import (
    get_llm,
    get_today_discipline_key,
    get_discipline_info,
    get_adjacent_discipline_keys,
    DISCIPLINES,
)


class KnowledgeGraphState(TypedDict):
    discipline_key: str
    discipline_info: dict
    raw_principles: list
    enriched_principles: list
    reviewed_principle: dict
    final_principle: dict


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


# ─── Node 1: expert ───
def expert_node(state: KnowledgeGraphState) -> dict:
    info = state["discipline_info"]
    llm = get_llm(temperature=0.8, max_tokens=4096)
    prompt = f"""안녕하세요! {info['name']} 분야의 가장 핵심적이고 AI와 연결이 깊은 원리 1개를 생성해주세요.

학문 분야: {info['name']}
초점 영역: {info['focus']}
AI와의 연결: {info['ai_connection']}

다음 필드를 포함한 JSON 배열로 응답하세요 (원리 1개):
[
  {{
    "title": "원리 이름 (한국어)",
    "hook": "알고 계셨나요? ... (흥미로운 도입, ~이에요/~해요 체)",
    "description": "한 줄 요약이에요 (~이에요/~해요 체)",
    "explanation": "상세 설명 2-3문장이에요 (~이에요/~해요 체, 비전공자 친화적)",
    "everydayAnalogy": "일상 비유 2-3문장이에요 (~이에요/~해요 체, 요리/게임/SNS/쇼핑 비유)",
    "realWorldExample": "실생활 예시 1-2문장이에요 (~이에요/~해요 체)",
    "applicationIdeas": ["AI 적용 아이디어 1이에요", "AI 적용 아이디어 2예요", "AI 적용 아이디어 3이에요"]
  }}
]

모든 텍스트는 반드시 친근한 ~이에요/~해요 체로 작성해주세요."""
    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        raw_principles = parse_llm_json(result.content)
        if isinstance(raw_principles, list) and len(raw_principles) > 1:
            raw_principles = [raw_principles[0]]
    except Exception as e:
        print(f"  [WARNING] expert_node 파싱 실패: {e}")
        raw_principles = [{
            "title": f"{info['name']}의 핵심 원리",
            "hook": f"알고 계셨나요? {info['name']}에는 AI와 깊이 연결된 흥미로운 원리들이 숨어 있어요!",
            "description": f"{info['name']}의 핵심 개념이에요.",
            "explanation": f"{info['focus']}에 관한 기본 원리예요.",
            "everydayAnalogy": "이건 마치 퍼즐을 맞추는 것과 비슷해요.",
            "realWorldExample": "다양한 분야에서 활용되고 있어요.",
            "applicationIdeas": [info['ai_connection']],
        }]
    print(f"  [OK] [{info['name']}] expert_node 완료: {raw_principles[0].get('title', 'N/A')}")
    return {"raw_principles": raw_principles}


# ─── Node 2: relevance ───
def relevance_node(state: KnowledgeGraphState) -> dict:
    info = state["discipline_info"]
    discipline_key = state["discipline_key"]
    llm = get_llm(temperature=0.7, max_tokens=4096)
    other_disciplines = []
    for super_cat, disc_dict in DISCIPLINES.items():
        for key, disc_info in disc_dict.items():
            if key != discipline_key:
                other_disciplines.append(f"{disc_info['name']} ({super_cat})")
    principles_text = json.dumps(state["raw_principles"], ensure_ascii=False, indent=2)
    prompt = f"""다음 {info['name']} 원리에 AI 관련성과 타 학문 연결고리를 추가해주세요.

원리:
{principles_text}

다른 학문 분야: {', '.join(other_disciplines[:8])}

각 원리에 다음을 추가하세요 (모든 텍스트 ~이에요/~해요 체):
- aiRelevance: "이것이 AI에 중요한 이유: [GPT/Claude/AlphaFold 등 구체적 AI 기술 언급, 3-4문장]"
- crossDisciplineLinks: 2-3개 타 학문 연결 ["학문명: 연결 이유예요"]
- difficulty: "beginner" | "intermediate" | "advanced"

기존 모든 필드를 유지하고 새 필드를 추가한 JSON 배열로 응답하세요."""
    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        enriched = parse_llm_json(result.content)
    except Exception as e:
        print(f"  [WARNING] relevance_node 파싱 실패: {e}")
        enriched = state["raw_principles"]
        for p in enriched:
            p.setdefault("aiRelevance", f"이것이 AI에 중요한 이유: {info.get('ai_connection', '')}와 깊이 연결되어 있어요.")
            p.setdefault("crossDisciplineLinks", [])
            p.setdefault("difficulty", "intermediate")
    print(f"  [OK] [{info['name']}] relevance_node 완료")
    return {"enriched_principles": enriched}


# ─── Node 3: review ───
def review_node(state: KnowledgeGraphState) -> dict:
    info = state["discipline_info"]
    discipline_key = state["discipline_key"]
    llm = get_llm(temperature=0.5, max_tokens=4096)
    enriched_text = json.dumps(state["enriched_principles"], ensure_ascii=False, indent=2)
    prompt = f"""다음 {info['name']} 원리를 검수하고 최종 버전을 작성해주세요.

원리:
{enriched_text}

검수 및 수정 사항:
1. ~이다/~한다 체 -> ~이에요/~해요 체로 모두 수정
2. 설명이 너무 전문적이면 쉽게 수정
3. AI 관련성이 피상적이면 구체적 AI 기술 언급으로 보강
4. 가장 품질 좋은 원리 1개 선택
5. learn_more_links 2-3개 추가 (ko.wikipedia.org 우선)

다음 JSON 형식으로 응답하세요:
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
      {{"type": "wikipedia", "title": "...", "url": "https://ko.wikipedia.org/wiki/..."}},
      {{"type": "youtube", "title": "...", "url": "https://www.youtube.com/watch?v=..."}},
      {{"type": "article", "title": "...", "url": "https://..."}}
    ]
  }}
}}"""
    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        reviewed = parse_llm_json(result.content)
        reviewed_principle = reviewed.get("principle", reviewed)
    except Exception as e:
        print(f"  [WARNING] review_node 파싱 실패: {e}")
        reviewed_principle = state["enriched_principles"][0] if state["enriched_principles"] else {}
    reviewed_principle["category"] = discipline_key
    reviewed_principle["superCategory"] = info.get("superCategory", "")
    reviewed_principle.setdefault("learn_more_links", [])
    print(f"  [OK] [{info['name']}] review_node 완료")
    return {"reviewed_principle": reviewed_principle}


# ─── Node 4: friendly ───
def friendly_node(state: KnowledgeGraphState) -> dict:
    info = state["discipline_info"]
    discipline_key = state["discipline_key"]
    llm = get_llm(temperature=0.9, max_tokens=4096)
    best_text = json.dumps([state["reviewed_principle"]], ensure_ascii=False, indent=2)
    prompt = f"""다음 {info['name']} 원리를 더 친근하고 이해하기 쉽게 보강해주세요.

원리:
{best_text}

수행 작업:
1. everydayAnalogy를 카카오톡/넷플릭스/배달의민족/유튜브/인스타그램/쿠팡 등 한국 앱 비유로 강화
2. 모든 텍스트 ~이에요/~해요 체 확인 및 수정
3. friendlyExplanation 추가: 구체적 한국 앱 이름을 활용한 2-3문장 설명
4. simpleSummary 추가: 중학생도 이해할 수 있는 한 줄 요약

기존 모든 필드를 유지하고 새 필드를 추가한 JSON 배열로 응답하세요:
[
  {{
    "friendlyExplanation": "카카오톡/넷플릭스 등 구체적 앱 비유 2-3문장이에요",
    "simpleSummary": "중학생도 이해할 수 있는 한 줄 요약이에요"
  }}
]"""
    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        friendly = parse_llm_json(result.content)
        final_principle = friendly[0] if friendly else {}
        for k, v in state["reviewed_principle"].items():
            if k not in final_principle:
                final_principle[k] = v
    except Exception as e:
        print(f"  [WARNING] friendly_node 파싱 실패: {e}")
        final_principle = state["reviewed_principle"]
    final_principle["category"] = discipline_key
    final_principle["superCategory"] = info.get("superCategory", "")
    final_principle.setdefault("learn_more_links", [])
    final_principle.setdefault("friendlyExplanation", final_principle.get("everydayAnalogy", ""))
    final_principle.setdefault("simpleSummary", final_principle.get("description", ""))
    print(f"  [OK] [{info['name']}] friendly_node 완료: {final_principle.get('title', 'N/A')}")
    return {"final_principle": final_principle}


# ─── 그래프 구성 ───
def _build_knowledge_graph():
    g = StateGraph(KnowledgeGraphState)
    g.add_node("expert", expert_node)
    g.add_node("relevance", relevance_node)
    g.add_node("review", review_node)
    g.add_node("friendly", friendly_node)
    g.set_entry_point("expert")
    g.add_edge("expert", "relevance")
    g.add_edge("relevance", "review")
    g.add_edge("review", "friendly")
    g.add_edge("friendly", END)
    return g.compile()


_knowledge_app = _build_knowledge_graph()


def run_knowledge_graph(discipline_key: str = None) -> dict:
    """학문 원리 그래프 실행 (generate_daily.py 호환)"""
    center_key = discipline_key or get_today_discipline_key()
    keys_to_process = get_adjacent_discipline_keys(center_key)

    print("=" * 60)
    print(f"[START] 학문 원리 그래프 시작 (LangGraph, {len(keys_to_process)}개 학문 분야)")
    for k in keys_to_process:
        k_info = get_discipline_info(k)
        print(f"   * {k_info.get('name', k)} ({k_info.get('superCategory', '')})")
    print("=" * 60)

    disciplines_results = []
    all_principles = []

    for dk in keys_to_process:
        info = get_discipline_info(dk)
        if not info:
            print(f"\n[WARNING] 학문 분야 '{dk}'를 찾을 수 없어요.")
            continue
        print(f"\n{'─' * 40}\n[{info['name']}] 그래프 파이프라인 시작\n{'─' * 40}")
        try:
            initial: KnowledgeGraphState = {
                "discipline_key": dk,
                "discipline_info": info,
                "raw_principles": [],
                "enriched_principles": [],
                "reviewed_principle": {},
                "final_principle": {},
            }
            state = _knowledge_app.invoke(initial)
            fp = state["final_principle"]
            disciplines_results.append({
                "discipline_key": dk,
                "discipline_info": info,
                "today_principle": fp,
                "final_principles": [fp],
            })
            all_principles.append(fp)
        except Exception as e:
            print(f"  [ERROR] [{info['name']}] 그래프 실패: {e}")
            disciplines_results.append({
                "discipline_key": dk,
                "discipline_info": info,
                "today_principle": {},
                "final_principles": [],
                "error": str(e),
            })

    center_idx = len(disciplines_results) // 2
    best_principle = {}
    if disciplines_results:
        center_result = disciplines_results[center_idx]
        best_principle = center_result.get("today_principle") or {}
        if not best_principle:
            for dr in disciplines_results:
                if dr.get("today_principle"):
                    best_principle = dr["today_principle"]
                    break

    center_info = get_discipline_info(center_key) if center_key else {}
    print(f"\n{'=' * 60}\n[DONE] 학문 원리 그래프 완료: {len(all_principles)}개 원리 생성")
    if best_principle:
        print(f"   오늘의 원리: {best_principle.get('title', 'N/A')}")
    print(f"{'=' * 60}")

    return {
        "discipline_key": center_key,
        "discipline_info": center_info,
        "final_principles": all_principles,
        "today_principle": best_principle,
        "disciplines_results": disciplines_results,
        "all_principles": all_principles,
    }
