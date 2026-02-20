"""
뉴스 에이전트 팀 - LangGraph 기반 멀티에이전트 뉴스 큐레이션

CollectorAgent (4개 전용 Tool 장착)
  → Tool A (Academic):   arXiv + Hugging Face Daily Papers       → model_research
  → Tool B (Developer):  GitHub Trending                         → product_tools
  → Tool C (Industry):   VentureBeat AI + TechCrunch AI          → industry_business
  → Tool D (Discovery):  Tavily + Reddit AI 서브레딧 + HN         → 3카테고리 분산 (LLM)
  → 가로 스크롤:          OpenAI/Anthropic/DeepMind, AI타임스+GeekNews, TLDR AI
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
    ranked_categories: dict    # RankerAgent 출력: 카테고리별 전체 (main+more)
    ranked_main: dict          # 카테고리별 이미지 소스 기사 (최대 6개, 하이라이트 제거 후 최대 5개)
    ranked_more: dict          # 카테고리별 비이미지 기사 (최대 5개)
    final_articles: list[dict]
    daily_overview: str
    highlight: dict
    themes: list[str]
    categories: dict           # AnalyzerAgent 출력: 카테고리별 전체 기사
    horizontal_sections: dict  # 가로 스크롤 섹션 (공식 발표 / 한국 AI / 큐레이션)
    text_only_articles: list[dict]  # 이미지 없는 소스 기사 (arxiv, reddit 등)


# 텍스트 전용 소스 (이미지 없는 소스 → text_only_articles로 분리)
_TEXT_ONLY_SOURCES = {"arxiv", "reddit", "huggingface", "curation"}

# ─── 한국어 감지 ───
def _is_korean(text: str) -> bool:
    """텍스트에 한글이 포함되어 있으면 True (간단한 휴리스틱)"""
    if not text:
        return False
    korean_count = sum(1 for ch in text if '\uac00' <= ch <= '\ud7a3' or '\u3131' <= ch <= '\u3163')
    return korean_count >= 2


# 출처 신뢰도 티어 (rank_score 계산용)
_SOURCE_TIER: dict[str, int] = {
    "arxiv": 9, "huggingface": 9, "official_blog": 9,
    "github": 8, "tavily": 7, "venturebeat": 7, "techcrunch": 7,
    "hackernews": 6, "curation": 6, "korean_news": 5, "reddit": 4,
}


# ─── JSON 파싱 유틸리티 ───
def parse_llm_json(text: str):
    """LLM 응답에서 JSON을 파싱하는 유틸리티 (마크다운·산문·잘린 JSON 대응)"""
    import re
    text = text.strip()

    # ── 마크다운 코드 블록 제거 ──
    text = re.sub(r'^```(?:json)?\s*\n?', '', text)
    text = re.sub(r'\n?```\s*$', '', text)
    text = text.strip()
    if text.startswith("json"):
        text = text[4:].strip()

    # ── 직접 파싱 ──
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # ── JSON 배열/객체 위치 탐색 (앞뒤 산문 무시, 중괄호 균형 추적) ──
    for start_char, end_char in [('[', ']'), ('{', '}')]:
        start_idx = text.find(start_char)
        if start_idx == -1:
            continue
        depth = 0
        in_string = False
        escape_next = False
        for i, ch in enumerate(text[start_idx:], start=start_idx):
            if escape_next:
                escape_next = False
                continue
            if ch == '\\' and in_string:
                escape_next = True
                continue
            if ch == '"':
                in_string = not in_string
            if not in_string:
                if ch == start_char:
                    depth += 1
                elif ch == end_char:
                    depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(text[start_idx:i + 1])
                        except json.JSONDecodeError:
                            break

    raise json.JSONDecodeError("No valid JSON found in LLM response", text, 0)


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

    # 배치로 분석 (한 번에 25개씩 - 안정성 및 JSON 파싱 성공률 향상)
    all_scored_articles = []
    batch_size = 25

    for batch_start in range(0, len(articles), batch_size):
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
2. 다음 5가지 기준으로 1~10점 점수 부여:
   - relevance:     AI 학습자/실무자에게 얼마나 관련 있는지
   - novelty:       얼마나 새롭고 독창적인 정보인지
   - practicality:  실용적 가치 (코드, 도구, 방법론 등 적용 가능성)
   - timeliness:    오늘 기준 정보 신선도 (AI는 1주일 전도 구식일 수 있음, 최신일수록 높게)
   - accessibility: 한국 AI 실무자가 배경지식 없이 이해·활용 가능한가

OUTPUT ONLY VALID JSON ARRAY (no markdown, no explanation):
[{{"index": 0, "category": "model_research", "relevance": 8, "novelty": 7, "practicality": 6, "timeliness": 9, "accessibility": 7}}, ...]

기사 목록:
{articles_text}"""

        try:
            response = llm.invoke([HumanMessage(content=prompt)])
            scores = parse_llm_json(response.content)
            # llama 등 일부 모델이 dict로 감싸거나 문자열 섞어 반환할 수 있음
            if isinstance(scores, dict):
                scores = next((v for v in scores.values() if isinstance(v, list)), [])
            if not isinstance(scores, list):
                scores = []

            for score_item in scores:
                if not isinstance(score_item, dict):
                    continue
                idx = score_item.get("index", 0)
                if idx < len(batch):
                    article = batch[idx].copy()
                    article["category"]     = score_item.get("category", "model_research")
                    article["relevance"]    = score_item.get("relevance", 5)
                    article["novelty"]      = score_item.get("novelty", 5)
                    article["practicality"] = score_item.get("practicality", 5)
                    article["timeliness"]   = score_item.get("timeliness", 5)
                    article["accessibility"]= score_item.get("accessibility", 5)

                    # 소셜 반응 정규화 (0-10)
                    s = article.get("social_score", 0)
                    social_n = (10 if s > 1000 else 8 if s > 500 else 6 if s > 100
                                else 5 if s > 50 else 3 if s > 10 else 1)
                    # 출처 신뢰도 티어
                    src_tier = _SOURCE_TIER.get(article.get("source_type", ""), 5)

                    # 복합 랭킹 점수 (rank_score)
                    article["rank_score"] = round(
                        article["practicality"]    * 3.0   # 30% — 실무 적용 가능성
                        + article["relevance"]     * 2.5   # 25% — 카테고리 관련성
                        + article["accessibility"] * 2.0   # 20% — 독자 접근성
                        + article["novelty"]       * 1.5   # 15% — 정보 참신성
                        + article["timeliness"]    * 1.0   # 10% — 정보 신선도
                        + social_n                 * 0.5   # 소셜 반응 보너스
                        + src_tier                 * 0.3   # 출처 신뢰도 보너스
                    , 2)

                    # importance_score 유지 (레거시 호환)
                    from agents.tools import calculate_importance_score
                    article["importance_score"] = calculate_importance_score(
                        source_name=article.get("source", ""),
                        social_score=article.get("social_score", 0),
                        practicality_score=article["practicality"],
                    )
                    all_scored_articles.append(article)

        except (json.JSONDecodeError, KeyError, AttributeError, TypeError) as e:
            print(f"  [WARNING] 배치 {batch_start} 분석 파싱 실패 (폴백: 키워드 분류): {e}")
            for a in batch:
                article = a.copy()
                article["category"]      = _keyword_classify(article)
                article["relevance"]     = 5
                article["novelty"]       = 5
                article["practicality"]  = 5
                article["timeliness"]    = 5
                article["accessibility"] = 5
                s = article.get("social_score", 0)
                social_n = (10 if s > 1000 else 8 if s > 500 else 6 if s > 100
                            else 5 if s > 50 else 3 if s > 10 else 1)
                src_tier = _SOURCE_TIER.get(article.get("source_type", ""), 5)
                article["rank_score"] = round(
                    5 * 3.0 + 5 * 2.5 + 5 * 2.0 + 5 * 1.5 + 5 * 1.0
                    + social_n * 0.5 + src_tier * 0.3
                , 2)
                article["importance_score"] = article.get("importance_score", 50)
                all_scored_articles.append(article)

    # 카테고리별 그룹화
    categories_grouped = {}
    for cat_key in NEWS_CATEGORIES:
        cat_articles = [a for a in all_scored_articles if a.get("category") == cat_key]
        cat_articles.sort(key=lambda x: x.get("rank_score", 0), reverse=True)
        categories_grouped[cat_key] = cat_articles

    # 전체 점수 순 정렬
    all_scored_articles.sort(key=lambda x: x.get("rank_score", 0), reverse=True)

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


# ─── 다양성 보조 함수 ───
def _diversify_articles(articles: list[dict], max_count: int = 10) -> list[dict]:
    """rank_score 내림차순으로 max_count개까지 선택"""
    sorted_arts = sorted(articles, key=lambda x: x.get("rank_score", 0), reverse=True)
    return sorted_arts[:max_count]


# ─── Agent 3: RankerAgent (CuratorAgent 대체) ───
def ranker_node(state: NewsState) -> dict:
    """
    카테고리별 상위 11개 선별 → 하이라이트 1개 + 나머지 10개
    - LLM 1회: 전체 후보 중 하이라이트 1개 선정
    """
    print("\n[RankerAgent] 카테고리별 11개 선별 + 하이라이트 선정 중...")

    llm = get_llm(temperature=0.3, max_tokens=1024)
    categories = state.get("categories", {})
    analyzed = state["analyzed_articles"]

    if not analyzed:
        return {"ranked_categories": {}, "ranked_main": {}, "ranked_more": {}, "highlight": {}, "themes": [], "text_only_articles": []}

    # ─── 텍스트 전용 소스 분리 ───
    text_only_all = []
    image_categories: dict[str, list[dict]] = {}
    for cat_key, cat_articles in categories.items():
        img_arts = []
        for a in cat_articles:
            if a.get("source_type", "") in _TEXT_ONLY_SOURCES:
                text_only_all.append(a)
            else:
                img_arts.append(a)
        image_categories[cat_key] = img_arts

    # text_only: published 내림차순, 상위 5개
    text_only_all.sort(key=lambda x: x.get("published", ""), reverse=True)
    text_only_articles = text_only_all[:5]
    print(f"  [OK] 텍스트 전용 소스 분리: {len(text_only_articles)}개 (전체 {len(text_only_all)}개 중)")

    ranked_categories: dict[str, list[dict]] = {}
    used_titles: set[str] = set()
    themes = []

    FALLBACK_SOURCES = {
        "model_research":    ["arxiv", "huggingface"],
        "product_tools":     ["github"],
        "industry_business": ["techcrunch", "zdnet"],
    }

    for cat_key, cat_name in NEWS_CATEGORIES.items():
        cat_articles = list(image_categories.get(cat_key, []))

        # 폴백: 해당 카테고리 기사가 5개 미만이면 소스 타입 기반 보충
        if len(cat_articles) < 5:
            preferred = FALLBACK_SOURCES.get(cat_key, [])
            extra = [
                a for a in analyzed
                if a.get("source_type") in preferred
                and a["title"] not in {x["title"] for x in cat_articles}
            ]
            cat_articles = cat_articles + extra

        if not cat_articles:
            cat_articles = [a for a in analyzed if a["title"] not in used_titles]

        # 상위 11개 선택 (이미지/비이미지 구분 없이)
        top = []
        for a in _diversify_articles(cat_articles, max_count=11):
            if a["title"] not in used_titles:
                ac = a.copy()
                ac["category"] = cat_key
                ac["category_name"] = cat_name
                top.append(ac)
                used_titles.add(ac["title"])

        ranked_categories[cat_key] = top

        if top:
            themes.append(cat_name)
        print(f"  [OK] {cat_name}: {len(top)}개 선별")

    # ─── 하이라이트 선정 (LLM) — 카테고리별 상위 3개 = 최대 9개 후보 ───
    llm_pool = [
        a for arts in ranked_categories.values() for a in arts[:3]
    ]

    highlight: dict = {}
    if llm_pool:
        llm_candidates = llm_pool
        print(f"  [하이라이트 후보] {len(llm_candidates)}개")

        candidates_text = "\n".join([
            f"[{i}] [{a.get('category_name', '')}] {a['title'][:90]}\n"
            f"     출처:{a.get('source','')} | rank:{a.get('rank_score',0)} "
            f"| 관련성:{a.get('relevance',0)} 실용성:{a.get('practicality',0)} "
            f"시의성:{a.get('timeliness',0)} 접근성:{a.get('accessibility',0)}"
            for i, a in enumerate(llm_candidates)
        ])
        prompt = f"""당신은 AI 뉴스 편집장입니다. 오늘의 하이라이트 기사 1개를 선정하세요.

## 후보 기사 ({len(llm_candidates)}개)
{candidates_text}

## 평가 기준 (각 항목 1~5점)
1. 파급력(impact)  : AI 업계 전반에 미치는 영향 — 연구자·개발자·비즈니스 모두 포함
2. 시의성(urgency) : 오늘 당장 알아야 할 긴급성과 최신성
3. 실용성(utility) : 독자가 내일 바로 활용·적용할 수 있는 구체적 가치
4. 독창성(novelty) : 다른 기사와 차별화되는 오늘만의 특별한 발견
5. 흥미도(appeal)  : AI 비전문가도 "이게 뭐야?" 하고 클릭할 만한 스토리성

## 선정 규칙
- 5개 점수 합산 → 최고점 기사 선정
- 동점 시 우선순위: 파급력 > 실용성 > 흥미도
- "오늘 이 뉴스를 놓치면 안 된다"는 기사, 단순 점수 1위가 아닌 편집 판단 허용

OUTPUT ONLY VALID JSON (no markdown, no explanation):
{{"index": 0, "scores": {{"impact": 5, "urgency": 4, "utility": 4, "novelty": 3, "appeal": 5}}, "total": 21, "reason": "선정 이유"}}

반드시 위 형식의 JSON만 출력하세요. 마크다운이나 설명을 포함하지 마세요."""

        try:
            response = llm.invoke([HumanMessage(content=prompt)])
            result_json = parse_llm_json(response.content)
            idx = result_json.get("index", 0)
            if 0 <= idx < len(llm_candidates):
                highlight = llm_candidates[idx].copy()
                highlight["highlight_reason"] = result_json.get("reason", "")
                highlight["highlight_scores"] = result_json.get("scores", {})
            else:
                highlight = max(llm_candidates, key=lambda x: x.get("rank_score", 0))
        except Exception as e:
            print(f"  [INFO] 하이라이트 LLM 선정 실패 (폴백: rank_score): {e}")
            highlight = max(llm_candidates, key=lambda x: x.get("rank_score", 0))

    # ─── 하이라이트 제거: ranked_categories에서 제거 (카테고리당 최대 10개 유지) ───
    if highlight:
        highlight_title = highlight.get("title", "")
        for cat_key in list(ranked_categories.keys()):
            ranked_categories[cat_key] = [a for a in ranked_categories[cat_key] if a["title"] != highlight_title]

    total = sum(len(v) for v in ranked_categories.values())
    print(f"  [OK] 총 {total}개 선별 (카테고리당 최대 10개, 하이라이트 1개 별도)")
    print(f"  [OK] 하이라이트: {highlight.get('title', 'N/A')[:60]}")

    return {
        "ranked_categories": ranked_categories,
        "ranked_main": {},
        "ranked_more": {},
        "highlight": highlight,
        "themes": themes,
        "text_only_articles": text_only_articles,
    }


# ─── Agent 4: SummarizerAgent (카테고리당 10개 × 3 = 최대 30개 처리) ───
def summarizer_node(state: NewsState) -> dict:
    """
    선별된 최대 30개 기사 한국어 요약 + How-to Guide 생성
    5개 배치 × 최대 6회 LLM + 일일 개요 1회 = 최대 7회 LLM 호출
    """
    print("\n[SummarizerAgent] 한국어 요약 및 How-to Guide 생성 중...")

    # ranked_categories에서 기사 읽기
    seen_titles: set[str] = set()
    articles: list[dict] = []
    for cat_arts in state.get("ranked_categories", {}).values():
        for a in cat_arts:
            if a["title"] not in seen_titles:
                articles.append(a.copy())
                seen_titles.add(a["title"])

    # text_only_articles도 요약 대상에 포함
    text_only_articles = [a.copy() for a in state.get("text_only_articles", [])]
    for a in text_only_articles:
        if a["title"] not in seen_titles:
            seen_titles.add(a["title"])

    if not articles and not text_only_articles:
        return {
            "final_articles": [],
            "daily_overview": "",
            "horizontal_sections": state.get("horizontal_sections", {}),
            "text_only_articles": [],
        }

    llm = get_llm(temperature=0.7, max_tokens=4096)

    HOW_TO_GUIDE_HINT = {
        "model_research":    "코드/수식/논문 활용법 예시 포함 (없으면 빈 문자열)",
        "product_tools":     "설치/사용법 커맨드 또는 API 예시 포함 (없으면 빈 문자열)",
        "industry_business": "비즈니스 시사점 또는 투자·전략적 관점 1-2줄 (없으면 빈 문자열)",
    }

    # ─── 배치 요약 (5개씩) ───
    batch_size = 5
    for batch_start in range(0, len(articles), batch_size):
        batch = articles[batch_start:batch_start + batch_size]

        batch_text = ""
        for i, a in enumerate(batch):
            cat = a.get("category", "model_research")
            guide_hint = HOW_TO_GUIDE_HINT.get(cat, "없으면 빈 문자열")
            batch_text += (
                f"\n[기사 {i+1}] (카테고리: {a.get('category_name', '')})\n"
                f"제목: {a['title']}\n"
                f"설명: {a['description'][:400]}\n"
                f"출처: {a.get('source', '')}\n"
                f"howToGuide 기준: {guide_hint}\n"
            )

        prompt = f"""다음 {len(batch)}개의 AI 뉴스를 각각 한국어로 요약해주세요.

## 요구사항
- display_title: 독자가 클릭하고 싶게 만드는 한국어 제목 (30자 이내)
  * 원문 제목의 핵심을 독자 관점으로 재해석 (영어 용어는 한국어 병기 또는 풀어쓰기)
  * 패턴 예시: "구글, 새 AI 모델 공개 — 추론·코딩 모두 1위", "무료로 GPT-4 수준 코딩 AI 쓰는 법"
  * 숫자, 대비, 행동 유발 요소 활용
- summary: 150-300자 한국어 요약 (핵심 내용 + 시사점)
- impact_comment: 한 줄 임팩트 코멘트 (40자 이내, 예: "개발자 필수 — 오늘부터 바로 써보세요")
- howToGuide: 각 기사의 'howToGuide 기준'에 맞게 작성 (없으면 빈 문자열 "")

반드시 아래 형식을 지키십시오:
- 모든 키와 문자열 값은 반드시 "큰따옴표(double quotes)"를 사용하세요.
- Markdown 코드 블록(```json) 없이 순수 JSON 텍스트만 출력하세요.

[{{"index": 1, "display_title": "...", "summary": "...", "impact_comment": "...", "howToGuide": "..."}}]

{batch_text}"""

        try:
            response = llm.invoke([HumanMessage(content=prompt)])
            summaries = parse_llm_json(response.content)
            if isinstance(summaries, dict):
                summaries = next((v for v in summaries.values() if isinstance(v, list)), [])
            if not isinstance(summaries, list):
                summaries = []
            for s in summaries:
                if not isinstance(s, dict):
                    continue
                idx = s.get("index", 1) - 1
                if 0 <= idx < len(batch):
                    batch[idx]["display_title"] = s.get("display_title", "")
                    batch[idx]["summary"] = s.get("summary", batch[idx]["description"][:300])
                    batch[idx]["impact_comment"] = s.get("impact_comment", "")
                    batch[idx]["howToGuide"] = s.get("howToGuide", "")
        except (json.JSONDecodeError, KeyError, AttributeError, TypeError) as e:
            print(f"  [WARNING] 배치 {batch_start} 요약 파싱 실패: {e}")
            for a in batch:
                a.setdefault("display_title", "")
                a.setdefault("summary", a["description"][:300])
                a.setdefault("impact_comment", "")
                a.setdefault("howToGuide", "")

    # ─── text_only_articles 요약 (별도 배치) ───
    if text_only_articles:
        t_text = ""
        for i, a in enumerate(text_only_articles):
            t_text += (
                f"\n[기사 {i+1}]\n"
                f"제목: {a['title']}\n"
                f"설명: {a['description'][:400]}\n"
                f"출처: {a.get('source', '')}\n"
            )
        t_prompt = f"""다음 {len(text_only_articles)}개의 AI 뉴스를 각각 한국어로 요약해주세요.

## 요구사항
- display_title: 독자가 클릭하고 싶게 만드는 한국어 제목 (30자 이내)
- summary: 150-300자 한국어 요약 (핵심 내용 + 시사점)

반드시 아래 형식을 지키십시오:
[{{"index": 1, "display_title": "...", "summary": "..."}}]

{t_text}"""
        try:
            t_resp = llm.invoke([HumanMessage(content=t_prompt)])
            t_summaries = parse_llm_json(t_resp.content)
            if isinstance(t_summaries, dict):
                t_summaries = next((v for v in t_summaries.values() if isinstance(v, list)), [])
            if isinstance(t_summaries, list):
                for s in t_summaries:
                    if not isinstance(s, dict):
                        continue
                    idx = s.get("index", 1) - 1
                    if 0 <= idx < len(text_only_articles):
                        text_only_articles[idx]["display_title"] = s.get("display_title", "")
                        text_only_articles[idx]["summary"] = s.get("summary", text_only_articles[idx]["description"][:300])
            print(f"  [OK] 텍스트 전용 {len(text_only_articles)}개 요약 완료")
        except Exception as e:
            print(f"  [WARNING] 텍스트 전용 요약 실패: {e}")
            for a in text_only_articles:
                a.setdefault("display_title", "")
                a.setdefault("summary", a["description"][:300])

    # ─── 일일 개요 생성 ───
    themes = ", ".join(state.get("themes", []))
    rep_titles = "\n".join([
        f"- [{a.get('category_name', '')}] {a['title']}"
        for a in articles[:9]
    ])
    overview_prompt = f"""오늘의 AI 뉴스 카테고리: {themes}

주요 기사:
{rep_titles}

위 내용을 바탕으로 오늘의 AI 뉴스 동향을 3-4문장으로 한국어 요약하세요.
각 카테고리(모델/연구, 제품/도구, 산업/비즈니스)의 핵심을 한 줄씩 언급하세요.
일반 텍스트로만 응답하세요."""

    try:
        overview_response = llm.invoke([HumanMessage(content=overview_prompt)])
        daily_overview = overview_response.content.strip()
    except Exception as e:
        print(f"  [WARNING] 일일 개요 생성 실패: {e}")
        daily_overview = f"오늘의 AI 뉴스: {themes} 분야에서 주요 업데이트가 있었습니다."

    # ─── 하이라이트 번역 ───
    hl = state.get("highlight", {})
    if hl and hl.get("title") and not _is_korean(hl.get("display_title", "")):
        if _is_korean(hl["title"]):
            hl["display_title"] = hl["title"]
        else:
            try:
                hl_prompt = f"""다음 영어 AI 뉴스 제목을 한국어로 번역해주세요.

제목: {hl['title']}
설명: {hl.get('description', '')[:200]}

OUTPUT ONLY VALID JSON:
{{"display_title": "한국어 제목 (30자 이내)", "summary": "한국어 요약 (150-200자)"}}"""
                hl_resp = llm.invoke([HumanMessage(content=hl_prompt)])
                hl_result = parse_llm_json(hl_resp.content)
                if isinstance(hl_result, dict):
                    hl["display_title"] = hl_result.get("display_title", hl["title"])
                    if hl_result.get("summary"):
                        hl["summary"] = hl_result["summary"]
                print(f"  [OK] 하이라이트 한국어 번역 완료")
            except Exception as e:
                print(f"  [WARNING] 하이라이트 번역 실패: {e}")
                hl["display_title"] = hl["title"]

    # ─── 미번역 기사 안전망: display_title이 없거나 영어인 기사 일괄 번역 ───
    all_to_check = articles + text_only_articles
    untranslated = []
    for a in all_to_check:
        dt = a.get("display_title", "")
        # display_title이 비어있거나 한국어가 아닌 경우
        if not dt or not _is_korean(dt):
            # 이미 한국어 제목이면 그대로 사용
            if _is_korean(a.get("title", "")):
                a["display_title"] = a["title"]
                if not a.get("summary") or not _is_korean(a.get("summary", "")):
                    a["summary"] = a.get("description", "")[:300]
            else:
                untranslated.append(a)

    if untranslated:
        print(f"  [번역 안전망] 미번역 기사 {len(untranslated)}개 발견, 일괄 번역 중...")
        for tr_start in range(0, len(untranslated), 10):
            tr_batch = untranslated[tr_start:tr_start + 10]
            tr_text = ""
            for i, a in enumerate(tr_batch):
                tr_text += (
                    f"\n[{i+1}] 제목: {a['title']}\n"
                    f"     설명: {a.get('description', '')[:200]}\n"
                )
            tr_prompt = f"""다음 {len(tr_batch)}개의 영어 AI 뉴스를 한국어로 번역해주세요.

## 규칙
- 이미 한국어인 기사는 그대로 유지
- 영어 기사만 한국어로 번역
- display_title: 한국어 제목 (30자 이내, 클릭 유도)
- summary: 한국어 요약 (150-200자)

OUTPUT ONLY VALID JSON ARRAY:
[{{"index": 1, "display_title": "...", "summary": "..."}}]

{tr_text}"""
            try:
                tr_resp = llm.invoke([HumanMessage(content=tr_prompt)])
                tr_results = parse_llm_json(tr_resp.content)
                if isinstance(tr_results, dict):
                    tr_results = next((v for v in tr_results.values() if isinstance(v, list)), [])
                if isinstance(tr_results, list):
                    for r in tr_results:
                        if not isinstance(r, dict):
                            continue
                        idx = r.get("index", 1) - 1
                        if 0 <= idx < len(tr_batch):
                            if r.get("display_title"):
                                tr_batch[idx]["display_title"] = r["display_title"]
                            if r.get("summary"):
                                tr_batch[idx]["summary"] = r["summary"]
                print(f"    [OK] {len(tr_batch)}개 번역 완료")
            except Exception as e:
                print(f"    [WARNING] 번역 안전망 실패: {e}")
                # 최소한 원문 title을 display_title에 복사
                for a in tr_batch:
                    if not a.get("display_title"):
                        a["display_title"] = a["title"]
                    if not a.get("summary"):
                        a["summary"] = a.get("description", "")[:300]

    # ─── 최종 기사 정리 (image_url, reading_time은 EnricherAgent에서 채움) ───
    final_articles = [{
        "title":           a["title"],
        "display_title":   a.get("display_title", ""),  # SummarizerAgent 생성 독자 친화 제목
        "description":     a["description"],
        "link":            a["link"],
        "published":       a["published"],
        "source":          a["source"],
        "source_type":     a.get("source_type", ""),
        "summary":         a.get("summary", a["description"][:300]),
        "impact_comment":  a.get("impact_comment", ""),
        "category":        a.get("category", ""),
        "category_name":   a.get("category_name", ""),
        "howToGuide":      a.get("howToGuide", ""),
        "importance_score": a.get("importance_score", 0),
        "social_score":    a.get("social_score", 0),
        "theme":           a.get("category_name", ""),
        "image_url":       "",   # EnricherAgent에서 채움
        "reading_time":    0,    # EnricherAgent에서 채움
    } for a in articles]

    howto_count = len([a for a in final_articles if a.get("howToGuide")])
    print(f"  [OK] 총 {len(final_articles)}개 요약 완료 | How-to Guide: {howto_count}개")

    # ─── 가로 섹션 기사 한국어 제목/설명 번역 ───
    hs = state.get("horizontal_sections", {})
    # (sec_key, article_dict) 쌍 목록 (dict 참조이므로 수정 시 hs도 업데이트됨)
    all_h = [(sk, a) for sk, arts in hs.items() for a in (arts or [])]
    if all_h:
        h_text = "".join(
            f"\n[{j+1}] 제목: {a['title']}\n     설명: {a.get('description', '')[:200]}\n"
            for j, (_, a) in enumerate(all_h[:15])
        )
        h_prompt = f"""다음 {min(len(all_h), 15)}개의 AI 뉴스 기사를 한국어로 번역해주세요.

- display_title: 독자가 클릭하고 싶게 만드는 한국어 제목 (30자 이내)
- description: 핵심 내용을 한국어로 설명 (100자 이내)

반드시 아래 형식으로 출력하세요 (마크다운 없이 순수 JSON):
[{{"index": 1, "display_title": "...", "description": "..."}}]

{h_text}"""
        try:
            h_resp = llm.invoke([HumanMessage(content=h_prompt)])
            h_results = parse_llm_json(h_resp.content)
            if isinstance(h_results, dict):
                h_results = next((v for v in h_results.values() if isinstance(v, list)), [])
            if isinstance(h_results, list):
                for r in h_results:
                    if not isinstance(r, dict):
                        continue
                    idx = r.get("index", 1) - 1
                    if 0 <= idx < len(all_h):
                        _, art = all_h[idx]
                        art["display_title"] = r.get("display_title", "")
                        if r.get("description"):
                            art["description"] = r["description"]
            print(f"  [OK] 가로 섹션 {min(len(all_h), 15)}개 한국어 번역 완료")
        except Exception as e:
            print(f"  [WARNING] 가로 섹션 번역 실패: {e}")

    # 가로 섹션 미번역 안전망: display_title 없으면 한국어 title 복사 또는 title 유지
    for _, art in all_h:
        dt = art.get("display_title", "")
        if not dt or not _is_korean(dt):
            if _is_korean(art.get("title", "")):
                art["display_title"] = art["title"]
            # 영어인 경우 display_title이 빈 채로 남으면 title 복사 (프론트에서 fallback)
            elif not dt:
                art["display_title"] = art["title"]

    # ─── text_only_articles 최종 정리 ───
    final_text_only = [{
        "title":         a["title"],
        "display_title": a.get("display_title", ""),
        "description":   a["description"],
        "link":          a["link"],
        "published":     a["published"],
        "source":        a["source"],
        "source_type":   a.get("source_type", ""),
        "summary":       a.get("summary", a["description"][:300]),
        "category":      a.get("category", ""),
        "category_name": a.get("category_name", ""),
        "reading_time":  0,
    } for a in text_only_articles]

    return {
        "final_articles": final_articles,
        "daily_overview": daily_overview,
        "horizontal_sections": hs,
        "text_only_articles": final_text_only,
    }


# ─── Agent 5: EnricherAgent (신규) ───
# og:image 추출 스킵 소스 (이미지가 의미 없거나 없는 소스)
# arxiv: PDF/논문 로고만, reddit: 썸네일 없음, huggingface: 대부분 HF 로고
_SKIP_IMG_TYPES = {"arxiv", "reddit", "huggingface"}
_SKIP_IMG_URLS  = ("arxiv.org", "reddit.com", "youtu.be", "youtube.com", "huggingface.co")

# 이미지 추출 가능 소스 (하이라이트 선정 시 우선 고려)
# techcrunch: 기사 썸네일, tavily/hackernews: 원문 og:image, github: repo 소셜 카드, zdnet: 기사 이미지, official_blog: 블로그 이미지
_IMAGE_FRIENDLY_SOURCES = {"techcrunch", "tavily", "hackernews", "official_blog", "github", "zdnet"}


def _try_og_image(url: str, source_type: str) -> str:
    """기사 URL에서 og:image / twitter:image 메타태그 추출 (실패 시 빈 문자열)"""
    if source_type in _SKIP_IMG_TYPES or not url:
        return ""
    if any(p in url for p in _SKIP_IMG_URLS):
        return ""
    try:
        import requests as _req
        from bs4 import BeautifulSoup as _BS
        headers = {"User-Agent": "Mozilla/5.0 (compatible; AilonNewsBot/1.0)"}
        resp = _req.get(url, headers=headers, timeout=4, allow_redirects=True)
        if resp.status_code != 200:
            return ""
        soup = _BS(resp.content[:30000], "html.parser")
        for prop, attr in [("og:image", "property"), ("twitter:image", "name")]:
            meta = soup.find("meta", {attr: prop})
            if meta and meta.get("content"):
                img = str(meta["content"])
                if img.startswith("http") and not img.endswith(".svg"):
                    return img
        return ""
    except Exception:
        return ""


def _estimate_reading_time(text: str) -> int:
    """읽기 시간 추정 (분, 한국어 기준 200자/분, 1~10분 범위)"""
    return max(1, min(10, round(len(text) / 200)))


def enricher_node(state: NewsState) -> dict:
    """
    기사 이미지(og:image) + 읽기 시간 보강 — LLM 미사용
    ─ 이미지 판단 ──────────────────────────────────────
    ✅ og:image 추출: VentureBeat, TechCrunch, Tavily, HN 링크, GitHub
    ❌ 스킵(이미지 의미 없음): arXiv(논문 로고만), Reddit(썸네일 없음)
    ❌ AI 생성 이미지: 비용 $36+/월, 신뢰도 낮아 미적용
       → 이미지 없으면 앱에서 카테고리별 그라디언트 표시
    ─ 속도 최적화 ──────────────────────────────────────
    ThreadPoolExecutor 8개 병렬 네트워크 요청 (4초 타임아웃)
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    print("\n[EnricherAgent] og:image 추출 + 읽기 시간 추정 중...")

    final_articles = state.get("final_articles", [])
    if not final_articles:
        return {"final_articles": []}

    # 병렬 og:image 추출
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {
            executor.submit(_try_og_image, a["link"], a.get("source_type", "")): i
            for i, a in enumerate(final_articles)
        }
        img_count = 0
        for future in as_completed(futures):
            idx = futures[future]
            try:
                img_url = future.result()
                if img_url:
                    final_articles[idx]["image_url"] = img_url
                    img_count += 1
            except Exception:
                pass

    # 읽기 시간 추정
    for a in final_articles:
        text = a.get("summary", "") or a.get("description", "")
        a["reading_time"] = _estimate_reading_time(text)

    skip_count = len(final_articles) - img_count
    print(f"  [OK] 이미지 {img_count}/{len(final_articles)}개 확보 "
          f"({skip_count}개는 카테고리 그라디언트로 표시)")

    # text_only_articles: 이미지 추출 스킵, reading_time만 추정
    text_only = state.get("text_only_articles", [])
    for a in text_only:
        text = a.get("summary", "") or a.get("description", "")
        a["reading_time"] = _estimate_reading_time(text)

    return {"final_articles": final_articles, "text_only_articles": text_only}


# ─── 뉴스 에이전트 팀 그래프 빌드 ───
def build_news_team_graph():
    """뉴스 큐레이션 에이전트 팀 그래프 생성"""
    graph = StateGraph(NewsState)

    graph.add_node("collector",  collector_node)
    graph.add_node("analyzer",   analyzer_node)
    graph.add_node("ranker",     ranker_node)
    graph.add_node("summarizer", summarizer_node)
    graph.add_node("enricher",   enricher_node)

    graph.add_edge(START,        "collector")
    graph.add_edge("collector",  "analyzer")
    graph.add_edge("analyzer",   "ranker")
    graph.add_edge("ranker",     "summarizer")
    graph.add_edge("summarizer", "enricher")
    graph.add_edge("enricher",   END)

    return graph.compile()


def run_news_team() -> dict:
    """뉴스 에이전트 팀 실행 및 결과 반환"""
    print("=" * 60)
    print("[START] 뉴스 에이전트 팀 시작 (5 Agent: Collector→Analyzer→Ranker→Summarizer→Enricher)")
    print("=" * 60)

    graph = build_news_team_graph()
    initial_state: NewsState = {
        "raw_articles":      [],
        "analyzed_articles": [],
        "ranked_categories": {},
        "ranked_main":       {},
        "ranked_more":       {},
        "final_articles":    [],
        "daily_overview":    "",
        "highlight":         {},
        "themes":            [],
        "categories":        {},
        "horizontal_sections": {},
        "text_only_articles": [],
    }

    result = graph.invoke(initial_state)

    final  = result["final_articles"]
    hs     = result.get("horizontal_sections", {})
    ranked = result.get("ranked_categories", {})

    print(f"\n[DONE] 뉴스 에이전트 팀 완료")
    print(f"  수집:   {len(result.get('raw_articles', []))}개")
    print(f"  분석:   {len(result.get('analyzed_articles', []))}개")
    print(f"  선별:   {sum(len(v) for v in ranked.values())}개 (카테고리당 최대 10개)")
    print(f"  최종:   {len(final)}개 | 이미지: {len([a for a in final if a.get('image_url')])}개")
    print(f"  가로섹션: 공식발표 {len(hs.get('official_announcements', []))}개 | 한국AI {len(hs.get('korean_ai', []))}개 | 큐레이션 {len(hs.get('curation', []))}개")
    print(f"  텍스트전용: {len(result.get('text_only_articles', []))}개")

    return result
