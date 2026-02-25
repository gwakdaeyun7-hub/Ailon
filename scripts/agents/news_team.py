"""
뉴스 수집 파이프라인 -- LangGraph 7-노드 (EN/KO 진정한 병렬 분기)

collector --> [en_process, ko_process] (병렬 Send) --> categorizer --> scorer --> selector --> assembler
                                                                       ^  |
                                                                       +--+ (커버리지 < 90% 시 재시도)

1. collector:     16개 소스 수집 + 이미지/본문 통합 스크래핑 + LLM AI 필터
2. en_process:    영어 기사 번역+요약 (thinking 비활성화, 배치 5)  -- 병렬
3. ko_process:    한국어 기사 요약 (thinking 비활성화, 배치 2)     -- 병렬
4. categorizer:   LLM 카테고리 분류 (research / models_products / industry_business)
5. scorer:        카테고리별 LLM 평가 (research: rig*4+nov*3+pot*3, models_products: uti*4+imp*3+acc*3, industry_business: mag*4+sig*3+brd*3, 만점 100)
6. selector:      하이라이트 Top 3 + 카테고리별 Top 25 + 품질 검증 (기존 ranker+classifier 통합)
7. assembler:     한국 소스별 분리 + 최종 결과 + 타이밍 리포트

개선 사항:
- EN/KO Send API 병렬 실행 (순차 -> 병렬, ~2x 속도 개선)
- 노드별 에러 핸들링 (한 노드 실패 시 파이프라인 전체 중단 방지)
- 불필요한 state 필드 제거 (en_done, ko_done, quality_retry, category_pool)
- quality_gate 를 selector 에 통합 (실효 없는 노드 제거)
- ranker + classifier 를 selector 로 통합 (둘 다 정렬/필터링만 수행, LLM 호출 없음)
- 노드별 소요 시간 측정
- sources Annotated 리듀서로 EN/KO 결과 안전 머지

점수 체계: 카테고리별 차등 (research: rig*4+nov*3+pot*3, models_products: uti*4+imp*3+acc*3, industry_business: mag*4+sig*3+brd*3, 만점 100)
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
    text = re.sub(r'```(?:json)?\s*\n?', '', text)
    text = re.sub(r'\n?```\s*', '', text)
    # Gemini bold/italic 마크다운 제거 (***text***, **text**, *text*)
    text = re.sub(r'\*{1,3}', '', text)
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


# ─── Node 4: categorizer (카테고리 분류) + Node 5: scorer (3 LLM차원, 병렬 배치) ───
# research 가중치
W_RIGOR = 4         # 엄밀성 (research)
W_NOVELTY = 3       # 방법론 새로움 (research)
W_POTENTIAL = 3     # 잠재력 (research)
# models_products 가중치
W_UTILITY = 4       # 실용성 (models_products)
W_IMPACT = 3        # 생태계 영향 (models_products)
W_ACCESS = 3        # 접근성 (models_products)
# industry_business 가중치
W_MARKET = 4        # 시장 규모 (industry_business)
W_SIGNAL = 3        # 전략적 시그널 (industry_business)
W_BREADTH = 3       # 이해관계자 범위 (industry_business)
SCORER_BATCH_SIZE = 1
VALID_CATEGORIES = {"research", "models_products", "industry_business"}

# --- 분류 전용 프롬프트 (classification only) ---

# ── OLD Decision Tree prompt (v1) ── kept for reference ──────────────────
# _CLASSIFY_PROMPT = """Output ONLY a JSON array. No markdown, no explanation. Start with '['.
#
# Classify each article into exactly ONE category: research, models_products, industry_business.
#
# ## Decision tree (follow top-to-bottom, stop at first match)
#
# 1. Is the article primarily about MONEY, DEALS, CORPORATE STRATEGY, REGULATION, or MARKET DYNAMICS?
#    → industry_business
#    Signal words: raises/funding/투자/인수/M&A, revenue/earnings/실적, IPO, regulation/규제,
#    partnership/제휴, layoffs/해고, exec hire, market entry/시장 진출, acquisition/인수합병,
#    valuation/기업가치, antitrust/독점, event/conference ticket/행사
#
# 2. Does the article describe something a user can USE, DOWNLOAD, or ACCESS right now (or imminently)?
#    → models_products
#    Signal words: releases/출시/공개, launches/런칭, open-source/오픈소스, API available, download,
#    update/업데이트, new feature/신기능, SDK, framework, app, tool, platform, weights released
#
# 3. Everything else (papers, benchmarks, theory, algorithms without released artifact)
#    → research
#    Signal words: paper/논문, study/연구, benchmark, SOTA, architecture proposed, scaling law,
#    survey, dataset (academic), novel method, theoretical
#
# ## Contrast examples (title → category, WHY)
# "OpenAI, GPT-5.2로 입자 물리학 난제 해결" → research
# "Guide Labs, Steerling-8B 오픈소스 공개" → models_products
# "ByteDance AI, Long CoT 연구 발표" → research
# "OpenAI와 Jony Ive, 하드웨어 시장 진출" → industry_business
# "TechCrunch Disrupt 2026 티켓" → industry_business
# ...
#
# ## Tiebreak rules
# 1. Company name does NOT determine category.
# 2. "Company X uses AI to solve Y" → research
# 3. Paper + code release → models_products
# 4. Paper only → research
# ...
# """
# ── END OLD prompt ────────────────────────────────────────────────────────

_CLASSIFY_PROMPT = """Output ONLY a JSON array. No markdown, no explanation. Start with '['.

Classify each article into exactly ONE category. Apply tests top-to-bottom; first YES wins.

## Test 1: research (가장 좁음 — 순수 학술/과학만)
Is this about a SCIENTIFIC PAPER, RESEARCH FINDING, BENCHMARK RESULT, or ALGORITHMIC DISCOVERY?
YES conditions (ALL must apply):
- 핵심이 논문/연구/실험/벤치마크/과학적 발견임
- 사용자가 다운로드/사용할 수 있는 제품이 아님
- 비즈니스 거래/전략/규제 이야기가 아님
Signal: 논문, 연구, 발견, 벤치마크, SOTA, scaling law, 방법론, 실험 결과, 알고리즘 제안

## Test 2: models_products (두 번째로 좁음 — 출시/공개/업데이트만)
Is this about a NEW MODEL, PRODUCT, FEATURE, or TOOL that users can USE/DOWNLOAD/ACCESS?
YES conditions (ANY one suffices):
- 새 모델/앱/서비스/플랫폼/도구가 출시·공개·릴리스됨
- 기존 제품에 기능 업데이트·API 추가됨
- 오픈소스 웨이트/코드가 공개됨
Signal: 출시, 공개, 릴리스, 오픈소스, 업데이트, 배포, API, SDK, 서비스, 플랫폼

## Test 3: industry_business (나머지 전부 — catch-all)
위 두 카테고리에 해당하지 않으면 무조건 industry_business.
투자, M&A, 규제, 소송, 인사, 시장 분석, 파트너십, 전략, 보안, 행사, 가십 등 전부 포함.

## 경계 판단 규칙
- 논문 + 코드/모델 동시 공개 → models_products (사용 가능한 것이 있으면 models_products)
- 논문만, 제품 없음 → research
- 연구 결과지만 기업 전략/투자 맥락 → industry_business
- "연구 촉구/우려 제기" → 실제 논문이면 research, 아니면 industry_business
- 성능 비교/벤치마크 → 학술 실험이면 research, 제품 홍보면 models_products
- 회사명만으로 판단하지 말 것. 핵심 ACTION으로 판단.
- CEO/COO/CTO 등 경영진 발언·분석·의견 → industry_business
- 인덱스/지표/리포트 발표 → industry_business (논문이 아니면 research 아님)

## Examples

research:
"OpenAI, GPT-5.2로 입자 물리학 난제 해결" → research (과학 문제 해결)
"ByteDance AI, Long CoT 연구 발표" → research (연구 논문)
"Google DeepMind, 챗봇의 도덕적 행동 진정성 연구 촉구" → research (학술 연구)
"MIT, 트랜스포머 대체할 새로운 아키텍처 논문 발표" → research (논문)
"Anthropic, 대규모 언어 모델 환각 현상 분석 논문 공개" → research (논문/연구 결과)

models_products:
"Alibaba Qwen 팀, Qwen 3.5 미디엄 모델 시리즈 공개" → models_products (모델 공개)
"Inception Labs, 확산 기반 언어 추론 모델 'Mercury 2' 공개" → models_products (모델 공개)
"Anthropic, Claude Cowork 업데이트로 기업 업무 자동화 확장" → models_products (제품 업데이트)
"Nimble, 기업용 '에이전트 검색 플랫폼' 출시" → models_products (플랫폼 출시)
"Google, Gemma 3n 오픈소스 웨이트 공개" → models_products (오픈소스 릴리스)
"Google Chrome, Auto Browse 에이전트 테스트 결과 공개" → models_products (제품 기능 공개)

industry_business:
"Meta, AMD와 수십억 달러 규모 칩 계약 체결" → industry_business (거래)
"Canva, 애니메이션 'Cavalry'·마케팅 AI 'MangoAI' 동시 인수" → industry_business (M&A)
"OpenAI, xAI의 영업 비밀 침해 소송 기각 결정 받아 승소" → industry_business (소송)
"Deepseek, 美 수출 금지에도 Nvidia Blackwell 칩으로 AI 모델 훈련" → industry_business (규제)
"Anthropic, 중국 AI 기업들의 Claude 무단 활용 의혹 제기" → industry_business (의혹/전략)
"Sam Altman, AI 안전 정책 방향성 발표" → industry_business (전략/정책)
"AI 스타트업 투자 2026년 상반기 200억 돌파" → industry_business (시장 분석)
"OpenAI COO, 'AI, 아직 기업에 침투 못 해'" → industry_business (경영진 발언/시장 분석)
"Anthropic, 'AI Fluency Index' 발표" → industry_business (인덱스/리포트 = 시장 분석)

Articles:
{article_text}

Output exactly {count} JSON object(s):
[{{"i":0,"cat":"<category>"}}]"""

# --- 스코어링 전용 프롬프트 (scoring only, category pre-assigned) ---
_SCORE_PROMPT = """Output ONLY a single-line compact JSON array. No markdown, no explanation. Start with '['.

Score each article on its ASSIGNED category dimensions (1-10 integers). Use ONLY the provided text. If vague, score conservatively. Use the FULL 1-10 range; avoid clustering around 5-6.

{scoring_rubric}

## Calibration
{calibration_examples}

Articles:
{article_text}

Output exactly {count} JSON object(s) as a single-line compact JSON array:
{output_example}"""

# --- 카테고리별 스코어링 루브릭 ---
_RUBRIC_RESEARCH = """### Category: research → score rig, nov, pot (each 0-10)
- rig (Rigor): 연구가 얼마나 엄밀한가. 0=근거없음, 5=보통수준, 10=완벽한실험설계·다중검증
- nov (Novelty): 방법론이 얼마나 새로운가. 0=기존반복, 5=의미있는변형, 10=완전히새로운패러다임. 방법론 자체의 새로움만 평가(SOTA 달성≠높은nov)
- pot (Potential): 미래 연구에 얼마나 영향을 줄 수 있는가. 0=영향없음, 5=후속연구가능, 10=새연구분야개척"""

_RUBRIC_MODELS_PRODUCTS = """### Category: models_products → score uti, imp, acc (each 0-10)
- uti (Utility): 사용자에게 얼마나 유용한가. 0=쓸모없음, 5=특정작업에유용, 10=모든사용자필수도구
- imp (Impact): AI 생태계에 얼마나 영향을 주는가. 0=영향없음, 5=한분야에영향, 10=업계표준변경
- acc (Accessibility): 얼마나 쉽게 접근/사용할 수 있는가. 0=접근불가, 5=유료API, 10=무료오픈소스·즉시사용가능"""

_RUBRIC_INDUSTRY_BUSINESS = """### Category: industry_business → score mag, sig, brd (each 0-10)
- mag (Magnitude): 이벤트 규모가 얼마나 큰가. 0=사소, 3=$5-20M, 5=$100-500M, 7=$1-5B, 10=$50B+거래. 가십/비금전이벤트는 mag<=2
- sig (Signal): 전략적으로 얼마나 중요한 신호인가. 0=의미없음, 5=트렌드시사, 10=시장판도변경
- brd (Breadth): 얼마나 많은 이해관계자에게 영향을 주는가. 0=내부만, 5=특정분야, 10=전세계산업"""

# 카테고리 → 루브릭 매핑
_RUBRIC_MAP = {
    "research": _RUBRIC_RESEARCH,
    "models_products": _RUBRIC_MODELS_PRODUCTS,
    "industry_business": _RUBRIC_INDUSTRY_BUSINESS,
}

# 카테고리별 캘리브레이션 예시
_CALIBRATION_MAP = {
    "research": (
        '"DeepMind paper: new diffusion architecture beats SOTA on 5 benchmarks" → {{"i":0,"rig":8,"nov":8,"pot":7}}\n'
        '"Survey paper comparing 30 LLMs on reasoning tasks" → {{"i":1,"rig":7,"nov":2,"pot":3}}'
    ),
    "models_products": (
        '"Meta releases Llama 4 open-weights model with 1T parameters" → {{"i":0,"uti":9,"imp":9,"acc":9}}\n'
        '"ChatGPT gets memory feature for persistent context" → {{"i":1,"uti":7,"imp":6,"acc":8}}\n'
        '"MLflow 2.16 released with improved artifact storage" → {{"i":2,"uti":4,"imp":2,"acc":8}}'
    ),
    "industry_business": (
        '"NVIDIA reports record $35B quarterly revenue" → {{"i":0,"mag":9,"sig":9,"brd":9}}\n'
        '"AI startup raises $8M seed round" → {{"i":1,"mag":2,"sig":2,"brd":1}}\n'
        '"Two CEOs awkward moment / executive social interaction at conference" → {{"i":2,"mag":1,"sig":2,"brd":2}}'
    ),
}

# 카테고리별 출력 예시 (배치 1 기준)
_OUTPUT_EXAMPLE_MAP = {
    "research": '[{{"i":0,"rig":7,"nov":6,"pot":5}}]',
    "models_products": '[{{"i":0,"uti":8,"imp":7,"acc":6}}]',
    "industry_business": '[{{"i":0,"mag":4,"sig":3,"brd":5}}]',
}


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


CLASSIFY_BATCH_SIZE = 1


def _classify_batch(batch: list[dict], offset: int) -> list[dict]:
    """분류 전용 LLM 호출. 각 기사의 카테고리를 결정하여 반환.

    Returns list of dicts with keys: _global_idx, cat
    """
    article_text = ""
    for i, a in enumerate(batch):
        title = a.get("display_title") or a.get("title", "")
        body = a.get("body", "")
        context = body[:500] if body else (a.get("description", "") or "")[:200]
        article_text += f"\n[{i}] {title} | {context}"

    prompt = _CLASSIFY_PROMPT.format(article_text=article_text, count=len(batch))
    try:
        _scorer_throttle()
        llm = get_llm(temperature=0.0, max_tokens=2048, thinking=False, json_mode=True)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=2)
        results = _parse_llm_json(content)
        if not isinstance(results, list):
            results = next((v for v in results.values() if isinstance(v, list)), [])

        if not results:
            preview = str(content)[:150] if content else "EMPTY"
            print(f"    [CLASSIFY 빈 응답] offset={offset}, size={len(batch)}, raw={preview}")
            return []

        valid = []
        for r in results:
            if not isinstance(r, dict):
                continue
            raw_idx = r.get("i", r.get("index", -1))
            try:
                idx = int(raw_idx)
            except (ValueError, TypeError):
                continue
            cat = r.get("cat", "")
            if 0 <= idx < len(batch) and cat in VALID_CATEGORIES:
                valid.append({"_global_idx": offset + idx, "cat": cat})

        # 폴백 + 진단용: dict만 추출
        dicts_only = [r for r in results if isinstance(r, dict)]

        # 폴백: "i" 필드 없지만 개수가 맞으면 순서대로 매핑
        if not valid:
            if len(dicts_only) == len(batch):
                print(f"    [CLASSIFY 폴백] i값 없음 → 순서 매핑 (offset={offset}, {len(batch)}개)")
                for idx, r in enumerate(dicts_only):
                    cat = r.get("cat", "")
                    if cat in VALID_CATEGORIES:
                        valid.append({"_global_idx": offset + idx, "cat": cat})

        if len(valid) < len(batch):
            print(f"    [CLASSIFY 진단] offset={offset}, 요청={len(batch)}개, 유효={len(valid)}개")
            valid_indices = {r["_global_idx"] - offset for r in valid}
            for idx, r in enumerate(dicts_only):
                if idx not in valid_indices:
                    raw_i = r.get("i", r.get("index", "MISSING"))
                    raw_cat = r.get("cat", "MISSING")
                    print(f"      [무효] i={raw_i}, cat={raw_cat} (범위: 0~{len(batch)-1})")
        return valid
    except Exception as e:
        print(f"    [CLASSIFY ERROR] 배치 offset={offset}, size={len(batch)}: {type(e).__name__}: {e}")
        return []


def _classify_batch_with_retry(batch: list[dict], offset: int) -> list[dict]:
    """분류 배치 재시도: 실패 시 배치 분할."""
    results = _classify_batch(batch, offset)
    if not results:
        if len(batch) <= 1:
            return []
        mid = len(batch) // 2
        print(f"    [CLASSIFY RETRY] 배치 분할: {len(batch)}개 -> {mid} + {len(batch) - mid}")
        left = _classify_batch(batch[:mid], offset)
        right = _classify_batch(batch[mid:], offset + mid)
        results = left + right
    # 부분 누락 개별 재시도
    if 0 < len(results) < len(batch):
        classified_offsets = {r["_global_idx"] for r in results}
        missing = [(i, batch[i]) for i in range(len(batch)) if (offset + i) not in classified_offsets]
        if missing:
            print(f"    [CLASSIFY RETRY] 부분 누락 {len(missing)}개 개별 재시도")
            for mi, article in missing:
                title = (article.get("display_title") or article.get("title", ""))[:40]
                single = _classify_batch([article], offset + mi)
                results.extend(single)
                if single:
                    print(f"      [복구] idx={offset+mi} cat={single[0].get('cat','?')} | {title}")
                else:
                    print(f"      [실패] idx={offset+mi} | {title}")
    return results


def _score_batch(batch: list[dict], offset: int, category: str = "") -> list[dict]:
    """스코어링 전용 LLM 호출. 카테고리가 확정된 기사 배치를 받아 점수만 반환.

    Args:
        batch: 기사 리스트 (모두 같은 카테고리)
        offset: 글로벌 인덱스 오프셋
        category: 확정된 카테고리 (research / models_products / industry_business)
    """
    if not category:
        print(f"    [SCORER ERROR] category 미지정, offset={offset}")
        return []

    scoring_rubric = _RUBRIC_MAP.get(category, _RUBRIC_MAP["models_products"])
    calibration_examples = _CALIBRATION_MAP.get(category, _CALIBRATION_MAP["models_products"])
    output_example = _OUTPUT_EXAMPLE_MAP.get(category, _OUTPUT_EXAMPLE_MAP["models_products"])

    article_text = ""
    for i, a in enumerate(batch):
        title = a.get("display_title") or a.get("title", "")
        body = a.get("body", "")
        context = body[:500] if body else a.get("description", "")[:200]
        article_text += f"\n[{i}] {title} | {context}"

    prompt = _SCORE_PROMPT.format(
        scoring_rubric=scoring_rubric,
        calibration_examples=calibration_examples,
        article_text=article_text,
        count=len(batch),
        output_example=output_example,
    )
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
            print(f"    [SCORER 빈 응답] offset={offset}, cat={category}, size={len(batch)}, raw={preview}")
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
            print(f"    [SCORER 진단] offset={offset}, cat={category}, 요청={len(batch)}개, 파싱={len(scores)}개, 유효={len(valid)}개, i값={raw_indices}")
        return valid
    except Exception as e:
        print(f"    [SCORER ERROR] 배치 offset={offset}, cat={category}, size={len(batch)}: {type(e).__name__}: {e}")
        return []


def _score_batch_with_retry(batch: list[dict], offset: int, category: str = "") -> list[dict]:
    """스코어링 배치 재시도: 실패 시 배치 분할."""
    scores = _score_batch(batch, offset, category)
    if not scores:
        if len(batch) <= 1:
            return []
        mid = len(batch) // 2
        print(f"    [RETRY] 배치 분할: {len(batch)}개 -> {mid} + {len(batch) - mid}")
        left = _score_batch(batch[:mid], offset, category)
        right = _score_batch(batch[mid:], offset + mid, category)
        scores = left + right
    # 부분 성공: 누락된 기사 개별 재시도
    if 0 < len(scores) < len(batch):
        scored_indices = {s.get("_global_idx", -1) - offset for s in scores}
        missing = [(i, batch[i]) for i in range(len(batch)) if i not in scored_indices]
        if missing:
            print(f"    [RETRY] 부분 누락 {len(missing)}개 개별 재시도")
            for mi, article in missing:
                single = _score_batch([article], offset + mi, category)
                scores.extend(single)
    return scores


def _apply_scores_to_candidate(candidate: dict, score_dict: dict, category: str) -> None:
    """스코어링 결과를 기사 dict에 적용. 카테고리에 맞는 점수만 설정."""
    # 모든 점수 필드 초기화
    candidate["_score_rigor"] = 0
    candidate["_score_novelty"] = 0
    candidate["_score_potential"] = 0
    candidate["_score_utility"] = 0
    candidate["_score_impact"] = 0
    candidate["_score_access"] = 0
    candidate["_score_market"] = 0
    candidate["_score_signal"] = 0
    candidate["_score_breadth"] = 0

    if category == "industry_business":
        mag = min(10, max(1, score_dict.get("mag", 5)))
        sig = min(10, max(1, score_dict.get("sig", 5)))
        brd = min(10, max(1, score_dict.get("brd", 5)))
        candidate["_score_market"] = mag
        candidate["_score_signal"] = sig
        candidate["_score_breadth"] = brd
        candidate["_total_score"] = mag * W_MARKET + sig * W_SIGNAL + brd * W_BREADTH
    elif category == "research":
        rigor = min(10, max(1, score_dict.get("rig", 5)))
        novelty = min(10, max(1, score_dict.get("nov", 5)))
        potential = min(10, max(1, score_dict.get("pot", 5)))
        candidate["_score_rigor"] = rigor
        candidate["_score_novelty"] = novelty
        candidate["_score_potential"] = potential
        candidate["_total_score"] = rigor * W_RIGOR + novelty * W_NOVELTY + potential * W_POTENTIAL
    else:  # models_products
        utility = min(10, max(1, score_dict.get("uti", 5)))
        impact = min(10, max(1, score_dict.get("imp", 5)))
        access = min(10, max(1, score_dict.get("acc", 5)))
        candidate["_score_utility"] = utility
        candidate["_score_impact"] = impact
        candidate["_score_access"] = access
        candidate["_total_score"] = utility * W_UTILITY + impact * W_IMPACT + access * W_ACCESS
    candidate["_llm_scored"] = True

    if candidate.get("_total_score", 0) >= 90:
        title = (candidate.get("display_title") or candidate.get("title", ""))[:40]
        print(f"    [HIGH SCORE 진단] cat={category}, score={candidate['_total_score']}, raw={score_dict} | {title}")


@_safe_node("categorizer")
def categorizer_node(state: NewsGraphState) -> dict:
    """카테고리 분류 노드.

    Step 1: 후보 수집 + 중복 제거 + 당일 판별
    Step 2: _classify_batch_with_retry로 카테고리 분류 (병렬)
    Step 3: 미분류 기사에 기본 카테고리(industry_business) 부여
    """
    candidates: list[dict] = []
    for key in CATEGORY_SOURCES:
        for a in state["sources"].get(key, []):
            candidates.append(a)

    if not candidates:
        return {"scored_candidates": [], "scorer_retry_count": 0}

    candidates = _deduplicate_candidates(candidates)

    today_count = 0
    for c in candidates:
        c["_is_today"] = _is_today(c)
        if c["_is_today"]:
            today_count += 1
    print(f"  [분류] {len(candidates)}개 분류 중... (당일 {today_count}개)")

    # 분류 대상: _llm_category가 없는 기사
    need_classify = [(i, a) for i, a in enumerate(candidates) if not a.get("_llm_category")]
    already_classified = sum(1 for a in candidates if a.get("_llm_category"))
    if already_classified:
        print(f"    [분류] {already_classified}개 이미 분류됨, {len(need_classify)}개 분류 필요")

    if need_classify:
        # 정렬: 일관된 배치 구성
        need_classify.sort(key=lambda x: (x[1].get("link", ""), x[1].get("title", "")))
        classify_articles = [a for _, a in need_classify]
        classify_offsets = [i for i, _ in need_classify]
        cls_batch_size = CLASSIFY_BATCH_SIZE
        cls_batches = [classify_articles[i:i + cls_batch_size] for i in range(0, len(classify_articles), cls_batch_size)]
        print(f"    [분류] {len(classify_articles)}개 → {len(cls_batches)}개 배치 (배치 크기 {cls_batch_size})")

        with ThreadPoolExecutor(max_workers=3) as executor:
            future_to_cls = {
                executor.submit(_classify_batch_with_retry, batch, idx * cls_batch_size): (batch, idx)
                for idx, batch in enumerate(cls_batches)
            }
            cls_results: list[dict] = []
            for future in as_completed(future_to_cls):
                batch, batch_idx = future_to_cls[future]
                try:
                    results = future.result()
                    cls_results.extend(results)
                except Exception as e:
                    print(f"    [CLASSIFY ERROR] 배치 {batch_idx+1} future 실패: {e}")

            # 분류 결과를 기사에 적용
            for r in cls_results:
                local_idx = r["_global_idx"]
                if 0 <= local_idx < len(classify_articles):
                    original_idx = classify_offsets[local_idx]
                    candidates[original_idx]["_llm_category"] = r["cat"]

        classified = sum(1 for a in candidates if a.get("_llm_category"))
        print(f"    [분류] 완료: {classified}/{len(candidates)}개 분류됨")

    # 미분류 기사에 기본 카테고리 부여
    for a in candidates:
        if not a.get("_llm_category") or a["_llm_category"] not in VALID_CATEGORIES:
            a["_llm_category"] = "industry_business"

    # 카테고리별 그룹 통계
    for cat in VALID_CATEGORIES:
        count = sum(1 for a in candidates if a.get("_llm_category") == cat)
        print(f"    [그룹] {cat}: {count}개")

    return {"scored_candidates": candidates, "scorer_retry_count": 0}


@_safe_node("scorer")
def scorer_node(state: NewsGraphState) -> dict:
    """카테고리별 LLM 스코어링.

    categorizer_node에서 _llm_category가 설정된 기사를 받아
    카테고리별 그룹화 후 _score_batch로 점수만 부여한다.
    """
    retry_count = state.get("scorer_retry_count", 0)
    candidates = state.get("scored_candidates", [])

    if not candidates:
        return {"scored_candidates": [], "scorer_retry_count": retry_count + 1}

    if retry_count > 0:
        for c in candidates:
            if not c.get("_llm_scored"):
                c.pop("_total_score", None)

    unscored_indices = [i for i, c in enumerate(candidates) if not c.get("_llm_scored")]
    unscored = [candidates[i] for i in unscored_indices]

    print(f"  [스코어링] {len(unscored)}/{len(candidates)}개 평가 중...")

    if unscored:
        unscored.sort(key=lambda a: (a.get("link", ""), a.get("title", "")))

        # 카테고리별 그룹화
        cat_groups: dict[str, list[tuple[int, dict]]] = {cat: [] for cat in VALID_CATEGORIES}
        for i, a in enumerate(unscored):
            cat = a.get("_llm_category", "industry_business")
            cat_groups[cat].append((i, a))

        for cat, group in cat_groups.items():
            print(f"    [그룹] {cat}: {len(group)}개")

        # 카테고리별 스코어링 (병렬 배치)
        batch_size = SCORER_BATCH_SIZE if retry_count == 0 else max(1, SCORER_BATCH_SIZE // 2)

        # 모든 카테고리의 배치를 평탄화하여 병렬 제출
        all_score_tasks: list[tuple[list[dict], list[int], int, str]] = []  # (batch_articles, batch_local_indices, offset, category)
        for cat, group in cat_groups.items():
            if not group:
                continue
            group_articles = [a for _, a in group]
            group_local_indices = [i for i, _ in group]
            for b_start in range(0, len(group_articles), batch_size):
                b_articles = group_articles[b_start:b_start + batch_size]
                b_indices = group_local_indices[b_start:b_start + batch_size]
                all_score_tasks.append((b_articles, b_indices, b_start, cat))

        print(f"    [스코어링] {len(all_score_tasks)}개 배치 병렬 실행")

        with ThreadPoolExecutor(max_workers=3) as executor:
            future_to_score = {
                executor.submit(_score_batch_with_retry, task[0], task[2], task[3]): task
                for task in all_score_tasks
            }
            batch_done = 0
            for future in as_completed(future_to_score):
                task = future_to_score[future]
                b_articles, b_indices, b_offset, cat = task
                batch_done += 1
                try:
                    scores = future.result()
                except Exception as e:
                    print(f"    [SCORER ERROR] {cat} 배치 future 실패: {e}")
                    continue

                applied = 0
                for s in scores:
                    global_idx = s.get("_global_idx", -1)
                    batch_local = global_idx - b_offset
                    if 0 <= batch_local < len(b_articles):
                        unscored_local = b_indices[batch_local]
                        gi = unscored_indices[unscored_local]
                        _apply_scores_to_candidate(candidates[gi], s, cat)
                        applied += 1

                print(f"    스코어 배치 {batch_done}/{len(all_score_tasks)} ({cat}): {applied}/{len(b_articles)}개")

    # 폴백: 미평가 기사에 카테고리별 낮은 기본 점수 (LLM 평가 기사 우선)
    for c in candidates:
        if "_total_score" not in c:
            cat = c.get("_llm_category", "industry_business")
            c["_score_rigor"] = 0
            c["_score_novelty"] = 0
            c["_score_potential"] = 0
            c["_score_utility"] = 0
            c["_score_impact"] = 0
            c["_score_access"] = 0
            c["_score_market"] = 0
            c["_score_signal"] = 0
            c["_score_breadth"] = 0
            if cat == "research":
                c["_score_rigor"] = 3
                c["_score_novelty"] = 3
                c["_score_potential"] = 3
                c["_total_score"] = 3 * W_RIGOR + 3 * W_NOVELTY + 3 * W_POTENTIAL
            elif cat == "models_products":
                c["_score_utility"] = 3
                c["_score_impact"] = 3
                c["_score_access"] = 3
                c["_total_score"] = 3 * W_UTILITY + 3 * W_IMPACT + 3 * W_ACCESS
            else:
                c["_score_market"] = 3
                c["_score_signal"] = 3
                c["_score_breadth"] = 3
                c["_total_score"] = 3 * W_MARKET + 3 * W_SIGNAL + 3 * W_BREADTH

    llm_count = len([c for c in candidates if c.get("_llm_scored")])
    print(f"  [스코어링] LLM 평가: {llm_count}/{len(candidates)}개")

    # 카테고리별 점수 통계
    for cat in VALID_CATEGORIES:
        cat_articles = [c for c in candidates if c.get("_llm_category") == cat and c.get("_llm_scored")]
        if not cat_articles:
            continue
        scores = [c.get("_total_score", 0) for c in cat_articles]
        avg_s = sum(scores) / len(scores)
        print(f"    [{cat}] {len(cat_articles)}개 | 평균 {avg_s:.1f} | 최소 {min(scores)} | 최대 {max(scores)}")
        for rank, c in enumerate(sorted(cat_articles, key=lambda x: x.get("_total_score", 0), reverse=True)[:3]):
            title = (c.get("display_title") or c.get("title", ""))[:50]
            print(f"      Top{rank+1}: [{c.get('_total_score', 0)}점] {title}")

    # 90점 이상 고점 기사 플래깅
    high_scorers = [c for c in candidates if c.get("_total_score", 0) >= 90 and c.get("_llm_scored")]
    if high_scorers:
        print(f"  [주의] 90점 이상 기사 {len(high_scorers)}개:")
        for c in sorted(high_scorers, key=lambda x: x.get("_total_score", 0), reverse=True):
            title = (c.get("display_title") or c.get("title", ""))[:60]
            cat = c.get("_llm_category", "?")
            score = c.get("_total_score", 0)
            if cat == "research":
                dims = f"rig={c.get('_score_rigor',0)} nov={c.get('_score_novelty',0)} pot={c.get('_score_potential',0)}"
            elif cat == "models_products":
                dims = f"uti={c.get('_score_utility',0)} imp={c.get('_score_impact',0)} acc={c.get('_score_access',0)}"
            else:
                dims = f"mag={c.get('_score_market',0)} sig={c.get('_score_signal',0)} brd={c.get('_score_breadth',0)}"
            print(f"    [{score}점] [{cat}] {dims} | {title}")

    return {"scored_candidates": candidates, "scorer_retry_count": retry_count + 1}


# ─── Node 6: selector (하이라이트 Top 3 + 카테고리별 Top 25 + 품질 검증) ───
HIGHLIGHT_COUNT = 3
CATEGORY_TOP_N = 25


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


@_safe_node("selector")
def selector_node(state: NewsGraphState) -> dict:
    """하이라이트 Top 3 선정 + 카테고리별 Top 25 + 품질 검증 (기존 ranker+classifier 통합)"""
    candidates = state.get("scored_candidates", [])
    category_order = ["research", "models_products", "industry_business"]

    if not candidates:
        return {
            "highlights": [],
            "categorized_articles": {k: [] for k in category_order},
            "category_order": category_order,
        }

    # ── Step 1: 하이라이트 Top 3 선정 (당일 research + models_products) ──
    HIGHLIGHT_CATEGORIES = {"research", "models_products"}
    today_all = [
        c for c in candidates
        if c.get("_is_today") and c.get("_llm_category", "") in HIGHLIGHT_CATEGORIES
    ]
    today_total = sum(1 for c in candidates if c.get("_is_today"))
    print(f"  [선정] 당일 기사 {today_total}개 중 하이라이트 후보 {len(today_all)}개 (research + models_products)")

    _epoch = datetime(2000, 1, 1, tzinfo=_KST)
    def _day_key(c: dict):
        dt = _parse_published(c.get("published", "")) or _epoch
        return _to_kst_date(dt)
    def _time_key(c: dict):
        return _parse_published(c.get("published", "")) or _epoch

    by_score = sorted(
        today_all,
        key=lambda c: (c.get("_total_score", 0), _time_key(c)),
        reverse=True,
    )

    highlights: list[dict] = []
    for c in by_score:
        if len(highlights) >= HIGHLIGHT_COUNT:
            break
        # 미번역 기사 차단
        if c.get("display_title") == c.get("title") and c.get("lang") != "ko":
            continue
        highlights.append(c)

    highlights = sorted(
        highlights,
        key=lambda c: (_day_key(c), c.get("_total_score", 0), _time_key(c)),
        reverse=True,
    )

    for rank, c in enumerate(highlights):
        title = (c.get("display_title") or c.get("title", ""))[:40]
        src = c.get("source_key", "")
        print(f"    {rank+1}. [{c.get('_total_score', 0)}점] [{src}] {title}")

    # ── Step 2: 하이라이트 제외 → 카테고리별 분류 ──
    highlight_ids = set(id(c) for c in highlights)
    remaining = [c for c in candidates if id(c) not in highlight_ids]

    categorized: dict[str, list[dict]] = {k: [] for k in category_order}
    for a in remaining:
        cat = a.get("_llm_category", "")
        if cat in categorized:
            categorized[cat].append(a)
        else:
            # categorizer에서 전부 분류되지만, 안전 폴백
            categorized["industry_business"].append(a)

    # ── Step 3: 카테고리별 Top 25 + 당일 3개 보장 ──
    for cat in category_order:
        total = len(categorized[cat])
        today_count = len([a for a in categorized[cat] if a.get("_is_today")])
        categorized[cat] = _select_category_top_n(categorized[cat])
        print(f"    {cat}: {total}개 (당일 {today_count}) -> Top {len(categorized[cat])}개")

    # 카테고리별 최종 선정 기사 목록
    for cat in category_order:
        articles = categorized[cat]
        if not articles:
            continue
        print(f"  --- [{cat}] 최종 선정 {len(articles)}개 ---")
        for idx, a in enumerate(articles[:5]):
            title = (a.get("display_title") or a.get("title", ""))[:50]
            score = a.get("_total_score", 0)
            is_today = "당일" if a.get("_is_today") else "이전"
            print(f"    {idx+1}. [{score}점] [{is_today}] {title}")
        if len(articles) > 5:
            print(f"    ... 외 {len(articles) - 5}개")

    # ── Step 4: 품질 검증 ──
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

    return {
        "highlights": highlights,
        "categorized_articles": categorized,
        "category_order": category_order,
    }


# ─── Node 8: assembler ───
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
    """스코어 커버리지 < 90% 이고 재시도 < 2 이면 재시도"""
    candidates = state.get("scored_candidates", [])
    retry_count = state.get("scorer_retry_count", 0)
    if not candidates:
        return "selector"
    llm_scored = len([c for c in candidates if c.get("_llm_scored")])
    coverage = llm_scored / len(candidates)
    if coverage < 0.9 and retry_count < 2:
        print(f"  [라우팅] 스코어 커버리지 {coverage:.0%} < 90% -> 재시도")
        return "scorer"
    return "selector"


# ─── 그래프 구성 (EN/KO 진정한 병렬 분기) ───
def _build_graph():
    graph = StateGraph(NewsGraphState)

    graph.add_node("collector", collector_node)
    graph.add_node("en_process", en_process_node)
    graph.add_node("ko_process", ko_process_node)
    graph.add_node("categorizer", categorizer_node)
    graph.add_node("scorer", scorer_node)
    graph.add_node("selector", selector_node)
    graph.add_node("assembler", assembler_node)

    graph.set_entry_point("collector")

    # collector -> Send API 로 EN/KO 병렬 분기, 또는 assembler 직행
    graph.add_conditional_edges("collector", _route_after_collector)

    # EN/KO 완료 -> categorizer (둘 다 완료되어야 진행)
    graph.add_edge("en_process", "categorizer")
    graph.add_edge("ko_process", "categorizer")

    # categorizer -> scorer
    graph.add_edge("categorizer", "scorer")

    # scorer -> 커버리지 부족 시 재시도 루프
    graph.add_conditional_edges("scorer", _route_after_scorer, {
        "scorer": "scorer",
        "selector": "selector",
    })

    graph.add_edge("selector", "assembler")
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
