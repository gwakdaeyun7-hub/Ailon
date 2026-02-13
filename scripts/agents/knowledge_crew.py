"""
학문 원리 크루 - CrewAI 기반 학문 원리 생성 (LangGraph knowledge_team 대체)

4 CrewAI 에이전트:
DisciplineExpertAgent → AIRelevanceAgent → QualityReviewerAgent → FriendlyExplainerAgent

3개 인접 학문 순환 처리
"""

import json
from crewai import Agent, Task, Crew, Process

from agents.config import (
    get_crewai_llm,
    get_today_discipline_key,
    get_discipline_info,
    get_adjacent_discipline_keys,
    DISCIPLINES,
    ALL_DISCIPLINE_KEYS,
)


def parse_llm_json(text: str):
    """LLM 응답에서 JSON 파싱"""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    if text.startswith("json"):
        text = text[4:].strip()
    return json.loads(text)


def build_knowledge_crew(discipline_key: str, info: dict) -> dict:
    """단일 학문 분야에 대한 4-에이전트 크루 실행"""
    llm = get_crewai_llm(temperature=0.8, max_tokens=4096)
    llm_low = get_crewai_llm(temperature=0.5, max_tokens=4096)

    # ─── Agent 1: DisciplineExpertAgent ───
    expert_agent = Agent(
        role=f"{info['name']} 분야 전문가",
        goal=f"{info['name']} 분야의 핵심 원리를 AI 학습자에게 친근하게 설명",
        backstory=f"{info['name']} 분야의 세계적 전문가로, AI와의 연결고리를 명확하게 설명해요.",
        llm=llm,
        verbose=False,
    )

    expert_task = Task(
        description=f"""안녕하세요! {info['name']} 분야의 가장 핵심적이고 AI와 연결이 깊은 원리 1개를 생성해주세요.

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

모든 텍스트는 반드시 친근한 ~이에요/~해요 체로 작성해주세요.""",
        expected_output="JSON 배열 형식의 원리 1개",
        agent=expert_agent,
    )

    crew1 = Crew(agents=[expert_agent], tasks=[expert_task], process=Process.sequential, verbose=False)

    try:
        result1 = crew1.kickoff()
        raw_principles = parse_llm_json(str(result1))
        if isinstance(raw_principles, list) and len(raw_principles) > 1:
            raw_principles = [raw_principles[0]]
    except Exception as e:
        print(f"  [WARNING] DisciplineExpert 파싱 실패: {e}")
        raw_principles = [{
            "title": f"{info['name']}의 핵심 원리",
            "hook": f"알고 계셨나요? {info['name']}에는 AI와 깊이 연결된 흥미로운 원리들이 숨어 있어요!",
            "description": f"{info['name']}의 핵심 개념이에요.",
            "explanation": f"{info['focus']}에 관한 기본 원리예요.",
            "everydayAnalogy": "이건 마치 퍼즐을 맞추는 것과 비슷해요.",
            "realWorldExample": "다양한 분야에서 활용되고 있어요.",
            "applicationIdeas": [info['ai_connection']],
        }]

    # ─── Agent 2: AIRelevanceAgent ───
    other_disciplines = []
    for super_cat, disc_dict in DISCIPLINES.items():
        for key, disc_info in disc_dict.items():
            if key != discipline_key:
                other_disciplines.append(f"{disc_info['name']} ({super_cat})")

    relevance_agent = Agent(
        role="AI 학제간 연구 전문가",
        goal="학문 원리의 AI 관련성과 타 학문 연결고리 분석",
        backstory="AI와 다양한 학문 분야의 연결을 연구하는 전문가예요. 구체적인 AI 기술/모델 사례를 잘 알아요.",
        llm=llm,
        verbose=False,
    )

    principles_text = json.dumps(raw_principles, ensure_ascii=False, indent=2)

    relevance_task = Task(
        description=f"""다음 {info['name']} 원리에 AI 관련성과 타 학문 연결고리를 추가해주세요.

원리:
{principles_text}

다른 학문 분야: {', '.join(other_disciplines[:8])}

각 원리에 다음을 추가하세요 (모든 텍스트 ~이에요/~해요 체):
- aiRelevance: "이것이 AI에 중요한 이유: [GPT/Claude/AlphaFold 등 구체적 AI 기술 언급, 3-4문장]"
- crossDisciplineLinks: 2-3개 타 학문 연결 ["학문명: 연결 이유예요"]
- difficulty: "beginner" | "intermediate" | "advanced"

기존 모든 필드를 유지하고 새 필드를 추가한 JSON 배열로 응답하세요.""",
        expected_output="AI 관련성이 추가된 JSON 배열",
        agent=relevance_agent,
    )

    crew2 = Crew(agents=[relevance_agent], tasks=[relevance_task], process=Process.sequential, verbose=False)

    try:
        result2 = crew2.kickoff()
        enriched_principles = parse_llm_json(str(result2))
    except Exception as e:
        print(f"  [WARNING] AIRelevance 파싱 실패: {e}")
        enriched_principles = raw_principles
        for p in enriched_principles:
            p["aiRelevance"] = f"이것이 AI에 중요한 이유: {info.get('ai_connection', '')}와 깊이 연결되어 있어요."
            p["crossDisciplineLinks"] = []
            p["difficulty"] = "intermediate"

    # ─── Agent 3: QualityReviewerAgent ───
    reviewer_agent = Agent(
        role="교육 콘텐츠 품질 검수 전문가",
        goal="학문 원리 콘텐츠의 정확성·이해도·실용성 검증 및 learn_more_links 생성",
        backstory="교육 콘텐츠 품질을 책임지는 전문가로, ~이에요/~해요 체 톤 유지와 정확성을 중시해요.",
        llm=llm_low,
        verbose=False,
    )

    enriched_text = json.dumps(enriched_principles, ensure_ascii=False, indent=2)

    review_task = Task(
        description=f"""다음 {info['name']} 원리를 검수하고 최종 버전을 작성해주세요.

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
}}""",
        expected_output="JSON 형식의 최종 원리 1개",
        agent=reviewer_agent,
    )

    crew3 = Crew(agents=[reviewer_agent], tasks=[review_task], process=Process.sequential, verbose=False)

    try:
        result3 = crew3.kickoff()
        reviewed = parse_llm_json(str(result3))
        if "principle" in reviewed:
            best_principle = reviewed["principle"]
        else:
            best_principle = reviewed
    except Exception as e:
        print(f"  [WARNING] QualityReview 파싱 실패: {e}")
        best_principle = enriched_principles[0] if enriched_principles else {}

    best_principle["category"] = discipline_key
    best_principle["superCategory"] = info.get("superCategory", "")
    if "learn_more_links" not in best_principle:
        best_principle["learn_more_links"] = []

    # ─── Agent 4: FriendlyExplainerAgent ───
    friendly_agent = Agent(
        role="친절한 설명가",
        goal="한국 앱(카카오톡/넷플릭스/배달앱 등) 비유로 학문 원리를 더 친근하게 설명",
        backstory="어려운 개념을 누구나 이해할 수 있게 설명하는 천재적인 설명가예요. 한국 10~20대가 매일 쓰는 앱으로 비유해요.",
        llm=get_crewai_llm(temperature=0.9, max_tokens=4096),
        verbose=False,
    )

    best_text = json.dumps([best_principle], ensure_ascii=False, indent=2)

    friendly_task = Task(
        description=f"""다음 {info['name']} 원리를 더 친근하고 이해하기 쉽게 보강해주세요.

원리:
{best_text}

수행 작업:
1. everydayAnalogy를 카카오톡/넷플릭스/배달의민족/유튜브/인스타그램/쿠팡 등 한국 앱 비유로 강화
2. 모든 텍스트 ~이에요/~해요 체 확인 및 수정
3. friendlyExplanation 추가: 구체적 한국 앱 이름을 활용한 2-3문장 설명
   예시: "넷플릭스가 내 취향을 귀신같이 아는 것, 경험해 보셨죠? 이게 바로 협업 필터링이에요."
4. simpleSummary 추가: 중학생도 이해할 수 있는 한 줄 요약

기존 모든 필드를 유지하고 새 필드를 추가한 JSON 배열로 응답하세요:
[
  {{
    "friendlyExplanation": "카카오톡/넷플릭스 등 구체적 앱 비유 2-3문장이에요",
    "simpleSummary": "중학생도 이해할 수 있는 한 줄 요약이에요"
  }}
]""",
        expected_output="friendlyExplanation과 simpleSummary가 추가된 JSON 배열",
        agent=friendly_agent,
    )

    crew4 = Crew(agents=[friendly_agent], tasks=[friendly_task], process=Process.sequential, verbose=False)

    try:
        result4 = crew4.kickoff()
        friendly = parse_llm_json(str(result4))
        final_principle = friendly[0] if friendly else best_principle
        # 기존 필드 보존
        for key, val in best_principle.items():
            if key not in final_principle:
                final_principle[key] = val
        if "category" not in final_principle or not final_principle["category"]:
            final_principle["category"] = discipline_key
        if "superCategory" not in final_principle or not final_principle["superCategory"]:
            final_principle["superCategory"] = info.get("superCategory", "")
        if "learn_more_links" not in final_principle:
            final_principle["learn_more_links"] = []
        if "friendlyExplanation" not in final_principle:
            final_principle["friendlyExplanation"] = final_principle.get("everydayAnalogy", "")
        if "simpleSummary" not in final_principle:
            final_principle["simpleSummary"] = final_principle.get("description", "")
    except Exception as e:
        print(f"  [WARNING] FriendlyExplainer 파싱 실패: {e}")
        final_principle = best_principle
        if "friendlyExplanation" not in final_principle:
            final_principle["friendlyExplanation"] = final_principle.get("everydayAnalogy", "")
        if "simpleSummary" not in final_principle:
            final_principle["simpleSummary"] = final_principle.get("description", "")

    print(f"  [OK] [{info['name']}] 원리 생성 완료: {final_principle.get('title', 'N/A')}")
    return {
        "discipline_key": discipline_key,
        "discipline_info": info,
        "today_principle": final_principle,
        "final_principles": [final_principle],
    }


def run_knowledge_crew(discipline_key: str = None) -> dict:
    """학문 원리 크루 실행 (generate_daily.py 호환)

    Args:
        discipline_key: 중심 학문 분야 키. None이면 오늘 날짜 기반 자동 선택.

    Returns:
        dict: discipline_key, discipline_info, final_principles, today_principle,
              disciplines_results, all_principles (generate_daily.py 완전 호환)
    """
    center_key = discipline_key or get_today_discipline_key()
    keys_to_process = get_adjacent_discipline_keys(center_key)

    print("=" * 60)
    print(f"[START] 학문 원리 크루 시작 (CrewAI, {len(keys_to_process)}개 학문 분야)")
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

        print(f"\n{'─' * 40}")
        print(f"[{info['name']}] 크루 파이프라인 시작")
        print(f"{'─' * 40}")

        try:
            result = build_knowledge_crew(dk, info)
            disciplines_results.append(result)
            all_principles.extend(result.get("final_principles", []))
        except Exception as e:
            print(f"  [ERROR] [{info['name']}] 크루 실패: {e}")
            disciplines_results.append({
                "discipline_key": dk,
                "discipline_info": info,
                "today_principle": {},
                "final_principles": [],
                "error": str(e),
            })

    # 가운데(오늘) 학문의 원리를 best로 사용
    best_principle = {}
    center_idx = len(disciplines_results) // 2
    if disciplines_results:
        center_result = disciplines_results[center_idx]
        if center_result.get("today_principle"):
            best_principle = center_result["today_principle"]
        else:
            for dr in disciplines_results:
                if dr.get("today_principle"):
                    best_principle = dr["today_principle"]
                    break

    center_info = get_discipline_info(center_key) if center_key else {}

    print(f"\n{'=' * 60}")
    print(f"[DONE] 학문 원리 크루 완료: {len(all_principles)}개 원리 생성")
    if best_principle:
        print(f"   오늘의 원리: {best_principle.get('title', 'N/A')}")
    print(f"{'=' * 60}")

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
