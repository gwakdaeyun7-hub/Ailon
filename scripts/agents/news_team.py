"""
뉴스 수집 파이프라인 — LangGraph 6-노드

collector → translator → scorer → ranker → classifier → assembler

1. collector:   13개 소스 RSS 수집 + og:image 추출 + 이미지 없는 기사 제거
2. translator:  영어 기사 한국어 번역 (병렬 배치)
3. scorer:      LLM으로 하이라이트 후보 기사 3차원 점수 평가
4. ranker:      점수 기반 Top 5 선정 + topic_tag 중복 제거 (순수 Python)
5. classifier:  나머지 기사 3개 카테고리 분류 (키워드 우선, 모호한 것만 LLM)
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


# ─── Node 3: scorer (LLM 3차원 평가) ───
def scorer_node(state: NewsGraphState) -> dict:
    """각 하이라이트 후보 기사에 대해 impact/freshness/breadth 점수 부여"""
    sources = state["sources"]

    candidates: list[dict] = []
    for key in HIGHLIGHT_SOURCES:
        for a in sources.get(key, []):
            candidates.append(a)

    if not candidates:
        print("  [스코어링] 하이라이트 후보 없음")
        return {"scored_candidates": []}

    print(f"  [스코어링] {len(candidates)}개 하이라이트 후보 평가 중...")

    article_text = ""
    for i, a in enumerate(candidates):
        title = a.get("display_title") or a.get("title", "")
        desc = a.get("description", "")[:150]
        article_text += f"\n[{i}] {title} | {desc}"

    prompt = f"""You are a JSON-only AI news scorer. Output ONLY a valid JSON array, no markdown, no explanation.

Score each article on 3 dimensions (1-5 integer):
- impact: importance to AI field (5=paradigm shift, 1=minor update)
- freshness: novelty (5=first report, 1=rehash)
- breadth: scope of influence (5=whole industry, 1=niche)
- topic_tag: short English tag (e.g. "openai-gpt5", "eu-regulation")

Articles:
{article_text}

Output exactly {len(candidates)} items:
[{{"i":0,"impact":4,"freshness":5,"breadth":3,"topic_tag":"example-tag"}}]"""

    try:
        llm = get_llm(temperature=0.1, max_tokens=4096)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=2)
        scores = _parse_llm_json(content)

        if not isinstance(scores, list):
            scores = next((v for v in scores.values() if isinstance(v, list)), [])

        for s in scores:
            if not isinstance(s, dict):
                continue
            # LLM이 "i", "index", 문자열 등 다양한 형태로 반환할 수 있음
            raw_idx = s.get("i", s.get("index", -1))
            try:
                idx = int(raw_idx)
            except (ValueError, TypeError):
                continue
            if 0 <= idx < len(candidates):
                candidates[idx]["_score_impact"] = s.get("impact", 3)
                candidates[idx]["_score_freshness"] = s.get("freshness", 3)
                candidates[idx]["_score_breadth"] = s.get("breadth", 3)
                candidates[idx]["_topic_tag"] = s.get("topic_tag", "")
                candidates[idx]["_total_score"] = (
                    s.get("impact", 3) * 2  # impact 가중치 2x
                    + s.get("freshness", 3)
                    + s.get("breadth", 3)
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
            c["_score_impact"] = 3
            c["_score_freshness"] = 3
            c["_score_breadth"] = 3
            c["_topic_tag"] = ""
            c["_total_score"] = 12

    return {"scored_candidates": candidates}


# ─── Node 4: ranker (순수 Python, LLM 불필요) ───
def ranker_node(state: NewsGraphState) -> dict:
    """점수 기반 Top 5 선정 + topic_tag 중복 제거"""
    candidates = state.get("scored_candidates", [])
    if not candidates:
        return {"highlights": [], "category_pool": []}

    ranked = sorted(candidates, key=lambda c: c.get("_total_score", 0), reverse=True)

    selected: list[dict] = []
    used_topics: set[str] = set()
    remaining: list[dict] = []

    for c in ranked:
        tag = c.get("_topic_tag", "").lower().strip()

        if len(selected) >= 5:
            remaining.append(c)
            continue

        # 같은 topic_tag → 스킵 (다양성 보장)
        if tag and tag in used_topics:
            remaining.append(c)
            continue

        selected.append(c)
        if tag:
            used_topics.add(tag)

    # 5개 미만이면 나머지에서 보충
    if len(selected) < 5:
        for c in remaining[:]:
            if len(selected) >= 5:
                break
            selected.append(c)
            remaining.remove(c)

    print(f"  [랭킹] Top {len(selected)}개 선정 완료")
    for i, c in enumerate(selected):
        tag = c.get("_topic_tag", "?")
        score = c.get("_total_score", 0)
        title = (c.get("display_title") or c.get("title", ""))[:40]
        print(f"    {i+1}. [{score}점] {title} ({tag})")

    return {
        "highlights": selected,
        "category_pool": remaining,
    }


# ─── Node 5: classifier (키워드 우선, 모호한 것만 LLM) ───
def _keyword_classify(articles: list[dict]) -> tuple[dict[str, list[dict]], list[dict]]:
    """키워드 기반 분류. 확신 있는 것은 분류, 모호한 것은 ambiguous로 반환"""
    categorized: dict[str, list[dict]] = {
        "model_research": [],
        "product_tools": [],
        "industry_business": [],
    }
    ambiguous: list[dict] = []

    for a in articles:
        text = (a.get("title", "") + " " + a.get("description", "")).lower()
        scores = {}
        for cat, keywords in CATEGORY_KEYWORDS.items():
            scores[cat] = sum(1 for kw in keywords if kw in text)

        sorted_cats = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        best_score = sorted_cats[0][1]
        second_score = sorted_cats[1][1]

        if best_score == 0:
            ambiguous.append(a)
        elif best_score > 0 and (best_score - second_score) <= 1 and best_score <= 2:
            ambiguous.append(a)
        else:
            categorized[sorted_cats[0][0]].append(a)

    return categorized, ambiguous


def _llm_classify_batch(articles: list[dict], categorized: dict[str, list[dict]]):
    """모호한 기사들만 LLM으로 분류 (소규모 배치)"""
    article_text = ""
    for i, a in enumerate(articles):
        title = a.get("display_title") or a.get("title", "")
        desc = a.get("description", "")[:100]
        article_text += f"\n[{i}] {title} | {desc}"

    prompt = f"""You are a JSON-only classifier. Output ONLY a valid JSON array, no markdown.

Classify each AI news article into exactly one category:
- model_research: models, research, papers, benchmarks, training, architecture
- product_tools: products, tools, launches, APIs, frameworks, developer tools
- industry_business: funding, regulation, market, corporate strategy, partnerships

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
            idx = r.get("i", -1)
            cat = r.get("cat", "")
            if 0 <= idx < len(articles) and cat in categorized:
                categorized[cat].append(articles[idx])
                classified.add(idx)
        # 누락된 기사 → industry_business 폴백
        for i, a in enumerate(articles):
            if i not in classified:
                categorized["industry_business"].append(a)
    except Exception as e:
        print(f"    [WARNING] LLM 분류 실패, industry_business로 폴백: {e}")
        for a in articles:
            categorized["industry_business"].append(a)


def classifier_node(state: NewsGraphState) -> dict:
    """하이라이트 제외 기사를 3개 카테고리로 분류"""
    sources = state["sources"]
    highlights = state.get("highlights", [])
    category_pool = state.get("category_pool", [])

    highlight_links = set(a.get("link", "") for a in highlights)

    # 분류 대상: ranker가 남긴 category_pool + Tier 2 소스 기사
    all_to_classify: list[dict] = list(category_pool)
    for key in CATEGORY_SOURCES:
        if key not in HIGHLIGHT_SOURCES:
            for a in sources.get(key, []):
                if a.get("link", "") not in highlight_links:
                    all_to_classify.append(a)

    category_order = ["model_research", "product_tools", "industry_business"]

    if not all_to_classify:
        print("  [분류] 분류 대상 기사 없음")
        return {
            "categorized_articles": {k: [] for k in category_order},
            "category_order": category_order,
        }

    # 키워드 우선 분류
    categorized, ambiguous = _keyword_classify(all_to_classify)

    # 모호한 기사만 LLM
    if ambiguous:
        print(f"  [분류] {len(ambiguous)}개 모호한 기사 LLM 분류 중...")
        _llm_classify_batch(ambiguous, categorized)
    else:
        print("  [분류] 전체 키워드 분류 완료, LLM 불필요")

    for cat in category_order:
        print(f"    {cat}: {len(categorized[cat])}개")

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
