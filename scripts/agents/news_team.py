"""
뉴스 수집 파이프라인 — LangGraph 6-노드

collector → translator → scorer → ranker → classifier → assembler

1. collector:   13개 소스 RSS 수집 + og:image 추출 + 이미지 없는 기사 제거
2. translator:  영어 기사 한국어 번역 (병렬 배치)
3. scorer:      4차원 평가 (최신성 Python + 임팩트/신선도/영향성 LLM) 0-10점 + 카테고리 태깅
4. ranker:      LLM이 당일 기사 중 Top 3 하이라이트 직접 선정
5. classifier:  scorer 카테고리 우선 → 키워드 보조 → 모호한 것만 LLM 분류
               + 카테고리별 Top 10 선정 (당일 3개 보장 + 점수순 + 소스 상한 3개)
6. assembler:   한국 소스를 소스별로 분리, 최종 결과 조합

점수 체계: recency×4 + impact×3 + freshness×2 + breadth×1 (만점 100)
"""

import json
import re
import time
from datetime import datetime, timezone
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


# ─── 날짜 유틸리티 ───
def _parse_published(published: str) -> datetime | None:
    """다양한 날짜 형식 파싱"""
    for fmt in (
        "%a, %d %b %Y %H:%M:%S %z",   # RSS 표준
        "%a, %d %b %Y %H:%M:%S %Z",
        "%Y-%m-%dT%H:%M:%S%z",         # ISO 8601
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            dt = datetime.strptime(published.strip(), fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except (ValueError, AttributeError):
            continue
    return None


def _compute_recency_score(article: dict) -> int:
    """발행일 기반 최신성 점수 (0-10). 당일=10, 1일전=7, 2일전=4, 3일+전=1, 날짜없음=3"""
    pub = article.get("published", "")
    if not pub:
        return 3
    dt = _parse_published(pub)
    if not dt:
        return 3
    now = datetime.now(timezone.utc)
    hours_ago = (now - dt).total_seconds() / 3600
    if hours_ago < 0:
        hours_ago = 0
    if hours_ago <= 12:
        return 10
    if hours_ago <= 24:
        return 8
    if hours_ago <= 48:
        return 5
    if hours_ago <= 72:
        return 3
    return 1


def _is_today(article: dict) -> bool:
    """기사가 당일(UTC 기준 24시간 이내) 발행되었는지 판별"""
    pub = article.get("published", "")
    if not pub:
        return False
    dt = _parse_published(pub)
    if not dt:
        return False
    now = datetime.now(timezone.utc)
    return (now - dt).total_seconds() <= 86400  # 24시간


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


# ─── Node 3: scorer (4차원 평가: 최신성 Python + 임팩트/신선도/영향성 LLM) ───
# 총점 = recency×4 + impact×3 + freshness×2 + breadth×1 (만점 100)
W_RECENCY = 4
W_IMPACT = 3
W_FRESHNESS = 2
W_BREADTH = 1

def scorer_node(state: NewsGraphState) -> dict:
    """CATEGORY_SOURCES 전체 기사에 대해 4차원 점수 부여 (0-10점 × 가중치)"""
    sources = state["sources"]

    candidates: list[dict] = []
    for key in CATEGORY_SOURCES:
        for a in sources.get(key, []):
            candidates.append(a)

    if not candidates:
        print("  [스코어링] 평가 대상 없음")
        return {"scored_candidates": []}

    # 1단계: 최신성 점수 (Python, 발행일 기반)
    today_count = 0
    for c in candidates:
        recency = _compute_recency_score(c)
        c["_score_recency"] = recency
        c["_is_today"] = _is_today(c)
        if c["_is_today"]:
            today_count += 1

    print(f"  [스코어링] {len(candidates)}개 기사 평가 중... (당일 기사: {today_count}개)")

    # 2단계: 임팩트/신선도/영향성 (LLM, 0-10점)
    article_text = ""
    for i, a in enumerate(candidates):
        title = a.get("display_title") or a.get("title", "")
        desc = a.get("description", "")[:150]
        article_text += f"\n[{i}] {title} | {desc}"

    prompt = f"""You are a JSON-only AI news scorer. Output ONLY a valid JSON array, no markdown, no explanation.

Score each article on 3 dimensions (0-10 integer):

1. impact (임팩트): How important is this to the AI field?
   10 = Paradigm shift (new frontier model, major breakthrough)
   8 = Very significant (notable model/product launch, major policy)
   6 = Important (meaningful update, substantial research)
   4 = Moderate (incremental improvement, niche but solid)
   2 = Minor (routine announcement, small update)
   0 = Irrelevant to AI

2. freshness (신선도): How novel is the information?
   10 = World-first exclusive, never reported before
   8 = Breaking news, very early coverage
   6 = Fresh angle on recent development
   4 = Known topic with new details
   2 = Rehash or follow-up of old news
   0 = Stale, no new information

3. breadth (영향성): How wide is the scope of influence?
   10 = Reshapes entire AI industry
   8 = Affects multiple major AI segments
   6 = Affects one major segment (NLP, CV, robotics, etc.)
   4 = Affects specific developer/researcher community
   2 = Niche audience only
   0 = Negligible scope

Also provide:
- topic_tag: short English tag for deduplication (e.g. "openai-gpt5", "eu-ai-act")
- category: one of "model_research", "product_tools", "industry_business"
  model_research = new models, papers, benchmarks, architecture, training methods
  product_tools = product launches, tools, APIs, frameworks, developer tools
  industry_business = funding, regulation, market, strategy, partnerships

Articles:
{article_text}

Output exactly {len(candidates)} items:
[{{"i":0,"impact":8,"freshness":7,"breadth":6,"topic_tag":"example-tag","category":"model_research"}}]"""

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
                impact = min(10, max(0, s.get("impact", 5)))
                fresh = min(10, max(0, s.get("freshness", 5)))
                breadth = min(10, max(0, s.get("breadth", 5)))
                recency = candidates[idx]["_score_recency"]
                candidates[idx]["_score_impact"] = impact
                candidates[idx]["_score_freshness"] = fresh
                candidates[idx]["_score_breadth"] = breadth
                candidates[idx]["_topic_tag"] = s.get("topic_tag", "")
                candidates[idx]["_llm_category"] = s.get("category", "")
                candidates[idx]["_total_score"] = (
                    recency * W_RECENCY
                    + impact * W_IMPACT
                    + fresh * W_FRESHNESS
                    + breadth * W_BREADTH
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
            recency = c.get("_score_recency", 3)
            c["_score_impact"] = 5
            c["_score_freshness"] = 5
            c["_score_breadth"] = 5
            c["_topic_tag"] = ""
            c["_llm_category"] = ""
            c["_total_score"] = recency * W_RECENCY + 5 * W_IMPACT + 5 * W_FRESHNESS + 5 * W_BREADTH

    return {"scored_candidates": candidates}


# ─── Node 4: ranker (LLM 기반 하이라이트 선정, 당일 기사 우선) ───
HIGHLIGHT_COUNT = 3
HIGHLIGHT_CANDIDATE_POOL = 12

def ranker_node(state: NewsGraphState) -> dict:
    """당일 기사 중 LLM이 Top 3 하이라이트를 직접 선정"""
    candidates = state.get("scored_candidates", [])
    if not candidates:
        return {"highlights": [], "category_pool": []}

    # 하이라이트는 HIGHLIGHT_SOURCES에서만 선정
    highlight_pool = [c for c in candidates if c.get("source_key", "") in HIGHLIGHT_SOURCES]
    non_highlight = [c for c in candidates if c.get("source_key", "") not in HIGHLIGHT_SOURCES]

    # 당일 기사를 우선, 그 안에서 점수순
    today_pool = sorted(
        [c for c in highlight_pool if c.get("_is_today")],
        key=lambda c: c.get("_total_score", 0), reverse=True,
    )
    older_pool = sorted(
        [c for c in highlight_pool if not c.get("_is_today")],
        key=lambda c: c.get("_total_score", 0), reverse=True,
    )

    # 당일 기사 우선으로 후보 풀 구성
    ordered_pool = today_pool + older_pool
    top_candidates = ordered_pool[:HIGHLIGHT_CANDIDATE_POOL]
    the_rest = ordered_pool[HIGHLIGHT_CANDIDATE_POOL:]

    today_in_pool = sum(1 for c in top_candidates if c.get("_is_today"))
    print(f"  [랭킹] 후보 {len(top_candidates)}개 (당일 {today_in_pool}개)")

    # LLM에게 최종 3개 선정 요청
    article_text = ""
    for i, c in enumerate(top_candidates):
        title = c.get("display_title") or c.get("title", "")
        desc = c.get("summary") or c.get("description", "")[:150]
        src = c.get("source_key", "")
        score = c.get("_total_score", 0)
        tag = c.get("_topic_tag", "")
        is_today = "TODAY" if c.get("_is_today") else "OLD"
        article_text += f"\n[{i}] ({is_today}, score={score}, tag={tag}, src={src}) {title} | {desc}"

    prompt = f"""You are an AI news editor. Pick the 3 BEST articles for today's highlights.

CRITICAL RULES:
1. STRONGLY PREFER articles marked "TODAY". Only pick "OLD" articles if no suitable TODAY articles remain.
2. AI RELEVANCE: Must be directly about AI/ML. Reject general tech, politics, entertainment.
3. IMPACT: Choose paradigm-shifting or significant news over minor updates.
4. TOPIC DIVERSITY: Each pick must cover a DIFFERENT topic. No two articles about the same subject.
5. SOURCE DIVERSITY: Prefer picks from different sources. Max 2 from the same source.

The FIRST pick becomes the Hero card — choose the single most impactful AI story of the day.

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
            today_flag = "당일" if c.get("_is_today") else "이전"
            print(f"    {rank+1}. [{c.get('_total_score', 0)}점/{today_flag}] {title} — {reason}")

    except Exception as e:
        print(f"  [WARNING] LLM 랭킹 실패, 점수순 폴백: {type(e).__name__}: {e}")

    # 폴백: 당일 기사 우선으로 보충
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
CATEGORY_TODAY_MIN = 3
MAX_PER_SOURCE_CATEGORY = 3

def _select_top_n(articles: list[dict], n: int, max_per_source: int, today_min: int = 0) -> list[dict]:
    """당일 기사 today_min개 보장 + 점수순 Top N + 소스 상한."""
    # 당일 기사와 이전 기사 분리
    today = sorted(
        [a for a in articles if a.get("_is_today")],
        key=lambda a: a.get("_total_score", 0), reverse=True,
    )
    older = sorted(
        [a for a in articles if not a.get("_is_today")],
        key=lambda a: a.get("_total_score", 0), reverse=True,
    )

    selected: list[dict] = []
    source_count: dict[str, int] = {}
    used_links: set[str] = set()

    def _try_add(a: dict) -> bool:
        if len(selected) >= n:
            return False
        link = a.get("link", "")
        if link in used_links:
            return False
        src = a.get("source_key", "")
        if source_count.get(src, 0) >= max_per_source:
            return False
        selected.append(a)
        source_count[src] = source_count.get(src, 0) + 1
        if link:
            used_links.add(link)
        return True

    # 1단계: 당일 기사 today_min개 우선 배치
    for a in today:
        if sum(1 for s in selected if s.get("_is_today")) >= today_min:
            break
        _try_add(a)

    # 2단계: 전체를 점수순으로 나머지 채움 (당일 + 이전 합산)
    all_sorted = sorted(articles, key=lambda a: a.get("_total_score", 0), reverse=True)
    for a in all_sorted:
        if len(selected) >= n:
            break
        _try_add(a)

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

    # 카테고리별 Top 10 선정 (당일 3개 보장 + 점수순 + 소스 상한)
    for cat in category_order:
        total = len(categorized[cat])
        today_in_cat = sum(1 for a in categorized[cat] if a.get("_is_today"))
        categorized[cat] = _select_top_n(
            categorized[cat], CATEGORY_TOP_N, MAX_PER_SOURCE_CATEGORY, today_min=CATEGORY_TODAY_MIN,
        )
        selected_today = sum(1 for a in categorized[cat] if a.get("_is_today"))
        print(f"    {cat}: {total}개 → Top {len(categorized[cat])}개 (당일 {selected_today}/{today_in_cat}개)")

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
