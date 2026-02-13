"""
뉴스 크루 - CrewAI 기반 멀티에이전트 뉴스 큐레이션 (LangGraph news_team 대체)

5 CrewAI 에이전트:
CollectorAgent → AnalyzerAgent → FilteringAgent → CuratorAgent → SummarizerAgent

3 카테고리:
  core_tech:     모델, 논문, 벤치마크
  dev_tools:     GitHub, 프레임워크, 도구
  trend_insight: 에이전트, 투자, 비즈니스
"""

import json
from crewai import Agent, Task, Crew, Process

from agents.config import get_crewai_llm
from agents.tools import fetch_all_sources, calculate_importance_score


# ─── 3 신규 카테고리 ───
CREW_NEWS_CATEGORIES = {
    "core_tech": "Core Tech (모델·논문·벤치마크)",
    "dev_tools": "Dev & Tools (GitHub·프레임워크·도구)",
    "trend_insight": "Trend & Insight (에이전트·투자·비즈니스)",
}

# 5 레거시 카테고리 → 3 카테고리 매핑 (Firestore 하위호환)
LEGACY_TO_NEW_CATEGORY = {
    "models_architecture": "core_tech",
    "agentic_reality": "trend_insight",
    "opensource_code": "dev_tools",
    "physical_ai": "core_tech",
    "policy_safety": "trend_insight",
}


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


def _keyword_classify_new(article: dict) -> str:
    """키워드 기반 폴백 카테고리 분류 (3 카테고리)"""
    text = (article.get("title", "") + " " + article.get("description", "")).lower()

    core_tech_kw = ["model", "paper", "arxiv", "benchmark", "llm", "gpt", "claude", "gemini",
                    "transformer", "training", "inference", "multimodal", "architecture"]
    dev_tools_kw = ["github", "framework", "library", "sdk", "api", "tool", "open source",
                    "release", "launch", "developer", "code", "hugging face", "ollama"]
    trend_insight_kw = ["agent", "agentic", "investment", "funding", "startup", "business",
                        "regulation", "policy", "trend", "market", "vc", "acquisition"]

    scores = {
        "core_tech": sum(1 for kw in core_tech_kw if kw in text),
        "dev_tools": sum(1 for kw in dev_tools_kw if kw in text),
        "trend_insight": sum(1 for kw in trend_insight_kw if kw in text),
    }
    return max(scores, key=scores.get)


def run_news_crew() -> dict:
    """뉴스 크루 실행 및 결과 반환 (generate_daily.py 호환)"""
    print("=" * 60)
    print("[START] 뉴스 크루 시작 (CrewAI, 3 카테고리)")
    print("=" * 60)

    # ─── Step 1: 수집 (외부 도구 직접 실행) ───
    print("\n[CollectorAgent] 3개 Tool로 뉴스 수집 중...")
    raw_articles = fetch_all_sources()
    print(f"  [OK] {len(raw_articles)}개 수집 완료")

    llm = get_crewai_llm(temperature=0.3, max_tokens=8192)

    # ─── Step 2: AnalyzerAgent ───
    print("\n[AnalyzerAgent] 3카테고리 분류 + 3축 점수 산정 중...")
    analyzed_articles = []
    batch_size = 50

    categories_text = "\n".join([
        f"- {key}: {name}" for key, name in CREW_NEWS_CATEGORIES.items()
    ])

    for batch_start in range(0, min(len(raw_articles), 200), batch_size):
        batch = raw_articles[batch_start:batch_start + batch_size]
        articles_text = ""
        for i, a in enumerate(batch):
            articles_text += (
                f"[{i}] 제목: {a['title']}\n"
                f"    설명: {a['description'][:200]}\n"
                f"    출처: {a['source']}\n\n"
            )

        analyzer_agent = Agent(
            role="AI 뉴스 분석가",
            goal="AI 뉴스를 3개 카테고리로 분류하고 3축 점수를 부여",
            backstory="AI 트렌드에 정통한 분석가로, 뉴스의 관련성·새로움·실용성을 객관적으로 평가해요.",
            llm=llm,
            verbose=False,
        )

        analyze_task = Task(
            description=f"""다음 {len(batch)}개 AI 뉴스를 분석해주세요.

## 카테고리 정의
{categories_text}

## 분석 기준
각 기사에 대해:
1. 3개 카테고리 중 가장 적합한 1개 선택 (key 값 사용)
2. 3축 점수 (1~10):
   - relevance: AI 학습자/실무자 관련성
   - novelty: 새로움·독창성
   - practicality: 실용적 가치

반드시 JSON 배열로만 응답하세요:
[{{"index": 0, "category": "core_tech", "relevance": 8, "novelty": 7, "practicality": 6}}]

기사 목록:
{articles_text}""",
            expected_output="JSON 배열 형식의 분류 결과",
            agent=analyzer_agent,
        )

        crew = Crew(agents=[analyzer_agent], tasks=[analyze_task], process=Process.sequential, verbose=False)

        try:
            result = crew.kickoff()
            scores = parse_llm_json(str(result))
            for score_item in scores:
                idx = score_item.get("index", 0)
                if idx < len(batch):
                    article = batch[idx].copy()
                    article["category"] = score_item.get("category", "core_tech")
                    article["relevance"] = score_item.get("relevance", 5)
                    article["novelty"] = score_item.get("novelty", 5)
                    article["practicality"] = score_item.get("practicality", 5)
                    article["importance_score"] = calculate_importance_score(
                        source_name=article.get("source", ""),
                        social_score=article.get("social_score", 0),
                        practicality_score=article["practicality"],
                    )
                    article["total_score"] = article["relevance"] + article["novelty"] + article["practicality"]
                    analyzed_articles.append(article)
        except Exception as e:
            print(f"  [WARNING] 배치 {batch_start} 분석 실패: {e}")
            for a in batch:
                article = a.copy()
                article["category"] = _keyword_classify_new(article)
                article["relevance"] = 5
                article["novelty"] = 5
                article["practicality"] = 5
                article["total_score"] = 15
                analyzed_articles.append(article)

    print(f"  [OK] {len(analyzed_articles)}개 분석 완료")

    # ─── Step 3: FilteringAgent ─── (중복·광고 제거)
    print("\n[FilteringAgent] 중복/광고 제거 중...")
    seen_titles = set()
    filtered_articles = []
    ad_keywords = ["sponsored", "advertisement", "promo", "discount", "sale", "buy now"]
    for article in analyzed_articles:
        clean_title = article["title"].lower()
        for prefix in ["[arxiv] ", "[hf paper] ", "[github] "]:
            clean_title = clean_title.replace(prefix, "")
        if clean_title in seen_titles:
            continue
        if any(kw in clean_title for kw in ad_keywords):
            continue
        seen_titles.add(clean_title)
        filtered_articles.append(article)
    print(f"  [OK] {len(filtered_articles)}개 남음 ({len(analyzed_articles) - len(filtered_articles)}개 제거)")

    # ─── Step 4: CuratorAgent ─── (TOP 3 선별)
    print("\n[CuratorAgent] TOP 3 선별 중...")
    categories_grouped = {k: [] for k in CREW_NEWS_CATEGORIES}
    for a in filtered_articles:
        cat = a.get("category", "core_tech")
        if cat not in categories_grouped:
            cat = LEGACY_TO_NEW_CATEGORY.get(cat, "core_tech")
            a["category"] = cat
        categories_grouped[cat].append(a)

    for k in categories_grouped:
        categories_grouped[k].sort(key=lambda x: x.get("importance_score", 0), reverse=True)

    # TOP 3: 카테고리별 최상위 1개씩 선택
    top3 = []
    for cat_key in CREW_NEWS_CATEGORIES:
        cat_articles = categories_grouped.get(cat_key, [])
        if not cat_articles:
            cat_articles = sorted(filtered_articles, key=lambda x: x.get("importance_score", 0), reverse=True)
        if cat_articles:
            best = cat_articles[0].copy()
            best["category"] = cat_key
            best["category_name"] = CREW_NEWS_CATEGORIES[cat_key]
            best["type"] = "short"
            top3.append(best)

    highlight = max(top3, key=lambda x: x.get("importance_score", 0)) if top3 else {}
    themes = list(CREW_NEWS_CATEGORIES.values())

    # daily_overview 생성
    titles_text = "\n".join([f"- [{a.get('category_name','')}] {a['title']}" for a in top3])
    curator_agent = Agent(
        role="AI 뉴스 큐레이터",
        goal="오늘의 AI 뉴스 동향을 한국어로 4-5문장 요약",
        backstory="AI 트렌드를 한국 독자에게 친절하게 전달하는 큐레이터예요.",
        llm=llm,
        verbose=False,
    )
    overview_task = Task(
        description=f"""오늘의 AI 뉴스 TOP 3:
{titles_text}

위 내용을 바탕으로 오늘의 AI 뉴스 동향을 4-5문장으로 요약하는 '일일 개요'를 한국어로 작성해주세요.
Core Tech, Dev & Tools, Trend & Insight 3개 카테고리의 핵심 포인트를 언급하세요.
일반 텍스트로만 응답하세요.""",
        expected_output="4-5문장 한국어 일일 개요",
        agent=curator_agent,
    )
    crew2 = Crew(agents=[curator_agent], tasks=[overview_task], process=Process.sequential, verbose=False)
    try:
        overview_result = crew2.kickoff()
        daily_overview = str(overview_result).strip()
    except Exception as e:
        print(f"  [WARNING] 일일 개요 생성 실패: {e}")
        daily_overview = f"오늘의 AI 뉴스: {', '.join(themes)} 분야에서 주요 업데이트가 있었습니다."

    print(f"  [OK] TOP 3 선별 완료")

    # ─── Step 5: SummarizerAgent ─── (한국어 요약 + impact_comment)
    print("\n[SummarizerAgent] 한국어 요약 + 임팩트 코멘트 생성 중...")
    summarizer_agent = Agent(
        role="AI 뉴스 한국어 요약가",
        goal="AI 뉴스를 한국어로 요약하고 1줄 임팩트 코멘트 생성",
        backstory="AI를 공부하는 한국 학생들에게 핵심 인사이트를 전달하는 전문 요약가예요.",
        llm=get_crewai_llm(temperature=0.7, max_tokens=4096),
        verbose=False,
    )

    articles_text = ""
    for i, a in enumerate(top3):
        articles_text += (
            f"[{i+1}] 제목: {a['title']}\n"
            f"    설명: {a['description'][:300]}\n"
            f"    카테고리: {a.get('category_name', '')}\n\n"
        )

    summarize_task = Task(
        description=f"""다음 {len(top3)}개 AI 뉴스를 한국어로 요약하고 임팩트 코멘트를 작성해주세요.

## 요구사항
- summary: 100-200자 핵심 요약 (한국어)
- impact_comment: 1줄 임팩트 코멘트 (한국어, "이것이 중요한 이유: ..." 형식)
- howToGuide: 실무 활용 가이드 (선택적)

반드시 JSON 배열로만 응답하세요:
[{{"index": 1, "summary": "요약...", "impact_comment": "임팩트 코멘트...", "howToGuide": "가이드..."}}]

기사 목록:
{articles_text}""",
        expected_output="JSON 배열 형식의 요약 결과",
        agent=summarizer_agent,
    )

    crew3 = Crew(agents=[summarizer_agent], tasks=[summarize_task], process=Process.sequential, verbose=False)

    try:
        summ_result = crew3.kickoff()
        summaries = parse_llm_json(str(summ_result))
        for s in summaries:
            idx = s.get("index", 1) - 1
            if 0 <= idx < len(top3):
                top3[idx]["summary"] = s.get("summary", top3[idx]["description"][:200])
                top3[idx]["impact_comment"] = s.get("impact_comment", "")
                top3[idx]["howToGuide"] = s.get("howToGuide", "")
    except Exception as e:
        print(f"  [WARNING] 요약 파싱 실패: {e}")
        for a in top3:
            if "summary" not in a:
                a["summary"] = a["description"][:200]
            if "impact_comment" not in a:
                a["impact_comment"] = ""
            if "howToGuide" not in a:
                a["howToGuide"] = ""

    # ─── 최종 기사 정리 ───
    final_articles = []
    for a in top3:
        final_articles.append({
            "title": a["title"],
            "description": a["description"],
            "link": a.get("link", ""),
            "published": a.get("published", ""),
            "source": a.get("source", ""),
            "source_type": a.get("source_type", ""),
            "summary": a.get("summary", a["description"][:200]),
            "impact_comment": a.get("impact_comment", ""),
            "category": a.get("category", "core_tech"),
            "category_name": a.get("category_name", ""),
            "type": "short",
            "howToGuide": a.get("howToGuide", ""),
            "importance_score": a.get("importance_score", 0),
            "social_score": a.get("social_score", 0),
            "theme": a.get("category_name", ""),
        })

    print(f"\n[DONE] 뉴스 크루 완료")
    print(f"  수집: {len(raw_articles)}개 → 분석: {len(analyzed_articles)}개 → 필터: {len(filtered_articles)}개 → 최종: {len(final_articles)}개")

    return {
        "raw_articles": raw_articles,
        "analyzed_articles": analyzed_articles,
        "curated_articles": top3,
        "final_articles": final_articles,
        "daily_overview": daily_overview,
        "highlight": highlight,
        "themes": themes,
        "categories": categories_grouped,
    }
