"""
뉴스 에이전트 팀 - LangGraph 기반 멀티에이전트 뉴스 큐레이션

CollectorAgent (4개 전용 Tool 장착)
  → Tool A (Academic):   arXiv + Hugging Face Daily Papers  → model_research
  → Tool B (Developer):  GitHub Trending                   → product_tools
  → Tool C (Market):     Tavily AI Search                  → 분산
  → Tool D (Industry):   VentureBeat + TechCrunch + HN     → industry_business
  → 가로 스크롤:          OpenAI/Anthropic/DeepMind, AI타임스, TLDR AI
→ AnalyzerAgent (3개 카테고리 분류 + 중요도 산정)
→ CuratorAgent (카테고리당 TOP 3 선별 + 하이라이트)
→ SummarizerAgent (한국어 요약 + impact_comment + How-to Guide)

메인 카테고리: model_research / product_tools / industry_business
가로 섹션: official_announcements / korean_ai / curation
"""

import json
from typing import TypedDict
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END

from agents.config import get_llm, NEWS_CATEGORIES, CATEGORY_KEYWORDS
from agents.tools import fetch_all_sources, fetch_horizontal_sources


# ─── 상태 정의 ───
class NewsState(TypedDict):
    raw_articles: list[dict]
    analyzed_articles: list[dict]
    curated_articles: list[dict]
    final_articles: list[dict]
    daily_overview: str
    highlight: dict
    themes: list[str]
    categories: dict           # 카테고리별 분류 결과
    horizontal_sections: dict  # 가로 스크롤 섹션 (공식 발표 / 한국 AI / 큐레이션)


# ─── JSON 파싱 유틸리티 ───
def parse_llm_json(text: str):
    """LLM 응답에서 JSON을 파싱하는 유틸리티"""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    if text.startswith("json"):
        text = text[4:].strip()
    return json.loads(text)


# ─── Agent 1: CollectorAgent ───
def collector_node(state: NewsState) -> dict:
    """4개 Tool로 메인 피드 수집 + 가로 스크롤 섹션 수집"""
    print("\n[CollectorAgent] 4개 Tool로 뉴스 수집 중...")

    articles = fetch_all_sources()
    horizontal = fetch_horizontal_sources()

    print(f"  [OK] 메인 피드 {len(articles)}개 + 가로 섹션 수집 완료")
    return {
        "raw_articles": articles,
        "horizontal_sections": horizontal,
    }


# ─── Agent 2: AnalyzerAgent ───
def analyzer_node(state: NewsState) -> dict:
    """수집된 기사를 5개 카테고리로 분류하고 중요도 점수 산정 (LLM 호출)"""
    print("\n[AnalyzerAgent] 기사 분석, 카테고리 분류 및 중요도 점수 산정 중...")

    articles = state["raw_articles"]
    if not articles:
        return {"analyzed_articles": [], "categories": {}}

    llm = get_llm(temperature=0.3, max_tokens=8192)

    # 카테고리 정의 텍스트
    categories_text = "\n".join([
        f"- {key}: {name}" for key, name in NEWS_CATEGORIES.items()
    ])

    # 배치로 분석 (한 번에 50개씩)
    all_scored_articles = []
    batch_size = 50

    for batch_start in range(0, min(len(articles), 200), batch_size):
        batch = articles[batch_start:batch_start + batch_size]

        articles_text = ""
        for i, a in enumerate(batch):
            articles_text += (
                f"\n[{i}] 제목: {a['title']}\n"
                f"    설명: {a['description'][:200]}\n"
                f"    출처: {a['source']}\n"
                f"    소스유형: {a.get('source_type', 'unknown')}\n"
            )

        prompt = f"""당신은 AI 뉴스 분석 전문가입니다. 다음 {len(batch)}개의 AI 뉴스를 분석해주세요.

## 카테고리 정의
{categories_text}

## 카테고리 기준
- model_research: 모델·논문·연구·벤치마크 (arXiv, HuggingFace 논문, 모델 성능 비교)
- product_tools: 출시된 제품·앱·프레임워크·개발도구 (GitHub 오픈소스, 신규 툴, API 출시)
- industry_business: 투자·기업동향·정책·규제 (VC 투자, M&A, 정부 규제, 시장 분석)

## 분석 기준
각 기사에 대해 다음을 수행하세요:
1. 3개 카테고리 중 가장 적합한 카테고리 1개 선택 (key 값 사용)
2. 다음 3가지 기준으로 1~10점 점수 부여:
   - relevance: AI 학습자/실무자에게 얼마나 관련 있는지
   - novelty: 얼마나 새롭고 독창적인 정보인지
   - practicality: 실용적 가치 (코드, 도구, 방법론 등 적용 가능성)

반드시 JSON 배열로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요:
[{{"index": 0, "category": "model_research", "relevance": 8, "novelty": 7, "practicality": 6}}, ...]

기사 목록:
{articles_text}"""

        try:
            response = llm.invoke([HumanMessage(content=prompt)])
            scores = parse_llm_json(response.content)

            for score_item in scores:
                idx = score_item.get("index", 0)
                if idx < len(batch):
                    article = batch[idx].copy()
                    article["category"] = score_item.get("category", "model_research")
                    article["relevance"] = score_item.get("relevance", 5)
                    article["novelty"] = score_item.get("novelty", 5)
                    article["practicality"] = score_item.get("practicality", 5)

                    # 중요도 점수 재계산 (실용성 점수 반영)
                    from agents.tools import calculate_importance_score
                    article["importance_score"] = calculate_importance_score(
                        source_name=article.get("source", ""),
                        social_score=article.get("social_score", 0),
                        practicality_score=article["practicality"],
                    )

                    article["total_score"] = (
                        article["relevance"] + article["novelty"] + article["practicality"]
                    )
                    all_scored_articles.append(article)

        except (json.JSONDecodeError, KeyError) as e:
            print(f"  [WARNING] 배치 {batch_start} 분석 파싱 실패 (폴백: 키워드 분류): {e}")
            for a in batch:
                article = a.copy()
                article["category"] = _keyword_classify(article)
                article["relevance"] = 5
                article["novelty"] = 5
                article["practicality"] = 5
                article["total_score"] = 15
                all_scored_articles.append(article)

    # 카테고리별 그룹화
    categories_grouped = {}
    for cat_key in NEWS_CATEGORIES:
        cat_articles = [a for a in all_scored_articles if a.get("category") == cat_key]
        cat_articles.sort(key=lambda x: x.get("importance_score", 0), reverse=True)
        categories_grouped[cat_key] = cat_articles

    # 전체 점수 순 정렬
    all_scored_articles.sort(key=lambda x: x.get("importance_score", 0), reverse=True)

    print(f"  [OK] {len(all_scored_articles)}개 기사 분석 완료")
    for cat_key, cat_name in NEWS_CATEGORIES.items():
        count = len(categories_grouped.get(cat_key, []))
        print(f"    - {cat_name}: {count}개")

    return {
        "analyzed_articles": all_scored_articles,
        "categories": categories_grouped,
    }


def _keyword_classify(article: dict) -> str:
    """키워드 기반 폴백 카테고리 분류 (3개 카테고리)"""
    text = (article.get("title", "") + " " + article.get("description", "")).lower()
    source_type = article.get("source_type", "")

    # 소스 타입 기반 우선 분류
    if source_type in ("arxiv", "huggingface"):
        return "model_research"
    if source_type == "github":
        return "product_tools"
    if source_type in ("venturebeat", "techcrunch"):
        return "industry_business"

    best_category = "model_research"
    best_score = 0

    for cat_key, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > best_score:
            best_score = score
            best_category = cat_key

    return best_category


# ─── Agent 3: CuratorAgent ───
def curator_node(state: NewsState) -> dict:
    """
    카테고리별 TOP 3 기사 선별 (3개 카테고리 × TOP 3 = 최대 9개)
    + 전체 하이라이트 1개
    """
    print("\n[CuratorAgent] 카테고리별 TOP 3 선별 중...")

    categories = state.get("categories", {})
    analyzed = state["analyzed_articles"]

    if not analyzed:
        return {"curated_articles": [], "highlight": {}, "themes": []}

    curated_articles = []
    themes = []

    for cat_key, cat_name in NEWS_CATEGORIES.items():
        cat_articles = categories.get(cat_key, [])

        if not cat_articles:
            # 해당 카테고리에 기사가 없으면 전체에서 소스 타입 기반 보충
            source_map = {
                "model_research":    ["arxiv", "huggingface"],
                "product_tools":     ["github"],
                "industry_business": ["venturebeat", "techcrunch", "hackernews"],
            }
            preferred_types = source_map.get(cat_key, [])
            cat_articles = [a for a in analyzed if a.get("source_type", "") in preferred_types][:5]
            if not cat_articles:
                cat_articles = analyzed[:5]

        # TOP 3 선별
        top3 = cat_articles[:3]
        for article in top3:
            a = article.copy()
            a["category"] = cat_key
            a["category_name"] = cat_name
            curated_articles.append(a)

        if cat_articles:
            themes.append(cat_name)

    # 하이라이트: 전체에서 가장 중요도 높은 기사
    highlight = max(curated_articles, key=lambda x: x.get("importance_score", 0)) if curated_articles else {}

    print(f"  [OK] 총 {len(curated_articles)}개 선별 완료 (카테고리당 최대 3개)")
    print(f"  [OK] 하이라이트: {highlight.get('title', 'N/A')[:50]}...")

    return {
        "curated_articles": curated_articles,
        "highlight": highlight,
        "themes": themes,
    }


# ─── Agent 4: SummarizerAgent ───
def summarizer_node(state: NewsState) -> dict:
    """
    선별된 기사를 한국어로 요약하고 How-to Guide 생성
    숏폼: 50-100자 핵심 요약
    롱폼: 300-500자 상세 요약 + How-to Guide (코드 스니펫, 프롬프트 예시)
    """
    print("\n[SummarizerAgent] 한국어 요약 및 How-to Guide 생성 중...")

    articles = state["curated_articles"]
    if not articles:
        return {
            "final_articles": [],
            "daily_overview": "",
            "horizontal_sections": state.get("horizontal_sections", {}),
        }

    llm = get_llm(temperature=0.7, max_tokens=8192)

    # ─── 전체 기사 요약 (배치, 5개씩) ───
    batch_size = 5
    for batch_start in range(0, len(articles), batch_size):
        batch = articles[batch_start:batch_start + batch_size]

        batch_text = ""
        for i, a in enumerate(batch):
            batch_text += (
                f"\n[기사 {i+1}]\n"
                f"제목: {a['title']}\n"
                f"설명: {a['description'][:400]}\n"
                f"카테고리: {a.get('category_name', '')}\n"
                f"출처: {a.get('source', '')}\n"
            )

        prompt = f"""다음 {len(batch)}개의 AI 뉴스를 각각 한국어로 요약해주세요.

## 요구사항
- summary: 150-300자 한국어 요약 (핵심 내용 + 시사점)
- impact_comment: 한 줄 임팩트 코멘트 (40자 이내, 예: "개발자 필수 — 오늘부터 바로 써보세요")
- howToGuide: 실무 활용 가이드 (코드/프롬프트 예시 포함, 없으면 빈 문자열)

반드시 JSON 배열로만 응답하세요:
[{{"index": 1, "summary": "...", "impact_comment": "...", "howToGuide": "..."}}]

{batch_text}"""

        try:
            response = llm.invoke([HumanMessage(content=prompt)])
            summaries = parse_llm_json(response.content)
            for s in summaries:
                idx = s.get("index", 1) - 1
                if 0 <= idx < len(batch):
                    batch[idx]["summary"] = s.get("summary", batch[idx]["description"][:300])
                    batch[idx]["impact_comment"] = s.get("impact_comment", "")
                    batch[idx]["howToGuide"] = s.get("howToGuide", "")
        except (json.JSONDecodeError, KeyError) as e:
            print(f"  [WARNING] 배치 {batch_start} 요약 파싱 실패: {e}")
            for a in batch:
                a.setdefault("summary", a["description"][:300])
                a.setdefault("impact_comment", "")
                a.setdefault("howToGuide", "")

    # ─── 일일 개요 생성 ───
    themes = ", ".join(state.get("themes", []))
    titles = "\n".join([f"- [{a.get('category_name', '')}] {a['title']}" for a in articles[:9]])

    overview_prompt = f"""오늘의 AI 뉴스 카테고리: {themes}

주요 기사:
{titles}

위 내용을 바탕으로 오늘의 AI 뉴스 동향을 3-4문장으로 한국어 요약하세요.
각 카테고리(모델/연구, 제품/도구, 산업/비즈니스)의 핵심을 한 줄씩 언급하세요.
일반 텍스트로만 응답하세요."""

    try:
        overview_response = llm.invoke([HumanMessage(content=overview_prompt)])
        daily_overview = overview_response.content.strip()
    except Exception as e:
        print(f"  [WARNING] 일일 개요 생성 실패: {e}")
        daily_overview = f"오늘의 AI 뉴스: {themes} 분야에서 주요 업데이트가 있었습니다."

    # ─── 최종 기사 정리 ───
    final_articles = []
    for a in articles:
        final_articles.append({
            "title": a["title"],
            "description": a["description"],
            "link": a["link"],
            "published": a["published"],
            "source": a["source"],
            "source_type": a.get("source_type", ""),
            "summary": a.get("summary", a["description"][:300]),
            "impact_comment": a.get("impact_comment", ""),
            "category": a.get("category", ""),
            "category_name": a.get("category_name", ""),
            "howToGuide": a.get("howToGuide", ""),
            "importance_score": a.get("importance_score", 0),
            "social_score": a.get("social_score", 0),
            "theme": a.get("category_name", ""),
        })

    howto_count = len([a for a in final_articles if a.get("howToGuide")])
    print(f"  [OK] 총 {len(final_articles)}개 요약 완료 | How-to Guide: {howto_count}개")

    return {
        "final_articles": final_articles,
        "daily_overview": daily_overview,
        "horizontal_sections": state.get("horizontal_sections", {}),
    }


# ─── 뉴스 에이전트 팀 그래프 빌드 ───
def build_news_team_graph():
    """뉴스 큐레이션 에이전트 팀 그래프 생성"""
    graph = StateGraph(NewsState)

    graph.add_node("collector", collector_node)
    graph.add_node("analyzer", analyzer_node)
    graph.add_node("curator", curator_node)
    graph.add_node("summarizer", summarizer_node)

    graph.add_edge(START, "collector")
    graph.add_edge("collector", "analyzer")
    graph.add_edge("analyzer", "curator")
    graph.add_edge("curator", "summarizer")
    graph.add_edge("summarizer", END)

    return graph.compile()


def run_news_team() -> dict:
    """뉴스 에이전트 팀 실행 및 결과 반환"""
    print("=" * 60)
    print("[START] 뉴스 에이전트 팀 시작 (3개 Tool: Academic + Developer + Market/News, 5개 카테고리)")
    print("=" * 60)

    graph = build_news_team_graph()
    initial_state = {
        "raw_articles": [],
        "analyzed_articles": [],
        "curated_articles": [],
        "final_articles": [],
        "daily_overview": "",
        "highlight": {},
        "themes": [],
        "categories": {},
        "horizontal_sections": {},
    }

    result = graph.invoke(initial_state)

    final = result["final_articles"]
    hs = result.get("horizontal_sections", {})

    print(f"\n[DONE] 뉴스 에이전트 팀 완료")
    print(f"  수집: {len(result.get('raw_articles', []))}개")
    print(f"  분석: {len(result.get('analyzed_articles', []))}개")
    print(f"  최종: {len(final)}개 (3 카테고리)")
    print(f"  가로 섹션: 공식발표 {len(hs.get('official_announcements', []))}개 | 한국AI {len(hs.get('korean_ai', []))}개 | 큐레이션 {len(hs.get('curation', []))}개")

    return result
