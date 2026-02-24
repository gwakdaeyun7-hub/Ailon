"""
뉴스 수집 파이프라인 -- LangGraph 7-노드 (EN/KO 진정한 병렬 분기)

collector --> [en_process, ko_process] (병렬 Send) --> scorer --> ranker --> classifier --> assembler
                                                        ^  |
                                                        +--+ (커버리지 < 60% 시 재시도)

1. collector:     16개 소스 수집 + 이미지/본문 통합 스크래핑 + LLM AI 필터
2. en_process:    영어 기사 번역+요약 (thinking 비활성화, 배치 5)  -- 병렬
3. ko_process:    한국어 기사 요약 (thinking 비활성화, 배치 2)     -- 병렬
4. scorer:        카테고리별 LLM 평가 (tech: nov*4+imp*3+adv*3, biz: mag*4+sig*3+brd*3, 만점 100)
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

점수 체계: 카테고리별 차등 (tech: nov*4+imp*3+adv*3, biz: mag*4+sig*3+brd*3, 만점 100)
"""

import json
import re
import time
from datetime import datetime, timedelta, timezone
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


_KST = timezone(timedelta(hours=9))


def _to_kst_date(dt: datetime) -> datetime:
    """datetime을 KST 날짜(시간 제거)로 변환"""
    return dt.astimezone(_KST).replace(hour=0, minute=0, second=0, microsecond=0)


def _is_today(article: dict) -> bool:
    """KST 기준 오늘 또는 어제 기사인지 판별"""
    pub = article.get("published", "")
    if not pub:
        return False
    dt = _parse_published(pub)
    if not dt:
        return False
    now_kst = datetime.now(_KST)
    article_date = _to_kst_date(dt)
    today_date = _to_kst_date(now_kst)
    yesterday_date = today_date - timedelta(days=1)
    return article_date >= yesterday_date


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
        task_desc = f"Translate and summarize {len(batch)} English AI news articles into Korean, and also produce English summary fields."
        title_rule = (
            "display_title: 한국 뉴스 헤드라인 스타일 제목\n"
            "  - 직역 금지. 한국 뉴스 데스크가 실제로 쓸 법한 자연스러운 제목\n"
            "  - 고유명사(회사명·제품명·모델명)는 영어 유지 (Google, OpenAI, GPT-4, Claude)\n"
            "  - 예: 'Google Releases New AI Model' -> 'Google, 새 AI 모델 전격 공개'\n"
            "  - 예: 'Anthropic Raises $2B at $60B Valuation' -> 'Anthropic, 60조 가치에 2조 원 투자 유치'\n"
            "  - 핵심 행위자 + 핵심 사건을 압축. 쉼표·능동형 서술어 활용\n"
            "  - 글자 수 제한 없음. 축약하지 말 것"
        )
        en_fields_rule = (
            "\nAlso produce these English fields:\n"
            "- display_title_en: concise English headline (news-style, not a literal back-translation)\n"
            "- one_line_en: 1-sentence English summary of what happened\n"
            "- key_points_en: 3 key facts in English (array of strings)\n"
            "- why_important_en: 1-2 sentence English explanation of impact"
        )
    else:
        task_desc = f"Summarize {len(batch)} Korean AI news articles, and also produce English summary fields."
        title_rule = "display_title: 원래 한국어 제목을 그대로 사용 (축약 금지, 원본 그대로)"
        en_fields_rule = (
            "\nAlso produce these English fields (translate the Korean summaries to English):\n"
            "- display_title_en: concise English headline for this article\n"
            "- one_line_en: 1-sentence English summary of what happened\n"
            "- key_points_en: 3 key facts in English (array of strings)\n"
            "- why_important_en: 1-2 sentence English explanation of impact"
        )

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
{en_fields_rule}

문체 규칙 (한국어 필드만 해당):
- 종결어미: ~이에요/~해요/~있어요 (해요체). ~입니다/~합니다(합쇼체) 사용 금지
- 기술 용어 영어 병기: "미세 조정(fine-tuning)", "검색 증강 생성(RAG)"

AI 용어 번역 규칙:
- AI/ML 업계에서 한국어로 그대로 음차하여 쓰는 용어는 직역하지 말고 음차 표기할 것
- agent → 에이전트 (요원 ✕), fine-tuning → 파인튜닝, token → 토큰, prompt → 프롬프트
- transformer → 트랜스포머, benchmark → 벤치마크, inference → 인퍼런스/추론, embedding → 임베딩
- hallucination → 할루시네이션, retrieval → 리트리벌, pipeline → 파이프라인, deploy → 배포/디플로이
- reasoning → 추론, alignment → 얼라인먼트, multimodal → 멀티모달, open-source → 오픈소스
- 확실하지 않으면 영어 원문을 그대로 유지할 것

Return exactly {len(batch)} items:
[{{"index":1,"display_title":"...","one_line":"...","key_points":["..."],"why_important":"...","display_title_en":"...","one_line_en":"...","key_points_en":["..."],"why_important_en":"..."}}]

Articles:
{batch_text}"""

    try:
        llm = get_llm(temperature=0.0, max_tokens=12288, thinking=False, json_mode=True)
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
            # _en 필드 추출
            if r.get("display_title_en"):
                batch[ridx]["display_title_en"] = r["display_title_en"]
            if r.get("one_line_en"):
                batch[ridx]["one_line_en"] = r["one_line_en"]
            kp_en = r.get("key_points_en", [])
            if kp_en:
                batch[ridx]["key_points_en"] = kp_en if isinstance(kp_en, list) else []
            if r.get("why_important_en"):
                batch[ridx]["why_important_en"] = r["why_important_en"]
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
            try:
                results = future.result()
            except Exception as e:
                print(f"    [WARN] {label} 배치 {idx + 1} future 실패: {e}")
                continue
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
                try:
                    results = future.result()
                except Exception as e:
                    print(f"    [WARN] {label} 개별 재시도 실패: {e}")
                    continue
                if _apply_batch_results([a], results):
                    retry_ok += 1
        print(f"  [재시도] {retry_ok}/{len(failed)}개 복구")

    # 3차: 안전망 폴백
    for a in articles:
        if not a.get("display_title"):
            a["display_title"] = a["title"]
        if not a.get("summary"):
            a["summary"] = a["description"][:300] if a.get("description") else ""
        # _en 필드 폴백
        if not a.get("display_title_en"):
            # EN 기사: 원문 title 사용, KO 기사: 빈 문자열
            a["display_title_en"] = a["title"] if a.get("lang") != "ko" else ""
        if not a.get("one_line_en"):
            a["one_line_en"] = ""
        if not a.get("key_points_en"):
            a["key_points_en"] = []
        if not a.get("why_important_en"):
            a["why_important_en"] = ""

    success = len([a for a in articles if a.get("summary") and len(a["summary"]) > 50])
    print(f"  [{label}] 최종 {success}/{len(articles)}개 완료")


# ─── LLM AI 관련성 필터 ───
def _llm_ai_filter_batch(articles: list[dict], source_key: str = "") -> set[int]:
    """기사 목록에서 AI 관련 기사 인덱스를 LLM으로 판별"""
    is_ko = source_key in SOURCE_SECTION_SOURCES
    article_text = ""
    for i, a in enumerate(articles):
        title = a.get("title", "")
        desc = (a.get("description", "") or "")[:120]
        article_text += f"\n[{i}] {title} | {desc}"

    if is_ko:
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
    else:
        prompt = f"""IMPORTANT: Output ONLY a valid JSON array of integers. No thinking, no markdown.

You are filtering news articles from international tech media. These sources already focus on tech/AI, so apply a VERY lenient filter. Include almost everything unless it is clearly unrelated to technology.

Decision rule: Ask "Could this article be even slightly interesting to someone who follows AI and tech?" If yes, include.

When in doubt, ALWAYS INCLUDE.

INCLUDE -- be very generous:
- Anything about AI, ML, LLMs, deep learning, neural networks
- Tech company news (Google, OpenAI, Meta, Microsoft, Apple, etc.)
- Software engineering, cloud, data, developer tools
- Hardware, chips, GPUs, computing infrastructure
- Tech regulation, policy, digital rights
- Startups, funding, acquisitions in tech/AI
- Science and research that could relate to AI
- Any tech product or service

EXCLUDE -- only if clearly irrelevant:
- Pure lifestyle, cooking, sports, celebrity gossip
- Non-tech politics or social issues
- Articles with zero tech or AI connection

Articles:
{article_text}

Return the indices as a JSON array:
[0, 2, 5]"""

    try:
        llm = get_llm(temperature=0.0, max_tokens=2048, thinking=False, json_mode=True)
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

    def _filter_one(key: str, articles: list[dict]) -> tuple[str, list[dict], int, int, int]:
        ai_indices = _llm_ai_filter_batch(articles, source_key=key)
        filtered = [a for i, a in enumerate(articles) if i in ai_indices]
        removed_articles = [a for i, a in enumerate(articles) if i not in ai_indices]
        removed = len(removed_articles)
        today_removed = sum(1 for a in removed_articles if _is_today(a))
        today_kept = sum(1 for a in filtered if _is_today(a))
        if removed > 0:
            msg = f"    [{key}] LLM AI 필터: {removed}개 제거 -> {len(filtered)}개"
            if today_removed > 0 or today_kept > 0:
                msg += f" (당일: {today_kept}개 남음, {today_removed}개 제거)"
            print(msg)
        return key, filtered, removed, today_removed, today_kept

    total_today_removed = 0
    total_today_kept = 0
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(_filter_one, key, articles): key for key, articles in tasks}
        for future in as_completed(futures):
            try:
                key, filtered, removed, today_removed, today_kept = future.result()
            except Exception as e:
                key = futures[future]
                print(f"    [WARN] [{key}] LLM AI 필터 future 실패: {e}")
                continue
            sources[key] = filtered
            total_removed += removed
            total_today_removed += today_removed
            total_today_kept += today_kept

    if total_removed > 0:
        msg = f"  [LLM AI 필터] 총 {total_removed}개 비AI 기사 제거"
        if total_today_removed > 0 or total_today_kept > 0:
            msg += f" (당일 기사: {total_today_kept}개 남음 / {total_today_removed}개 제거)"
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
                import traceback
                print(f"  [ERROR] {node_name} 노드 실패 ({elapsed:.1f}s): {e}")
                traceback.print_exc()
                result = {"errors": [f"{node_name}: {e}"]}
            elapsed = time.time() - t0
            # 방어: 노드가 None이나 비-dict를 반환한 경우 빈 dict로 대체
            if not isinstance(result, dict):
                print(f"  [WARN] {node_name} 노드가 dict가 아닌 {type(result).__name__}을 반환 -> 빈 dict로 대체")
                result = {"errors": [f"{node_name}: returned {type(result).__name__} instead of dict"]}
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
    # 소스별 당일 기사 수집 현황
    print("\n  ─── 소스별 당일 기사 현황 ───")
    total_today = 0
    for key, articles in sources.items():
        today_count = sum(1 for a in articles if _is_today(a))
        total_today += today_count
        print(f"    [{key}] 전체 {len(articles)}개 / 당일 {today_count}개")
    print(f"  ─── 당일 기사 합계: {total_today}개 ───\n")
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
    """display_title 유사도 기반 중복 제거. 발행일 가장 오래된(원본) 기사 유지."""
    if len(candidates) <= 1:
        return candidates

    _epoch = datetime(2000, 1, 1, tzinfo=timezone.utc)
    sorted_cands = sorted(
        candidates,
        key=lambda c: _parse_published(c.get("published", "")) or _epoch,
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
W_NOVELTY = 4       # 신규성 (model_research, product_tools)
W_IMPACT = 3        # 영향력 (model_research, product_tools)
W_ADVANCE = 3       # 실질적 발전 기여도 (model_research, product_tools)
W_MARKET = 4        # 시장 규모 (industry_business)
W_SIGNAL = 3        # 전략적 시그널 (industry_business)
W_BREADTH = 3       # 이해관계자 범위 (industry_business)
SCORER_BATCH_SIZE = 5

_SCORER_PROMPT = """Output ONLY a single-line compact JSON array with NO extra whitespace, NO newlines between items, NO markdown fences. Start directly with '[' and end with ']'.
CRITICAL: All objects on ONE line. Example: [{{"i":0,...}},{{"i":1,...}}]

You are an AI news scoring engine. First classify each article, then score using the criteria for that category. Use ONLY the provided title and description.

## Step 1: Category (pick one)
- "model_research": new model, research paper, benchmark, architecture
- "product_tools": product, tool, API, framework, library
- "industry_business": funding, M&A, regulation, strategy, market

## Step 2: Score by category (each 1-10, integers only)

### For model_research / product_tools → use nov, imp, adv

**nov (Novelty):** Is this about something NEW?
- 10: World-first capability nobody predicted (e.g., AGI-level demo, entirely new paradigm)
- 9: First announcement of major new model/architecture from top lab
- 8: New open-source release with novel results, or first paper on a new technique
- 7: Significant update to existing model/tool with meaningful new capabilities
- 6: New benchmarks or evaluations revealing unexpected findings
- 5: Expected release now official, or known method applied to new domain
- 4: Incremental version update with minor new features
- 3: Re-analysis of known results, or survey/roundup of existing work
- 2: Opinion/editorial on well-known topic, trend commentary
- 1: Pure rehash, repost, or listicle with no new information

**imp (Impact):** How much will this affect the AI field?
- 10: Paradigm shift redefining how the entire field operates (e.g., transformer-level change)
- 9: Breakthrough changing standard practice across multiple subfields
- 8: Major framework/library update adopted by most practitioners
- 7: Important advance that will influence a broad subfield's direction
- 6: Useful improvement with clear adoption path in several teams/orgs
- 5: Moderate community interest; relevant to one subfield but not beyond
- 4: Minor quality-of-life improvement for existing workflows
- 3: Niche update affecting a small research group or narrow use case
- 2: Marginal change with no measurable effect on practice
- 1: No relevance to the broader AI field

**adv (Advancement):** How much potential does this have to improve real-world life or advance research?
- 10: Transformative potential to solve a major global challenge (e.g., disease, climate, poverty)
- 9: Opens a realistic path to breakthroughs in healthcare, education, or critical infrastructure
- 8: Could significantly accelerate research progress or broadly improve daily life quality
- 7: Introduces methods/tools that meaningfully lower barriers for researchers or end-users
- 6: Plausible real-world benefits with a clear but unvalidated deployment path
- 5: Moderate potential; useful if adopted, but requires further development or integration
- 4: Narrow benefits limited to specific populations or controlled settings
- 3: Speculative improvement; unlikely without major additional breakthroughs
- 2: Purely academic interest with no foreseeable practical application path
- 1: No tangible potential to improve life or advance any research direction
Boost for: new research methodologies or paradigms that could unlock follow-on discoveries, tools accessible to non-experts that improve quality of life, healthcare/education/accessibility applications, open-source releases that democratize capability, anything that reduces cost or barrier to entry for broad populations.
Penalize for: benchmark-only gains with no deployment path, improvements only relevant at extreme scale, internal infra with no external benefit.
NOTE: Score based on POTENTIAL to improve life or research, not only proven results. A promising new method with clear applicability deserves a high score even before deployment. Do NOT double-count industry disruption (Impact) or newness (Novelty). Advancement = real-world and research progress potential only.

### For industry_business → use mag, sig, brd

**mag (Magnitude):** Scale of the event.
- 8-10: $10B+ deal, top-5 company earnings, global regulation enforcement
- 4-7: $1B+ deal, top-50 company move, national policy
- 1-3: Seed round <$20M, single hire, local/niche scope

**sig (Signal):** Does this reshape competitive landscape?
- 8-10: New market leader, paradigm regulatory shift, industry pivot
- 4-7: Strategic repositioning, major partnership
- 1-3: Routine operations, no strategic implication

**brd (Breadth):** How many stakeholders affected?
- 8-10: Entire AI ecosystem + adjacent sectors
- 4-7: Multiple segments (all startups, all chip buyers)
- 1-3: Single company or narrow niche

## Rules
- AVOID middle-ground clustering. Use the full 1-10 range.
- Score ONLY from provided text. If vague, score conservatively.

## Calibration
"Meta releases Llama 4 open-weights model with 1T parameters" → {{"i":0,"category":"model_research","nov":9,"imp":9,"adv":8}}
"DeepMind paper: new diffusion architecture beats SOTA" → {{"i":1,"category":"model_research","nov":9,"imp":8,"adv":4}}
"AI-powered sign language real-time translation app launched" → {{"i":2,"category":"product_tools","nov":5,"imp":3,"adv":9}}
"MLflow 2.16 released with improved artifact storage" → {{"i":3,"category":"product_tools","nov":3,"imp":2,"adv":2}}
"NVIDIA reports record $35B quarterly revenue" → {{"i":4,"category":"industry_business","mag":10,"sig":10,"brd":9}}
"AI startup raises $8M seed round" → {{"i":5,"category":"industry_business","mag":1,"sig":1,"brd":1}}

Articles:
{article_text}

Output exactly {count} items as a single-line compact JSON array (no pretty-printing). Use nov/imp/adv for model_research and product_tools. Use mag/sig/brd for industry_business.
[{{"i":0,"category":"model_research","nov":6,"imp":7,"adv":5}},{{"i":1,"category":"industry_business","mag":4,"sig":3,"brd":5}}]"""


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
        desc = a.get("description", "")[:200]
        article_text += f"\n[{i}] {title} | {desc}"

    prompt = _SCORER_PROMPT.format(article_text=article_text, count=len(batch))
    try:
        _scorer_throttle()  # 레이트리밋 방지
        llm = get_llm(temperature=0.0, max_tokens=4096, thinking=False, json_mode=True)
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
    if not scores:
        if len(batch) <= 1:
            return []
        mid = len(batch) // 2
        print(f"    [RETRY] 배치 분할: {len(batch)}개 -> {mid} + {len(batch) - mid}")
        left = _score_batch(batch[:mid], offset)
        right = _score_batch(batch[mid:], offset + mid)
        scores = left + right
    # 부분 성공: 누락된 기사 개별 재시도
    if 0 < len(scores) < len(batch):
        scored_indices = {s.get("_global_idx", -1) - offset for s in scores}
        missing = [(i, batch[i]) for i in range(len(batch)) if i not in scored_indices]
        if missing:
            print(f"    [RETRY] 부분 누락 {len(missing)}개 개별 재시도")
            for mi, article in missing:
                single = _score_batch([article], offset + mi)
                scores.extend(single)
    return scores


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
        unscored.sort(key=lambda a: (a.get("link", ""), a.get("title", "")))
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
                try:
                    scores = future.result()
                except Exception as e:
                    print(f"    [SCORER ERROR] 배치 {batch_idx+1} future 실패: {e}")
                    continue

                for s in scores:
                    local_idx = s.get("_global_idx", -1)
                    if 0 <= local_idx < len(unscored):
                        gi = unscored_indices[local_idx]
                        cat = s.get("category", "")
                        candidates[gi]["_llm_category"] = cat

                        # 카테고리에 따라 올바른 키가 있는지 확인 후 파싱
                        # LLM이 잘못된 키를 반환한 경우 카테고리를 키 기반으로 교정
                        has_biz_keys = any(s.get(k) is not None for k in ("mag", "sig", "brd"))
                        has_tech_keys = any(s.get(k) is not None for k in ("nov", "imp", "adv"))

                        if cat == "industry_business" and not has_biz_keys and has_tech_keys:
                            # LLM이 biz 카테고리인데 tech 키를 반환 -> tech로 교정
                            cat = "product_tools"
                            candidates[gi]["_llm_category"] = cat
                        elif cat != "industry_business" and has_biz_keys and not has_tech_keys:
                            # LLM이 tech 카테고리인데 biz 키를 반환 -> biz로 교정
                            cat = "industry_business"
                            candidates[gi]["_llm_category"] = cat

                        if cat == "industry_business":
                            mag = min(10, max(1, s.get("mag", 5)))
                            sig = min(10, max(1, s.get("sig", 5)))
                            brd = min(10, max(1, s.get("brd", 5)))
                            candidates[gi]["_score_market"] = mag
                            candidates[gi]["_score_signal"] = sig
                            candidates[gi]["_score_breadth"] = brd
                            candidates[gi]["_score_novelty"] = 0
                            candidates[gi]["_score_impact"] = 0
                            candidates[gi]["_score_advance"] = 0
                            candidates[gi]["_total_score"] = (
                                mag * W_MARKET + sig * W_SIGNAL + brd * W_BREADTH
                            )
                        else:
                            novelty = min(10, max(1, s.get("nov", 5)))
                            impact = min(10, max(1, s.get("imp", 5)))
                            advance = min(10, max(1, s.get("adv", 5)))
                            candidates[gi]["_score_novelty"] = novelty
                            candidates[gi]["_score_impact"] = impact
                            candidates[gi]["_score_advance"] = advance
                            candidates[gi]["_score_market"] = 0
                            candidates[gi]["_score_signal"] = 0
                            candidates[gi]["_score_breadth"] = 0
                            candidates[gi]["_total_score"] = (
                                novelty * W_NOVELTY
                                + impact * W_IMPACT
                                + advance * W_ADVANCE
                            )
                        candidates[gi]["_llm_scored"] = True

                scored = len([c for c in batch if c.get("_llm_scored")])
                print(f"    배치 {batch_idx+1}/{len(batches)}: {scored}/{len(batch)}개")

    # 폴백: 미평가 기사에 낮은 기본 점수 (LLM 평가 기사 우선)
    # 카테고리 무관하게 tech 기본 점수 사용 (총점 동일: 3*4+3*3+3*3 = 30)
    for c in candidates:
        if "_total_score" not in c:
            c["_score_novelty"] = 3
            c["_score_impact"] = 3
            c["_score_advance"] = 3
            c["_score_market"] = 0
            c["_score_signal"] = 0
            c["_score_breadth"] = 0
            c["_llm_category"] = ""
            c["_total_score"] = 3 * W_NOVELTY + 3 * W_IMPACT + 3 * W_ADVANCE

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

    # 하이라이트: model_research + product_tools 카테고리의 당일(어제+오늘) 기사만
    HIGHLIGHT_CATEGORIES = {"model_research", "product_tools"}
    today_all = [
        c for c in candidates
        if c.get("_is_today") and c.get("_llm_category", "") in HIGHLIGHT_CATEGORIES
    ]
    today_total = sum(1 for c in candidates if c.get("_is_today"))
    print(f"  [랭킹] 당일 기사 {today_total}개 중 하이라이트 후보 {len(today_all)}개 (model_research + product_tools)")

    _epoch = datetime(2000, 1, 1, tzinfo=_KST)
    def _day_key(c: dict):
        dt = _parse_published(c.get("published", "")) or _epoch
        return _to_kst_date(dt)
    def _time_key(c: dict):
        return _parse_published(c.get("published", "")) or _epoch

    # 점수순으로 Top 3 선정
    by_score = sorted(
        today_all,
        key=lambda c: (c.get("_total_score", 0), _time_key(c)),
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

    # 날짜(일) 최신순 → 같은 날짜+점수 같으면 시간 최신순
    selected = sorted(
        selected,
        key=lambda c: (_day_key(c), c.get("_total_score", 0), _time_key(c)),
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
CATEGORY_TOP_N = 25


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
        llm = get_llm(temperature=0.0, max_tokens=1024, thinking=False, json_mode=True)
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
                # 점수 키 기반 카테고리 추론
                has_tech = any(a.get(k) for k in ("_score_novelty", "_score_impact", "_score_advance"))
                has_biz = any(a.get(k) for k in ("_score_market", "_score_signal", "_score_breadth"))
                if has_tech and not has_biz:
                    categorized.get("product_tools", categorized.get("industry_business", [])).append(a)
                else:
                    categorized["industry_business"].append(a)
    except Exception:
        for a in articles:
            categorized["industry_business"].append(a)


def _select_category_top_n(articles: list[dict], n: int = CATEGORY_TOP_N, today_min: int = 3) -> list[dict]:
    """당일 기사 today_min개 보장 + 나머지 점수순 채움 + 날짜(일) 최신순 정렬"""
    _epoch = datetime(2000, 1, 1, tzinfo=_KST)
    def _day_key(a: dict):
        dt = _parse_published(a.get("published", "")) or _epoch
        return _to_kst_date(dt)
    def _time_key(a: dict):
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

    # 3) 날짜(일) 최신순 → 같은 날짜+점수 같으면 시간 최신순
    selected.sort(key=lambda a: (_day_key(a), a.get("_total_score", 0), _time_key(a)), reverse=True)
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
    """소스별 섹션 분리 (한국 + 영어 섹션) + 최종 결과 조합 + 타이밍 리포트"""
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
    print(f"  소스별 섹션: {sum(len(v) for v in source_articles.values())}개")

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
    if coverage < 0.9 and retry_count < 2:
        print(f"  [라우팅] 스코어 커버리지 {coverage:.0%} < 90% -> 재시도")
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
