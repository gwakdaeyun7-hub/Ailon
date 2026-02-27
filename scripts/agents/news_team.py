"""
뉴스 수집 파이프라인 -- LangGraph 8-노드 (EN/KO 진정한 병렬 분기)

collector --> [en_process, ko_process] (병렬 Send) --> categorizer --> ranker --> entity_extractor --> selector --> assembler

1. collector:          16개 소스 수집 + 이미지/본문 통합 스크래핑 + LLM AI 필터
2. en_process:         영어 기사 번역+요약 (thinking 비활성화, 배치 5)  -- 병렬
3. ko_process:         한국어 기사 요약 (thinking 비활성화, 배치 2)     -- 병렬
4. categorizer:        LLM 카테고리 분류 (research / models_products / industry_business)
5. ranker:             카테고리별 직접 순위 매기기 (카테고리당 1회 LLM 호출, 순위→점수 역산: 1위=100, 꼴등=30)
6. entity_extractor:   엔티티 추출 + topic_cluster_id 부여 (10개 배치 병렬)
7. selector:           하이라이트 Top 3 + 카테고리별 Top 25 + 품질 검증
8. assembler:          한국 소스별 분리 + 최종 결과 + 타이밍 리포트

점수 체계: 카테고리별 전체 기사 순위 → 선형 보간 점수 (1위=100, 꼴등=30)
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
    fetch_all_sources, enrich_and_scrape, filter_imageless,
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
    highlights: list[dict]
    categorized_articles: dict[str, list[dict]]
    category_order: list[str]
    source_articles: dict[str, list[dict]]
    source_order: list[str]
    filtered_articles: list[dict]
    deduped_articles: dict[str, list[dict]]
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
    # 마크다운 코드블록 제거 — ```json, ```JSON, ``` 등 모두 처리
    text = re.sub(r'```[a-zA-Z]*\s*\n?', '', text)
    text = re.sub(r'\n?\s*```', '', text)
    # Gemini bold/italic 마크다운 제거 — *** 가 {} 를 대체하거나 장식으로 삽입되는 케이스 처리
    # 패턴 A (장식): [{***"i":0***}] — {} 가 이미 있고 *** 는 장식
    # 패턴 B (대체): [***"i":0***]   — {} 없이 *** 가 {} 역할
    has_braces = '{' in text
    if has_braces:
        # {} 가 이미 있으면 *** 는 장식 — 전부 제거
        text = re.sub(r'\*{2,}', '', text)
    else:
        # {} 없이 *** 가 {} 를 대체한 경우 — 구조적 치환
        text = re.sub(r'\[\s*\*+', '[{', text)
        text = re.sub(r'\*+\s*\]', '}]', text)
        text = re.sub(r'\*+\s*,\s*\*+', '},{', text)
        text = re.sub(r'\*{2,}', '', text)
    text = text.strip()

    if not text:
        raise json.JSONDecodeError("LLM response empty after stripping thinking tags", "", 0)

    # 1차: 전체 텍스트가 유효한 JSON인지 시도
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2차: 앞뒤 텍스트 제거 — 첫 [ 또는 { 부터 마지막 ] 또는 } 까지 추출
    #       예: "Here is the result:\n[{...}]\nDone." → "[{...}]"
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

    # 3차: 배열에서 단일 객체 추출 — 배열 파싱이 실패했지만 내부 {} 는 유효한 경우
    #       예: 깨진 [{...}] → 내부 {...} 추출 후 [obj] 반환
    bracket_idx = text.find('[')
    if bracket_idx != -1:
        bracket_end = text.rfind(']')
        if bracket_end > bracket_idx:
            inner = text[bracket_idx + 1:bracket_end].strip()
            if inner.startswith('{') and inner.endswith('}'):
                try:
                    obj = json.loads(inner)
                    if isinstance(obj, dict):
                        return [obj]
                except json.JSONDecodeError:
                    pass

    # 4차: 잘린 JSON 배열 복구 ([ 있지만 ] 없는 경우)
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

    # 5차: depth 기반 추출 — 중첩/오염된 텍스트에서 유효한 JSON 영역만 추출
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

RULE: Only use facts stated in the provided article text. Never infer, speculate, or add information not present in the source. (Exception: the "background" field MAY use general knowledge.)

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
- background: 이 뉴스를 이해하기 위한 배경 맥락 1~2문장 (~이에요/~해요 체)
  - 이전 사건이나 관련 배경 정보를 포함해요
  - 기사 본문 외 일반 상식·배경 지식 사용 허용
  - 예: "OpenAI는 지난해 GPT-4o를 출시하며 멀티모달 AI 경쟁을 이끌어왔어요"
- background_en: English version of background (1-2 sentences)
- tags: 이 기사의 핵심 키워드 2~4개 배열
  - 예: ["OpenAI", "GPT-5", "멀티모달"]
- glossary: 기사에 등장하는 전문 용어 2~3개를 {{"term": "용어", "desc": "한줄설명"}} 형태의 배열
  - 예: [{{"term": "MoE", "desc": "여러 전문가 모델을 조합해 효율적으로 추론하는 아키텍처"}}]
  - desc는 ~이에요/~해요 체
- glossary_en: English version of glossary (same structure: {{"term": "...", "desc": "..."}})

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
[{{"index":1,"display_title":"...","one_line":"...","key_points":["..."],"why_important":"...","display_title_en":"...","one_line_en":"...","key_points_en":["..."],"why_important_en":"...","background":"...","background_en":"...","tags":["..."],"glossary":[{{"term":"...","desc":"..."}}],"glossary_en":[{{"term":"...","desc":"..."}}]}}]

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
            # background / tags / glossary 필드
            if r.get("background"):
                batch[ridx]["background"] = r["background"]
            if r.get("background_en"):
                batch[ridx]["background_en"] = r["background_en"]
            tags = r.get("tags", [])
            if tags:
                batch[ridx]["tags"] = tags if isinstance(tags, list) else []
            glossary = r.get("glossary", [])
            if glossary:
                batch[ridx]["glossary"] = glossary if isinstance(glossary, list) else []
            glossary_en = r.get("glossary_en", [])
            if glossary_en:
                batch[ridx]["glossary_en"] = glossary_en if isinstance(glossary_en, list) else []
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

You are filtering news articles. Return indices of articles that are DIRECTLY related to AI.

Decision rule: Ask "Is AI the main topic or a core part of this article?" If not, EXCLUDE.

When in doubt, EXCLUDE.

INCLUDE -- AI must be central:
- Model releases, benchmarks, architecture advances
- AI research papers and technical breakthroughs
- AI-powered products/tools and their features
- AI frameworks/libraries (PyTorch, LangChain, etc.)
- AI regulation, policy, ethics discussions
- AI industry news (funding, M&A, partnerships involving AI companies)
- Hardware/semiconductors specifically for AI (GPUs, NPUs, AI chips)
- AI's direct impact on society, jobs, education

EXCLUDE:
- General tech news where AI is not the main focus
- Non-tech subjects using AI as a passing buzzword
- Celebrity, entertainment, politics with no AI substance
- Government PR, tourism, regional marketing
- Programming tutorials unrelated to AI/ML
- Articles where "AI" only appears in a tag but content is unrelated

Articles:
{article_text}

Return the indices of AI-related articles as a JSON array:
[0, 2, 5]"""
    else:
        prompt = f"""IMPORTANT: Output ONLY a valid JSON array of integers. No thinking, no markdown.

You are filtering news articles from international tech media. Return indices of articles that are RELATED to AI and tech.

Decision rule: Ask "Is this article relevant to someone who specifically follows AI?" If not, EXCLUDE.

When in doubt, EXCLUDE.

INCLUDE:
- Anything about AI, ML, LLMs, deep learning, neural networks
- AI company news (OpenAI, Anthropic, Google DeepMind, Meta AI, etc.)
- AI-powered products, tools, and services
- Hardware and chips for AI (GPUs, TPUs, AI accelerators)
- AI regulation, policy, ethics
- AI startups, funding, acquisitions
- AI research and science
- Developer tools and frameworks for AI/ML

EXCLUDE:
- General tech news unrelated to AI (e.g., phone reviews, app updates)
- Pure lifestyle, cooking, sports, celebrity gossip
- Non-tech politics or social issues
- Software engineering topics with no AI connection

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
        print(f"    [WARN] LLM AI 필터 실패 -> 전체 통과: {e}")
    # 실패 시 전체 통과 (AI 관련으로 간주)
    return set(range(len(articles)))


def _llm_filter_sources(sources: dict[str, list[dict]]) -> None:
    """모든 소스를 LLM으로 AI 관련성 필터링 (병렬). 제거 대신 _ai_filtered 마킹."""
    total_marked = 0
    tasks = [(key, articles) for key, articles in sources.items() if articles]

    def _filter_one(key: str, articles: list[dict]) -> tuple[str, int, int, int]:
        ai_indices = _llm_ai_filter_batch(articles, source_key=key)
        marked = 0
        for i, a in enumerate(articles):
            if i in ai_indices:
                a["_ai_filtered"] = False
            else:
                a["_ai_filtered"] = True
                marked += 1
        today_marked = sum(1 for i, a in enumerate(articles) if i not in ai_indices and _is_today(a))
        today_kept = sum(1 for i, a in enumerate(articles) if i in ai_indices and _is_today(a))
        if marked > 0:
            msg = f"    [{key}] LLM AI 필터: {marked}개 마킹 (전체 {len(articles)}개 유지)"
            if today_marked > 0 or today_kept > 0:
                msg += f" (당일: {today_kept}개 통과, {today_marked}개 마킹)"
            print(msg)
        return key, marked, today_marked, today_kept

    total_today_marked = 0
    total_today_kept = 0
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(_filter_one, key, articles): key for key, articles in tasks}
        for future in as_completed(futures):
            try:
                key, marked, today_marked, today_kept = future.result()
            except Exception as e:
                key = futures[future]
                print(f"    [WARN] [{key}] LLM AI 필터 future 실패: {e}")
                continue
            total_marked += marked
            total_today_marked += today_marked
            total_today_kept += today_kept

    if total_marked > 0:
        msg = f"  [LLM AI 필터] 총 {total_marked}개 비AI 기사 마킹 (제거 안 함, 파이프라인 통과)"
        if total_today_marked > 0 or total_today_kept > 0:
            msg += f" (당일 기사: {total_today_kept}개 통과 / {total_today_marked}개 마킹)"
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
    _llm_filter_sources(sources)  # 제거 대신 _ai_filtered 마킹
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
DEDUP_THRESHOLD = 0.45  # 유사도 임계값 (낮출수록 공격적)


def _normalize_title(title: str) -> str:
    """비교용 제목 정규화: 소문자, 특수문자/공백 제거"""
    import unicodedata
    t = unicodedata.normalize("NFKC", title.lower())
    t = re.sub(r'[^\w\s]', '', t)       # 특수문자 제거
    t = re.sub(r'\s+', ' ', t).strip()   # 공백 정리
    return t


def _extract_url_key(link: str) -> str:
    """URL에서 쿼리/프래그먼트 제거한 정규화 키"""
    if not link:
        return ""
    from urllib.parse import urlparse
    p = urlparse(link)
    # 경로 끝 슬래시 제거 + 소문자
    path = p.path.rstrip("/").lower()
    return f"{p.netloc.lower()}{path}"


def _deduplicate_candidates(candidates: list[dict], mark_only: bool = False, threshold: float | None = None) -> list[dict]:
    """다층 중복 제거:
    Layer 1: URL 완전 일치
    Layer 2: 원본 제목(영문) 유사도
    Layer 3: 번역 제목(한국어) 유사도
    Layer 4: 엔티티 교집합(>=2) + topic_cluster_id 일치
    Layer 5: one_line(한줄 요약) 유사도
    발행일 가장 오래된(원본) 기사 유지.
    mark_only=True 면 제거 대신 _deduped=True 마킹 (전체 리스트 반환).
    threshold: 제목 유사도 임계값 (None이면 DEDUP_THRESHOLD 사용)."""
    if len(candidates) <= 1:
        return candidates

    thr = threshold if threshold is not None else DEDUP_THRESHOLD

    _epoch = datetime(2000, 1, 1, tzinfo=timezone.utc)
    sorted_cands = sorted(
        candidates,
        key=lambda c: _parse_published(c.get("published", "")) or _epoch,
    )

    kept: list[dict] = []
    seen_urls: set[str] = set()
    removed = 0
    dupes: list[dict] = []

    for c in sorted_cands:
        # Layer 1: URL 완전 일치
        url_key = _extract_url_key(c.get("link", ""))
        if url_key and url_key in seen_urls:
            removed += 1
            c["_deduped"] = True
            dupes.append(c)
            continue

        # Layer 2: 원본 제목(영문) 유사도
        orig_title = _normalize_title(c.get("title", ""))
        # Layer 3: 번역 제목(한국어) 유사도
        disp_title = _normalize_title(c.get("display_title") or c.get("title", ""))
        # Layer 4 준비: 엔티티 이름 집합 + topic_cluster_id
        c_entities = {e.get("name", "").lower() for e in c.get("entities", []) if e.get("name")}
        c_cluster = c.get("topic_cluster_id", "")
        # Layer 5 준비: one_line 정규화
        c_oneline = _normalize_title(c.get("one_line", ""))

        is_dup = False
        for k in kept:
            # Layer 2: 원본 제목 비교
            k_orig = _normalize_title(k.get("title", ""))
            if orig_title and k_orig and SequenceMatcher(None, orig_title, k_orig).ratio() >= thr:
                is_dup = True
                break
            # Layer 3: 번역 제목 비교
            k_disp = _normalize_title(k.get("display_title") or k.get("title", ""))
            if disp_title and k_disp and SequenceMatcher(None, disp_title, k_disp).ratio() >= thr:
                is_dup = True
                break
            # Layer 4: 엔티티 교집합 >= 2 AND topic_cluster_id 동일
            if c_entities and c_cluster:
                k_entities = {e.get("name", "").lower() for e in k.get("entities", []) if e.get("name")}
                k_cluster = k.get("topic_cluster_id", "")
                if k_entities and k_cluster and c_cluster == k_cluster and len(c_entities & k_entities) >= 2:
                    is_dup = True
                    break
            # Layer 5: one_line(한줄 요약) 유사도
            if c_oneline:
                k_oneline = _normalize_title(k.get("one_line", ""))
                if k_oneline and SequenceMatcher(None, c_oneline, k_oneline).ratio() >= 0.50:
                    is_dup = True
                    break

        if is_dup:
            removed += 1
            c["_deduped"] = True
            dupes.append(c)
        else:
            c["_deduped"] = False
            kept.append(c)
            if url_key:
                seen_urls.add(url_key)

    if removed > 0:
        print(f"  [중복 제거] {removed}개 중복 기사 제거 ({len(candidates)} → {len(kept)}개)")

    if mark_only:
        return kept + dupes
    return kept


# ─── Node 4: categorizer (카테고리 분류) + Node 5: ranker (직접 순위) ───
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

Classify each article by following Step 1 → Step 2 → Step 3 in order. Stop at the first YES.

## Step 1: research?
YES if the article's **main subject** is a scientific/technical finding, method, or evaluation:
- paper/논문/study/연구 published or presented
- new algorithm, architecture, or training method proposed
- benchmark/SOTA results or evaluation of methods
- dataset released for research purposes
- theoretical analysis, scaling law, survey of techniques

MUST contain at least one: paper, 논문, study, 연구, benchmark, SOTA, architecture, algorithm, method, dataset, evaluation, survey, scaling law, preprint, arXiv, findings, 발견

NOT research (common traps):
- "연구 필요 촉구" / "우려 확산" = opinion/industry, not a paper
- company blog about strategy citing research ≠ research
- industry report / index / whitepaper = industry_business
- 경영진 발언에서 연구 언급 = industry_business

## Step 2: models_products?
YES if the article announces something users can **download, access, or use**:
- model weights or API released/updated (출시/공개/업데이트/릴리스)
- new app, tool, platform, SDK, framework launched
- open-source release with usable artifact
- new feature added to existing product (신기능)
- pricing or availability change for a product

Key test: "Can a developer or user DO something new after this announcement?"

NOT models_products (common traps):
- rumor/leak about upcoming product = industry_business
- paper + code/weights released together → research (primary = paper)
- partnership to "build" something future = industry_business
- product comparison/review article = industry_business

## Step 3: industry_business (default)
Everything else: funding, M&A, regulation, strategy, market analysis, exec hires, opinions, events, partnerships, reports, forecasts, lawsuits, policy.

Articles:
{article_text}

Output exactly {count} JSON object(s):
[{{"i":0,"cat":"<category>"}}]"""

# --- 랭킹 프롬프트 (카테고리별 직접 순위) ---
_RANK_PROMPT = """Output ONLY a JSON array of integers. No markdown, no explanation. Start with '['.

You are ranking {count} AI news articles by importance and interest for someone who follows AI.

Criteria (single question): "How important and interesting is this news to someone who actively follows AI?"
Consider: significance of the event, potential impact, novelty, and broad appeal.

Articles:
{article_text}

Output a JSON array of article indices ordered from MOST important to LEAST important.
Example for 5 articles: [3, 0, 4, 1, 2] means article 3 is most important, article 2 is least.

Output exactly {count} indices (0 to {count_minus_1}):"""


def _rank_to_score(rank: int, total: int) -> int:
    """순위(0-based)에서 점수를 선형 보간. 1위=100, 꼴등=0."""
    if total <= 1:
        return 100
    return round(100 - 100 * rank / (total - 1))


def _rank_category(articles: list[dict], category: str) -> list[tuple[int, int, int]]:
    """카테고리 내 기사들의 순위를 LLM으로 매김.

    Returns: list of (local_idx, rank_0based, score)
    """
    count = len(articles)
    if count == 0:
        return []
    if count == 1:
        return [(0, 0, 100)]

    article_text = ""
    for i, a in enumerate(articles):
        title = a.get("display_title") or a.get("title", "")
        body = a.get("body", "")
        context = body[:500] if body else (a.get("description", "") or "")[:200]
        article_text += f"\n[{i}] {title} | {context}"

    prompt = _RANK_PROMPT.format(
        count=count,
        count_minus_1=count - 1,
        article_text=article_text,
    )

    try:
        llm = get_llm(temperature=0.0, max_tokens=2048, thinking=False, json_mode=True)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=2)
        ranking = _parse_llm_json(content)

        # 응답이 dict인 경우 배열 추출
        if isinstance(ranking, dict):
            ranking = next((v for v in ranking.values() if isinstance(v, list)), [])

        if not isinstance(ranking, list):
            raise ValueError(f"Expected list, got {type(ranking)}")

        # 유효성 검증: 모든 인덱스가 0~count-1 범위 내
        int_ranking = []
        for r in ranking:
            try:
                idx = int(r)
                if 0 <= idx < count:
                    int_ranking.append(idx)
            except (ValueError, TypeError):
                continue

        # 중복/누락 처리
        seen = set()
        deduped = []
        for idx in int_ranking:
            if idx not in seen:
                seen.add(idx)
                deduped.append(idx)

        # 누락된 인덱스를 뒤에 추가
        for i in range(count):
            if i not in seen:
                deduped.append(i)

        if len(deduped) != count:
            raise ValueError(f"Ranking length mismatch: {len(deduped)} vs {count}")

        results = []
        for rank, local_idx in enumerate(deduped):
            score = _rank_to_score(rank, count)
            results.append((local_idx, rank, score))

        # 로그: Top 5
        print(f"    [{category}] 순위 결정 ({count}개):")
        for local_idx, rank, score in sorted(results, key=lambda x: x[1])[:5]:
            title = (articles[local_idx].get("display_title") or articles[local_idx].get("title", ""))[:50]
            print(f"      #{rank+1} [{score}점] {title}")

        return results

    except Exception as e:
        print(f"    [RANKER 폴백] {category}: {e} — published 최신순 사용")
        # 폴백: published 날짜 최신순
        indexed = list(range(count))
        indexed.sort(
            key=lambda i: articles[i].get("published", ""),
            reverse=True,
        )
        results = []
        for rank, local_idx in enumerate(indexed):
            score = _rank_to_score(rank, count)
            results.append((local_idx, rank, score))
        return results


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
        return {"scored_candidates": []}

    candidates = _deduplicate_candidates(candidates, mark_only=True)

    today_count = 0
    for c in candidates:
        c["_is_today"] = _is_today(c)
        if c["_is_today"]:
            today_count += 1

    deduped_count = sum(1 for c in candidates if c.get("_deduped"))
    unique_count = len(candidates) - deduped_count
    print(f"  [분류] {unique_count}개 분류 중... (당일 {today_count}개, 중복 {deduped_count}개 보존)")

    # 분류 대상: _llm_category가 없는 기사 (중복 기사 포함 — 정확한 카테고리 배치를 위해)
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

    # 미분류 기사에 기본 카테고리 부여 (중복 기사 포함)
    for a in candidates:
        if not a.get("_llm_category") or a["_llm_category"] not in VALID_CATEGORIES:
            a["_llm_category"] = "industry_business"

    # 카테고리별 그룹 통계
    for cat in VALID_CATEGORIES:
        count = sum(1 for a in candidates if a.get("_llm_category") == cat)
        print(f"    [그룹] {cat}: {count}개")

    return {"scored_candidates": candidates}


@_safe_node("ranker")
def ranker_node(state: NewsGraphState) -> dict:
    """카테고리별 직접 순위 매기기. 카테고리당 1회 LLM 호출."""
    candidates = state.get("scored_candidates", [])
    if not candidates:
        return {"scored_candidates": []}

    # 카테고리별 그룹화 (deduped 제외)
    cat_groups: dict[str, list[tuple[int, dict]]] = {
        "research": [], "models_products": [], "industry_business": [],
    }
    for i, a in enumerate(candidates):
        if a.get("_deduped"):
            continue
        cat = a.get("_llm_category", "industry_business")
        cat_groups.get(cat, cat_groups["industry_business"]).append((i, a))

    for cat, group in cat_groups.items():
        if group:
            print(f"    [그룹] {cat}: {len(group)}개")

    # 3개 카테고리 병렬 랭킹
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {}
        for cat, group in cat_groups.items():
            if group:
                articles = [a for _, a in group]
                futures[executor.submit(_rank_category, articles, cat)] = (cat, group)

        for future in as_completed(futures):
            cat, group = futures[future]
            try:
                ranked = future.result()
                for local_idx, rank, score in ranked:
                    global_idx = group[local_idx][0]
                    candidates[global_idx]["_rank"] = rank
                    candidates[global_idx]["_total_score"] = score
                    candidates[global_idx]["_llm_scored"] = True
            except Exception as e:
                print(f"  [RANKER ERROR] {cat}: {e}")

    # deduped 기사: 최하위 점수
    for a in candidates:
        if a.get("_deduped") and "_total_score" not in a:
            a["_total_score"] = 20
            a["_rank"] = 9999

    # 미랭킹 기사 폴백
    for a in candidates:
        if "_total_score" not in a:
            a["_total_score"] = 25
            a["_rank"] = 9999

    return {"scored_candidates": candidates}


# ─── Node 5.5: entity_extractor (엔티티 추출 + 토픽 클러스터링) ───
_ENTITY_EXTRACT_PROMPT = """You are an AI news entity extractor. Given a list of AI news articles, extract key entities and assign a topic_cluster_id to each article.

Entity types (use ONLY these): "model", "company", "person", "technology", "concept", "dataset", "framework"

topic_cluster_id format: "domain/specific_topic"
Examples: "nlp/language_models", "vision/image_generation", "robotics/autonomous_driving", "ml/training_methods", "infra/compute", "business/funding", "regulation/policy", "audio/speech", "multimodal/agents"

Articles:
{article_text}

Return a JSON array with exactly {count} elements, one per article, in the same order:
[{{"index": 0, "entities": [{{"name": "GPT-5", "type": "model"}}, {{"name": "OpenAI", "type": "company"}}], "topic_cluster_id": "nlp/language_models"}}, ...]

Rules:
- "index" must match the [N] number of each article
- "entities": 1-5 most important entities per article. Use exact names as they appear.
- "topic_cluster_id": one string in "domain/topic" format
- Output ONLY the JSON array, no explanation
"""

_ENTITY_TYPES = {"model", "company", "person", "technology", "concept", "dataset", "framework"}


def _extract_entities_batch(batch: list[dict], batch_idx: int) -> list[dict]:
    """단일 배치에서 엔티티 추출 + topic_cluster_id 부여. 실패 시 원본 반환."""
    article_text = ""
    for i, a in enumerate(batch):
        title = a.get("display_title") or a.get("title", "")
        one_line = a.get("one_line") or a.get("one_line_en") or ""
        article_text += f"\n[{i}] {title} | {one_line}"

    prompt = _ENTITY_EXTRACT_PROMPT.format(
        article_text=article_text,
        count=len(batch),
    )

    try:
        llm = get_llm(temperature=0, max_tokens=4096, thinking=False, json_mode=True)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=2)
        results = _parse_llm_json(content)

        if isinstance(results, dict):
            results = next((v for v in results.values() if isinstance(v, list)), [])
        if not isinstance(results, list):
            raise ValueError(f"Expected list, got {type(results)}")

        # index -> result 매핑
        idx_map = {}
        for r in results:
            if isinstance(r, dict) and "index" in r:
                idx_map[int(r["index"])] = r
        # index 매칭 실패 시 순서 기반 폴백
        if not idx_map and len(results) == len(batch):
            for i, r in enumerate(results):
                if isinstance(r, dict):
                    idx_map[i] = r

        applied = 0
        for i, a in enumerate(batch):
            r = idx_map.get(i)
            if not r:
                continue
            # entities 검증: type이 유효한 것만 보존
            entities = r.get("entities", [])
            valid_entities = [
                e for e in entities
                if isinstance(e, dict) and e.get("name") and e.get("type") in _ENTITY_TYPES
            ]
            if valid_entities:
                a["entities"] = valid_entities
            cluster = r.get("topic_cluster_id", "")
            if isinstance(cluster, str) and "/" in cluster:
                a["topic_cluster_id"] = cluster
            applied += 1

        print(f"    [entity batch {batch_idx}] {applied}/{len(batch)}개 적용")

    except Exception as e:
        print(f"    [entity batch {batch_idx}] 실패, 스킵: {e}")

    return batch


@_safe_node("entity_extractor")
def entity_extractor_node(state: NewsGraphState) -> dict:
    """기사별 엔티티 추출 + topic_cluster_id 부여. 10개씩 배치 병렬 처리."""
    candidates = state.get("scored_candidates", [])
    if not candidates:
        return {"scored_candidates": []}

    # 10개씩 배치 분할
    batch_size = 10
    batches = [candidates[i:i + batch_size] for i in range(0, len(candidates), batch_size)]
    print(f"    엔티티 추출: {len(candidates)}개 기사 → {len(batches)}개 배치")

    with ThreadPoolExecutor(max_workers=min(len(batches), 4)) as executor:
        futures = {
            executor.submit(_extract_entities_batch, batch, idx): idx
            for idx, batch in enumerate(batches)
        }
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print(f"    [entity_extractor] 배치 에러: {e}")

    # 통계 로그
    with_entities = sum(1 for a in candidates if a.get("entities"))
    with_cluster = sum(1 for a in candidates if a.get("topic_cluster_id"))
    print(f"    엔티티 추출 완료: entities={with_entities}/{len(candidates)}, cluster={with_cluster}/{len(candidates)}")

    return {"scored_candidates": candidates}


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

    # 2) 나머지 점수순으로 전부 채움 (제한 없음)
    all_by_score = sorted(articles, key=lambda a: a.get("_total_score", 0), reverse=True)
    for a in all_by_score:
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

    # ── Step 1: 카테고리별 당일 기사 1개씩 = 하이라이트 3개 ──
    HIGHLIGHT_CATEGORIES = ["research", "models_products", "industry_business"]

    _epoch = datetime(2000, 1, 1, tzinfo=_KST)
    def _day_key(c: dict):
        dt = _parse_published(c.get("published", "")) or _epoch
        return _to_kst_date(dt)
    def _time_key(c: dict):
        return _parse_published(c.get("published", "")) or _epoch

    today_total = sum(1 for c in candidates if c.get("_is_today"))

    highlights: list[dict] = []
    for cat in HIGHLIGHT_CATEGORIES:
        # 당일(_is_today) + 해당 카테고리 + AI 필터 통과
        pool = [
            c for c in candidates
            if c.get("_llm_category") == cat
            and c.get("_is_today")
            and not c.get("_ai_filtered")
        ]
        if not pool:
            print(f"  [선정] {cat}: 당일 후보 없음")
            continue
        # 점수 내림차순, 동점이면 published 최신순
        best = max(pool, key=lambda c: (c.get("_total_score", 0), _time_key(c)))
        highlights.append(best)
        print(f"  [선정] {cat}: 당일 후보 {len(pool)}개 -> [{best.get('_total_score', 0)}점]")

    print(f"  [선정] 당일 기사 {today_total}개, 하이라이트 {len(highlights)}/{HIGHLIGHT_COUNT}개")

    # 최종 정렬: 날짜(일) 최신순 → 점수 높은순 → 시간 최신순
    highlights = sorted(
        highlights,
        key=lambda c: (_day_key(c), c.get("_total_score", 0), _time_key(c)),
        reverse=True,
    )

    for rank, c in enumerate(highlights):
        title = (c.get("display_title") or c.get("title", ""))[:40]
        src = c.get("source_key", "")
        print(f"    {rank+1}. [{c.get('_total_score', 0)}점] [{src}] {title}")

    # ── Step 2: 하이라이트 제외 → AI 통과/필터 분리 → 카테고리별 분류 ──
    highlight_ids = set(id(c) for c in highlights)
    remaining = [c for c in candidates if id(c) not in highlight_ids]

    # 중복 기사 / AI 필터 제외 / 통과 기사 분리
    deduped_out = [a for a in remaining if a.get("_deduped")]
    non_deduped = [a for a in remaining if not a.get("_deduped")]
    passed = [a for a in non_deduped if not a.get("_ai_filtered")]
    filtered_out = [a for a in non_deduped if a.get("_ai_filtered")]

    categorized: dict[str, list[dict]] = {k: [] for k in category_order}
    for a in passed:
        cat = a.get("_llm_category", "")
        if cat in categorized:
            categorized[cat].append(a)
        else:
            categorized["industry_business"].append(a)

    # 카테고리별 중복 기사 분류 (카테고리 분류기에서 이미 _llm_category 할당됨)
    deduped_by_cat: dict[str, list[dict]] = {k: [] for k in category_order}
    for d in deduped_out:
        cat = d.get("_llm_category", "industry_business")
        if cat in deduped_by_cat:
            deduped_by_cat[cat].append(d)
        else:
            deduped_by_cat["industry_business"].append(d)
    dedup_counts = {k: len(v) for k, v in deduped_by_cat.items() if v}
    if dedup_counts:
        print(f"  [중복 보존] 카테고리별: {dedup_counts}")

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

    # AI 필터 제외 기사도 카테고리+점수 포함하여 저장
    if filtered_out:
        print(f"  [AI 필터 제외] {len(filtered_out)}개 (분류+점수 포함)")

    return {
        "highlights": highlights,
        "categorized_articles": categorized,
        "category_order": category_order,
        "filtered_articles": filtered_out,
        "deduped_articles": deduped_by_cat,
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

    # 한국 소스: 중복 제거 없이 AI 필터 기사만 분리
    ko_filtered_out: list[dict] = []
    for s in SOURCES:
        key = s["key"]
        if key in SOURCE_SECTION_SOURCES and sources.get(key):
            source_order.append(key)
            passed = [a for a in sources[key] if not a.get("_ai_filtered")]
            filtered = [a for a in sources[key] if a.get("_ai_filtered")]
            ko_filtered_out.extend(filtered)
            sorted_articles = sorted(passed, key=_pub_key, reverse=True)
            source_articles[key] = sorted_articles[:10]

    total = (
        len(state.get("highlights", []))
        + sum(len(v) for v in state.get("categorized_articles", {}).values())
        + sum(len(v) for v in source_articles.values())
    )

    # selector의 EN 필터 기사 + assembler의 KO 필터 기사 합산
    filtered_articles = state.get("filtered_articles", []) + ko_filtered_out
    deduped_articles = state.get("deduped_articles", {})
    deduped_total = sum(len(v) for v in deduped_articles.values())

    print(f"\n[DONE] 뉴스 파이프라인 완료: 총 {total}개 (+ AI 필터 {len(filtered_articles)}개 + 중복 {deduped_total}개)")
    print(f"  하이라이트: {len(state.get('highlights', []))}개")
    print(f"  카테고리별: {sum(len(v) for v in state.get('categorized_articles', {}).values())}개")
    print(f"  소스별 섹션: {sum(len(v) for v in source_articles.values())}개")
    print(f"  AI 필터 제외: {len(filtered_articles)}개")
    print(f"  중복 보존: {deduped_total}개")

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
        "filtered_articles": filtered_articles,
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


# ─── 그래프 구성 (EN/KO 진정한 병렬 분기) ───
def _build_graph():
    graph = StateGraph(NewsGraphState)

    graph.add_node("collector", collector_node)
    graph.add_node("en_process", en_process_node)
    graph.add_node("ko_process", ko_process_node)
    graph.add_node("categorizer", categorizer_node)
    graph.add_node("ranker", ranker_node)
    graph.add_node("entity_extractor", entity_extractor_node)
    graph.add_node("selector", selector_node)
    graph.add_node("assembler", assembler_node)

    graph.set_entry_point("collector")

    # collector -> Send API 로 EN/KO 병렬 분기, 또는 assembler 직행
    graph.add_conditional_edges("collector", _route_after_collector)

    # EN/KO 완료 -> categorizer (둘 다 완료되어야 진행)
    graph.add_edge("en_process", "categorizer")
    graph.add_edge("ko_process", "categorizer")

    # categorizer -> ranker -> entity_extractor -> selector (단순 체인)
    graph.add_edge("categorizer", "ranker")
    graph.add_edge("ranker", "entity_extractor")
    graph.add_edge("entity_extractor", "selector")

    graph.add_edge("selector", "assembler")
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
        "scored_candidates": [],
        "highlights": [],
        "categorized_articles": {},
        "category_order": [],
        "source_articles": {},
        "source_order": [],
        "filtered_articles": [],
        "deduped_articles": {},
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
        "filtered_articles": result.get("filtered_articles", []),
        "deduped_articles": result.get("deduped_articles", {}),
        "total_count": result.get("total_count", 0),
        "errors": errors,
    }
