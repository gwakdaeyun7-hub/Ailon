"""
뉴스 에이전트 팀 - LangGraph 기반 멀티에이전트 뉴스 큐레이션
CollectorAgent → AnalyzerAgent → CuratorAgent → SummarizerAgent
"""

import json
from typing import TypedDict, Annotated
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, START, END

from agents.config import get_llm
from agents.tools import fetch_rss_articles


# ─── 상태 정의 ───
class NewsState(TypedDict):
    raw_articles: list[dict]
    analyzed_articles: list[dict]
    curated_articles: list[dict]
    final_articles: list[dict]
    daily_overview: str
    highlight: dict
    themes: list[str]


# ─── Agent 1: CollectorAgent ───
def collector_node(state: NewsState) -> dict:
    """RSS 피드에서 뉴스를 수집하고 중복 제거/필터링 (LLM 호출 없음)"""
    print("\n📰 [CollectorAgent] RSS 피드에서 뉴스 수집 중...")

    articles = fetch_rss_articles()
    print(f"  ✓ {len(articles)}개의 AI 관련 기사 수집 완료")

    return {"raw_articles": articles}


# ─── Agent 2: AnalyzerAgent ───
def analyzer_node(state: NewsState) -> dict:
    """수집된 기사를 분석하여 관련성/신선도/실용성 점수 매김 (LLM 1회)"""
    print("\n🔍 [AnalyzerAgent] 기사 분석 및 점수 산정 중...")

    articles = state["raw_articles"]
    if not articles:
        return {"analyzed_articles": []}

    llm = get_llm(temperature=0.3, max_tokens=4096)

    articles_text = ""
    for i, a in enumerate(articles[:30]):
        articles_text += f"\n[{i}] 제목: {a['title']}\n    설명: {a['description'][:200]}\n    출처: {a['source']}\n"

    prompt = f"""당신은 AI 뉴스 분석 전문가입니다. 다음 {len(articles[:30])}개의 AI 뉴스 기사를 분석해주세요.

각 기사에 대해 다음 3가지 기준으로 1~10점 점수를 매기세요:
- relevance: AI 학습자/실무자에게 얼마나 관련 있는지
- novelty: 얼마나 새롭고 독창적인 정보인지
- practicality: 실용적 가치가 있는지 (적용 가능성)

반드시 JSON 배열로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요:
[{{"index": 0, "relevance": 8, "novelty": 7, "practicality": 6, "total": 21}}, ...]

기사 목록:
{articles_text}"""

    response = llm.invoke([HumanMessage(content=prompt)])

    try:
        # JSON 파싱 - 코드블록 마커 제거
        text = response.content.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        if text.startswith("json"):
            text = text[4:].strip()

        scores = json.loads(text)
        scored_articles = []
        for score_item in scores:
            idx = score_item.get("index", 0)
            if idx < len(articles):
                article = articles[idx].copy()
                article["relevance"] = score_item.get("relevance", 5)
                article["novelty"] = score_item.get("novelty", 5)
                article["practicality"] = score_item.get("practicality", 5)
                article["total_score"] = score_item.get("total", 15)
                scored_articles.append(article)

        # 점수 순 정렬
        scored_articles.sort(key=lambda x: x.get("total_score", 0), reverse=True)
        print(f"  ✓ {len(scored_articles)}개 기사 분석 완료")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  ⚠ 분석 결과 파싱 실패, 원본 사용: {e}")
        scored_articles = articles[:15]
        for a in scored_articles:
            a["total_score"] = 15

    return {"analyzed_articles": scored_articles}


# ─── Agent 3: CuratorAgent ───
def curator_node(state: NewsState) -> dict:
    """분석된 기사 중 상위 기사를 선별하고 테마별로 그룹화 (LLM 1회)"""
    print("\n🎯 [CuratorAgent] 최상위 기사 선별 및 테마 분류 중...")

    articles = state["analyzed_articles"]
    if not articles:
        return {"curated_articles": [], "highlight": {}, "themes": []}

    # 상위 8개 선택
    top_articles = articles[:8]

    llm = get_llm(temperature=0.5, max_tokens=2048)

    articles_text = ""
    for i, a in enumerate(top_articles):
        articles_text += f"[{i}] {a['title']} (점수: {a.get('total_score', '?')})\n"

    prompt = f"""당신은 AI 뉴스 큐레이터입니다. 다음 {len(top_articles)}개의 상위 기사를 분석하세요.

1. 이 기사들을 2-4개의 테마로 분류하세요 (예: "LLM 발전", "AI 규제", "AI 응용" 등)
2. 가장 중요한 하이라이트 기사 1개를 선택하세요 (인덱스)
3. 각 기사가 어떤 테마에 속하는지 분류하세요

반드시 다음 JSON 형식으로만 응답하세요:
{{
  "themes": ["테마1", "테마2", "테마3"],
  "highlight_index": 0,
  "article_themes": [0, 1, 0, 2, 1, 0, 2, 1]
}}

기사 목록:
{articles_text}"""

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

        curation = json.loads(text)
        themes = curation.get("themes", [])
        highlight_idx = curation.get("highlight_index", 0)
        article_themes_map = curation.get("article_themes", [])

        # 기사에 테마 정보 추가
        for i, article in enumerate(top_articles):
            if i < len(article_themes_map):
                theme_idx = article_themes_map[i]
                if theme_idx < len(themes):
                    article["theme"] = themes[theme_idx]

        highlight = top_articles[highlight_idx] if highlight_idx < len(top_articles) else top_articles[0]
        print(f"  ✓ {len(themes)}개 테마로 분류, 하이라이트: {highlight['title'][:40]}...")

    except (json.JSONDecodeError, KeyError) as e:
        print(f"  ⚠ 큐레이션 파싱 실패, 기본값 사용: {e}")
        themes = ["AI 뉴스"]
        highlight = top_articles[0] if top_articles else {}

    return {
        "curated_articles": top_articles,
        "highlight": highlight,
        "themes": themes,
    }


# ─── Agent 4: SummarizerAgent ───
def summarizer_node(state: NewsState) -> dict:
    """선별된 기사를 한국어로 요약하고 일일 개요 생성 (LLM 2-3회)"""
    print("\n📝 [SummarizerAgent] 한국어 요약 및 일일 개요 생성 중...")

    articles = state["curated_articles"]
    if not articles:
        return {"final_articles": [], "daily_overview": ""}

    llm = get_llm(temperature=0.7, max_tokens=4096)

    # 배치로 요약 (한 번에 4개씩)
    summarized = []
    batch_size = 4
    for batch_start in range(0, len(articles), batch_size):
        batch = articles[batch_start:batch_start + batch_size]

        batch_text = ""
        for i, a in enumerate(batch):
            batch_text += f"\n[기사 {i+1}]\n제목: {a['title']}\n설명: {a['description'][:300]}\n"

        prompt = f"""다음 {len(batch)}개의 AI 뉴스를 각각 한국어로 요약해주세요.
각 기사당 3-4문장으로 핵심 내용과 AI 학습자에게 유용한 인사이트를 포함해주세요.

반드시 JSON 배열로만 응답하세요:
[{{"index": 1, "summary": "요약 내용..."}}, ...]

{batch_text}"""

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

            summaries = json.loads(text)
            for s in summaries:
                idx = s.get("index", 1) - 1
                if 0 <= idx < len(batch):
                    batch[idx]["summary"] = s.get("summary", batch[idx]["description"][:300])

        except (json.JSONDecodeError, KeyError) as e:
            print(f"  ⚠ 요약 파싱 실패, 설명 사용: {e}")
            for a in batch:
                if "summary" not in a:
                    a["summary"] = a["description"][:300]

        summarized.extend(batch)

    # 일일 개요 생성
    titles = "\n".join([f"- {a['title']}" for a in summarized])
    themes = ", ".join(state.get("themes", []))

    overview_prompt = f"""오늘의 AI 뉴스 주요 테마: {themes}

주요 기사 제목:
{titles}

위 내용을 바탕으로 오늘의 AI 뉴스 동향을 3-4문장으로 요약하는 '일일 개요'를 한국어로 작성해주세요.
AI를 공부하는 사람들에게 오늘 꼭 알아야 할 핵심 포인트를 강조해주세요.
일반 텍스트로만 응답하세요."""

    overview_response = llm.invoke([HumanMessage(content=overview_prompt)])
    daily_overview = overview_response.content.strip()

    # 최종 기사에서 분석용 내부 필드 제거
    final_articles = []
    for a in summarized:
        final_articles.append({
            "title": a["title"],
            "description": a["description"],
            "link": a["link"],
            "published": a["published"],
            "source": a["source"],
            "summary": a.get("summary", a["description"][:300]),
            "theme": a.get("theme", ""),
        })

    print(f"  ✓ {len(final_articles)}개 기사 요약 완료")
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
    print("🚀 뉴스 에이전트 팀 시작")
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
    }

    result = graph.invoke(initial_state)

    print(f"\n✅ 뉴스 에이전트 팀 완료: {len(result['final_articles'])}개 기사 큐레이션")
    return result
