"""
학제간 AI 인사이트 파이프라인 -- LangGraph 4-노드

seed_selector → content_generator → verifier → assembler

1. seed_selector:       최근 30일 사용 시드 제외 + 학문 분야 로테이션 + 랜덤 선택
2. content_generator:   Gemini LLM 으로 자유 형식 마크다운 텍스트 생성 (KO + EN)
3. verifier:            별도 LLM 호출로 콘텐츠 품질 검증 (confidence < 0.7 시 재시도)
4. assembler:           Firestore daily_principles 문서 구성
"""

import json
import random
import re
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated, TypedDict

from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END

from google.cloud.firestore_v1.base_query import FieldFilter

from agents.config import get_llm, get_firestore_client
from agents.principle_seeds import PRINCIPLE_SEEDS
from agents.ci_utils import ci_warning, ci_error


# ─── Curated content 경로 ───
_CURATED_DIR = Path(__file__).resolve().parent.parent / "curated_principles"


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
    content: dict | None            # 생성된 콘텐츠 {"ko": str, "en": str, "difficulty": str, ...}
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


# ─── Curated 콘텐츠 로더 ───
def _load_curated_content(seed_id: str) -> dict | None:
    """curated_principles/ 폴더에서 시드 ID 에 해당하는 마크다운 파일 로드.

    파일 구조 예시 (scripts/curated_principles/{seed_id}.md):
        ---
        difficulty: intermediate
        connectionType: direct_inspiration
        keywords: 담금질, 최적화, 메타휴리스틱
        keywords_en: annealing, optimization, metaheuristic
        ---
        (한국어 본문 마크다운)
        ---EN---
        (영어 본문 마크다운)

    Returns dict with keys: content_ko, content_en, difficulty, connectionType,
    keywords, keywords_en.  Returns None if file not found.
    """
    md_path = _CURATED_DIR / f"{seed_id}.md"
    if not md_path.exists():
        return None

    raw = md_path.read_text(encoding="utf-8")
    print(f"  [curated] 파일 로드: {md_path.name} ({len(raw)}자)")

    # Parse front-matter between first two ---
    parts = raw.split("---", 2)
    if len(parts) < 3:
        ci_warning(f"curated {seed_id}: front-matter 파싱 실패")
        return None

    meta_raw = parts[1].strip()
    body_rest = parts[2]

    # Parse simple YAML-like front-matter
    meta: dict = {}
    for line in meta_raw.splitlines():
        if ":" in line:
            key, val = line.split(":", 1)
            meta[key.strip()] = val.strip()

    # Split KO / EN body by ---EN--- marker
    if "---EN---" in body_rest:
        ko_part, en_part = body_rest.split("---EN---", 1)
    else:
        ko_part = body_rest
        en_part = ""

    def _parse_keywords(s: str) -> list[str]:
        return [k.strip() for k in s.split(",") if k.strip()] if s else []

    result = {
        "content_ko": ko_part.strip(),
        "content_en": en_part.strip(),
        "difficulty": meta.get("difficulty", "intermediate"),
        "connectionType": meta.get("connectionType", "structural_analogy"),
        "keywords": _parse_keywords(meta.get("keywords", "")),
        "keywords_en": _parse_keywords(meta.get("keywords_en", "")),
        "content_source": "curated",
    }
    print(f"  [curated] KO {len(result['content_ko'])}자, EN {len(result['content_en'])}자")
    return result


# ─── Node 2: content_generator ───
_CONTENT_PROMPT = """당신은 AI를 공부하는 대학생에게 학제간 인사이트를 전달하는 콘텐츠 작가입니다.
시드 데이터를 기반으로, 1~2분 안에 읽을 수 있는 자유 형식 마크다운 텍스트를 생성하세요.

## 시드 데이터
- 학문 분야: {discipline_name}
- 원리: {principle_name} ({principle_name_en})
- AI 연결: {ai_connection} ({ai_connection_en})
- 해결 문제: {problem_solved}

## 출력 형식
JSON 객체 하나를 출력합니다. 키는 아래와 같습니다.

{{
  "content_ko": "자유 형식 마크다운 텍스트 (한국어, 300~600자)",
  "content_en": "Free form markdown text (English, equivalent content)",
  "difficulty": "beginner | intermediate | advanced",
  "connectionType": "direct_inspiration | structural_analogy | mathematical_foundation",
  "keywords": ["한국어 키워드 1", "키워드 2", "키워드 3"],
  "keywords_en": ["keyword 1", "keyword 2", "keyword 3"]
}}

## content_ko / content_en 작성 규칙

하나의 연속된 텍스트로 작성합니다. JSON 프로퍼티나 섹션 분리 없이, 자연스러운 흐름의 마크다운입니다.

### 구성 흐름 (순서대로, 하나의 텍스트 안에서)
1. **한줄 정의**: "{principle_name} - 한줄 정의" 형태로 시작. 원래 학문에서의 의미와 AI 연결을 한 문장에 압축
2. **원리 해설**: 원래 학문에서 이 원리가 어떻게 작동하는지 설명. 구체적 물리량/변수/현상 명시
3. **AI 연결**: 이 원리가 AI에서 어떻게 재등장했는지. 괄호 안에 AI 대응 개념 병기 (예: "온도(탐색 범위)")
4. **수식과 직관**: 핵심 수식을 평문으로 표기 + 각 변수의 의미 설명
5. **실제 임팩트**: 구체적 모델/프로젝트/벤치마크 수치

### 서식 규칙
- 수식은 LaTeX가 아닌 **평문** 표기: `dE = E(new) - E(old)`, `e^(-dE/T) > U`, `P(accept) = e^(-dE/T)` 형태
- 괄호 안에 AI 대응 개념 병기: "온도 T(탐색 범위)", "에너지(목적함수 값)"
- 인라인 용어 정의: "Annealing(담금질) - 금속 공학에서..." 형태
- 줄바꿈으로 단락 구분, 빈 줄로 큰 흐름 전환
- **볼드**로 핵심 개념 강조 허용
- 300~600자 (KO 기준). 짧고 밀도 높게

### 톤 & 스타일
- 독자 반응 목표: "오, 이게 여기서 온 거구나!" — 발견의 쾌감
- 교과서 정의 나열 금지. 서사적 전개
- "직접적 영감"과 "구조적 유사성"을 정직하게 구분
- 사실 기반 (인물/년도 포함, 불확실하면 "약 ~년")
- 검증 가능한 수치만 사용

### 참조 예시 (스타일 참고용)
```
Simulated Annealing - 금속 공학에서 사용되는 가열냉각에서 유래한 방법으로, 전역최적해를 찾기 위한 확률적 메타휴리스틱 기법

**Annealing(담금질)의 원리**
금속에 높은 열을 가한 후, 서서히 냉각시킴.
원자들이 활발히 움직이다 낮은 에너지 상태로 안착 — 결함 적은 결정구조 형성

**AI에서의 재등장**
최적화 문제에서 지역최적해(local optimum)에 갇히는 문제를 해결
초기에는 나쁜 해도 확률적으로 수용(높은 온도), 점차 엄격해짐(냉각)

dE = E(new) - E(old) 에서
dE <= 0 이면 무조건 수용 (더 좋은 해)
dE > 0 이면 e^(-dE/T) > U 일때만 수용 (나쁜 해도 확률적 수용)
T가 높을수록, dE가 낮을수록 수용 확률이 높아짐!

Kirkpatrick et al.(1983)이 VLSI 회로 배치에 적용, 이후 신경망 가중치 최적화에 영향
```

### 언어 규칙
- content_ko: 한국어, 고유명사는 영어 유지
- content_en: 자연스러운 영어 (번역투 금지), content_ko와 동일 내용
- 전문 용어 영어 병기 가능
- connectionType: direct_inspiration=논문 인용 관계, structural_analogy=사후적 유사성, mathematical_foundation=동일 수학적 도구

## 중요
- JSON만 출력 (추가 설명 없이)
- content_ko와 content_en의 내용은 동일해야 함 (언어만 다름)
- 300~600자(KO) 엄수. 너무 짧거나 너무 길면 안 됨"""


@_safe_node("content_generator")
def content_generator(state: PrincipleGraphState) -> dict:
    """시드 기반 LLM 콘텐츠 생성 (자유 형식 마크다운 텍스트, KO + EN)"""
    seed = state["seed"]
    if not seed:
        return {"errors": ["content_generator: seed가 비어있음"]}

    # ── Curated 콘텐츠 확인 ──
    curated = _load_curated_content(seed["id"])
    if curated:
        print(f"  [content_generator] curated 콘텐츠 사용: {seed['id']}")
        return {"content": curated}

    # ── LLM 생성 ──
    llm = get_llm(temperature=0.4, max_tokens=4096, thinking=False, json_mode=True)

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

    # 필수 키 검증
    required_keys = {"content_ko", "content_en", "difficulty", "connectionType", "keywords", "keywords_en"}
    missing = required_keys - set(content.keys())
    if missing:
        ci_warning(f"content_generator: 필수 키 누락: {missing} — 재시도 유도")
        return {"errors": [f"content_generator: 필수 키 누락: {missing}"], "content": None}

    # 콘텐츠 길이 검증
    ko_len = len(content.get("content_ko", ""))
    en_len = len(content.get("content_en", ""))
    if ko_len < 100:
        ci_warning(f"content_generator: content_ko 너무 짧음 ({ko_len}자)")
        return {"errors": [f"content_generator: content_ko 너무 짧음 ({ko_len}자)"], "content": None}

    # content_source 마킹
    content["content_source"] = "generated"

    # ── 로그 ──
    print(f"  [content_generator] ── 생성 완료 ──")
    print(f"    difficulty:     {content.get('difficulty', '?')}")
    print(f"    connectionType: {content.get('connectionType', '?')}")
    print(f"    keywords:       {content.get('keywords', [])}")
    print(f"    content_ko:     {ko_len}자")
    print(f"    content_en:     {en_len}자")
    print(f"    content_ko 미리보기: {content.get('content_ko', '')[:120]}...")

    return {"content": content}


# ─── Node 3: verifier ───
_VERIFY_PROMPT = """IMPORTANT: Output ONLY a valid JSON object. No markdown, no code fences, no explanation before or after. Start with '{{'.

당신은 학제간 과학/공학 사실 검증 전문가입니다.
아래 콘텐츠가 사실적으로 정확하고 품질 기준을 충족하는지 검증하세요.

## 시드 데이터 (참고용)
- 학문 분야: {discipline_name}
- 원리: {principle_name} ({principle_name_en})
- AI 연결: {ai_connection} ({ai_connection_en})
- 해결 문제: {problem_solved}

## 검증 대상 콘텐츠 (자유 형식 마크다운)

### 한국어 (content_ko)
{content_ko}

### 영어 (content_en)
{content_en}

### 메타데이터
- difficulty: {difficulty}
- connectionType: {connectionType}

## 검증 기준

### A. 사실 정확성 (principleAccuracy)
1. 원리 설명이 학술적으로 정확한가? 핵심 인물/년도가 올바른가?
2. 날짜, 인물, 논문명, 수식 등 구체적 사실에 오류가 없는가?
3. connectionType 분류가 적절한가?

### B. 원리-AI 매핑 정확성 (mappingAccuracy)
4. 원리에서 AI 기술로의 연결이 실제 존재하는 학술적 관계인가?
5. 연결의 강도가 과장되지 않았는가?
6. 괄호 안 AI 대응 개념이 정확한가?

### C. 텍스트 품질 (contentQuality)
7. 한줄 정의로 시작하는가?
8. 원래 학문의 구체적 메커니즘(물리량/변수/현상)이 포함되어 있는가? 추상어만 나열하면 감점
9. 수식이 평문으로 표기되어 있고 각 변수 의미가 설명되어 있는가?
10. 구체적 임팩트(모델명/벤치마크/수치)가 있는가? 추상적이면 감점
11. 300~600자(KO) 범위인가?

### D. 한영 일관성 (bilingualConsistency)
12. content_ko와 content_en의 핵심 팩트(수치, 인물, 년도, 수식)가 동일한가?
13. 영어가 번역투 없이 자연스러운가?

## 출력 형식
{{
  "verified": true 또는 false,
  "confidence": 0.0~1.0,
  "principleAccuracy": 0.0~1.0,
  "mappingAccuracy": 0.0~1.0,
  "contentQuality": 0.0~1.0,
  "bilingualConsistency": 0.0~1.0,
  "factCheck": "검증 이유 2-3문장",
  "issues": ["문제점 1", "문제점 2"] 또는 빈 배열
}}

Example:
{{"verified": true, "confidence": 0.85, "principleAccuracy": 0.9, "mappingAccuracy": 0.8, "contentQuality": 0.85, "bilingualConsistency": 0.8, "factCheck": "SA 원리 설명 정확, Kirkpatrick 1983 인용 올바름. 수식 평문 표기 양호.", "issues": []}}"""


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
        "contentQuality": _float(r'"contentQuality"\s*:\s*([0-9.]+)'),
        "bilingualConsistency": _float(r'"bilingualConsistency"\s*:\s*([0-9.]+)'),
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
    """별도 LLM 호출로 자유 형식 콘텐츠 품질 검증"""
    seed = state["seed"]
    content = state.get("content")
    if not content:
        return {"verification": {"verified": False, "confidence": 0.0, "factCheck": "콘텐츠 없음"}}

    # Curated 콘텐츠는 검증 건너뜀 (사전 검수 완료)
    if content.get("content_source") == "curated":
        print(f"  [verifier] curated 콘텐츠 — 검증 건너뜀")
        return {"verification": {
            "verified": True, "confidence": 1.0,
            "principleAccuracy": 1.0, "mappingAccuracy": 1.0,
            "contentQuality": 1.0, "bilingualConsistency": 1.0,
            "factCheck": "curated 콘텐츠 (사전 검수 완료)", "issues": [],
        }}

    llm = get_llm(temperature=0.0, max_tokens=2048, thinking=False, json_mode=True)

    prompt = _VERIFY_PROMPT.format(
        discipline_name=seed["discipline_name"],
        principle_name=seed["principle_name"],
        principle_name_en=seed["principle_name_en"],
        ai_connection=seed["ai_connection"],
        ai_connection_en=seed["ai_connection_en"],
        problem_solved=seed["problem_solved"],
        content_ko=content.get("content_ko", "")[:3000],
        content_en=content.get("content_en", "")[:3000],
        difficulty=content.get("difficulty", "intermediate"),
        connectionType=content.get("connectionType", "structural_analogy"),
    )

    # JSON 파싱 실패 시 최대 3회 시도
    verification = None
    _DEFAULT_FAIL = {
        "verified": False, "confidence": 0.0,
        "principleAccuracy": 0.0, "mappingAccuracy": 0.0,
        "contentQuality": 0.0, "bilingualConsistency": 0.0,
        "factCheck": "", "issues": [],
    }
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            response = _llm_invoke_with_retry(llm, [HumanMessage(content=prompt)])
            raw = response.content
            print(f"  [verifier] attempt {attempt+1}/{max_attempts} — response preview: {repr(raw[:300]) if raw else '(empty)'}")

            if not raw or not raw.strip():
                ci_warning(f"verifier attempt {attempt+1}: empty response from Gemini, retrying")
                time.sleep(1)
                continue

            verification = _safe_json_parse(raw)
            break
        except json.JSONDecodeError as e:
            fallback = _regex_extract_verification(raw)
            if fallback:
                print(f"  [verifier] JSON 파싱 실패 -> regex 폴백 성공")
                verification = fallback
                break
            if attempt < max_attempts - 1:
                ci_warning(f"verifier JSON 파싱 실패 (attempt {attempt+1}), 재시도: {e.msg}")
                time.sleep(1)
            else:
                ci_error(f"verifier JSON 파싱 {max_attempts}회 연속 실패: {e.msg}")
                verification = {**_DEFAULT_FAIL, "factCheck": f"JSON 파싱 실패: {e.msg}", "issues": ["JSON 파싱 실패"]}

    if verification is None:
        ci_error("verifier: 모든 시도에서 빈 응답")
        verification = {**_DEFAULT_FAIL, "factCheck": "Gemini 빈 응답", "issues": ["빈 응답"]}

    verified = verification.get("verified", False)
    confidence = verification.get("confidence", 0.0)
    principle_acc = verification.get("principleAccuracy", 0.0)
    mapping_acc = verification.get("mappingAccuracy", 0.0)
    content_quality = verification.get("contentQuality", 0.0)
    bilingual = verification.get("bilingualConsistency", 0.0)
    issues = verification.get("issues", [])

    print(f"  [verifier] ── 검증 결과 ──")
    print(f"    verified:              {verified}")
    print(f"    confidence:            {confidence:.2f}")
    print(f"    principleAccuracy:     {principle_acc:.2f}" if isinstance(principle_acc, (int, float)) else f"    principleAccuracy:     {principle_acc}")
    print(f"    mappingAccuracy:       {mapping_acc:.2f}" if isinstance(mapping_acc, (int, float)) else f"    mappingAccuracy:       {mapping_acc}")
    print(f"    contentQuality:        {content_quality:.2f}" if isinstance(content_quality, (int, float)) else f"    contentQuality:        {content_quality}")
    print(f"    bilingualConsistency:  {bilingual:.2f}" if isinstance(bilingual, (int, float)) else f"    bilingualConsistency:  {bilingual}")
    print(f"    factCheck:             {verification.get('factCheck', '')[:80]}")
    if issues:
        print(f"    issues ({len(issues)}건):")
        for issue in issues[:5]:
            print(f"      - {str(issue)[:80]}")
    else:
        print(f"    issues:                (없음)")
    print(f"    판정:                  {'PASS' if verified and confidence >= 0.7 else 'FAIL -> 재시도 여부 확인'}")

    # ── 코드 레벨 품질 경고 ──
    if content and isinstance(content, dict):
        quality_warnings: list[str] = []

        ko_text = content.get("content_ko", "")
        en_text = content.get("content_en", "")

        # 1. KO 길이 범위
        ko_len = len(ko_text)
        if ko_len < 200:
            quality_warnings.append(f"content_ko 너무 짧음 ({ko_len}자, 권장 300~600)")
        elif ko_len > 800:
            quality_warnings.append(f"content_ko 너무 긺 ({ko_len}자, 권장 300~600)")

        # 2. EN 본문 존재
        if len(en_text) < 50:
            quality_warnings.append(f"content_en 너무 짧음 ({len(en_text)}자)")

        # 3. 한줄 정의로 시작하는지 (첫 줄에 " - " 패턴)
        first_line = ko_text.split("\n")[0] if ko_text else ""
        if " - " not in first_line and ko_len > 0:
            quality_warnings.append("content_ko 첫 줄에 한줄 정의(X - 설명) 패턴 없음")

        # 4. 수식이 평문으로 포함되어 있는지 (= 기호 존재)
        if "=" not in ko_text and ko_len > 200:
            quality_warnings.append("content_ko에 수식(평문) 없음")

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

    # content 가 None 이면 생성 실패 — 재시도
    if state.get("content") is None and retry_count < 3:
        ci_warning(f"콘텐츠 없음, 재시도 {retry_count + 1}/3")
        return "retry"

    if (not verified or confidence < 0.7) and retry_count < 3:
        ci_warning(f"검증 실패 (verified={verified}, confidence={confidence:.2f}), 재시도 {retry_count + 1}/3")
        return "retry"

    # 개별 sub-score 심각 부족 시 재시도 (0.5 미만)
    if retry_count < 3:
        low_scores = []
        for key in ("principleAccuracy", "mappingAccuracy", "contentQuality", "bilingualConsistency"):
            val = verification.get(key, 1.0)
            if isinstance(val, (int, float)) and val < 0.5:
                low_scores.append(f"{key}={val:.2f}")
        if low_scores:
            ci_warning(f"sub-score 심각 부족 ({', '.join(low_scores)}), 재시도 {retry_count + 1}/3")
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

    candidates = [s for s in PRINCIPLE_SEEDS if s["id"] != old_seed_id]
    if not candidates:
        candidates = list(PRINCIPLE_SEEDS)
    new_seed = random.choice(candidates)
    print(f"  [retry_reseed] 시드 교체: {old_seed_id} -> {new_seed['id']} (재시도 {retry_count}/3)")
    return {"seed": new_seed, "retry_count": retry_count, "content": None, "verification": None}


# ─── readTime 계산 (글자 수 기반) ───
_KO_CHARS_PER_MIN = 500  # 한국어 평균 읽기 속도 (~500자/분)


def _calc_read_time(content: dict) -> str:
    """content_ko 텍스트의 글자 수를 세어 읽기 시간(분) 계산."""
    ko_text = content.get("content_ko", "")
    total = len(ko_text) if isinstance(ko_text, str) else 0
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
            "title": seed["principle_name"],
            "title_en": seed.get("principle_name_en", ""),
            "content_ko": content.get("content_ko", ""),
            "content_en": content.get("content_en", ""),
            "difficulty": content.get("difficulty", "intermediate"),
            "keywords": content.get("keywords", []),
            "keywords_en": content.get("keywords_en", []),
            "connectionType": content.get("connectionType", "structural_analogy"),
            "readTime": _calc_read_time(content),
            "content_source": content.get("content_source", "generated"),
            "category": seed["discipline"],
            "superCategory": seed["super_category"],
        },
        "updated_at": fs.SERVER_TIMESTAMP,
    }

    # ── 저장 전 데이터 요약 로그 ──
    print(f"  [assembler] ── 최종 문서 요약 ──")
    print(f"    날짜:           {today_str}")
    print(f"    seed_id:        {seed['id']}")
    print(f"    discipline_key: {seed['discipline']}")
    print(f"    discipline:     {seed['discipline_name']}")
    print(f"    title:          {seed['principle_name']}")
    print(f"    difficulty:     {content.get('difficulty', '?')}")
    print(f"    connectionType: {content.get('connectionType', '?')}")
    print(f"    content_source: {content.get('content_source', '?')}")
    print(f"    readTime:       {doc['principle']['readTime']}")
    print(f"    superCategory:  {seed.get('super_category', '?')}")
    print(f"    keywords:       {content.get('keywords', [])}")
    print(f"    content_ko:     {len(content.get('content_ko', ''))}자")
    print(f"    content_en:     {len(content.get('content_en', ''))}자")
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
