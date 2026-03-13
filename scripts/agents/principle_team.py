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

    # ── TEMP: 프롬프트 튜닝을 위해 Simulated Annealing 고정 ──
    sa_seed = next((s for s in PRINCIPLE_SEEDS if s["id"] == "opt_simulated_annealing"), None)
    if sa_seed:
        seed = sa_seed
        print("  [seed_selector] ⚠ TEMP: Simulated Annealing 고정 모드")
    else:
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
_CONTENT_PROMPT = """당신은 AI를 공부하는 대학생에게 학제간 인사이트를 전달하는 콘텐츠 작가입니다.
시드 데이터를 기반으로, 1~2분 안에 읽을 수 있는 스낵 콘텐츠를 JSON으로 생성하세요.
한국어와 영어를 모두 생성합니다. 영어 필드는 _en 접미사.

## 시드 데이터
- 학문 분야: {discipline_name}
- 원리: {principle_name} ({principle_name_en})
- AI 연결: {ai_connection} ({ai_connection_en})
- 해결 문제: {problem_solved}

## 톤 & 스타일
- 독자 반응 목표: "오, 이게 여기서 온 거구나!" — 발견의 쾌감을 줄 것
- headline: 질문형("왜 ~일까?") 또는 반전형("~가 사실 ~였다") — 다음 카드가 궁금해지는 톤. 단순 명사 나열("X와 Y") 금지
- body/problem: 교과서 정의 나열 금지. "이런 상황에서 이런 문제가 있었는데" 식의 서사적 전개
- 딥다이브: 인사이트를 읽은 학습자가 "더 알고 싶다"고 느낄 때 여는 콘텐츠. 인사이트의 연장선에서 출발하되, 학술적 깊이를 점진적으로 높일 것
- 학습자가 가져갈 것: 각 카드를 읽고 "이 원리가 AI에서 왜 중요한지" 한 문장으로 말할 수 있어야 함

## 3단계 서사 구조 — "같은 질문, 다른 맥락"
"근본 질문 → AI에서 재등장 → 현실 임팩트" 순으로 전개합니다.
1단계(foundation): 이 원리가 답하려 했던 **근본 질문** 부각. 정의 나열 대신 "무엇이 문제였고, 어떤 발상으로 풀었는지" 중심. **원래 학문에서의 물리적/수학적 작동 메커니즘**(과정·원리)을 반드시 포함 — AI 관점이 아닌 원래 분야의 실제 원리
2단계(application): 그 질문이 AI에서 **어떤 형태로 재등장**했는지. 구체적 난제 → 이 원리의 해법 = "문제→해법" 서사
3단계(integration): 해법이 현실에서 만들어낸 구체적 변화

## 핵심 원칙
1. 글자 수 제한 엄격 준수 (스키마 참조)
2. "직접적 영감"과 "구조적 유사성"을 정직하게 구분 — 확실하지 않으면 "~로 해석되기도 한다" 식 표현
3. 사실 기반 (핵심 인물/년도 포함, 불확실하면 "약 ~년")
4. 수치는 검증 가능한 것만 (논문 벤치마크, 공개 사례). 불확실하면 수치 대신 구체적 사례로 대체

## 출력 JSON 구조

{{
  "title": "{principle_name}과(와) {ai_connection}",
  "title_en": "{principle_name_en} and {ai_connection_en}",

  "foundation": {{
    "headline": "질문형/반전형 타이틀 (15~20자)",
    "headline_en": "Question or surprising hook (max 40 chars)",
    "body": "근본 질문 + 원래 학문의 실제 작동 메커니즘(구체적 물리량·변수·현상 명시) + 핵심 발상 (80~120자). 정의 나열 금지. 반드시: (1) 원래 분야에서 무엇이 구체적으로 일어나는지 (2) 그 과정→결과의 인과관계",
    "body_en": "Fundamental question + actual mechanism from the original discipline (with specific physical quantities/variables) + key insight (max 180 chars). No definitions-only.",
    "analogy": "핵심 메커니즘(과정)을 비유한 한 줄 (30~60자). 결과 비유 금지. 작동의 핵심 단계(예: 조건부 수용, 피드백, 경쟁, 선택 등)가 비유에 반영되어야 함",
    "analogy_en": "One-line mechanism analogy — HOW it works (max 100 chars)"
  }},

  "application": {{
    "headline": "AI 연결 타이틀 (15~20자)",
    "headline_en": "AI connection title (max 40 chars)",
    "problem": "AI의 구체적 난제 — 시나리오·실패 상황 (30~60자). 검증 불가 수치 금지",
    "problem_en": "Specific AI challenge with scenario (max 100 chars). No unverifiable numbers",
    "body": "기존 한계 → 이 원리의 어떤 속성이 돌파구인지 인과관계 (80~120자)",
    "body_en": "Why existing methods failed + how this principle breaks through (max 180 chars)",
    "mechanism": "핵심 메커니즘 한 줄 (30~50자)",
    "mechanism_en": "One-line core mechanism (max 80 chars)"
  }},

  "integration": {{
    "headline": "실제 활용 타이틀 (15~20자)",
    "headline_en": "Real-world application title (max 40 chars)",
    "body": "실제 세계에서 어떻게 쓰이는지 (80~120자)",
    "body_en": "Real-world usage (max 180 chars)",
    "impact": "검증 가능한 프로젝트/모델/사례 기반 임팩트 (30~50자). 추상 표현 금지. 수치(벤치마크/%) 또는 구체적 모델/프로젝트명 1개+ 필수",
    "impact_en": "Verifiable project/model/case impact (max 80 chars). No vague superlatives"
  }},

  "deepDive": {{
    "originalProblem": "인사이트에서 다룬 원리를 학문적 기원으로 확장 — 논문/저서명 1개+, 인물+년도 (100~150자)",
    "originalProblem_en": "Extend from insight to academic origin — 1+ paper/book (2-3 sentences)",
    "bridge": "원래 학문→AI 대응 관계를 명시적 매핑(X→Y)으로 최소 2쌍 제시 + 각 쌍마다 왜 그 대응이 성립하는지 1문장 설명 + 보존된 구조 vs 변형/생략된 부분 구분 (200~300자)",
    "bridge_en": "Explicit mapping (X→Y) of at least 2 pairs + 1-sentence WHY for each correspondence + preserved vs. transformed/omitted (4-6 sentences)",
    "coreIntuition": "핵심 수식의 작동 규칙 (150~250자). difficulty별 필수 요소: beginner=①②만, intermediate=①②③, advanced=①②③④. ① 각 변수 의미 ② 조건별 분기(언제 무조건 수용/언제 확률적) ③ 파라미터 변화→행동 변화 ④ 수렴 조건. analogy 수준이면 실격",
    "coreIntuition_en": "Decision rule (max 350 chars). Required elements by difficulty: beginner=①② only, intermediate=①②③, advanced=①②③④. ① variable meanings ② conditional branches ③ parameter sensitivity ④ convergence conditions. DISQUALIFIED if analogy-level",
    "formula": "핵심 수식 1개(LaTeX). 수학/물리/정보이론/통계이면 필수. 단일 줄, \\begin/\\end 금지, \\frac 1단 중첩까지",
    "formula_en": "formula와 동일한 LaTeX를 그대로 사용 (수학 기호는 언어 무관). formula 필드를 복사할 것",
    "limits": "AI 적용 시 구체적 한계 — 원리 자체의 일반적 한계 금지, AI 시스템에 적용할 때만 드러나는 한계 필수 (100~150자)",
    "limits_en": "AI-specific limitations (2-3 sentences)"
  }},

  "deepDiveHook": "딥다이브로 유도하는 콘텐츠 맞춤형 티저 (30~40자). '더 자세히 알아보기' 같은 범용 문구 금지. 예: '이 원리가 1943년에 어떻게 시작되었는지 →'",
  "deepDiveHook_en": "Content-specific teaser for deep dive (max 60 chars). NOT generic like 'Learn more'. e.g., 'How this principle began in 1943 →'",

  "takeaway": "학습자가 모든 콘텐츠를 읽고 기억해야 할 핵심 한 문장 (30~50자). 예: '자연의 냉각 과정이 AI 최적화의 핵심 전략이 되었다'",
  "takeaway_en": "One-sentence core insight the learner should remember (max 70 chars)",

  "keywords": ["한국어 키워드 1", "한국어 키워드 2", "한국어 키워드 3"],
  "keywords_en": ["keyword 1", "keyword 2", "keyword 3"],
  "difficulty": "beginner 또는 intermediate 또는 advanced",
  "connectionType": "direct_inspiration 또는 structural_analogy 또는 mathematical_foundation",
  "readTime": "1분 또는 2분 (인사이트만 1분, 딥다이브 포함 2분)"
}}

## 작성 지침

### 인사이트 품질 기준
- foundation.body: 정의 나열 금지. "근본 질문 → 원래 학문의 실제 메커니즘 → 핵심 발상"의 서사 필수. 독자가 원래 분야에서 이 원리가 **물리적·수학적으로 어떻게 작동하는지** 이해할 수 있어야 함
  - 필수 체크: ① 원래 학문의 구체적 물리량·변수·현상 명시 (온도/원자/에너지, 전하/전류, 뉴런/시냅스, 유전자/적합도 등) ② 입력→과정→결과의 인과 전개 ③ AI 관점이 아닌 원래 분야 전문가가 읽어도 정확한 서술 — "최적화 관점에서만 서술하고 원래 학문의 실체를 생략"하면 실격
  - 나쁜 예: "복잡한 문제에서 눈앞의 해에 갇히곤 한다. 담금질 기법은 뜨거울 땐 나쁜 길도 가보고 식어가며 신중해진다." (← 최적화 관점만 서술, 물리적 담금질 메커니즘 없음)
  - 좋은 예: "금속에 높은 열을 가하면 원자가 활발히 움직여 재배치되고, 서서히 냉각하면 낮은 에너지 상태에 안착해 결함 적은 결정 구조가 된다. 이 물리 과정을 수식화하여, 탐색 초기엔 나쁜 해도 확률적으로 수용하고 점차 수렴시키는 것이 담금질 기법이다."
- foundation.analogy: **작동 과정(HOW)**을 비유. 결과(WHAT)만 비유하면 실패
  - 나쁜 예: "눈과 귀가 합쳐져 더 잘 인식하는 것"
  - 좋은 예: "눈과 귀가 서로 다른 확신도로 투표하여, 더 확신하는 쪽에 가중치를 주는 것"
- application.problem: 추상적("성능이 낮다") 금지. 시나리오+실패 상황 묘사. 난제 유형 다양화: 성능 한계, 계산 비용, 안전 문제, 편향, 확장성 벽 등. "X%가 Y될 때" 패턴 반복 금지
- application.body: problem 단순 반복 금지. "기존 방법의 한계 → 이 원리의 어떤 속성이 돌파구" = 새로운 정보 추가
- integration.impact: "혁신적으로 향상" 같은 추상 표현 금지. 검증 가능한 수치(논문 벤치마크) 또는 구체적 프로젝트/기업/모델명 사용

### 딥다이브 품질 기준 — 인사이트의 연장선에서 전문성 심화
독자는 인사이트 3장을 읽은 후 "더 알고 싶다"는 동기로 딥다이브를 엽니다. 갑자기 논문 나열로 시작하면 이탈합니다. originalProblem에서 인사이트의 "근본 질문"을 학술적 맥락으로 자연스럽게 확장하고, bridge → coreIntuition → formula → limits 순으로 전문성을 점진적으로 높이세요.

- originalProblem: 논문/저서명 1개+, 인물+년도. foundation의 "근본 질문"과 이어지는 학술적 맥락. **중요: foundation.body에서 이미 설명한 메커니즘을 반복하지 말 것. originalProblem은 반드시 새로운 학술 맥락(논문/저서명, 저자, 연도)을 추가해야 함**
- bridge (가장 중요): 원래 학문에서 AI로 건너올 때 **구체적 대응 관계**를 명시 + 보존/변형 구분
  - 필수 체크: ① 원래 학문의 핵심 변수/개념 최소 2개를 AI 대응물과 명시적으로 짝지을 것 (X→Y 형태) + 각 쌍마다 왜 그 대응이 성립하는지 1문장 설명 ② 보존된 것: 어떤 수학적 구조/논리가 그대로 살아남았는지 ③ 변형/생략된 것: 원래 분야에서는 중요하지만 AI에서 버린 것은 무엇이고 왜 버렸는지
  - 수학/물리/제어공학: "보존된 수학적 구조 vs 변형된 구현" (예: SA — 에너지→목적함수, 물리온도→탐색온도T, 원자배치→해공간상태, Boltzmann분포 보존 / 결정격자·원자간 상호작용 생략)
  - 생물학/심리학/경제학: "추상화된 핵심 원리 vs 버려진 세부사항" — 무리하게 "수학적 보존"에 끼워 맞추지 말 것
- coreIntuition: 핵심 수식/알고리즘의 작동 규칙을 서술. analogy와 같은 일상 비유이면 실격. **difficulty에 따라 필수 요소가 다름**:
  - 전체 요소: ① 각 변수가 AI에서 무엇을 의미하는지 ② **조건별 분기**: 수식이 적용되는 조건과 적용되지 않는 조건 (예: "ΔE≤0이면 무조건 수용, ΔE>0일 때만 e^(-ΔE/T)>U로 확률 판단") ③ **파라미터 감수성**: 각 변수 변화가 동작을 어떻게 바꾸는지 (예: "T↑→수용확률↑→광역탐색, ΔE 작을수록→수용 쉬움") ④ **수렴 조건**: 어떤 설정이면 수렴 확률이 높아지는지 (예: "T0↑, cooling_rate→1, 반복횟수↑이면 전역 최적해 수렴 확률↑")
  - beginner: ①② 필수. 용어 1~2개 + 풀어쓴 설명 (예: "적합도(fitness)가 높은 해를 더 많이 복제하여..."). ③④는 불필요
  - intermediate: ①②③ 필수. 용어 3~4개 (예: "N차원 파라미터 공간에서 손실 곡면의..."). ④는 선택
  - advanced: ①②③④ 모두 필수. 수학적 엄밀성 (예: "확률 분포 p(x)의 KL divergence를 최소화하는...")
- formula: 수학/물리/정보이론/통계이면 빈 문자열 금지
- limits: "더 연구 필요" 수준 금지. 원리 자체의 일반적 한계가 아니라 AI 시스템에 적용할 때만 드러나는 한계만 서술 (distribution shift, non-convexity, adversarial robustness, 고차원 파라미터 공간의 스케일링 문제 등)
  - 나쁜 예: "담금질 기법은 최적 냉각 스케줄 설정이 어렵고 계산 비용이 높다" (← 원리 자체의 일반적 한계)
  - 좋은 예: "gradient-based 방법이 미분 가능 목적함수에선 더 효율적이라 현대 DL에서 SA 직접 사용이 제한됨. 고차원 파라미터 공간에서 냉각 스케줄 설정이 기하급수적으로 어려워지고, distribution shift 환경에서 학습된 스케줄이 무효화됨"

### 언어 규칙
- 한국어 필드는 한국어, _en 필드는 자연스러운 영어 (번역투 금지)
- 고유명사(인물·기관·논문·모델명)는 한국어에서도 영어 유지 (예: Geoffrey Hinton, GPT-4)
- 전문 용어 영어 병기 가능 (예: "역전파(Backpropagation)")
- AI/ML 음차 용어: agent→에이전트, fine-tuning→파인튜닝, token→토큰, transformer→트랜스포머, benchmark→벤치마크, embedding→임베딩, hallucination→할루시네이션, convolution→컨볼루션, gradient→그래디언트, dropout→드롭아웃, attention→어텐션, epoch→에포크. 불확실하면 영어 유지

## 흔한 오류 주의
- 사후적 비유를 직접적 영감으로 오해 금지. connectionType: direct_inspiration=논문 인용 관계 존재, structural_analogy=사후적 유사성, mathematical_foundation=동일 수학적 도구
- 역전파는 biologically implausible — 해당 시 명시. 인공 신경망 ≠ 실제 뇌
- difficulty 수준별 요구사항:
  - beginner: 수학 불필요. foundation.body와 analogy에서 전문 용어 최소화, 병기 시 괄호 설명 필수 (예: "적합도(fitness, 해가 얼마나 좋은지)"). coreIntuition은 ①② 요소만 (변수 의미 + 조건별 분기), 일상 언어로 서술
  - intermediate: 기초 미적분/선형대수. foundation.body와 analogy에서 전문 용어 3~4개 허용, 간단한 배경지식 가정. coreIntuition은 ①②③ 요소 (변수 의미 + 조건별 분기 + 파라미터 감수성)
  - advanced: 대학원 수준. foundation.body와 analogy에서 전문 용어 자유 사용, 수학적 표현 허용. coreIntuition은 ①②③④ 모두 (변수 의미 + 조건별 분기 + 파라미터 감수성 + 수렴 조건), 수학적 엄밀성 필수
- JSON만 출력 (추가 설명 없이)

REMINDER: Your JSON MUST contain ALL of the following top-level keys: title, title_en, foundation, application, integration, deepDive, deepDiveHook, deepDiveHook_en, takeaway, takeaway_en, keywords, keywords_en, difficulty, connectionType, readTime. Missing any key is an error."""


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
6. **원리 설명+필요성**: foundation.body가 "어떤 문제/상황에서 출발했고, 어떤 발상이 돌파구였는지" 서사를 담고 있는가? 원래 학문의 구체적 물리량·변수·현상이 명시되어 있는가? (예: SA라면 "온도/원자/에너지/결정구조" 등 물리적 실체가 있어야 함. "복잡한 문제/좋은 해" 같은 추상어만으로 서술하면 insightClarity ≤ 0.5) 정의만 2~3줄 나열하면 insightClarity ≤ 0.6으로 감점
7. **비유 메커니즘**: analogy가 결과가 아닌 핵심 메커니즘(과정)을 비유하는가? (결과만 비유하면 감점)
8. **문제→해법 연결**: application.problem이 구체적 시나리오/수치를 포함하는가? application.body가 problem의 난제를 원리의 어떤 특성으로 해결하는지 논리적으로 연결하는가?
9. **영향 구체성**: integration.impact가 구체적 수치나 사례를 포함하는가? ("혁신적으로 향상" 같은 추상적 표현이면 감점)

### C. 딥다이브 전문성 (학술적 깊이가 충분한가?)
10. **영감의 다리(bridge)**: 원래 학문→AI의 명시적 대응 매핑(X→Y)이 최소 2쌍 있고, 각 쌍마다 왜 그 대응이 성립하는지 설명이 있는가? "보존된 핵심 구조"와 "변형/생략된 부분"이 구체적 예시와 함께 명시적으로 구분되어 있는가? (수학/물리: 수학적 구조 보존/변형, 생물학/심리학: 추상화된 원리/버려진 세부사항 — 분야에 맞는 프레임을 쓰고 있는가?) 매핑 없이 추상적 서술만 하면 deepDiveDepth ≤ 0.5
11. **핵심 직관(coreIntuition)**: difficulty에 따라 평가 기준이 다름. ① 각 변수의 AI 의미 ② 조건별 분기 ③ 파라미터 감수성 ④ 수렴 조건.
    - difficulty=beginner: ①② 포함 여부로 평가. ③④ 없어도 감점 안 함. 단, 설명 없는 전문 용어 사용 시 insightClarity 감점
    - difficulty=intermediate: ①②③ 포함 여부로 평가. ④ 없어도 감점 안 함
    - difficulty=advanced: ①②③④ 모두 필수. 2개 이하만 있으면 deepDiveDepth ≤ 0.5. 내용이 너무 피상적이면 deepDiveDepth 감점
    - 공통: foundation.analogy와 동일한 일상 비유 수준이면 deepDiveDepth ≤ 0.4로 강하게 감점
12. **수식(formula)**: 수학/물리/정보이론/통계 관련 원리인데 formula가 빈 문자열이면 감점
13. **한계(limits)**: 원리 자체의 일반적 한계(예: "계산 비용이 높다", "최적 파라미터 설정이 어렵다")가 아닌, AI 시스템에 적용할 때만 드러나는 한계(예: gradient-based 대안 대비 열위, 고차원 파라미터 공간 스케일링, distribution shift)를 다루는가? 원리 자체의 일반 한계만 서술하면 deepDiveDepth ≤ 0.5로 감점
14. **학술 정보 밀도**: originalProblem/bridge에 인물명·년도가 충분히 포함되어 있는가? (년도 1개+인물 1명 미만이면 deepDiveDepth ≤ 0.6)

### D. 한영 일관성 및 품질
15. **한영 의미 일관성**: 한국어 필드와 _en 필드의 의미가 동일한가? 핵심 팩트(수치, 인물명, 년도)가 양쪽에 모두 포함되어 있는가? (한쪽에만 있는 정보가 있으면 감점)
16. **영어 자연스러움**: _en 필드가 번역투 없이 자연스러운 영어인가? (한국어 문장 구조가 그대로 남아있으면 감점)
17. **3단계 서사 일관성**: foundation → application → integration이 논리적으로 이어지는가? 각 단계가 서로 모순되지 않는가?

### E. difficulty 수준 적합성
18. **beginner 전문 용어 검사**: difficulty=beginner인데 괄호 설명 없이 전문 용어를 사용하면 insightClarity 감점. 학습자가 배경지식 없이 이해할 수 있어야 함
19. **advanced 깊이 검사**: difficulty=advanced인데 coreIntuition이 ①② 수준에 머물거나 body가 beginner 수준으로 피상적이면 deepDiveDepth 감점. advanced는 수학적 엄밀성이 있어야 함

### F. 신규 필드 검증
20. **deepDiveHook 적절성**: deepDiveHook이 콘텐츠에 특화된 구체적 티저인가? "더 자세히 알아보기", "딥다이브로 이동" 같은 범용 문구이면 감점. 콘텐츠의 특정 사실/년도/인물/메커니즘을 언급해야 함
21. **takeaway 적절성**: takeaway가 전체 콘텐츠의 핵심 인사이트를 한 문장으로 압축하는가? headline 단순 반복이면 감점. 학습자가 "이것 하나만 기억하면 된다"고 느낄 수 있는 문장이어야 함

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
        content_json=json.dumps(content, ensure_ascii=False)[:6000],
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

        # 3. deepDive.bridge에 보존/변형 또는 추상화/생략 키워드가 있는지
        bridge = content.get("deepDive", {}).get("bridge", "")
        _bridge_preserve = any(kw in bridge for kw in ("보존", "preserved"))
        _bridge_change = any(kw in bridge.lower() for kw in ("변형", "생략", "추상화", "transform", "omit", "abstract", "discard"))
        if bridge and not _bridge_preserve and not _bridge_change:
            quality_warnings.append("bridge에 보존/변형 또는 추상화/생략 구분이 없음")

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

        # 6. headline 길이 검사 (UI 한 줄 표시 기준)
        for section in ("foundation", "application", "integration"):
            hl = content.get(section, {}).get("headline", "")
            if len(hl) > 25:
                quality_warnings.append(f"{section}.headline이 너무 긺 ({len(hl)}자, 권장 15~20자)")

        # 7. body 길이 검사 (모바일 카드 가독성)
        for section in ("foundation", "application", "integration"):
            body = content.get(section, {}).get("body", "")
            if len(body) > 150:
                quality_warnings.append(f"{section}.body가 너무 긺 ({len(body)}자, 권장 80~120자)")

        # 8. _en 필드 존재 검사 (영어 사용자 대응)
        missing_en = []
        for section_key in ("foundation", "application", "integration"):
            section_data = content.get(section_key, {})
            for field in ("headline_en", "body_en"):
                if not section_data.get(field):
                    missing_en.append(f"{section_key}.{field}")
        if missing_en:
            quality_warnings.append(f"영어 필드 누락: {', '.join(missing_en)}")

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

    # 개별 sub-score 심각 부족 시 재시도 (0.5 미만)
    if retry_count < 3:
        low_scores = []
        for key in ("principleAccuracy", "mappingAccuracy", "insightClarity", "deepDiveDepth"):
            val = verification.get(key, 1.0)
            if isinstance(val, (int, float)) and val < 0.5:
                low_scores.append(f"{key}={val:.2f}")
        if low_scores:
            ci_warning(f"sub-score 심각 부족 ({', '.join(low_scores)}), 재시도 {retry_count + 1}/3")
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

    # ── TEMP: Simulated Annealing 고정 모드 — 시드 교체 없이 유지 ──
    sa_seed = next((s for s in PRINCIPLE_SEEDS if s["id"] == "opt_simulated_annealing"), None)
    if sa_seed:
        new_seed = sa_seed
        print(f"  [retry_reseed] ⚠ TEMP: Simulated Annealing 고정 유지 (재시도 {retry_count}/3)")
    else:
        candidates = [s for s in PRINCIPLE_SEEDS if s["id"] != old_seed_id]
        if not candidates:
            candidates = list(PRINCIPLE_SEEDS)
        new_seed = random.choice(candidates)
        print(f"  [retry_reseed] 시드 교체: {old_seed_id} -> {new_seed['id']} (재시도 {retry_count}/3)")
    return {"seed": new_seed, "retry_count": retry_count, "content": None, "verification": None}


# ─── readTime 계산 (글자 수 기반) ───
_KO_CHARS_PER_MIN = 500  # 한국어 평균 읽기 속도 (~500자/분)


def _calc_read_time(content: dict) -> str:
    """콘텐츠 전체 텍스트 필드의 글자 수를 세어 읽기 시간(분) 계산.

    대상 필드: foundation.body, application.body, integration.body,
    deepDive 전 섹션 (originalProblem, bridge, coreIntuition, limits).
    headline, analogy, mechanism, impact 등 짧은 필드도 포함.
    """
    total = 0
    for section_key in ("foundation", "application", "integration"):
        section = content.get(section_key, {})
        if isinstance(section, dict):
            for v in section.values():
                if isinstance(v, str):
                    total += len(v)
    dd = content.get("deepDive", {})
    if isinstance(dd, dict):
        for v in dd.values():
            if isinstance(v, str):
                total += len(v)
    minutes = max(1, round(total / _KO_CHARS_PER_MIN))
    return f"{minutes}분"


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
            "readTime": _calc_read_time(content),
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
