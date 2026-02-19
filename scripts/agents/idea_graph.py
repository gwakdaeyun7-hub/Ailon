"""
AI 융합 아이디어 그래프 v2 - 메커니즘 기반 매칭

5 노드 파이프라인:
  mechanism_extractor → ai_problem_scout → cross_pollinator → blueprint_architect → idea_verifier

기능 2의 구조화된 원리 데이터(foundation + application + integration)를 활용하여
AI 문제와 정확하게 매칭합니다.
"""

import json
import os
from typing import TypedDict

from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END

from agents.config import get_llm


class IdeaGraphState(TypedDict):
    news_articles: list
    today_principle: dict
    discipline_info: dict
    core_mechanism: dict
    matched_problems: list
    raw_ideas: list
    evaluated_ideas: list
    final_ideas: list


def parse_llm_json(text: str):
    """LLM JSON 응답 파싱"""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    if text.startswith("json"):
        text = text[4:].strip()
    return json.loads(text)


# ─── Node 1: mechanism_extractor ───
def mechanism_extractor_node(state: IdeaGraphState) -> dict:
    """
    Step 1: 기능 2의 원리에서 핵심 메커니즘 추출
    - foundation + application + integration 전체 활용
    - 다른 분야에 전이 가능한 추상적 패턴 추출
    """
    print("\n[mechanism_extractor_node] 핵심 메커니즘 추출 중...")
    
    today_principle = state["today_principle"]
    discipline_name = state["discipline_info"].get("name", "알 수 없음")
    
    # 기능 2의 3단계 구조 활용
    foundation = today_principle.get("foundation", {})
    application = today_principle.get("application", {})
    integration = today_principle.get("integration", {})
    
    llm = get_llm(temperature=0.6, max_tokens=4096)
    
    prompt = f"""다음은 {discipline_name}의 원리가 다른 학문에 융합된 사례입니다.
이 사례에서 **핵심 메커니즘(추상적 패턴)**을 추출하여 AI 문제에 적용할 수 있도록 변환해주세요.

## 융합 사례 전체
제목: {today_principle.get('title', '')}

### 기본 원리 (Foundation)
- 원리: {foundation.get('principle', '')}
- 핵심 아이디어: {foundation.get('keyIdea', '')}

### 응용 원리 (Application)
- 응용 분야: {application.get('applicationField', '')}
- 메커니즘: {application.get('mechanism', '')}
- 연결 역할: {application.get('bridgeRole', '')}

### 융합 사례 (Integration)
- 해결한 문제: {integration.get('problemSolved', '')}
- 해결 방법: {integration.get('solution', '')}
- 효과적인 이유: {integration.get('whyItWorks', '')}

**과제**: 이 원리의 핵심 메커니즘을 추출하여 AI 문제에 적용할 수 있게 만들어주세요.

JSON 형식으로 응답하세요:
{{
  "coreMechanism": "핵심 메커니즘 한 줄 (예: 점진적 축소를 통한 최적해 탐색)",
  "abstractPattern": "추상적 패턴 설명 (100-150자)",
  "solvableProblems": [
    "이 패턴으로 풀 수 있는 문제 유형 1",
    "이 패턴으로 풀 수 있는 문제 유형 2",
    "이 패턴으로 풀 수 있는 문제 유형 3"
  ],
  "analogyKeywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "mechanismType": "최적화/탐색/구조화/변환/학습/추론 중 하나"
}}"""
    
    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        core_mechanism = parse_llm_json(result.content)
    except Exception as e:
        print(f"  [WARNING] mechanism_extractor_node 파싱 실패: {e}")
        core_mechanism = {
            "coreMechanism": f"{discipline_name} 원리 기반 문제 해결",
            "abstractPattern": "특정 학문의 원리를 AI 문제에 적용하는 패턴",
            "solvableProblems": ["AI 최적화 문제", "AI 탐색 문제", "AI 학습 문제"],
            "analogyKeywords": ["AI", "최적화", "학습"],
            "mechanismType": "최적화",
        }
    
    print(f"  [OK] 핵심 메커니즘: {core_mechanism.get('coreMechanism', 'N/A')}")
    return {"core_mechanism": core_mechanism}


# ─── Node 2: ai_problem_scout ───
def ai_problem_scout_node(state: IdeaGraphState) -> dict:
    """
    Step 2: 메커니즘으로 AI 문제 필터링
    - 기능1에서 수집한 뉴스에서 AI 문제/한계점 추출
    - 메커니즘과 관련된 문제만 필터링
    """
    print("\n[ai_problem_scout_node] AI 문제 탐색 및 필터링 중...")
    
    # 1. 기능1에서 수집한 뉴스 활용
    news_articles = state.get("news_articles", [])
    if not news_articles:
        print("  [WARNING] news_articles가 비어있습니다. 빈 결과 반환.")
        return {"matched_problems": []}
    
    print(f"  [수집] 기능1에서 {len(news_articles)}개 뉴스 활용")
    
    # 2. 메커니즘으로 필터링
    core_mechanism = state["core_mechanism"]
    llm = get_llm(temperature=0.7, max_tokens=4096)
    
    # 상위 30개 뉴스만 처리 (중요도 기준)
    top_news = sorted(
        news_articles, 
        key=lambda x: x.get("importance_score", 0), 
        reverse=True
    )[:30]
    
    # 뉴스에서 문제/한계점 추출하기 위한 텍스트 구성
    news_text = "\n".join([
        f"- [{n.get('source', '')}] {n.get('title', '')}\n  {n.get('description', '')[:200]}"
        for n in top_news
    ])
    
    prompt = f"""다음은 최신 AI 뉴스 목록입니다. 이 뉴스들에서 **현재 AI가 해결하지 못하거나 어려움을 겪고 있는 문제/한계점**을 찾아주세요.

## AI 뉴스
{news_text}

## 핵심 메커니즘
메커니즘: {core_mechanism.get('coreMechanism', '')}
추상 패턴: {core_mechanism.get('abstractPattern', '')}
해결 가능 문제: {', '.join(core_mechanism.get('solvableProblems', []))}
키워드: {', '.join(core_mechanism.get('analogyKeywords', []))}

**과제**: 
1. 위 뉴스에서 언급된 AI의 문제/한계점/고충을 파악하세요
2. 그 중에서 이 메커니즘으로 해결할 수 있는 것 **3개**를 골라주세요
3. 각 문제가 메커니즘과 어떻게 연결되는지 설명하세요

OUTPUT ONLY VALID JSON ARRAY (no markdown, no explanation):
[
  {{
    "title": "AI 문제 제목 (예: LLM의 장기 기억 유지 한계)",
    "source": "출처",
    "relevanceReason": "이 메커니즘으로 왜 해결 가능한지 (100자 이내)",
    "relevanceScore": 0.85,
    "urgency": 8,
    "market_size": "크다/중간/작다"
  }}
]"""
    
    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        matched_problems = parse_llm_json(result.content)
        # 최대 3개
        matched_problems = matched_problems[:3]
    except Exception as e:
        print(f"  [WARNING] ai_problem_scout_node 파싱 실패: {e}")
        matched_problems = [{
            "title": "AI 모델 최적화 문제",
            "source": "기능1 뉴스",
            "relevanceReason": f"{core_mechanism.get('coreMechanism', '')}를 활용하여 해결 가능",
            "relevanceScore": 0.7,
            "urgency": 7,
            "market_size": "크다",
        }]
    
    print(f"  [OK] {len(matched_problems)}개 관련 문제 필터링 완료")
    for p in matched_problems:
        print(f"    - {p.get('title', 'N/A')} (연관도: {p.get('relevanceScore', 0):.2f})")
    
    return {"matched_problems": matched_problems}


# ─── Node 3: cross_pollinator ───
def cross_pollinator_node(state: IdeaGraphState) -> dict:
    """
    Step 3: 원리와 AI 문제를 구체적으로 연결하여 아이디어 생성
    - 기능 2의 융합 사례를 참고하여 유사한 융합 생성
    """
    print("\n[cross_pollinator_node] AI 융합 아이디어 생성 중...")
    
    today_principle = state["today_principle"]
    core_mechanism = state["core_mechanism"]
    matched_problems = state["matched_problems"]
    discipline_name = state["discipline_info"].get("name", "알 수 없음")
    
    integration = today_principle.get("integration", {})
    
    llm = get_llm(temperature=0.9, max_tokens=4096)
    
    problems_text = json.dumps(matched_problems, ensure_ascii=False, indent=2)
    
    # 뉴스 소스 정보
    news_articles = state["news_articles"]
    news_title = news_articles[0]["title"] if news_articles else "AI 뉴스"
    news_link = news_articles[0].get("link", "") if news_articles else ""
    
    prompt = f"""기능 2에서 이런 학제간 융합이 성공했어요:
원리: {today_principle.get('title', '')}
융합 사례: {integration.get('problemSolved', '')} → {integration.get('solution', '')}

같은 원리를 AI 문제에 적용해봐요.

## 핵심 메커니즘
{core_mechanism.get('coreMechanism', '')}
추상 패턴: {core_mechanism.get('abstractPattern', '')}

## 해결할 AI 문제들
{problems_text}

**과제**: 각 문제에 대해 1개씩 총 {len(matched_problems)}개 AI 융합 아이디어를 생성해주세요.
기능 2의 융합 사례처럼, 이 원리가 어떻게 AI 문제를 해결하는지 구체적으로 연결하세요.

JSON 배열로 응답하세요:
[
  {{
    "concept_name": "아이디어 이름",
    "problem_addressed": "해결하는 AI 문제",
    "principle_applied": "{today_principle.get('title', '')}의 어떤 원리",
    "how_it_connects": "원리를 AI 문제에 적용하는 구체적 방법 (150자)",
    "analogy": "기능 2의 융합 사례와 유사성 설명 (100자)",
    "description": "아이디어 상세 설명 (200-300자, ~이에요/~해요 체)",
    "narrative": "스토리텔링 형식으로 설명 (150-200자, ~이에요/~해요 체)",
    "key_innovation": "핵심 혁신 포인트",
    "target_users": "주요 사용자",
    "implementation_sketch": "구현 개요",
    "required_tech": ["필요 기술 1", "필요 기술 2", "필요 기술 3"],
    "tags": ["태그1", "태그2", "태그3"],
    "news_source": {{"title": "{news_title}", "link": "{news_link}"}},
    "principle_source": {{
      "title": "{today_principle.get('title', '')}",
      "category": "{today_principle.get('category', '')}",
      "superCategory": "{today_principle.get('superCategory', '')}",
      "discipline": "{discipline_name}"
    }},
    "first_step": "오늘 당장 실행 가능한 첫 단계"
  }}
]"""
    
    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        raw_ideas = parse_llm_json(result.content)
    except Exception as e:
        print(f"  [WARNING] cross_pollinator_node 파싱 실패: {e}")
        raw_ideas = [{
            "concept_name": f"{discipline_name} × AI 융합 솔루션",
            "problem_addressed": matched_problems[0]["title"] if matched_problems else "AI 문제",
            "principle_applied": today_principle.get("title", ""),
            "how_it_connects": core_mechanism.get("abstractPattern", ""),
            "analogy": f"{integration.get('problemSolved', '')}처럼 AI 문제를 해결해요",
            "description": f"{discipline_name}의 원리를 AI에 적용한 혁신적인 솔루션이에요.",
            "narrative": "사용자가 쉽게 활용할 수 있는 AI 도구예요.",
            "key_innovation": core_mechanism.get("coreMechanism", ""),
            "target_users": "AI 개발자 및 연구자",
            "implementation_sketch": "Python + LLM API + 웹 인터페이스",
            "required_tech": ["Python", "LLM API", "React"],
            "tags": ["AI", discipline_name, "융합"],
            "news_source": {"title": news_title, "link": news_link},
            "principle_source": {
                "title": today_principle.get("title", ""),
                "category": today_principle.get("category", ""),
                "superCategory": today_principle.get("superCategory", ""),
                "discipline": discipline_name,
            },
            "first_step": "아이디어 검증을 위한 프로토타입 제작",
        }]
    
    print(f"  [OK] {len(raw_ideas)}개 AI 융합 아이디어 생성 완료")
    return {"raw_ideas": raw_ideas}


# ─── Node 4: blueprint_architect ───
def blueprint_architect_node(state: IdeaGraphState) -> dict:
    """
    Step 4: 기술 로드맵 + 시장 분석 + 평가
    """
    print("\n[blueprint_architect_node] 로드맵 및 시장분석 중...")
    
    llm = get_llm(temperature=0.7, max_tokens=4096)
    ideas_text = json.dumps(state["raw_ideas"], ensure_ascii=False, indent=2)
    
    prompt = f"""다음 AI 융합 아이디어들에 기술 로드맵, 시장 분석, 평가를 추가해주세요.

아이디어:
{ideas_text}

각 아이디어에 추가:
1. **3축 평가** (각 1~10점):
   - feasibility_score: 기술적 실현가능성
   - novelty_score: 참신성
   - impact_score: 시장/사용자 임팩트
   - total_score: 세 점수 합

2. **technical_roadmap**:
   {{
     "phases": [
       {{
         "phase": 1,
         "title": "단계명 (예: PoC)",
         "duration": "기간 (예: 2주)",
         "tasks": ["작업1", "작업2"],
         "techStack": ["기술1", "기술2"]
       }}
     ],
     "totalDuration": "전체 기간 (예: 3개월)",
     "techStack": ["전체 기술 스택"]
   }}

3. **market_feasibility**:
   {{
     "tam": "전체 시장 규모 설명",
     "competitors": ["경쟁자1", "경쟁자2"],
     "differentiation": "차별화 포인트",
     "revenueModel": "수익 모델",
     "feasibilityScore": 7
   }}

4. **challenges**: ["도전과제 1", "도전과제 2"]
5. **improvements**: ["개선 제안 1", "개선 제안 2"]

OUTPUT ONLY VALID JSON ARRAY (no markdown, no explanation):"""
    
    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        evaluated_ideas = parse_llm_json(result.content)
    except Exception as e:
        print(f"  [WARNING] blueprint_architect_node 파싱 실패: {e}")
        evaluated_ideas = state["raw_ideas"]
        for idea in evaluated_ideas:
            idea.setdefault("feasibility_score", 7)
            idea.setdefault("novelty_score", 7)
            idea.setdefault("impact_score", 8)
            idea.setdefault("total_score", 22)
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
    return {"evaluated_ideas": evaluated_ideas}


# ─── Node 5: idea_verifier ───
def idea_verifier_node(state: IdeaGraphState) -> dict:
    """
    Step 5: Tavily로 유사 시도/논문 검증
    """
    print("\n[idea_verifier_node] 아이디어 검증 중...")
    
    evaluated_ideas = state["evaluated_ideas"]
    
    # 상위 3개 아이디어만 검증
    top_ideas = sorted(evaluated_ideas, key=lambda x: x.get("total_score", 0), reverse=True)[:3]
    
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        print("  ⚠️  TAVILY_API_KEY 없음, 검증 스킵")
        for idea in top_ideas:
            idea["verification"] = {
                "verified": False,
                "priorArt": [],
                "noveltyCheck": "검증 미수행",
                "confidence": 0.5,
            }
        return {"final_ideas": top_ideas}
    
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=api_key)
        
        for idea in top_ideas:
            concept_name = idea.get("concept_name", "")
            principle = idea.get("principle_applied", "")
            
            query = f"{concept_name} {principle} AI machine learning"
            
            print(f"  🔍 검증 중: {concept_name}")
            
            try:
                search_result = client.search(
                    query=query,
                    search_depth="basic",
                    max_results=3,
                )
                
                results = search_result.get("results", [])
                prior_art = [
                    {"title": r.get("title", ""), "url": r.get("url", "")}
                    for r in results[:3]
                ]
                
                if len(results) > 0:
                    novelty_check = "유사한 접근이 존재하지만 구체적 구현은 새로울 수 있어요"
                    confidence = 0.6
                else:
                    novelty_check = "명확한 선행 사례가 발견되지 않았어요"
                    confidence = 0.8
                
                idea["verification"] = {
                    "verified": True,
                    "priorArt": prior_art,
                    "noveltyCheck": novelty_check,
                    "confidence": confidence,
                }
                
                print(f"    ✅ 완료 (신뢰도: {confidence*100:.0f}%)")
                
            except Exception as e:
                print(f"    ⚠️  검증 실패: {e}")
                idea["verification"] = {
                    "verified": False,
                    "priorArt": [],
                    "noveltyCheck": "검증 중 오류 발생",
                    "confidence": 0.5,
                }
        
    except ImportError:
        print("  ⚠️  tavily-python 미설치, 검증 스킵")
        for idea in top_ideas:
            idea["verification"] = {
                "verified": False,
                "priorArt": [],
                "noveltyCheck": "검증 미수행 (라이브러리 없음)",
                "confidence": 0.5,
            }
    except Exception as e:
        print(f"  [WARNING] idea_verifier_node 실패: {e}")
        for idea in top_ideas:
            idea["verification"] = {
                "verified": False,
                "priorArt": [],
                "noveltyCheck": f"검증 오류: {str(e)[:100]}",
                "confidence": 0.5,
            }
    
    print(f"  [OK] 검증 완료")
    return {"final_ideas": top_ideas}


# ─── 그래프 구성 ───
_idea_graph_v2 = StateGraph(IdeaGraphState)
_idea_graph_v2.add_node("mechanism_extractor", mechanism_extractor_node)
_idea_graph_v2.add_node("ai_problem_scout", ai_problem_scout_node)
_idea_graph_v2.add_node("cross_pollinator", cross_pollinator_node)
_idea_graph_v2.add_node("blueprint_architect", blueprint_architect_node)
_idea_graph_v2.add_node("idea_verifier", idea_verifier_node)

_idea_graph_v2.set_entry_point("mechanism_extractor")
_idea_graph_v2.add_edge("mechanism_extractor", "ai_problem_scout")
_idea_graph_v2.add_edge("ai_problem_scout", "cross_pollinator")
_idea_graph_v2.add_edge("cross_pollinator", "blueprint_architect")
_idea_graph_v2.add_edge("blueprint_architect", "idea_verifier")
_idea_graph_v2.add_edge("idea_verifier", END)

_idea_app_v2 = _idea_graph_v2.compile()


def run_idea_graph(
    news_articles: list = None,
    today_principle: dict = None,
    discipline_info: dict = None,
) -> dict:
    """AI 융합 아이디어 그래프 v2 실행 (generate_daily.py 호환)"""
    print("=" * 60)
    print("[START] AI 융합 아이디어 그래프 v2 (메커니즘 기반 매칭)")
    print("=" * 60)
    
    initial: IdeaGraphState = {
        "news_articles": news_articles or [],
        "today_principle": today_principle or {},
        "discipline_info": discipline_info or {},
        "core_mechanism": {},
        "matched_problems": [],
        "raw_ideas": [],
        "evaluated_ideas": [],
        "final_ideas": [],
    }
    
    result = _idea_app_v2.invoke(initial)
    
    print(f"\n{'=' * 60}")
    print("[DONE] AI 융합 아이디어 그래프 v2 완료")
    print(f"  메커니즘: {result['core_mechanism'].get('coreMechanism', 'N/A')}")
    print(f"  매칭 문제: {len(result['matched_problems'])}개")
    print(f"  생성 아이디어: {len(result['raw_ideas'])}개")
    print(f"  최종 선정: {len(result['final_ideas'])}개")
    print("=" * 60)
    
    return {
        "core_mechanism": result["core_mechanism"],
        "matched_problems": result["matched_problems"],
        "raw_ideas": result["raw_ideas"],
        "evaluated_ideas": result["evaluated_ideas"],
        "final_ideas": result["final_ideas"],
        # 기존 호환성 유지
        "problems": result["matched_problems"],
    }
