"""
학문 원리 그래프 v2 - 역방향 파이프라인 (Top-Down)

융합 사례 먼저 생성 → 응용 원리 역추적 → 기본 원리 역추적 → 검증

4 노드 역방향 파이프라인:
  integration → application → foundation → verification
"""

import json
from typing import TypedDict
from datetime import datetime

from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END

from agents.config import (
    get_llm,
    get_today_discipline_key,
    get_discipline_info,
    DISCIPLINES,
)


class KnowledgeGraphState(TypedDict):
    discipline_key: str
    discipline_info: dict
    integration_case: dict
    application_principle: dict
    foundation_principle: dict
    verification_result: dict
    final_principle: dict


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


# ─── Node 1: integration (융합 사례 생성) ───
def integration_node(state: KnowledgeGraphState) -> dict:
    """
    Step 1: 학제간 융합 사례를 먼저 생성
    - 한 학문의 원리/아이디어가 다른 학문의 문제를 해결하거나 성능을 향상시킨 실제 사례
    - AI에 국한되지 않고 모든 학문 분야의 융합 사례 포함
    """
    info = state["discipline_info"]
    llm = get_llm(temperature=0.5, max_tokens=4096)
    
    # 다양한 학문 간 융합 사례 예시를 제시
    prompt = f"""당신은 학제간 융합 사례 전문가입니다. {info['name']} 분야의 원리나 아이디어가 **실제로** 다른 학문의 문제를 해결하거나 성능을 향상시킨 사례를 1개 선정해주세요.

학문 분야: {info['name']}
초점 영역: {info['focus']}

**학제간 융합 사례 예시** (AI가 아니어도 됩니다):
- 물리학 → 생물학: X-선 결정학 → DNA 이중나선 구조 발견
- 물리학 → 컴퓨터: 양자역학 → 양자컴퓨팅
- 생물학 → 건축: 흰개미집 환기 구조 → 에너지 효율적 건물 설계
- 수학 → 음악: 푸리에 변환 → 디지털 음향 합성
- 화학 → 의학: 페니실린 발견 → 항생제 치료
- 생물학 → 재료공학: 거미줄 구조 → 고강도 섬유
- 물리학 → 의학: MRI (자기공명) → 비침습 진단
- 수학 → 암호학: 소수 이론 → RSA 암호화
- 생물학 → AI: 신경망 → 딥러닝 (이런 것도 가능)

**중요**: AI 문제 해결에 국한하지 마세요. 순수하게 한 학문이 다른 학문에 기여한 실제 사례를 선정하세요.

다음 JSON 형식으로 응답하세요:
{{
  "title": "융합 사례 이름 (한국어)",
  "originalTitle": "영문 원제 (있다면)",
  "problemSolved": "해결한 문제 또는 향상시킨 부분 (50자 이내, ~이에요/~해요 체)",
  "solution": "어떻게 해결했는지 (150-200자, ~이에요/~해요 체)",
  "targetField": "영향받은 학문 분야 (예: 생물학, 의학, 건축)",
  "realWorldExamples": ["실제 사례 1", "실제 사례 2", "실제 사례 3"],
  "impactField": "영향 분야들 (80자 이내)",
  "whyItWorks": "왜 효과적인지 (100-150자, ~이에요/~해요 체)"
}}"""
    
    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        integration_case = parse_llm_json(result.content)
        
    except Exception as e:
        print(f"  [WARNING] integration_node 파싱 실패: {e}")
        integration_case = {
            "title": f"{info['name']} 융합 사례",
            "originalTitle": "",
            "problemSolved": "문제 정보를 찾을 수 없어요",
            "solution": "해결 방법 정보를 찾을 수 없어요",
            "targetField": "타 학문",
            "realWorldExamples": [],
            "impactField": "",
            "whyItWorks": "",
        }
    
    print(f"  [OK] [{info['name']}] integration_node 완료: {integration_case.get('title', 'N/A')} → {integration_case.get('targetField', 'N/A')}")
    return {"integration_case": integration_case}


# ─── Node 2: application (응용 원리 역추적) ───
def application_node(state: KnowledgeGraphState) -> dict:
    """
    Step 2: 융합 사례에서 응용 원리 역추적
    - 융합 사례가 어떤 응용 원리를 사용했는지 역추적
    """
    info = state["discipline_info"]
    integration = state["integration_case"]
    llm = get_llm(temperature=0.6, max_tokens=4096)
    
    integration_text = json.dumps(integration, ensure_ascii=False, indent=2)
    prompt = f"""다음 융합 사례가 사용한 **응용 원리**를 역추적해주세요.

융합 사례:
{integration_text}

원래 학문: {info['name']}

응용 원리란 기본 원리를 다른 영역(통계, 계산, 공학 등)에 적용한 중간 단계를 의미합니다.

예시:
- 융합 사례: "AI 최적화 문제 해결"
- 응용 원리: "통계 물리학/최적화 알고리즘" (기본 원리를 수학/알고리즘으로 변환)

다음 JSON 형식으로 응답하세요:
{{
  "applicationField": "응용 분야 (예: 통계 물리학/최적화 알고리즘)",
  "description": "응용 설명 (200-300자, ~이에요/~해요 체)",
  "mechanism": "응용 메커니즘 한 줄 (50-80자, ~이에요/~해요 체)",
  "technicalTerms": ["관련 기술 용어 1", "관련 기술 용어 2", "관련 기술 용어 3"],
  "bridgeRole": "기본 원리와 융합 사례를 연결하는 역할 (100자 이내, ~이에요/~해요 체)"
}}"""
    
    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        application_principle = parse_llm_json(result.content)
    except Exception as e:
        print(f"  [WARNING] application_node 파싱 실패: {e}")
        application_principle = {
            "applicationField": "응용 분야",
            "description": "응용 설명을 찾을 수 없어요",
            "mechanism": "",
            "technicalTerms": [],
            "bridgeRole": "",
        }
    
    print(f"  [OK] [{info['name']}] application_node 완료: {application_principle.get('applicationField', 'N/A')}")
    return {"application_principle": application_principle}


# ─── Node 3: foundation (기본 원리 역추적) ───
def foundation_node(state: KnowledgeGraphState) -> dict:
    """
    Step 3: 응용 원리에서 기본 원리 역추적
    - 응용 원리의 근원이 된 학문의 기본 원리 찾기
    """
    info = state["discipline_info"]
    integration = state["integration_case"]
    application = state["application_principle"]
    llm = get_llm(temperature=0.7, max_tokens=4096)
    
    integration_text = json.dumps(integration, ensure_ascii=False, indent=2)
    application_text = json.dumps(application, ensure_ascii=False, indent=2)
    
    prompt = f"""다음 융합 사례와 응용 원리의 **근원이 된 기본 원리**를 역추적해주세요.

융합 사례:
{integration_text}

응용 원리:
{application_text}

원래 학문: {info['name']}

기본 원리란 해당 학문의 가장 근본적인 개념이나 현상을 의미합니다.

예시:
- 융합 사례: "AI 최적화 문제 해결"
- 응용 원리: "통계 물리학/최적화 알고리즘"
- 기본 원리: "담금질(Annealing)" (물리학에서 금속을 천천히 식혀 안정 상태를 만드는 원리)

다음 JSON 형식으로 응답하세요:
{{
  "title": "기본 원리 이름 (한국어)",
  "principle": "기본 원리 설명 (200-300자, ~이에요/~해요 체)",
  "keyIdea": "핵심 아이디어 한 줄 (50자 이내, ~이에요/~해요 체)",
  "everydayAnalogy": "일상 비유 (100-150자, 카카오톡/넷플릭스 등 한국 앱 비유, ~이에요/~해요 체)",
  "scientificContext": "{info['name']}에서 이 원리가 중요한 이유 (100자 이내, ~이에요/~해요 체)"
}}"""
    
    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        foundation_principle = parse_llm_json(result.content)
    except Exception as e:
        print(f"  [WARNING] foundation_node 파싱 실패: {e}")
        foundation_principle = {
            "title": f"{info['name']}의 기본 원리",
            "principle": "기본 원리 설명을 찾을 수 없어요",
            "keyIdea": "",
            "everydayAnalogy": "",
            "scientificContext": "",
        }
    
    print(f"  [OK] [{info['name']}] foundation_node 완료: {foundation_principle.get('title', 'N/A')}")
    return {"foundation_principle": foundation_principle}


# ─── Node 4: verification (검증) ───
def verification_node(state: KnowledgeGraphState) -> dict:
    """
    Step 4: 웹 검색으로 정보 검증
    - 융합 사례, 응용 원리, 기본 원리가 실제로 존재하는지 검증
    - Tavily API 사용하여 팩트 체크
    """
    import os
    info = state["discipline_info"]
    integration = state["integration_case"]
    foundation = state["foundation_principle"]
    
    verification_result = {
        "verified": False,
        "confidence": 0.0,
        "sources": [],
        "factCheck": "",
    }
    
    # Tavily API로 웹 검색 검증
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        print(f"  ⚠️  [{info['name']}] TAVILY_API_KEY 없음, 검증 스킵")
        verification_result["factCheck"] = "검증을 수행하지 못했어요 (API 키 없음)"
        return {"verification_result": verification_result}
    
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=api_key)
        
        # 검증 쿼리 생성
        case_title = integration.get("originalTitle") or integration.get("title", "")
        foundation_title = foundation.get("title", "")
        
        query = f"{case_title} {foundation_title} {info['name']}"
        
        print(f"  🔍 [{info['name']}] 웹 검색 검증 중: '{query}'")
        
        search_result = client.search(
            query=query,
            search_depth="advanced",
            max_results=5,
            include_answer=True,
        )
        
        answer = search_result.get("answer", "")
        results = search_result.get("results", [])
        
        # 검증 결과 분석
        if answer and len(results) > 0:
            verification_result["verified"] = True
            verification_result["confidence"] = 0.8
            verification_result["sources"] = [
                {"title": r.get("title", ""), "url": r.get("url", "")}
                for r in results[:3]
            ]
            verification_result["factCheck"] = f"웹 검색 결과 이 융합 사례는 실제로 존재해요. {answer[:200]}..."
            print(f"  ✅ [{info['name']}] 검증 성공 (신뢰도: 80%)")
        else:
            verification_result["verified"] = False
            verification_result["confidence"] = 0.3
            verification_result["factCheck"] = "웹 검색에서 명확한 정보를 찾지 못했어요. 추가 확인이 필요해요."
            print(f"  ⚠️  [{info['name']}] 검증 실패 (정보 부족)")
        
    except ImportError:
        print(f"  ⚠️  [{info['name']}] tavily-python 미설치, 검증 스킵")
        verification_result["factCheck"] = "검증을 수행하지 못했어요 (라이브러리 없음)"
    except Exception as e:
        print(f"  [WARNING] verification_node 실패: {e}")
        verification_result["factCheck"] = f"검증 중 오류 발생: {str(e)[:100]}"
    
    return {"verification_result": verification_result}


# ─── Node 5: final_assembly (최종 조립) ───
def final_assembly_node(state: KnowledgeGraphState) -> dict:
    """
    Step 5: 모든 정보를 최종 형식으로 조립
    - 3단계 구조 (foundation → application → integration) 생성
    """
    info = state["discipline_info"]
    discipline_key = state["discipline_key"]
    foundation = state["foundation_principle"]
    application = state["application_principle"]
    integration = state["integration_case"]
    verification = state["verification_result"]
    
    # learn_more_links 생성 (검증 소스 활용)
    learn_more_links = []
    for source in verification.get("sources", [])[:3]:
        learn_more_links.append({
            "type": "article",
            "title": source.get("title", ""),
            "url": source.get("url", ""),
        })
    
    # 위키피디아 링크 추가 시도
    case_title = integration.get("originalTitle") or integration.get("title", "")
    if case_title:
        wiki_title = case_title.replace(" ", "_")
        learn_more_links.insert(0, {
            "type": "wikipedia",
            "title": f"{case_title} - Wikipedia",
            "url": f"https://en.wikipedia.org/wiki/{wiki_title}",
        })
    
    # 최종 principle 객체 조립
    final_principle = {
        "title": integration.get("title", ""),
        "category": discipline_key,
        "superCategory": info.get("superCategory", ""),
        
        # Foundation (기본 원리)
        "foundation": {
            "principle": foundation.get("principle", ""),
            "keyIdea": foundation.get("keyIdea", ""),
            "everydayAnalogy": foundation.get("everydayAnalogy", ""),
            "scientificContext": foundation.get("scientificContext", ""),
        },
        
        # Application (응용 원리)
        "application": {
            "applicationField": application.get("applicationField", ""),
            "description": application.get("description", ""),
            "mechanism": application.get("mechanism", ""),
            "technicalTerms": application.get("technicalTerms", []),
            "bridgeRole": application.get("bridgeRole", ""),
        },
        
        # Integration (융합 사례)
        "integration": {
            "problemSolved": integration.get("problemSolved", ""),
            "solution": integration.get("solution", ""),
            "targetField": integration.get("targetField", ""),
            "realWorldExamples": integration.get("realWorldExamples", []),
            "impactField": integration.get("impactField", ""),
            "whyItWorks": integration.get("whyItWorks", ""),
        },
        
        # 검증 정보
        "verification": {
            "verified": verification.get("verified", False),
            "confidence": verification.get("confidence", 0.0),
            "factCheck": verification.get("factCheck", ""),
        },
        
        # 학습 자료
        "learn_more_links": learn_more_links,
    }
    
    confidence = verification.get("confidence", 0.0)
    verified_icon = "✅" if verification.get("verified") else "⚠️"
    print(f"  {verified_icon} [{info['name']}] final_assembly 완료: {final_principle.get('title', 'N/A')} (신뢰도: {confidence*100:.0f}%)")
    
    return {"final_principle": final_principle}


# ─── 그래프 구성 ───
def _build_knowledge_graph_v2():
    """역방향 파이프라인 그래프 구성"""
    g = StateGraph(KnowledgeGraphState)
    
    g.add_node("integration", integration_node)
    g.add_node("application", application_node)
    g.add_node("foundation", foundation_node)
    g.add_node("verification", verification_node)
    g.add_node("final_assembly", final_assembly_node)
    
    g.set_entry_point("integration")
    g.add_edge("integration", "application")
    g.add_edge("application", "foundation")
    g.add_edge("foundation", "verification")
    g.add_edge("verification", "final_assembly")
    g.add_edge("final_assembly", END)
    
    return g.compile()


_knowledge_app_v2 = _build_knowledge_graph_v2()


def run_knowledge_graph(discipline_key: str = None) -> dict:
    """
    학문 원리 그래프 v2 실행 (역방향 파이프라인)
    
    Returns:
        {
            "discipline_key": str,
            "discipline_info": dict,
            "final_principle": dict,
            "today_principle": dict,  # 호환성 유지
        }
    """
    target_key = discipline_key or get_today_discipline_key()
    info = get_discipline_info(target_key)
    
    if not info:
        print(f"\n[ERROR] 학문 분야 '{target_key}'를 찾을 수 없어요.")
        return {
            "discipline_key": target_key,
            "discipline_info": {},
            "final_principle": {},
            "today_principle": {},
        }
    
    print("=" * 60)
    print(f"[START] 학문 원리 그래프 v2 시작 (역방향: 융합→응용→기본)")
    print(f"   학문: {info.get('name', target_key)} ({info.get('superCategory', '')})")
    print("=" * 60)
    
    try:
        initial: KnowledgeGraphState = {
            "discipline_key": target_key,
            "discipline_info": info,
            "integration_case": {},
            "application_principle": {},
            "foundation_principle": {},
            "verification_result": {},
            "final_principle": {},
        }
        
        final_state = _knowledge_app_v2.invoke(initial)
        fp = final_state["final_principle"]
        
        print(f"\n{'=' * 60}")
        print(f"[DONE] 학문 원리 그래프 v2 완료")
        print(f"   원리: {fp.get('title', 'N/A')}")
        print(f"   검증: {'✅ 통과' if fp.get('verification', {}).get('verified') else '⚠️ 미검증'}")
        print(f"{'=' * 60}")
        
        return {
            "discipline_key": target_key,
            "discipline_info": info,
            "final_principle": fp,
            "today_principle": fp,  # 호환성 유지
        }
        
    except Exception as e:
        print(f"\n[ERROR] 그래프 실행 실패: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "discipline_key": target_key,
            "discipline_info": info,
            "final_principle": {},
            "today_principle": {},
            "error": str(e),
        }
