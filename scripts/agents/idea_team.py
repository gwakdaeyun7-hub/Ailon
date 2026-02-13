"""
융합 아이디어 에이전트 팀 - LangGraph 기반 AI+학문 융합 아이디어 생성
PainPointHunterNode → ProblemIdentifierAgent → IdeaGeneratorAgent → FeasibilityCheckerAgent
→ TechnicalRoadmapAgent → MarketAnalysisAgent → SynthesizerAgent → ProblemSolverAgent
오늘의 뉴스와 학문 원리를 결합하여 창의적이고 실용적인 아이디어를 생성합니다.

v3: PainPointHunterNode, ProblemSolverAgent 추가 / FeasibilityChecker 3축 평가 개편
"""

import json
from typing import TypedDict
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END

from agents.config import get_llm
from agents.tools import fetch_pain_points


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
class IdeaState(TypedDict):
    news_articles: list[dict]
    today_principle: dict
    discipline_info: dict
    pain_points: list[dict]
    problems: list[dict]
    raw_ideas: list[dict]
    evaluated_ideas: list[dict]
    roadmap_ideas: list[dict]
    market_ideas: list[dict]
    final_ideas: list[dict]


# ─── Agent 0: PainPointHunterNode ───
def pain_point_hunter_node(state: IdeaState) -> dict:
    """3개 Tool로 사용자/개발자 고충을 수집하여 state에 저장"""
    print("\n\U0001f50d [PainPointHunter] 3개 Tool로 사용자/개발자 고충 수집 중...")

    pain_points = state.get("pain_points") or []
    if not pain_points:
        pain_points = fetch_pain_points()

    print(f"  \u2713 PainPoint {len(pain_points)}개 수집 완료")
    return {"pain_points": pain_points}


# ─── Agent 1: ProblemIdentifierAgent ───
def problem_identifier_node(state: IdeaState) -> dict:
    """뉴스 + 원리 + PainPoints를 바탕으로 미해결 문제 및 개선 기회를 식별 (LLM 1회)"""
    print("\n\U0001f50e [ProblemIdentifierAgent] 미해결 문제 및 개선 기회 식별 중...")

    news = state["news_articles"]
    principle = state["today_principle"]
    discipline = state["discipline_info"]
    pain_points = state.get("pain_points", [])

    llm = get_llm(temperature=0.8, max_tokens=3072)

    # 뉴스 요약
    news_text = ""
    for a in news[:5]:
        news_text += f"- {a['title']}: {a.get('summary', a.get('description', ''))[:150]}\n"

    # PainPoint 요약 (상위 5개)
    pain_text = ""
    top_pains = sorted(pain_points, key=lambda x: x.get("social_score", 0), reverse=True)[:5]
    for p in top_pains:
        pain_text += f"- [{p.get('pain_type', 'unknown')}] {p['title']}: {p.get('description', '')[:120]} (source: {p.get('source', '')}, score: {p.get('social_score', 0)})\n"

    prompt = f"""당신은 AI 연구의 미해결 문제와 혁신 기회를 찾는 전문가입니다.

오늘의 AI 뉴스:
{news_text}

커뮤니티/개발자/사용자 고충 (PainPoints):
{pain_text if pain_text else "(수집된 PainPoint 없음)"}

오늘의 학문 원리:
- 분야: {discipline.get('name', '')} ({discipline.get('superCategory', '')})
- 원리: {principle.get('title', '')}
- 설명: {principle.get('explanation', '')}
- AI 관련성: {principle.get('aiRelevance', discipline.get('ai_connection', ''))}

위 정보(뉴스 + 커뮤니티/개발자/사용자 고충 + 학문 원리)를 종합적으로 분석하여 다음을 식별해주세요:
1. 현재 AI가 아직 해결하지 못하고 있는 구체적인 문제 3개
   - PainPoints에서 드러나는 실제 사용자/개발자 불만과 뉴스 트렌드를 결합하세요
2. {discipline.get('name', '')}의 원리를 AI에 접목하면 해결하거나 크게 개선할 수 있는 기회

각 문제에 대해:
- problem: 문제/기회의 이름
- description: 왜 이것이 중요한 문제인지 2-3문장
- current_limitation: 현재 AI의 한계가 무엇인지
- discipline_opportunity: {discipline.get('name', '')} 원리가 어떻게 도움될 수 있는지
- pain_evidence: 이 문제를 뒷받침하는 커뮤니티/사용자 반응 근거 1문장

반드시 JSON 배열로만 응답하세요:
[{{"problem": "...", "description": "...", "current_limitation": "...", "discipline_opportunity": "...", "pain_evidence": "..."}}]"""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        problems = parse_llm_json(response.content)
        print(f"  \u2713 {len(problems)}개 문제/기회 식별 완료")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  \u26a0 문제 식별 파싱 실패: {e}")
        problems = [{
            "problem": f"AI + {discipline.get('name', '')} 융합 과제",
            "description": "AI와 해당 학문의 융합을 통한 혁신 기회",
            "current_limitation": "현재 접근 방식의 한계",
            "discipline_opportunity": "학문 원리를 통한 해결 가능성",
            "pain_evidence": "커뮤니티에서 보고된 일반적인 문제",
        }]

    return {"problems": problems}


# ─── Agent 2: IdeaGeneratorAgent ───
def idea_generator_node(state: IdeaState) -> dict:
    """식별된 문제에 대한 구체적인 융합 아이디어 생성 (LLM 1-2회)"""
    print("\n\U0001f4a1 [IdeaGeneratorAgent] 융합 아이디어 생성 중...")

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
        ideas = parse_llm_json(response.content)
        print(f"  \u2713 {len(ideas)}개 융합 아이디어 생성 완료")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  \u26a0 아이디어 생성 파싱 실패: {e}")
        ideas = []

    return {"raw_ideas": ideas}


# ─── Agent 3: FeasibilityCheckerAgent (3축 평가 개편) ───
def feasibility_checker_node(state: IdeaState) -> dict:
    """아이디어의 시장규모, 실용성, 실현가능성 3축 평가 (LLM 1회)"""
    print("\n\U0001f4ca [FeasibilityCheckerAgent] 3축 실현가능성 평가 중...")

    ideas = state["raw_ideas"]
    if not ideas:
        return {"evaluated_ideas": []}

    llm = get_llm(temperature=0.3, max_tokens=4096)

    ideas_text = json.dumps(ideas, ensure_ascii=False, indent=2)

    prompt = f"""당신은 기술 혁신의 실현가능성을 평가하는 전문가입니다.

다음 AI 융합 아이디어들을 엄격하게 평가해주세요:
{ideas_text}

각 아이디어에 대해 다음 3가지 기준으로 1~10점을 매기세요:

1. market_size_score (시장 규모, 1-10): 이 문제를 해결하면 얼마나 큰 시장인가?
   - 1-3: 니치 시장 (소수만 필요)
   - 4-6: 중간 규모 시장
   - 7-10: 대규모 시장 (수백만 명 이상이 필요)

2. practicality_score (실용성, 1-10): 실제로 사람들이 쓸 것인가?
   - 1-3: 학술적으로만 흥미로움
   - 4-6: 일부 사용자가 채택할 가능성
   - 7-10: 많은 사람이 즉시 사용하고 싶어할 것

3. feasibility_score (실현가능성, 1-10): 현재 기술로 구현 가능한가?
   - 1-3: 핵심 기술이 아직 존재하지 않음
   - 4-6: 기술은 있지만 상당한 R&D 필요
   - 7-10: 기존 기술/도구로 빠르게 구현 가능

또한 각 아이디어에 대해:
- challenges: 주요 도전 과제 2-3개 (한국어, 배열)
- improvements: 아이디어를 더 좋게 만들 수 있는 제안 1-2개 (한국어, 배열)

반드시 JSON 배열로만 응답하세요. 원래 필드를 모두 유지하고 평가 필드를 추가하세요."""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        evaluated = parse_llm_json(response.content)

        # 종합 점수 계산 및 정렬 (3축 합산)
        for idea in evaluated:
            ms = idea.get("market_size_score", 5)
            pr = idea.get("practicality_score", 5)
            fe = idea.get("feasibility_score", 5)
            idea["total_score"] = ms + pr + fe

        evaluated.sort(key=lambda x: x.get("total_score", 0), reverse=True)
        print(f"  \u2713 {len(evaluated)}개 아이디어 3축 평가 완료")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  \u26a0 평가 파싱 실패, 원본 사용: {e}")
        evaluated = ideas
        for idea in evaluated:
            idea["market_size_score"] = 5
            idea["practicality_score"] = 5
            idea["feasibility_score"] = 5
            idea["total_score"] = 15

    return {"evaluated_ideas": evaluated}


# ─── Agent 4: TechnicalRoadmapAgent ───
def technical_roadmap_node(state: IdeaState) -> dict:
    """평가된 아이디어에 대한 기술 로드맵 생성 (LLM 1회)"""
    print("\n\U0001f5fa\ufe0f [TechnicalRoadmapAgent] 기술 로드맵 생성 중...")

    ideas = state["evaluated_ideas"]
    if not ideas:
        return {"roadmap_ideas": []}

    # 상위 3개 아이디어에 대해 로드맵 생성
    top_ideas = ideas[:3]

    llm = get_llm(temperature=0.5, max_tokens=8192)

    ideas_text = json.dumps(top_ideas, ensure_ascii=False, indent=2)

    prompt = f"""당신은 AI 프로젝트의 기술 로드맵을 설계하는 시니어 테크 리드입니다.

다음 AI 융합 아이디어들에 대해 각각 상세한 기술 로드맵을 작성해주세요:
{ideas_text}

각 아이디어의 로드맵은 3개 Phase로 구성되어야 합니다:

Phase 1 - MVP/프로토타입: 최소 기능 구현 (보통 2-4주)
Phase 2 - 핵심 기능 개발: 주요 기능 완성 및 테스트 (보통 4-8주)
Phase 3 - 고도화 및 배포: 성능 최적화, 스케일링, 실제 배포 (보통 4-8주)

각 Phase에는 다음을 포함해주세요:
- 구체적인 태스크 목록 (3-5개)
- 필요한 기술 스택 (프로그래밍 언어, 프레임워크, 라이브러리, 인프라)
- 예상 소요 기간

반드시 JSON 배열로만 응답하세요. 원래 필드를 모두 유지하고 technical_roadmap 필드를 추가하세요:
[
  {{
    "concept_name": "...",
    ... (원래 필드 모두 유지),
    "technical_roadmap": {{
      "phases": [
        {{
          "phase": 1,
          "title": "MVP 프로토타입 개발",
          "duration": "3주",
          "tasks": [
            "데이터 파이프라인 설계 및 구축",
            "핵심 알고리즘 프로토타입 구현",
            "기본 API 엔드포인트 개발",
            "단위 테스트 작성"
          ],
          "techStack": ["Python", "FastAPI", "PyTorch", "PostgreSQL"]
        }},
        {{
          "phase": 2,
          "title": "핵심 기능 완성",
          "duration": "6주",
          "tasks": [
            "모델 학습 파이프라인 구축",
            "실시간 추론 엔진 개발",
            "프론트엔드 대시보드 구현",
            "통합 테스트 및 성능 벤치마크"
          ],
          "techStack": ["React", "Docker", "Redis", "Kubernetes"]
        }},
        {{
          "phase": 3,
          "title": "고도화 및 실전 배포",
          "duration": "6주",
          "tasks": [
            "모델 최적화 및 경량화",
            "CI/CD 파이프라인 구축",
            "모니터링 및 알림 시스템 구축",
            "사용자 피드백 루프 구현",
            "문서화 및 API 가이드 작성"
          ],
          "techStack": ["GitHub Actions", "Prometheus", "Grafana", "AWS/GCP"]
        }}
      ],
      "totalDuration": "15주",
      "techStack": ["Python", "FastAPI", "PyTorch", "React", "Docker", "Kubernetes", "PostgreSQL", "Redis"]
    }}
  }}
]

아이디어의 특성에 맞는 현실적이고 구체적인 기술 스택과 태스크를 선택해주세요.
required_tech 필드에 명시된 기술을 우선 반영하세요."""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        roadmap_ideas = parse_llm_json(response.content)

        # 로드맵이 없는 아이디어가 있으면 기본값 설정
        for idea in roadmap_ideas:
            if "technical_roadmap" not in idea:
                idea["technical_roadmap"] = {
                    "phases": [
                        {
                            "phase": 1,
                            "title": "MVP 프로토타입",
                            "duration": "3주",
                            "tasks": ["핵심 기능 프로토타입 구현", "데이터 수집 및 전처리", "기본 API 개발"],
                            "techStack": ["Python", "FastAPI"],
                        },
                        {
                            "phase": 2,
                            "title": "핵심 기능 개발",
                            "duration": "6주",
                            "tasks": ["모델 학습 및 평가", "프론트엔드 개발", "통합 테스트"],
                            "techStack": ["PyTorch", "React"],
                        },
                        {
                            "phase": 3,
                            "title": "고도화 및 배포",
                            "duration": "6주",
                            "tasks": ["성능 최적화", "배포 자동화", "모니터링 구축"],
                            "techStack": ["Docker", "Kubernetes", "AWS"],
                        },
                    ],
                    "totalDuration": "15주",
                    "techStack": ["Python", "FastAPI", "PyTorch", "React", "Docker"],
                }

        print(f"  \u2713 {len(roadmap_ideas)}개 아이디어 기술 로드맵 생성 완료")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  \u26a0 로드맵 파싱 실패, 기본 로드맵 추가: {e}")
        roadmap_ideas = top_ideas
        for idea in roadmap_ideas:
            idea["technical_roadmap"] = {
                "phases": [
                    {
                        "phase": 1,
                        "title": "MVP 프로토타입",
                        "duration": "3주",
                        "tasks": ["핵심 기능 프로토타입 구현", "데이터 수집 및 전처리", "기본 API 개발"],
                        "techStack": ["Python", "FastAPI"],
                    },
                    {
                        "phase": 2,
                        "title": "핵심 기능 개발",
                        "duration": "6주",
                        "tasks": ["모델 학습 및 평가", "프론트엔드 개발", "통합 테스트"],
                        "techStack": ["PyTorch", "React"],
                    },
                    {
                        "phase": 3,
                        "title": "고도화 및 배포",
                        "duration": "6주",
                        "tasks": ["성능 최적화", "배포 자동화", "모니터링 구축"],
                        "techStack": ["Docker", "Kubernetes", "AWS"],
                    },
                ],
                "totalDuration": "15주",
                "techStack": ["Python", "FastAPI", "PyTorch", "React", "Docker"],
            }

    return {"roadmap_ideas": roadmap_ideas}


# ─── Agent 5: MarketAnalysisAgent ───
def market_analysis_node(state: IdeaState) -> dict:
    """아이디어의 시장 타당성 분석 (LLM 1회)"""
    print("\n\U0001f4c8 [MarketAnalysisAgent] 시장 타당성 분석 중...")

    ideas = state["roadmap_ideas"]
    if not ideas:
        return {"market_ideas": []}

    llm = get_llm(temperature=0.4, max_tokens=8192)

    ideas_text = json.dumps(ideas, ensure_ascii=False, indent=2)

    prompt = f"""당신은 AI 스타트업과 기술 시장 분석 전문가입니다.

다음 AI 융합 아이디어들에 대해 각각 시장 타당성을 분석해주세요:
{ideas_text}

각 아이디어에 대해 다음을 분석해주세요:

1. TAM (Total Addressable Market): 해당 아이디어가 진입할 수 있는 전체 시장 규모를 추정해주세요.
   글로벌 시장 규모를 원 또는 달러 단위로 표현하세요.

2. competitors: 이 분야에서 이미 활동 중인 주요 경쟁자/기업/제품 3-5개를 나열하세요.
   각 경쟁자에 대해 이름과 간단한 설명을 포함하세요.

3. differentiation: 이 아이디어가 기존 경쟁자와 차별화되는 핵심 포인트를 2-3문장으로 설명하세요.
   학문 원리 융합이 만드는 고유한 가치를 강조하세요.

4. revenueModel: 가장 적합한 수익 모델을 제안하세요.
   예: SaaS 구독, API 과금, 프리미엄, B2B 라이선스, 데이터 판매 등.
   1-2문장으로 구체적인 과금 방식을 설명하세요.

5. feasibilityScore: 시장 진입 가능성 점수 0-100 (종합적으로 판단).
   시장 규모, 경쟁 강도, 차별화 수준, 수익 모델 실현 가능성을 종합적으로 고려하세요.

반드시 JSON 배열로만 응답하세요. 원래 필드를 모두 유지하고 market_feasibility 필드를 추가하세요:
[
  {{
    "concept_name": "...",
    ... (원래 필드 모두 유지),
    "market_feasibility": {{
      "tam": "글로벌 AI 헬스케어 시장 약 450억 달러 (2026년 기준)",
      "competitors": [
        "Google Health: 의료 AI 진단 플랫폼",
        "IBM Watson Health: 임상 의사결정 지원",
        "Tempus: 정밀의학 데이터 분석"
      ],
      "differentiation": "기존 의료 AI가 데이터 기반 패턴 매칭에 의존하는 반면, 이 아이디어는 생물학적 원리를 AI 아키텍처에 직접 반영하여 더 정확하고 설명 가능한 진단을 제공합니다.",
      "revenueModel": "의료기관 대상 B2B SaaS 모델. 월간 구독료 기반이며, 분석 건수에 따라 추가 과금하는 하이브리드 모델을 채택합니다.",
      "feasibilityScore": 72
    }}
  }}
]

현실적이고 구체적인 시장 분석을 해주세요. 지나치게 낙관적이거나 비관적이지 않게 균형 잡힌 분석을 부탁드립니다."""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        market_ideas = parse_llm_json(response.content)

        # market_feasibility가 없는 아이디어가 있으면 기본값 설정
        for idea in market_ideas:
            if "market_feasibility" not in idea:
                idea["market_feasibility"] = {
                    "tam": "시장 규모 분석 필요",
                    "competitors": ["분석 대기 중"],
                    "differentiation": "학문 원리 기반 차별화 전략 수립 필요",
                    "revenueModel": "B2B SaaS 모델 검토 필요",
                    "feasibilityScore": 50,
                }

        print(f"  \u2713 {len(market_ideas)}개 아이디어 시장 분석 완료")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  \u26a0 시장 분석 파싱 실패, 기본값 추가: {e}")
        market_ideas = ideas
        for idea in market_ideas:
            idea["market_feasibility"] = {
                "tam": "시장 규모 분석 필요",
                "competitors": ["분석 대기 중"],
                "differentiation": "학문 원리 기반 차별화 전략 수립 필요",
                "revenueModel": "B2B SaaS 모델 검토 필요",
                "feasibilityScore": 50,
            }

    return {"market_ideas": market_ideas}


# ─── Agent 6: SynthesizerAgent ───
def synthesizer_node(state: IdeaState) -> dict:
    """최종 아이디어를 선별하고 스토리텔링 형식으로 정리 (LLM 1회)"""
    print("\n\u2728 [SynthesizerAgent] 최종 아이디어 정리 및 스토리텔링 중...")

    ideas = state["market_ideas"]
    news = state["news_articles"]
    principle = state["today_principle"]
    discipline = state["discipline_info"]

    if not ideas:
        return {"final_ideas": []}

    # 상위 3개 선택
    top_ideas = ideas[:3]

    llm = get_llm(temperature=0.8, max_tokens=8192)

    ideas_text = json.dumps(top_ideas, ensure_ascii=False, indent=2)
    news_titles = ", ".join([a.get("title", "") for a in news[:3]])

    prompt = f"""당신은 혁신 아이디어를 매력적인 스토리로 전달하는 전문가입니다.

배경:
- 오늘의 AI 뉴스: {news_titles}
- 오늘의 학문 원리: {principle.get('title', '')} ({discipline.get('name', '')})
- 평가된 아이디어: {len(top_ideas)}개

다음 상위 아이디어들을 한국어로 최종 정리해주세요.
각 아이디어에는 기술 로드맵(technical_roadmap)과 시장 분석(market_feasibility) 데이터가 이미 포함되어 있습니다.
이 데이터를 활용하여 더 풍부하고 설득력 있는 스토리를 작성해주세요.

{ideas_text}

각 아이디어를 다음 형식으로 작성하세요:
- concept_name: 아이디어 이름
- narrative: 스토리텔링 형식의 설명 (5-6문단, 각 2-3문장)
  * 1문단: 문제 인식 - 현재 AI의 한계 또는 미해결 과제
  * 2문단: 학문 원리 연결 - {discipline.get('name', '')}의 원리가 주는 영감
  * 3문단: 핵심 아이디어 - 구체적인 융합 솔루션
  * 4문단: 기술 로드맵 요약 - 어떤 단계를 거쳐 구현하는지 (technical_roadmap 데이터 활용)
  * 5문단: 시장 기회 - 시장 규모와 차별화 포인트 (market_feasibility 데이터 활용)
  * 6문단: 기대 효과 및 첫 걸음 - 실현되면 어떤 변화가 생기고, 시작하려면 무엇부터 하면 되는지
- tags: 관련 키워드 태그 3-5개 (한국어)

흥미롭고, 영감을 주며, 실용적인 톤으로 작성하세요.
AI를 공부하는 사람이 "이거 해보고 싶다!"라고 느낄 수 있게 작성하세요.

반드시 JSON 배열로만 응답하세요.
원래 필드(점수, technical_roadmap, market_feasibility 등)를 모두 유지하고 narrative와 tags를 추가하세요."""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        final_ideas = parse_llm_json(response.content)

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
            # technical_roadmap과 market_feasibility가 누락된 경우 원본에서 복원
            if "technical_roadmap" not in idea:
                for orig in top_ideas:
                    if orig.get("concept_name") == idea.get("concept_name"):
                        idea["technical_roadmap"] = orig.get("technical_roadmap", {})
                        break
            if "market_feasibility" not in idea:
                for orig in top_ideas:
                    if orig.get("concept_name") == idea.get("concept_name"):
                        idea["market_feasibility"] = orig.get("market_feasibility", {})
                        break

        print(f"  \u2713 {len(final_ideas)}개 최종 아이디어 정리 완료")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  \u26a0 최종 정리 파싱 실패, 원본 사용: {e}")
        final_ideas = top_ideas

    return {"final_ideas": final_ideas}


# ─── Agent 7: ProblemSolverAgent (문제해결사) ───
def problem_solver_node(state: IdeaState) -> dict:
    """최종 아이디어에 대한 구체적인 '첫 걸음 가이드' 제공 (LLM 1회)"""
    print("\n\U0001f6e0\ufe0f [ProblemSolverAgent] 첫 걸음 가이드 생성 중...")

    final_ideas = state["final_ideas"]
    if not final_ideas:
        return {"final_ideas": []}

    # 상위 1-2개 아이디어에 대해 실행 가이드 생성
    target_ideas = final_ideas[:2]

    llm = get_llm(temperature=0.7, max_tokens=4096)

    ideas_text = json.dumps(target_ideas, ensure_ascii=False, indent=2)

    prompt = f"""당신은 아이디어를 실제 행동으로 옮기는 것을 돕는 실행 전문 코치입니다.

다음 AI 융합 아이디어들에 대해 각각 구체적인 "첫 걸음 가이드"를 작성해주세요.
아이디어를 처음 접한 개발자/연구자가 "지금 당장" 시작할 수 있도록 실용적으로 안내하세요.

{ideas_text}

각 아이디어에 대해 다음 4가지를 추가하세요:

1. first_step: "지금 당장 시작하려면" 3단계 (객체 배열)
   - today: 오늘 할 수 있는 것 (1-2문장, 한국어)
   - this_week: 이번 주 안에 할 수 있는 것 (1-2문장, 한국어)
   - this_month: 이번 달 안에 달성할 수 있는 것 (1-2문장, 한국어)

2. minimum_viable_experiment: 가장 작은 실험으로 아이디어를 검증하는 방법 (1-2문장, 한국어)
   - 최소한의 시간/자원으로 "이게 될까?"를 확인할 수 있는 방법

3. key_resources: 필요한 핵심 리소스/도구 3-5개 (문자열 배열, 한국어)
   - 무료 도구를 우선 추천하세요
   - 구체적인 도구명/서비스명을 포함하세요

4. success_metric: 성공 여부를 판단할 수 있는 핵심 지표 1개 (1문장, 한국어)
   - 측정 가능하고 명확한 기준을 제시하세요

반드시 JSON 배열로만 응답하세요. 원래 필드를 모두 유지하고 위 4개 필드를 추가하세요."""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        solved_ideas = parse_llm_json(response.content)

        # 원본 final_ideas에 문제해결 필드 병합
        solved_map = {}
        for idea in solved_ideas:
            name = idea.get("concept_name", "")
            solved_map[name] = {
                "first_step": idea.get("first_step", {}),
                "minimum_viable_experiment": idea.get("minimum_viable_experiment", ""),
                "key_resources": idea.get("key_resources", []),
                "success_metric": idea.get("success_metric", ""),
            }

        updated_ideas = []
        for idea in final_ideas:
            name = idea.get("concept_name", "")
            if name in solved_map:
                idea.update(solved_map[name])
            updated_ideas.append(idea)

        print(f"  \u2713 {len(solved_ideas)}개 아이디어 첫 걸음 가이드 생성 완료")
        return {"final_ideas": updated_ideas}

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  \u26a0 ProblemSolver 파싱 실패, 원본 유지: {e}")
        return {"final_ideas": final_ideas}


# ─── 융합 아이디어 에이전트 팀 그래프 빌드 ───
def build_idea_team_graph():
    """융합 아이디어 생성 에이전트 팀 그래프"""
    graph = StateGraph(IdeaState)

    graph.add_node("pain_point_hunter", pain_point_hunter_node)
    graph.add_node("problem_identifier", problem_identifier_node)
    graph.add_node("idea_generator", idea_generator_node)
    graph.add_node("feasibility_checker", feasibility_checker_node)
    graph.add_node("technical_roadmap", technical_roadmap_node)
    graph.add_node("market_analysis", market_analysis_node)
    graph.add_node("synthesizer", synthesizer_node)
    graph.add_node("problem_solver", problem_solver_node)

    graph.add_edge(START, "pain_point_hunter")
    graph.add_edge("pain_point_hunter", "problem_identifier")
    graph.add_edge("problem_identifier", "idea_generator")
    graph.add_edge("idea_generator", "feasibility_checker")
    graph.add_edge("feasibility_checker", "technical_roadmap")
    graph.add_edge("technical_roadmap", "market_analysis")
    graph.add_edge("market_analysis", "synthesizer")
    graph.add_edge("synthesizer", "problem_solver")
    graph.add_edge("problem_solver", END)

    return graph.compile()


def run_idea_team(
    news_articles: list[dict],
    today_principle: dict,
    discipline_info: dict,
    pain_points: list[dict] = None,
) -> dict:
    """융합 아이디어 에이전트 팀 실행"""
    print("=" * 60)
    print("\U0001f680 융합 아이디어 에이전트 팀 시작")
    print("=" * 60)

    if pain_points is None:
        pain_points = fetch_pain_points()

    graph = build_idea_team_graph()
    initial_state = {
        "news_articles": news_articles,
        "today_principle": today_principle,
        "discipline_info": discipline_info,
        "pain_points": pain_points,
        "problems": [],
        "raw_ideas": [],
        "evaluated_ideas": [],
        "roadmap_ideas": [],
        "market_ideas": [],
        "final_ideas": [],
    }

    result = graph.invoke(initial_state)

    print(f"\n\u2705 융합 아이디어 에이전트 팀 완료: {len(result['final_ideas'])}개 아이디어 생성")
    return result
