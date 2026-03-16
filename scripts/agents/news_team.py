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
from agents.config import get_llm, get_embeddings
from agents.tools import (
    SOURCES,
    fetch_all_sources, enrich_and_scrape, filter_imageless,
    HIGHLIGHT_SOURCES, CATEGORY_SOURCES, SOURCE_SECTION_SOURCES,
    NEEDS_AI_FILTER,
)
from agents.ci_utils import ci_warning, ci_error, ci_group, ci_endgroup


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
    total_count: int
    # 노드별 소요 시간 (초)
    node_timings: Annotated[dict[str, float], _merge_dicts]
    # 노드별 에러 기록 (파이프라인 실패 vs 뉴스 없음 구분용)
    errors: Annotated[list[str], _merge_lists]


# ─── 날짜 유틸리티 ───
def _parse_published(published: str) -> datetime | None:
    s = published.strip()
    for fmt in (
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S %Z",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            dt = datetime.strptime(s, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except (ValueError, AttributeError):
            continue
    # "2026.02.28 PM 08:20" 등 한국 소스 형식
    m = re.match(r'(\d{4})\.(\d{2})\.(\d{2})', s)
    if m:
        try:
            dt = datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)), tzinfo=_KST)
            return dt
        except ValueError:
            pass
    # email.utils (RFC 2822 변형) + fromisoformat 폴백
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        pass
    try:
        dt = datetime.fromisoformat(s.replace('Z', '+00:00'))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        pass
    return None


_KST = timezone(timedelta(hours=9))


def _to_kst_date(dt: datetime) -> datetime:
    """datetime을 KST 날짜(시간 제거)로 변환"""
    return dt.astimezone(_KST).replace(hour=0, minute=0, second=0, microsecond=0)


def _is_recent(article: dict, days: int = 3) -> bool:
    """KST 기준 최근 N일 이내 기사인지 판별 (기본 3일)"""
    pub = article.get("published", "")
    if not pub:
        return False
    dt = _parse_published(pub)
    if not dt:
        return False
    now_kst = datetime.now(_KST)
    article_date = _to_kst_date(dt)
    cutoff_date = _to_kst_date(now_kst) - timedelta(days=days - 1)
    return article_date >= cutoff_date


def _is_today(article: dict) -> bool:
    """KST 기준 오늘 또는 어제 기사인지 판별"""
    return _is_recent(article, days=2)


# ─── JSON 파싱 유틸리티 ───
# Gemini often puts literal newlines inside JSON string values;
# strict=False allows control characters inside strings.
_jloads = lambda s: json.loads(s, strict=False)

def _parse_llm_json(text: str):
    if not text:
        raise json.JSONDecodeError("Empty LLM response", "", 0)

    text = text.strip()
    # Gemini Pro: "Here is the JSON requested:" 등 텍스트 프리픽스 제거
    text = re.sub(r'^[^[{]*?(?=[\[{])', '', text, count=1)
    # Gemini 2.5 Flash: <thinking> 태그 제거 (thinking 비활성화 시에도 발생 가능)
    text = re.sub(r'<think(?:ing)?>.*?</think(?:ing)?>', '', text, flags=re.DOTALL)
    # 마크다운 코드블록 제거 — ```json, ```JSON, ``` 등 모두 처리
    text = re.sub(r'```[a-zA-Z]*\s*\n?', '', text)
    text = re.sub(r'\n?\s*```', '', text)
    # Gemini bold/italic 마크다운 제거 — *** 가 {} 를 대체하거나 장식으로 삽입되는 케이스 처리
    # 항상 구조적 치환을 먼저 시도 (패턴이 안 맞으면 무해하게 스킵됨)
    # 그 후 남은 *** 를 컨텍스트 기반으로 { 또는 } 치환
    text = re.sub(r'\[\s*\*+', '[{', text)
    text = re.sub(r'\*+\s*\]', '}]', text)
    text = re.sub(r'\*+\s*,\s*\*+', '},{', text)
    # "value"*** → "value"} 패턴 (닫는 중괄호)
    text = re.sub(r'"\s*\*{2,}', '"} ', text)
    # 남은 ***: 뒤에 " 가 오면 { (객체 시작), 아니면 } (객체 끝)
    # re.sub 진행 중 text 위치 어긋남 방지: 매번 최신 text 참조
    while re.search(r'\*{2,}', text):
        def _star_to_brace(m):
            after = text[m.end():].lstrip()
            return '{' if after and after[0] == '"' else '}'
        new_text = re.sub(r'\*{2,}', _star_to_brace, text, count=1)
        if new_text == text:
            break
        text = new_text
    text = text.strip()

    if not text:
        raise json.JSONDecodeError("LLM response empty after stripping thinking tags", "", 0)

    # 1차: 전체 텍스트가 유효한 JSON인지 시도
    try:
        return _jloads(text)
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
                return _jloads(text[start_idx:last_end + 1])
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
                    obj = _jloads(inner)
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
            result = _jloads(truncated)
            ci_warning(f"JSON 복구 발동: 잘린 배열 복구 성공 ({len(result)}개 항목)")
            print(f"    [JSON 복구] 잘린 배열 복구 성공: {len(result)}개 항목")
            return result
        except json.JSONDecodeError:
            pass

    # 4-1차: 잘린 JSON 객체 복구 (max_tokens로 잘린 {"stories": [...]} 등)
    #   전략: depth 추적으로 마지막으로 } 또는 ]가 닫힌 위치까지 자르고 열린 괄호 닫기
    brace_idx = text.find('{')
    if brace_idx != -1:
        depth = 0
        in_str = False
        esc = False
        reached_zero = False
        # last_close: 마지막으로 } 또는 ]가 닫힌 위치 (완전한 객체/배열 경계)
        last_close = -1
        for i, ch in enumerate(text[brace_idx:], start=brace_idx):
            if esc:
                esc = False
                continue
            if ch == '\\' and in_str:
                esc = True
                continue
            if ch == '"' and not esc:
                in_str = not in_str
                continue
            if not in_str:
                if ch in ('{', '['):
                    depth += 1
                elif ch in ('}', ']'):
                    depth -= 1
                    last_close = i
                    if depth == 0:
                        reached_zero = True
        if depth > 0 and not reached_zero and last_close > brace_idx:
            # Cut at last_close (inclusive) — last complete } or ]
            truncated = text[brace_idx:last_close + 1]
            # Strip trailing comma if present after the cut
            truncated = re.sub(r'[,\s]+$', '', truncated)
            # Recompute open bracket stack for the truncated portion
            close_stack = []
            s_in_str = False
            s_esc = False
            for ch in truncated:
                if s_esc:
                    s_esc = False
                    continue
                if ch == '\\' and s_in_str:
                    s_esc = True
                    continue
                if ch == '"' and not s_esc:
                    s_in_str = not s_in_str
                if not s_in_str:
                    if ch == '{':
                        close_stack.append('}')
                    elif ch == '[':
                        close_stack.append(']')
                    elif ch in ('}', ']') and close_stack:
                        close_stack.pop()
            truncated += ''.join(reversed(close_stack))
            try:
                result = _jloads(truncated)
                ci_warning("JSON 복구 발동: 잘린 객체 복구 성공")
                print(f"    [JSON 복구] 잘린 객체 복구 성공")
                return result
            except json.JSONDecodeError as e:
                print(f"    [JSON 복구 실패] 잘린 객체 복구 시도 실패: {e.msg}")

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
                            return _jloads(text[start_idx:i + 1])
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
        max_body = 2000 if not translate else 2500
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
            "  - 글자 수 제한 없음. 축약하지 말 것\n"
            "  ★★★ '...' 규칙 (최우선 — 반드시 아래 순서대로 적용):\n"
            "    ■ 1단계: 금지 패턴 확인 (이것부터 먼저!)\n"
            "      '확정 서술어 + ... + 추가 정보' 패턴 = 구분자 오용 → 절대 금지\n"
            "      금지 서술어: 공개/출시/발표/인수/도입/개발/선언/철회/체결/중단/제기/투자/가동/확대/보류/강화/적용/탑재/시작/달성\n"
            "      ❌ 'NVIDIA, 모델 공개... 처리량 5배' → ✅ 'NVIDIA, 모델 공개, 처리량 5배 향상'\n"
            "      ❌ 'Google, Wiz 인수... 역대 최대' → ✅ 'Google, Wiz 320억 달러에 인수'\n"
            "      ❌ 'Microsoft, Copilot 출시... 건강 관리 혁신' → ✅ 'Microsoft Copilot Health 출시, 건강 관리 새 장'\n"
            "      ❌ 'AWS, WSE-3 도입... 추론 5배' → ✅ 'AWS, Cerebras WSE-3 도입으로 AI 추론 5배'\n"
            "      ❌ 'Salesforce, 에이전트 공개... 혁신 시대' → ✅ 'Salesforce, AI 에이전트 공개, 고객 경험 혁신'\n"
            "      검증: '...'를 ','로 바꿔도 의미가 같으면 → ','를 써야 함\n"
            "    ■ 2단계: 적극 사용 (금지 패턴이 아닐 때)\n"
            "      여운·궁금증·예고·충격·반전·불확실성·열거 암시·의문 → '...'와 '?' 자유 사용\n"
            "      ✅ 'OpenAI, 차세대 모델 힌트...출시 임박?' (예고→궁금증)\n"
            "      ✅ 'Anthropic, 무려 60조 가치...' (충격→여운)\n"
            "      ✅ 'AI 일자리 대체, 어디까지...?' (불확실성)\n"
            "      ✅ 'Meta 대규모 감축설 솔솔...' (루머→여운)\n"
            "      비율 제한 없음. 어울리면 모든 제목에 사용 가능"
        )
        en_fields_rule = (
            "\nAlso produce these English fields:\n"
            "- display_title_en: concise English headline (news-style, not a literal back-translation). Use '...' and '?' freely when tone fits (intrigue, suspense, speculation, open questions). Never use '...' as separator after confirmed facts. Good: 'OpenAI Hints at Next-Gen Model...' / 'Can AI Replace Doctors?' Bad: 'Meta Launches New Chip...'\n"
            "- one_line_en: 1-sentence English headline of what happened (WHO did WHAT). No details, no numbers -- just the event.\n"
            "- key_points_en: 3-5 key details NOT mentioned in one_line_en (array of 3-5 strings). Each must contain specific data (numbers, specs, comparisons, prices, dates). No vague statements. No overlap with one_line_en.\n"
            "- why_important_en: 1-2 sentences on impact. Name WHO is affected and HOW specifically. No overlap with one_line_en or key_points_en. Never say 'significant impact' without specifics.\n"
            "- background_en: 1-2 sentence English background context\n"
            "- tags_en: 2-4 English keywords (array of strings)\n"
            '- glossary_en: English version of glossary (same structure: {"term": "...", "desc": "..."})'
        )
    else:
        task_desc = f"Summarize {len(batch)} Korean AI news articles, and also produce English summary fields."
        title_rule = "display_title: 원래 한국어 제목을 그대로 사용 (축약 금지, 원본 그대로)"
        en_fields_rule = (
            "\nAlso produce these English fields (translate the Korean summaries to English):\n"
            "- display_title_en: concise English headline for this article. '...' only for 20-30% with genuine intrigue/suspense, never for confirmed facts\n"
            "- one_line_en: 1-sentence English headline of what happened (WHO did WHAT). No details, no numbers -- just the event.\n"
            "- key_points_en: 3-5 key details NOT mentioned in one_line_en (array of 3-5 strings). Each must contain specific data (numbers, specs, comparisons, prices, dates). No vague statements. No overlap with one_line_en.\n"
            "- why_important_en: 1-2 sentences on impact. Name WHO is affected and HOW specifically. No overlap with one_line_en or key_points_en. Never say 'significant impact' without specifics.\n"
            "- background_en: 1-2 sentence English background context\n"
            "- tags_en: 2-4 English keywords (array of strings)\n"
            '- glossary_en: English version of glossary (same structure: {"term": "...", "desc": "..."})'
        )

    prompt = f"""IMPORTANT: Output ONLY a valid JSON array. No thinking, no markdown. Start with '[' and end with ']'.

RULE: Only use facts stated in the provided article text. Never infer, speculate, or add information not present in the source. (Exception: the "background" field MAY use general knowledge.)

{task_desc}

For each article, produce:
- {title_rule}
- one_line: "무슨 일이 일어났는가" -- 사건 자체만 전달하는 헤드라인 1문장
  - "누가 + 무엇을 했다" 구조. 부가 설명·배경·이유·수치 넣지 않음
  - 팩트만 전달. 의견·해석·중요성 평가 금지. 본문에 없는 정보 추가 금지
  - *** 말투: 반드시 "~했다" / "~됐다" / "~밝혔다" 서술체로 끝낼 것. "~했어요" / "~됐어요" 경어체 절대 금지 ***
  - 좋은 예: "OpenAI가 GPT-5를 공식 출시했다" (O -- 서술체)
  - 좋은 예: "Meta가 Llama 4를 오픈소스로 공개했다" (O -- 서술체)
  - 나쁜 예: "OpenAI가 GPT-5를 공식 출시했어요" (X -- 경어체 금지)
- key_points: one_line을 읽은 사람이 추가로 알아야 할 구체적 세부 정보 3~5개 (개조식)
  *** 말투: 반드시 명사/동명사로 종결할 것. 문장형 종결어미 절대 금지 ***
  - 허용 종결: "~임" / "~됨" / "~함" / "~지원" / "~예정" / "~확대" / 명사구 (예: "50% 인하")
  - 금지 종결: "~했다" / "~했어요" / "~됩니다" / "~이에요" 등 문장형 종결어미 전부 금지
  역할: one_line이 "무슨 일"이라면, key_points는 "구체적으로 어떤 스펙·수치·조건인지"를 전달
  추출 우선순위 (기사에 있다면 반드시 포함):
    1순위: 숫자 데이터 (가격, 성능 수치, 파라미터 수, 벤치마크 점수, 날짜, 금액)
    2순위: 기술 스펙·비교 데이터 (모델 크기, 이전 버전 대비 차이, 경쟁사 대비 차이)
    3순위: 구체적 조건·제약 (출시 지역, 대상 사용자, 라이선스, 지원 플랫폼)
  중복 금지 규칙:
    - one_line에 등장한 주어+동사+목적어를 key_point에서 반복 금지 (같은 사실을 다른 표현으로 바꿔 쓰는 것도 반복)
    - 각 key_point끼리도 서로 다른 정보를 전달해야 함
  본문에 구체적 팩트가 부족하면 2개도 허용. 팩트가 풍부하면 5개까지 추출
  금지 패턴 (이런 문장은 key_points에 넣지 말 것):
    - "~관심을 받고 있음" / "~주목받고 있음" (관심·주목 표현)
    - "~할 것으로 보임" / "~할 전망" (추측·전망)
    - "업계에서 ~로 평가받고 있음" (막연한 평가)
    - 고유명사·숫자·스펙이 하나도 없는 문장
  예: one_line="OpenAI가 GPT-5를 공식 출시했다" → key_points=["컨텍스트 윈도우 256K 토큰, GPT-4 대비 2배 확대", "API 가격 입력 $5/출력 $15 per 1M 토큰, GPT-4 대비 50% 인하", "이미지·오디오·비디오 입력 네이티브 지원", "GPT-4 대비 추론 속도 3배 향상, 첫 토큰 응답 0.3초", "개발자 미리보기 3월 출시, 일반 공개 4월 예정"]
- why_important: 업계/개발자에게 미치는 구체적 영향 -- 1~2문장
  *** 말투: 반드시 "~이에요" / "~해요" / "~있어요" / "~돼요" 부드러운 경어체로 끝낼 것 ***
  - "~했다" 서술체 금지. "~입니다/~합니다" 격식체 금지. 오직 해요체만 사용
  - one_line·key_points에 이미 나온 정보 반복 금지. 새로운 관점(영향·결과)만 서술
  - 반드시 구체적 대상(누구에게)과 구체적 변화(무엇이 어떻게 달라지는지)를 명시
  - 금지: "업계에 큰 영향" / "주목할 만한 변화" / "경쟁이 치열해질 것" 같은 내용 없는 평가
  - 좋은 예: "오픈소스 개발자들이 상용 수준 모델을 무료로 파인튜닝할 수 있게 돼요"
  - 좋은 예: "기존 GPT-4 API 사용자는 코드 수정 없이 자동으로 업그레이드돼요"
{en_fields_rule}
- background: 이 뉴스를 이해하기 위한 배경 맥락 1~2문장
  - 이전 사건이나 관련 배경 정보를 포함
  - 기사 본문 외 일반 상식·배경 지식 사용 허용
  - *** 말투: 반드시 "~했다" / "~됐다" / "~있었다" 서술체로 끝낼 것. "~했어요" 경어체 절대 금지 ***
  - 좋은 예: "OpenAI는 지난해 GPT-4o를 출시하며 멀티모달 AI 경쟁을 이끌어왔다" (O -- 서술체)
  - 나쁜 예: "OpenAI는 지난해 GPT-4o를 출시하며 멀티모달 AI 경쟁을 이끌어왔어요" (X -- 경어체 금지)
- background_en: English version of background (1-2 sentences)
- tags: 이 기사의 핵심 키워드 2~4개 배열 (한국어)
  - 예: ["OpenAI", "GPT-5", "멀티모달"]
- tags_en: English keywords for the same article (2-4 keywords). NOT a literal translation or transliteration of the Korean tags -- use natural English terms that an English-speaking reader would search for.
  - 예: tags: ["멀티모달", "오픈소스"] → tags_en: ["Multimodal", "Open Source"] (한국어 음차를 그대로 옮기지 말 것)
  - 예: tags: ["OpenAI", "GPT-5", "멀티모달"] → tags_en: ["OpenAI", "GPT-5", "Multimodal"]
  - 고유명사(회사명·제품명)는 한/영 동일하게 유지
- glossary: 기사에 등장하는 전문 용어 2~3개를 {{"term": "용어", "desc": "한줄설명"}} 형태의 배열
  - 예: [{{"term": "MoE", "desc": "여러 전문가 모델을 조합해 효율적으로 추론하는 아키텍처"}}]
  - desc는 ~이에요/~해요 체
  - glossary에 포함하지 말아야 할 용어 (너무 일반적):
    AI, 인공지능, 머신러닝, 딥러닝, 자동화, 데이터, 모델, 알고리즘, API, GPU, CPU,
    클라우드, 소프트웨어, 하드웨어, 오픈소스, 검열, 기술, AI 모델, AI 기반, AI 에이전트
  - glossary는 AI를 잘 모르는 일반 독자가 이해하기 어려운 전문 용어만 포함
    좋은 예: MoE, RAG, RLHF, LoRA, 양자화(Quantization), 파인튜닝, 할루시네이션, 어텐션
    나쁜 예: AI, 모델, 데이터, 자동화, 검열, 알고리즘
- glossary_en: English version of glossary (same structure: {{"term": "...", "desc": "..."}})

=== 말투 규칙 총정리 (한국어 필드 — 반드시 준수) ===
각 필드마다 종결어미가 다릅니다. 섞어 쓰면 안 됩니다:

| 필드           | 말투         | 종결 예시                        | 절대 금지              |
|----------------|-------------|--------------------------------|----------------------|
| one_line       | 서술체       | ~했다, ~됐다, ~밝혔다             | ~했어요, ~이에요       |
| key_points     | 개조식(명사형)| ~임, ~됨, ~함, ~지원, 명사구 종결  | ~했다, ~했어요, ~이에요 |
| why_important  | 해요체(부드러운 경어) | ~이에요, ~해요, ~있어요, ~돼요 | ~했다, ~됩니다         |
| background     | 서술체       | ~했다, ~됐다, ~있었다             | ~했어요, ~이에요       |
| glossary desc  | 해요체       | ~이에요, ~해요                   | ~이다, ~됩니다         |

- 기술 용어 영어 병기: "미세 조정(fine-tuning)", "검색 증강 생성(RAG)"

AI 용어 번역 규칙:
- AI/ML 업계에서 한국어로 그대로 음차하여 쓰는 용어는 직역하지 말고 음차 표기할 것
- agent → 에이전트 (요원 ✕), fine-tuning → 파인튜닝, token → 토큰, prompt → 프롬프트
- transformer → 트랜스포머, benchmark → 벤치마크, inference → 인퍼런스/추론, embedding → 임베딩
- hallucination → 할루시네이션, retrieval → 리트리벌, pipeline → 파이프라인, deploy → 배포/디플로이
- reasoning → 추론, alignment → 얼라인먼트, multimodal → 멀티모달, open-source → 오픈소스
- 확실하지 않으면 영어 원문을 그대로 유지할 것

Return exactly {len(batch)} items:
[{{"index":1,"display_title":"...","one_line":"...","key_points":["..."],"why_important":"...","display_title_en":"...","one_line_en":"...","key_points_en":["..."],"why_important_en":"...","background":"...","background_en":"...","tags":["..."],"tags_en":["..."],"glossary":[{{"term":"...","desc":"..."}}],"glossary_en":[{{"term":"...","desc":"..."}}]}}]

Articles:
{batch_text}"""

    try:
        llm = get_llm(temperature=0.0, max_tokens=12288, thinking=False, json_mode=True)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=2)
        results = _parse_llm_json(content)
        if isinstance(results, dict):
            results = next((v for v in results.values() if isinstance(v, list)), [])
        if isinstance(results, list):
            if not results:
                label = "번역+요약" if translate else "요약"
                ci_warning(f"{label} 배치 {batch_idx + 1}: LLM이 빈 결과 반환")
                return None
            # dict가 아닌 항목(str 등)이 섞여 있으면 실패 처리
            dicts_only = [r for r in results if isinstance(r, dict)]
            if not dicts_only:
                label = "번역+요약" if translate else "요약"
                ci_warning(f"{label} 배치 {batch_idx + 1}: LLM 결과에 dict 없음 (type={type(results[0]).__name__})")
                return None
            return dicts_only
    except Exception as e:
        label = "번역+요약" if translate else "요약"
        titles = [a.get("title", "?")[:40] for a in batch]
        ci_warning(f"{label} 배치 {batch_idx + 1} 실패: {type(e).__name__}: {e}")
        print(f"    [WARN] 영향 기사: {titles}")
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
                kp = (key_points if isinstance(key_points, list) else [])[:5]
                if len(kp) < 3:
                    print(f"    [INFO] key_points {len(kp)} for: {batch[ridx].get('title', '')[:50]}")
                batch[ridx]["key_points"] = kp
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
                batch[ridx]["key_points_en"] = (kp_en if isinstance(kp_en, list) else [])[:5]
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
            tags_en = r.get("tags_en", [])
            if tags_en:
                batch[ridx]["tags_en"] = tags_en if isinstance(tags_en, list) else []
            # 폴백: tags_en이 없으면 tags에서 가져옴 (AI 뉴스 tags는 영어가 많이 섞여있음)
            if not batch[ridx].get("tags_en") and batch[ridx].get("tags"):
                batch[ridx]["tags_en"] = batch[ridx]["tags"]
            glossary = r.get("glossary", [])
            if glossary:
                batch[ridx]["glossary"] = glossary if isinstance(glossary, list) else []
            glossary_en = r.get("glossary_en", [])
            if glossary_en:
                batch[ridx]["glossary_en"] = glossary_en if isinstance(glossary_en, list) else []
            # 폴백: glossary_en이 없으면 glossary 사용
            if not batch[ridx].get("glossary_en") and batch[ridx].get("glossary"):
                batch[ridx]["glossary_en"] = batch[ridx]["glossary"]

    # 진단: results가 있는데 done=0이면 원인 출력
    if done == 0 and results:
        sample = results[0] if results else {}
        if isinstance(sample, dict):
            keys = list(sample.keys())[:6]
            idx_val = sample.get("index", sample.get("i", "MISSING"))
            has_one_line = bool(sample.get("one_line"))
            has_summary = bool(sample.get("summary"))
            print(f"    [DIAG] 적용 0건: results={len(results)}개, sample_keys={keys}, index={idx_val}, one_line={has_one_line}, summary={has_summary}")
        else:
            print(f"    [DIAG] 적용 0건: results={len(results)}개, sample_type={type(sample).__name__}")
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
                ci_warning(f"{label} 배치 {idx + 1} future 실패: {e}")
                continue
            done = _apply_batch_results(batch, results)
            if results is not None:
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
                    ci_warning(f"{label} 개별 재시도 실패: {e}")
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

    # 4차: 미번역 EN 기사 간이 번역 (제목 + one_line 최소 복구)
    if translate:
        untranslated = [a for a in articles if a.get("lang") != "ko" and a.get("display_title") == a.get("title") and a.get("title")]
        if untranslated:
            ci_warning(f"미번역 EN 기사 {len(untranslated)}개 감지 — 간이 번역 시도")
            llm = get_llm(temperature=0.0, max_tokens=2048, thinking=False, json_mode=True)
            for a in untranslated:
                try:
                    title = a["title"]
                    desc = (a.get("description") or "")[:500]
                    prompt = f"""다음 영어 뉴스 기사의 제목과 한줄 요약을 한국어로 번역/생성해주세요.

제목: {title}
본문 요약: {desc}

JSON 형식으로 응답:
{{"display_title": "한국어 뉴스 헤드라인 스타일 제목", "display_title_en": "{title}", "one_line": "한국어 한줄 요약 (누가+무엇을)", "one_line_en": "English one-line summary"}}"""
                    content = _llm_invoke_with_retry(llm, prompt, max_retries=2)
                    if content:
                        data = _parse_llm_json(content)
                        if isinstance(data, dict):
                            if data.get("display_title"):
                                a["display_title"] = data["display_title"]
                            if data.get("display_title_en"):
                                a["display_title_en"] = data["display_title_en"]
                            if data.get("one_line"):
                                a["one_line"] = data["one_line"]
                            if data.get("one_line_en"):
                                a["one_line_en"] = data["one_line_en"]
                            print(f"    [간이 번역 복구] {a['display_title'][:60]}")
                except Exception as e:
                    ci_warning(f"간이 번역 실패: {a.get('title', '')[:50]} — {e}")

    success = len([a for a in articles if a.get("summary") and len(a["summary"]) > 50])
    still_untranslated = len([a for a in articles if a.get("lang") != "ko" and a.get("display_title") == a.get("title") and a.get("title")]) if translate else 0
    if still_untranslated:
        ci_warning(f"[{label}] 미번역 EN 기사 {still_untranslated}개 잔존")
    print(f"  [{label}] 최종 {success}/{len(articles)}개 완료" + (f" (미번역 {still_untranslated}개)" if still_untranslated else ""))


# ─── LLM AI 관련성 필터 ───
def _llm_ai_filter_batch(articles: list[dict], source_key: str = "") -> set[int]:
    """기사 목록에서 AI 관련 기사 인덱스를 LLM으로 판별"""
    is_ko = source_key in SOURCE_SECTION_SOURCES
    is_ai_feed = source_key in CATEGORY_SOURCES and source_key not in NEEDS_AI_FILTER  # AI 전문 피드 (NEEDS_AI_FILTER 제외)
    article_text = ""
    for i, a in enumerate(articles):
        title = a.get("title") or ""
        body = a.get("body") or ""
        context = body[:200] if body else (a.get("description") or "")[:200]
        article_text += f"\n[{i}] {title} | {context}"

    if is_ko:
        prompt = f"""IMPORTANT: Output ONLY a valid JSON array of integers. No markdown.

한국어 뉴스 기사에서 AI 관련 기사 및 개발/IT 기술 기사를 골라내세요.

판단 기준: "이 기사가 AI/ML 또는 소프트웨어 개발/IT 기술과 관련이 있는가?"

애매하면 제거(EXCLUDE)하세요.

INCLUDE (포함):
- AI/ML 모델 출시, 업데이트, 벤치마크, 성능 비교
- AI 연구 논문, 기술 돌파, 새로운 아키텍처
- AI 기반 제품/서비스 출시 및 활용 사례
- AI 프레임워크/라이브러리 (PyTorch, LangChain, HuggingFace 등)
- AI 반도체/칩 (GPU, NPU, AI 가속기)
- AI 규제, 정책, 윤리, 저작권 논의
- AI 기업 투자, 인수합병, 파트너십
- AI 기업 CEO/경영진 관련 뉴스 (아모데이/Amodei, 샘 알트먼/Altman, 피차이/Pichai AI 관련 발언, 전략)
- AI 기업과 정부/국방부 관계 기사 (예: "국방부 차관, 앤트로픽 CEO에 전화" → INCLUDE, 군사 AI 계약/규제 논의)
- AI 제품/하드웨어 (AI 안경, AI 스피커, AI 웨어러블 등 AI가 핵심인 기기)
- AI가 산업/사회/교육/일자리에 미치는 영향
- AI 튜토리얼, 가이드, 활용법, 개발자 팁
- 로봇, 자율주행, 컴퓨터 비전 (AI 기술 활용)
- 데이터 인프라/파이프라인 (AI/ML 학습 목적)
- 소프트웨어 개발 도구, 프레임워크, 라이브러리, 에디터 (VS Code, Cursor, Vim 등)
- 프로그래밍 언어 업데이트, 새로운 기능, 릴리즈 노트
- 웹/앱/서버/클라우드 개발 기술 및 아키텍처
- 오픈소스 프로젝트 소개 및 활용법
- 개발자 경험담, 사이드 프로젝트, 코딩 팁
- DevOps, CI/CD, 인프라, 클라우드 서비스
- 바이브 코딩, AI 코딩 도구 활용기

EXCLUDE (제외):
- AI/개발과 무관한 비기술 기사 (부동산, 식품, 자기계발)
- 연예, 스포츠, 정치 (AI/기술 실질 내용 없음)
- 지자체/관광/지역 홍보, 정부 보도자료 (AI/기술 정책 제외)
- 인사이동, 부고, 단순 행사/세미나 공지
- 기사 태그에만 AI/IT가 있고 본문은 무관한 경우
- 하드웨어 리뷰 (스마트워치, 이어폰 등 개발과 무관한 가젯)
- CEO 보수/연봉 기사 (AI/기술 전략 내용 없이 보수 금액만 다룬 경우)

Articles:
{article_text}

AI 관련 기사의 인덱스를 JSON 배열로 반환:
[0, 2, 5]"""
    else:
        # AI 전문 피드 vs 일반 피드: 기본 판단 방향이 다름
        if is_ai_feed:
            source_context = f"""Source: "{source_key}" — This is a DEDICATED AI/tech news feed. Expect 80-100% of articles to be AI-related.
DEFAULT: INCLUDE. Only exclude if the article has ABSOLUTELY ZERO connection to AI, ML, or AI companies.

MANDATORY INCLUDE — these are ALWAYS AI-related regardless of angle:
- Any article mentioning AI companies by name (OpenAI, Anthropic, Google DeepMind, Meta AI, xAI, Mistral, Cohere, ByteDance AI, NVIDIA AI, etc.) — including their business deals, lawsuits, government contracts, corporate strategy, hiring, or pricing
- Any article with AI/ML/LLM/GPT/Claude/Gemini/neural/model in the title
- AI policy, regulation, ethics, safety, surveillance, copyright involving AI
- Data centers, compute infrastructure, chip exports (AI supply chain)
- AI benchmarks, hallucination research, AI agent evaluation
- AI impact on jobs, society, privacy, education

EXCLUDE ONLY: Pure lifestyle/sports/entertainment/gaming with truly zero AI substance (e.g., game streaming catalogs, esports, game reviews without AI angle).

CRITICAL REMINDER: If the title contains words like "AI", "LLM", "Claude", "GPT", "agent", "model", "Anthropic", "OpenAI", "neural", "ML", "cache", "memory" in an AI/ML context, or "LangChain", "vector database", "fine-tuning" — you MUST include it. Do NOT second-guess articles from this dedicated AI feed. When in doubt, INCLUDE."""
        else:
            source_context = """When in doubt, EXCLUDE."""

        prompt = f"""IMPORTANT: Output ONLY a valid JSON array of integers. No thinking, no markdown.

You are filtering news articles from international tech/AI media. Your job: keep articles DIRECTLY related to AI and adjacent advanced technology. Remove general tech news with no meaningful AI connection.

{source_context}

INCLUDE:
- AI, ML, LLMs, deep learning, neural networks, foundation models
- AI company news — ANY article about companies whose primary business is AI (OpenAI, Anthropic, Google DeepMind, Meta AI, xAI, Mistral, Cohere, etc.), including their business deals, lawsuits, partnerships, government contracts, corporate strategy, and hiring
- AI chips, GPUs, TPUs, NPUs, AI-specific hardware and infrastructure (including chip export controls)
- AI regulation, policy, safety, ethics, government AI strategy
- Cloud AI services, AI APIs, AI developer tools and frameworks
- AI-powered products, features, and applications (AI glasses, AI assistants, AI-generated content, AI search, etc.)
- Robotics, autonomous systems, computer vision
- Data infrastructure, AI data centers, and tools for AI/ML
- AI research, benchmarks, new techniques
- Startups and funding in AI/ML space
- Science and research with clear AI/ML connection
- Social impact OF AI (AI and jobs, AI surveillance, AI content moderation, AI deepfakes)

EXCLUDE:
- General consumer tech (phone reviews, gadgets, apps) with no AI angle
- Generic software updates or features unrelated to AI
- Pure cybersecurity news without AI connection
- Business/finance of NON-AI companies with no AI substance
- Lifestyle, entertainment, sports, celebrity news
- Non-tech politics or social issues
- Articles where "AI" is mentioned only in passing, not as the main topic

Articles:
{article_text}

Return the indices as a JSON array:
[0, 2, 5]"""

    try:
        llm = get_llm(temperature=0.0, max_tokens=4096, thinking=False, json_mode=True)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=1)
        result = _parse_llm_json(content)
        if isinstance(result, list):
            return set(int(idx) for idx in result if isinstance(idx, (int, float)))
    except Exception as e:
        ci_warning(f"LLM AI 필터 실패 -> 전체 통과: {e}")
    # 실패 시 전체 통과 (AI 관련으로 간주)
    return set(range(len(articles)))


def _llm_filter_sources(sources: dict[str, list[dict]]) -> None:
    """Tier 3 + NEEDS_AI_FILTER 소스만 LLM AI 필터링. 나머지 Tier 1/2는 AI 전문 피드이므로 필터 생략."""
    total_marked = 0
    # Tier 1/2 (CATEGORY_SOURCES - NEEDS_AI_FILTER): AI 전문 피드 → 필터 없이 전체 통과
    for key, articles in sources.items():
        if key in CATEGORY_SOURCES and key not in NEEDS_AI_FILTER:
            for a in articles:
                a["_ai_filtered"] = False
    # Tier 3 (SOURCE_SECTION_SOURCES) + NEEDS_AI_FILTER 소스: LLM AI 필터링 적용
    tasks = []
    for key, articles in sources.items():
        if not articles:
            continue
        if key in CATEGORY_SOURCES and key not in NEEDS_AI_FILTER:
            continue  # AI 전문 피드 스킵 (NEEDS_AI_FILTER 제외)
        tasks.append((key, articles))

    def _filter_one(key: str, articles: list[dict]) -> tuple[str, int, int, int]:
        ai_indices = _llm_ai_filter_batch(articles, source_key=key)
        marked = 0
        passed_titles = []
        removed_titles = []
        for i, a in enumerate(articles):
            title = a.get("title") or "(제목 없음)"
            if i in ai_indices:
                a["_ai_filtered"] = False
                passed_titles.append(title)
            else:
                a["_ai_filtered"] = True
                marked += 1
                removed_titles.append(title)
        today_marked = sum(1 for i, a in enumerate(articles) if i not in ai_indices and _is_today(a))
        today_kept = sum(1 for i, a in enumerate(articles) if i in ai_indices and _is_today(a))
        # 상세 로그 출력
        total = len(articles)
        passed = total - marked
        print(f"  [AI 필터] {key}: {total}개 중 {passed}개 통과, {marked}개 비AI 마킹")
        if passed_titles:
            titles_str = ", ".join(f'"{t}"' for t in passed_titles[:10])
            suffix = f" 외 {len(passed_titles)-10}개" if len(passed_titles) > 10 else ""
            print(f"    ✓ 통과: {titles_str}{suffix}")
        if removed_titles:
            titles_str = ", ".join(f'"{t}"' for t in removed_titles[:10])
            suffix = f" 외 {len(removed_titles)-10}개" if len(removed_titles) > 10 else ""
            print(f"    ✗ 비AI 마킹: {titles_str}{suffix}")
        if today_marked > 0 or today_kept > 0:
            print(f"    (당일 기사: {today_kept}개 통과, {today_marked}개 비AI 마킹)")
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
                ci_warning(f"[{key}] LLM AI 필터 future 실패: {e}")
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
                ci_error(f"{node_name} 노드 실패 ({elapsed:.1f}s): {type(e).__name__}: {e}")
                result = {"errors": [f"{node_name}: {e}"]}
            elapsed = time.time() - t0
            # 방어: 노드가 None이나 비-dict를 반환한 경우 빈 dict로 대체
            if not isinstance(result, dict):
                ci_warning(f"{node_name} 노드가 dict가 아닌 {type(result).__name__}을 반환 -> 빈 dict로 대체")
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
    # 소스별 기사 수집 현황 (날짜 필터는 tools.py 수집 단계에서 처리)
    print(f"\n  {'소스':<22} {'전체':>4}  {'당일':>4}")
    print(f"  {'─'*34}")
    total_all = 0
    total_today = 0
    for key, articles in sources.items():
        today_count = sum(1 for a in articles if _is_today(a))
        total_all += len(articles)
        total_today += today_count
        if len(articles) > 0:
            print(f"  {key:<22} {len(articles):>4}  {today_count:>4}")
    print(f"  {'─'*34}")
    print(f"  {'합계':<22} {total_all:>4}  {total_today:>4}\n")

    # 소스별 수집된 기사 제목 전체 출력
    ci_group(f"수집 기사 상세 목록 ({total_all}개)")
    for key, articles in sources.items():
        if not articles:
            continue
        print(f"  [수집] {key} ({len(articles)}개):")
        for a in articles:
            title = (a.get("title") or "제목없음")[:60]
            pub = a.get("published", "")
            est = "~" if a.get("date_estimated") else ""
            if pub:
                dt = _parse_published(pub)
                date_str = f"{est}{dt.strftime('%Y-%m-%d')}" if dt else "날짜없음"
            else:
                date_str = "날짜없음"
            print(f"    - \"{title}\" ({date_str})")
    ci_endgroup()

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
    ko_fallback_count = 0
    en_source_keys: set[str] = set()
    for key in CATEGORY_SOURCES:
        for a in state["sources"].get(key, []):
            if a.get("lang") != "ko":
                en_articles.append(a)
                en_source_keys.add(key)
            else:
                # 한국어 기사가 CATEGORY_SOURCES에 포함된 경우 폴백 처리
                en_source_keys.add(key)
                if not a.get("display_title"):
                    a["display_title"] = a.get("title", "")
                if not a.get("summary"):
                    body = a.get("body", "")
                    desc = a.get("description", "")
                    a["summary"] = (body[:200] if body else desc[:200]) if (body or desc) else ""
                if not a.get("one_line"):
                    a["one_line"] = a.get("title", "")
                ko_fallback_count += 1

    if en_articles:
        print(f"\n  --- EN 브랜치: {len(en_articles)}개 번역+요약 ---")
        _process_articles(en_articles, translate=True, batch_size=5)
    else:
        print("  [EN] 영어 기사 없음")
    if ko_fallback_count:
        print(f"  [EN] 한국어 기사 {ko_fallback_count}개 폴백 처리")

    # EN 번역/요약 결과 기사별 출력
    success = sum(1 for a in en_articles if a.get("display_title"))
    print(f"\n  [EN 요약] 완료 {success}/{len(en_articles)}개:")
    ci_group(f"EN 요약 결과 ({success}/{len(en_articles)}개)")
    for a in en_articles:
        orig_title = (a.get("title") or "")[:60]
        src = a.get("source_key", "")
        if a.get("display_title"):
            disp = (a.get("display_title") or "")[:60]
            print(f"    \u2713 \"{disp}\" \u2190 \"{orig_title}\" [{src}]")
        else:
            print(f"    \u2717 \uc2e4\ud328: \"{orig_title}\" [{src}]")

    ci_endgroup()

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

    # KO 요약 결과 기사별 출력
    all_ko = [a for key in SOURCE_SECTION_SOURCES for a in state["sources"].get(key, []) if a.get("lang") == "ko"]
    success = sum(1 for a in all_ko if a.get("display_title"))
    print(f"\n  [KO 요약] 완료 {success}/{len(all_ko)}개:")
    ci_group(f"KO 요약 결과 ({success}/{len(all_ko)}개)")
    for a in all_ko:
        disp = (a.get("display_title") or "")[:60]
        src = a.get("source_key", "")
        if disp:
            print(f"    \u2713 \"{disp}\" [{src}]")
        else:
            orig = (a.get("title") or "")[:60]
            print(f"    \u2717 \uc2e4\ud328: \"{orig}\" [{src}]")

    ci_endgroup()

    # 처리한 소스 키만 반환 -- 리듀서가 기존 state 에 머지
    partial_sources = {key: state["sources"][key] for key in ko_source_keys if key in state["sources"]}
    return {"sources": partial_sources}


# ─── 중복 제거 ───
DEDUP_THRESHOLD = 0.65  # 유사도 임계값 — 0.40→0.65: 한국어 AI 기사 공통 어휘 오탐 방지
EMBED_DEDUP_THRESHOLD = 0.92  # 임베딩 코사인 유사도 임계값 — 0.85→0.92: 주제 유사 기사 오탐 방지


def _cosine_sim(a: list[float], b: list[float]) -> float:
    """두 벡터의 코사인 유사도 (순수 Python)"""
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(x * x for x in b) ** 0.5
    return dot / (na * nb) if na and nb else 0.0


def _embed_texts(texts: list[str]) -> list[list[float]]:
    """텍스트 리스트 → 임베딩 벡터 리스트 (배치 1회 호출)"""
    try:
        emb = get_embeddings()
        return emb.embed_documents(texts)
    except Exception as e:
        print(f"  [임베딩 실패] {e} — Layer 6 스킵")
        return []


def _normalize_title(title: str) -> str:
    """비교용 제목 정규화: 소문자, 특수문자/공백 제거"""
    if not title:
        return ""
    import unicodedata
    t = unicodedata.normalize("NFKC", title.lower())
    t = re.sub(r'[^\w\s]', '', t)       # 특수문자 제거
    t = re.sub(r'\s+', ' ', t).strip()   # 공백 정리
    return t


# AI 도메인에서 변별력 없는 범용 토큰 — 중복 비교에서 제외
_DEDUP_STOPWORDS = {"ai", "ml", "llm", "gpt", "model", "deep", "learning", "new", "the", "for", "and", "with"}


def _extract_key_tokens(text: str) -> set[str]:
    """제목/요약에서 핵심 토큰(고유명사·숫자) 추출 — 중복 비교용"""
    if not text:
        return set()
    t = re.sub(r'[^\w\s]', ' ', text)
    tokens = set()
    for w in t.split():
        # 숫자 포함 토큰 (금액, 수량 등)
        if re.search(r'\d', w):
            tokens.add(re.sub(r'[^\d]', '', w))  # 순수 숫자만
        # 영문 고유명사 (2글자 이상, 첫 글자 대문자 or 전체 대문자)
        elif re.match(r'[A-Z]', w) and len(w) >= 2:
            low = w.lower()
            if low not in _DEDUP_STOPWORDS:
                tokens.add(low)
    return tokens


def _extract_url_key(link: str) -> str:
    """URL에서 쿼리/프래그먼트 제거한 정규화 키"""
    if not link:
        return ""
    from urllib.parse import urlparse
    p = urlparse(link)
    # 경로 끝 슬래시 제거 + 소문자
    path = p.path.rstrip("/").lower()
    return f"{p.netloc.lower()}{path}"


# 제목에서 "제품명 + 버전" 패턴 추출 — L7 엔티티 중복 감지용
PRODUCT_VERSION_RE = re.compile(
    r'(GPT-[\d.]+|Claude[\s-][\d.]+|Gemini[\s-][\d.]+|'
    r'Phi-[\d]+[\w-]*|LLaMA[\s-][\d.]+|Llama[\s-][\d.]+|Mistral[\s-][\w.]+|'
    r'DALL[·\-]?E[\s-]?[\d.]*|Sora[\s-]?[\d.]*|'
    r'Seedance[\s-]?[\d.]*|Helios[\s-]?[\d.]*|'
    r'GPT[\s-]?o[\d]+[\w-]*|Sonnet[\s-][\d.]+|Opus[\s-][\d.]+|Haiku[\s-][\d.]+|'
    r'Grok[\s-][\d.]+|Copilot[\s-][\d.]+|'
    r'Stable\s?Diffusion[\s-][\d.]+|Midjourney[\s-]?[Vv]?[\d.]+)',
    re.IGNORECASE
)


def _extract_product_versions(title: str) -> set[str]:
    """제목에서 제품+버전 엔티티를 추출하여 정규화된 집합으로 반환.
    예: 'OpenAI, GPT-5.4 전격 공개' → {'gpt-5.4'}"""
    if not title:
        return set()
    matches = PRODUCT_VERSION_RE.findall(title)
    # 정규화: 소문자, 공백→하이픈, 연속 하이픈 제거
    normalized = set()
    for m in matches:
        n = re.sub(r'\s+', '-', m.strip()).lower()
        n = re.sub(r'-+', '-', n)
        normalized.add(n)
    return normalized


def _deduplicate_candidates(candidates: list[dict], mark_only: bool = False, threshold: float | None = None) -> list[dict]:
    """다층 중복 제거 (현재 메인 파이프라인 노드에서는 호출되지 않음 -- 외부/테스트 용도):
    Layer 1 (L1): URL 완전 일치
    Layer 2 (L2): 원본 제목(영문) 유사도 (>=0.65)
    Layer 3 (L3): 번역 제목(한국어) 유사도 (>=0.65)
    Layer 4 (L4): one_line(한줄 요약) 유사도 (>=0.65)
    Layer 5 (L5): 핵심 토큰(고유명사 3개+숫자 1개) 겹침
    Layer 6 (L6): 임베딩 코사인 유사도 (>=0.92)
    Layer 7 (L7): 제목 엔티티(제품+버전) 일치 + one_line 토큰 30% 겹침
    발행일 가장 오래된(원본) 기사 유지.
    중복 판정 시 _dedup_of 에 원본 기사 link 저장.
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

    # Layer 6 준비: 전체 후보 임베딩 (배치 1회)
    embed_texts = [
        (c.get("title", "") + " " + c.get("one_line", "")).strip()
        for c in sorted_cands
    ]
    embeddings = _embed_texts(embed_texts)
    embed_map: dict[int, list[float]] = {}
    if embeddings and len(embeddings) == len(sorted_cands):
        for i, vec in enumerate(embeddings):
            embed_map[id(sorted_cands[i])] = vec
    embed_layer6 = bool(embed_map)
    if embed_layer6:
        print(f"  [임베딩] {len(embed_map)}개 벡터 생성 완료 — Layer 6 활성")

    kept: list[dict] = []
    seen_urls: set[str] = set()
    removed = 0
    layer6_count = 0
    layer7_count = 0
    dupes: list[dict] = []

    for c in sorted_cands:
        # Layer 1: URL 완전 일치
        url_key = _extract_url_key(c.get("link", ""))
        if url_key and url_key in seen_urls:
            removed += 1
            c["_deduped"] = True
            c["_dedup_layer"] = "L1_url"
            # URL 일치 — 같은 URL을 가진 kept 기사 찾기
            for k in kept:
                if _extract_url_key(k.get("link", "")) == url_key:
                    c["_dedup_of"] = k.get("link", "")
                    break
            dupes.append(c)
            continue

        # L2 준비: 원본 제목(영문) 유사도
        orig_title = _normalize_title(c.get("title", ""))
        # L3 준비: 번역 제목(한국어) 유사도
        disp_title = _normalize_title(c.get("display_title") or c.get("title", ""))
        # L4 준비: one_line 정규화
        c_oneline = _normalize_title(c.get("one_line", ""))
        # L5 준비: 핵심 토큰 (고유명사·숫자)
        c_key_tokens = _extract_key_tokens(c.get("title", "") + " " + c.get("display_title", ""))
        # L6 준비: 임베딩 벡터
        c_embed = embed_map.get(id(c))
        # L7 준비: 제목 엔티티(제품+버전)
        c_product_versions = _extract_product_versions(
            c.get("display_title", "") + " " + c.get("title", "")
        )

        is_dup = False
        matched_kept = None
        match_layer = ""
        for k in kept:
            # L2: 원본 제목 비교
            k_orig = _normalize_title(k.get("title", ""))
            if orig_title and k_orig and SequenceMatcher(None, orig_title, k_orig).ratio() >= thr:
                is_dup = True
                matched_kept = k
                match_layer = "L2_orig_title"
                break
            # L3: 번역 제목 비교
            k_disp = _normalize_title(k.get("display_title") or k.get("title", ""))
            if disp_title and k_disp and SequenceMatcher(None, disp_title, k_disp).ratio() >= thr:
                is_dup = True
                matched_kept = k
                match_layer = "L3_disp_title"
                break
            # L4: one_line(한줄 요약) 유사도 + 제목 고유명사 가드
            if c_oneline:
                k_oneline = _normalize_title(k.get("one_line", ""))
                if k_oneline and SequenceMatcher(None, c_oneline, k_oneline).ratio() >= 0.65:
                    # 가드: 양쪽 제목에 고유명사가 있으면 1개 이상 공유 필수
                    # (서로 다른 주체의 유사 구조 문장 오탐 방지: "A, 소송 제기" vs "B, 소송 제기")
                    k_key_tokens_l4 = _extract_key_tokens(k.get("title", "") + " " + k.get("display_title", ""))
                    c_names_l4 = {t for t in c_key_tokens if not t.isdigit()}
                    k_names_l4 = {t for t in k_key_tokens_l4 if not t.isdigit()}
                    if not c_names_l4 or not k_names_l4 or (c_names_l4 & k_names_l4):
                        is_dup = True
                        matched_kept = k
                        match_layer = "L4_oneline"
                        break
            # L5: 핵심 토큰 겹침 (고유명사 3개 이상 + 숫자 1개 이상 공유)
            if len(c_key_tokens) >= 3:
                k_key_tokens = _extract_key_tokens(k.get("title", "") + " " + k.get("display_title", ""))
                if len(k_key_tokens) >= 3:
                    overlap = c_key_tokens & k_key_tokens
                    names_overlap = sum(1 for t in overlap if not t.isdigit())
                    nums_overlap = sum(1 for t in overlap if t.isdigit())
                    if names_overlap >= 3 and nums_overlap >= 1:
                        is_dup = True
                        matched_kept = k
                        match_layer = "L5_key_tokens"
                        break
            # L6: 임베딩 코사인 유사도
            if embed_layer6 and c_embed:
                k_embed = embed_map.get(id(k))
                if k_embed and _cosine_sim(c_embed, k_embed) >= EMBED_DEDUP_THRESHOLD:
                    is_dup = True
                    matched_kept = k
                    match_layer = "L6_embedding"
                    layer6_count += 1
                    break
            # L7: 제목 엔티티(제품+버전) 일치 + one_line 토큰 겹침
            if c_product_versions:
                k_product_versions = _extract_product_versions(
                    k.get("display_title", "") + " " + k.get("title", "")
                )
                shared_products = c_product_versions & k_product_versions
                if shared_products:
                    # 같은 제품+버전 — one_line key token overlap으로 동일 이벤트인지 확인
                    c_ol_tokens = _extract_key_tokens(c.get("one_line", "") + " " + c.get("display_title", ""))
                    k_ol_tokens = _extract_key_tokens(k.get("one_line", "") + " " + k.get("display_title", ""))
                    if c_ol_tokens and k_ol_tokens:
                        union_size = len(c_ol_tokens | k_ol_tokens)
                        overlap_ratio = len(c_ol_tokens & k_ol_tokens) / union_size if union_size else 0
                        if overlap_ratio >= 0.30:
                            is_dup = True
                            matched_kept = k
                            match_layer = "L7_title_entity"
                            layer7_count += 1
                            break

        if is_dup:
            removed += 1
            c["_deduped"] = True
            c["_dedup_of"] = matched_kept.get("link", "") if matched_kept else ""
            c["_dedup_layer"] = match_layer
            dupes.append(c)
        else:
            c["_deduped"] = False
            kept.append(c)
            if url_key:
                seen_urls.add(url_key)

    if removed > 0:
        layer_detail = []
        if layer6_count:
            layer_detail.append(f"L6 임베딩: {layer6_count}건")
        if layer7_count:
            layer_detail.append(f"L7 엔티티: {layer7_count}건")
        layer_msg = f" ({', '.join(layer_detail)})" if layer_detail else ""
        print(f"  [중복 제거] {removed}개 중복 기사 제거 ({len(candidates)} → {len(kept)}개){layer_msg}")

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

_CLASSIFY_PROMPT = """JSON array of {count} objects. No markdown.

Classify each article into ONE category:

■ models_products — Announces a NEW model/product/tool/feature release, OR first wide rollout of a new feature.
  Only if a NEW usable artifact is launched/made available. NOT: stats, investment, testing, blueprints, strategy.
  Includes: new framework/library release, open-source code release, new API endpoint, new app/platform launch.
  NOT: events/meetups/community gatherings, non-AI product launches (e.g. pure gaming, hardware unrelated to AI).

■ research — Paper, algorithm, benchmark, technical mechanism analysis, tutorial/how-to guide.
  Explains HOW something works or teaches HOW to build something. NOT: social impact trends, security vulnerabilities.
  Includes: papers, studies, proposed architectures without released artifact, coding tutorials.
  Includes: paper-based tools/methods (e.g. academic audit tool from a paper → research, not models_products).
  Includes: academic/lab origin (Stanford, MIT, CMU, Google AI/DeepMind, MSR, FAIR, IBM Research) releasing frameworks/models — research, not models_products.
  Includes: lightweight/optimization/edge-device research even with released weights (core contribution is the METHOD, not the product).
  NOT: corporate data/tech licensing or partnership deals, concept comparison/explainer articles without novel method.

■ industry_business — Everything else: funding, M&A, regulation, trends, milestones, strategy, security issues.
  Includes: pricing/subscription changes, user growth stats, partnerships, lawsuits, policy.
  Includes: product events/meetups/fan meetings, community announcements, conferences.
  Includes: company data/tech licensing deals, concept comparison/explainer articles (e.g. "X vs Y 차이점").

⚠ Product name in title ≠ models_products. Only actual NEW releases count.
⚠ Mixed article (blueprint + model release) → classify by the PRIMARY news.
⚠ New framework/tool "공개"/"release"/"launch" → models_products (not research).
⚠ Paper + released code/weights → models_products ONLY if from a commercial entity shipping a product. Academic/lab paper + code → research.
⚠ Paper-based tool/method without downloadable artifact → research (not models_products).
⚠ Research lab (university or corporate research division) releasing a framework/model → research. Commercial product launch → models_products.
⚠ Company using/licensing tech or data for business = industry_business. Concept explainer comparing X vs Y = industry_business. Only novel algorithm/method analysis = research.

Examples: "가우스2 공개"→models_products | "ChatGPT 9억명 돌파"→industry_business | "GRPO 논문"→research | "청사진 공개"→industry_business | "AI 쇼핑 테스트"→industry_business | "GPT-5 API 출시"→models_products | "LLM 파인튜닝 구축 가이드"→research | "AI 에이전트 OS 튜토리얼"→research | "소송 제기"→industry_business | "저작권 판결"→industry_business | "Self-Flow 기술로 훈련 효율 향상"→research | "새 AI Mode 전역 확대 출시"→models_products | "AI 검색 3억명 돌파"→industry_business | "에이전트 AI 프레임워크 공개"→models_products | "Claude Code 구독 가격 변경"→industry_business | "CiteAudit 논문, 환각성 인용 문제"→research | "OpenClaw 팬 미팅"→industry_business | "GeForce NOW 15종 신규 게임"→industry_business | "포켓몬Go 데이터, 배달 로봇에 제공"→industry_business | "MCP와 스킬의 차이점은?"→industry_business | "스탠포드 연구진, 온디바이스 AI 에이전트 프레임워크 공개"→research | "IBM Research, 경량 음성 모델 공개, 에지 최적화"→research | "Google AI, 연구 도구 공개"→research | "Google Maps, 새 AI 기능 추가"→models_products | "Microsoft Copilot Health 출시"→models_products

Articles:
{article_text}

[{{"i":0,"cat":"..."}},{{"i":1,"cat":"..."}},...,{{"i":{last_idx},"cat":"..."}}]"""

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
    """순위(0-based)에서 점수를 선형 보간. 1위=100, 꼴등=30."""
    if total <= 1:
        return 100
    return round(30 + 70 * (total - 1 - rank) / max(total - 1, 1))


def _rank_category(articles: list[dict], category: str) -> list[tuple[int, int, int]]:
    """카테고리 내 기사들의 순위를 LLM으로 매김.

    Returns: list of (local_idx, rank_0based, score)
    """
    count = len(articles)
    if count == 0:
        return []
    if count == 1:
        return [(0, 0, 100)]

    # 기사 수에 따라 컨텍스트 축소 (Flash 출력 잘림 방지)
    # 40개 초과: 제목만, 25~40: 150자, 25 이하: 500자
    if count > 40:
        ctx_len = 0
    elif count > 25:
        ctx_len = 150
    else:
        ctx_len = 500

    article_text = ""
    for i, a in enumerate(articles):
        title = a.get("display_title") or a.get("title", "")
        if ctx_len > 0:
            body = a.get("body", "")
            context = body[:ctx_len] if body else (a.get("description", "") or "")[:150]
            article_text += f"\n[{i}] {title} | {context}"
        else:
            article_text += f"\n[{i}] {title}"

    prompt = _RANK_PROMPT.format(
        count=count,
        count_minus_1=count - 1,
        article_text=article_text,
    )

    try:
        token_budget = max(6144, count * 150)
        llm = get_llm(temperature=0.0, max_tokens=token_budget, thinking=False, json_mode=True)
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
        ci_warning(f"RANKER 폴백 {category}: {e} — published 최신순 사용")
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


CLASSIFY_BATCH_SIZE = 5


def _classify_batch(batch: list[dict], offset: int) -> list[dict]:
    """분류 전용 LLM 호출. 각 기사의 카테고리를 결정하여 반환.

    Returns list of dicts with keys: _global_idx, cat
    """
    article_text = ""
    for i, a in enumerate(batch):
        title = a.get("display_title") or a.get("title", "")
        body = a.get("body", "")
        context = body[:200] if body else (a.get("description", "") or "")[:150]
        article_text += f"\n[{i}] {title} | {context}"

    prompt = _CLASSIFY_PROMPT.format(
        article_text=article_text,
        count=len(batch),
        last_idx=len(batch) - 1,
    )
    try:
        llm = get_llm(temperature=0.0, max_tokens=2048, thinking=False, json_mode=True)
        content = _llm_invoke_with_retry(llm, prompt, max_retries=2)
        results = _parse_llm_json(content)
        if not isinstance(results, list):
            results = next((v for v in results.values() if isinstance(v, list)), [])

        if not results:
            preview = str(content)[:150] if content else "EMPTY"
            ci_warning(f"CLASSIFY 빈 응답 offset={offset}, size={len(batch)}, raw={preview}")
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
        ci_warning(f"CLASSIFY ERROR 배치 offset={offset}, size={len(batch)}: {type(e).__name__}: {e}")
        return []


def _classify_batch_with_retry(batch: list[dict], offset: int) -> list[dict]:
    """분류 배치 재시도: 실패 시 대기 후 재시도 → 배치 분할 → 개별 재시도."""
    results = _classify_batch(batch, offset)
    if not results:
        print(f"    [CLASSIFY RETRY] 동일 배치 재시도 (offset={offset}, size={len(batch)})")
        results = _classify_batch(batch, offset)
    if not results:
        if len(batch) <= 1:
            return []
        mid = len(batch) // 2
        print(f"    [CLASSIFY RETRY] 배치 분할: {len(batch)}개 -> {mid} + {len(batch) - mid}")
        left = _classify_batch(batch[:mid], offset)
        right = _classify_batch(batch[mid:], offset + mid)
        results = left + right
    # 부분 누락 개별 재시도 (분할 후 여전히 누락된 기사 포함)
    if len(results) < len(batch):
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

    # 다층 중복제거: mark_only=True → 제거 대신 _deduped=True 마킹 (ranker에서 제외)
    candidates = _deduplicate_candidates(candidates, mark_only=True)

    today_count = 0
    for c in candidates:
        c["_is_today"] = _is_today(c)
        if c["_is_today"]:
            today_count += 1

    print(f"  [분류] {len(candidates)}개 분류 중... (당일 {today_count}개, 중복제거 없음)")

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
                    ci_warning(f"CLASSIFY ERROR 배치 {batch_idx+1} future 실패: {e}")

            # 분류 결과를 기사에 적용
            for r in cls_results:
                local_idx = r["_global_idx"]
                if 0 <= local_idx < len(classify_articles):
                    original_idx = classify_offsets[local_idx]
                    candidates[original_idx]["_llm_category"] = r["cat"]

        classified = sum(1 for a in candidates if a.get("_llm_category"))
        print(f"    [분류] 완료: {classified}/{len(candidates)}개 분류됨")

    # 미분류 기사에 기본 카테고리 부여 (중복 기사 포함)
    unclassified_count = 0
    for a in candidates:
        if not a.get("_llm_category") or a["_llm_category"] not in VALID_CATEGORIES:
            a["_llm_category"] = "industry_business"
            unclassified_count += 1
    if unclassified_count:
        print(f"    [분류] 미분류 {unclassified_count}개 → industry_business 기본값 적용")

    # 카테고리별 그룹 통계 + 편중 경고
    total_cands = len(candidates)
    for cat in VALID_CATEGORIES:
        cat_count = sum(1 for a in candidates if a.get("_llm_category") == cat)
        ratio = cat_count / total_cands if total_cands else 0
        print(f"    [그룹] {cat}: {cat_count}개")
        if ratio > 0.60:
            ci_warning(f"분류 편향 경고 {cat}: {cat_count}/{total_cands}개 ({ratio:.0%}) — 60% 초과")

    # ── QA: 중복 제거 결과 ──
    deduped_articles = [a for a in candidates if a.get("_deduped")]
    if deduped_articles:
        print(f"    ── [QA] 중복 감지 {len(deduped_articles)}건 ──")
        for a in deduped_articles:
            title = a.get("display_title") or a.get("title", "(제목 없음)")
            orig = a.get("_dedup_of", "")
            # 원본 기사 제목 찾기
            orig_title = ""
            if orig:
                for k in candidates:
                    if k.get("link") == orig and not k.get("_deduped"):
                        orig_title = k.get("display_title") or k.get("title", "")
                        break
            layer = a.get("_dedup_layer", "?")
            if orig_title:
                print(f"      - {title}")
                print(f"        → 원본: {orig_title} [{layer}]")
            else:
                print(f"      - {title} (원본 URL: {orig[:60]}) [{layer}]")
    else:
        print("    ── [QA] 중복 감지 0건 ──")

    # ── QA: 카테고리별 기사 제목 + 의심 분류 경고 ──
    _SUSPECT_KEYWORDS = {
        "research": ["투자", "인수", "합병", "매출", "IPO", "펀딩", "시장", "매각", "계약"],
        "industry_business": ["논문", "알고리즘", "벤치마크", "데이터셋", "arxiv", "학습률", "파인튜닝"],
        "models_products": [],
    }
    suspect_count = 0
    ci_group("QA: 카테고리별 분류 기사 목록")
    print("    ── [QA] 카테고리별 분류 기사 목록 ──")
    for cat in sorted(VALID_CATEGORIES):
        cat_articles = [a for a in candidates if a.get("_llm_category") == cat]
        print(f"    [{cat}] ({len(cat_articles)}건)")
        for a in cat_articles:
            title = a.get("display_title") or a.get("title", "(제목 없음)")
            flags = []
            if a.get("_ai_filtered"):
                flags.append("비AI")
            if a.get("_deduped"):
                flags.append("중복")
            flag_str = f" [{', '.join(flags)}]" if flags else ""
            # 의심 키워드 검사
            keywords = _SUSPECT_KEYWORDS.get(cat, [])
            matched = [kw for kw in keywords if kw.lower() in title.lower()]
            warn = ""
            if matched:
                suspect_count += 1
                warn = f" ⚠ 의심({', '.join(matched)})"
            print(f"      - {title}{flag_str}{warn}")
    if suspect_count:
        print(f"    ── [QA] 의심 분류 {suspect_count}건 감지 — 수동 확인 권장 ──")
    else:
        print("    ── [QA] 의심 분류 없음 ──")
    ci_endgroup()

    # ── QA: 제목 품질 검증 ──
    ci_group("QA: 제목 품질 검증")
    print("    ── [QA] 제목 품질 검증 ──")
    _title_issues = 0
    _ellipsis_ko_titles = []   # '...'로 끝나는 KO 제목 목록
    _ellipsis_en_titles = []   # '...'로 끝나는 EN 제목 목록
    _plain_ko_titles = []      # '...'로 안 끝나는 KO 제목 목록
    _untranslated_count = 0
    _no_oneline_count = 0
    _too_long_count = 0

    _EN_ONLY_PATTERN = re.compile(r'^[A-Za-z0-9\s\-\'",.!?:;()&@#$%*/+\[\]{}|\\~`^]+$')

    for a in candidates:
        if a.get("_deduped") or a.get("_ai_filtered"):
            continue
        d_title = a.get("display_title", "")
        d_title_en = a.get("display_title_en", "")
        one_line = a.get("one_line", "")
        original_title = a.get("title", "")
        flags = []

        # 1) '...' 사용 분류 — KO/EN 분리 추적
        ko_ellipsis = d_title.rstrip().endswith("...") or d_title.rstrip().endswith("…")
        en_ellipsis = d_title_en.rstrip().endswith("...") or d_title_en.rstrip().endswith("…")
        if ko_ellipsis:
            _ellipsis_ko_titles.append(d_title)
        elif d_title:
            _plain_ko_titles.append(d_title)
        if en_ellipsis:
            _ellipsis_en_titles.append(d_title_en)

        # 2) 미번역 검사: display_title이 영어만으로 구성 (EN→KO 번역 실패)
        if d_title and _EN_ONLY_PATTERN.match(d_title):
            _untranslated_count += 1
            flags.append("미번역")

        # 3) one_line 누락 (알림 body에 사용되므로 중요)
        if not one_line:
            _no_oneline_count += 1
            flags.append("one_line 없음")

        # 4) 제목 과도하게 긴 경우 (80자 초과)
        if len(d_title) > 80:
            _too_long_count += 1
            flags.append(f"제목 {len(d_title)}자")

        if flags:
            _title_issues += 1
            print(f"      ⚠ [{', '.join(flags)}] {d_title[:60] or original_title[:60]}")

    # 말줄임표 사용 기사 목록 출력 (pipeline-qa가 적절성 판단)
    _total_active = len(_ellipsis_ko_titles) + len(_plain_ko_titles)
    print(f"    [제목 통계] 말줄임표('...') KO: {len(_ellipsis_ko_titles)}건, EN: {len(_ellipsis_en_titles)}건 / 전체 {_total_active}건")
    if _ellipsis_ko_titles:
        print(f"    [말줄임표 KO] '...'로 끝나는 제목 ({len(_ellipsis_ko_titles)}건):")
        for t in _ellipsis_ko_titles:
            print(f"      ✓ {t}")
    if _ellipsis_en_titles:
        print(f"    [말줄임표 EN] '...'로 끝나는 제목 ({len(_ellipsis_en_titles)}건):")
        for t in _ellipsis_en_titles:
            print(f"      ✓ {t}")
    if _plain_ko_titles:
        print(f"    [일반 KO] '...' 없는 제목 ({len(_plain_ko_titles)}건):")
        for t in _plain_ko_titles:
            print(f"      - {t}")

    if _untranslated_count:
        ci_warning(f"미번역 제목 {_untranslated_count}건 — 영어 원문이 display_title에 그대로 사용됨")
    if _no_oneline_count:
        ci_warning(f"one_line 누락 {_no_oneline_count}건 — 알림 body 비어 있을 수 있음")
    if _too_long_count:
        print(f"    [제목 통계] 80자 초과 제목: {_too_long_count}건")
    if _title_issues:
        print(f"    ── [QA] 제목 품질 이슈 {_title_issues}건 감지 ──")
    else:
        print("    ── [QA] 제목 품질 이슈 없음 ──")
    ci_endgroup()

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
                ci_error(f"RANKER ERROR {cat}: {e}")

    # deduped 기사: 0점 (순위 없음)
    for a in candidates:
        if a.get("_deduped"):
            a["_total_score"] = 0
            a["_rank"] = 9999

    # 미랭킹 기사 폴백
    for a in candidates:
        if "_total_score" not in a:
            a["_total_score"] = 20
            a["_rank"] = 9999

    # ── 카테고리별 랭킹 결과 상세 로그 ──
    ci_group("카테고리별 랭킹 결과 상세")
    for cat in ("research", "models_products", "industry_business"):
        ranked_in_cat = [
            a for a in candidates
            if not a.get("_deduped")
            and a.get("_llm_category", "industry_business") == cat
            and a.get("_rank", 9999) < 9999
        ]
        ranked_in_cat.sort(key=lambda a: a.get("_rank", 9999))
        if ranked_in_cat:
            print(f"  [랭킹] {cat} ({len(ranked_in_cat)}개):")
            for a in ranked_in_cat:
                title = (a.get("display_title") or a.get("title", ""))[:60]
                src = a.get("source_key", "?")
                print(f"    {a.get('_rank', '?')}위 ({a.get('_total_score', 0)}점): \"{title}\" [{src}]")
    ci_endgroup()

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


def _normalize_entity_type(t: str) -> str | None:
    """엔티티 타입 퍼지 매칭: 'models' → 'model' 등"""
    if not t:
        return None
    t = t.lower().strip()
    if t in _ENTITY_TYPES:
        return t
    # 복수형 → 단수형
    if t.endswith("s") and t[:-1] in _ENTITY_TYPES:
        return t[:-1]
    # 흔한 동의어
    _ALIASES = {"org": "company", "organization": "company", "lib": "framework", "library": "framework", "tool": "framework"}
    return _ALIASES.get(t)


def _extract_entities_batch(batch: list[dict], batch_idx: int) -> list[dict]:
    """단일 배치에서 엔티티 추출 + topic_cluster_id 부여. 실패 시 재시도 후 원본 반환."""
    def _build_prompt(articles: list[dict]) -> str:
        article_text = ""
        for i, a in enumerate(articles):
            title = a.get("display_title") or a.get("title", "")
            one_line = a.get("one_line") or a.get("one_line_en") or ""
            kps = a.get("key_points", [])
            kps_str = (" | " + " | ".join(kps[:2])) if isinstance(kps, list) and kps else ""
            article_text += f"\n[{i}] {title} | {one_line}{kps_str}"
        return _ENTITY_EXTRACT_PROMPT.format(article_text=article_text, count=len(articles))

    def _apply_results(results: list, articles: list[dict]) -> int:
        if isinstance(results, dict):
            results = next((v for v in results.values() if isinstance(v, list)), [])
        if not isinstance(results, list):
            return 0

        # index -> result 매핑
        idx_map = {}
        for r in results:
            if isinstance(r, dict) and "index" in r:
                try:
                    idx_map[int(r["index"])] = r
                except (ValueError, TypeError):
                    pass
        # index 매칭 실패 시 순서 기반 폴백
        if not idx_map and len(results) == len(articles):
            for i, r in enumerate(results):
                if isinstance(r, dict):
                    idx_map[i] = r

        applied = 0
        for i, a in enumerate(articles):
            r = idx_map.get(i)
            if not r:
                continue
            entities = r.get("entities", [])
            valid_entities = [
                e for e in entities
                if isinstance(e, dict) and e.get("name") and _normalize_entity_type(e.get("type", ""))
            ]
            for e in valid_entities:
                e["type"] = _normalize_entity_type(e["type"])
            if valid_entities:
                a["entities"] = valid_entities
            cluster = r.get("topic_cluster_id", "")
            if isinstance(cluster, str) and "/" in cluster:
                a["topic_cluster_id"] = cluster
            if valid_entities or a.get("topic_cluster_id"):
                applied += 1
        return applied

    try:
        llm = get_llm(temperature=0, max_tokens=4096, thinking=False, json_mode=True)
        content = _llm_invoke_with_retry(llm, _build_prompt(batch), max_retries=2)
        results = _parse_llm_json(content)
        applied = _apply_results(results, batch)
        print(f"    [entity batch {batch_idx}] {applied}/{len(batch)}개 적용")

        # 실패한 기사만 재시도 (배치 절반 이상 실패 시)
        missed = [a for a in batch if not a.get("entities")]
        if missed and len(missed) >= len(batch) // 2:
            print(f"    [entity batch {batch_idx}] {len(missed)}개 재시도...")
            content2 = _llm_invoke_with_retry(llm, _build_prompt(missed), max_retries=2)
            results2 = _parse_llm_json(content2)
            retry_applied = _apply_results(results2, missed)
            print(f"    [entity batch {batch_idx}] 재시도 {retry_applied}/{len(missed)}개 적용")

            # 배치 재시도 후에도 실패한 기사: 개별 단위 폴백
            still_missed = [a for a in missed if not a.get("entities")]
            if still_missed:
                print(f"    [entity batch {batch_idx}] {len(still_missed)}개 개별 재시도...")
                individual_ok = 0
                for a in still_missed:
                    try:
                        c = _llm_invoke_with_retry(llm, _build_prompt([a]), max_retries=2)
                        r = _parse_llm_json(c)
                        if _apply_results(r, [a]) > 0:
                            individual_ok += 1
                    except Exception as e:
                        title = a.get("title", "?")[:40]
                        print(f"      [entity 개별 실패] {title}: {type(e).__name__}")
                print(f"    [entity batch {batch_idx}] 개별 재시도 {individual_ok}/{len(still_missed)}개 적용")

    except Exception as e:
        print(f"    [entity batch {batch_idx}] 실패, 스킵: {e}")

    return batch


@_safe_node("entity_extractor")
def entity_extractor_node(state: NewsGraphState) -> dict:
    """기사별 엔티티 추출 + topic_cluster_id 부여. 5개씩 배치 병렬 처리."""
    candidates = state.get("scored_candidates", [])
    if not candidates:
        return {"scored_candidates": []}

    # 5개씩 배치 분할 (Gemini 안정성 향상)
    batch_size = 5
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
CATEGORY_TOP_N = 20



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

    # 3) N개 제한 적용
    selected = selected[:n]

    # 4) 날짜(일) 최신순 → 같은 날짜+점수 같으면 시간 최신순
    selected.sort(key=lambda a: (_day_key(a), a.get("_total_score", 0), _time_key(a)), reverse=True)
    return selected


@_safe_node("selector")
def selector_node(state: NewsGraphState) -> dict:
    """하이라이트 Top 3 선정 + 카테고리별 Top 25 + 품질 검증 (기존 ranker+classifier 통합)"""
    all_candidates = state.get("scored_candidates", [])
    category_order = ["research", "models_products", "industry_business"]

    # 카테고리 소스(Tier 1/2): 5일치 표시, 소스별 섹션(Tier 3)은 assembler에서 최신 10개 처리
    # 중복(_deduped) 기사도 제외 -- ranker에서 0점이지만 기사 수 부족 시 노출 가능하므로 명시적 필터
    candidates = [c for c in all_candidates if _is_recent(c, days=5) and not c.get("_deduped")]
    older = sum(1 for c in all_candidates if not _is_recent(c, days=5))
    deduped_excluded = sum(1 for c in all_candidates if c.get("_deduped"))
    if older:
        print(f"  [선정] 5일 이전 기사 {older}개 표시 제외 (수집 보존)")
    if deduped_excluded:
        print(f"  [선정] 중복 기사 {deduped_excluded}개 제외")

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
            and c.get("one_line")  # 요약 실패 기사 하이라이트 제외
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

    # ── Step 2: 하이라이트 제외 + 비AI 기사 제외 → 카테고리별 분류 ──
    highlight_ids = set(id(c) for c in highlights)
    remaining = [c for c in candidates if id(c) not in highlight_ids]
    # 비AI 마킹 기사 제외
    ai_excluded = 0
    filtered_remaining: list[dict] = []
    for a in remaining:
        if a.get("_ai_filtered"):
            ai_excluded += 1
        else:
            filtered_remaining.append(a)
    if ai_excluded:
        print(f"  [선정] 비AI 마킹 기사 {ai_excluded}개 카테고리 목록에서 제외")
    remaining = filtered_remaining

    categorized: dict[str, list[dict]] = {k: [] for k in category_order}
    for a in remaining:
        cat = a.get("_llm_category", "")
        if cat in categorized:
            categorized[cat].append(a)
        else:
            categorized["industry_business"].append(a)

    # ── Step 3: 카테고리별 Top 25 + 당일 3개 보장 ──
    for cat in category_order:
        total = len(categorized[cat])
        today_count = len([a for a in categorized[cat] if a.get("_is_today")])
        categorized[cat] = _select_category_top_n(categorized[cat])
        print(f"    {cat}: {total}개 (당일 {today_count}) -> Top {len(categorized[cat])}개")

    # 카테고리별 최종 선정 기사 전체 목록
    for cat in category_order:
        articles = categorized[cat]
        if not articles:
            continue
        print(f"  [최종 선정] {cat} ({len(articles)}개):")
        for rank, a in enumerate(articles):
            title = (a.get("display_title") or a.get("title", ""))[:60]
            src = a.get("source_key", "")
            score = a.get("_total_score", 0)
            print(f"    {rank+1}. \"{title}\" [{src}] {score}점")

    # ── Step 4: 품질 검증 ──
    h_count = len(highlights)
    cat_counts = {cat: len(articles) for cat, articles in categorized.items()}
    min_cat = min(cat_counts.values()) if cat_counts else 0

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

    # 한국 소스: AI 필터 통과 기사만 + 최신순 Top 10 (날짜 제한 없음)
    for s in SOURCES:
        key = s["key"]
        if key in SOURCE_SECTION_SOURCES and sources.get(key):
            source_order.append(key)
            all_articles = sources[key]
            # AI 필터 통과 + 중복 아닌 기사만
            filtered = [a for a in all_articles if not a.get("_ai_filtered") and not a.get("_deduped")]
            excluded = len(all_articles) - len(filtered)
            if excluded > 0:
                print(f"    [{key}] AI/중복 필터: {excluded}개 제외 (전체 {len(all_articles)}개)")
            sorted_articles = sorted(filtered, key=_pub_key, reverse=True)
            source_articles[key] = sorted_articles[:10]

    # 소스별 섹션 최종 기사 목록 출력
    ci_group("소스별 섹션 최종 기사 목록")
    for key, articles in source_articles.items():
        if not articles:
            continue
        print(f"  [소스 섹션] {key} ({len(articles)}개):")
        for rank, a in enumerate(articles):
            title = (a.get("display_title") or a.get("title", ""))[:60]
            pub = a.get("published", "")
            est = "~" if a.get("date_estimated") else ""
            if pub:
                dt = _parse_published(pub)
                date_str = f"{est}{dt.strftime('%Y-%m-%d')}" if dt else "날짜없음"
            else:
                date_str = "날짜없음"
            print(f"    {rank+1}. \"{title}\" ({date_str})")
    ci_endgroup()

    total = (
        len(state.get("highlights", []))
        + sum(len(v) for v in state.get("categorized_articles", {}).values())
        + sum(len(v) for v in source_articles.values())
    )

    # 최종 결과 요약
    h_count = len(state.get('highlights', []))
    cat_count = sum(len(v) for v in state.get('categorized_articles', {}).values())
    src_count = sum(len(v) for v in source_articles.values())
    cat_detail = {k: len(v) for k, v in state.get('categorized_articles', {}).items() if v}
    ent_count = sum(1 for c in state.get("scored_candidates", []) if c.get("entities"))
    ent_total = len(state.get("scored_candidates", []))

    print(f"\n{'='*50}")
    print(f"  뉴스 파이프라인 결과 요약")
    print(f"{'='*50}")
    print(f"  하이라이트    {h_count}개")
    print(f"  카테고리별    {cat_count}개  {cat_detail}")
    print(f"  소스별 섹션   {src_count}개")
    print(f"  엔티티 추출   {ent_count}/{ent_total}개")

    # tags/glossary 통계
    all_output = list(state.get("highlights", []))
    for v in state.get("categorized_articles", {}).values():
        all_output.extend(v)
    tags_count = sum(1 for a in all_output if a.get("tags"))
    glossary_count = sum(1 for a in all_output if a.get("glossary"))
    tags_empty = len(all_output) - tags_count
    glossary_empty = len(all_output) - glossary_count
    print(f"  태그 보유     {tags_count}/{len(all_output)}개" + (f" (누락 {tags_empty})" if tags_empty else ""))
    print(f"  용어사전 보유 {glossary_count}/{len(all_output)}개" + (f" (누락 {glossary_empty})" if glossary_empty else ""))
    print(f"  ────────────────────")
    print(f"  총 출력       {total}개")

    # 타이밍 리포트
    timings = state.get("node_timings", {})
    if timings:
        print(f"\n  노드별 소요 시간:")
        total_time = 0.0
        for nname, elapsed in timings.items():
            bar = '█' * max(1, int(elapsed / 10))
            print(f"    {nname:<20} {elapsed:>6.1f}s  {bar}")
            total_time += elapsed
        print(f"    {'합계':<20} {total_time:>6.1f}s")
    print(f"{'='*50}")

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
