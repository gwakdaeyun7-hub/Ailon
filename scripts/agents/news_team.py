"""
뉴스 수집 파이프라인 — LangGraph 8-노드 (EN/KO 병렬 분기)

collector → ┬→ en_process (번역+요약+스코어링) ─┬→ ranker → classifier → assembler
            └→ ko_process (요약)               ─┘

1. collector:     12개 소스 수집 + 이미지/본문 통합 스크래핑
2. en_process:    영어 기사 번역+요약 (thinking 비활성화, 배치 5)
3. ko_process:    한국어 기사 요약 (thinking 비활성화, 배치 2)
4. scorer:        3차원 평가 (significance×4 + relevance×3 + freshness×3, 만점 100)
5. ranker:        당일 우선 Top 3 하이라이트 (미번역 차단)
6. classifier:    3개 카테고리 × Top 10
7. quality_gate:  카운트 검증 + 부족 시 기준 완화 재시도
8. assembler:     한국 소스별 분리 + 최종 결과

점수 체계: significance×4 + relevance×3 + freshness×3 (만점 100)
"""

import json
import re
import time
from datetime import datetime, timezone
from typing import TypedDict
from concurrent.futures import ThreadPoolExecutor, as_completed
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END
from agents.config import get_llm
from agents.tools import (
    SOURCES,
    fetch_all_sources, enrich_and_scrape, filter_imageless, _is_ai_related,
    HIGHLIGHT_SOURCES, CATEGORY_SOURCES, SOURCE_SECTION_SOURCES,
)


# ─── State 정의 ───
class NewsGraphState(TypedDict):
    sources: dict[str, list[dict]]
    en_done: bool
    ko_done: bool
    scored_candidates: list[dict]
    scorer_retry_count: int
    category_pool: list[dict]
    highlights: list[dict]
    categorized_articles: dict[str, list[dict]]
    category_order: list[str]
    source_articles: dict[str, list[dict]]
    source_order: list[str]
    total_count: int
    quality_retry: bool


# ─── 날짜 유틸리티 ───
def _parse_published(published: str) -> datetime | None:
    for fmt in (
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S %Z",
        "%Y-%m-%dT%H:%M:%S%z",
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
    pub = article.get("published", "")
    if not pub:
        return 3
    dt = _parse_published(pub)
    if not dt:
        return 3
    hours_ago = (datetime.now(timezone.utc) - dt).total_seconds() / 3600
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
    pub = article.get("published", "")
    if not pub:
        return False
    dt = _parse_published(pub)
    if not dt:
        return False
    return (datetime.now(timezone.utc) - dt).total_seconds() <= 86400


# ─── JSON 파싱 유틸리티 ───
def _parse_llm_json(text: str):
    text = text.strip()
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
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
        last_end = text.rfind(end_char)
        if last_end > start_idx:
            try:
                return json.loads(text[start_idx:last_end + 1])
            except json.JSONDecodeError:
                pass
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
    last_err = None
    for attempt in range(max_retries + 1):
        try:
            response = llm.invoke([HumanMessage(content=prompt)])
            return response.content
        except Exception as e:
            last_err = e
            if attempt < max_retries:
                wait = 2 ** attempt
                time.sleep(wait)
    raise last_err


# ─── 번역/요약 (EN/KO 분리, thinking 비활성화) ───
def _summarize_batch(batch: list[dict], batch_idx: int, translate: bool = True) -> list[dict] | None:
    """단일 배치 번역+요약 또는 요약만 (thinking 비활성화로 JSON 안정성 확보)"""
    batch_text = ""
    for i, a in enumerate(batch):
        body = a.get("body", "")
        max_body = 1200 if not translate else 2500
        content = body[:max_body] if body else a.get("description", "")[:500]
        batch_text += f"\n[{i+1}] 제목: {a['title']}\n    본문: {content}\n"

    if translate:
        task_desc = f"Translate and summarize {len(batch)} English AI news items to Korean."
        title_rule = (
            "display_title: 한국 뉴스 헤드라인 스타일 제목 (max 30 chars)\n"
            "  - 직역 금지. 한국 언론이 실제로 쓸 법한 자연스러운 제목으로 의역\n"
            "  - 고유명사(회사명·제품명·모델명)는 영어 그대로 유지 (예: Google, OpenAI, GPT-4, Claude, Meta Llama)\n"
            "  - 예: 'Google Releases New AI Model' → 'Google, 새 AI 모델 전격 공개'\n"
            "  - 쉼표·말줄임표·능동형 서술어 등 한국 뉴스 제목 관행 따르기"
        )
    else:
        task_desc = f"Summarize {len(batch)} Korean AI news items."
        title_rule = "display_title: Keep original Korean title as-is (max 30 chars, trim if needed)"

    prompt = f"""IMPORTANT: Output ONLY a valid JSON array. No thinking, no markdown. Start with '[' and end with ']'.

{task_desc}
- {title_rule}
- one_line: 핵심 한줄 요약 (1-2문장, ~이에요/~해요 체)
- key_points: 주요 포인트 배열 (3-5개, 각 1문장)
- why_important: 왜 중요한지 (2-3문장, ~이에요/~해요 체)
- 기술 용어는 영어 병기 (예: "미세 조정(fine-tuning)")

Return exactly {len(batch)} items:
[{{"index":1,"display_title":"...","one_line":"...","key_points":["...","...","..."],"why_important":"..."}}]

Articles:
{batch_text}"""

    try:
        llm = get_llm(temperature=0.3, max_tokens=8192, thinking=False, json_mode=True)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=2)
        results = _parse_llm_json(content)
        if isinstance(results, dict):
            results = next((v for v in results.values() if isinstance(v, list)), [])
        if isinstance(results, list):
            return results
    except Exception as e:
        label = "번역+요약" if translate else "요약"
        print(f"    [WARN] {label} 배치 {batch_idx + 1} 실패: {e}")
    return None


def _apply_batch_results(batch: list[dict], results: list[dict]) -> int:
    """배치 결과를 기사에 적용. 성공 건수 반환."""
    done = 0
    if not results:
        return 0
    for r in results:
        if not isinstance(r, dict):
            continue
        ridx = r.get("index", 1) - 1
        if 0 <= ridx < len(batch):
            if r.get("display_title"):
                batch[ridx]["display_title"] = r["display_title"]
            one_line = r.get("one_line", "")
            key_points = r.get("key_points", [])
            why_important = r.get("why_important", "")
            if one_line or key_points:
                batch[ridx]["one_line"] = one_line
                batch[ridx]["key_points"] = key_points if isinstance(key_points, list) else []
                batch[ridx]["why_important"] = why_important
                # summary 폴백 (레거시 호환)
                parts = [one_line]
                parts.extend(key_points if isinstance(key_points, list) else [])
                parts.append(why_important)
                batch[ridx]["summary"] = "\n".join(p for p in parts if p)
                done += 1
            elif r.get("summary"):
                batch[ridx]["summary"] = r["summary"]
                done += 1
    return done


def _process_articles(articles: list[dict], translate: bool, batch_size: int, max_workers: int = 5) -> None:
    """기사 번역/요약 처리 (배치 병렬 + 실패 시 병렬 재시도)"""
    if not articles:
        return

    label = "번역+요약" if translate else "요약"
    batches = [articles[i:i + batch_size] for i in range(0, len(articles), batch_size)]

    # 1차: 배치 병렬 처리
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(_summarize_batch, batch, idx, translate): (batch, idx)
            for idx, batch in enumerate(batches)
        }
        for future in as_completed(futures):
            batch, idx = futures[future]
            results = future.result()
            done = _apply_batch_results(batch, results)
            if results:
                print(f"    {label} 배치 {idx + 1}/{len(batches)}: {done}/{len(batch)}개")

    # 2차: 실패 기사 병렬 개별 재시도
    failed = [a for a in articles if not a.get("summary")]
    if failed:
        print(f"  [재시도] {label} 실패 {len(failed)}개 병렬 재시도...")
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(_summarize_batch, [a], 0, translate): a
                for a in failed
            }
            retry_ok = 0
            for future in as_completed(futures):
                a = futures[future]
                results = future.result()
                if _apply_batch_results([a], results):
                    retry_ok += 1
        print(f"  [재시도] {retry_ok}/{len(failed)}개 복구")

    # 3차: 안전망 폴백
    for a in articles:
        if not a.get("display_title"):
            a["display_title"] = a["title"]
        if not a.get("summary"):
            a["summary"] = a["description"][:300] if a.get("description") else ""

    success = len([a for a in articles if a.get("summary") and len(a["summary"]) > 50])
    print(f"  [{label}] 최종 {success}/{len(articles)}개 완료")


# ─── LLM AI 관련성 필터 ───
def _llm_ai_filter_batch(articles: list[dict]) -> set[int]:
    """기사 목록에서 AI 관련 기사 인덱스를 LLM으로 판별"""
    article_text = ""
    for i, a in enumerate(articles):
        title = a.get("title", "")
        desc = (a.get("description", "") or "")[:120]
        article_text += f"\n[{i}] {title} | {desc}"

    prompt = f"""IMPORTANT: Output ONLY a valid JSON array of integers. No thinking, no markdown.

STRICT FILTER: Only select articles where AI TECHNOLOGY is the CORE subject.

INCLUDE (AI technology must be the main topic):
- AI/ML model releases, benchmarks, architecture (e.g., "GPT-5 released", "new diffusion model")
- AI research papers and technical breakthroughs
- AI product features and tools (e.g., "Cursor adds AI code review")
- AI framework/library updates (e.g., "PyTorch 3.0", "LangChain update")
- AI policy/regulation directly about AI tech (e.g., "EU AI Act enforcement")

EXCLUDE (even if "AI" appears in title/tags):
- Company investment/funding/business strategy that happens to involve AI (e.g., "Samsung invests in AI chips", "AI startup raises $100M")
- General tech news mentioning AI as one of many topics
- Politics, entertainment, celebrities, sports, social issues
- Celebrity/influencer/public figure content (e.g., 충주맨, 유튜버, 인플루언서, 연예인)
- Government PR, regional marketing, tourism promotion that uses AI as a buzzword
- Articles with tags like "[AI 이슈트렌드]" or "[AI 브리핑]" but actual content is NOT about AI technology
- Market trends, stock analysis, industry forecasts about AI sector
- Hardware/chip/semiconductor business news unless about AI model training/inference
- "AI + 비기술 주제" 조합 기사 (e.g., "AI로 본 부동산", "AI 추천 맛집", "AI 시대 자기계발")
- Judge by the ACTUAL TOPIC, NOT by source name or section tags. When in doubt, EXCLUDE.

Articles:
{article_text}

Return ONLY the indices of articles where AI technology is the core subject:
[0, 2, 5]"""

    try:
        llm = get_llm(temperature=0.1, max_tokens=512, thinking=False, json_mode=True)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=1)
        result = _parse_llm_json(content)
        if isinstance(result, list):
            return set(int(idx) for idx in result if isinstance(idx, (int, float)))
    except Exception as e:
        print(f"    [WARN] LLM AI 필터 실패 → 키워드 폴백: {e}")
    # 실패 시 키워드 필터로 폴백
    return set(
        i for i, a in enumerate(articles)
        if _is_ai_related(a.get("title", ""), a.get("description", ""))
    )


def _llm_filter_sources(sources: dict[str, list[dict]]) -> None:
    """모든 소스를 LLM으로 AI 관련성 필터링 (엄격)"""
    total_removed = 0
    for key, articles in sources.items():
        if not articles:
            continue

        ai_indices = _llm_ai_filter_batch(articles)
        before = len(articles)
        sources[key] = [a for i, a in enumerate(articles) if i in ai_indices]
        removed = before - len(sources[key])
        total_removed += removed
        if removed > 0:
            print(f"    [{key}] LLM AI 필터: {removed}개 제거 → {len(sources[key])}개")

    if total_removed > 0:
        print(f"  [LLM AI 필터] 총 {total_removed}개 비AI 기사 제거")


# ─── Node 1: collector ───
def collector_node(state: NewsGraphState) -> dict:
    """모든 소스 수집 + 이미지/본문 통합 스크래핑 + 이미지 필터 + LLM AI 필터"""
    sources = fetch_all_sources()
    enrich_and_scrape(sources)
    filter_imageless(sources)
    _llm_filter_sources(sources)
    return {"sources": sources}


# ─── Node 2a: en_process (영어 번역+요약) ───
def en_process_node(state: NewsGraphState) -> dict:
    """영어 기사 번역+요약 (배치 5, thinking 비활성화)"""
    en_articles: list[dict] = []
    for key in CATEGORY_SOURCES:
        for a in state["sources"].get(key, []):
            if a.get("lang") != "ko":
                en_articles.append(a)

    if en_articles:
        print(f"\n  ─── EN 브랜치: {len(en_articles)}개 번역+요약 ───")
        _process_articles(en_articles, translate=True, batch_size=5)
    else:
        print("  [EN] 영어 기사 없음")

    return {"en_done": True, "sources": state["sources"]}


# ─── Node 2b: ko_process (한국어 요약) ───
def ko_process_node(state: NewsGraphState) -> dict:
    """한국어 기사 요약 (배치 2, thinking 비활성화)"""
    ko_articles: list[dict] = []
    for key in SOURCE_SECTION_SOURCES:
        for a in state["sources"].get(key, []):
            if a.get("lang") == "ko":
                a["display_title"] = a["title"]
                if a.get("body"):
                    ko_articles.append(a)
                else:
                    a["summary"] = a["description"][:300] if a.get("description") else ""

    if ko_articles:
        print(f"\n  ─── KO 브랜치: {len(ko_articles)}개 요약 ───")
        _process_articles(ko_articles, translate=False, batch_size=2)
    else:
        print("  [KO] 요약 대상 없음")

    return {"ko_done": True, "sources": state["sources"]}


# ─── Node 3: scorer (3차원 평가, 병렬 배치) ───
W_SIGNIFICANCE = 4  # 중요도 (impact + novelty 통합)
W_RELEVANCE = 3     # 개발자 관련성
W_FRESHNESS = 3     # 신선도
SCORER_BATCH_SIZE = 8

_SCORER_PROMPT = """IMPORTANT: Output ONLY a valid JSON array. No thinking, no markdown. Start with '['.

Score each article on 3 dimensions (0-10 integer):

1. significance (중요도): AI 기술 발전에 얼마나 중요한 사건인가?
   10: 패러다임 전환 (예: GPT-4 출시, Transformer 논문)
   8: 주요 발전 (예: 새 SOTA 모델, 중요 오픈소스 공개)
   6: 의미 있는 진전 (예: 주요 기업 AI 전략 발표)
   4: 일반적인 업데이트 (예: 마이너 버전 업, 후속 연구)
   2: 단순 소식/후속 보도

2. relevance (개발자 관련성): AI 개발자/실무자가 실제로 활용하거나 알아야 할 내용인가?
   10: 당장 워크플로우에 적용 가능 (예: 새 프레임워크 출시, API 변경)
   8: 곧 실무에 영향 (예: 주요 라이브러리 업데이트)
   6: 기술 이해에 도움 (예: 연구 논문, 벤치마크 결과)
   4: 간접적 관련 (예: 투자/인수 소식)
   2: 관련성 낮음 (예: 일반 산업 동향)

3. freshness (신선도): 이 뉴스가 최초 보도/새로운 정보인가, 이미 알려진 내용의 반복인가?
   10: 최초 보도/독점 정보
   8: 새로운 각도의 분석/추가 정보
   6: 알려진 사건의 의미 있는 후속 전개
   4: 이미 보도된 내용의 재탕/요약
   2: 오래된 뉴스의 반복

Also: category ("model_research"|"product_tools"|"industry_business")

Articles:
{article_text}

Output exactly {count} items:
[{{"i":0,"significance":8,"relevance":7,"freshness":6,"category":"model_research"}}]"""


def _score_batch(batch: list[dict], offset: int) -> list[dict]:
    article_text = ""
    for i, a in enumerate(batch):
        title = a.get("display_title") or a.get("title", "")
        desc = a.get("description", "")[:120]
        article_text += f"\n[{i}] {title} | {desc}"

    prompt = _SCORER_PROMPT.format(article_text=article_text, count=len(batch))
    try:
        llm = get_llm(temperature=0.1, max_tokens=2048, thinking=False, json_mode=True)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=2)
        scores = _parse_llm_json(content)
        if not isinstance(scores, list):
            scores = next((v for v in scores.values() if isinstance(v, list)), [])
        for s in scores:
            if isinstance(s, dict):
                raw_idx = s.get("i", s.get("index", -1))
                try:
                    s["_global_idx"] = offset + int(raw_idx)
                except (ValueError, TypeError):
                    pass
        return [s for s in scores if isinstance(s, dict) and "_global_idx" in s]
    except Exception:
        return []


def _score_batch_with_retry(batch: list[dict], offset: int) -> list[dict]:
    scores = _score_batch(batch, offset)
    if scores:
        return scores
    if len(batch) <= 2:
        return []
    mid = len(batch) // 2
    print(f"    [RETRY] 배치 분할: {len(batch)}개 → {mid} + {len(batch) - mid}")
    return _score_batch(batch[:mid], offset) + _score_batch(batch[mid:], offset + mid)


def scorer_node(state: NewsGraphState) -> dict:
    """CATEGORY_SOURCES 기사 3차원 점수 부여 (병렬 배치)"""
    retry_count = state.get("scorer_retry_count", 0)

    if retry_count == 0:
        candidates: list[dict] = []
        for key in CATEGORY_SOURCES:
            for a in state["sources"].get(key, []):
                candidates.append(a)

        if not candidates:
            return {"scored_candidates": [], "scorer_retry_count": 1}

        today_count = 0
        for c in candidates:
            c["_is_today"] = _is_today(c)
            if c["_is_today"]:
                today_count += 1
        print(f"  [스코어링] {len(candidates)}개 평가 중... (당일 {today_count}개)")
    else:
        candidates = state.get("scored_candidates", [])
        for c in candidates:
            if not c.get("_llm_scored"):
                c.pop("_total_score", None)

    unscored_indices = [i for i, c in enumerate(candidates) if not c.get("_llm_scored")]
    unscored = [candidates[i] for i in unscored_indices]

    if unscored:
        batch_size = SCORER_BATCH_SIZE if retry_count == 0 else max(2, SCORER_BATCH_SIZE // 2)
        batches = [unscored[i:i + batch_size] for i in range(0, len(unscored), batch_size)]

        # 병렬 스코어링
        with ThreadPoolExecutor(max_workers=4) as executor:
            future_to_batch = {
                executor.submit(_score_batch_with_retry, batch, idx * batch_size): (batch, idx)
                for idx, batch in enumerate(batches)
            }
            for future in as_completed(future_to_batch):
                batch, batch_idx = future_to_batch[future]
                scores = future.result()

                for s in scores:
                    local_idx = s["_global_idx"]
                    if 0 <= local_idx < len(unscored):
                        gi = unscored_indices[local_idx]
                        significance = min(10, max(0, s.get("significance", 5)))
                        relevance = min(10, max(0, s.get("relevance", 5)))
                        freshness = min(10, max(0, s.get("freshness", 5)))
                        candidates[gi]["_score_significance"] = significance
                        candidates[gi]["_score_relevance"] = relevance
                        candidates[gi]["_score_freshness"] = freshness
                        candidates[gi]["_llm_category"] = s.get("category", "")
                        candidates[gi]["_total_score"] = (
                            significance * W_SIGNIFICANCE
                            + relevance * W_RELEVANCE
                            + freshness * W_FRESHNESS
                        )
                        candidates[gi]["_llm_scored"] = True

                scored = len([c for c in batch if c.get("_llm_scored")])
                print(f"    배치 {batch_idx+1}/{len(batches)}: {scored}/{len(batch)}개")

    # 폴백: 미평가 기사에 낮은 기본 점수 (LLM 평가 기사 우선)
    for c in candidates:
        if "_total_score" not in c:
            c["_score_significance"] = 3
            c["_score_relevance"] = 3
            c["_score_freshness"] = 3
            c["_llm_category"] = ""
            c["_total_score"] = 3 * W_SIGNIFICANCE + 3 * W_RELEVANCE + 3 * W_FRESHNESS

    llm_count = len([c for c in candidates if c.get("_llm_scored")])
    print(f"  [스코어링] LLM 평가: {llm_count}/{len(candidates)}개")

    return {"scored_candidates": candidates, "scorer_retry_count": retry_count + 1}


# ─── Node 4: ranker (하이라이트 선정, 당일 기사 전용) ───
HIGHLIGHT_COUNT = 3


def ranker_node(state: NewsGraphState) -> dict:
    """Tier 1 당일 기사 중 점수순 Top 3 하이라이트"""
    candidates = state.get("scored_candidates", [])
    if not candidates:
        return {"highlights": [], "category_pool": []}

    # 하이라이트: Tier 1 당일 기사만
    tier1_today = [c for c in candidates
                   if c.get("source_key", "") in HIGHLIGHT_SOURCES and c.get("_is_today")]
    print(f"  [랭킹] Tier1 당일 기사 {len(tier1_today)}/{len(candidates)}개")

    _epoch = datetime(2000, 1, 1, tzinfo=timezone.utc)
    def _pub_key(c: dict):
        return _parse_published(c.get("published", "")) or _epoch

    ordered = sorted(
        tier1_today,
        key=lambda c: (c.get("_total_score", 0), _pub_key(c)),
        reverse=True,
    )

    selected: list[dict] = []

    for c in ordered:
        if len(selected) >= HIGHLIGHT_COUNT:
            break
        # 미번역 기사 차단
        if c.get("display_title") == c.get("title") and c.get("lang") != "ko":
            continue
        selected.append(c)

    for rank, c in enumerate(selected):
        title = (c.get("display_title") or c.get("title", ""))[:40]
        print(f"    {rank+1}. [{c.get('_total_score', 0)}점] {title}")

    # 하이라이트 제외한 Tier 1+2 전체 → 카테고리 분류 대상
    selected_set = set(id(c) for c in selected)
    remaining = [c for c in candidates if id(c) not in selected_set]

    return {"highlights": selected, "category_pool": remaining}


# ─── Node 5: classifier (카테고리 분류 + Top 10 선정) ───
VALID_CATEGORIES = {"model_research", "product_tools", "industry_business"}
CATEGORY_TOP_N = 10


def _classify_article(a: dict) -> str | None:
    """scorer LLM이 부여한 카테고리만 사용. 없으면 None → LLM 배치 분류로."""
    llm_cat = a.get("_llm_category", "")
    if llm_cat in VALID_CATEGORIES:
        return llm_cat
    return None


def _llm_classify_batch(articles: list[dict], categorized: dict[str, list[dict]]):
    article_text = ""
    for i, a in enumerate(articles):
        title = a.get("display_title") or a.get("title", "")
        desc = a.get("description", "")[:100]
        article_text += f"\n[{i}] {title} | {desc}"

    prompt = f"""IMPORTANT: Output ONLY a valid JSON array. No thinking, no markdown. Start with '['.

Classify each AI news article into ONE category:
- model_research: new technical knowledge/capability (paper, model, benchmark)
- product_tools: user-facing product/tool (app, API, framework)
- industry_business: money/org/policy moved (funding, acquisition, regulation)

Priority: model_research > product_tools > industry_business

Articles:
{article_text}

Output exactly {len(articles)} items:
[{{"i":0,"cat":"model_research"}}]"""

    try:
        llm = get_llm(temperature=0.1, max_tokens=1024, thinking=False, json_mode=True)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=1)
        results = _parse_llm_json(content)
        if not isinstance(results, list):
            results = next((v for v in results.values() if isinstance(v, list)), [])
        classified = set()
        for r in results:
            if not isinstance(r, dict):
                continue
            try:
                idx = int(r.get("i", r.get("index", -1)))
            except (ValueError, TypeError):
                continue
            cat = r.get("cat", "")
            if 0 <= idx < len(articles) and cat in categorized:
                categorized[cat].append(articles[idx])
                classified.add(idx)
        for i, a in enumerate(articles):
            if i not in classified:
                categorized["industry_business"].append(a)
    except Exception:
        for a in articles:
            categorized["industry_business"].append(a)


def _select_category_top_n(articles: list[dict], n: int = CATEGORY_TOP_N, today_min: int = 3) -> list[dict]:
    """당일 기사 today_min개 보장 + 나머지 점수순 채움 + 날짜 최신순 정렬"""
    _epoch = datetime(2000, 1, 1, tzinfo=timezone.utc)
    def _pub_key(a: dict):
        return _parse_published(a.get("published", "")) or _epoch

    today = sorted([a for a in articles if a.get("_is_today")],
                   key=lambda a: a.get("_total_score", 0), reverse=True)
    rest = sorted([a for a in articles if not a.get("_is_today")],
                  key=lambda a: a.get("_total_score", 0), reverse=True)

    selected: list[dict] = []
    used: set[int] = set()

    # 1) 당일 기사에서 today_min개 보장 (부족하면 최근 기사로 보충)
    for a in today:
        if len(selected) >= today_min:
            break
        selected.append(a)
        used.add(id(a))
    if len(selected) < today_min:
        for a in rest:
            if len(selected) >= today_min:
                break
            selected.append(a)
            used.add(id(a))

    # 2) 나머지 점수순으로 n개까지 채움
    all_by_score = sorted(articles, key=lambda a: a.get("_total_score", 0), reverse=True)
    for a in all_by_score:
        if len(selected) >= n:
            break
        if id(a) not in used:
            selected.append(a)
            used.add(id(a))

    # 3) 날짜 최신순 정렬
    selected.sort(key=_pub_key, reverse=True)
    return selected


def classifier_node(state: NewsGraphState) -> dict:
    """3개 카테고리 분류 + 당일 3개 보장 + 점수순 Top 10 + 날짜순 정렬"""
    category_pool = state.get("category_pool", [])

    category_order = ["model_research", "product_tools", "industry_business"]
    categorized: dict[str, list[dict]] = {k: [] for k in category_order}

    if not category_pool:
        return {"categorized_articles": categorized, "category_order": category_order}

    ambiguous: list[dict] = []
    classified_count = 0
    for a in category_pool:
        cat = _classify_article(a)
        if cat:
            categorized[cat].append(a)
            classified_count += 1
        else:
            ambiguous.append(a)

    print(f"  [분류] {classified_count}개 즉시 분류, {len(ambiguous)}개 모호")

    if ambiguous:
        _llm_classify_batch(ambiguous, categorized)

    # 카테고리별 당일 3개 보장 + 점수순 Top 10 + 날짜순 정렬
    for cat in category_order:
        total = len(categorized[cat])
        today_count = len([a for a in categorized[cat] if a.get("_is_today")])
        categorized[cat] = _select_category_top_n(categorized[cat])
        print(f"    {cat}: {total}개 (당일 {today_count}) → Top {len(categorized[cat])}개")

    return {"categorized_articles": categorized, "category_order": category_order}


# ─── Node 6: quality_gate (카운트 검증) ───
def quality_gate_node(state: NewsGraphState) -> dict:
    """품질 검증: 카운트 부족 시 quality_retry 플래그 설정"""
    highlights = state.get("highlights", [])
    categorized = state.get("categorized_articles", {})

    h_count = len(highlights)
    cat_counts = {cat: len(articles) for cat, articles in categorized.items()}
    min_cat = min(cat_counts.values()) if cat_counts else 0
    total_cat = sum(cat_counts.values())

    print(f"  [품질] 하이라이트 {h_count}/3, 카테고리 {cat_counts}")

    issues = []
    if h_count < 3:
        issues.append(f"하이라이트 {h_count}/3")
    if min_cat < 5:
        issues.append(f"카테고리 최소 {min_cat}/10")

    if issues:
        print(f"  [품질 경고] {', '.join(issues)}")

    return {}


# ─── Node 7: assembler ───
def assembler_node(state: NewsGraphState) -> dict:
    """한국 소스별 분리 + 최종 결과 조합"""
    sources = state["sources"]

    source_articles: dict[str, list[dict]] = {}
    source_order: list[str] = []

    _epoch = datetime(2000, 1, 1, tzinfo=timezone.utc)
    def _pub_key(a: dict):
        return _parse_published(a.get("published", "")) or _epoch

    for s in SOURCES:
        key = s["key"]
        if key in SOURCE_SECTION_SOURCES and sources.get(key):
            sorted_articles = sorted(sources[key], key=_pub_key, reverse=True)
            source_articles[key] = sorted_articles[:10]
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


# ─── 조건부 라우팅 ───
def _route_after_collector(state: NewsGraphState) -> str:
    total = sum(len(v) for v in state.get("sources", {}).values())
    if total == 0:
        print("  [라우팅] 수집된 기사 없음 → assembler 직행")
        return "assembler"
    return "en_process"


def _route_after_scorer(state: NewsGraphState) -> str:
    """스코어 커버리지 < 60% 이고 재시도 < 2 이면 재시도"""
    candidates = state.get("scored_candidates", [])
    retry_count = state.get("scorer_retry_count", 0)
    if not candidates:
        return "ranker"
    llm_scored = len([c for c in candidates if c.get("_llm_scored")])
    coverage = llm_scored / len(candidates)
    if coverage < 0.6 and retry_count < 2:
        print(f"  [라우팅] 스코어 커버리지 {coverage:.0%} < 60% → 재시도")
        return "scorer"
    return "ranker"


# ─── 그래프 구성 (EN/KO 병렬 분기) ───
def _build_graph():
    graph = StateGraph(NewsGraphState)

    graph.add_node("collector", collector_node)
    graph.add_node("en_process", en_process_node)
    graph.add_node("ko_process", ko_process_node)
    graph.add_node("scorer", scorer_node)
    graph.add_node("ranker", ranker_node)
    graph.add_node("classifier", classifier_node)
    graph.add_node("quality_gate", quality_gate_node)
    graph.add_node("assembler", assembler_node)

    graph.set_entry_point("collector")

    # collector → 기사 있으면 EN/KO 병렬 분기, 없으면 assembler 직행
    graph.add_conditional_edges("collector", _route_after_collector, {
        "en_process": "en_process",
        "assembler": "assembler",
    })

    # EN 처리 후 KO도 실행 (LangGraph에서 fan-out은 순차로 구현)
    graph.add_edge("en_process", "ko_process")

    # KO 완료 → scorer
    graph.add_edge("ko_process", "scorer")

    # scorer → 커버리지 부족 시 재시도 루프
    graph.add_conditional_edges("scorer", _route_after_scorer, {
        "scorer": "scorer",
        "ranker": "ranker",
    })

    graph.add_edge("ranker", "classifier")
    graph.add_edge("classifier", "quality_gate")
    graph.add_edge("quality_gate", "assembler")
    graph.add_edge("assembler", END)

    return graph.compile()


# ─── 메인 파이프라인 ───
def run_news_pipeline() -> dict:
    print("=" * 60)
    print("[START] 뉴스 수집 파이프라인 (LangGraph 8-노드, EN/KO 병렬)")
    print("=" * 60)

    app = _build_graph()
    result = app.invoke({
        "sources": {},
        "en_done": False,
        "ko_done": False,
        "scored_candidates": [],
        "scorer_retry_count": 0,
        "category_pool": [],
        "highlights": [],
        "categorized_articles": {},
        "category_order": [],
        "source_articles": {},
        "source_order": [],
        "total_count": 0,
        "quality_retry": False,
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
