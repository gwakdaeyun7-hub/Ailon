---
name: pipeline-qa
description: 파이프라인 실행 로그를 분석하고 문제를 자동 수정합니다. GitHub Actions 로그를 붙여넣으면 QA 리포트 생성 + 코드 수정까지 수행합니다.
user-invocable: true
---

# Pipeline QA — 파이프라인 실행 결과 분석 및 자동 수정

사용자가 파이프라인 실행 로그를 제공하면, 3단계로 작업을 수행합니다.

## Phase 1: QA 분석

로그를 아래 체크리스트에 따라 직접 분석합니다.

> **pipeline-post-check.sh hook과의 역할 분담**: hook은 파이프라인 실행 직후 7개 패턴(JSON 잘림, 0건 수집, 스크래핑 실패, 분류 편향, AI 필터, curated 풀 고갈, API 쿼터)을 자동 감지하여 즉시 경고를 표시합니다. 이 스킬은 hook이 커버하지 않는 **심층 분석**(기사 단위 판정, 랭킹 전체 검증, 제목 품질, 브리핑 콘텐츠, 용어/태그 품질 등)을 수행합니다. hook 경고가 이미 표시된 항목은 추가 분석만 수행합니다.

### 1.1 기본 검사 항목

1. **JSON 잘림**: `[JSON 복구]` 로그가 있으면 Critical — ranker token_budget 확인
2. **스크래핑 실패**: 본문 수집 실패 URL 개수 + 영향받는 소스
3. **기사 수**: 하이라이트 3개 확보 여부, 카테고리별 최소 기사 수
4. **에러/예외**: [ERROR], [WARN], 예외 스택트레이스
5. **소요 시간**: 노드별 소요 시간 이상 여부 (전체 10분 초과 시 경고)
6. **요약 품질**: key_points 0-1개 기사, one_line 누락 기사
7. **EN 번역 실패**: `미번역 EN 기사 N개 감지` 로그 확인. Phase 4 간이 번역으로 복구되었는지 (`[간이 번역 복구]`), 잔존 여부 (`미번역 EN 기사 N개 잔존`) 확인. 잔존 시 해당 기사가 카테고리 Top 20에 영어 제목으로 포함됨 → Minor (제거되지 않고 영어 유지)
8. **EN 번역+요약 배치 실패율**: `LLM 결과에 dict 없음 (type=str)` 로그 빈도 확인. 1차 실패율 30%+ → 재시도로 복구되지만 시간/비용 비효율. 50%+ 시 배치 크기 5→3 축소 또는 프롬프트 간소화 검토. 재시도 후에도 미복구 기사가 있으면 `[간이 번역 복구]` 로그 확인

### 1.2 AI 필터 검사 (Tier 3 + NEEDS_AI_FILTER)

**Tier 1/2 (CATEGORY_SOURCES - NEEDS_AI_FILTER, 17 EN sources)**: AI 필터 없음 — AI 전문 피드이므로 필터 생략, 전체 통과.
- Tier 1/2 소스(NEEDS_AI_FILTER 제외)에서 `[AI 필터]` 로그가 나오면 → 코드 레그레션 (Critical)
- Tier 1/2 소스(NEEDS_AI_FILTER 제외) 기사에 `_ai_filtered=True`가 있으면 → 코드 레그레션 (Critical)

**CATEGORY_SOURCES (18 EN sources):**
- Tier 1 (12개, HIGHLIGHT_SOURCES): Wired AI, TechCrunch AI, The Verge AI, MIT Tech Review, VentureBeat, MarkTechPost, The Decoder, AI Business, SiliconANGLE, The Next Web (TNW), TechXplore AI, Tom's Hardware
- Tier 2 (6개): The Rundown AI, Google DeepMind, NVIDIA, Hugging Face, Ars Technica AI, IEEE Spectrum AI

**NEEDS_AI_FILTER (Tier 1/2 중 AI 필터 적용 소스):**
- Tom's Hardware (`toms_hardware`): 범용 RSS 피드(`tomshardware.com/feeds.xml`)로 PC 하드웨어/벤치마크/게이밍 등 비AI 기사가 다수 포함 → EN AI 필터 적용 ("when in doubt, EXCLUDE")

**전체 소스 구성 (22개):**
- Tier 1+2 EN 소스 17개 (CATEGORY_SOURCES - NEEDS_AI_FILTER) — AI 필터 없이 전체 통과
- Tier 1 EN 소스 1개 (NEEDS_AI_FILTER: Tom's Hardware) — EN AI 필터 적용
- Tier 3 KO 소스 4개 (SOURCE_SECTION_SOURCES) — KO AI 필터 적용

**Tier 3 (SOURCE_SECTION_SOURCES, 4 KO sources)**: LLM AI 필터 적용 (KO 프롬프트).

로그 패턴: `[AI 필터] {source}: {total}개 중 {passed}개 통과, {marked}개 비AI 마킹`

| 검사 항목 | 정상 범위 | 이상 징후 | 심각도 |
|-----------|----------|-----------|--------|
| Tom's Hardware 필터율 | 30-80% | <20% → 필터 느슨, >85% → 필터 과도 | Major |
| Tier 3 필터율 (소스별) | aitimes 0-25%, geeknews 5-25%, yozm_ai 0-10%, zdnet_ai_editor 0-10% | 소스별 정상 범위 벗어남 → 프롬프트 조정. aitimes는 AI 전문 매체로 0% 필터율도 정상 (전 기사가 AI 관련일 수 있음) | Major |
| 필터 실패 | 없음 | `LLM AI 필터 실패 -> 전체 통과` 로그 | Critical |
| research AI 필터 | 모든 카테고리 동일 적용 (면제 없음) | research 기사가 AI 필터로 과도 누락 → 오탐 확인 | Major |

**Tom's Hardware (NEEDS_AI_FILTER) AI 필터 판별 기준:**
- EN AI 필터 적용 ("when in doubt, EXCLUDE" 프롬프트)
- 범용 RSS 피드이므로 PC 하드웨어 리뷰, 벤치마크, 게이밍, 물리학 실험, 오버클럭 등 비AI 기사가 다수
- 정탐 (비AI 마킹 정당): CPU/GPU 벤치마크(AI 무관), 게임 리뷰, 순수 하드웨어 리뷰, 물리학 실험, PC 빌드 가이드
- 오탐 (비AI 마킹 부당): AI 칩/NPU 관련 하드웨어, AI 벤치마크(LLM 추론 성능 등), AI 가속기, GPU의 AI 학습/추론 성능 기사
- 경계: GPU 리뷰에 AI 벤치마크가 일부 포함된 경우 → AI가 주제가 아니면 비AI 정탐

**Tier 3 AI 필터 오탐 판별 기준:**
- Tier 3 소스(SOURCE_SECTION_SOURCES)는 "의심 시 제거"가 원칙. 단, 소스별 특성이 다름:
  - aitimes: AI 전문 매체 → 비AI 마킹이 많으면 프롬프트 과도 필터
  - geeknews: 개발/IT 종합 → 대부분 개발 기사가 통과하는 것이 정상 (AI+개발/IT 기술 포함 규칙)
  - yozm_ai, zdnet_ai_editor: AI/IT 특화 피드 → 비AI 마킹이 거의 없는 것이 정상
- `[비AI]` 플래그가 달린 기사 목록을 QA 기사 목록에서 확인
- KO AI 필터 프롬프트에 "AI 기업과 정부/국방부 관계 기사" INCLUDE 항목 포함 → 군사 AI 계약/규제 논의 기사가 통과해야 정상

**기사 단위 오탐 판정 (필수):**
- 비AI 마킹된 기사 제목을 하나씩 확인하여 다음 중 하나로 판정:
  - **정탐**: 기사가 실제로 AI와 무관 (요리, 스포츠, 정치 등)
  - **오탐**: AI 관련 기사인데 비AI로 마킹 → 프롬프트 수정 필요
  - **경계**: AI와 간접 관련 (IT 인프라, 반도체 등)

**AI 기능 관련 법적 분쟁 오탐 패턴**: AI 기능 자체가 소송/규제의 핵심 쟁점인 기사(e.g., "AI 기능으로 소송", "AI 생성물 저작권")는 법률 프레이밍이더라도 AI 관련 → 비AI 마킹 시 오탐. KO 프롬프트의 INCLUDE 항목에 "AI 기능이 쟁점인 법적 분쟁" 추가 여부 검토

**수정 대상 파일:** `scripts/agents/news_team.py` — `_llm_ai_filter_batch()` 함수
- Tier 3 프롬프트의 INCLUDE/EXCLUDE 규칙 조정
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
| industry_business 비율 | 40-65% | >65% → 분류기 편향 (단, 메가 이벤트 시 70%+ 단일 허용) | Major |
| research 비율 | 10-30% | <5% → 분류기가 research 미인식 | Major |
| models_products 비율 | 10-30% | <5% → 출시 기사 누락 | Major |
| 미분류 기사 | 0-3개 | >5개 → 분류 프롬프트 문제 | Major |
| 의심 분류 건수 | 0-3건 | >5건 → 분류 정확도 저하 | Major |
| 분류 배치 실패 | 없음 | 배치 분할/개별 재시도 로그 | Minor |

**메가 이벤트 허용 규칙**: Anthropic-Pentagon 등 대형 사건으로 다소스 보도 집중 시 industry_business 70%+도 자연 편향으로 허용. **연속 3회 70%+ 시에만** 프롬프트 조정 검토. 단일 발생 시 Warning 기록, 수정 불필요.

**주의: research 카테고리 AI 필터 면제 제거됨**
- 모든 카테고리에 AI 필터 동일 적용 — NEEDS_AI_FILTER/Tier 3 소스의 비AI 마킹 기사는 research여도 제외됨
- research 기사가 예상보다 적으면 AI 필터 오탐(비AI 마킹된 research 기사) 가능성 확인

**기사 단위 분류 검증 (필수):**
- 각 카테고리 Top 5 기사 제목을 확인하여 해당 카테고리에 맞는지 판정
  - models_products Top 5: 실제 신규 출시/공개인지? 기존 제품 언급이면 오분류. 학술/연구 기관(Stanford, MIT, Google AI 등) 출처의 프레임워크/모델 공개이면 research 오분류. 경량화/최적화/에지 연구 성격이면 research 오분류
  - research Top 5: 논문/벤치마크/알고리즘인지? 상용 제품 출시면 오분류. 기업 기술/데이터 활용 사례나 개념 비교(X vs Y) 기사면 industry_business 오분류
  - industry_business Top 5: catch-all이므로 위 두 카테고리에 해당하지 않는지만 확인
- 의심 분류 건수가 5건 이상이면 `[QA] 의심 분류` 로그의 기사별 판정 수행

**분류 오류 유형별 수정:**
- **industry_business 편향**: `_CLASSIFY_PROMPT`에서 models_products/research 판단 기준 강화
  - "공개", "출시", "release", "launch" → models_products 강조
  - "논문", "paper", "benchmark" → research 강조
- **models_products 오분류**: 제품명만 있고 신규 출시가 아닌 기사가 models_products로 → `⚠ Product name in title ≠ models_products` 규칙 강화
- **models_products→research 오분류**: 학술/연구 기관(Stanford, MIT, Google AI/DeepMind, MSR, FAIR, IBM Research) 출처의 프레임워크/모델 공개가 models_products로 분류됨 → research여야 함. 경량화/최적화/에지 연구도 가중치 공개 여부와 무관하게 research. 프롬프트에 학술 기관 목록 + tiebreak 규칙 추가됨 (`_CLASSIFY_PROMPT` 내)
- **research 오분류 (→industry_business)**: 기업 기술/데이터 활용 사례, 개념 비교/설명(explainer) 기사가 research로 → 프롬프트 NOT 규칙 + Examples로 경계 강화
- **경계 사례 Examples** (프롬프트에 이미 포함됨): "CiteAudit 논문"→research, "OpenClaw 팬 미팅"→industry_business, "GeForce NOW 15종 신규 게임"→industry_business, "포켓몬Go 데이터, 배달 로봇에 제공"→industry_business, "MCP와 스킬의 차이점은?"→industry_business, "스탠포드 연구진, 프레임워크 공개"→research, "IBM Research, 경량 음성 모델"→research, "Google AI, 연구 도구 공개"→research

**수정 대상 파일:** `scripts/agents/news_team.py` — `_CLASSIFY_PROMPT` 변수
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
| L2/L3 제목 유사도 | 정상 | 다른 기사인데 제목이 비슷해서 중복 처리 → DEDUP_THRESHOLD 조정. 보일러플레이트 제목 패턴(예: SiliconANGLE "What to expect...") 주의 — 같은 소스의 템플릿 제목이 L2에서 오탐 가능 | Major |
| L4 고유명사 가드 | 유사 구조 문장 오탐 차단 | "A, 소송 제기" vs "B, 소송 제기"가 L4에서 중복 처리됨 → 가드 작동 확인 | Major |

**중복감지 오탐 판별 기준:**
- QA 중복 감지 목록에서 **제목 쌍을 비교** — 실제로 같은 사건인지 다른 사건인지 판단
- L4 오탐: one_line 유사도≥0.65이나 다른 주체의 기사 (e.g., "Anthropic lawsuit" vs "Nintendo lawsuit") → 양쪽 고유명사가 있으면 1개+ 공유 필수 가드로 차단됨. 가드에도 잡히지 않으면 _extract_key_tokens 확인
- L6 오탐: 주제는 같지만 다른 사건 (e.g., "GPT-5 출시" vs "GPT-5 벤치마크 결과") → threshold 올려야
- L7 오탐: 같은 제품명이지만 다른 뉴스 (e.g., "Claude 4 가격" vs "Claude 4 성능") → overlap_ratio 올려야
- 미감지: 같은 기사가 다른 소스에서 나왔는데 중복 안 걸림 → 해당 layer 임계값 낮춰야
- **L5 유사 제품명 오탐**: 같은 카테고리의 다른 제품이 유사한 naming convention을 공유할 때 (e.g., "Arrow Lake" vs "Nova Lake" — 다른 Intel CPU이지만 key_tokens "lake"가 겹침), L5 `names_overlap ≥ 3`을 충족하여 오탐 발생 가능. 비AI 기사 간 오탐이면 user-facing 영향 없음 (이미 AI 필터에서 제외). AI 기사 간 오탐이면 _DEDUP_STOPWORDS에 공통 토큰 추가 검토
- **버전 없는 제품명 미감지 (구조적 한계)**: 동일 제품 발표(예: "Code Review 출시")가 3개+ 소스에서 다른 각도로 보도될 때, 제목 프레이밍 상이(L2/L3 miss) + 복합 기사 혼재(L4/L6 miss) + 버전 번호 없음(L5 `nums_overlap` 불충족) + one_line 초점 분산(L7 miss)으로 전 레이어 통과 가능. 반복 발생 시 L5 `nums_overlap` 조건 완화 또는 L7 `overlap_ratio` 하향(0.30→0.25) 검토
- **동일사건 다프레이밍 미감지**: 같은 사건(e.g., OpenAI 성인 모드 연기)이 소스별로 다른 관점에서 보도될 때 — 제목 프레이밍 상이(L2/L3 miss) + one_line 초점 상이(L4 miss) + 제품 버전 없음(L5 miss) + 임베딩 차이(L6 miss)로 전 레이어 통과 가능. 같은 사건의 **다른 관점** 제공이므로 양쪽 보존도 합리적 → Minor. 반복 시 L7 `overlap_ratio` 하향(0.30→0.25) 검토
- **L4 동일기업 다제품 오탐 (메가 이벤트)**: 같은 기업이 같은 날 여러 제품을 발표하면(e.g., NVIDIA GTC에서 Vera CPU, Dynamo 1.0, Agent Toolkit, NemoClaw 동시 발표), L4 one_line 유사도≥0.65 + 고유명사 가드가 기업명 공유로 통과 → 서로 다른 제품이 중복 처리. 검증법: 중복 쌍의 제목에 **다른 제품명**이 있으면 오탐. 메가 이벤트(GTC, I/O, WWDC 등) 당일에만 발생하므로 단일 발생 시 Minor. 반복 시 L4 고유명사 가드에 "같은 기업이라도 제품명(대문자 시작 고유명사)이 다르면 별도" 규칙 추가 검토

**수정 대상 파일:** `scripts/agents/news_team.py`
- `DEDUP_THRESHOLD`: 제목 유사도 임계값 (현재 0.65)
- `EMBED_DEDUP_THRESHOLD`: 임베딩 유사도 임계값 (현재 0.92)
- `_normalize_title()`: title=None 방어 포함
- `_DEDUP_STOPWORDS`: 변별력 없는 토큰 set
- `_extract_key_tokens()`: text=None 방어 포함
- `_extract_product_versions()`: title=None 방어 포함
- L4 고유명사 가드: `_deduplicate_candidates()` 내 one_line≥0.65 + 양쪽 제목에 고유명사(영어)가 있으면 1개+ 공유 필수. 한계: 동일 기업 다제품 발표 시 기업명 공유만으로 통과 → 메가 이벤트 시 오탐 가능
- L5 조건: `names_overlap >= 3 and nums_overlap >= 1` (`_deduplicate_candidates()` 내)
- L7 `overlap_ratio >= 0.30` (`_deduplicate_candidates()` 내)

### 1.5 랭킹(Ranking) 검사 (★ 심층 분석 — 전체 기사 대상)

로그 패턴:
- `[그룹] {category}: {n}개`
- `[{category}] 순위 결정 ({n}개):` + Top 5 기사 점수 (인라인)
- `카테고리별 랭킹 결과 상세` (CI 접기 섹션) — **전체 기사** 순위+점수+소스
- `[최종 선정] {category} ({n}개):` — 선정된 전체 기사 점수+소스
- `RANKER 폴백 {category}: ... — published 최신순 사용`
- `[JSON 복구]` — 랭킹 JSON 잘림

| 검사 항목 | 정상 범위 | 이상 징후 | 심각도 |
|-----------|----------|-----------|--------|
| Top 1 기사 적절성 | 중요한 뉴스 | 마이너 뉴스가 1위 → 랭킹 프롬프트 문제 | Major |
| 폴백 발생 | 없음 | `RANKER 폴백` 로그 → LLM 응답 실패 | Critical |
| JSON 잘림 | 없음 | 기사 40개+ 카테고리에서 JSON 잘림 | Critical |
| 하이라이트 품질 | 카테고리별 당일 Top 1이 중요 뉴스 | 하이라이트가 마이너 뉴스 → 랭킹 문제 | Major |
| 점수 분포 | 30-100 선형 | 모든 기사가 비슷한 점수 → 랭킹 미작동 | Minor |
| 전체 순위 일관성 | 상위=대형 뉴스, 하위=니치 뉴스 | 중요 뉴스가 하위에, 니치 뉴스가 상위에 → 랭킹 프롬프트 문제 | Major |
| 카테고리 간 밸런스 | 각 카테고리에서 가장 영향력 있는 기사가 Top | 한 카테고리만 랭킹이 이상 → 해당 카테고리 컨텍스트 부족 의심 | Major |

#### 1.5.1 전체 기사 랭킹 검증 (★ 필수)

**데이터 소스**: `카테고리별 랭킹 결과 상세` CI 접기 섹션 또는 `[최종 선정]` 섹션에서 **모든** 기사의 순위, 점수, 소스를 확인.

**최종 선정 목록 정렬 규칙 (의도된 설계):**
- `_select_category_top_n`은 `(_day_key, _total_score, _time_key)` 순으로 정렬 (reverse=True)
- 1순위: KST 날짜 최신순, 2순위: 같은 날짜 내 점수 높은 순, 3순위: 시각 최신순
- 모바일 앱 `sortByDateThenScore()`도 동일 로직 적용
- 따라서 **다른 KST 날짜 간** score 순서 위반은 정상 동작 (비당일 고점수 기사가 당일 저점수 기사 뒤에 오는 것은 의도된 설계)
- 같은 KST 날짜 내에서 score 순서가 안 맞으면 → 그때만 버그

**전체 기사 순위 검증 절차:**
1. 각 카테고리별 **전체 기사 목록**을 순위순으로 나열
2. 기사 제목을 하나씩 읽고, 해당 순위가 납득 가능한지 판단
3. 다음 유형의 미스랭킹을 식별:

| 미스랭킹 유형 | 정의 | 예시 | 심각도 |
|--------------|------|------|--------|
| **과대 랭킹** | 니치/마이너 뉴스가 상위 20%에 위치 | 튜토리얼 기사가 research Top 3, MWC 부스 소개가 models_products Top 5 | Major |
| **과소 랭킹** | 대형 뉴스가 하위 50%에 위치 | 주요 모델 출시가 models_products 15위, 대규모 투자가 industry_business 20위 | Major |
| **카테고리 오배치** | 기사가 잘못된 카테고리에 있어서 해당 카테고리 내 순위가 왜곡됨 | 연구 논문이 industry_business에 들어가서 industry_business 랭킹에 노이즈 추가 | Major |
| **비당일 과대평가** | 며칠 전 기사가 당일 중요 기사보다 높은 순위 | 3일 전 뉴스가 오늘 대형 뉴스보다 상위. 비당일 기사는 최종 목록에서 당일 기사 뒤에 배치됨 (의도된 동작). 랭커 점수 자체가 부적절한 경우에만 이슈 | Minor |

**기사 중요도 판단 기준 (순위 적절성 평가 시 사용):**

| 중요도 | 기사 유형 | 기대 순위 |
|--------|----------|----------|
| **S-tier** (최상위) | 주요 모델 출시 (GPT-5, Gemini 2 등), 대규모 규제 변화, 수십억$ 투자/인수, 주요 기업 전략 전환 | Top 1-3 |
| **A-tier** (상위) | 중견 모델/도구 출시, 주요 연구 돌파구, 대형 기업 파트너십, 중대 법적/윤리 이슈 | Top 4-10 |
| **B-tier** (중위) | 일반 제품 업데이트, 보통 수준의 연구, 스타트업 펀딩, 산업 트렌드 분석 | Top 11-20 |
| **C-tier** (하위) | 니치 도구, 튜토리얼/가이드, 마이너 업데이트, 컨퍼런스 소식, 역사 회고 | Top 21+ |

**검증 시 특히 주의할 패턴:**
- **Tom's Hardware 소스**: PC 하드웨어/벤치마크 기사가 AI와 간접적으로만 관련 → 과대 랭킹 경향 확인
- **튜토리얼/가이드 기사**: research에 분류되지만 중요도는 낮음 → research 하위권이 적절
- **역사 회고 기사**: "AMD 2000년 1GHz 돌파" 같은 기사가 models_products에 있으면 하위권 적절
- **동일 사건 다소스**: 중복 감지에서 걸러졌지만, 비슷한 각도의 다른 기사가 남은 경우 → 과도한 상위 집중 가능

#### 1.5.2 카테고리별 전체 순위 리포트 (★ 필수 출력)

**QA 리포트에 반드시 각 카테고리별 전체 기사의 순위 테이블을 포함해야 함.**

각 카테고리에 대해 다음 테이블을 출력:

```
#### {category} 전체 랭킹 ({n}개)
| 순위 | 점수 | 소스 | 기사 제목 | 판정 |
|------|------|------|----------|------|
| 1 | 100 | techcrunch_ai | "OpenAI, GPT-5.4 출시..." | 적절 — S-tier 뉴스 |
| 2 | 97 | wired_ai | "ByteDance, Seedance 2.0 공개" | 적절 — A-tier 출시 |
| ... | ... | ... | ... | ... |
| 25 | 30 | toms_hardware | "AMD Athlon 2000년 역사" | 적절 — C-tier 회고 |
```

**판정 기준:**
- **적절**: 기사 중요도와 순위가 일치 (S-tier=Top 1-3, A-tier=Top 4-10 등)
- **과대**: 기사 중요도 대비 순위가 너무 높음 (예: C-tier 기사가 Top 5)
- **과소**: 기사 중요도 대비 순위가 너무 낮음 (예: S-tier 기사가 Top 15+)
- **경계**: 판단이 애매한 경우

**미스랭킹 집계:**
- 전체 기사 중 미스랭킹(과대+과소) 비율 계산
- <10%: Pass, 10-20%: Minor, 20-30%: Major, >30%: Critical

#### 1.5.3 랭킹 품질 종합 판별

- **전체 기사를 검토**한 후, 각 카테고리별로 종합 판정
- 각 카테고리 Top 1 기사가 "해당 날의 가장 중요한 뉴스"인지 상식적으로 판단
- 명백한 대형 뉴스(주요 모델 출시, 대규모 투자 등)가 1위가 아닌 경우 → 랭킹 프롬프트 수정 필요
- 하위 기사 중 상위에 있어야 할 기사가 있으면 → 랭킹 기준 또는 컨텍스트 부족 의심
- 폴백 발생 → `token_budget = max(6144, count*150)` 부족 가능성 → 상수 조정
- 컨텍스트 축소 임계값 재검토: `>40: 제목만, 25-40: 150자, ≤25: 500자`

**하이라이트 선정 로직 (판정 시 필수 이해):**
- 하이라이트 = 카테고리별(research/models_products/industry_business) **당일 기사** 중 Top 1, 총 3개
- 전체 1위 기사라도 published 날짜가 오늘이 아니면 하이라이트에서 제외됨 → 정상 동작
- 따라서 "전체 Top 1이 하이라이트에 없다"는 비당일 기사 제외 때문일 수 있음 → 버그가 아님

#### 1.5.4 랭킹 수정 가이드

미스랭킹이 Major 이상일 때 수정 대상:

**수정 대상 파일:** `scripts/agents/news_team.py`
- `_RANK_PROMPT`: 랭킹 기준 프롬프트
- `_rank_category()`: token_budget, ctx_len 임계값
- 컨텍스트 축소 기준: `_rank_category()` 내 `ctx_len` 분기
- token_budget: `_rank_category()` 내 `max(6144, count * 150)`

**미스랭킹 유형별 수정 방법:**

| 미스랭킹 유형 | 원인 | 수정 |
|--------------|------|------|
| 마이너 뉴스가 전반적으로 상위 | 랭킹 프롬프트의 중요도 기준이 약함 | `_RANK_PROMPT`에 구체적 중요도 tier 기준 추가 (prompt-engineer) |
| 특정 카테고리만 랭킹 이상 | 해당 카테고리 기사 수 과다 → 컨텍스트 축소로 제목만 보고 판단 | ctx_len 임계값 조정 또는 token_budget 증가 (backend-pipeline-developer) |
| 튜토리얼/가이드가 research 상위 | 프롬프트가 "novelty" 기준으로 논문과 튜토리얼을 동등 취급 | `_RANK_PROMPT`에 "tutorial/guide는 novelty 낮음" 명시 (prompt-engineer) |
| 하드웨어/벤치마크 기사 과대평가 | 제목에 인상적 숫자(1GHz, 50배 등)가 있어 LLM이 과대평가 | `_RANK_PROMPT`에 "하드웨어 벤치마크는 AI 직접 관련 아니면 낮게" 추가 (prompt-engineer) |
| 회고/기념 기사가 카테고리 1위 | LLM이 역사적 의의를 과대평가 (e.g., "AlphaGo 10주년") | 하이라이트에는 영향 없음(비당일 제외). 카테고리 피드 정렬에만 영향 → Minor. 반복 시 `_RANK_PROMPT`에 "retrospective/anniversary는 당일 뉴스보다 낮게" 추가 |
| JSON 잘림으로 하위 기사 누락 | token_budget 부족 | token_budget 상수 증가 (backend-pipeline-developer) |
| 폴백(최신순) 사용 | LLM 랭킹 실패 | 재시도 로직 또는 token_budget 확인 (backend-pipeline-developer) |

**수정 시 에이전트 선택:**
| 이슈 유형 | 에이전트 | 수정 대상 |
|-----------|---------|-----------|
| 랭킹 기준/프롬프트 텍스트 변경 | prompt-engineer | `_RANK_PROMPT` |
| token_budget, ctx_len, 임계값 조정 | backend-pipeline-developer | `_rank_category()` |
| 전반적 랭킹 품질 저하 (프롬프트+로직 동시) | prompt-engineer + backend-pipeline-developer (병렬) | 프롬프트 + 로직 |

### 1.6 학문스낵(Principle) 검사

**현재 모드: curated 전용** — LLM 생성 비활성화. `scripts/curated_principles/` 폴더의 45개 사전 검수 콘텐츠만 사용. 파이프라인은 시드 선택 → curated 파일 로드 → verifier skip → Firestore 저장만 수행.

로그 패턴:
- `[seed_selector] curated 시드: {n}개 ({id1}, {id2}, ...)` — curated 파일이 있는 시드만 후보
- `[seed_selector] curated 1개 → 고정 선택: {seed_id}` — curated 시드가 1개일 때
- `[content_generator] curated 콘텐츠 사용: {seed_id}` — curated 파일 로드 (content_source='curated')
- `[verifier] curated 콘텐츠 — 검증 건너뜀` — curated는 사전 검수 완료로 verifier skip
- `[assembler] Firestore 저장 완료: daily_principles/{date}`

#### 1.6.1 시드 선택 & 로드 검사

| 검사 항목 | 정상 | 이상 징후 | 심각도 |
|-----------|------|-----------|--------|
| curated 시드 후보 수 | 45개 중 30일 미사용 시드 존재 | 0개 → 45개 모두 30일 내 사용됨, curated 풀 고갈 | Critical |
| 3일 분야 로테이션 | 최근 3일과 다른 분야(super_category) 선택 | 같은 분야 연속 → `seed_selector()` 로테이션 로직 점검 | Major |
| 30일 시드 중복 회피 | 최근 30일 내 미사용 시드 선택 | 같은 시드 반복 → Firestore 이력 조회 로직 점검 | Major |
| curated 파일 로드 | `curated 콘텐츠 사용` 로그 정상 출력 | 파일 로드 실패 / 파일 파싱 에러 | Critical |
| verifier skip | `curated 콘텐츠 — 검증 건너뜀` 로그 | curated인데 verifier 실행됨 → 로직 오류 | Major |
| Firestore 저장 | `Firestore 저장 완료` 로그 | 저장 실패 에러 | Critical |
| content_source | 'curated' | 'generated' → curated 전용 모드에서 LLM 생성 발생은 비정상 (curated 풀 고갈 비상 폴백 제외) | Major |

#### 1.6.2 Firestore 데이터 완결성 검사

| 검사 항목 | 정상 | 이상 징후 | 심각도 |
|-----------|------|-----------|--------|
| content_ko + content_en | 둘 다 존재, 각각 2000~5000자 | 누락 또는 <1500자 → curated 파일 불완전 | Critical |
| _en 필드 쌍 | content_en + title_en + keywords_en 존재 | _en 필드 누락 → 바이링구얼 표시 불가 | Major |
| content_en 비율 | content_ko의 70~130% | 극단적 비율 차이 → curated 파일 내 번역 불균형 | Minor |
| readTime | 코드에서 `_calc_read_time`으로 자동 계산 (500자/분) | LLM 출력값 그대로 사용 → 코드 레그레션 | Minor |
| connectionType | direct_inspiration / structural_analogy / mathematical_foundation / conceptual_borrowing 중 하나 | 유형 불일치 → curated 파일 메타데이터 수정 필요 | Minor |
| keywords | 원리+AI 양쪽 키워드 (KO + EN 쌍) | 관련 없는 키워드, 또는 너무 일반적("AI", "기술") | Minor |

#### 1.6.3 LLM 폴백 검사 (비상 시만)

curated 풀 고갈(45개 모두 30일 내 사용) 시 LLM 생성 폴백이 발동됨. 정상 운영에서는 발생하지 않아야 함.

| 검사 항목 | 정상 | 이상 징후 | 심각도 |
|-----------|------|-----------|--------|
| 폴백 발동 여부 | 미발동 (curated 사용) | `content_source='generated'` → curated 풀 고갈 확인, 시드 추가 필요 | Major |
| 폴백 시 검증 통과 | verified=true, confidence≥0.7 | verified=false 또는 confidence<0.7 → 재시도 | Major |
| 폴백 시 콘텐츠 품질 | 학문→AI 매핑 명시적, 수식 포함(해당 분야) | 추상적 서술만, 수식 누락 → 프롬프트 수정 필요 | Major |

**수정 대상 파일:** `scripts/agents/principle_team.py`
- `seed_selector()`: 시드 선택 + 30일 중복 회피 + 3일 로테이션 로직
- `_load_curated_content()`: curated 파일 로드
- `content_generator()`: curated 전용 (LLM 폴백은 curated 0개 비상 시만)

**수정 시 에이전트 선택:**
| 이슈 유형 | 에이전트 | 수정 대상 |
|-----------|---------|-----------|
| 시드 선택/로테이션 오류 | backend-pipeline-developer | `seed_selector()` 로직 |
| curated 파일 로드 실패 | backend-pipeline-developer | `_load_curated_content()` |
| curated 풀 고갈 → 시드 추가 | ai-interdisciplinary-scholar | `scripts/curated_principles/` 새 콘텐츠 작성 |
| LLM 폴백 품질 문제 | prompt-engineer | `_CONTENT_PROMPT`, `_VERIFY_PROMPT` |

### 1.7 브리핑(Briefing) 품질 검사 (★ 심층 분석)

로그 패턴:
- `브리핑 저장 완료: {n}개 스토리`
- `[KO] ({n}자)` + 브리핑 전문 (CI 로그의 "오늘의 브리핑" 접기 섹션)
- `[EN] ({n}자)` + 브리핑 전문
- `도메인 분포 ({n}개):` + 도메인별 기사 수 — topic_cluster_id 기반 Top 5 + Others
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
| domain_stats | Top 5 + Others, 합계=전체 기사 수 | 빈 배열 → topic_cluster_id 미할당 기사 다수 | Minor |

#### 1.7.2 콘텐츠 품질 검사 (★ 핵심)

| 검사 항목 | 좋은 예 | 나쁜 예 | 심각도 |
|-----------|---------|---------|--------|
| **인사말** | "안녕하세요, 오늘의 AI 뉴스 브리핑입니다" — 자연스러운 오프닝 | 인사 없이 바로 시작, 또는 과도한 서론 | Minor |
| **팩트 정확성** | 하이라이트/카테고리 Top 기사의 핵심 내용이 정확히 반영됨 | 기사에 없는 내용 추가 (환각), 숫자/이름 오류 | Critical |
| **커버리지** | 하이라이트 3개 + 주요 카테고리 기사 포함 | 하이라이트 기사 누락, 특정 카테고리 편중 | Major |
| **해요체 일관성** (KO) | "~했어요", "~입니다" — 해요체 유지 | 존댓말/반말 혼용, 격식체("~하였다") 혼입 | Minor |
| **고유명사 유지** (KO) | "OpenAI", "GPT-5.4" — 영어 고유명사 그대로 | 고유명사 번역 ("오픈에이아이") | Minor |
| **마무리** | 자연스러운 클로징 + 내일 예고 또는 인사 | 갑자기 끊김, 불완전한 문장 | Minor |

#### 1.7.3 핫토픽(Hot Topics) 검사

| 검사 항목 | 정상 범위 | 이상 징후 | 심각도 |
|-----------|----------|-----------|--------|
| 태그 병합 정상 작동 | 접두어+공백 경계 하위 태그가 부모에 합산 (e.g. "microsoft 365" → "microsoft") | 동일 접두어 태그가 별도로 Top 8에 존재 | Minor |
| 부적절한 병합 없음 | 무관한 태그가 독립 유지 | 짧은 일반 태그("ai")가 "ai safety" 등을 흡수하여 카운트 과대 | Major |
| Top 8 대표성 | 구체적이고 변별력 있는 태그 | "기술", "뉴스" 등 변별력 없는 태그가 상위 독점 | Major |
| 태그 수 | 3-8개 | <3개 → 기사 태그 생성 부족, 0개 → 전체 태그 누락 | Minor |
| KO/EN 동일 개념 미병합 | 현재 접두어+공백 경계만 병합 | "ai 에이전트"와 "ai agent"가 별도 태그로 존재 (KO/EN 동일 개념) → 현재 병합 로직은 접두어 매칭만 지원하여 교차 언어 병합 불가 (구조적 한계) | Minor |

**수정 대상 파일:** `scripts/generate_features.py` — 핫토픽 병합 로직 (`hot_topics` 변수 주변, `tags_sorted`/`merged`/`alias` 딕셔너리)

#### 1.7.4 하이라이트 반영 검사

- 로그의 하이라이트 3개 기사가 브리핑에 언급되었는지 확인
- 하이라이트 기사가 브리핑에서 누락된 경우 → Major
- 카테고리 Top 1 기사(research/models_products/industry_business)가 최소 1개 이상 반영되었는지 확인

**수정 대상 파일:** `scripts/generate_features.py`
- `generate_daily_briefing()`: 브리핑 생성 함수
- 브리핑 프롬프트: `generate_daily_briefing()` 내 `prompt` 변수
- 입력 기사 선정 로직: `generate_daily_briefing()` 내 highlights + cat_articles 조합

**수정 시 에이전트 선택:**
| 이슈 유형 | 에이전트 | 수정 대상 |
|-----------|---------|-----------|
| 브리핑 프롬프트 품질 (톤, 구조, 커버리지) | prompt-engineer | generate_features.py 프롬프트 |
| 브리핑 길이/story_count 조정 | prompt-engineer | 프롬프트의 지시문 수정 |
| 입력 기사 선정 로직 | backend-pipeline-developer | generate_features.py 로직 |
| 브리핑 생성 실패/파싱 오류 | backend-pipeline-developer | generate_features.py 에러 핸들링 |
| 핫토픽 병합 오류/부적절한 병합 | backend-pipeline-developer | generate_features.py 핫토픽 병합 로직 (`hot_topics` 변수 주변) |

### 1.8 용어사전/태그(Glossary & Tags) 품질 검사 (★ 심층 분석)

**세 개념의 역할 (혼동 주의):**
- **glossary** (기사 인라인): 기사별 전문 용어 2-3개 `{term, desc}` — 기사 모달 하단 아코디언
- **glossary_terms** (DB 축적): 인라인 glossary를 `accumulate_glossary()`로 전역 축적 → HighlightedText가 자동 감지
- **tags**: 기사의 핵심 주제 키워드 2-4개 (string[]) — UI 표시 + 개인화 추천 + 타임라인 매칭

로그 패턴:
- `태그 보유 {n}/{total}개 (누락 {m})` — assembler 결과 요약
- `용어사전 보유 {n}/{total}개 (누락 {m})` — assembler 결과 요약
- `[태그 누락] {n}개:` + 기사 제목 목록 — articles 저장 시 접기 섹션
- `[용어사전 누락] {n}개:` + 기사 제목 목록 — articles 저장 시 접기 섹션
- `용어 사전: {n}개 용어 축적 완료` — accumulate_glossary 결과
- `용어 사전 상세 ({n}개)` — 접기 섹션: 축적된 용어 전체 목록

#### 1.8.1 커버리지 검사

| 검사 항목 | 정상 범위 | 이상 징후 | 심각도 |
|-----------|----------|-----------|--------|
| tags 보유율 | 95-100% | <90% → 요약 프롬프트에서 tags 생성 실패 | Major |
| glossary 보유율 | 90-100% | <80% → 요약 프롬프트에서 glossary 생성 실패 | Major |
| 축적 용어 수 | 50-200개 | <30개 → 용어 추출 부족, >250개 → 품질 저하 가능 | Minor |
| glossary 배치 저장 실패 | 없음 | `glossary 배치 저장 실패` 로그 | Major |

#### 1.8.2 용어 품질 검사

| 검사 항목 | 좋은 예 | 나쁜 예 | 심각도 |
|-----------|---------|---------|--------|
| **전문 용어 선별** | "MoE", "RAG", "RLHF" — 일반 독자가 모를 용어 | "AI", "모델", "데이터" — 너무 일반적 | Major |
| **설명 품질** | "여러 전문가 모델 중 적합한 것을 선택적으로 활용하는 구조예요" — 이해 가능 | "중요한 기술이에요" — 설명 아님 | Major |
| **KO/EN 쌍** | term_ko + term_en + desc 모두 존재 | EN 용어만 있고 KO 설명 없음 | Minor |
| **중복 용어** | 동일 용어가 다른 기사에서 설명 일관 | 같은 용어인데 설명이 모순 | Minor |

#### 1.8.3 태그 품질 검사

| 검사 항목 | 좋은 예 | 나쁜 예 | 심각도 |
|-----------|---------|---------|--------|
| **주제 대표성** | ["OpenAI", "GPT-5", "멀티모달"] — 기사 핵심 주제 | ["기술", "뉴스", "최신"] — 변별력 없음 | Major |
| **개수** | 2-4개 | 0개(누락) 또는 6개+(과다) | Minor |
| **EN 폴백** | tags_en 별도 생성, 자연스러운 영어 | tags를 그대로 복사 (한국어 음차 그대로) | Minor |

**수정 대상 파일:**
| 컴포넌트 | 파일 | 함수/변수 |
|----------|------|-----------|
| 요약 프롬프트 (tags/glossary 생성) | news_team.py | `_summarize_batch()` 내 tags/glossary 지시문 |
| tags/glossary 파싱 | news_team.py | `_apply_batch_results()` |
| 용어 축적 | generate_features.py | `accumulate_glossary()` |
| HighlightedText 불용어 | mobile/components/shared/HighlightedText.tsx | `COMMON_TERMS` |

**수정 시 에이전트 선택:**
| 이슈 유형 | 에이전트 | 수정 대상 |
|-----------|---------|-----------|
| tags/glossary 누락률 높음 (프롬프트 문제) | prompt-engineer | news_team.py 요약 프롬프트 |
| 용어가 너무 일반적 / 설명 품질 낮음 | prompt-engineer | 요약 프롬프트의 glossary 지시문 |
| 축적 로직 오류 / 배치 저장 실패 | backend-pipeline-developer | generate_features.py |
| HighlightedText 불용어 조정 | mobile-frontend-dev | HighlightedText.tsx |

### 1.9 제목 품질 검사 (★ 심층 분석 — 말줄임표 적절성)

로그 패턴:
- `[QA] 제목 품질 검증`
- `[제목 통계] 말줄임표('...') KO: {n}건, EN: {n}건 / 전체 {total}건`
- `[말줄임표 KO] '...'로 끝나는 제목 ({n}건):` + 개별 제목 목록
- `[말줄임표 EN] '...'로 끝나는 제목 ({n}건):` + 개별 제목 목록
- `[일반 KO] '...' 없는 제목 ({n}건):` + 개별 제목 목록
- `미번역 제목 {n}건` — 영어 원문이 display_title에 그대로 사용
- `one_line 누락 {n}건` — 알림 body 비어 있을 수 있음

| 검사 항목 | 정상 범위 | 이상 징후 | 심각도 |
|-----------|----------|-----------|--------|
| 부자연스러운 말줄임표 (구분자 패턴) | 0건 | 확정 사실 서술어 뒤 '...'를 구분자로 사용 | Major |
| 말줄임표 전혀 미사용 | 1건 이상 | 0% (전혀 미사용) → 프롬프트 미작동 의심 | Minor |
| 말줄임표 미사용 (놓친 기회) | 0-2건 | 여운/암시 어울리는 제목인데 '...' 미사용 | Minor |
| 미번역 제목 | 0건 | 영어 원문 그대로 사용 | Major |
| one_line 누락 | 0건 | 알림 body가 비게 됨 (푸시 알림 2줄 표시 불가) | Major |
| 80자 초과 제목 | 0-3건 | 알림에서 잘릴 수 있음 | Minor |

#### 1.9.1 말줄임표('...') 적절성 기사 단위 판정 (★ 필수)

**`[말줄임표 KO]` 목록의 각 제목을 하나씩 판정:**

| 판정 | 기준 | 예시 |
|------|------|------|
| **적절** | 여운·궁금증·암시·서스펜스가 자연스러움 | "OpenAI, 차세대 모델 힌트...출시 임박?", "AI 에이전트의 끝은 어디까지..." |
| **부자연스러움** | 단순 사실 전달인데 '...' 강제 부착 | "Apple, M5 칩 공개...", "Google, 2분기 매출 발표..." |
| **과도** | 제목 내용에 미완성감/여운이 없는데 '...'로 끝남 | "새로운 벤치마크 결과 공개...", "NVIDIA 주가 상승..." |

**'...' 적절 vs 부자연스러움 판별 기준:**

1. **적절한 경우 (여운·궁금증·예고·충격·반전·불확실성·열거 암시·호기심 유발·전망·의문이 제목에 내재 — 비율 제한 없이 자유 사용):**
   - 힌트/예고/루머 기사: "~힌트...", "~예고...", "~유출..."
   - 미래 방향 질문: "~어디까지...", "~가능할까...", "~바꿀까..."
   - 반전/충격: "~알고 보니...", "~사실은...", "~했는데..."
   - 불확실성/논쟁: "~규제인가 혁신인가...", "~과연...", "~글쎄..."
   - 열거/나열 암시: "~그리고 더...", "~뿐만 아니라..."
   - 호기심 유발/전망/의문: "~될까?", "~인가?", "~어떻게?"

2. **부자연스러운 경우 (확정 사실 서술어 뒤 '...'를 구분자로 사용):**
   - '주제...부가정보' 구분자 패턴 — 확정 사실 서술어 뒤 '...'로 부가정보를 연결하는 패턴. 쉼표(,)로 연결해야 함
   - 금지 서술어 34개 (확정 사실 뒤 '...' 금지): 공개, 출시, 발표, 인수, 도입, 개발, 선언, 철회, 체결, 중단, 제기, 투자, 가동, 확대, 보류, 강화, 적용, 탑재, 시작, 달성, 증가, 전망, 본격화, 능가, 업그레이드, 전환, 추진, 가속화, 착수, 재편, 통합, 확장, 부여, 업데이트
   - ❌→✅ 예시: "NVIDIA, 모델 공개... 처리량 5배"→쉼표 연결, "Google, Wiz 인수... 역대 최대"→수치 통합, "Microsoft, Copilot 출시... 건강 관리 혁신"→쉼표 연결, "AWS, WSE-3 도입... 추론 5배"→문장 통합, "Salesforce, 에이전트 공개... 혁신 시대"→쉼표 연결
   - 검증법: '...'를 ','로 바꿔도 의미가 같으면 → ','를 써야 함
   - **코드 후처리 적용됨 (2026-03-17)**: EN→KO 번역 제목에 `_fix_title_separator()` 자동 교정 (`_TITLE_FORBIDDEN_ELLIPSIS` 정규식). 후처리 적용 후에도 부자연스러운 구분자 패턴이 잔존하면 → 정규식 미커버 패턴이므로 `_TITLE_FORBIDDEN_ELLIPSIS` 정규식 업데이트 필요
   - **주의**: '...'·'?' 자체의 사용 비율에는 제한이 없음. 자연스럽게 어울리면 자유롭게 사용. 부자연스러움 판정은 오직 구분자 패턴에 한정

3. **경계 사례 (맥락에 따라 판단):**
   - "OpenAI, 새 모델 출시..." → 부자연스러움 (확정 사실). 단, "OpenAI, 새 모델 출시...하지만 논란도" → 적절 (반전 암시)
   - "Google CEO의 깜짝 발표..." → 적절 (발표 내용 궁금증). 단, "Google CEO, AI 전략 발표..." → 부자연스러움
   - 기사 내용을 모르면 제목 자체만으로 판단 — 제목이 독자의 궁금증을 유발하는지가 핵심

**`[일반 KO]` 목록에서 놓친 기회 확인:**

다음 유형의 제목이 '...' 없이 끝나면 놓친 기회로 판정:
- 힌트/루머/예고 기사인데 평서문으로 끝남: "OpenAI, 새 모델 힌트" → "OpenAI, 새 모델 힌트..." 가 더 자연스러움
- 미래 전망/불확실성 기사: "AI 규제의 향방은" → "AI 규제의 향방은..." 가 더 여운 있음
- 열린 결말 구조인데 마침표/종결어미로 닫힘: "~될 수 있다" → "~될 수 있을까..."

**주의: '...'와 '?'는 비율 제한 없이 자유롭게 사용 가능.** 어울리면 적극 사용하되, 확정 사실 서술어 뒤 구분자로 쓰는 것만 부자연스러움으로 판정. "놓친 기회"가 0건이어도 정상.

#### 1.9.2 제목 품질 종합 리포트 (★ 필수 출력)

QA 리포트에 반드시 다음 테이블을 포함:

```
#### 제목 품질 검사
| # | 제목 (KO) | '...' 사용 | 판정 | 근거 |
|---|----------|-----------|------|------|
| 1 | "OpenAI, 차세대 모델 힌트...출시 임박?" | ✓ | 적절 | 힌트/예고 → 궁금증 유발 |
| 2 | "Apple, M5 칩 공개..." | ✓ | 부자연스러움 | 확정 사실에 '...' 불필요 |
| 3 | "Google, AI 규제의 향방은" | ✗ | 놓친 기회 | 불확실성 제목에 '...' 어울림 |
| 4 | "Meta, Llama 4 오픈소스 공개" | ✗ | 적절 | 사실 전달 → '...' 불필요 |

**말줄임표 요약:**
- 사용: {n}건 / 전체 {total}건 ({ratio}%)
- 적절: {n}건, 부자연스러움: {n}건, 놓친 기회: {n}건
- 판정: [Pass / Minor / Major]
```

**판정 기준:**
- **Pass**: 부자연스러움(구분자 패턴) 0건 + 놓친 기회 0-1건
- **Minor**: 부자연스러움 1-2건 또는 놓친 기회 3건+ 또는 '...' 전혀 미사용(0%)
- **Major**: 부자연스러움 3건+

#### 1.9.3 제목 품질 수정 가이드

| 이슈 유형 | 원인 | 수정 |
|-----------|------|------|
| 부자연스러운 '...' 구분자 패턴 반복 | LLM이 '확정 사실(공개/출시/도입 등) 뒤 ...로 부가정보 연결' 패턴 반복 | 프롬프트에 금지 서술어 34개 명시 + 2단계 우선순위(금지→적극사용) + ❌/✅ 예시 5개 (2026-03-16 적용). 코드 후처리 `_fix_title_separator()` 추가 (2026-03-17) — EN→KO 번역 제목에서 금지 서술어 + '...' 패턴을 쉼표로 자동 교정. 정규식 34개 서술어로 확장 (2026-03-19). 프롬프트 + 코드 2중 방어 |
| '...' 전혀 미사용 (0%) | LLM이 '...' 지시를 무시 | 프롬프트에서 '...' 예시를 더 눈에 띄게 배치 — 자연스럽게 사용하되 강제하지 않음 (prompt-engineer) |
| 미번역 제목 | Phase 3/4 번역 실패 | news_team.py 번역 retry 로직 확인 (backend-pipeline-developer) |
| one_line 누락 | 요약 프롬프트 미준수 | 요약 프롬프트에서 one_line 필수 강조 (prompt-engineer) |

**수정 대상 파일:** `scripts/agents/news_team.py`
- 번역+요약 프롬프트: `_summarize_batch()` 내 `title_rule` 변수
- EN 제목 프롬프트: `en_fields_rule` 내 `display_title_en`
- KO 제목 프롬프트 (EN→KO 번역): `title_rule` 변수 (translate=True 분기)

**수정 시 에이전트 선택:**
| 이슈 유형 | 에이전트 | 수정 대상 |
|-----------|---------|-----------|
| '...' 사용 프롬프트 조정 (남용/미사용/부자연스러움) | prompt-engineer | `_summarize_batch()` 내 `title_rule` 변수 |
| 미번역/one_line 누락 (로직 문제) | backend-pipeline-developer | `_process_articles()` Phase 3/4 |

### 1.10 요약 콘텐츠 품질 검사 (★ 심층 분석)

로그 패턴:
- `[요약 통계] key_points 부족(0-1개): {n}건, why_important 누락: {n}건, background 누락: {n}건`
- `[요약 말투] 위반 없음` 또는 `요약 말투 위반 {n}건 감지` + 개별 위반 상세
- `[QA] 요약 품질 이슈 {n}건 감지` 또는 `[QA] 요약 품질 이슈 없음`
- `요약 상세: 전체 기사 요약` — 접기 섹션: 기사별 one_line, key_points, why_important, background 전문

#### 1.10.1 필드 완결성 검사

| 검사 항목 | 정상 범위 | 이상 징후 | 심각도 |
|-----------|----------|-----------|--------|
| one_line 보유율 | 100% | 누락 기사 → 알림 body 비어 있음 | Major |
| key_points 보유율 (3개+) | 90-100% | 0-1개 기사 5건+ → 요약 프롬프트 문제 또는 스크래핑 실패 | Major |
| key_points 2개 | 허용 (팩트 부족 기사) | 2개 기사가 전체 30%+ → 프롬프트가 충분히 추출 못함 | Minor |
| why_important 보유율 | 95-100% | 누락 다수 → 프롬프트 미준수 | Minor |
| background 보유율 | 90-100% | 누락 다수 → 프롬프트 미준수 | Minor |
| EN 필드 쌍 (one_line_en, key_points_en, why_important_en, background_en) | 모든 기사 | 누락 → EN 사용자 요약 불가 | Major |

#### 1.10.2 말투 규칙 준수 검사 (★ 핵심)

각 필드별 종결어미가 엄격히 구분됨. 혼용 시 앱 내 톤 불일치 발생.

| 필드 | 올바른 말투 | 올바른 종결 예시 | 위반 종결 패턴 |
|------|-----------|----------------|--------------|
| one_line | 서술체 | ~했다, ~됐다, ~밝혔다 | ~했어요, ~이에요, ~합니다, ~됩니다 |
| key_points | 개조식(명사형) | ~임, ~됨, ~함, ~지원, ~예정, 명사구("50% 인하") | ~했다, ~됐다, ~했어요, ~이에요, ~됩니다 |
| why_important | 해요체 | ~이에요, ~해요, ~있어요, ~돼요, ~거예요 | ~했다, ~됐다, ~됩니다, ~입니다 |
| background | 서술체 | ~했다, ~됐다, ~있었다 | ~했어요, ~이에요, ~돼요 |
| glossary desc | 해요체 | ~이에요, ~해요 | ~이다, ~됩니다, ~했다 |

**파이프라인 자동 감지**: `요약 말투 위반 {n}건 감지` 로그로 기본 패턴 자동 검출. 파이프라인이 감지하지 못하는 미묘한 위반(예: key_points가 "~한 것으로 보임"처럼 문장형이지만 정규식 미매칭)은 `요약 상세` 접기 섹션에서 수동 확인.

**기사 단위 말투 검증 (필수):**
- `요약 상세: 전체 기사 요약` 접기 섹션의 각 기사 요약을 확인
- one_line이 "~했어요"로 끝나면 → 말투 위반 (서술체여야 함)
- key_points 항목이 "~했다" 또는 "~이에요"로 끝나면 → 말투 위반 (개조식이어야 함)
- why_important가 "~했다" 또는 "~됩니다"로 끝나면 → 말투 위반 (해요체여야 함)
- background가 "~했어요"로 끝나면 → 말투 위반 (서술체여야 함)

**말투 위반 심각도:**
- 1-3건: Minor (소수 기사 → 프롬프트 자체는 정상, 모니터링)
- 4-10건: Major (LLM이 말투 규칙 무시 경향 → 프롬프트 강화 필요)
- 10건+: Critical (프롬프트 규칙 전면 미준수 → 프롬프트 재설계)

#### 1.10.3 콘텐츠 품질 검사 (★ 핵심)

**one_line 품질:**

| 검사 항목 | 좋은 예 | 나쁜 예 | 심각도 |
|-----------|---------|---------|--------|
| **사건 핵심 전달** | "OpenAI가 GPT-5를 공식 출시했다" — 누가+무엇 | "OpenAI가 혁신적인 도약을 이뤘다" — 사건 불명확 | Major |
| **단일 사건** | 1문장에 1사건 | 여러 사건을 한 문장에 압축 | Minor |
| **의견·해석 배제** | 팩트만 전달 | "획기적인", "놀라운", "주목할 만한" 수식어 포함 | Minor |
| **핵심 행위자 포함** | 주어(누가)가 명확 | 주어 생략 ("새 AI 모델이 출시됐다") | Minor |

**key_points 품질:**

| 검사 항목 | 좋은 예 | 나쁜 예 | 심각도 |
|-----------|---------|---------|--------|
| **구체적 데이터** | "컨텍스트 윈도우 256K 토큰, GPT-4 대비 2배 확대" | "성능이 크게 향상됨" — 수치 없음 | Major |
| **one_line 비중복** | one_line에 없는 새로운 정보 | one_line의 같은 사실을 다른 말로 반복 | Major |
| **상호 비중복** | 각 포인트가 서로 다른 정보 | 같은 내용을 다른 표현으로 2번 서술 | Minor |
| **금지 패턴 미사용** | 고유명사·숫자·스펙 포함 | "관심을 받고 있음", "주목받고 있음", "전망" — 막연한 평가 | Major |
| **추출 우선순위 준수** | 숫자 데이터 > 기술 스펙 > 구체적 조건 | 추상적 평가·감상 위주 | Minor |

**why_important 품질:**

| 검사 항목 | 좋은 예 | 나쁜 예 | 심각도 |
|-----------|---------|---------|--------|
| **구체적 영향 대상** | "오픈소스 개발자들이 상용 수준 모델을 무료로 파인튜닝할 수 있게 돼요" | "업계에 큰 영향을 미칠 것으로 보여요" | Major |
| **one_line/key_points 비중복** | 새로운 관점(영향·결과)만 서술 | one_line이나 key_points 내용을 다시 언급 | Major |
| **빈 평가 미사용** | 구체적 변화 명시 | "주목할 만한 변화예요", "경쟁이 치열해질 것으로 보여요" | Major |

**background 품질:**

| 검사 항목 | 좋은 예 | 나쁜 예 | 심각도 |
|-----------|---------|---------|--------|
| **배경 맥락 제공** | "OpenAI는 지난해 GPT-4o를 출시하며 멀티모달 AI 경쟁을 이끌어왔다" | "AI 기술이 빠르게 발전하고 있다" — 너무 일반적 | Minor |
| **이전 사건 연결** | 관련 배경·역사 포함 | 현재 기사 내용을 반복 | Minor |

**기사 단위 콘텐츠 검증 절차:**
1. `요약 상세` 접기 섹션에서 **하이라이트 3개 + 카테고리 Top 2개** (총 5건)의 요약을 확인
2. 각 기사의 one_line → key_points → why_important → background 순으로 검토
3. 다음 유형의 이슈를 식별:

| 이슈 유형 | 정의 | 예시 |
|-----------|------|------|
| **내용 중복** | one_line↔key_points↔why_important 간 같은 정보 반복 | one_line "GPT-5 출시했다" + key_points "GPT-5가 출시됨" |
| **추상적 key_points** | 숫자·스펙 없이 막연한 서술 | "성능이 크게 개선됨", "주목받고 있음" |
| **빈 why_important** | 구체적 대상·변화 없이 평가만 | "업계에 큰 영향", "경쟁 치열" |
| **일반적 background** | 특정 사건·맥락 없이 범용 서술 | "AI 기술이 빠르게 발전 중이다" |
| **환각(Hallucination)** | 기사 제목에서 추론 가능한 범위를 넘어선 정보 | 기사 제목 "Meta, 새 모델 발표"에 대해 key_points에 구체적 파라미터 수를 포함 (확인 불가) |

**주의: 환각 판별 한계** — pipeline-qa는 로그만으로 환각을 완전히 감지할 수 없음 (원문 본문 미포함). 제목과 명백히 불일치하는 정보만 환각 의심으로 표기. 미묘한 환각은 앱에서 사용자 피드백으로 감지.

#### 1.10.4 EN/KO 페어리티 검사

| 검사 항목 | 정상 | 이상 징후 | 심각도 |
|-----------|------|-----------|--------|
| one_line_en 존재 | 모든 기사 | 누락 → EN 사용자 사건 요약 불가 | Major |
| key_points_en 존재 | 모든 기사 | 누락 → EN 세부정보 불가 | Major |
| why_important_en 존재 | 모든 기사 | 누락 → EN 영향 설명 불가 | Minor |
| background_en 존재 | 모든 기사 | 누락 → EN 배경 불가 | Minor |
| EN 내용이 KO와 일치 | 동일 사건·팩트 전달 | EN에 KO에 없는 내용 추가 또는 핵심 정보 누락 | Minor |

**주의**: EN 필드 누락은 Phase 3/4 번역 실패에 기인. `미번역 EN 기사 N개` 로그와 교차 확인. `[간이 번역 복구]` 로그가 있으면 기본 필드(제목+one_line)는 복구되었으나 key_points_en/why_important_en은 여전히 누락일 수 있음.

#### 1.10.5 요약 품질 종합 리포트 (★ 필수 출력)

QA 리포트에 반드시 다음 내용을 포함:

**1) 요약 통계 테이블:**

```
| 항목 | 전체 | 정상 | 이슈 | 심각도 |
|------|------|------|------|--------|
| one_line 보유 | {total} | {ok} | {miss} 누락 | Major/Pass |
| key_points 3개+ | {total} | {ok} | {short}건 0-1개 | Major/Pass |
| why_important 보유 | {total} | {ok} | {miss} 누락 | Minor/Pass |
| background 보유 | {total} | {ok} | {miss} 누락 | Minor/Pass |
| 말투 위반 | {total} | {ok} 정상 | {violations}건 위반 | Major/Pass |
```

**2) 말투 위반 상세 (위반 시만):**

```
| # | 기사 제목 | 필드 | 위반 내용 | 올바른 종결 |
|---|----------|------|----------|-----------|
| 1 | "OpenAI, GPT-5 출시" | one_line | "출시했어요" (경어체) | "출시했다" (서술체) |
| 2 | "Meta 대규모 감축" | key_points | "감축했다" (문장형) | "감축됨" (개조식) |
```

**3) 콘텐츠 품질 샘플 검증 (하이라이트 3건 + Top 2건):**

```
| # | 기사 제목 | one_line | key_points | why_important | 종합 |
|---|----------|----------|------------|---------------|------|
| 1 | "OpenAI, GPT-5..." | Pass — 사건 명확 | Pass — 수치 3개 포함 | Pass — 구체적 영향 | Pass |
| 2 | "Meta 감축설..." | Minor — 주어 생략 | Major — 추상적 평가만 | Pass — 구체적 | Major |
```

**판정 기준:**
- **Pass**: 말투 위반 0건 + 콘텐츠 이슈 0-1건 + key_points 부족(0-1개) 0-2건
- **Minor**: 말투 위반 1-3건 또는 콘텐츠 이슈 2-3건
- **Major**: 말투 위반 4건+ 또는 콘텐츠 이슈 4건+ 또는 key_points 부족 5건+
- **Critical**: one_line 누락 5건+ 또는 말투 규칙 전면 미준수 (10건+)

#### 1.10.6 요약 품질 수정 가이드

| 이슈 유형 | 원인 | 수정 |
|-----------|------|------|
| 말투 혼용 (서술체↔해요체↔개조식) | LLM이 필드별 종결어미 규칙 미준수 | 프롬프트 말투 규칙 테이블 강조 + 위반 예시 추가 (prompt-engineer) |
| key_points 추상적 (수치·스펙 없음) | LLM이 추출 우선순위 미준수 | 프롬프트 금지 패턴 강화 + 구체적 예시 추가 (prompt-engineer) |
| one_line에 의견·수식어 포함 | 팩트 전달 규칙 미준수 | 프롬프트 "팩트만 전달" 강조 + 금지 수식어 목록 (prompt-engineer) |
| why_important 빈 평가 | 구체적 영향 미명시 | 프롬프트 "누구에게 + 무엇이 + 어떻게" 필수화 (prompt-engineer) |
| one_line↔key_points 내용 중복 | 중복 금지 규칙 미준수 | 프롬프트 중복 검증 규칙 강화 (prompt-engineer) |
| EN 필드 누락 | Phase 3/4 번역 배치 실패 | news_team.py `_process_articles()` Phase 3/4 확인 (backend-pipeline-developer) |
| key_points 0-1개 다수 | 스크래핑 실패 또는 프롬프트 문제 | 스크래핑 실패율 확인 → 본문 충분한데 부족이면 프롬프트 조정 (prompt-engineer) |

**수정 대상 파일:** `scripts/agents/news_team.py`
- 요약 프롬프트: `_summarize_batch()` 내 전체 프롬프트 (one_line/key_points/why_important/background 지시문)
- 말투 규칙 테이블: `_summarize_batch()` 내 `=== 말투 규칙 총정리 ===` 섹션
- EN 필드 프롬프트: `en_fields_rule` 변수
- EN 번역 로직: `_process_articles()` Phase 3/4

**수정 시 에이전트 선택:**
| 이슈 유형 | 에이전트 | 수정 대상 |
|-----------|---------|-----------|
| 말투·톤 규칙 강화 | prompt-engineer | `_summarize_batch()` 말투 규칙 섹션 |
| key_points 추출 우선순위·금지 패턴 | prompt-engineer | `_summarize_batch()` key_points 지시문 |
| why_important 구체성 강화 | prompt-engineer | `_summarize_batch()` why_important 지시문 |
| one_line 팩트 전달 규칙 | prompt-engineer | `_summarize_batch()` one_line 지시문 |
| EN 번역/요약 실패 (Phase 3/4) | backend-pipeline-developer | `_process_articles()` |

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
| LangGraph 노드 실행 오류, 상태 전달 | backend-pipeline-developer | 그래프 구조/노드 로직 (news_team.py) |
| 스크래핑 실패, 소스 수집 문제 | backend-pipeline-developer | tools.py |
| 중복 임계값, stopwords, 토큰 추출 로직 | backend-pipeline-developer | news_team.py dedup 함수 |
| 학문스낵 curated 콘텐츠 품질 | prompt-engineer + ai-interdisciplinary-scholar | scripts/curated_principles/*.md |
| 학문스낵 curated 로드/시드 선택 로직 | backend-pipeline-developer | principle_team.py seed_selector/content_generator |
| 브리핑 프롬프트 품질 (톤, 구조, 커버리지) | prompt-engineer | generate_features.py 프롬프트 |
| 브리핑 입력 기사 선정, 실패/파싱 오류 | backend-pipeline-developer | generate_features.py 로직 |
| tags/glossary 누락률 높음, 용어 품질 | prompt-engineer | news_team.py 요약 프롬프트 |
| 요약 말투 혼용 (서술체↔해요체↔개조식) | prompt-engineer | news_team.py `_summarize_batch()` 말투 규칙 |
| 요약 콘텐츠 품질 (key_points 추상적, why_important 빈 평가, 내용 중복) | prompt-engineer | news_team.py `_summarize_batch()` 지시문 |
| 용어 축적 로직, 배치 저장 오류 | backend-pipeline-developer | generate_features.py |
| EN 번역 실패 (Phase 4 간이 번역 미복구) | backend-pipeline-developer | news_team.py `_process_articles()` Phase 4 |
| 제목 '...' 남용/미사용/부자연스러움 | prompt-engineer | news_team.py `_summarize_batch()` 내 `title_rule` |
| 제목 미번역, one_line 누락 | backend-pipeline-developer | news_team.py `_process_articles()` Phase 3/4 |

**수정 실행 순서:**
1. 이슈를 독립/의존으로 분류
   - **독립 이슈**: 서로 다른 파일 또는 서로 영향 없는 수정 → 에이전트 병렬 실행
     - 예: AI 필터 프롬프트 수정 + 중복 임계값 조정 → 병렬 가능
     - 예: 브리핑 프롬프트 수정 + 학문스낵 프롬프트 수정 → 병렬 가능
   - **의존 이슈**: 한 수정이 다른 수정의 전제 → 순차 실행
     - 예: 프롬프트 텍스트 변경 → ast.parse 검증 → 순차
     - 예: 분류 프롬프트 수정 → 의심 키워드 업데이트 → 순차
2. 모든 수정 후 반드시 `python -c "import ast; ast.parse(open('파일').read())"` 실행
3. 여러 파일 수정 시 각 파일별 ast.parse 검증

**수정 원칙:**
- 기존에 잘 작동하는 부분은 건드리지 않는다
- CLAUDE.md의 "Key Constants (DO NOT lower without reason)" 테이블 참조
- 프롬프트 변경은 최소한으로 (기존 분류/요약 정확도 유지)
- 임계값 변경은 ±0.05 단위로 보수적으로 (급격한 변경 금지)
- 수정 후 반드시 Python 문법 검증 (ast.parse)

**수정 시 참조해야 할 코드 위치** (함수/변수명으로 검색):
| 컴포넌트 | 파일 | 함수/변수 |
|----------|------|-----------|
| Phase 4 간이 번역 | news_team.py | `_process_articles()` — 미번역 EN 기사 간이 LLM 번역 (제목+one_line) |
| AI 필터 (EN/KO) | news_team.py | `_llm_ai_filter_batch()` — `is_ko` 분기로 EN/KO 프롬프트 분리 |
| AI 필터 소스 분기 | news_team.py | `_llm_filter_sources()` — Tier 3 + NEEDS_AI_FILTER 소스 필터링 |
| 분류 프롬프트 | news_team.py | `_CLASSIFY_PROMPT` |
| 분류 배치 | news_team.py | `_classify_batch()` |
| 의심 키워드 | news_team.py | `_SUSPECT_KEYWORDS` |
| 중복 임계값 | news_team.py | `DEDUP_THRESHOLD`, `EMBED_DEDUP_THRESHOLD` |
| 중복 stopwords | news_team.py | `_DEDUP_STOPWORDS` |
| 중복 L4/L5/L7 | news_team.py | `_deduplicate_candidates()` — L4 고유명사 가드, L5 names/nums_overlap, L7 overlap_ratio |
| 랭킹 프롬프트 | news_team.py | `_RANK_PROMPT` |
| 랭킹 로직 | news_team.py | `_rank_category()` — token_budget, ctx_len 분기 포함 |
| 브리핑 생성 | generate_features.py | `generate_daily_briefing()` — 프롬프트 + 입력 기사 선정 + 파싱 |
| 도메인 통계 | generate_features.py | `generate_daily_briefing()` 내 `DOMAIN_ALIASES` + `domain_stats` |
| 핫토픽 병합 | generate_features.py | `generate_daily_briefing()` 내 `hot_topics` / `merged` / `alias` |
| 학문스낵 시드 선택 | principle_team.py | `seed_selector()` — 30일 중복 회피 + 3일 분야 로테이션 |
| 학문스낵 curated 로드 | principle_team.py | `_load_curated_content()` — curated_principles/ 파일 로드 |
| 요약 프롬프트 (말투+콘텐츠 규칙) | news_team.py | `_summarize_batch()` — one_line/key_points/why_important/background 지시문 + 말투 규칙 테이블 |
| 학문스낵 생성 로직 | principle_team.py | `content_generator()` — curated 전용 (LLM 폴백은 비상 시만) |

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
| 4 | 랭킹 | Pass | 전체 순위 적절 (미스랭킹 0%) | 정상 |
| 5 | 브리핑 | Pass | 6개 스토리, KO 1200자, 하이라이트 반영 | 정상 |
| 6 | 용어/태그 | Pass | tags 98%, glossary 95%, 109개 축적 | 정상 |
| 7 | 학문스낵 | Pass | curated 로드 정상, 시드 로테이션 정상, Firestore 저장 완료 | 정상 |
| 8 | 제목 품질 | Pass | '...' 15% 사용, 부자연스러움 0건 | 정상 |
| 9 | 요약 품질 | Pass | 말투 위반 0건, key_points 부족 0건, 콘텐츠 이슈 없음 | 정상 |

### 기사 단위 판정
(AI 필터 오탐, 분류 오류, 랭킹 이상이 있을 때만 포함)

#### AI 필터 판정
| 기사 제목 | 소스 | 마킹 | 판정 | 근거 |
|-----------|------|------|------|------|
| "OpenAI releases GPT-6" | wired_ai | 비AI | 오탐 | AI 기업 신제품 출시 |
| "Best hiking trails 2026" | geeknews | 비AI | 정탐 | AI 무관 |

#### 분류 판정 (의심 건만)
| 기사 제목 | 현재 분류 | 정확한 분류 | 근거 |
|-----------|----------|------------|------|
| "GPT-6 출시" | industry_business | models_products | 신규 출시 |

#### 제목 품질 판정 ('...' 적절성)
| # | 제목 (KO) | '...' 사용 | 판정 | 근거 |
|---|----------|-----------|------|------|
| 1 | "OpenAI, 차세대 모델 힌트...출시 임박?" | ✓ | 적절 | 힌트/예고 → 궁금증 유발 |
| 2 | "Meta, Llama 4 오픈소스 공개" | ✗ | 적절 | 사실 전달 → '...' 불필요 |

**말줄임표 요약:** 사용 {n}건/{total}건 ({ratio}%), 부자연스러움 {n}건, 놓친 기회 {n}건

#### 요약 품질 판정

**요약 통계:**
| 항목 | 전체 | 정상 | 이슈 | 심각도 |
|------|------|------|------|--------|
| one_line 보유 | {total} | {ok} | {miss} 누락 | Pass |
| key_points 3개+ | {total} | {ok} | {short}건 0-1개 | Pass |
| why_important 보유 | {total} | {ok} | {miss} 누락 | Pass |
| 말투 위반 | {total} | {ok} | {n}건 위반 | Pass |

**말투 위반 상세:** (위반 시만)
| # | 기사 제목 | 필드 | 위반 내용 | 올바른 종결 |
|---|----------|------|----------|-----------|
(해당 시 기입)

**콘텐츠 품질 샘플 (하이라이트+Top 5건):**
| # | 기사 제목 | one_line | key_points | why_important | 종합 |
|---|----------|----------|------------|---------------|------|
(기사별 판정 기입)

#### 랭킹 판정 — 카테고리별 전체 순위

각 카테고리에 대해 전체 기사의 순위 테이블을 출력:

##### research ({n}개)
| 순위 | 점수 | 소스 | 기사 제목 | 판정 |
|------|------|------|----------|------|
| 1 | 100 | tnw | "DeepRare, 희귀 질환 진단 정확도 79%" | 적절 — A-tier 연구 |
| 2 | 96 | marktechpost | "Google AI, 베이즈 학습 기법" | 적절 — A-tier 연구 |
| ... | ... | ... | ... | ... |
| 18 | 30 | marktechpost | "Scanpy 튜토리얼" | 적절 — C-tier 가이드 |

##### models_products ({n}개)
(동일 형식)

##### industry_business ({n}개)
(동일 형식)

**미스랭킹 요약:**
| 카테고리 | 전체 | 과대 | 과소 | 미스랭킹률 | 판정 |
|----------|------|------|------|-----------|------|
| research | 18 | 1 | 0 | 5.6% | Pass |
| models_products | 25 | 2 | 1 | 12% | Minor |
| industry_business | 25 | 0 | 0 | 0% | Pass |

### 수정된 파일
- news_team.py:670 — AI 필터 KO 프롬프트에 INCLUDE 항목 추가
- news_team.py:1353 — 분류 프롬프트 예시 2건 추가

### 모니터링 포인트
- 다음 실행에서 Tier 1 필터율 20% 이하인지 확인
- industry_business 비율 60% 이하 유지 확인
```

## 주의사항

- 에이전트를 병렬로 실행할 수 있으면 병렬 실행 (예: QA 분석 + 프롬프트 검토)
- 수정이 불필요하면 "Pass — 수정 불필요"로 리포트만 제공
- 사용자가 로그 일부만 제공해도 분석 가능한 범위에서 수행
- AI 필터/분류/중복/랭킹/제목 품질/요약 품질/브리핑/용어·태그/학문스낵 9개 영역을 반드시 개별 평가하여 리포트에 포함
- 브리핑은 "오늘의 브리핑" 접기 섹션 로그가 있을 때 콘텐츠 품질 평가 (브리핑 생략/실패 시 구조 검사만)
- 학문스낵은 principle 파이프라인 로그가 있을 때 평가 (news-only 실행 시 생략 가능)
