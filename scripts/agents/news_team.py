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


# ─── 번역 (병렬 배치) ───
def _translate_batch(batch: list[dict], batch_idx: int, llm) -> list[dict] | None:
    """단일 배치 번역 (ThreadPoolExecutor용)"""
    batch_text = ""
    for i, a in enumerate(batch):
        batch_text += (
            f"\n[{i+1}] 제목: {a['title']}\n"
            f"     설명: {a['description'][:150]}\n"
        )

    prompt = f"""다음 {len(batch)}개의 영어 AI 뉴스를 한국어로 번역해주세요.

## 규칙
- display_title: 한국어 제목 (30자 이내, 핵심을 전달하되 클릭 유도)
- summary: 한국어 요약 (100-200자)

OUTPUT ONLY VALID JSON ARRAY (no markdown):
[{{"index": 1, "display_title": "...", "summary": "..."}}]

{batch_text}"""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        results = _parse_llm_json(response.content)
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
    llm = get_llm(temperature=0.3, max_tokens=3072)

    batch_size = 15
    batches = [to_translate[i:i + batch_size] for i in range(0, len(to_translate), batch_size)]

    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {
            executor.submit(_translate_batch, batch, idx, llm): (batch, idx)
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
        desc = a.get("description", "")[:80]
        article_text += f"\n[{i}] {title} | {desc}"

    prompt = f"""다음 AI 뉴스 기사들을 각각 평가해주세요.

## 평가 기준 (각 1-5점)
- impact: AI 분야에 얼마나 중요한 뉴스인가? (5=판도를 바꾸는 발표, 1=사소한 업데이트)
- freshness: 새로운 정보인가? (5=최초 보도/발표, 1=이미 알려진 내용 반복)
- breadth: 영향 범위가 넓은가? (5=업계 전체, 1=특정 니치)
- topic_tag: 주제를 짧은 영어 태그로 (예: "openai-gpt5", "eu-regulation", "llama-release")

## 기사 목록
{article_text}

## OUTPUT (JSON array only, no markdown):
[{{"i": 0, "impact": 4, "freshness": 5, "breadth": 3, "topic_tag": "example-tag"}}]
"""

    try:
        llm = get_llm(temperature=0.1, max_tokens=2048)
        response = llm.invoke([HumanMessage(content=prompt)])
        scores = _parse_llm_json(response.content)

        if not isinstance(scores, list):
            scores = next((v for v in scores.values() if isinstance(v, list)), [])

        for s in scores:
            idx = s.get("i", -1)
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
        print(f"  [스코어링] {scored}/{len(candidates)}개 평가 완료")

    except Exception as e:
        print(f"  [WARNING] 스코어링 실패, 기본값 사용: {e}")

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
        article_text += f"\n[{i}] {title}"

    prompt = f"""다음 AI 뉴스를 3개 카테고리 중 하나로 분류하세요:
- model_research: 모델, 연구, 논문, 벤치마크
- product_tools: 제품, 도구, 출시, API, 프레임워크
- industry_business: 투자, 규제, 시장, 기업 전략

{article_text}

OUTPUT (JSON only): [{{"i": 0, "cat": "model_research"}}]"""

    try:
        llm = get_llm(temperature=0.1, max_tokens=1024)
        response = llm.invoke([HumanMessage(content=prompt)])
        results = _parse_llm_json(response.content)
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
