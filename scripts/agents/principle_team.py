"""
학제간 AI 인사이트 파이프라인 -- LangGraph 4-노드

seed_selector → content_generator → verifier → assembler

1. seed_selector:       최근 30일 사용 시드 제외 + 학문 분야 로테이션 + 랜덤 선택
2. content_generator:   Gemini LLM 으로 3단계 콘텐츠 (foundation/application/integration) + deepDive 생성
3. verifier:            별도 LLM 호출로 원리-AI 매핑 사실 검증 (confidence < 0.7 시 재시도)
4. assembler:           Firestore daily_principles 문서 구성
"""

import json
import random
import re
import time
from datetime import datetime, timedelta, timezone
from typing import TypedDict

from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END

from agents.config import get_llm, get_firestore_client
from agents.principle_seeds import PRINCIPLE_SEEDS


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
    "심리학/인지과학": "Psychology / Cognitive Science",
    "경제학/게임이론": "Economics / Game Theory",
    "철학/논리학": "Philosophy / Logic",
    "언어학": "Linguistics",
    "화학": "Chemistry",
    "사회학": "Sociology",
    "의학/생명과학": "Medicine / Life Sciences",
}


# ─── 안전 JSON 파싱 ───
_VALID_JSON_ESCAPES = frozenset('"\\/bfnrtu')


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


def _safe_json_parse(text: str) -> dict:
    """LLM 응답에서 JSON 추출. 코드펜스·잘못된 이스케이프·Gemini *** 마크다운도 처리."""
    text = text.strip()
    # <thinking> 태그 제거
    text = re.sub(r'<think(?:ing)?>.*?</think(?:ing)?>', '', text, flags=re.DOTALL)
    # 코드펜스 제거
    m = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if m:
        text = m.group(1).strip()

    # Gemini *** 마크다운 제거 — 구조적 치환 후 컨텍스트 기반 치환
    if re.search(r'\*{2,}', text):
        text = re.sub(r'\[\s*\*+', '[{', text)
        text = re.sub(r'\*+\s*\]', '}]', text)
        text = re.sub(r'\*+\s*,\s*\*+', '},{', text)
        def _star_to_brace(m):
            after = text[m.end():].lstrip()
            return '{' if after and after[0] == '"' else '}'
        text = re.sub(r'\*{2,}', _star_to_brace, text)
    text = text.strip()

    # 1차: 원본 시도
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2차: invalid escape 복구 후 시도
    fixed = _fix_invalid_escapes(text)
    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass

    # 3차: JSON 영역만 추출
    for candidate in [text, fixed]:
        start = candidate.find('{')
        end = candidate.rfind('}')
        if start != -1 and end != -1:
            try:
                return json.loads(candidate[start:end+1])
            except json.JSONDecodeError:
                continue
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


# ─── State 정의 ───
class PrincipleGraphState(TypedDict):
    seed: dict                      # 선택된 시드
    content: dict | None            # 생성된 콘텐츠 (3단계 + deepDive)
    verification: dict | None       # 검증 결과
    result: dict | None             # 최종 조립 결과
    retry_count: int                # 재시도 카운터
    errors: list[str]               # 에러 로그
    node_timings: dict[str, float]  # 노드별 소요 시간


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
                import traceback
                print(f"  [ERROR] {node_name} 노드 실패 ({elapsed:.1f}s): {e}")
                traceback.print_exc()
                result = {"errors": [f"{node_name}: {e}"]}
            elapsed = time.time() - t0
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
            .where("date", ">=", cutoff_str)
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

    print(f"  [seed_selector] 최근 30일 사용 시드: {len(used_ids)}개, 최근 분야: {recent_disciplines}")

    # 후보 필터링: 최근 30일 사용 시드 제외
    candidates = [s for s in PRINCIPLE_SEEDS if s["id"] not in used_ids]

    # 분야 로테이션: 최근 3일과 같은 분야 회피
    if recent_disciplines and candidates:
        rotated = [s for s in candidates if s["discipline"] not in recent_disciplines]
        if rotated:
            candidates = rotated

    # 모든 시드 소진 시 전체에서 선택
    if not candidates:
        print("  [seed_selector] 사용 가능한 시드 없음 -> 전체에서 선택")
        candidates = list(PRINCIPLE_SEEDS)

    seed = random.choice(candidates)
    print(f"  [seed_selector] 선택: {seed['principle_name']} ({seed['discipline_name']})")

    return {"seed": seed}


# ─── Node 2: content_generator ───
_CONTENT_PROMPT = """당신은 학제간 AI 인사이트 콘텐츠 전문가입니다.
아래 주어진 시드 데이터를 기반으로, 한국 공학계열 대학생을 위한 교육 콘텐츠를 JSON으로 생성하세요.
한국어와 영어를 모두 생성해야 합니다. 영어 필드는 _en 접미사로 구분합니다.

## 시드 데이터 (기본 방향으로 활용하되, 사실적 정확성을 우선할 것)
- 학문 분야: {discipline_name}
- 원리 이름: {principle_name} ({principle_name_en})
- AI 연결점: {ai_connection} ({ai_connection_en})
- 해결 문제: {problem_solved}

## 핵심 원칙
1. 역사적 사실을 정확히 기술할 것 (핵심 인물/년도/논문 포함)
2. "직접적 영감(direct inspiration)"과 "구조적 유사성(structural analogy)"을 명확히 구분할 것
3. 비유가 성립하지 않는 한계점도 application 섹션에서 반드시 언급할 것
4. 확실하지 않은 연결은 "~로 해석되기도 한다" 식으로 표현할 것

## 출력 JSON 구조 (반드시 이 구조를 정확히 따를 것)

{{
  "title": "{principle_name}과(와) {ai_connection}",
  "title_en": "{principle_name_en} and {ai_connection_en}",
  "connectionType": "direct_inspiration 또는 structural_analogy 또는 mathematical_foundation 중 하나 (이 원리-AI 연결의 성격을 정직하게 분류)",
  "difficulty": "beginner 또는 intermediate 또는 advanced (이 원리-AI 연결을 이해하는 데 필요한 수준)",
  "subtitle": "한국어 부제목 (원리와 AI 기술의 관계를 한 줄로, 15자 이내)",
  "subtitle_en": "English subtitle (one line, under 15 words)",
  "keywords": ["핵심 키워드 1", "핵심 키워드 2", "핵심 키워드 3"],
  "keywords_en": ["keyword 1", "keyword 2", "keyword 3"],
  "foundation": {{
    "principle": "원리 설명 (3-4문장, {discipline_name}에서 이 원리가 무엇인지 설명)",
    "principle_en": "Principle explanation in English (3-4 sentences)",
    "keyIdea": "핵심 아이디어 한 줄 요약",
    "keyIdea_en": "Key idea one-line summary in English",
    "everydayAnalogy": "일상생활 비유로 쉽게 설명",
    "everydayAnalogy_en": "Everyday analogy in English",
    "scientificContext": "{discipline_name}에서 이 원리의 중요성 (2-3문장)",
    "scientificContext_en": "Scientific context in English (2-3 sentences)",
    "deepDive": {{
      "history": "이 원리의 발견/발전 역사 (3-5문장, 반드시 핵심 인물과 년도 포함)",
      "history_en": "History of discovery/development in English (3-5 sentences, must include key figures and years)",
      "mechanism": "작동 원리를 단계별로 상세 설명 (3-5문장)",
      "mechanism_en": "Step-by-step mechanism in English (3-5 sentences)",
      "formula": "관련 수식이 있으면 LaTeX 형태로, 없으면 빈 문자열",
      "visualExplanation": "시각적으로 이해할 수 있는 설명 (도표나 프로세스를 글로 묘사)",
      "relatedPrinciples": ["관련 원리 1", "관련 원리 2"],
      "relatedPrinciples_en": ["Related principle 1 in English", "Related principle 2 in English"],
      "modernRelevance": "현대 과학/기술에서의 의미 (2-3문장)",
      "modernRelevance_en": "Modern relevance in English (2-3 sentences)"
    }}
  }},
  "application": {{
    "applicationField": "AI/머신러닝에서의 적용 분야",
    "applicationField_en": "Application field in AI/ML in English",
    "description": "{ai_connection}이 어떻게 적용되는지 (3-4문장)",
    "description_en": "How it is applied in English (3-4 sentences)",
    "mechanism": "구체적 메커니즘 설명 (원리에서 AI 기술로의 변환 과정: 무엇이 보존되고 무엇이 추상화되었는지)",
    "mechanism_en": "Specific mechanism in English (what was preserved and what was abstracted away)",
    "technicalTerms": ["관련 기술 용어1", "관련 기술 용어2", "관련 기술 용어3"],
    "technicalTerms_en": ["Technical term 1", "Technical term 2", "Technical term 3"],
    "bridgeRole": "{discipline_name}의 {principle_name}이 AI에서 어떤 교량 역할을 하는지",
    "limitations": "이 비유/연결이 성립하지 않는 한계점 (1-2문장)",
    "limitations_en": "Where this analogy/connection breaks down (1-2 sentences)"
  }},
  "integration": {{
    "problemSolved": "{problem_solved}",
    "problemSolved_en": "Problem solved in English",
    "solution": "이 원리를 적용해 어떻게 해결하는지 (2-3문장)",
    "solution_en": "Solution in English (2-3 sentences)",
    "targetField": "영향받은 AI 세부 분야",
    "targetField_en": "Target field in English",
    "realWorldExamples": ["실제 사례 1", "실제 사례 2", "실제 사례 3"],
    "realWorldExamples_en": ["Real-world example 1", "Real-world example 2", "Real-world example 3"],
    "impactField": "이 통합이 가장 큰 영향을 미치는 분야",
    "impactField_en": "Impact field in English",
    "whyItWorks": "왜 이 접근이 효과적인지 (2-3문장)",
    "whyItWorks_en": "Why it works in English (2-3 sentences)",
    "keyPapers": ["핵심 논문 (저자, 년도) 1", "핵심 논문 (저자, 년도) 2"],
    "keyPapers_en": ["Key paper (Author, Year) 1", "Key paper (Author, Year) 2"]
  }}
}}

## 작성 지침
- 한국어 필드는 한국어로 작성하되, 전문 용어는 영어 병기 가능
- _en 접미사 필드는 자연스러운 영어로 작성 (번역투 금지)
- 사실에 기반하여 작성 (확인 가능한 논문/인물/년도를 포함)
- 연결의 강도를 정직하게 표현 (모든 연결이 직접적 영감은 아님을 인지)
- 공학계열 대학생이 이해할 수 있는 수준으로 작성
- 각 필드의 지시사항(문장 수 등)을 준수
- JSON만 출력 (추가 설명 없이)

## 흔한 오류 주의사항
- 역전파(Backpropagation)는 생물학적으로 비합리적(biologically implausible)함을 해당 시 명시할 것
- 인공 신경망은 실제 뇌의 동작 방식과 근본적으로 다름을 인지할 것
- 날짜/인물 확신이 없으면 "약 ~년" 또는 "~으로 알려져 있다"로 표현할 것
- 사후적 비유(structural analogy)를 직접적 영감(direct inspiration)으로 오해하지 말 것"""


@_safe_node("content_generator")
def content_generator(state: PrincipleGraphState) -> dict:
    """시드 기반 LLM 콘텐츠 생성 (foundation/application/integration + deepDive)"""
    seed = state["seed"]
    if not seed:
        return {"errors": ["content_generator: seed가 비어있음"]}

    llm = get_llm(temperature=0.7, max_tokens=12288, thinking=False, json_mode=True)

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
    required_keys = {"title", "connectionType", "foundation", "application", "integration"}
    missing = required_keys - set(content.keys())
    if missing:
        return {"errors": [f"content_generator: 필수 키 누락: {missing}"], "content": content}

    # 중첩 필드 검증
    _nested_required = {
        "foundation": {"principle", "keyIdea", "everydayAnalogy"},
        "application": {"applicationField", "description", "mechanism", "technicalTerms"},
        "integration": {"problemSolved", "solution", "realWorldExamples", "whyItWorks"},
    }
    for section, keys in _nested_required.items():
        section_data = content.get(section, {})
        if not isinstance(section_data, dict):
            return {"errors": [f"content_generator: {section}이 dict가 아님"], "content": content}
        nested_missing = keys - set(section_data.keys())
        if nested_missing:
            print(f"  [content_generator] 경고: {section} 내 누락 키: {nested_missing}")

    print(f"  [content_generator] 생성 완료: {content.get('title', '?')}")
    return {"content": content}


# ─── Node 3: verifier ───
_VERIFY_PROMPT = """당신은 학제간 과학/공학 사실 검증 전문가입니다.
아래 콘텐츠가 사실적으로 정확한지 엄격하게 검증하세요.

## 시드 데이터 (참고용)
- 학문 분야: {discipline_name}
- 원리: {principle_name} ({principle_name_en})
- AI 연결: {ai_connection} ({ai_connection_en})
- 해결 문제: {problem_solved}

## 검증 대상 콘텐츠
{content_json}

## 검증 기준 (각 항목별로 평가)
1. **원리 정확성**: {discipline_name}의 {principle_name} 설명이 학술적으로 정확한가? 핵심 인물/년도가 올바른가?
2. **매핑 정확성**: 원리에서 AI 기술로의 연결이 실제로 존재하는 학술적 관계인가? 직접 영감인가, 사후적 비유인가?
3. **연결 강도(connectionType)**: connectionType 분류가 적절한가? (direct_inspiration/structural_analogy/mathematical_foundation)
4. **한계점(limitations)**: 비유의 한계가 정직하게 기술되었는가?
5. **팩트 오류**: 날짜, 인물, 논문명 등 구체적 사실에 오류가 없는가?
6. **과장 여부**: 연결의 강도가 과장되지 않았는가?

## 출력 (JSON만)
{{
  "verified": true 또는 false,
  "confidence": 0.0~1.0 (전체 정확도에 대한 확신도),
  "principleAccuracy": 0.0~1.0 (원리 설명 정확도),
  "mappingAccuracy": 0.0~1.0 (원리-AI 매핑 정확도),
  "factCheck": "검증 이유를 2-3문장으로",
  "issues": ["발견된 문제점 1", "발견된 문제점 2"] 또는 빈 배열
}}"""


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
        content_json=json.dumps(content, ensure_ascii=False, indent=2)[:8000],
    )

    response = _llm_invoke_with_retry(llm, [HumanMessage(content=prompt)])
    verification = _safe_json_parse(response.content)

    verified = verification.get("verified", False)
    confidence = verification.get("confidence", 0.0)
    print(f"  [verifier] verified={verified}, confidence={confidence:.2f}, reason={verification.get('factCheck', '')[:80]}")

    return {"verification": verification}


# ─── 조건부 라우팅: 재시도 여부 판단 ───
def should_retry(state: PrincipleGraphState) -> str:
    """검증 실패 또는 낮은 confidence 시 재시도 (최대 3회)"""
    verification = state.get("verification") or {}
    retry_count = state.get("retry_count", 0)
    verified = verification.get("verified", False)
    confidence = verification.get("confidence", 0.0)

    if (not verified or confidence < 0.7) and retry_count < 3:
        print(f"  [라우팅] 검증 실패 (verified={verified}, confidence={confidence:.2f}), 재시도 {retry_count + 1}/3")
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
            "subtitle": content.get("subtitle", ""),
            "subtitle_en": content.get("subtitle_en", ""),
            "keywords": content.get("keywords", []),
            "keywords_en": content.get("keywords_en", []),
            "category": seed["discipline_name"],
            "superCategory": seed["super_category"],
            "foundation": content.get("foundation", {}),
            "application": content.get("application", {}),
            "integration": content.get("integration", {}),
            "verification": verification or {},
        },
        "updated_at": fs.SERVER_TIMESTAMP,
    }

    # Firestore 저장 (날짜 기반 문서 ID 로 멱등성 보장)
    try:
        db = get_firestore_client()
        db.collection("daily_principles").document(today_str).set(doc)
        print(f"  [assembler] Firestore 저장 완료: daily_principles/{today_str}")
    except Exception as e:
        print(f"  [assembler] Firestore 저장 실패: {e}")
        return {"errors": [f"assembler: Firestore 저장 실패: {e}"], "result": doc}

    # 타이밍 리포트
    timings = state.get("node_timings", {})
    if timings:
        print(f"\n  --- 노드별 소요 시간 ---")
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
