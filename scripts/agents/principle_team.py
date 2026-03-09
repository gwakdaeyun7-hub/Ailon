"""
학제간 AI 인사이트 파이프라인 -- LangGraph 4-노드

seed_selector → content_generator → verifier → assembler

1. seed_selector:       최근 30일 사용 시드 제외 + 학문 분야 로테이션 + 랜덤 선택
2. content_generator:   Gemini LLM 으로 3단계 콘텐츠 (원리발견/AI난제/현실임팩트) + deepDive 생성
3. verifier:            별도 LLM 호출로 원리-AI 매핑 사실 검증 (confidence < 0.7 시 재시도)
4. assembler:           Firestore daily_principles 문서 구성
"""

import json
import random
import re
import time
from datetime import datetime, timedelta, timezone
from typing import Annotated, TypedDict

from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END

from google.cloud.firestore_v1.base_query import FieldFilter

from agents.config import get_llm, get_firestore_client
from agents.principle_seeds import PRINCIPLE_SEEDS
from agents.ci_utils import ci_warning, ci_error


# ─── KST 타임존 ───
_KST = timezone(timedelta(hours=9))

# ─── 학문 분야 한→영 매핑 ───
_DISCIPLINE_NAME_EN: dict[str, str] = {
    "제어공학": "Control Engineering",
    "전기/전자공학": "Electrical & Electronic Engineering",
    "정보/통신공학": "Information & Communications Engineering",
    "최적화공학": "Optimization Engineering",
    "로보틱스": "Robotics",
    "물리학": "Physics",
    "생물학": "Biology",
    "신경과학": "Neuroscience",
    "수학": "Mathematics",
    "통계학": "Statistics",
    "화학": "Chemistry",
    "의학/생명과학": "Medicine / Life Sciences",
}


# ─── 안전 JSON 파싱 ───
_VALID_JSON_ESCAPES = frozenset('"\\/bfnrtu')
# Gemini often puts literal newlines inside JSON string values (e.g. factCheck);
# strict=False allows control characters inside strings.
_jloads = lambda s: json.loads(s, strict=False)


def _fix_invalid_escapes(s: str) -> str:
    """JSON 표준 외 이스케이프(\LaTeX, \sigma 등)를 \\\\ 로 복구."""
    result = []
    i = 0
    while i < len(s):
        if s[i] == '\\' and i + 1 < len(s):
            if s[i + 1] in _VALID_JSON_ESCAPES:
                result.append(s[i:i+2])
                i += 2
            else:
                result.append('\\\\')
                i += 1
        else:
            result.append(s[i])
            i += 1
    return ''.join(result)


def _fix_unescaped_quotes(s: str) -> str:
    """JSON 문자열 값 내 이스케이프 안 된 큰따옴표를 수정.

    Gemini json_mode에서도 ***래핑 시 factCheck 등 값에
    "The "bridge" is..." 처럼 이스케이프 안 된 따옴표가 올 수 있음.
    휴리스틱: key-value 구조를 추적하며 문자열 내부 따옴표를 이스케이프.
    """
    # 간단한 접근: json.loads 에러 위치를 반복적으로 수정
    result = s
    for _ in range(20):  # 최대 20회 반복
        try:
            json.loads(result, strict=False)
            return result
        except json.JSONDecodeError as e:
            pos = e.pos
            if pos is None or pos <= 0 or pos >= len(result):
                break
            # 에러 위치의 따옴표를 이스케이프
            if result[pos] == '"':
                result = result[:pos] + '\\"' + result[pos + 1:]
            elif pos > 0 and result[pos - 1] == '"':
                # 따옴표 바로 다음에서 에러 — 이전 따옴표가 문제
                result = result[:pos - 1] + '\\"' + result[pos:]
            else:
                break
    return result


def _safe_json_parse(text: str) -> dict:
    """LLM 응답에서 JSON 추출. 코드펜스·잘못된 이스케이프·Gemini *** 마크다운도 처리."""
    text = text.strip()
    # <thinking> 태그 제거
    text = re.sub(r'<think(?:ing)?>.*?</think(?:ing)?>', '', text, flags=re.DOTALL)
    # 코드펜스 제거
    m = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if m:
        text = m.group(1).strip()

    # Gemini *** 마크다운 제거 — 1단계: 시작/끝 *** 단순 제거
    phase1_applied = False
    if re.match(r'^\*{2,}', text):
        phase1_applied = True
        text = re.sub(r'^\*{2,}\s*', '', text)       # leading ***
        text = re.sub(r'\s*\*{2,}\s*$', '', text)     # trailing ***
        text = text.strip()
        # trailing comma 제거 (Gemini가 마지막 필드 뒤에 쉼표 남길 수 있음)
        text = re.sub(r',\s*$', '', text)
        # JSON 객체 감싸기 (*** 가 { } 역할이었던 경우)
        if text and not text.startswith('{') and not text.startswith('['):
            text = '{' + text + '}'
        # Phase 1 결과로 즉시 파싱 시도 — Phase 2가 문자열 값 내 ***를 오염시키기 전에
        try:
            return _jloads(text)
        except json.JSONDecodeError:
            pass
        # invalid escape 복구 후 재시도
        try:
            return _jloads(_fix_invalid_escapes(text))
        except json.JSONDecodeError:
            pass
        # Phase 1 추가 복구: 문자열 내 이스케이프 안 된 큰따옴표 수정
        # "key": "value with "quotes" inside" → "key": "value with \"quotes\" inside"
        try:
            fixed_quotes = _fix_unescaped_quotes(text)
            return _jloads(fixed_quotes)
        except (json.JSONDecodeError, Exception):
            pass

    # Gemini *** 마크다운 제거 — 2단계: 중간 *** 구조적 치환
    # Phase 1이 적용됐으면 건너뜀 — 문자열 값 내 *** 오염 방지
    if not phase1_applied and re.search(r'\*{2,}', text):
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

    # 1차: 원본 시도
    try:
        return _jloads(text)
    except json.JSONDecodeError:
        pass

    # 2차: invalid escape 복구 후 시도
    fixed = _fix_invalid_escapes(text)
    try:
        return _jloads(fixed)
    except json.JSONDecodeError:
        pass

    # 3차: JSON 영역만 추출
    for candidate in [text, fixed]:
        start = candidate.find('{')
        end = candidate.rfind('}')
        if start != -1 and end != -1:
            try:
                return _jloads(candidate[start:end+1])
            except json.JSONDecodeError:
                continue

    # 4차: 잘린 JSON 객체 복구 (max_tokens로 잘린 경우)
    for candidate in [text, fixed]:
        brace_idx = candidate.find('{')
        if brace_idx == -1:
            continue
        depth = 0
        in_str = False
        esc = False
        last_close = -1
        reached_zero = False
        for i, ch in enumerate(candidate[brace_idx:], start=brace_idx):
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
            truncated = candidate[brace_idx:last_close + 1]
            truncated = re.sub(r'[,\s]+$', '', truncated)
            # 열린 괄호 닫기
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
                print(f"    [JSON 복구] 잘린 객체 복구 성공")
                return result
            except json.JSONDecodeError as e:
                print(f"    [JSON 복구 실패] 잘린 객체 복구 시도 실패: {e.msg}")

    raise json.JSONDecodeError("No valid JSON found", text[:200], 0)


def _llm_invoke_with_retry(llm, messages, max_retries: int = 3):
    """LLM 호출 + 지수 백오프 재시도 (API 오류/파싱 오류 대응)."""
    for attempt in range(max_retries):
        try:
            response = llm.invoke(messages)
            return response
        except Exception as e:
            if attempt < max_retries - 1:
                wait = 2 ** attempt
                print(f"  [LLM retry] 시도 {attempt+1}/{max_retries} 실패: {e}, {wait}s 대기")
                time.sleep(wait)
            else:
                raise


# ─── State 리듀서 ───
def _merge_lists(left: list, right: list) -> list:
    """두 list 를 합친다. 에러 로그 등 여러 노드 결과 머지용."""
    return (left or []) + (right or [])


def _merge_dicts(left: dict, right: dict) -> dict:
    """두 dict 를 머지한다. node_timings 등 여러 노드 결과 머지용."""
    if not left:
        return right
    if not right:
        return left
    merged = dict(left)
    merged.update(right)
    return merged


# ─── State 정의 ───
class PrincipleGraphState(TypedDict):
    seed: dict                      # 선택된 시드
    content: dict | None            # 생성된 콘텐츠 (3단계 + deepDive)
    verification: dict | None       # 검증 결과
    result: dict | None             # 최종 조립 결과
    retry_count: int                # 재시도 카운터
    errors: Annotated[list[str], _merge_lists]               # 에러 로그
    node_timings: Annotated[dict[str, float], _merge_dicts]  # 노드별 소요 시간


# ─── 안전 노드 데코레이터 ───
def _safe_node(node_name: str):
    """노드 실행을 try/except 로 감싸서 실패 시에도 파이프라인 진행.
    각 노드의 소요 시간을 node_timings 에 기록한다."""
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


# ─── Node 1: seed_selector ───
@_safe_node("seed_selector")
def seed_selector(state: PrincipleGraphState) -> dict:
    """최근 30일 사용 시드 제외 + 학문 로테이션 (최근 3일 동일 분야 회피) + 랜덤 선택"""
    db = get_firestore_client()
    now_kst = datetime.now(_KST)
    today_str = now_kst.strftime("%Y-%m-%d")

    # 최근 30일 사용 시드 ID 및 최근 3일 분야 조회
    used_ids: set[str] = set()
    recent_disciplines: list[str] = []

    try:
        cutoff = now_kst - timedelta(days=30)
        cutoff_str = cutoff.strftime("%Y-%m-%d")
        docs = (
            db.collection("daily_principles")
            .where(filter=FieldFilter("date", ">=", cutoff_str))
            .order_by("date", direction="DESCENDING")
            .stream()
        )
        for doc in docs:
            data = doc.to_dict()
            # 시드 ID 추출
            seed_id = data.get("seed_id", "")
            if seed_id:
                used_ids.add(seed_id)
            # 최근 3일 분야 로테이션
            if len(recent_disciplines) < 3:
                disc = data.get("discipline_key", "")
                if disc:
                    recent_disciplines.append(disc)
    except Exception as e:
        # 컬렉션이 아직 없는 경우 (첫 실행)
        print(f"  [seed_selector] Firestore 조회 실패 (첫 실행일 수 있음): {e}")

    print(f"  [seed_selector] 전체 시드 풀: {len(PRINCIPLE_SEEDS)}개")
    print(f"  [seed_selector] 최근 30일 사용 시드: {len(used_ids)}개")
    if used_ids:
        print(f"    사용 시드 ID: {', '.join(sorted(used_ids)[:10])}{'...' if len(used_ids) > 10 else ''}")
    print(f"  [seed_selector] 최근 3일 분야: {recent_disciplines if recent_disciplines else '(없음 — 첫 실행 또는 데이터 부족)'}")

    # 후보 필터링: 최근 30일 사용 시드 제외
    candidates = [s for s in PRINCIPLE_SEEDS if s["id"] not in used_ids]
    print(f"  [seed_selector] 30일 필터 후 후보: {len(candidates)}개")

    # 분야 로테이션: 최근 3일과 같은 분야 회피
    if recent_disciplines and candidates:
        rotated = [s for s in candidates if s["discipline"] not in recent_disciplines]
        if rotated:
            print(f"  [seed_selector] 분야 로테이션 적용: {len(candidates)} → {len(rotated)}개 (제외 분야: {recent_disciplines})")
            candidates = rotated
        else:
            print(f"  [seed_selector] 분야 로테이션 건너뜀: 로테이션 적용 시 후보 0개")

    # 모든 시드 소진 시 전체에서 선택
    if not candidates:
        print("  [seed_selector] 사용 가능한 시드 없음 -> 전체에서 선택")
        candidates = list(PRINCIPLE_SEEDS)

    seed = random.choice(candidates)
    print(f"  [seed_selector] ── 최종 선택 ──")
    print(f"    시드 ID:    {seed['id']}")
    print(f"    원리:       {seed['principle_name']} ({seed['principle_name_en']})")
    print(f"    학문 분야:  {seed['discipline_name']}")
    print(f"    AI 연결:    {seed['ai_connection'][:60]}{'...' if len(seed.get('ai_connection', '')) > 60 else ''}")
    print(f"    superCat:   {seed.get('super_category', '?')}")
    print(f"    후보 중:    {len(candidates)}개 중 랜덤 선택")

    return {"seed": seed}


# ─── Node 2: content_generator ───
_CONTENT_PROMPT = """당신은 학제간 AI 인사이트 콘텐츠 전문가입니다.
아래 시드 데이터를 기반으로, 대학생이 1~2분 안에 읽을 수 있는 간결한 스낵 콘텐츠를 JSON으로 생성하세요.
한국어와 영어를 모두 생성합니다. 영어 필드는 _en 접미사로 구분합니다.

## 시드 데이터
- 학문 분야: {discipline_name}
- 원리: {principle_name} ({principle_name_en})
- AI 연결: {ai_connection} ({ai_connection_en})
- 해결 문제: {problem_solved}

## 3단계 서사 구조
콘텐츠는 "원리 발견 → AI의 난제 → 현실 임팩트" 순으로 이야기가 전개됩니다.
핵심: 2단계(application)에서 "AI가 부딪힌 구체적 난제"를 먼저 제시하고, 그 해법을 설명하는 "문제→해법" 서사를 구성하세요.

## 핵심 원칙
1. 짧고 명확하게 — 각 필드의 글자 수 제한을 엄격히 지킬 것
2. "직접적 영감"과 "구조적 유사성"을 정직하게 구분할 것
3. 확실하지 않은 연결은 "~로 해석되기도 한다" 식으로 표현할 것
4. 사실에 기반 (핵심 인물/년도 포함, 불확실하면 "약 ~년"으로 표현)

## 출력 JSON 구조 (반드시 정확히 따를 것)

{{
  "title": "{principle_name}과(와) {ai_connection}",
  "title_en": "{principle_name_en} and {ai_connection_en}",

  "foundation": {{
    "headline": "호기심을 유발하는 타이틀 (15~20자)",
    "headline_en": "Curiosity-driven title in English",
    "body": "이 원리의 정의 + 왜 필요한지(어떤 문제를 풀기 위해 등장했는지) (80~120자, 2~3줄)",
    "body_en": "What this principle is + why it was needed (what problem it solves) (2-3 sentences)",
    "analogy": "원리의 핵심 메커니즘(과정)을 비유한 한 줄 (30~50자, 결과가 아닌 작동 방식을 비유)",
    "analogy_en": "One-line analogy of the core mechanism (HOW it works, not just WHAT it does)"
  }},

  "application": {{
    "headline": "AI 연결 타이틀 (15~20자)",
    "headline_en": "AI connection title in English",
    "problem": "AI가 부딪힌 구체적 난제 한 줄 — 수치·시나리오·실패 사례 포함 (30~50자, 예: '자율주행차가 안개 속에서 센서 데이터 50%가 왜곡될 때 판단 불가')",
    "problem_en": "One-line AI challenge with specific numbers/scenario/failure case (e.g., 'Self-driving cars cannot decide when 50% of sensor data is corrupted in fog')",
    "body": "problem의 난제가 이 원리의 어떤 특성으로 해결되는지 — problem→solution 논리적 연결 필수 (80~120자, 2~3줄)",
    "body_en": "How this principle's specific property solves the above challenge — logical problem→solution connection required (2-3 sentences)",
    "mechanism": "핵심 메커니즘 한 줄 (30~50자)",
    "mechanism_en": "One-line core mechanism in English"
  }},

  "integration": {{
    "headline": "실제 활용 타이틀 (15~20자)",
    "headline_en": "Real-world application title in English",
    "body": "실제 세계에서 어떻게 쓰이는지 (80~120자, 2~3줄)",
    "body_en": "Real-world usage explanation (2-3 sentences)",
    "impact": "임팩트 한 줄 — 구체적 수치나 사례 1개 포함 (30~50자, 예: 'GPT-4의 환각률을 40% 감소시킨 핵심 기법')",
    "impact_en": "One-line impact with a specific metric or case (e.g., 'The key technique that reduced GPT-4 hallucination by 40%')"
  }},

  "deepDive": {{
    "originalProblem": "이 원리가 처음 필요했던 학문적 맥락 — 핵심 논문/저서명 1개 이상 포함 (100~150자, 예: '1948년 Shannon의 \"A Mathematical Theory of Communication\"에서...')",
    "originalProblem_en": "Academic context — must include at least one key paper/book title (2-3 sentences, e.g., 'In Shannon\\'s 1948 paper...')",
    "bridge": "영감의 다리 — 보존된 수학적/논리적 구조 vs 변형된 구현 방식을 구체적 예시와 함께 구분 (150~200자, 예: '합성곱 연산의 수학적 구조는 보존되었으나, 생물학적 시냅스 가소성은 역전파로 변형되었다')",
    "bridge_en": "Bridge — preserved mathematical/logical structure vs. transformed implementation, with concrete examples (3-5 sentences)",
    "coreIntuition": "핵심 직관 — 반드시 feature map/gradient/차원/확률분포/손실함수/가중치 등 기술 용어를 포함하여 수학적/알고리즘적 직관으로 서술할 것. foundation.analogy와 동일한 일상 비유 수준이면 실격 (100~150자, 예: '이 알고리즘은 N차원 파라미터 공간에서 손실 곡면의 기울기 벡터를 따라 극소점으로 수렴한다')",
    "coreIntuition_en": "Core intuition — MUST include technical terms (feature map/gradient/dimension/probability distribution/loss function/weights). DISQUALIFIED if same level as foundation.analogy everyday metaphor (2-3 sentences, e.g., 'The algorithm converges to a local minimum by following the gradient vector on the loss surface in N-dimensional parameter space')",
    "formula": "핵심 수식이나 알고리즘 (LaTeX 형태). 수학/물리/정보이론/통계 원리이면 반드시 핵심 수식 포함. 비수학적 원리만 빈 문자열 허용",
    "formula_en": "Core formula (LaTeX). REQUIRED for math/physics/information theory/statistics principles. Empty string only for non-mathematical principles",
    "limits": "AI에서 이 원리를 적용할 때의 구체적 한계 — AI-specific 문제 필수 (100~150자, 예: 'distribution shift 환경에서 학습된 통계적 가정이 무너지며, adversarial attack에 취약하다')",
    "limits_en": "AI-specific limits when applying this principle (2-3 sentences, e.g., 'Statistical assumptions break under distribution shift; vulnerable to adversarial attacks')"
  }},

  "keywords": ["한국어 키워드 1", "한국어 키워드 2", "한국어 키워드 3"],
  "keywords_en": ["keyword 1", "keyword 2", "keyword 3"],
  "difficulty": "beginner 또는 intermediate 또는 advanced",
  "connectionType": "direct_inspiration 또는 structural_analogy 또는 mathematical_foundation",
  "readTime": "1분 또는 2분 (인사이트만 1분, 딥다이브 포함 2분)"
}}

## 작성 지침
- 글자 수 제한을 반드시 준수 (headline 15~20자, body 80~120자, 한 줄 필드 30~50자)
- deepDive 글자 수: originalProblem/coreIntuition/limits 100~150자, bridge 150~200자
- foundation.body: 원리의 정의만 나열하지 말고 "어떤 문제를 풀기 위해 이 원리가 등장했는지" 맥락을 함께 전달할 것
- foundation.analogy: 결과가 아닌 **핵심 메커니즘(과정)**을 비유할 것 (나쁜 예: "두 번 말해 확인" → 좋은 예: "편지에 같은 내용을 두 번 적어 한 줄이 지워져도 복구하는 것")
- application.problem: "AI가 부딪힌 구체적 벽"을 생생하게 묘사 (추상적 표현 금지, 구체적 수치·시나리오·실패 사례 사용)
- application.body: problem에서 제시한 난제가 이 원리의 **어떤 특성**으로 해결되는지 논리적 연결을 명확히 할 것
- integration.impact: "혁신적으로 향상" 같은 추상적 표현 금지 — 구체적 수치나 사례 1개 이상 포함
- deepDive.originalProblem: 핵심 논문/저서명을 반드시 1개 이상 포함할 것
- deepDive.bridge (가장 중요한 섹션): "보존된 수학적/논리적 구조"와 "변형된 구현 방식"을 구체적 예시와 함께 구분할 것
- deepDive.coreIntuition: 반드시 기술 용어(feature map, gradient, 차원, 확률분포, 손실함수, 가중치 등)를 포함할 것. foundation.analogy와 동일한 일상 비유 수준이면 실격. 딥다이브는 전문성이 목적이므로 수학적/알고리즘적 직관 필수 (예: "N차원 파라미터 공간에서...", "확률 분포의...")
- deepDive.formula: 수학/물리/정보이론/통계 관련 원리이면 반드시 핵심 수식을 포함할 것 (빈 문자열 금지)
- deepDive.limits: 일반적 한계가 아닌 AI에서 이 원리를 적용할 때의 specific한 한계를 서술할 것 (예: distribution shift, non-convexity, adversarial robustness 등)
- 한국어 필드는 한국어, _en 필드는 자연스러운 영어 (번역투 금지)
- 고유명사(인물명·기관명·논문명·모델명)는 한국어 필드에서도 영어 그대로 유지 (예: Geoffrey Hinton, DeepMind, "Attention Is All You Need", GPT-4)
- 전문 용어는 영어 병기 가능 (예: "역전파(Backpropagation)")
- AI/ML 업계에서 한국어로 그대로 음차하여 쓰는 용어는 직역하지 말고 음차 표기할 것
  - agent → 에이전트, fine-tuning → 파인튜닝, token → 토큰, prompt → 프롬프트
  - transformer → 트랜스포머, benchmark → 벤치마크, inference → 인퍼런스/추론, embedding → 임베딩
  - hallucination → 할루시네이션, pipeline → 파이프라인, multimodal → 멀티모달
  - annealing → 어닐링, convolution → 컨볼루션, gradient → 그래디언트, epoch → 에포크
  - dropout → 드롭아웃, attention → 어텐션, backpropagation → 역전파/백프로파게이션
  - 확실하지 않으면 영어 원문을 그대로 유지할 것
- JSON만 출력 (추가 설명 없이)

## 흔한 오류 주의
- 역전파는 생물학적으로 비합리적(biologically implausible)함을 해당 시 명시할 것
- 인공 신경망은 실제 뇌의 동작 방식과 근본적으로 다름을 인지할 것
- 사후적 비유를 직접적 영감으로 오해하지 말 것

REMINDER: Your JSON MUST contain ALL of the following top-level keys: title, title_en, foundation, application, integration, deepDive, keywords, keywords_en, difficulty, connectionType, readTime. Missing any key is an error."""


@_safe_node("content_generator")
def content_generator(state: PrincipleGraphState) -> dict:
    """시드 기반 LLM 콘텐츠 생성 (foundation/application/integration + deepDive)"""
    seed = state["seed"]
    if not seed:
        return {"errors": ["content_generator: seed가 비어있음"]}

    llm = get_llm(temperature=0.4, max_tokens=12288, thinking=False, json_mode=True)

    prompt = _CONTENT_PROMPT.format(
        discipline_name=seed["discipline_name"],
        principle_name=seed["principle_name"],
        principle_name_en=seed["principle_name_en"],
        ai_connection=seed["ai_connection"],
        ai_connection_en=seed["ai_connection_en"],
        problem_solved=seed["problem_solved"],
    )

    response = _llm_invoke_with_retry(llm, [HumanMessage(content=prompt)])
    content = _safe_json_parse(response.content)

    # 필수 키 검증 (top-level)
    required_keys = {"title", "connectionType", "foundation", "application", "integration", "deepDive"}
    missing = required_keys - set(content.keys())
    if missing:
        ci_warning(f"content_generator: 필수 top-level 키 누락: {missing} — 재시도 유도")
        return {"errors": [f"content_generator: 필수 키 누락: {missing}"], "content": None}

    # 중첩 필드 검증
    _nested_required = {
        "foundation": {"headline", "body", "analogy"},
        "application": {"headline", "problem", "body", "mechanism"},
        "integration": {"headline", "body", "impact"},
        "deepDive": {"originalProblem", "bridge", "coreIntuition", "limits"},
    }
    has_critical_missing = False
    for section, keys in _nested_required.items():
        section_data = content.get(section, {})
        if not isinstance(section_data, dict):
            ci_warning(f"content_generator: {section}이 dict가 아님 — 재시도 유도")
            return {"errors": [f"content_generator: {section}이 dict가 아님"], "content": None}
        nested_missing = keys - set(section_data.keys())
        if nested_missing:
            ci_warning(f"content_generator: {section} 내 누락 키: {nested_missing}")
            has_critical_missing = True
    if has_critical_missing:
        ci_warning("content_generator: 중첩 필수 키 누락 — 재시도 유도")
        return {"errors": [f"content_generator: 중첩 필수 키 누락"], "content": None}

    # ── 상세 로그 ──
    print(f"  [content_generator] ── 생성 완료 ──")
    print(f"    title:          {content.get('title', '?')[:70]}")
    print(f"    difficulty:     {content.get('difficulty', '?')}")
    print(f"    connectionType: {content.get('connectionType', '?')}")
    print(f"    readTime:       {content.get('readTime', '?')}")
    print(f"    keywords:       {content.get('keywords', [])}")

    foundation = content.get("foundation", {})
    application = content.get("application", {})
    integration = content.get("integration", {})
    deep_dive = content.get("deepDive", {})

    print(f"    [Step 1 Foundation]")
    print(f"      headline: {foundation.get('headline', '?')[:50]}")
    print(f"      body:     {foundation.get('body', '?')[:60]}...")
    print(f"      analogy:  {foundation.get('analogy', '?')[:60]}")
    print(f"    [Step 2 Application]")
    print(f"      headline: {application.get('headline', '?')[:50]}")
    print(f"      problem:  {application.get('problem', '?')[:60]}")
    print(f"      body:     {application.get('body', '?')[:60]}...")
    print(f"    [Step 3 Integration]")
    print(f"      headline: {integration.get('headline', '?')[:50]}")
    print(f"      body:     {integration.get('body', '?')[:60]}...")
    print(f"      impact:   {integration.get('impact', '?')[:60]}")
    print(f"    [Deep Dive]")
    print(f"      originalProblem: {deep_dive.get('originalProblem', '?')[:70]}...")
    print(f"      bridge:          {deep_dive.get('bridge', '?')[:100]}...")
    print(f"      coreIntuition:   {deep_dive.get('coreIntuition', '?')[:70]}...")
    print(f"      formula:         {'(있음)' if deep_dive.get('formula') else '(없음)'}")
    print(f"      limits:          {deep_dive.get('limits', '?')[:70]}...")

    # 학술 정보 밀도 체크
    year_pattern = re.compile(r'\b(1[89]\d{2}|20[0-2]\d)\b')
    all_text = json.dumps(content, ensure_ascii=False)
    year_count = len(set(year_pattern.findall(all_text)))
    print(f"    [학술 밀도] 년도 {year_count}개 언급")

    # formula 조건부 경고 (수학/물리/정보이론 계열)
    _math_prefixes = {"math", "phys", "info", "stat", "ee", "opt"}
    discipline_prefix = seed.get("discipline_key", seed.get("discipline", "")).split("_")[0]
    if discipline_prefix in _math_prefixes and not deep_dive.get("formula"):
        ci_warning(f"수학적 원리({seed.get('discipline_key', seed.get('discipline', '?'))})인데 formula 없음")

    return {"content": content}


# ─── Node 3: verifier ───
_VERIFY_PROMPT = """IMPORTANT: Output ONLY a valid JSON object. No markdown, no code fences, no explanation before or after. Start with '{{'.


당신은 학제간 과학/공학 사실 검증 전문가입니다.
아래 콘텐츠가 사실적으로 정확한지 엄격하게 검증하세요.

## 시드 데이터 (참고용)
- 학문 분야: {discipline_name}
- 원리: {principle_name} ({principle_name_en})
- AI 연결: {ai_connection} ({ai_connection_en})
- 해결 문제: {problem_solved}

## 검증 대상 콘텐츠
{content_json}

## 검증 기준 (각 항목별로 평가)

### A. 사실 정확성
1. **원리 정확성**: {discipline_name}의 {principle_name} 설명이 학술적으로 정확한가? 핵심 인물/년도가 올바른가?
2. **매핑 정확성**: 원리에서 AI 기술로의 연결이 실제로 존재하는 학술적 관계인가? 직접 영감인가, 사후적 비유인가?
3. **연결 강도(connectionType)**: connectionType 분류가 적절한가? (direct_inspiration/structural_analogy/mathematical_foundation)
4. **팩트 오류**: 날짜, 인물, 논문명 등 구체적 사실에 오류가 없는가?
5. **과장 여부**: 연결의 강도가 과장되지 않았는가?

### B. 인사이트 이해도 (비전문가가 이해할 수 있는가?)
6. **원리 설명+필요성**: foundation.body가 원리의 정의와 함께 "왜 이것이 필요했는지" 맥락을 전달하는가? (정의만 나열하면 감점)
7. **비유 메커니즘**: analogy가 결과가 아닌 핵심 메커니즘(과정)을 비유하는가? (결과만 비유하면 감점)
8. **문제→해법 연결**: application.problem이 구체적 시나리오/수치를 포함하는가? application.body가 problem의 난제를 원리의 어떤 특성으로 해결하는지 논리적으로 연결하는가?
9. **영향 구체성**: integration.impact가 구체적 수치나 사례를 포함하는가? ("혁신적으로 향상" 같은 추상적 표현이면 감점)

### C. 딥다이브 전문성 (학술적 깊이가 충분한가?)
10. **영감의 다리(bridge)**: "보존된 수학적/논리적 구조"와 "변형된 구현 방식"이 구체적 예시와 함께 명시적으로 구분되어 있는가?
11. **핵심 직관(coreIntuition)**: feature map/gradient/차원/확률분포/손실함수/가중치 등 기술 용어가 포함되어 있는가? foundation.analogy와 동일한 일상 비유 수준이면 deepDiveDepth ≤ 0.5로 강하게 감점
12. **수식(formula)**: 수학/물리/정보이론/통계 관련 원리인데 formula가 빈 문자열이면 감점
13. **한계(limits)**: AI에서 이 원리를 적용할 때의 AI-specific 한계를 다루는가? (일반적 "더 연구 필요" 수준이면 감점)
14. **학술 정보 밀도**: originalProblem/bridge에 인물명·년도가 충분히 포함되어 있는가? (년도 1개+인물 1명 미만이면 deepDiveDepth ≤ 0.6)

## 출력 형식 (반드시 아래 스키마의 JSON 객체만 출력, 다른 텍스트 금지)
{{
  "verified": true 또는 false,
  "confidence": 0.0~1.0 (전체 정확도에 대한 확신도),
  "principleAccuracy": 0.0~1.0 (원리 설명 정확도),
  "mappingAccuracy": 0.0~1.0 (원리-AI 매핑 정확도),
  "insightClarity": 0.0~1.0 (인사이트 이해도 — B항목 기반),
  "deepDiveDepth": 0.0~1.0 (딥다이브 전문성 — C항목 기반),
  "factCheck": "검증 이유를 2-3문장으로",
  "issues": ["발견된 문제점 1", "발견된 문제점 2"] 또는 빈 배열
}}

Example output:
{{"verified": true, "confidence": 0.85, "principleAccuracy": 0.9, "mappingAccuracy": 0.8, "insightClarity": 0.85, "deepDiveDepth": 0.75, "factCheck": "Hebbian learning 설명이 정확하며, 신경망 가중치 업데이트와의 연결이 적절함. 다만 coreIntuition이 일상 비유 수준에 머물러 deepDiveDepth 감점.", "issues": ["coreIntuition이 수학적 직관 부족"]}}"""


def _regex_extract_verification(raw: str) -> dict | None:
    """JSON 파싱 실패 시 regex로 verifier 응답 필드를 추출하는 폴백.

    verifier 스키마가 고정(verified, confidence, ...)이므로
    regex로 개별 필드를 추출하면 *** 래핑이나 따옴표 이슈를 우회할 수 있음.
    """
    if not raw:
        return None
    verified_m = re.search(r'"verified"\s*:\s*(true|false)', raw, re.IGNORECASE)
    confidence_m = re.search(r'"confidence"\s*:\s*([0-9.]+)', raw)
    if not verified_m or not confidence_m:
        return None
    def _float(pattern, default=0.0):
        m = re.search(pattern, raw)
        return float(m.group(1)) if m else default
    result = {
        "verified": verified_m.group(1).lower() == "true",
        "confidence": float(confidence_m.group(1)),
        "principleAccuracy": _float(r'"principleAccuracy"\s*:\s*([0-9.]+)'),
        "mappingAccuracy": _float(r'"mappingAccuracy"\s*:\s*([0-9.]+)'),
        "insightClarity": _float(r'"insightClarity"\s*:\s*([0-9.]+)'),
        "deepDiveDepth": _float(r'"deepDiveDepth"\s*:\s*([0-9.]+)'),
        "factCheck": "regex 폴백으로 추출됨",
        "issues": [],
    }
    # factCheck 추출 시도 (따옴표 내 텍스트)
    fc_m = re.search(r'"factCheck"\s*:\s*"((?:[^"\\]|\\.)*)"', raw, re.DOTALL)
    if fc_m:
        result["factCheck"] = fc_m.group(1)
    # issues 배열 추출 시도
    issues_m = re.search(r'"issues"\s*:\s*\[(.*?)\]', raw, re.DOTALL)
    if issues_m:
        raw_issues = issues_m.group(1).strip()
        if raw_issues:
            result["issues"] = re.findall(r'"((?:[^"\\]|\\.)*)"', raw_issues)
    return result


@_safe_node("verifier")
def verifier(state: PrincipleGraphState) -> dict:
    """별도 LLM 호출로 원리-AI 매핑 사실 검증"""
    seed = state["seed"]
    content = state.get("content")
    if not content:
        return {"verification": {"verified": False, "confidence": 0.0, "factCheck": "콘텐츠 없음"}}

    llm = get_llm(temperature=0.0, max_tokens=2048, thinking=False, json_mode=True)

    prompt = _VERIFY_PROMPT.format(
        discipline_name=seed["discipline_name"],
        principle_name=seed["principle_name"],
        principle_name_en=seed["principle_name_en"],
        ai_connection=seed["ai_connection"],
        ai_connection_en=seed["ai_connection_en"],
        problem_solved=seed["problem_solved"],
        content_json=json.dumps(content, ensure_ascii=False, indent=2)[:4000],
    )

    # JSON 파싱 실패 시 최대 3회 시도, 모두 실패 시 기본 fail 결과 반환
    verification = None
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            response = _llm_invoke_with_retry(llm, [HumanMessage(content=prompt)])
            raw = response.content
            print(f"  [verifier] attempt {attempt+1}/{max_attempts} — response preview: {repr(raw[:300]) if raw else '(empty)'}")

            # Empty/whitespace response — skip parsing, retry
            if not raw or not raw.strip():
                ci_warning(f"verifier attempt {attempt+1}: empty response from Gemini, retrying")
                time.sleep(1)
                continue

            verification = _safe_json_parse(raw)
            break
        except json.JSONDecodeError as e:
            # regex 폴백: *** 래핑 등으로 JSON 파싱 실패해도 필드 추출 시도
            fallback = _regex_extract_verification(raw)
            if fallback:
                print(f"  [verifier] JSON 파싱 실패 → regex 폴백으로 필드 추출 성공")
                verification = fallback
                break
            if attempt < max_attempts - 1:
                ci_warning(f"verifier JSON 파싱 실패 (attempt {attempt+1}), 재시도: {e.msg}")
                time.sleep(1)
            else:
                ci_error(f"verifier JSON 파싱 {max_attempts}회 연속 실패: {e.msg} — 기본 fail 결과 사용")
                verification = {
                    "verified": False,
                    "confidence": 0.0,
                    "principleAccuracy": 0.0,
                    "mappingAccuracy": 0.0,
                    "insightClarity": 0.0,
                    "deepDiveDepth": 0.0,
                    "factCheck": f"JSON 파싱 실패로 검증 불가: {e.msg}",
                    "issues": ["verifier LLM 응답이 유효한 JSON이 아님"],
                }

    # All attempts exhausted with empty responses (no JSONDecodeError raised)
    if verification is None:
        ci_error("verifier: 모든 시도에서 빈 응답 — 기본 fail 결과 사용")
        verification = {
            "verified": False,
            "confidence": 0.0,
            "principleAccuracy": 0.0,
            "mappingAccuracy": 0.0,
            "insightClarity": 0.0,
            "deepDiveDepth": 0.0,
            "factCheck": "Gemini 빈 응답으로 검증 불가",
            "issues": ["verifier LLM이 빈 응답을 반환"],
        }

    verified = verification.get("verified", False)
    confidence = verification.get("confidence", 0.0)
    principle_acc = verification.get("principleAccuracy", 0.0)
    mapping_acc = verification.get("mappingAccuracy", 0.0)
    insight_clarity = verification.get("insightClarity", 0.0)
    deep_dive_depth = verification.get("deepDiveDepth", 0.0)
    issues = verification.get("issues", [])

    print(f"  [verifier] ── 검증 결과 ──")
    print(f"    verified:           {verified}")
    print(f"    confidence:         {confidence:.2f}")
    print(f"    principleAccuracy:  {principle_acc:.2f}" if isinstance(principle_acc, (int, float)) else f"    principleAccuracy:  {principle_acc}")
    print(f"    mappingAccuracy:    {mapping_acc:.2f}" if isinstance(mapping_acc, (int, float)) else f"    mappingAccuracy:    {mapping_acc}")
    print(f"    insightClarity:    {insight_clarity:.2f}" if isinstance(insight_clarity, (int, float)) else f"    insightClarity:    {insight_clarity}")
    print(f"    deepDiveDepth:     {deep_dive_depth:.2f}" if isinstance(deep_dive_depth, (int, float)) else f"    deepDiveDepth:     {deep_dive_depth}")
    print(f"    factCheck:          {verification.get('factCheck', '')[:80]}")
    if issues:
        print(f"    issues ({len(issues)}건):")
        for issue in issues[:5]:
            print(f"      - {str(issue)[:80]}")
    else:
        print(f"    issues:             (없음)")
    print(f"    판정:               {'PASS' if verified and confidence >= 0.7 else 'FAIL → 재시도 여부 확인'}")

    # ── 콘텐츠 구조 코드 레벨 검증 (verified 판정을 뒤집지 않음, 경고만 출력) ──
    content = state.get("content")
    if content and isinstance(content, dict):
        quality_warnings: list[str] = []

        # 1. analogy가 너무 짧으면 경고 (메커니즘 비유가 충분하지 않을 가능성)
        analogy = content.get("foundation", {}).get("analogy", "")
        if len(analogy) < 15:
            quality_warnings.append("analogy가 너무 짧음 (15자 미만)")

        # 2. application.problem에 구체적 수치/시나리오 힌트가 있는지
        problem = content.get("application", {}).get("problem", "")
        if len(problem) < 20:
            quality_warnings.append("application.problem이 너무 짧음")

        # 3. deepDive.bridge에 "보존"/"변형" 키워드가 있는지
        bridge = content.get("deepDive", {}).get("bridge", "")
        if bridge and "보존" not in bridge and "변형" not in bridge and "preserved" not in bridge.lower() and "transform" not in bridge.lower():
            quality_warnings.append("bridge에 보존/변형 구분이 없음")

        # 4. formula 조건부 검사 (수학/물리/정보이론/통계/전자/최적화 계열)
        _math_prefixes = {"math", "phys", "info", "stat", "ee", "opt"}
        discipline_prefix = seed.get("discipline_key", seed.get("discipline", "")).split("_")[0]
        formula = content.get("deepDive", {}).get("formula", "")
        if discipline_prefix in _math_prefixes and not formula:
            quality_warnings.append(f"수학적 원리({seed.get('discipline_key', seed.get('discipline', '?'))})인데 formula 없음")

        # 5. limits에 AI-specific 한계가 있는지 (최소한 AI/ML 관련 용어 1개)
        limits = content.get("deepDive", {}).get("limits", "")
        ai_terms = ["AI", "모델", "학습", "신경망", "딥러닝", "머신러닝", "LLM", "neural", "training", "model"]
        if limits and not any(term in limits for term in ai_terms):
            quality_warnings.append("limits에 AI-specific 한계가 없음")

        if quality_warnings:
            print(f"    [콘텐츠 품질 경고] {len(quality_warnings)}건:")
            for w in quality_warnings:
                ci_warning(f"콘텐츠 품질 경고: {w}")

    return {"verification": verification}


# ─── 조건부 라우팅: 재시도 여부 판단 ───
def should_retry(state: PrincipleGraphState) -> str:
    """검증 실패 또는 낮은 confidence 시 재시도 (최대 3회)"""
    verification = state.get("verification") or {}
    retry_count = state.get("retry_count", 0)
    verified = verification.get("verified", False)
    confidence = verification.get("confidence", 0.0)

    if (not verified or confidence < 0.7) and retry_count < 3:
        ci_warning(f"검증 실패 (verified={verified}, confidence={confidence:.2f}), 재시도 {retry_count + 1}/3")
        return "retry"

    # formula 필수 검사: 수학/물리/정보이론/통계/전자/최적화 분야
    _math_prefixes = {"math", "phys", "info", "stat", "ee", "opt"}
    content = state.get("content")
    if content and retry_count < 3:
        seed = state.get("seed") or {}
        discipline = seed.get("discipline_key", seed.get("discipline", ""))
        prefix = discipline.split("_")[0]
        if prefix in _math_prefixes:
            if not content.get("deepDive", {}).get("formula"):
                ci_warning(f"formula 누락 ({discipline}), 재시도 {retry_count + 1}/3")
                return "retry"

    if not verified or confidence < 0.7:
        print(f"  [라우팅] 검증 실패하지만 재시도 한도 초과 -> 현재 콘텐츠 사용")

    return "pass"


# ─── 재시도 시 시드 교체용 래퍼 ───
@_safe_node("retry_reseed")
def retry_reseed(state: PrincipleGraphState) -> dict:
    """재시도 시 retry_count 증가 + 다른 시드 선택"""
    retry_count = state.get("retry_count", 0) + 1
    old_seed_id = state.get("seed", {}).get("id", "")

    # 현재 시드 제외하고 랜덤 선택
    candidates = [s for s in PRINCIPLE_SEEDS if s["id"] != old_seed_id]
    if not candidates:
        candidates = list(PRINCIPLE_SEEDS)
    new_seed = random.choice(candidates)

    print(f"  [retry_reseed] 시드 교체: {old_seed_id} -> {new_seed['id']} (재시도 {retry_count}/3)")
    return {"seed": new_seed, "retry_count": retry_count, "content": None, "verification": None}


# ─── Node 4: assembler ───
@_safe_node("assembler")
def assembler(state: PrincipleGraphState) -> dict:
    """최종 DailyPrinciples 문서 구성 + Firestore 저장"""
    from firebase_admin import firestore as fs

    seed = state["seed"]
    content = state.get("content")
    verification = state.get("verification")

    if not seed or not content:
        return {"errors": ["assembler: seed 또는 content 가 없음"], "result": None}

    now_kst = datetime.now(_KST)
    today_str = now_kst.strftime("%Y-%m-%d")

    doc = {
        "date": today_str,
        "seed_id": seed["id"],
        "discipline_key": seed["discipline"],
        "discipline_info": {
            "name": seed["discipline_name"],
            "name_en": _DISCIPLINE_NAME_EN.get(seed["discipline_name"], seed["discipline_name"]),
            "focus": seed["principle_name"],
            "focus_en": seed.get("principle_name_en", ""),
            "ai_connection": seed["ai_connection"],
            "ai_connection_en": seed.get("ai_connection_en", ""),
            "superCategory": seed["super_category"],
        },
        "principle": {
            "title": content.get("title", ""),
            "title_en": content.get("title_en", ""),
            "connectionType": content.get("connectionType", "structural_analogy"),
            "difficulty": content.get("difficulty", "intermediate"),
            "keywords": content.get("keywords", []),
            "keywords_en": content.get("keywords_en", []),
            "readTime": content.get("readTime", "1분"),
            "category": seed["discipline_name"],
            "superCategory": seed["super_category"],
            "foundation": content.get("foundation", {}),
            "application": content.get("application", {}),
            "integration": content.get("integration", {}),
            "deepDive": content.get("deepDive", {}),
            "verification": verification or {},
        },
        "updated_at": fs.SERVER_TIMESTAMP,
    }

    # ── 저장 전 데이터 요약 로그 ──
    print(f"  [assembler] ── 최종 문서 요약 ──")
    print(f"    날짜:           {today_str}")
    print(f"    seed_id:        {seed['id']}")
    print(f"    discipline_key: {seed['discipline']}")
    print(f"    discipline:     {seed['discipline_name']}")
    print(f"    title:          {content.get('title', '?')[:70]}")
    print(f"    connectionType: {content.get('connectionType', '?')}")
    print(f"    difficulty:     {content.get('difficulty', '?')}")
    print(f"    superCategory:  {seed.get('super_category', '?')}")
    print(f"    keywords:       {content.get('keywords', [])}")
    v = verification or {}
    print(f"    verification:   confidence={v.get('confidence', '?')}, verified={v.get('verified', '?')}")

    # Firestore 저장 (날짜 기반 문서 ID 로 멱등성 보장)
    try:
        db = get_firestore_client()
        db.collection("daily_principles").document(today_str).set(doc)
        print(f"  [assembler] Firestore 저장 완료: daily_principles/{today_str}")
    except Exception as e:
        ci_error(f"assembler Firestore 저장 실패: {e}")
        return {"errors": [f"assembler: Firestore 저장 실패: {e}"], "result": doc}

    # 타이밍 리포트
    timings = state.get("node_timings", {})
    retry_count = state.get("retry_count", 0)
    if timings:
        print(f"\n  --- Principle 파이프라인 리포트 ---")
        print(f"    재시도 횟수: {retry_count}")
        total_time = 0.0
        for nname, elapsed in timings.items():
            print(f"    {nname}: {elapsed}s")
            total_time += elapsed
        print(f"    합계: {total_time:.1f}s")

    print(f"\n[DONE] 원리 파이프라인 완료: {seed['principle_name']} ({seed['discipline_name']})")
    return {"result": doc}


# ─── 그래프 구성 ───
def _build_graph():
    graph = StateGraph(PrincipleGraphState)

    graph.add_node("seed_selector", seed_selector)
    graph.add_node("content_generator", content_generator)
    graph.add_node("verifier", verifier)
    graph.add_node("retry_reseed", retry_reseed)
    graph.add_node("assembler", assembler)

    graph.set_entry_point("seed_selector")
    graph.add_edge("seed_selector", "content_generator")
    graph.add_edge("content_generator", "verifier")

    # verifier -> 검증 통과 시 assembler, 실패 시 retry_reseed -> content_generator 재시도
    graph.add_conditional_edges("verifier", should_retry, {
        "retry": "retry_reseed",
        "pass": "assembler",
    })
    graph.add_edge("retry_reseed", "content_generator")

    graph.add_edge("assembler", END)

    return graph.compile()


# ─── 메인 파이프라인 ───
def run_principle_pipeline() -> dict:
    """원리 파이프라인 실행, 결과 dict 반환"""
    print("=" * 60)
    print("[START] 학제간 AI 인사이트 파이프라인 (LangGraph 4-노드)")
    print("=" * 60)

    app = _build_graph()
    result = app.invoke({
        "seed": {},
        "content": None,
        "verification": None,
        "result": None,
        "retry_count": 0,
        "errors": [],
        "node_timings": {},
    })

    errors = result.get("errors", [])
    if errors:
        print(f"\n  [파이프라인 에러] {len(errors)}건:")
        for err in errors:
            print(f"    - {err}")

    return result["result"]
