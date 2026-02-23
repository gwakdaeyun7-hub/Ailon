"""
뉴스 수집 파이프라인 -- LangGraph 7-노드 (EN/KO 진정한 병렬 분기)

collector --> [en_process, ko_process] (병렬 Send) --> scorer --> ranker --> classifier --> assembler
                                                        ^  |
                                                        +--+ (커버리지 < 60% 시 재시도)

1. collector:     12개 소스 수집 + 이미지/본문 통합 스크래핑 + LLM AI 필터
2. en_process:    영어 기사 번역+요약 (thinking 비활성화, 배치 5)  -- 병렬
3. ko_process:    한국어 기사 요약 (thinking 비활성화, 배치 2)     -- 병렬
4. scorer:        3차원 LLM 평가 (significance*4 + relevance*3 + freshness*3, 만점 100)
5. ranker:        당일 우선 Top 3 하이라이트 (미번역 차단)
6. classifier:    3개 카테고리 * Top 10 + 품질 검증 (quality_gate 통합)
7. assembler:     한국 소스별 분리 + 최종 결과 + 타이밍 리포트

개선 사항:
- EN/KO Send API 병렬 실행 (순차 -> 병렬, ~2x 속도 개선)
- 노드별 에러 핸들링 (한 노드 실패 시 파이프라인 전체 중단 방지)
- 불필요한 state 필드 제거 (en_done, ko_done, quality_retry)
- quality_gate 를 classifier 에 통합 (실효 없는 노드 제거)
- 노드별 소요 시간 측정
- sources Annotated 리듀서로 EN/KO 결과 안전 머지

점수 체계: significance*4 + relevance*3 + freshness*3 (만점 100, 전부 LLM 평가)
"""

import json
import re
import time
from datetime import datetime, timezone
from difflib import SequenceMatcher
from typing import Annotated, TypedDict
from concurrent.futures import ThreadPoolExecutor, as_completed
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END
from langgraph.types import Send
from agents.config import get_llm
from agents.tools import (
    SOURCES,
    fetch_all_sources, enrich_and_scrape, filter_imageless, _is_ai_related,
    HIGHLIGHT_SOURCES, CATEGORY_SOURCES, SOURCE_SECTION_SOURCES,
)


# ─── State 리듀서 ───
def _merge_dicts(left: dict, right: dict) -> dict:
    """두 dict 를 머지한다. EN/KO 노드가 각각 자기 소스만 반환할 때 사용.
    in-place 변경 없이 새 dict 를 반환하므로 병렬 안전."""
    if not left:
        return right
    if not right:
        return left
    merged = dict(left)
    merged.update(right)
    return merged


# ─── State 정의 ───
def _merge_lists(left: list, right: list) -> list:
    """두 list 를 합친다. 에러 로그 등 병렬 노드 결과 머지용."""
    return (left or []) + (right or [])


class NewsGraphState(TypedDict):
    # sources: 소스키 -> 기사 리스트. EN/KO 병렬 노드가 각각 자기 소스만 반환하므로 merge 리듀서 사용.
    sources: Annotated[dict[str, list[dict]], _merge_dicts]
    scored_candidates: list[dict]
    scorer_retry_count: int
    category_pool: list[dict]
    highlights: list[dict]
    categorized_articles: dict[str, list[dict]]
    category_order: list[str]
    source_articles: dict[str, list[dict]]
    source_order: list[str]
    total_count: int
    # 노드별 소요 시간 (초)
    node_timings: Annotated[dict[str, float], _merge_dicts]
    # 노드별 에러 기록 (파이프라인 실패 vs 뉴스 없음 구분용)
    errors: Annotated[list[str], _merge_lists]


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
    if not text:
        raise json.JSONDecodeError("Empty LLM response", "", 0)

    text = text.strip()
    # Gemini 2.5 Flash: <thinking> 태그 제거 (thinking 비활성화 시에도 발생 가능)
    text = re.sub(r'<think(?:ing)?>.*?</think(?:ing)?>', '', text, flags=re.DOTALL)
    text = re.sub(r'^```(?:json)?\s*\n?', '', text)
    text = re.sub(r'\n?```\s*$', '', text)
    text = text.strip()

    if not text:
        raise json.JSONDecodeError("LLM response empty after stripping thinking tags", "", 0)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 잘린 JSON 배열 복구 ([ 있지만 ] 없는 경우 — {/} 추출보다 먼저 시도)
    bracket_idx = text.find('[')
    if bracket_idx != -1 and ']' not in text[bracket_idx:]:
        truncated = text[bracket_idx:].rstrip()
        # 끝의 불완전한 요소/쉼표 제거 후 ] 추가
        truncated = re.sub(r'[,\s]+$', '', truncated)
        # 불완전한 마지막 객체 제거 ({"i":0,"sig... 같은 경우)
        truncated = re.sub(r',\s*\{[^}]*$', '', truncated)
        truncated += ']'
        try:
            result = json.loads(truncated)
            print(f"    [JSON 복구] 잘린 배열 복구 성공: {len(result)}개 항목")
            return result
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

    # 디버그: 파싱 실패 시 응답 내용 출력
    preview = text[:300].replace('\n', '\\n')
    raise json.JSONDecodeError(f"No valid JSON found. Response preview: {preview}", text, 0)


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
        task_desc = f"Translate and summarize {len(batch)} English AI news articles into Korean."
        title_rule = (
            "display_title: 한국 뉴스 헤드라인 스타일 제목 (15~35자)\n"
            "  - 직역 금지. 한국 뉴스 데스크가 실제로 쓸 법한 자연스러운 제목\n"
            "  - 고유명사(회사명·제품명·모델명)는 영어 유지 (Google, OpenAI, GPT-4, Claude)\n"
            "  - 예: 'Google Releases New AI Model' -> 'Google, 새 AI 모델 전격 공개'\n"
            "  - 예: 'Anthropic Raises $2B at $60B Valuation' -> 'Anthropic, 60조 가치에 2조 원 투자 유치'\n"
            "  - 핵심 행위자 + 핵심 사건을 압축. 쉼표·능동형 서술어 활용"
        )
    else:
        task_desc = f"Summarize {len(batch)} Korean AI news articles."
        title_rule = "display_title: 원래 한국어 제목을 그대로 사용 (35자 초과 시 핵심만 남겨 축약)"

    prompt = f"""IMPORTANT: Output ONLY a valid JSON array. No thinking, no markdown. Start with '[' and end with ']'.

RULE: Only use facts stated in the provided article text. Never infer, speculate, or add information not present in the source.

{task_desc}

For each article, produce:
- {title_rule}
- one_line: 무슨 일이 일어났는가 -- 정확히 1문장 (~이에요/~해요 체)
  - 팩트만 전달. 의견·해석·중요성 평가 금지
  - 본문에 없는 정보 추가 금지
  - 예: "OpenAI가 GPT-5를 공식 출시했어요"
  - 예: "Meta가 Llama 4를 오픈소스로 공개했어요"
- key_points: 핵심 팩트 3개 (각 1문장 이내, ~이에요/~해요 체)
  - 숫자·모델명·성능 지표·구체적 스펙 우선
  - one_line과 중복 금지
  - 본문에 구체적 팩트가 부족하면 2개도 허용
  - 예: ["컨텍스트 윈도우 256K 토큰을 지원해요", "GPT-4 대비 추론 속도가 2배 빨라요", "API 가격은 50% 인하됐어요"]
- why_important: 업계/개발자에게 미치는 영향 -- 1~2문장, ~이에요/~해요 체
  - one_line·key_points에 나온 내용 반복 금지
  - "~에 영향을 줄 수 있어요", "~가 바뀔 수 있어요" 등 시사점 중심

문체 규칙:
- 종결어미: ~이에요/~해요/~있어요 (해요체). ~입니다/~합니다(합쇼체) 사용 금지
- 기술 용어 영어 병기: "미세 조정(fine-tuning)", "검색 증강 생성(RAG)"

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

    # 폴백: index 필드 없지만 개수가 맞으면 순서대로 매핑
    dicts_only = [r for r in results if isinstance(r, dict)]
    has_index = any(r.get("index") is not None for r in dicts_only)
    if not has_index and len(dicts_only) == len(batch):
        for idx, r in enumerate(dicts_only):
            r["index"] = idx + 1  # 1-based

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

You are filtering news articles. Return indices of articles that are RELATED to AI.

Decision rule: Ask "Does this article have a meaningful connection to AI?" If yes, include. Only exclude articles that have NO relevance to AI at all.

When in doubt, INCLUDE.

INCLUDE -- any meaningful AI connection:
- Model releases, benchmarks, architecture advances
- AI research papers and technical breakthroughs
- AI-powered products/tools and their features
- AI frameworks/libraries (PyTorch, LangChain, etc.)
- AI regulation, policy, ethics discussions
- AI industry news (funding, M&A, partnerships involving AI companies)
- AI adoption stories in any industry
- Hardware/semiconductors related to AI (GPUs, NPUs, AI chips)
- AI's impact on society, jobs, education
- Tutorials, guides, opinions about AI

EXCLUDE -- no real AI connection:
- Non-tech subjects using AI as a passing buzzword (real estate, food, self-help)
- Celebrity, entertainment, politics with no AI substance
- Government PR, tourism, regional marketing
- Articles where "AI" only appears in a section tag but content is unrelated

Articles:
{article_text}

Return the indices of AI-related articles as a JSON array:
[0, 2, 5]"""

    try:
        llm = get_llm(temperature=0.1, max_tokens=2048, thinking=False, json_mode=True)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=1)
        result = _parse_llm_json(content)
        if isinstance(result, list):
            return set(int(idx) for idx in result if isinstance(idx, (int, float)))
    except Exception as e:
        print(f"    [WARN] LLM AI 필터 실패 -> 키워드 폴백: {e}")
    # 실패 시 키워드 필터로 폴백
    return set(
        i for i, a in enumerate(articles)
        if _is_ai_related(a.get("title", ""), a.get("description", ""))
    )


def _llm_filter_sources(sources: dict[str, list[dict]]) -> None:
    """모든 소스를 LLM으로 AI 관련성 필터링 (병렬)"""
    total_removed = 0
    tasks = [(key, articles) for key, articles in sources.items() if articles]

    def _filter_one(key: str, articles: list[dict]) -> tuple[str, list[dict], int, int]:
        ai_indices = _llm_ai_filter_batch(articles)
        filtered = [a for i, a in enumerate(articles) if i in ai_indices]
        removed_articles = [a for i, a in enumerate(articles) if i not in ai_indices]
        removed = len(removed_articles)
        today_removed = sum(1 for a in removed_articles if _is_today(a))
        if removed > 0:
            msg = f"    [{key}] LLM AI 필터: {removed}개 제거 -> {len(filtered)}개"
            if today_removed > 0:
                msg += f" (당일 {today_removed}개 제거됨)"
            print(msg)
        return key, filtered, removed, today_removed

    total_today_removed = 0
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(_filter_one, key, articles): key for key, articles in tasks}
        for future in as_completed(futures):
            key, filtered, removed, today_removed = future.result()
            sources[key] = filtered
            total_removed += removed
            total_today_removed += today_removed

    if total_removed > 0:
        msg = f"  [LLM AI 필터] 총 {total_removed}개 비AI 기사 제거"
        if total_today_removed > 0:
            msg += f" (당일 기사 {total_today_removed}개 포함)"
        print(msg)


# ─── 노드별 에러 핸들링 + 타이밍 데코레이터 ───
def _safe_node(node_name: str):
    """노드 실행을 try/except 로 감싸서 실패 시에도 파이프라인 진행.
    실패한 노드는 빈 결과를 반환하고 에러를 로그에 기록한다.
    또한 각 노드의 소요 시간을 node_timings 에 기록한다."""
    def decorator(fn):
        def wrapper(state):
            t0 = time.time()
            try:
                result = fn(state)
            except Exception as e:
                elapsed = time.time() - t0
                print(f"  [ERROR] {node_name} 노드 실패 ({elapsed:.1f}s): {e}")
                result = {"errors": [f"{node_name}: {e}"]}
            elapsed = time.time() - t0
            print(f"  [{node_name}] {elapsed:.1f}s")
            result.setdefault("node_timings", {})
            result["node_timings"][node_name] = round(elapsed, 1)
            return result
        wrapper.__name__ = fn.__name__
        wrapper.__doc__ = fn.__doc__
        return wrapper
    return decorator


# ─── Node 1: collector ───
@_safe_node("collector")
def collector_node(state: NewsGraphState) -> dict:
    """모든 소스 수집 + 이미지/본문 통합 스크래핑 + 이미지 필터 + LLM AI 필터"""
    sources = fetch_all_sources()
    enrich_and_scrape(sources)
    filter_imageless(sources)
    _llm_filter_sources(sources)
    return {"sources": sources}


# ─── Node 2a: en_process (영어 번역+요약) ───
@_safe_node("en_process")
def en_process_node(state: NewsGraphState) -> dict:
    """영어 기사 번역+요약 (배치 5, thinking 비활성화)

    _merge_dicts 리듀서를 통해 처리한 소스 키만 state 에 머지된다.
    이전 코드처럼 state["sources"] 전체를 반환하지 않으므로
    ko_process 와 병렬 실행해도 안전하다.
    """
    en_articles: list[dict] = []
    en_source_keys: set[str] = set()
    for key in CATEGORY_SOURCES:
        for a in state["sources"].get(key, []):
            if a.get("lang") != "ko":
                en_articles.append(a)
                en_source_keys.add(key)

    if en_articles:
        print(f"\n  --- EN 브랜치: {len(en_articles)}개 번역+요약 ---")
        _process_articles(en_articles, translate=True, batch_size=5)
    else:
        print("  [EN] 영어 기사 없음")

    # 처리한 소스 키만 반환 -- 리듀서가 기존 state 에 머지
    partial_sources = {key: state["sources"][key] for key in en_source_keys if key in state["sources"]}
    return {"sources": partial_sources}


# ─── Node 2b: ko_process (한국어 요약) ───
@_safe_node("ko_process")
def ko_process_node(state: NewsGraphState) -> dict:
    """한국어 기사 요약 (배치 2, thinking 비활성화)

    _merge_dicts 리듀서를 통해 처리한 소스 키만 state 에 머지된다.
    """
    ko_articles: list[dict] = []
    ko_source_keys: set[str] = set()
    for key in SOURCE_SECTION_SOURCES:
        for a in state["sources"].get(key, []):
            if a.get("lang") == "ko":
                a["display_title"] = a["title"]
                ko_source_keys.add(key)
                if a.get("body"):
                    ko_articles.append(a)
                else:
                    a["summary"] = a["description"][:300] if a.get("description") else ""

    if ko_articles:
        print(f"\n  --- KO 브랜치: {len(ko_articles)}개 요약 ---")
        _process_articles(ko_articles, translate=False, batch_size=2)
    else:
        print("  [KO] 요약 대상 없음")

    # 처리한 소스 키만 반환 -- 리듀서가 기존 state 에 머지
    partial_sources = {key: state["sources"][key] for key in ko_source_keys if key in state["sources"]}
    return {"sources": partial_sources}


# ─── 중복 제거 ───
DEDUP_THRESHOLD = 0.65


def _deduplicate_candidates(candidates: list[dict]) -> list[dict]:
    """display_title 유사도 기반 중복 제거. 발행일 최신 기사 유지."""
    if len(candidates) <= 1:
        return candidates

    _epoch = datetime(2000, 1, 1, tzinfo=timezone.utc)
    sorted_cands = sorted(
        candidates,
        key=lambda c: _parse_published(c.get("published", "")) or _epoch,
        reverse=True,
    )

    kept: list[dict] = []
    removed = 0
    for c in sorted_cands:
        title = c.get("display_title") or c.get("title", "")
        is_dup = False
        for k in kept:
            k_title = k.get("display_title") or k.get("title", "")
            if SequenceMatcher(None, title, k_title).ratio() >= DEDUP_THRESHOLD:
                is_dup = True
                break
        if is_dup:
            removed += 1
        else:
            kept.append(c)

    if removed > 0:
        print(f"  [중복 제거] {removed}개 중복 기사 제거 ({len(candidates)} → {len(kept)}개)")
    return kept


# ─── Node 3: scorer (3 LLM차원, 병렬 배치) ───
W_SIGNIFICANCE = 4  # 중요도 (LLM 평가)
W_RELEVANCE = 3     # 개발자 관련성 (LLM 평가)
W_FRESHNESS = 3     # 정보 신선도 (LLM 평가 -- novelty, NOT recency)
SCORER_BATCH_SIZE = 5

_SCORER_PROMPT = """IMPORTANT: Output ONLY a valid JSON array. No thinking, no markdown. Start with '['.

Score each article on 3 dimensions (1-10 integer). Use the FULL range: 5 is average. Most articles should score 3-7. Reserve 9-10 for genuinely exceptional news.

1. significance (중요도): AI 기술 발전에 얼마나 중요한 사건인가?
   10: 패러다임 전환 -- 업계 전체가 바뀜 (예: Transformer 논문, ChatGPT 최초 공개)
    9: 역대급 발전 -- 해당 분야의 판도가 바뀜 (예: GPT-4 출시)
    8: 주요 발전 -- 새 SOTA 달성, 중요 오픈소스 공개
    7: 유의미한 기술 진전 -- 주목할 만한 연구 결과, 주요 API/기능 추가
    6: 의미 있는 소식 -- 주요 기업의 AI 전략 발표, 중요 업데이트
    5: 평균적 뉴스 -- 일반적인 제품 업데이트, 보통 수준의 연구
    4: 마이너 업데이트 -- 작은 버전업, 후속 연구
    3: 단순 소식 -- 반복 보도, 의견 기사
    2: 관심도 낮음 -- 사소한 변경, 루머
    1: 무의미 -- 뉴스 가치 없음

2. relevance (개발자 관련성): AI 개발자/실무자가 실제로 활용하거나 알아야 할 내용인가?
   10: 즉시 적용 필수 -- 개발자 워크플로우가 바뀜 (새 프레임워크 출시, breaking API 변경)
    9: 당장 적용 가능 -- 중요 도구/라이브러리의 메이저 업데이트
    8: 곧 실무에 영향 -- 주요 라이브러리 업데이트, 새 개발 도구 출시
    7: 실무에 유용 -- 새 API 기능, 유용한 오픈소스 프로젝트, 실전 적용 사례
    6: 기술 이해에 도움 -- 연구 논문, 벤치마크 결과, 기술 분석
    5: 알아두면 좋은 수준 -- 일반적인 기술 동향, 배경 지식
    4: 간접적 관련 -- 투자, 인수, 정책 등 비기술적이지만 업계에 영향
    3: 관련 낮음 -- 일반 산업 동향, 개발자에게 먼 이야기
    2: 거의 무관 -- AI 언급되지만 기술적 내용 없음
    1: 무관 -- 개발자/실무자와 관련 없는 내용

3. freshness (정보 신선도): 이 뉴스가 새로운 정보인가, 이미 알려진 내용의 반복인가?
   NOTE: This is about NOVELTY of information, NOT recency of publication date.
   10: 최초 보도 / 독점 정보 -- 이전에 전혀 알려지지 않은 사실 (예: 신모델 최초 공개, 미공개 연구 발표)
    9: 거의 최초 -- 극소수만 보도한 새로운 사실 (예: 비공개 베타 첫 리뷰)
    8: 새로운 1차 정보 -- 공식 발표 직후 원문 보도, 새로운 벤치마크/데이터 포함
    7: 의미 있는 새 관점 -- 기존 사건에 대한 독자적 분석, 새로운 각도의 해석
    6: 새 정보 일부 포함 -- 알려진 소식이지만 추가 디테일/후속 정보 있음
    5: 보통 -- 공식 발표의 일반적 보도, 특별한 추가 정보 없음
    4: 대부분 기존 정보 -- 이미 보도된 내용 + 약간의 새 코멘트
    3: 재탕 -- 다른 매체가 이미 보도한 내용을 거의 그대로 반복
    2: 명백한 반복 -- 새로운 정보 없이 기존 보도 요약/재구성
    1: 완전한 중복 -- 동일 사건의 단순 재게시, 정보 가치 없음

4. category: 아래 3개 중 하나를 선택
   - "model_research": 새로운 모델, 연구 논문, 벤치마크, 학습 기법, 아키텍처
   - "product_tools": 사용자가 쓸 수 있는 제품, 도구, API, 프레임워크, 라이브러리
   - "industry_business": 투자, 인수, 규제, 기업 전략, 산업 동향
   경계 사례: "새 모델 출시 + API 제공" -> model_research (기술이 핵심). "기존 제품에 AI 기능 추가" -> product_tools

Articles:
{article_text}

Output exactly {count} items:
[{{"i":0,"significance":6,"relevance":7,"freshness":5,"category":"model_research"}}]"""


_scorer_lock = __import__("threading").Lock()
_scorer_call_ts: list[float] = []  # 최근 API 호출 시각 기록


def _scorer_throttle():
    """Gemini 레이트리밋 방지: 최근 5초 내 호출이 3개 이상이면 대기"""
    wait = 0
    with _scorer_lock:
        now = time.time()
        _scorer_call_ts[:] = [t for t in _scorer_call_ts if now - t < 5]
        if len(_scorer_call_ts) >= 3:
            wait = 5.0 - (now - _scorer_call_ts[0]) + 0.2
    if wait > 0:
        time.sleep(wait)
    with _scorer_lock:
        _scorer_call_ts.append(time.time())


def _score_batch(batch: list[dict], offset: int) -> list[dict]:
    article_text = ""
    for i, a in enumerate(batch):
        title = a.get("display_title") or a.get("title", "")
        one_line = a.get("one_line", "")
        desc = one_line if one_line else a.get("description", "")[:120]
        article_text += f"\n[{i}] {title} | {desc}"

    prompt = _SCORER_PROMPT.format(article_text=article_text, count=len(batch))
    try:
        _scorer_throttle()  # 레이트리밋 방지
        llm = get_llm(temperature=0.1, max_tokens=4096, thinking=False, json_mode=True)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=2)
        scores = _parse_llm_json(content)
        if not isinstance(scores, list):
            scores = next((v for v in scores.values() if isinstance(v, list)), [])

        # 빈 응답 진단 (레이트리밋으로 [] 또는 {} 반환 시)
        if not scores:
            preview = str(content)[:150] if content else "EMPTY"
            print(f"    [SCORER 빈 응답] offset={offset}, size={len(batch)}, raw={preview}")
            return []

        for s in scores:
            if isinstance(s, dict):
                raw_idx = s.get("i", s.get("index", -1))
                try:
                    s["_global_idx"] = offset + int(raw_idx)
                except (ValueError, TypeError):
                    pass

        # 폴백: "i" 필드 없지만 개수가 맞으면 순서대로 매핑
        valid = [s for s in scores if isinstance(s, dict) and "_global_idx" in s]
        if not valid and len([s for s in scores if isinstance(s, dict)]) == len(batch):
            print(f"    [SCORER 폴백] i값 없음 → 순서 매핑 (offset={offset}, {len(batch)}개)")
            for idx, s in enumerate(scores):
                if isinstance(s, dict):
                    s["_global_idx"] = offset + idx
            valid = [s for s in scores if isinstance(s, dict) and "_global_idx" in s]

        if len(valid) < len(batch):
            raw_indices = [s.get("i", s.get("index", "MISSING")) for s in scores if isinstance(s, dict)]
            print(f"    [SCORER 진단] offset={offset}, 요청={len(batch)}개, 파싱={len(scores)}개, 유효={len(valid)}개, i값={raw_indices}")
        return valid
    except Exception as e:
        print(f"    [SCORER ERROR] 배치 offset={offset}, size={len(batch)}: {type(e).__name__}: {e}")
        return []


def _score_batch_with_retry(batch: list[dict], offset: int) -> list[dict]:
    scores = _score_batch(batch, offset)
    if scores:
        return scores
    if len(batch) <= 1:
        return []
    mid = len(batch) // 2
    print(f"    [RETRY] 배치 분할: {len(batch)}개 -> {mid} + {len(batch) - mid}")
    left = _score_batch(batch[:mid], offset)
    right = _score_batch(batch[mid:], offset + mid)
    return left + right


@_safe_node("scorer")
def scorer_node(state: NewsGraphState) -> dict:
    """CATEGORY_SOURCES(Tier 1+2) 기사 3차원 점수 부여 (병렬 배치)"""
    retry_count = state.get("scorer_retry_count", 0)

    if retry_count == 0:
        candidates: list[dict] = []
        for key in CATEGORY_SOURCES:
            for a in state["sources"].get(key, []):
                candidates.append(a)

        if not candidates:
            return {"scored_candidates": [], "scorer_retry_count": 1}

        candidates = _deduplicate_candidates(candidates)

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

        # 병렬 스코어링 (throttle로 Gemini 레이트리밋 방지)
        with ThreadPoolExecutor(max_workers=3) as executor:
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
                        significance = min(10, max(1, s.get("significance", 5)))
                        relevance = min(10, max(1, s.get("relevance", 5)))
                        freshness = min(10, max(1, s.get("freshness", 5)))
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


@_safe_node("ranker")
def ranker_node(state: NewsGraphState) -> dict:
    """당일 기사 중 점수 상위 Top 3 하이라이트 (소스 제한 없음)"""
    candidates = state.get("scored_candidates", [])
    if not candidates:
        return {"highlights": [], "category_pool": []}

    # 하이라이트: 모든 소스의 당일 기사
    today_all = [c for c in candidates if c.get("_is_today")]
    print(f"  [랭킹] 당일 기사 {len(today_all)}/{len(candidates)}개")

    _epoch = datetime(2000, 1, 1, tzinfo=timezone.utc)
    def _pub_key(c: dict):
        return _parse_published(c.get("published", "")) or _epoch

    # 점수순으로 Top 3 선정
    by_score = sorted(
        today_all,
        key=lambda c: (c.get("_total_score", 0), _pub_key(c)),
        reverse=True,
    )

    selected: list[dict] = []
    for c in by_score:
        if len(selected) >= HIGHLIGHT_COUNT:
            break
        # 미번역 기사 차단
        if c.get("display_title") == c.get("title") and c.get("lang") != "ko":
            continue
        selected.append(c)

    # 날짜 최신순 → 점수 높은순으로 정렬
    selected = sorted(
        selected,
        key=lambda c: (_pub_key(c), c.get("_total_score", 0)),
        reverse=True,
    )

    for rank, c in enumerate(selected):
        title = (c.get("display_title") or c.get("title", ""))[:40]
        src = c.get("source_key", "")
        print(f"    {rank+1}. [{c.get('_total_score', 0)}점] [{src}] {title}")

    # 하이라이트 제외 → 카테고리 분류 대상
    selected_set = set(id(c) for c in selected)
    remaining = [c for c in candidates if id(c) not in selected_set]

    return {"highlights": selected, "category_pool": remaining}


# ─── Node 5: classifier (카테고리 분류 + Top 10 선정 + 품질 검증) ───
VALID_CATEGORIES = {"model_research", "product_tools", "industry_business"}
CATEGORY_TOP_N = 10


def _classify_article(a: dict) -> str | None:
    """scorer LLM이 부여한 카테고리만 사용. 없으면 None -> LLM 배치 분류로."""
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

Classify each AI news article into exactly ONE category:

- "model_research": The article is primarily about a NEW model, research paper, benchmark, training technique, or architecture.
  Examples: "GPT-5 released", "New SOTA on MMLU", "Scaling laws paper", "Novel attention mechanism"
- "product_tools": The article is primarily about a user-facing product, tool, API, framework, or library that developers/users can use NOW.
  Examples: "Cursor adds AI code review", "LangChain 0.3 released", "ChatGPT gets memory feature"
- "industry_business": The article is primarily about money, organizations, or policy (funding, M&A, regulation, partnerships, market analysis).
  Examples: "Anthropic raises $2B", "EU AI Act takes effect", "Google restructures AI team"

Tiebreak: If an article spans two categories, pick the one closer to the CORE announcement.
  "New model released + available via API" -> model_research (the model is the news)
  "Existing product adds AI features" -> product_tools (the product is the news)

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

    # 3) 날짜 최신순 → 점수 높은순 정렬
    selected.sort(key=lambda a: (_pub_key(a), a.get("_total_score", 0)), reverse=True)
    return selected


@_safe_node("classifier")
def classifier_node(state: NewsGraphState) -> dict:
    """3개 카테고리 분류 + 당일 3개 보장 + 점수순 Top 10 + 날짜순 정렬 + 품질 검증"""
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
        print(f"    {cat}: {total}개 (당일 {today_count}) -> Top {len(categorized[cat])}개")

    # 품질 검증 (기존 quality_gate 통합)
    highlights = state.get("highlights", [])
    h_count = len(highlights)
    cat_counts = {cat: len(articles) for cat, articles in categorized.items()}
    min_cat = min(cat_counts.values()) if cat_counts else 0

    print(f"  [품질] 하이라이트 {h_count}/3, 카테고리 {cat_counts}")

    issues = []
    if h_count < 3:
        issues.append(f"하이라이트 {h_count}/3")
    if min_cat < 5:
        issues.append(f"카테고리 최소 {min_cat}/10")
    if issues:
        print(f"  [품질 경고] {', '.join(issues)}")

    return {"categorized_articles": categorized, "category_order": category_order}


# ─── Node 6: assembler ───
@_safe_node("assembler")
def assembler_node(state: NewsGraphState) -> dict:
    """한국 소스별 분리 + 최종 결과 조합 + 타이밍 리포트"""
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

    # 타이밍 리포트
    timings = state.get("node_timings", {})
    if timings:
        print(f"\n  --- 노드별 소요 시간 ---")
        total_time = 0.0
        for nname, elapsed in timings.items():
            print(f"    {nname}: {elapsed}s")
            total_time += elapsed
        print(f"    합계: {total_time:.1f}s")

    return {
        "source_articles": source_articles,
        "source_order": source_order,
        "total_count": total,
    }


# ─── 조건부 라우팅 ───
def _route_after_collector(state: NewsGraphState) -> list[Send]:
    """collector 후 라우팅:
    - 기사 있으면 en_process 와 ko_process 를 Send 로 동시 발송 (진정한 병렬)
    - 기사 없으면 assembler 직행
    """
    total = sum(len(v) for v in state.get("sources", {}).values())
    if total == 0:
        print("  [라우팅] 수집된 기사 없음 -> assembler 직행")
        return [Send("assembler", state)]

    # EN 과 KO 를 동시에 Send -- LangGraph 가 병렬 실행
    return [
        Send("en_process", state),
        Send("ko_process", state),
    ]


def _route_after_scorer(state: NewsGraphState) -> str:
    """스코어 커버리지 < 60% 이고 재시도 < 2 이면 재시도"""
    candidates = state.get("scored_candidates", [])
    retry_count = state.get("scorer_retry_count", 0)
    if not candidates:
        return "ranker"
    llm_scored = len([c for c in candidates if c.get("_llm_scored")])
    coverage = llm_scored / len(candidates)
    if coverage < 0.6 and retry_count < 2:
        print(f"  [라우팅] 스코어 커버리지 {coverage:.0%} < 60% -> 재시도")
        return "scorer"
    return "ranker"


# ─── 그래프 구성 (EN/KO 진정한 병렬 분기) ───
def _build_graph():
    graph = StateGraph(NewsGraphState)

    graph.add_node("collector", collector_node)
    graph.add_node("en_process", en_process_node)
    graph.add_node("ko_process", ko_process_node)
    graph.add_node("scorer", scorer_node)
    graph.add_node("ranker", ranker_node)
    graph.add_node("classifier", classifier_node)
    graph.add_node("assembler", assembler_node)

    graph.set_entry_point("collector")

    # collector -> Send API 로 EN/KO 병렬 분기, 또는 assembler 직행
    graph.add_conditional_edges("collector", _route_after_collector)

    # EN/KO 완료 -> scorer (둘 다 완료되어야 진행)
    graph.add_edge("en_process", "scorer")
    graph.add_edge("ko_process", "scorer")

    # scorer -> 커버리지 부족 시 재시도 루프
    graph.add_conditional_edges("scorer", _route_after_scorer, {
        "scorer": "scorer",
        "ranker": "ranker",
    })

    graph.add_edge("ranker", "classifier")
    graph.add_edge("classifier", "assembler")
    graph.add_edge("assembler", END)

    return graph.compile()


# ─── 메인 파이프라인 ───
def run_news_pipeline() -> dict:
    print("=" * 60)
    print("[START] 뉴스 수집 파이프라인 (LangGraph 7-노드, EN/KO 병렬)")
    print("=" * 60)

    app = _build_graph()
    result = app.invoke({
        "sources": {},
        "scored_candidates": [],
        "scorer_retry_count": 0,
        "category_pool": [],
        "highlights": [],
        "categorized_articles": {},
        "category_order": [],
        "source_articles": {},
        "source_order": [],
        "total_count": 0,
        "node_timings": {},
        "errors": [],
    })

    errors = result.get("errors", [])
    if errors:
        print(f"\n  [파이프라인 에러] {len(errors)}건:")
        for err in errors:
            print(f"    - {err}")

    return {
        "sources": result.get("sources", {}),
        "highlights": result.get("highlights", []),
        "categorized_articles": result.get("categorized_articles", {}),
        "category_order": result.get("category_order", []),
        "source_articles": result.get("source_articles", {}),
        "source_order": result.get("source_order", []),
        "total_count": result.get("total_count", 0),
        "errors": errors,
    }
