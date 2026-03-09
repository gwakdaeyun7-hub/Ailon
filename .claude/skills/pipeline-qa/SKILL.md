---
name: pipeline-qa
description: 파이프라인 실행 로그를 분석하고 문제를 자동 수정합니다. GitHub Actions 로그를 붙여넣으면 QA 리포트 생성 + 코드 수정까지 수행합니다.
user-invocable: true
---

# Pipeline QA — 파이프라인 실행 결과 분석 및 자동 수정

사용자가 파이프라인 실행 로그를 제공하면, 3단계로 작업을 수행합니다.

## Phase 1: QA 분석 (qa-pipeline-tester 에이전트)

qa-pipeline-tester 에이전트를 사용하여 로그를 분석합니다.

### 1.1 기본 검사 항목

1. **JSON 잘림**: `[JSON 복구]` 로그가 있으면 Critical — ranker token_budget 확인
2. **스크래핑 실패**: 본문 수집 실패 URL 개수 + 영향받는 소스
3. **기사 수**: 하이라이트 3개 확보 여부, 카테고리별 최소 기사 수
4. **에러/예외**: [ERROR], [WARN], 예외 스택트레이스
5. **소요 시간**: 노드별 소요 시간 이상 여부 (전체 10분 초과 시 경고)
6. **요약 품질**: key_points 0-1개 기사, one_line 누락 기사

### 1.2 AI 필터 검사 (★ 심층 분석)

로그 패턴: `[AI 필터] {source}: {total}개 중 {passed}개 통과, {marked}개 비AI 마킹`

| 검사 항목 | 정상 범위 | 이상 징후 | 심각도 |
|-----------|----------|-----------|--------|
| Tier 1/2 필터율 | 0-20% 마킹 | >30% 마킹 → 오탐 의심 (AI 전문 피드에서 과도 필터) | Major |
| Tier 3 필터율 | 20-60% 마킹 | >70% 마킹 → 필터 과도, <10% → 비AI 기사 유입 | Major |
| 필터 실패 | 없음 | `LLM AI 필터 실패 -> 전체 통과` 로그 | Critical |
| research 면제 | 적용됨 | selector에서 research 기사가 AI 필터로 누락 | Major |

**AI 필터 오탐 판별 기준:**
- Tier 1/2 소스(CATEGORY_SOURCES)는 AI 전문 피드 → "의심 시 포함"이 원칙
- 제목에 AI 기업명(OpenAI, Anthropic, Google DeepMind, Meta AI 등)이 있는데 필터링됐으면 → 확실한 오탐
- Tier 3 소스(SOURCE_SECTION_SOURCES)는 "의심 시 제거"가 원칙
- `[비AI]` 플래그가 달린 기사 목록을 QA 기사 목록에서 확인

**수정 대상 파일:** `scripts/agents/news_team.py` — `_llm_ai_filter_batch()` 함수 (line ~659)
- 프롬프트의 INCLUDE/EXCLUDE 규칙 조정
- `is_ai_feed` 분기의 source_context 텍스트 수정
- 한국어 프롬프트(`is_ko`)의 판단 기준 수정

### 1.3 분류(Categorization) 검사 (★ 심층 분석)

로그 패턴:
- `[분류] {n}개 분류 중...`
- `[그룹] {category}: {n}개`
- `분류 편향 경고 {cat}: {n}/{total}개 ({ratio}) — 60% 초과`
- `[분류] 미분류 {n}개 → industry_business 기본값 적용`
- `[QA] 의심 분류 {n}건 감지`
- `[QA] 카테고리별 분류 기사 목록` (개별 기사 제목 + 카테고리)

| 검사 항목 | 정상 범위 | 이상 징후 | 심각도 |
|-----------|----------|-----------|--------|
| industry_business 비율 | 40-65% | >65% → 분류기 편향 | Major |
| research 비율 | 10-30% | <5% → 분류기가 research 미인식 | Major |
| models_products 비율 | 10-30% | <5% → 출시 기사 누락 | Major |
| 미분류 기사 | 0-3개 | >5개 → 분류 프롬프트 문제 | Major |
| 의심 분류 건수 | 0-3건 | >5건 → 분류 정확도 저하 | Major |
| 분류 배치 실패 | 없음 | 배치 분할/개별 재시도 로그 | Minor |

**분류 오류 유형별 수정:**
- **industry_business 편향**: `_CLASSIFY_PROMPT`에서 models_products/research 판단 기준 강화
  - "공개", "출시", "release", "launch" → models_products 강조
  - "논문", "paper", "benchmark" → research 강조
- **models_products 오분류**: 제품명만 있고 신규 출시가 아닌 기사가 models_products로 → `⚠ Product name in title ≠ models_products` 규칙 강화
- **research 오분류**: 튜토리얼/가이드 기사가 industry_business로 → Examples 추가

**수정 대상 파일:** `scripts/agents/news_team.py` — `_CLASSIFY_PROMPT` (line ~1303)
- 프롬프트 텍스트 수정 (기존 Examples에 새 예시 추가)
- `_SUSPECT_KEYWORDS` dict 업데이트 (의심 키워드 추가)

### 1.4 중복감지(Dedup) 검사 (★ 심층 분석)

로그 패턴:
- `[중복 제거] {n}개 중복 기사 제거 ({before} → {after}개)`
- `(L6 임베딩: {n}건, L7 엔티티: {n}건)`
- `[QA] 중복 감지 {n}건` + 개별 기사 `→ 원본: {title} [{layer}]`

| 검사 항목 | 정상 범위 | 이상 징후 | 심각도 |
|-----------|----------|-----------|--------|
| 총 중복 감지율 | 3-15% | >25% → 오탐 의심, <1% → 미감지 의심 | Major |
| L6 임베딩 건수 | 0-5건 | >10건 → EMBED_DEDUP_THRESHOLD 너무 낮음 | Major |
| L7 엔티티 건수 | 0-3건 | >5건 → overlap_ratio 너무 낮음 | Minor |
| L2/L3 제목 유사도 | 정상 | 다른 기사인데 제목이 비슷해서 중복 처리 → DEDUP_THRESHOLD 조정 | Major |

**중복감지 오탐 판별 기준:**
- QA 중복 감지 목록에서 **제목 쌍을 비교** — 실제로 같은 사건인지 다른 사건인지 판단
- L6 오탐: 주제는 같지만 다른 사건 (e.g., "GPT-5 출시" vs "GPT-5 벤치마크 결과") → threshold 올려야
- L7 오탐: 같은 제품명이지만 다른 뉴스 (e.g., "Claude 4 가격" vs "Claude 4 성능") → overlap_ratio 올려야
- 미감지: 같은 기사가 다른 소스에서 나왔는데 중복 안 걸림 → 해당 layer 임계값 낮춰야

**수정 대상 파일:** `scripts/agents/news_team.py`
- `DEDUP_THRESHOLD` (line ~1002): 제목 유사도 임계값 (현재 0.65)
- `EMBED_DEDUP_THRESHOLD` (line ~1003): 임베딩 유사도 임계값 (현재 0.92)
- `_DEDUP_STOPWORDS` (line ~1034): 변별력 없는 토큰 set
- L5 조건: `names_overlap >= 3 and nums_overlap >= 1` (line ~1198)
- L7 `overlap_ratio >= 0.30` (line ~1225)

### 1.5 랭킹(Ranking) 검사 (★ 심층 분석)

로그 패턴:
- `[그룹] {category}: {n}개`
- `[{category}] 순위 결정 ({n}개):` + Top 5 기사 점수
- `RANKER 폴백 {category}: ... — published 최신순 사용`
- `[JSON 복구]` — 랭킹 JSON 잘림

| 검사 항목 | 정상 범위 | 이상 징후 | 심각도 |
|-----------|----------|-----------|--------|
| Top 1 기사 적절성 | 중요한 뉴스 | 마이너 뉴스가 1위 → 랭킹 프롬프트 문제 | Major |
| 폴백 발생 | 없음 | `RANKER 폴백` 로그 → LLM 응답 실패 | Critical |
| JSON 잘림 | 없음 | 기사 40개+ 카테고리에서 JSON 잘림 | Critical |
| 하이라이트 품질 | Top 3가 중요 뉴스 | 하이라이트가 마이너 뉴스 → 카테고리별 1위 선정 문제 | Major |
| 점수 분포 | 30-100 선형 | 모든 기사가 비슷한 점수 → 랭킹 미작동 | Minor |

**랭킹 품질 판별 기준:**
- 로그의 Top 5 기사 제목을 보고 **사람이 봤을 때 납득 가능한 순위인지** 판단
- 명백한 대형 뉴스(주요 모델 출시, 대규모 투자 등)가 1위가 아닌 경우 → 랭킹 프롬프트 수정 필요
- 폴백 발생 → `token_budget = max(6144, count*100)` 부족 가능성 → 상수 조정
- 컨텍스트 축소 임계값 재검토: `>40: 제목만, 25-40: 150자, ≤25: 500자`

**수정 대상 파일:** `scripts/agents/news_team.py`
- `_RANK_PROMPT` (line ~1331): 랭킹 기준 프롬프트
- `_rank_category()` (line ~1354): token_budget, ctx_len 임계값
- 컨텍스트 축소 기준: line ~1367-1372

### 1.6 학문스낵(Principle) 콘텐츠 품질 검사 (★ 심층 분석)

로그 패턴:
- `[seed_selector] 전체 시드 풀: {n}개`
- `[seed_selector] 최근 30일 사용 시드: {n}개`
- `[content_generator] 생성 완료`
- `[verifier] 검증 결과 — verified={bool}, confidence={float}`
- `RANKER 폴백` / `재시도 {n}/3` — 검증 실패 후 재생성
- `[assembler] Firestore 저장 완료: daily_principles/{date}`

#### 1.6.1 구조 완성도 검사

| 검사 항목 | 정상 | 이상 징후 | 심각도 |
|-----------|------|-----------|--------|
| 검증 통과 | verified=true, confidence≥0.7 | verified=false 또는 confidence<0.7 → 재시도 | Major |
| 재시도 횟수 | 0-1회 | 3회 연속 실패 → 최선 시도 사용 | Critical |
| 필수 필드 누락 | 전체 존재 | foundation/application/integration/deepDive 중 누락 | Critical |
| 문자 수 범위 | 각 필드별 기준 내 | headline >20자, body >120자, analogy >50자 등 초과 | Minor |
| _en 필드 존재 | 모든 KO 필드에 EN 쌍 | _en 필드 누락 → 바이링구얼 표시 불가 | Major |

#### 1.6.2 설명 이해도 검사 (★ 핵심)

**목적**: 사용자가 해당 학문의 원리를 충분히 이해할 수 있는지 콘텐츠 품질을 평가

| 검사 항목 | 좋은 예 | 나쁜 예 | 심각도 |
|-----------|---------|---------|--------|
| **원리 설명 명확성** (foundation.body) | "물체가 움직이면 반대 방향으로 마찰력이 작용한다" — 구체적 현상 설명 | "이 원리는 중요한 개념이다" — 추상적, 아무 정보 없음 | Major |
| **일상 비유 품질** (foundation.analogy) | "자전거 브레이크처럼, 속도를 줄이는 힘이 항상 존재한다" — 독자가 바로 그림을 그릴 수 있음 | "마치 자연처럼 작동한다" — 비유가 아니라 동어반복 | Major |
| **문제 구체성** (application.problem) | "수백만 파라미터를 동시에 조정하는 것은 불가능에 가까웠다" — 구체적 난관 | "AI가 어려움을 겪었다" — 무슨 어려움인지 불명확 | Major |
| **메커니즘 명확성** (application.mechanism) | "기울기를 따라 조금씩 내려가며 최적값을 찾는다" — 작동 원리가 선명 | "알고리즘이 문제를 해결한다" — 어떻게 해결하는지 불명확 | Major |
| **영향 구체성** (integration.impact) | "ChatGPT의 답변 품질을 30% 향상시킨 핵심 기법" — 체감 가능 | "AI 발전에 기여했다" — 막연함 | Minor |

#### 1.6.3 Deep Dive 깊이 검사 (★ 핵심)

| 검사 항목 | 좋은 예 | 나쁜 예 | 심각도 |
|-----------|---------|---------|--------|
| **원래 문제** (originalProblem) | "1960년대 Rosenblatt의 퍼셉트론은 XOR 문제를 풀 수 없었고..." — 인물+시기+구체적 한계 | "옛날에 연구자들이 문제를 발견했다" — 누가, 언제, 무엇을 불명확 | Major |
| **영감의 다리** (bridge) | "수학적 구조(합성곱 연산)는 보존되었으나, 생물학적 시냅스 가소성은 역전파로 변형되었다" — 보존/변형 명시 | "이 원리에서 영감을 받아 AI에 적용했다" — 무엇이 보존/변형됐는지 없음 | Critical |
| **핵심 직관** (coreIntuition) | "높은 산에서 공을 굴리면 골짜기(최적값)를 찾는다 — 이것이 경사하강법의 본질" — 수식 해석 포함 | "이 알고리즘은 효율적이다" — 직관 없음 | Major |
| **수식** (formula) | LaTeX 수식이 원리와 직결 (비어있어도 OK) | 관련 없는 수식, 또는 있어야 하는데 누락 | Minor |
| **한계 구체성** (limits) | "역전파는 생물학적으로 비합리적(biologically implausible)하며, 뇌의 학습 메커니즘과 다르다" — 구체적 한계점 | "아직 갈 길이 멀다" / "더 많은 연구가 필요하다" — 추상적 회피 | Major |

#### 1.6.4 메타데이터 적절성 검사

| 검사 항목 | 정상 | 이상 징후 | 심각도 |
|-----------|------|-----------|--------|
| connectionType 정확성 | direct_inspiration: 실제 역사적 채택 | structural_analogy인데 direct_inspiration으로 표기 → 과장 | Major |
| difficulty 적절성 | beginner: 일상 비유 중심 | beginner인데 수식/전문용어 과다 → 사용자 이탈 | Minor |
| keywords 관련성 | 원리+AI 양쪽 키워드 | 관련 없는 키워드, 또는 너무 일반적("AI", "기술") | Minor |
| 시드 다양성 | 최근 3일 분야 중복 없음 | 같은 분야 연속 → seed_selector 로직 확인 | Minor |

#### 1.6.5 학문스낵 품질 종합 판정

로그 + Firestore 데이터를 바탕으로 다음 기준으로 종합 판정:

- **Good**: 검증 통과(confidence≥0.8), 모든 필드 구체적, bridge에 보존/변형 구분 있음, limits 구체적
- **Acceptable**: 검증 통과(0.7≤confidence<0.8), 대부분 필드 양호, 1-2개 추상적 표현
- **Poor**: 검증 통과했으나 핵심 필드(problem, bridge, limits)가 추상적 → 프롬프트 수정 필요
- **Failed**: 검증 미통과 3회 → 시드 풀 또는 생성 프롬프트 문제

**이해도 체크리스트** (분석 시 각 항목 예/아니오 판정):
1. [ ] foundation.body만 읽고 이 원리가 무엇인지 비전문가가 이해 가능한가?
2. [ ] analogy가 실제로 원리를 설명하는 데 도움이 되는가? (동어반복 아닌가?)
3. [ ] application.problem이 "왜 이게 어려웠는지"를 구체적으로 전달하는가?
4. [ ] application.body가 "어떻게 해결했는지"를 단계적으로 보여주는가?
5. [ ] bridge에서 보존된 것/변형된 것이 명확히 구분되는가?
6. [ ] limits가 구체적 한계를 지적하는가? (추상적 회피 문장 아닌가?)
7. [ ] 전체 3-step을 읽었을 때 "원리→문제→해결→영향"의 내러티브가 자연스러운가?

**수정 대상 파일:** `scripts/agents/principle_team.py`
- `_GENERATE_PROMPT` (line ~339): 생성 프롬프트 — 설명 구체성 강화
- `_VERIFY_PROMPT` (line ~496): 검증 프롬프트 — 이해도 검증 항목 추가
- `_DEEPDIVE_SECTION` in prompt (line ~416): bridge/limits 구체성 강화
- `content_generator()` (line ~547): 생성 로직
- `verifier()` (line ~605): 검증 로직 + confidence 임계값

**수정 시 에이전트 선택:**
| 이슈 유형 | 에이전트 | 수정 대상 |
|-----------|---------|-----------|
| 설명이 추상적/모호함 | prompt-engineer | _GENERATE_PROMPT 구체성 강화 |
| 검증이 추상적 표현을 통과시킴 | prompt-engineer | _VERIFY_PROMPT에 이해도 체크 추가 |
| bridge 보존/변형 미구분 | prompt-engineer | _DEEPDIVE_SECTION 프롬프트 강화 |
| confidence 임계값 조정 | backend-pipeline-developer | verifier() 임계값/로직 |
| 시드 다양성 부족 | backend-pipeline-developer | seed_selector() 로직 |

### 1.7 브리핑(Briefing) 품질 검사 (★ 심층 분석)

로그 패턴:
- `브리핑 저장 완료: {n}개 스토리`
- `[KO] ({n}자)` + 브리핑 전문 (CI 로그의 "오늘의 브리핑" 접기 섹션)
- `[EN] ({n}자)` + 브리핑 전문
- `브리핑 생략: 기사 부족` — 입력 기사 2개 미만
- `브리핑 실패: ...` — LLM 호출 또는 파싱 에러

#### 1.7.1 구조 검사

| 검사 항목 | 정상 범위 | 이상 징후 | 심각도 |
|-----------|----------|-----------|--------|
| KO 길이 | 800-2500자 | <500자 → 너무 짧음, >3000자 → 너무 김 (2-3분 TTS 기준) | Major |
| EN 길이 | 500-2000자 | KO와 비슷한 비율 (EN은 보통 KO의 60-80%) | Minor |
| story_count | 5-7개 | <3개 → 기사 커버리지 부족, >8개 → 깊이 부족 | Major |
| 브리핑 생략 | 없음 | `브리핑 생략: 기사 부족` → 수집 파이프라인 문제 | Critical |
| 브리핑 실패 | 없음 | LLM/파싱 에러 | Critical |
| KO/EN 쌍 | 둘 다 존재 | 한쪽만 존재 → 바이링구얼 표시 불가 | Major |

#### 1.7.2 콘텐츠 품질 검사 (★ 핵심)

| 검사 항목 | 좋은 예 | 나쁜 예 | 심각도 |
|-----------|---------|---------|--------|
| **인사말** | "안녕하세요, 오늘의 AI 뉴스 브리핑입니다" — 자연스러운 오프닝 | 인사 없이 바로 시작, 또는 과도한 서론 | Minor |
| **팩트 정확성** | 하이라이트/카테고리 Top 기사의 핵심 내용이 정확히 반영됨 | 기사에 없는 내용 추가 (환각), 숫자/이름 오류 | Critical |
| **커버리지** | 하이라이트 3개 + 주요 카테고리 기사 포함 | 하이라이트 기사 누락, 특정 카테고리 편중 | Major |
| **해요체 일관성** (KO) | "~했어요", "~입니다" — 해요체 유지 | 존댓말/반말 혼용, 격식체("~하였다") 혼입 | Minor |
| **고유명사 유지** (KO) | "OpenAI", "GPT-5.4" — 영어 고유명사 그대로 | 고유명사 번역 ("오픈에이아이") | Minor |
| **마무리** | 자연스러운 클로징 + 내일 예고 또는 인사 | 갑자기 끊김, 불완전한 문장 | Minor |

#### 1.7.3 하이라이트 반영 검사

- 로그의 하이라이트 3개 기사가 브리핑에 언급되었는지 확인
- 하이라이트 기사가 브리핑에서 누락된 경우 → Major
- 카테고리 Top 1 기사(research/models_products/industry_business)가 최소 1개 이상 반영되었는지 확인

**수정 대상 파일:** `scripts/generate_features.py`
- `generate_daily_briefing()` (line ~156): 브리핑 생성 함수
- 브리핑 프롬프트 (line ~187-197): 프롬프트 텍스트
- 입력 기사 선정 로직 (line ~162-175): 하이라이트 + 카테고리 Top 기사 조합

**수정 시 에이전트 선택:**
| 이슈 유형 | 에이전트 | 수정 대상 |
|-----------|---------|-----------|
| 브리핑 프롬프트 품질 (톤, 구조, 커버리지) | prompt-engineer | generate_features.py 프롬프트 |
| 브리핑 길이/story_count 조정 | prompt-engineer | 프롬프트의 지시문 수정 |
| 입력 기사 선정 로직 | backend-pipeline-developer | generate_features.py 로직 |
| 브리핑 생성 실패/파싱 오류 | backend-pipeline-developer | generate_features.py 에러 핸들링 |

### 분석 결과 심각도 기준

- **Critical**: 데이터 무결성에 영향 (JSON 잘림, 0 articles, 에러, 필터 전면 실패, 랭킹 폴백)
- **Major**: 품질 저하 (분류 편향, 대량 오탐, 랭킹 부적절, 중복 오탐/미감지)
- **Minor**: 허용 범위 내 이슈 (key_points 2개, 소수 스크래핑 실패, L7 소량 건수)
- **Pass**: 정상 작동 확인

## Phase 2: 수정 방안 도출 (적절한 에이전트 선택)

Critical/Major 이슈가 발견되면, 이슈 유형에 따라 적절한 에이전트를 선택하여 수정:

| 이슈 유형 | 에이전트 | 수정 대상 |
|-----------|---------|-----------|
| JSON 잘림, 토큰 부족, 배치 크기, 임계값 조정 | backend-pipeline-developer | news_team.py 상수/로직 |
| AI 필터 프롬프트, 분류 프롬프트, 랭킹 프롬프트 | prompt-engineer | 프롬프트 텍스트 |
| LangGraph 노드 실행 오류, 상태 전달 | langgraph-expert | 그래프 구조/노드 로직 |
| 스크래핑 실패, 소스 수집 문제 | backend-pipeline-developer | tools.py |
| 중복 임계값, stopwords, 토큰 추출 로직 | backend-pipeline-developer | news_team.py dedup 함수 |
| 학문스낵 설명 추상적/모호 | prompt-engineer | principle_team.py 생성/검증 프롬프트 |
| 학문스낵 검증 임계값, 시드 다양성 | backend-pipeline-developer | principle_team.py 로직 |
| 브리핑 프롬프트 품질 (톤, 구조, 커버리지) | prompt-engineer | generate_features.py 프롬프트 |
| 브리핑 입력 기사 선정, 실패/파싱 오류 | backend-pipeline-developer | generate_features.py 로직 |

**수정 원칙:**
- 기존에 잘 작동하는 부분은 건드리지 않는다
- CLAUDE.md의 "Key Constants (DO NOT lower without reason)" 테이블 참조
- 프롬프트 변경은 최소한으로 (기존 분류/요약 정확도 유지)
- 임계값 변경은 ±0.05 단위로 보수적으로 (급격한 변경 금지)
- 수정 후 반드시 Python 문법 검증 (ast.parse)

**수정 시 참조해야 할 코드 위치:**
| 컴포넌트 | 파일 | 함수/변수 | 라인 |
|----------|------|-----------|------|
| AI 필터 (EN) | news_team.py | `_llm_ai_filter_batch()` EN 프롬프트 | ~706-748 |
| AI 필터 (KO) | news_team.py | `_llm_ai_filter_batch()` KO 프롬프트 | ~670-705 |
| AI 필터 소스 분기 | news_team.py | `_llm_filter_sources()` | ~762-820 |
| 분류 프롬프트 | news_team.py | `_CLASSIFY_PROMPT` | ~1303-1328 |
| 분류 배치 | news_team.py | `_classify_batch()` | ~1460 |
| 의심 키워드 | news_team.py | `_SUSPECT_KEYWORDS` | ~1667-1671 |
| 중복 임계값 | news_team.py | `DEDUP_THRESHOLD`, `EMBED_DEDUP_THRESHOLD` | ~1002-1003 |
| 중복 stopwords | news_team.py | `_DEDUP_STOPWORDS` | ~1034 |
| 중복 L5 조건 | news_team.py | `_deduplicate_candidates()` L5 | ~1192-1202 |
| 중복 L7 조건 | news_team.py | `_deduplicate_candidates()` L7 | ~1213-1230 |
| 랭킹 프롬프트 | news_team.py | `_RANK_PROMPT` | ~1331-1344 |
| 랭킹 로직 | news_team.py | `_rank_category()` | ~1354-1454 |
| 랭킹 token_budget | news_team.py | `_rank_category()` 내 | ~1391 |
| 컨텍스트 축소 | news_team.py | `_rank_category()` 내 ctx_len | ~1367-1372 |
| 브리핑 생성 함수 | generate_features.py | `generate_daily_briefing()` | ~156 |
| 브리핑 프롬프트 | generate_features.py | prompt in `generate_daily_briefing()` | ~187-197 |
| 브리핑 입력 기사 선정 | generate_features.py | highlights + cat_articles 조합 | ~162-175 |
| 학문스낵 생성 프롬프트 | principle_team.py | `_GENERATE_PROMPT` | ~339 |
| 학문스낵 Deep Dive 섹션 | principle_team.py | `_DEEPDIVE_SECTION` in prompt | ~416 |
| 학문스낵 검증 프롬프트 | principle_team.py | `_VERIFY_PROMPT` | ~496 |
| 학문스낵 생성 로직 | principle_team.py | `content_generator()` | ~547 |
| 학문스낵 검증 로직 | principle_team.py | `verifier()` | ~605 |

## Phase 3: 결과 리포트

최종 리포트를 사용자에게 제공:

```
## Pipeline QA 결과

### 판정: [Stable / Warning / Critical]

### 이슈 요약
| # | 영역 | 심각도 | 이슈 | 조치 |
|---|------|--------|------|------|
| 1 | AI 필터 | Major | Tier 1 오탐 30% 초과 | 프롬프트 수정 완료 |
| 2 | 분류 | Minor | industry_business 58% | 정상 범위 — 모니터링 |
| 3 | 중복 | Pass | L6 2건, L7 1건 | 정상 |
| 4 | 랭킹 | Pass | Top 5 적절 | 정상 |
| 5 | 브리핑 | Pass | 6개 스토리, KO 1200자, 하이라이트 반영 | 정상 |
| 6 | 학문스낵 | Pass | confidence 0.85, 설명 구체적 | 정상 |

### 수정된 파일
- news_team.py:670 — AI 필터 KO 프롬프트에 INCLUDE 항목 추가
- news_team.py:1303 — 분류 프롬프트 예시 2건 추가

### 모니터링 포인트
- 다음 실행에서 Tier 1 필터율 20% 이하인지 확인
- industry_business 비율 60% 이하 유지 확인
```

## 주의사항

- 에이전트를 병렬로 실행할 수 있으면 병렬 실행 (예: QA 분석 + 프롬프트 검토)
- 수정이 불필요하면 "Pass — 수정 불필요"로 리포트만 제공
- 사용자가 로그 일부만 제공해도 분석 가능한 범위에서 수행
- AI 필터/분류/중복/랭킹/브리핑/학문스낵 6개 영역을 반드시 개별 평가하여 리포트에 포함
- 브리핑은 "오늘의 브리핑" 접기 섹션 로그가 있을 때 콘텐츠 품질 평가 (브리핑 생략/실패 시 구조 검사만)
- 학문스낵은 principle 파이프라인 로그가 있을 때 평가 (news-only 실행 시 생략 가능)
