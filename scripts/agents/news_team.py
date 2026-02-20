"""
뉴스 수집 파이프라인 — LangGraph 6-노드

collector → translator → scorer → ranker → classifier → assembler

1. collector:   13개 소스 RSS 수집 + og:image 추출 + 이미지 없는 기사 제거
2. translator:  영어 기사 한국어 번역 (병렬 배치)
3. scorer:      LLM 4차원 평가 (ai_relevance/impact/freshness/breadth) + 카테고리 태깅
4. ranker:      LLM이 상위 12개 후보 중 Top 3 하이라이트 직접 선정
5. classifier:  scorer 카테고리 우선 → 키워드 보조 → 모호한 것만 LLM 분류
               + 카테고리별 Top 10 선정 (점수순 + 소스 상한 3개)
6. assembler:   한국 소스를 소스별로 분리, 최종 결과 조합
"""

import json
import re
import time
from typing import TypedDict
from concurrent.futures import ThreadPoolExecutor, as_completed
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END
from agents.config import get_llm, CATEGORY_KEYWORDS
from agents.tools import (
    SOURCES,
    fetch_all_sources, enrich_images, filter_imageless,
    HIGHLIGHT_SOURCES, CATEGORY_SOURCES, SOURCE_SECTION_SOURCES,
)


# ─── State 정의 ───
class NewsGraphState(TypedDict):
    sources: dict[str, list[dict]]
    translated: bool
    scored_candidates: list[dict]            # scorer 출력: _total_score, _topic_tag 포함
    category_pool: list[dict]                # ranker 출력: 하이라이트 제외 후보
    highlights: list[dict]
    categorized_articles: dict[str, list[dict]]
    category_order: list[str]
    source_articles: dict[str, list[dict]]
    source_order: list[str]
    total_count: int


# ─── JSON 파싱 유틸리티 ───
def _parse_llm_json(text: str):
    text = text.strip()
    text = re.sub(r'^```(?:json)?\s*\n?', '', text)
    text = re.sub(r'\n?```\s*$', '', text)
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

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

    raise json.JSONDecodeError("No valid JSON found", text, 0)


def _llm_invoke_with_retry(llm, prompt: str, max_retries: int = 2) -> str:
    """LLM 호출 + 재시도 (지수 백오프). 반환: response.content 문자열"""
    last_err = None
    for attempt in range(max_retries + 1):
        try:
            response = llm.invoke([HumanMessage(content=prompt)])
            return response.content
        except Exception as e:
            last_err = e
            if attempt < max_retries:
                wait = 2 ** attempt
                print(f"    [RETRY] LLM 호출 실패 ({e}), {wait}초 후 재시도...")
                time.sleep(wait)
    raise last_err


# ─── 번역 (병렬 배치) ───
def _translate_batch(batch: list[dict], batch_idx: int) -> list[dict] | None:
    """단일 배치 번역 (ThreadPoolExecutor용, 스레드별 LLM 생성)"""
    batch_text = ""
    for i, a in enumerate(batch):
        batch_text += (
            f"\n[{i+1}] 제목: {a['title']}\n"
            f"     설명: {a['description'][:200]}\n"
        )

    prompt = f"""You are a JSON-only translator. Output ONLY a valid JSON array, no markdown, no explanation.

Translate {len(batch)} English AI news items to Korean.
- display_title: Korean title (max 30 chars, convey the key point)
- summary: Korean summary (100-200 chars)

Return exactly {len(batch)} items with index starting from 1:
[{{"index":1,"display_title":"...","summary":"..."}}]

Articles:
{batch_text}"""

    try:
        llm = get_llm(temperature=0.3, max_tokens=3072)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=2)
        results = _parse_llm_json(content)
        if isinstance(results, dict):
            results = next((v for v in results.values() if isinstance(v, list)), [])
        if isinstance(results, list):
            return results
    except Exception as e:
        print(f"    [WARNING] 번역 배치 {batch_idx + 1} 실패: {e}")
    return None


def translate_articles(sources: dict[str, list[dict]]) -> None:
    """영어 기사의 title/description을 한국어로 번역 (in-place, 병렬 배치)"""
    to_translate: list[dict] = []
    for articles in sources.values():
        for a in articles:
            if a.get("lang") == "ko":
                a["display_title"] = a["title"]
                a["summary"] = a["description"][:300] if a["description"] else ""
            else:
                to_translate.append(a)

    if not to_translate:
        print("  [번역] 영어 기사 없음, 번역 스킵")
        return

    print(f"  [번역] 영어 기사 {len(to_translate)}개 한국어 번역 중...")

    batch_size = 15
    batches = [to_translate[i:i + batch_size] for i in range(0, len(to_translate), batch_size)]

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {
            executor.submit(_translate_batch, batch, idx): (batch, idx)
            for idx, batch in enumerate(batches)
        }
        for future in as_completed(futures):
            batch, idx = futures[future]
            results = future.result()
            if results and isinstance(results, list):
                for r in results:
                    if not isinstance(r, dict):
                        continue
                    ridx = r.get("index", 1) - 1
                    if 0 <= ridx < len(batch):
                        if r.get("display_title"):
                            batch[ridx]["display_title"] = r["display_title"]
                        if r.get("summary"):
                            batch[ridx]["summary"] = r["summary"]
                translated = len([a for a in batch if a.get("display_title")])
                print(f"    배치 {idx + 1}: {translated}/{len(batch)}개 번역 완료")

    # 안전망: display_title이 비어있으면 원문 title 사용
    for a in to_translate:
        if not a.get("display_title"):
            a["display_title"] = a["title"]
        if not a.get("summary"):
            a["summary"] = a["description"][:300] if a["description"] else ""


# ─── Node 1: collector ───
def collector_node(state: NewsGraphState) -> dict:
    """모든 소스에서 RSS 수집 + 이미지 보강 + 이미지 없는 기사 제거"""
    sources = fetch_all_sources()
    enrich_images(sources)
    filter_imageless(sources)
    return {"sources": sources}


# ─── Node 2: translator ───
def translator_node(state: NewsGraphState) -> dict:
    """영어 기사 한국어 번역"""
    translate_articles(state["sources"])
    return {"translated": True, "sources": state["sources"]}


# ─── Node 3: scorer (LLM 4차원 평가) ───
def scorer_node(state: NewsGraphState) -> dict:
    """CATEGORY_SOURCES 전체 기사에 대해 ai_relevance/impact/freshness/breadth 점수 부여"""
    sources = state["sources"]

    candidates: list[dict] = []
    for key in CATEGORY_SOURCES:
        for a in sources.get(key, []):
            candidates.append(a)

    if not candidates:
        print("  [스코어링] 평가 대상 없음")
        return {"scored_candidates": []}

    print(f"  [스코어링] {len(candidates)}개 기사 평가 중...")

    article_text = ""
    for i, a in enumerate(candidates):
        title = a.get("display_title") or a.get("title", "")
        desc = a.get("description", "")[:150]
        article_text += f"\n[{i}] {title} | {desc}"

    prompt = f"""You are a JSON-only AI news scorer. Output ONLY a valid JSON array, no markdown, no explanation.

Score each article on 4 dimensions (1-5 integer):

1. ai_relevance: How directly related to AI/ML is this article?
   5 = Core AI (new model, AI research breakthrough, AI product launch)
   4 = AI-adjacent (AI chip, AI regulation, AI company funding)
   3 = Mentions AI but main topic is broader tech
   2 = Tangentially related (general tech with minor AI mention)
   1 = Not AI-related (general news, politics, entertainment)

2. impact: Importance to the AI field
   5 = Paradigm shift (new GPT-level model, major policy change)
   4 = Significant (notable model release, large funding round)
   3 = Moderate (incremental update, niche research)
   2 = Minor (routine announcement, small update)
   1 = Trivial (opinion piece, rehashed content)

3. freshness: Novelty of information
   5 = Breaking news, first report globally
   4 = New development reported within hours
   3 = Recent but already covered by multiple outlets
   2 = Follow-up or analysis of known news
   1 = Old news or rehash

4. breadth: Scope of influence
   5 = Affects entire AI industry (OpenAI, Google, regulation)
   4 = Affects major segment (NLP, computer vision, robotics)
   3 = Affects specific community (researchers, developers)
   2 = Affects niche audience
   1 = Very narrow scope

Also provide:
- topic_tag: short English tag for deduplication (e.g. "openai-gpt5", "eu-ai-act")
- category: one of "model_research", "product_tools", "industry_business"
  model_research = new models, papers, benchmarks, architecture, training methods
  product_tools = product launches, tools, APIs, frameworks, developer tools
  industry_business = funding, regulation, market, strategy, partnerships

Articles:
{article_text}

Output exactly {len(candidates)} items:
[{{"i":0,"ai_relevance":5,"impact":4,"freshness":5,"breadth":3,"topic_tag":"example-tag","category":"model_research"}}]"""

    try:
        llm = get_llm(temperature=0.1, max_tokens=4096)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=2)
        scores = _parse_llm_json(content)

        if not isinstance(scores, list):
            scores = next((v for v in scores.values() if isinstance(v, list)), [])

        for s in scores:
            if not isinstance(s, dict):
                continue
            raw_idx = s.get("i", s.get("index", -1))
            try:
                idx = int(raw_idx)
            except (ValueError, TypeError):
                continue
            if 0 <= idx < len(candidates):
                ai_rel = s.get("ai_relevance", 3)
                impact = s.get("impact", 3)
                fresh = s.get("freshness", 3)
                breadth = s.get("breadth", 3)
                candidates[idx]["_score_ai_relevance"] = ai_rel
                candidates[idx]["_score_impact"] = impact
                candidates[idx]["_score_freshness"] = fresh
                candidates[idx]["_score_breadth"] = breadth
                candidates[idx]["_topic_tag"] = s.get("topic_tag", "")
                candidates[idx]["_llm_category"] = s.get("category", "")
                # ai_relevance 가중치 3x, impact 2x
                candidates[idx]["_total_score"] = (
                    ai_rel * 3 + impact * 2 + fresh + breadth
                )

        scored = len([c for c in candidates if "_total_score" in c])
        if scored == 0 and scores:
            sample = scores[0] if isinstance(scores, list) else scores
            print(f"  [DEBUG] 스코어 샘플: {str(sample)[:200]}")
        print(f"  [스코어링] {scored}/{len(candidates)}개 평가 완료")

    except Exception as e:
        print(f"  [WARNING] 스코어링 실패, 기본값 사용: {type(e).__name__}: {e}")

    # 폴백: 미평가 기사에 기본 점수
    for c in candidates:
        if "_total_score" not in c:
            c["_score_ai_relevance"] = 3
            c["_score_impact"] = 3
            c["_score_freshness"] = 3
            c["_score_breadth"] = 3
            c["_topic_tag"] = ""
            c["_llm_category"] = ""
            c["_total_score"] = 17  # 3*3 + 3*2 + 3 + 3

    return {"scored_candidates": candidates}


# ─── Node 4: ranker (LLM 기반 하이라이트 선정) ───
HIGHLIGHT_COUNT = 3
HIGHLIGHT_CANDIDATE_POOL = 12

def ranker_node(state: NewsGraphState) -> dict:
    """LLM이 상위 후보 중 Top 3 하이라이트를 직접 선정"""
    candidates = state.get("scored_candidates", [])
    if not candidates:
        return {"highlights": [], "category_pool": []}

    # 하이라이트는 HIGHLIGHT_SOURCES에서만 선정
    highlight_pool = [c for c in candidates if c.get("source_key", "") in HIGHLIGHT_SOURCES]
    non_highlight = [c for c in candidates if c.get("source_key", "") not in HIGHLIGHT_SOURCES]

    # 점수순 상위 N개를 LLM 후보로 제공
    ranked = sorted(highlight_pool, key=lambda c: c.get("_total_score", 0), reverse=True)
    top_candidates = ranked[:HIGHLIGHT_CANDIDATE_POOL]
    the_rest = ranked[HIGHLIGHT_CANDIDATE_POOL:]

    # LLM에게 최종 3개 선정 요청
    article_text = ""
    for i, c in enumerate(top_candidates):
        title = c.get("display_title") or c.get("title", "")
        desc = c.get("summary") or c.get("description", "")[:150]
        src = c.get("source_key", "")
        score = c.get("_total_score", 0)
        tag = c.get("_topic_tag", "")
        article_text += f"\n[{i}] (score={score}, tag={tag}, src={src}) {title} | {desc}"

    prompt = f"""You are an AI news editor. Pick the 3 BEST articles for today's highlights.

Selection criteria (in order of priority):
1. AI RELEVANCE: Must be directly about AI/ML. Reject general tech, politics, entertainment.
2. IMPACT: Choose paradigm-shifting or significant news over minor updates.
3. TOPIC DIVERSITY: Each pick must cover a DIFFERENT topic. No two articles about the same subject.
4. SOURCE DIVERSITY: Prefer picks from different sources. Max 2 from the same source.
5. HEADLINE QUALITY: The title should be compelling and informative for readers.

The FIRST pick (index 0 in your output) becomes the Hero card — choose the single most important AI story of the day.

Candidates:
{article_text}

Output ONLY a valid JSON array with exactly 3 items. No markdown, no explanation.
[{{"pick":0,"reason":"10-word reason"}}]

pick = the candidate index number [0-{len(top_candidates)-1}]"""

    selected_indices: list[int] = []
    try:
        llm = get_llm(temperature=0.2, max_tokens=512)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=2)
        picks = _parse_llm_json(content)
        if not isinstance(picks, list):
            picks = next((v for v in picks.values() if isinstance(v, list)), [])

        for p in picks:
            if not isinstance(p, dict):
                continue
            raw_idx = p.get("pick", p.get("i", p.get("index", -1)))
            try:
                idx = int(raw_idx)
            except (ValueError, TypeError):
                continue
            if 0 <= idx < len(top_candidates) and idx not in selected_indices:
                selected_indices.append(idx)
            if len(selected_indices) >= HIGHLIGHT_COUNT:
                break

        print(f"  [랭킹] LLM이 {len(selected_indices)}개 하이라이트 선정")
        for rank, idx in enumerate(selected_indices):
            reason = ""
            for p in picks:
                if isinstance(p, dict):
                    raw = p.get("pick", p.get("i", p.get("index", -1)))
                    try:
                        if int(raw) == idx:
                            reason = p.get("reason", "")
                            break
                    except (ValueError, TypeError):
                        pass
            c = top_candidates[idx]
            title = (c.get("display_title") or c.get("title", ""))[:40]
            print(f"    {rank+1}. [{c.get('_total_score', 0)}점] {title} — {reason}")

    except Exception as e:
        print(f"  [WARNING] LLM 랭킹 실패, 점수순 폴백: {type(e).__name__}: {e}")

    # LLM이 3개 미만 선정했으면 점수순으로 보충
    if len(selected_indices) < HIGHLIGHT_COUNT:
        for i in range(len(top_candidates)):
            if len(selected_indices) >= HIGHLIGHT_COUNT:
                break
            if i not in selected_indices:
                selected_indices.append(i)

    selected = [top_candidates[i] for i in selected_indices]
    remaining_hl = [c for i, c in enumerate(top_candidates) if i not in selected_indices]

    return {
        "highlights": selected,
        "category_pool": remaining_hl + the_rest + non_highlight,
    }


# ─── Node 5: classifier (scorer 카테고리 우선, 키워드 보조, LLM 폴백) ───
VALID_CATEGORIES = {"model_research", "product_tools", "industry_business"}

def _classify_article(a: dict) -> str | None:
    """단일 기사 분류. scorer의 _llm_category → 키워드 → None(모호)."""
    # 1순위: scorer가 이미 분류한 카테고리
    llm_cat = a.get("_llm_category", "")
    if llm_cat in VALID_CATEGORIES:
        return llm_cat

    # 2순위: 키워드 매칭
    text = (a.get("title", "") + " " + a.get("description", "")).lower()
    scores = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        scores[cat] = sum(1 for kw in keywords if kw in text)

    sorted_cats = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    best_score = sorted_cats[0][1]
    second_score = sorted_cats[1][1]

    if best_score >= 3:
        return sorted_cats[0][0]
    if best_score >= 2 and (best_score - second_score) >= 2:
        return sorted_cats[0][0]

    return None  # 모호


def _llm_classify_batch(articles: list[dict], categorized: dict[str, list[dict]]):
    """모호한 기사들만 LLM으로 분류"""
    article_text = ""
    for i, a in enumerate(articles):
        title = a.get("display_title") or a.get("title", "")
        desc = a.get("description", "")[:100]
        article_text += f"\n[{i}] {title} | {desc}"

    prompt = f"""You are a JSON-only classifier. Output ONLY a valid JSON array, no markdown.

Classify each AI news article into exactly ONE category using these decision rules:

model_research — Ask: "Was new technical knowledge or capability created?"
  YES → model_research. Examples: paper published, new model released with weights,
  benchmark record broken, new architecture proposed, training method discovered.

product_tools — Ask: "Can a user directly use something new or changed?"
  YES → product_tools. Examples: app launched, API released, tool updated,
  open-source library published, developer framework released.

industry_business — Ask: "Did money, organizations, or policy move?"
  YES → industry_business. Examples: funding round, acquisition, partnership,
  regulation passed, executive hire, market analysis, earnings report.

Priority rule: If an article fits multiple categories, use this priority:
  model_research > product_tools > industry_business
  (Technical breakthroughs take priority over product/business framing)

Articles:
{article_text}

Output exactly {len(articles)} items:
[{{"i":0,"cat":"model_research"}}]"""

    try:
        llm = get_llm(temperature=0.1, max_tokens=1024)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=1)
        results = _parse_llm_json(content)
        if not isinstance(results, list):
            results = next((v for v in results.values() if isinstance(v, list)), [])
        classified = set()
        for r in results:
            if not isinstance(r, dict):
                continue
            raw_idx = r.get("i", r.get("index", -1))
            try:
                idx = int(raw_idx)
            except (ValueError, TypeError):
                continue
            cat = r.get("cat", "")
            if 0 <= idx < len(articles) and cat in categorized:
                categorized[cat].append(articles[idx])
                classified.add(idx)
        for i, a in enumerate(articles):
            if i not in classified:
                categorized["industry_business"].append(a)
    except Exception as e:
        print(f"    [WARNING] LLM 분류 실패, industry_business로 폴백: {e}")
        for a in articles:
            categorized["industry_business"].append(a)


CATEGORY_TOP_N = 10
MAX_PER_SOURCE_CATEGORY = 3

def _select_top_n(articles: list[dict], n: int, max_per_source: int) -> list[dict]:
    """점수순 Top N 선정 + 동일 소스 상한. 동점 시 최신순."""
    sorted_articles = sorted(
        articles,
        key=lambda a: (a.get("_total_score", 0), a.get("published", "")),
        reverse=True,
    )
    selected: list[dict] = []
    source_count: dict[str, int] = {}

    for a in sorted_articles:
        if len(selected) >= n:
            break
        src = a.get("source_key", "")
        if source_count.get(src, 0) >= max_per_source:
            continue
        selected.append(a)
        source_count[src] = source_count.get(src, 0) + 1

    return selected


def classifier_node(state: NewsGraphState) -> dict:
    """하이라이트 제외 기사를 3개 카테고리로 분류 + 카테고리별 Top 10 선정"""
    highlights = state.get("highlights", [])
    category_pool = state.get("category_pool", [])

    highlight_links = set(a.get("link", "") for a in highlights)

    # 분류 대상: ranker가 남긴 category_pool (이미 스코어링됨)
    all_to_classify = [a for a in category_pool if a.get("link", "") not in highlight_links]

    category_order = ["model_research", "product_tools", "industry_business"]
    categorized: dict[str, list[dict]] = {k: [] for k in category_order}

    if not all_to_classify:
        print("  [분류] 분류 대상 기사 없음")
        return {"categorized_articles": categorized, "category_order": category_order}

    # scorer 카테고리 + 키워드 분류, 모호한 것만 모음
    ambiguous: list[dict] = []
    classified_count = 0
    for a in all_to_classify:
        cat = _classify_article(a)
        if cat:
            categorized[cat].append(a)
            classified_count += 1
        else:
            ambiguous.append(a)

    print(f"  [분류] {classified_count}개 즉시 분류, {len(ambiguous)}개 모호")

    # 모호한 기사만 LLM
    if ambiguous:
        print(f"  [분류] {len(ambiguous)}개 모호한 기사 LLM 분류 중...")
        _llm_classify_batch(ambiguous, categorized)

    # 카테고리별 Top 10 선정 (점수순 + 소스 상한)
    for cat in category_order:
        total = len(categorized[cat])
        categorized[cat] = _select_top_n(categorized[cat], CATEGORY_TOP_N, MAX_PER_SOURCE_CATEGORY)
        print(f"    {cat}: {total}개 → Top {len(categorized[cat])}개 선정")

    return {
        "categorized_articles": categorized,
        "category_order": category_order,
    }


# ─── Node 6: assembler ───
def assembler_node(state: NewsGraphState) -> dict:
    """한국 소스를 소스별로 분리 + 최종 결과 조합"""
    sources = state["sources"]

    source_articles: dict[str, list[dict]] = {}
    source_order: list[str] = []

    for s in SOURCES:
        key = s["key"]
        if key in SOURCE_SECTION_SOURCES and sources.get(key):
            source_articles[key] = sources[key]
            source_order.append(key)

    total = (
        len(state.get("highlights", []))
        + sum(len(v) for v in state.get("categorized_articles", {}).values())
        + sum(len(v) for v in source_articles.values())
    )

    print(f"\n[DONE] 뉴스 파이프라인 완료: 총 {total}개")
    print(f"  하이라이트: {len(state.get('highlights', []))}개")
    print(f"  카테고리별: {sum(len(v) for v in state.get('categorized_articles', {}).values())}개")
    print(f"  소스별(한국): {sum(len(v) for v in source_articles.values())}개")

    return {
        "source_articles": source_articles,
        "source_order": source_order,
        "total_count": total,
    }


# ─── 그래프 구성 ───
def _build_graph():
    graph = StateGraph(NewsGraphState)
    graph.add_node("collector", collector_node)
    graph.add_node("translator", translator_node)
    graph.add_node("scorer", scorer_node)
    graph.add_node("ranker", ranker_node)
    graph.add_node("classifier", classifier_node)
    graph.add_node("assembler", assembler_node)

    graph.set_entry_point("collector")
    graph.add_edge("collector", "translator")
    graph.add_edge("translator", "scorer")
    graph.add_edge("scorer", "ranker")
    graph.add_edge("ranker", "classifier")
    graph.add_edge("classifier", "assembler")
    graph.add_edge("assembler", END)

    return graph.compile()


# ─── 메인 파이프라인 ───
def run_news_pipeline() -> dict:
    """
    뉴스 수집 파이프라인 실행 (LangGraph 6-노드)
    반환: {
        sources, highlights, categorized_articles, category_order,
        source_articles, source_order, total_count
    }
    """
    print("=" * 60)
    print("[START] 뉴스 수집 파이프라인 (LangGraph 6-노드)")
    print("=" * 60)

    app = _build_graph()
    result = app.invoke({
        "sources": {},
        "translated": False,
        "scored_candidates": [],
        "category_pool": [],
        "highlights": [],
        "categorized_articles": {},
        "category_order": [],
        "source_articles": {},
        "source_order": [],
        "total_count": 0,
    })

    return {
        "sources": result.get("sources", {}),
        "highlights": result.get("highlights", []),
        "categorized_articles": result.get("categorized_articles", {}),
        "category_order": result.get("category_order", []),
        "source_articles": result.get("source_articles", {}),
        "source_order": result.get("source_order", []),
        "total_count": result.get("total_count", 0),
    }
