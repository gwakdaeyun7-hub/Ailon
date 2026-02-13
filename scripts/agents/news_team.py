"""
뉴스 에이전트 팀 - LangGraph 기반 멀티에이전트 뉴스 큐레이션

CollectorAgent (3개 전용 Tool 장착)
  → Tool A (Academic): arXiv API + Hugging Face Daily Papers
  → Tool B (Developer): GitHub Search API (24h Star 급증 Repo)
  → Tool C (Market/News): Tavily AI Search (VC 동향, 테크 뉴스)
→ AnalyzerAgent (5개 카테고리 분류 + 중요도 산정)
→ CuratorAgent (숏폼 5개 + 롱폼 15개 선별)
→ SummarizerAgent (한국어 요약 + How-to Guide)

카테고리: 모델&아키텍처, 에이전틱리얼리티, 오픈소스&코드, Physical AI, 정책&안전
"""

import json
from typing import TypedDict
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END

from agents.config import get_llm, NEWS_CATEGORIES, CATEGORY_KEYWORDS
from agents.tools import fetch_all_sources


# ─── 상태 정의 ───
class NewsState(TypedDict):
    raw_articles: list[dict]
    analyzed_articles: list[dict]
    curated_articles: list[dict]
    final_articles: list[dict]
    daily_overview: str
    highlight: dict
    themes: list[str]
    categories: dict  # 카테고리별 분류 결과


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
    """3개 전용 Tool로 뉴스 수집 (Academic + Developer + Market/News), 목표 100-200개"""
    print("\n[CollectorAgent] 3개 전용 Tool로 뉴스 수집 중...")

    articles = fetch_all_sources()
    print(f"  [OK] {len(articles)}개의 AI 관련 기사 수집 완료")

    return {"raw_articles": articles}


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

## 분석 기준
각 기사에 대해 다음을 수행하세요:
1. 5개 카테고리 중 가장 적합한 카테고리 1개 선택 (key 값 사용)
2. 다음 3가지 기준으로 1~10점 점수 부여:
   - relevance: AI 학습자/실무자에게 얼마나 관련 있는지
   - novelty: 얼마나 새롭고 독창적인 정보인지
   - practicality: 실용적 가치 (코드, 도구, 방법론 등 적용 가능성)

반드시 JSON 배열로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요:
[{{"index": 0, "category": "models_architecture", "relevance": 8, "novelty": 7, "practicality": 6}}, ...]

기사 목록:
{articles_text}"""

        try:
            response = llm.invoke([HumanMessage(content=prompt)])
            scores = parse_llm_json(response.content)

            for score_item in scores:
                idx = score_item.get("index", 0)
                if idx < len(batch):
                    article = batch[idx].copy()
                    article["category"] = score_item.get("category", "models_architecture")
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
            print(f"  [WARNING] 배치 {batch_start} 분석 파싱 실패: {e}")
            # 폴백: 키워드 기반 카테고리 분류
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
    """키워드 기반 폴백 카테고리 분류"""
    text = (article.get("title", "") + " " + article.get("description", "")).lower()

    best_category = "models_architecture"
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
    카테고리별로 숏폼/롱폼 기사 선별
    숏폼: 카테고리당 1개, 총 5개 (50-100자 요약)
    롱폼: 카테고리당 3개, 총 15개 (300-500자 요약 + How-to Guide)
    """
    print("\n[CuratorAgent] 숏폼 5개 + 롱폼 15개 선별 중...")

    categories = state.get("categories", {})
    analyzed = state["analyzed_articles"]

    if not analyzed:
        return {"curated_articles": [], "highlight": {}, "themes": []}

    llm = get_llm(temperature=0.5, max_tokens=4096)

    curated_articles = []
    themes = []

    for cat_key, cat_name in NEWS_CATEGORIES.items():
        cat_articles = categories.get(cat_key, [])

        if not cat_articles:
            # 해당 카테고리에 기사가 없으면 전체에서 보충
            cat_articles = analyzed[:5]

        # 숏폼 1개: 가장 중요도 높은 기사
        if cat_articles:
            short_article = cat_articles[0].copy()
            short_article["type"] = "short"
            short_article["category"] = cat_key
            short_article["category_name"] = cat_name
            curated_articles.append(short_article)

        # 롱폼 3개: 상위 3개 (숏폼과 다른 기사 우선)
        long_candidates = cat_articles[1:4] if len(cat_articles) > 1 else cat_articles[:3]
        # 후보가 부족하면 처음부터 채우기
        if len(long_candidates) < 3 and len(cat_articles) >= 3:
            long_candidates = cat_articles[:3]
        elif len(long_candidates) < 3:
            long_candidates = cat_articles[:len(cat_articles)]

        for article in long_candidates:
            long_article = article.copy()
            long_article["type"] = "long"
            long_article["category"] = cat_key
            long_article["category_name"] = cat_name
            curated_articles.append(long_article)

        if cat_articles:
            themes.append(cat_name)

    # 하이라이트: 전체에서 가장 중요도 높은 기사
    highlight = max(curated_articles, key=lambda x: x.get("importance_score", 0)) if curated_articles else {}

    short_count = len([a for a in curated_articles if a.get("type") == "short"])
    long_count = len([a for a in curated_articles if a.get("type") == "long"])
    print(f"  [OK] 숏폼 {short_count}개 + 롱폼 {long_count}개 = 총 {len(curated_articles)}개 선별 완료")
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
        return {"final_articles": [], "daily_overview": ""}

    llm = get_llm(temperature=0.7, max_tokens=8192)

    # 숏폼과 롱폼 분리
    short_articles = [a for a in articles if a.get("type") == "short"]
    long_articles = [a for a in articles if a.get("type") == "long"]

    # ─── 숏폼 요약 (50-100자) ───
    if short_articles:
        short_text = ""
        for i, a in enumerate(short_articles):
            short_text += (
                f"\n[기사 {i+1}]\n"
                f"제목: {a['title']}\n"
                f"설명: {a['description'][:200]}\n"
                f"카테고리: {a.get('category_name', '')}\n"
            )

        short_prompt = f"""다음 {len(short_articles)}개의 AI 뉴스를 각각 한국어로 초단축 요약해주세요.
각 기사당 50-100자(한국어 기준)로 핵심만 압축하세요.
한 줄로 "무엇이, 어떻게 되었다" 형식으로 작성하세요.

반드시 JSON 배열로만 응답하세요:
[{{"index": 1, "summary": "50-100자 초단축 요약..."}}]

{short_text}"""

        try:
            response = llm.invoke([HumanMessage(content=short_prompt)])
            summaries = parse_llm_json(response.content)
            for s in summaries:
                idx = s.get("index", 1) - 1
                if 0 <= idx < len(short_articles):
                    short_articles[idx]["summary"] = s.get("summary", "")
        except (json.JSONDecodeError, KeyError) as e:
            print(f"  [WARNING] 숏폼 요약 파싱 실패: {e}")
            for a in short_articles:
                if "summary" not in a:
                    a["summary"] = a["title"][:100]

    # ─── 롱폼 요약 + How-to Guide (300-500자) ───
    if long_articles:
        batch_size = 5
        for batch_start in range(0, len(long_articles), batch_size):
            batch = long_articles[batch_start:batch_start + batch_size]

            long_text = ""
            for i, a in enumerate(batch):
                long_text += (
                    f"\n[기사 {i+1}]\n"
                    f"제목: {a['title']}\n"
                    f"설명: {a['description'][:400]}\n"
                    f"카테고리: {a.get('category_name', '')}\n"
                    f"출처유형: {a.get('source_type', '')}\n"
                )

            long_prompt = f"""다음 {len(batch)}개의 AI 뉴스를 각각 한국어로 상세 요약하고, How-to Guide를 생성해주세요.

## 요약 요구사항
- 300-500자(한국어 기준) 상세 요약
- AI 학습자/실무자에게 유용한 인사이트 포함
- 핵심 내용, 배경, 시사점을 포함

## How-to Guide 요구사항
- 실무에서 바로 활용할 수 있는 가이드 제공
- 가능하면 코드 스니펫 또는 프롬프트 예시 포함
- 예시: "pip install xxx && python -c 'import xxx; ...'"
- 예시: "프롬프트: '다음 코드를 분석하고 개선점을 제안해주세요: [코드]'"
- 도구/기사 유형에 따라 적절한 가이드 제공

반드시 JSON 배열로만 응답하세요:
[{{"index": 1, "summary": "300-500자 상세 요약...", "howToGuide": "실전 가이드 내용..."}}]

{long_text}"""

            try:
                response = llm.invoke([HumanMessage(content=long_prompt)])
                summaries = parse_llm_json(response.content)
                for s in summaries:
                    idx = s.get("index", 1) - 1
                    if 0 <= idx < len(batch):
                        batch[idx]["summary"] = s.get("summary", batch[idx]["description"][:500])
                        batch[idx]["howToGuide"] = s.get("howToGuide", "")
            except (json.JSONDecodeError, KeyError) as e:
                print(f"  [WARNING] 롱폼 요약 파싱 실패: {e}")
                for a in batch:
                    if "summary" not in a:
                        a["summary"] = a["description"][:500]
                    if "howToGuide" not in a:
                        a["howToGuide"] = ""

    # ─── 일일 개요 생성 ───
    all_summarized = short_articles + long_articles
    titles = "\n".join([f"- [{a.get('category_name', '')}] {a['title']}" for a in all_summarized[:15]])
    themes = ", ".join(state.get("themes", []))

    overview_prompt = f"""오늘의 AI 뉴스 주요 카테고리: {themes}

주요 기사 제목:
{titles}

위 내용을 바탕으로 오늘의 AI 뉴스 동향을 4-5문장으로 요약하는 '일일 개요'를 한국어로 작성해주세요.
각 카테고리({themes})의 핵심 포인트를 한 줄씩 언급하세요.
AI를 공부하는 사람들에게 오늘 꼭 알아야 할 핵심을 강조해주세요.
일반 텍스트로만 응답하세요."""

    try:
        overview_response = llm.invoke([HumanMessage(content=overview_prompt)])
        daily_overview = overview_response.content.strip()
    except Exception as e:
        print(f"  [WARNING] 일일 개요 생성 실패: {e}")
        daily_overview = f"오늘의 AI 뉴스: {themes} 분야에서 주요 업데이트가 있었습니다."

    # ─── 최종 기사 정리 ───
    final_articles = []
    for a in all_summarized:
        final_articles.append({
            "title": a["title"],
            "description": a["description"],
            "link": a["link"],
            "published": a["published"],
            "source": a["source"],
            "source_type": a.get("source_type", ""),
            "summary": a.get("summary", a["description"][:300]),
            "category": a.get("category", ""),
            "category_name": a.get("category_name", ""),
            "type": a.get("type", "long"),
            "howToGuide": a.get("howToGuide", ""),
            "importance_score": a.get("importance_score", 0),
            "social_score": a.get("social_score", 0),
            "theme": a.get("category_name", ""),
        })

    short_final = len([a for a in final_articles if a["type"] == "short"])
    long_final = len([a for a in final_articles if a["type"] == "long"])
    howto_count = len([a for a in final_articles if a.get("howToGuide")])
    print(f"  [OK] 숏폼 {short_final}개 + 롱폼 {long_final}개 = 총 {len(final_articles)}개 요약 완료")
    print(f"  [OK] How-to Guide 포함: {howto_count}개")

    return {"final_articles": final_articles, "daily_overview": daily_overview}


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
    }

    result = graph.invoke(initial_state)

    final = result["final_articles"]
    short_count = len([a for a in final if a.get("type") == "short"])
    long_count = len([a for a in final if a.get("type") == "long"])

    print(f"\n[DONE] 뉴스 에이전트 팀 완료")
    print(f"  수집: {len(result.get('raw_articles', []))}개")
    print(f"  분석: {len(result.get('analyzed_articles', []))}개")
    print(f"  최종: 숏폼 {short_count}개 + 롱폼 {long_count}개 = {len(final)}개")

    return result
