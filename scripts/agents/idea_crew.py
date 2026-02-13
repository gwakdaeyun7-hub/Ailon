"""
융합 아이디어 크루 - CrewAI 기반 AI+학문 융합 아이디어 생성 (LangGraph idea_team 대체)

5 CrewAI 에이전트:
PainPointHunter -> ProblemIdentifier -> IdeaGenerator -> FeasibilityChecker -> ProblemSolver
"""

import json
from crewai import Agent, Task, Crew, Process

from agents.config import get_crewai_llm
from agents.tools import fetch_pain_points


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


def run_idea_crew(
    news_articles: list = None,
    today_principle: dict = None,
    discipline_info: dict = None,
) -> dict:
    """융합 아이디어 크루 실행 (generate_daily.py 호환)

    Returns:
        dict: problems, raw_ideas, evaluated_ideas, final_ideas, pain_points
    """
    print("=" * 60)
    print("[START] 융합 아이디어 크루 시작 (CrewAI, 5 에이전트)")
    print("=" * 60)

    news_articles = news_articles or []
    today_principle = today_principle or {}
    discipline_info = discipline_info or {}

    llm = get_crewai_llm(temperature=0.8, max_tokens=4096)
    llm_mid = get_crewai_llm(temperature=0.7, max_tokens=4096)

    # ─── Step 1: PainPointHunter ───
    print("\n[PainPointHunter] Reddit RSS + StackExchange + YouTube 고충 수집 중...")
    pain_points = fetch_pain_points()
    print(f"  [OK] {len(pain_points)}개 고충 수집 완료")

    # ─── Step 2: ProblemIdentifier ───
    print("\n[ProblemIdentifier] 미해결 문제 3개 식별 중...")

    news_text = ""
    for a in news_articles[:5]:
        news_text += f"- {a['title']}: {a.get('summary', a.get('description', ''))[:150]}\n"

    pain_text = ""
    top_pains = sorted(pain_points, key=lambda x: x.get("social_score", 0), reverse=True)[:5]
    for p in top_pains:
        pain_text += f"- [{p.get('source', '')}] {p['title']}\n"

    principle_text = f"{today_principle.get('title', '알 수 없음')}: {today_principle.get('description', '')}"
    discipline_name = discipline_info.get("name", "알 수 없음")

    problem_agent = Agent(
        role="AI 문제 식별 전문가",
        goal="뉴스·원리·사용자 고충을 종합해 가장 중요한 미해결 문제 3개 식별",
        backstory="AI 트렌드와 사용자 페인포인트를 날카롭게 분석하는 전문가예요.",
        llm=llm,
        verbose=False,
    )

    problem_task = Task(
        description=f"""오늘의 AI 뉴스, {discipline_name} 원리, 사용자 고충을 바탕으로 가장 중요한 미해결 문제 3개를 식별해주세요.

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
]""",
        expected_output="JSON 배열 형식의 문제 3개",
        agent=problem_agent,
    )

    crew1 = Crew(agents=[problem_agent], tasks=[problem_task], process=Process.sequential, verbose=False)

    try:
        result1 = crew1.kickoff()
        problems = parse_llm_json(str(result1))
    except Exception as e:
        print(f"  [WARNING] ProblemIdentifier 파싱 실패: {e}")
        problems = [
            {
                "problem_id": 1,
                "title": "AI 도구 접근성 문제",
                "description": "AI 도구들이 너무 복잡하고 비용이 높아 일반 사용자가 활용하기 어려워요.",
                "pain_source": "Reddit 커뮤니티 고충",
                "urgency": 7,
                "market_size": "크다",
            }
        ]

    print(f"  [OK] {len(problems)}개 문제 식별 완료")

    # ─── Step 3: IdeaGenerator ───
    print("\n[IdeaGenerator] AI-학문 융합 아이디어 생성 중...")

    problems_text = json.dumps(problems, ensure_ascii=False, indent=2)
    news_title = news_articles[0]['title'] if news_articles else 'AI 뉴스'
    news_link = news_articles[0].get('link', '') if news_articles else ''

    idea_agent = Agent(
        role="AI-학문 융합 아이디어 생성가",
        goal=f"식별된 문제를 {discipline_name} 원리와 AI 기술을 융합해 창의적 해결책 생성",
        backstory=f"AI와 {discipline_name}을 융합한 혁신적인 아이디어를 만드는 창의적 전문가예요.",
        llm=llm,
        verbose=False,
    )

    idea_task = Task(
        description=f"""다음 문제들을 {discipline_name} 원리와 AI 기술을 융합해 창의적으로 해결하는 아이디어를 생성해주세요.

## 학문 원리
원리명: {today_principle.get('title', '')}
설명: {today_principle.get('description', '')}
AI 관련성: {today_principle.get('aiRelevance', '')}

## 식별된 문제들
{problems_text}

각 문제에 대해 1개씩 총 {len(problems)}개 아이디어를 생성해주세요.

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
]""",
        expected_output="JSON 배열 형식의 아이디어 목록",
        agent=idea_agent,
    )

    crew2 = Crew(agents=[idea_agent], tasks=[idea_task], process=Process.sequential, verbose=False)

    try:
        result2 = crew2.kickoff()
        raw_ideas = parse_llm_json(str(result2))
    except Exception as e:
        print(f"  [WARNING] IdeaGenerator 파싱 실패: {e}")
        raw_ideas = [{
            "concept_name": f"{discipline_name} X AI 융합 솔루션",
            "problem_addressed": problems[0]["title"] if problems else "AI 접근성 문제",
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

    # ─── Step 4: FeasibilityChecker ───
    print("\n[FeasibilityChecker] 3축 평가 + 로드맵 + 시장분석 중...")

    ideas_text = json.dumps(raw_ideas, ensure_ascii=False, indent=2)

    feasibility_agent = Agent(
        role="AI 창업 아이디어 평가 전문가",
        goal="아이디어의 시장규모·실용성·실현가능성 3축 평가 + 로드맵 + 시장분석",
        backstory="스타트업 투자 및 AI 제품 개발 경험이 풍부한 전문가로, 아이디어의 사업성을 날카롭게 평가해요.",
        llm=llm_mid,
        verbose=False,
    )

    feasibility_task = Task(
        description=f"""다음 아이디어들을 평가하고 로드맵과 시장분석을 추가해주세요.

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

기존 모든 필드를 유지하고 새 필드를 추가한 JSON 배열로 응답하세요.""",
        expected_output="평가 및 로드맵이 추가된 JSON 배열",
        agent=feasibility_agent,
    )

    crew3 = Crew(agents=[feasibility_agent], tasks=[feasibility_task], process=Process.sequential, verbose=False)

    try:
        result3 = crew3.kickoff()
        evaluated_ideas = parse_llm_json(str(result3))
    except Exception as e:
        print(f"  [WARNING] FeasibilityChecker 파싱 실패: {e}")
        evaluated_ideas = raw_ideas
        for idea in evaluated_ideas:
            idea.setdefault("feasibility_score", 7)
            idea.setdefault("novelty_score", 7)
            idea.setdefault("impact_score", 7)
            idea.setdefault("total_score", 21)
            idea.setdefault("challenges", [])
            idea.setdefault("improvements", [])
            idea.setdefault("technical_roadmap", {
                "phases": [],
                "totalDuration": "3개월",
                "techStack": idea.get("required_tech", []),
            })
            idea.setdefault("market_feasibility", {
                "tam": "",
                "competitors": [],
                "differentiation": idea.get("key_innovation", ""),
                "revenueModel": "",
                "feasibilityScore": 7,
            })

    print(f"  [OK] {len(evaluated_ideas)}개 아이디어 평가 완료")

    # ─── Step 5: ProblemSolver ─── (1위 아이디어 구체적 구현 방법)
    print("\n[ProblemSolver] 1위 아이디어 구체적 구현 방법 제시 중...")

    evaluated_ideas.sort(key=lambda x: x.get("total_score", 0), reverse=True)
    top_idea = evaluated_ideas[0] if evaluated_ideas else {}

    if top_idea:
        solver_agent = Agent(
            role="AI 구현 전문가",
            goal="최우수 아이디어의 오늘/이번주/이번달 구체적 구현 방법 제시",
            backstory="AI 제품 개발 경험이 풍부한 실전 엔지니어로, 구체적이고 실행 가능한 단계를 제시해요.",
            llm=llm_mid,
            verbose=False,
        )

        top_idea_text = json.dumps(top_idea, ensure_ascii=False, indent=2)

        solver_task = Task(
            description=f"""다음 최우수 아이디어의 구체적인 구현 방법을 제시해주세요.

아이디어:
{top_idea_text}

시간대별 구체적 구현 방법 (오늘/이번주/이번달):
JSON 형식으로만 응답하세요:
{{
  "today": "오늘 당장 할 수 있는 구체적인 첫 단계 (코드/명령어/프롬프트 포함)",
  "this_week": "이번 주 목표와 구체적 작업 내용",
  "this_month": "이번 달 목표와 마일스톤"
}}""",
            expected_output="오늘/이번주/이번달 구현 방법 JSON",
            agent=solver_agent,
        )

        crew4 = Crew(agents=[solver_agent], tasks=[solver_task], process=Process.sequential, verbose=False)

        try:
            result4 = crew4.kickoff()
            implementation = parse_llm_json(str(result4))
            top_idea["implementation_plan"] = implementation
            if "today" in implementation:
                top_idea["first_step"] = implementation["today"]
        except Exception as e:
            print(f"  [WARNING] ProblemSolver 파싱 실패: {e}")
            top_idea.setdefault("implementation_plan", {
                "today": top_idea.get("first_step", "프로토타입 설계 시작"),
                "this_week": "핵심 기능 MVP 개발",
                "this_month": "베타 버전 출시 및 사용자 피드백 수집",
            })

    print(f"  [OK] 구현 방법 제시 완료: {top_idea.get('concept_name', 'N/A')}")

    # ─── 최종 정리 ───
    final_ideas = evaluated_ideas[:3]  # 상위 3개

    print(f"\n[DONE] 융합 아이디어 크루 완료")
    print(f"  문제: {len(problems)}개 -> 아이디어: {len(raw_ideas)}개 -> 최종: {len(final_ideas)}개")

    return {
        "pain_points": pain_points,
        "problems": problems,
        "raw_ideas": raw_ideas,
        "evaluated_ideas": evaluated_ideas,
        "final_ideas": final_ideas,
    }
