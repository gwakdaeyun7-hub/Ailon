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
7. **EN 번역 실패**: `미번역 EN 기사 N개 감지` 로그 확인. Phase 4 간이 번역으로 복구되었는지 (`[간이 번역 복구]`), 잔존 여부 (`미번역 EN 기사 N개 잔존`) 확인. 잔존 시 해당 기사가 카테고리 Top 20에 영어 제목으로 포함됨 → Minor (제거되지 않고 영어 유지)

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

**수정 대상 파일:** `scripts/agents/news_team.py` — `_llm_ai_filter_batch()` 함수 (line ~702)
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
| industry_business 비율 | 40-65% | >65% → 분류기 편향 | Major |
| research 비율 | 10-30% | <5% → 분류기가 research 미인식 | Major |
| models_products 비율 | 10-30% | <5% → 출시 기사 누락 | Major |
| 미분류 기사 | 0-3개 | >5개 → 분류 프롬프트 문제 | Major |
| 의심 분류 건수 | 0-3건 | >5건 → 분류 정확도 저하 | Major |
| 분류 배치 실패 | 없음 | 배치 분할/개별 재시도 로그 | Minor |

**주의: research 카테고리 AI 필터 면제 제거됨**
- 모든 카테고리에 AI 필터 동일 적용 — NEEDS_AI_FILTER/Tier 3 소스의 비AI 마킹 기사는 research여도 제외됨
- research 기사가 예상보다 적으면 AI 필터 오탐(비AI 마킹된 research 기사) 가능성 확인

**기사 단위 분류 검증 (필수):**
- 각 카테고리 Top 5 기사 제목을 확인하여 해당 카테고리에 맞는지 판정
  - models_products Top 5: 실제 신규 출시/공개인지? 기존 제품 언급이면 오분류
  - research Top 5: 논문/벤치마크/알고리즘인지? 제품 출시면 오분류. 기업 기술/데이터 활용 사례나 개념 비교(X vs Y) 기사면 industry_business 오분류
  - industry_business Top 5: catch-all이므로 위 두 카테고리에 해당하지 않는지만 확인
- 의심 분류 건수가 5건 이상이면 `[QA] 의심 분류` 로그의 기사별 판정 수행

**분류 오류 유형별 수정:**
- **industry_business 편향**: `_CLASSIFY_PROMPT`에서 models_products/research 판단 기준 강화
  - "공개", "출시", "release", "launch" → models_products 강조
  - "논문", "paper", "benchmark" → research 강조
- **models_products 오분류**: 제품명만 있고 신규 출시가 아닌 기사가 models_products로 → `⚠ Product name in title ≠ models_products` 규칙 강화
- **research 오분류 (→industry_business)**: 기업 기술/데이터 활용 사례, 개념 비교/설명(explainer) 기사가 research로 → 프롬프트 NOT 규칙 + Examples로 경계 강화
- **경계 사례 Examples** (프롬프트에 이미 포함됨): "CiteAudit 논문"→research, "OpenClaw 팬 미팅"→industry_business, "GeForce NOW 15종 신규 게임"→industry_business, "포켓몬Go 데이터, 배달 로봇에 제공"→industry_business, "MCP와 스킬의 차이점은?"→industry_business

**수정 대상 파일:** `scripts/agents/news_team.py` — `_CLASSIFY_PROMPT` (line ~1387)
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

**수정 대상 파일:** `scripts/agents/news_team.py`
- `DEDUP_THRESHOLD` (line ~1074): 제목 유사도 임계값 (현재 0.65)
- `EMBED_DEDUP_THRESHOLD` (line ~1075): 임베딩 유사도 임계값 (현재 0.92)
- `_normalize_title()` (line ~1096): title=None 방어 포함
- `_DEDUP_STOPWORDS` (line ~1108): 변별력 없는 토큰 set
- `_extract_key_tokens()` (line ~1111): text=None 방어 포함
- `_extract_product_versions()` (line ~1153): title=None 방어 포함
- L4 고유명사 가드: one_line≥0.65 + 양쪽 제목에 고유명사(영어)가 있으면 1개+ 공유 필수 (line ~1261)
- L5 조건: `names_overlap >= 3 and nums_overlap >= 1` (line ~1282)
- L7 `overlap_ratio >= 0.30` (line ~1309)

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

**전체 기사 순위 검증 절차:**
1. 각 카테고리별 **전체 기사 목록**을 순위순으로 나열
2. 기사 제목을 하나씩 읽고, 해당 순위가 납득 가능한지 판단
3. 다음 유형의 미스랭킹을 식별:

| 미스랭킹 유형 | 정의 | 예시 | 심각도 |
|--------------|------|------|--------|
| **과대 랭킹** | 니치/마이너 뉴스가 상위 20%에 위치 | 튜토리얼 기사가 research Top 3, MWC 부스 소개가 models_products Top 5 | Major |
| **과소 랭킹** | 대형 뉴스가 하위 50%에 위치 | 주요 모델 출시가 models_products 15위, 대규모 투자가 industry_business 20위 | Major |
| **카테고리 오배치** | 기사가 잘못된 카테고리에 있어서 해당 카테고리 내 순위가 왜곡됨 | 연구 논문이 industry_business에 들어가서 industry_business 랭킹에 노이즈 추가 | Major |
| **비당일 과대평가** | 며칠 전 기사가 당일 중요 기사보다 높은 순위 | 3일 전 뉴스가 오늘 대형 뉴스보다 상위 (하이라이트에는 영향 없지만 카테고리 피드에 영향) | Minor |

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
- `_RANK_PROMPT` (line ~1419): 랭킹 기준 프롬프트
- `_rank_category()` (line ~1442): token_budget, ctx_len 임계값
- 컨텍스트 축소 기준: line ~1456+
- token_budget: line ~1479

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

### 1.6 학문스낵(Principle) 콘텐츠 품질 검사 (★ 심층 분석)

로그 패턴:
- `[seed_selector] 전체 시드 풀: {n}개`
- `[seed_selector] 최근 30일 사용 시드: {n}개`
- `[seed_selector] ⚠ TEMP: Simulated Annealing 고정 모드` — 프롬프트 튜닝 중 시드 고정 (정상)
- `[retry_reseed] ⚠ TEMP: Simulated Annealing 고정 유지` — 재시도 시에도 시드 유지 (정상)
- `[content_generator] 생성 완료`
- `[verifier] 검증 결과 — verified={bool}, confidence={float}, insightClarity={float}, deepDiveDepth={float}`
- `RANKER 폴백` / `재시도 {n}/3` — 검증 실패 후 재생성
- `[assembler] Firestore 저장 완료: daily_principles/{date}`

#### 1.6.1 구조 완성도 검사

| 검사 항목 | 정상 | 이상 징후 | 심각도 |
|-----------|------|-----------|--------|
| 검증 통과 | verified=true, confidence≥0.7 | verified=false 또는 confidence<0.7 → 재시도 | Major |
| sub-score 재시도 | 모든 sub-score ≥0.5 | principleAccuracy/mappingAccuracy/insightClarity/deepDiveDepth 중 <0.5 → 재시도 | Major |
| 재시도 횟수 | 0-1회 | 3회 연속 실패 → 최선 시도 사용 | Critical |
| 필수 필드 누락 | 전체 존재 | foundation/application/integration/deepDive 중 누락 → `content=None` 반환 → retry_reseed | Critical |
| 문자 수 범위 | 각 필드별 기준 내 | headline >20자, body >120자, analogy >50자 등 초과 | Minor |
| _en 필드 존재 | 모든 KO 필드에 EN 쌍 | _en 필드 누락 → 바이링구얼 표시 불가 | Major |
| 방어 로직 작동 | 에러 없이 완료 | `content_generator: 필수 키 누락` 로그 → content=None 반환 → verifier가 fail → retry_reseed 정상 작동 확인 | Major |
| verifier 파싱 방어 | 에러 없이 완료 | `verifier JSON 파싱 3회 연속 실패` 로그 → 기본 fail 결과 사용 → retry_reseed 경로 확인 | Major |
| verifier 빈 응답 방어 | 에러 없이 완료 | `verifier: 모든 시도에서 빈 응답` 로그 → 기본 fail 결과 사용 → retry_reseed 경로 확인 | Major |
| Phase 1 즉시 파싱 | Phase 1 후 json.loads 성공 | Phase 1 후 json.loads 실패 → Phase 2 진입 → 문자열 내 *** 오염 가능 | Major |
| Phase 2 스킵 | Phase 1 적용 시 Phase 2 미실행 | Phase 1 적용 후에도 Phase 2가 실행되면 → `phase1_applied` 플래그 버그 | Critical |
| `_fix_unescaped_quotes` 복구 | Phase 1 후 파싱 실패 시 이스케이프 안 된 따옴표 자동 수정 (최대 20회) | 반복 수정 20회 초과 후에도 파싱 실패 → JSON 구조 자체가 심각하게 깨진 상태 | Major |
| regex 폴백 작동 | 에러 없이 완료 | `JSON 파싱 실패 → regex 폴백으로 필드 추출 성공` 로그 → 정상 작동 확인 (issues 배열도 추출됨). 단, 반복 발생 시 근본 원인 조사 필요 | Minor |
| formula 필수 검사 (should_retry) | math/phys/ee/stat/info/opt 분야에서 formula 존재 | `formula 누락 ({discipline}), 재시도` 로그 → should_retry가 formula 부재 감지하여 재시도 강제 (최대 3회) | Major |

**방어 로직 정상 작동 확인 기준:**
- `content_generator: 필수 키 누락` 로그 후 → `[retry_reseed] 시드 교체` 로그가 이어지면 정상
- `verifier JSON 파싱 3회 연속 실패` 또는 `verifier: 모든 시도에서 빈 응답` 로그 후 → `[retry_reseed]` 로그가 이어지면 정상
- 위 로그가 있는데 retry_reseed 없이 assembler로 진행되면 → 조건 분기 버그
- `_fix_unescaped_quotes` 로그가 나오면 → Phase 1 `***` strip 후 따옴표 이스케이프 복구 시도 중. json.loads 에러 위치(colno)를 사용하여 반복 수정 (최대 20회). 성공하면 정상, 20회 초과 실패 시 다음 폴백으로 진행
- Phase 1 적용(`phase1_applied=True`) 후 Phase 2 관련 로그(`***` → `{`/`}` 치환)가 나오면 → `phase1_applied` 플래그 버그 (Critical)
- `JSON 파싱 실패 → regex 폴백으로 필드 추출 성공` 로그 → `_regex_extract_verification()`이 verified, confidence, principleAccuracy, insightClarity, deepDiveDepth, factCheck, issues 필드를 regex로 직접 추출하여 정상 검증 결과 생성 (issues 배열도 보존됨). retry_reseed 경로 대신 정상 결과 사용 → 정상 작동 (단, 반복 발생 시 Gemini 응답 형식 변화 조사 필요)
- `formula 누락 ({discipline}), 재시도` 로그 → should_retry가 검증 통과 후에도 formula 부재를 감지하여 재시도 강제. math/phys/ee/stat/info/opt 접두사 분야에서만 발동. 3회 재시도 후에도 formula 없으면 현재 콘텐츠로 진행

#### 1.6.2 인사이트 이해도 검사 (★ 핵심)

**목적**: 사용자가 "이 원리가 뭐고, 왜 중요하고, AI에 어떻게 쓰이는지" 이해할 수 있는지 평가

| 검사 항목 | 좋은 예 | 나쁜 예 | 심각도 |
|-----------|---------|---------|--------|
| **원리 설명+메커니즘** (foundation.body) | "금속에 열을 가하면 원자가 활발히 움직여 재배치되고, 서서히 냉각하면 낮은 에너지 상태에 안착해 결함 적은 결정 구조가 된다" — 원래 학문의 물리적/수학적 메커니즘 + 근본 질문 | "복잡한 문제에서 눈앞의 해에 갇히곤 한다. 뜨거울 땐 나쁜 길도 가보고 식어가며 신중해진다" — 최적화 관점만, 원래 학문의 실체 없음 | Major |
| **비유 메커니즘** (foundation.analogy) | "편지에 같은 내용을 두 번 적어 한 줄이 지워져도 복구하는 것" — 핵심 메커니즘(여분 정보로 오류 복구)을 비유 | "두 번 말해서 확인하는 것" — 결과만 비유, 어떻게 복구하는지 메커니즘 없음 | Major |
| **문제 구체성** (application.problem) | "자율주행차가 안개 속에서 센서 데이터 50%가 왜곡될 때 판단 불가" — 구체적 시나리오+수치 | "노이즈에 취약하다" — 무슨 상황에서, 얼마나 취약한지 불명확 | Major |
| **problem→solution 연결** (application.body) | "problem에서 50% 왜곡이라 했고 → 이 원리의 '여분 인코딩' 특성이 → 왜곡된 비트를 복구" — 논리적 연결 | "이 원리를 적용하면 문제가 해결된다" — problem과의 연결 없이 결론만 | Major |
| **메커니즘 명확성** (application.mechanism) | "기울기를 따라 조금씩 내려가며 최적값을 찾는다" — 작동 원리가 선명 | "알고리즘이 문제를 해결한다" — 어떻게 해결하는지 불명확 | Major |
| **영향 구체성** (integration.impact) | "ChatGPT의 답변 품질을 30% 향상시킨 핵심 기법" — 구체적 수치/사례 | "혁신적으로 향상시켰다" / "AI 발전에 기여했다" — 추상적 | Major |

#### 1.6.3 딥다이브 전문성/깊이 검사 (★ 핵심)

**목적**: 딥다이브 탭이 학술적 전문성과 깊이를 보여주는지 평가 — "이 분야의 역사, 핵심 수학, 한계까지 깊이 있게 다뤘구나"

| 검사 항목 | 좋은 예 | 나쁜 예 | 심각도 |
|-----------|---------|---------|--------|
| **원래 문제** (originalProblem) | "1948년 Shannon의 'A Mathematical Theory of Communication'에서 채널 용량 한계를 증명..." — 논문명+인물+시기+구체적 문제 | "옛날에 연구자들이 문제를 발견했다" — 누가, 언제, 무엇을 불명확 | Major |
| **영감의 다리** (bridge) | "에너지→목적함수, 물리온도→탐색온도T, 원자배치→해공간상태. Boltzmann분포 보존 / 결정격자·원자간 상호작용 생략" — 명시적 매핑(X→Y) 최소 3쌍 + 보존/변형 구분 | "이 원리에서 영감을 받아 AI에 적용했다" — 매핑 없이 추상적 서술만 → deepDiveDepth ≤ 0.5 | Critical |
| **bridge 로그 출력** | bridge 내용이 로그에서 확인 가능 (70자 이상 출력) | 로그에서 bridge가 잘려서 내용 확인 불가 → content_generator 로그 확인 필요 | Minor |
| **핵심 직관** (coreIntuition) | "ΔE≤0이면 무조건 수용, ΔE>0일 때 exp(-ΔE/T)로 확률 판단. T↑→수용확률↑→광역탐색, T↓→수렴. T0↑, cooling_rate→1이면 수렴 확률↑" — 완전한 작동 규칙 (4요소: ①변수 의미 ②조건 분기 ③파라미터 감수성 ④수렴 조건) | "높은 산에서 공을 굴리면 골짜기를 찾는다" — 일상 비유 수준 → deepDiveDepth ≤ 0.4 | Major |
| **수식** (formula) | discipline이 수학/물리/정보이론/통계/공학이면 LaTeX 수식 포함 | 수학적 원리인데 formula가 빈 문자열 → 조건부 필수 위반 | Major |
| **AI-specific 한계** (limits) | "distribution shift 환경에서 학습된 통계적 가정이 무너지며, adversarial attack에 취약하다" — AI 적용 시 구체적 한계 | "아직 갈 길이 멀다" / "더 많은 연구가 필요하다" — 추상적 회피, AI-specific 아님 | Major |

**formula 조건부 검사 기준:**
- discipline_key의 접두사가 `math`, `phys`, `info`, `stat`, `ee`, `opt` 중 하나이면 formula 필수
- **should_retry에서 formula 부재 시 재시도를 강제함** (verifier 통과 후에도 formula 없으면 retry, 최대 3회). 3회 재시도 모두 formula 미생성 시 현재 콘텐츠로 진행
- 위 접두사가 아닌 경우(bio, neuro, psych, ling, soc 등) formula 빈 문자열 허용
- formula가 있으면 해당 원리와 직결되는 수식인지 확인 (관련 없는 수식이면 오히려 감점)

#### 1.6.4 메타데이터 적절성 검사

| 검사 항목 | 정상 | 이상 징후 | 심각도 |
|-----------|------|-----------|--------|
| connectionType 정확성 | direct_inspiration: 실제 역사적 채택 | structural_analogy인데 direct_inspiration으로 표기 → 과장 | Major |
| difficulty 적절성 | beginner: 일상 비유 중심 | beginner인데 수식/전문용어 과다 → 사용자 이탈 | Minor |
| keywords 관련성 | 원리+AI 양쪽 키워드 | 관련 없는 키워드, 또는 너무 일반적("AI", "기술") | Minor |
| 시드 다양성 | 최근 3일 분야 중복 없음 | 같은 분야 연속 → seed_selector 로직 확인 (TEMP 고정 모드 중이면 정상) | Minor |

#### 1.6.5 학문스낵 품질 종합 판정

로그 + Firestore 데이터를 바탕으로 다음 기준으로 종합 판정:

- **Good**: 검증 통과(confidence≥0.8), 인사이트 이해도 양호(insightClarity≥0.8), 딥다이브 전문성 양호(deepDiveDepth≥0.8), coreIntuition이 수학적/알고리즘적 수준, 수학적 원리이면 formula 존재
- **Acceptable**: 검증 통과(0.7≤confidence<0.8), 대부분 필드 양호, 1-2개 추상적 표현, coreIntuition이 약간 일상 비유 수준
- **Poor**: 검증 통과했으나 핵심 필드(problem, bridge, limits)가 추상적, 또는 수학적 원리인데 formula가 빈 문자열 → 프롬프트 수정 필요
- **Failed**: 검증 미통과 3회 → 시드 풀 또는 생성 프롬프트 문제

**인사이트 이해도 체크리스트** (분석 시 각 항목 예/아니오 판정):
1. [ ] foundation.body가 **원래 학문의 물리적/수학적 메커니즘**(구체적 물리량·변수·현상)을 포함하는가? AI 관점만 서술하면 불합격
2. [ ] analogy가 핵심 메커니즘(과정)을 비유하는가? (결과만 비유하면 불합격)
3. [ ] application.problem이 구체적 시나리오/수치를 포함하여 "왜 어려웠는지" 전달하는가?
4. [ ] application.body가 problem의 난제를 원리의 **어떤 특성**으로 해결하는지 논리적으로 연결하는가?
5. [ ] integration.impact가 구체적 수치나 사례를 포함하는가?
6. [ ] 전체 3-step을 읽었을 때 "근본 질문→AI 재등장→현실 임팩트"의 내러티브가 자연스러운가?

**딥다이브 전문성 체크리스트** (분석 시 각 항목 예/아니오 판정):
7. [ ] originalProblem에 핵심 논문/저서명이 1개 이상 포함되어 있는가?
8. [ ] bridge에서 **명시적 매핑(X→Y) 최소 3쌍** + 보존/변형 구분이 있는가? 매핑 없이 추상적 서술만이면 불합격 (deepDiveDepth ≤ 0.5)
9. [ ] coreIntuition이 **완전한 작동 규칙** (①변수 의미 ②조건별 분기 ③파라미터 감수성 ④수렴 조건)을 포함하는가? 4가지 중 2개 이하면 불합격 (deepDiveDepth ≤ 0.5). 일상 비유 수준이면 deepDiveDepth ≤ 0.4
10. [ ] 수학/물리/정보이론/통계 원리인 경우 formula가 존재하는가?
11. [ ] limits가 AI-specific 한계를 다루는가? (distribution shift, adversarial robustness, non-convexity 등)

**수정 대상 파일:** `scripts/agents/principle_team.py`
- `_fix_unescaped_quotes()` (line ~74): json.loads 에러 위치(colno)를 사용하여 이스케이프 안 된 따옴표를 반복 수정 (최대 20회)
- `_safe_json_parse()` (line ~102+): Phase 1 `***` strip + 즉시 json.loads + `_fix_unescaped_quotes` 폴백, `phase1_applied` 플래그로 Phase 2 스킵 제어
- `_CONTENT_PROMPT` (line ~390): 생성 프롬프트 — 설명 구체성 강화
- `_CONTENT_PROMPT` 내 deepDive 스키마 (line ~445+): bridge/limits 구체성 강화
- `content_generator()` (line ~499): 생성 로직 — 필수 키 누락 시 `content=None` 반환 → retry_reseed
- `_VERIFY_PROMPT` (line ~589): 검증 프롬프트 — 이해도 검증 항목 추가
- `verifier()` (line ~681): 검증 로직 + confidence 임계값 — content_json[:4000] 입력, 최대 3회 파싱 시도, 빈 응답 감지, 전체 실패 시 기본 fail(verified=False, confidence=0.0) 반환
- `_regex_extract_verification()` (line ~642): verifier JSON 파싱 완전 실패 시 regex 폴백 — verified, confidence, principleAccuracy, insightClarity, deepDiveDepth, factCheck 필드를 정규식으로 직접 추출
- verifier 내 regex 폴백 호출 (line ~719): `_regex_extract_verification()` 호출하여 retry_reseed 대신 정상 검증 결과 사용

**수정 시 에이전트 선택:**
| 이슈 유형 | 에이전트 | 수정 대상 |
|-----------|---------|-----------|
| 설명이 추상적/모호함 | prompt-engineer | _CONTENT_PROMPT 구체성 강화 |
| 검증이 추상적 표현을 통과시킴 | prompt-engineer | _VERIFY_PROMPT에 이해도 체크 추가 |
| bridge 보존/변형 미구분 | prompt-engineer | _CONTENT_PROMPT 내 deepDive 스키마 강화 (line ~445+) |
| confidence 임계값 조정 | backend-pipeline-developer | verifier() 임계값/로직 |
| 시드 다양성 부족 | backend-pipeline-developer | seed_selector() 로직 |

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

**수정 대상 파일:** `scripts/generate_features.py` — 핫토픽 병합 로직 (line ~307-324)

#### 1.7.4 하이라이트 반영 검사

- 로그의 하이라이트 3개 기사가 브리핑에 언급되었는지 확인
- 하이라이트 기사가 브리핑에서 누락된 경우 → Major
- 카테고리 Top 1 기사(research/models_products/industry_business)가 최소 1개 이상 반영되었는지 확인

**수정 대상 파일:** `scripts/generate_features.py`
- `generate_daily_briefing()` (line ~183): 브리핑 생성 함수
- 브리핑 프롬프트 (line ~214-224): 프롬프트 텍스트
- 입력 기사 선정 로직 (line ~189-202): 하이라이트 + 카테고리 Top 기사 조합

**수정 시 에이전트 선택:**
| 이슈 유형 | 에이전트 | 수정 대상 |
|-----------|---------|-----------|
| 브리핑 프롬프트 품질 (톤, 구조, 커버리지) | prompt-engineer | generate_features.py 프롬프트 |
| 브리핑 길이/story_count 조정 | prompt-engineer | 프롬프트의 지시문 수정 |
| 입력 기사 선정 로직 | backend-pipeline-developer | generate_features.py 로직 |
| 브리핑 생성 실패/파싱 오류 | backend-pipeline-developer | generate_features.py 에러 핸들링 |
| 핫토픽 병합 오류/부적절한 병합 | backend-pipeline-developer | generate_features.py 핫토픽 병합 로직 (line ~267-284) |

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
| 컴포넌트 | 파일 | 함수/변수 | 라인 |
|----------|------|-----------|------|
| 요약 프롬프트 (tags/glossary 생성) | news_team.py | 요약 프롬프트 내 tags/glossary 지시문 | ~439+ |
| tags/glossary 파싱 | news_team.py | `_apply_batch_results()` | ~509+ |
| 용어 축적 | generate_features.py | `accumulate_glossary()` | ~397-479 |
| HighlightedText 불용어 | mobile/components/shared/HighlightedText.tsx | `COMMON_TERMS` | 상단 |

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
| 말줄임표 사용률 | 전체의 10-30% | >50% → 남용 (뉴스 신뢰도 저하), 0% → 프롬프트 미작동 | Major |
| 부자연스러운 말줄임표 | 0건 | 단순 사실 전달 제목에 '...' 부착 | Major |
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

1. **적절한 경우 (여운·궁금증·암시가 제목에 내재):**
   - 힌트/예고/루머 기사: "~힌트...", "~예고...", "~유출..."
   - 미래 방향 질문: "~어디까지...", "~가능할까...", "~바꿀까..."
   - 반전/충격: "~알고 보니...", "~사실은...", "~했는데..."
   - 불확실성/논쟁: "~규제인가 혁신인가...", "~과연...", "~글쎄..."
   - 열거/나열 암시: "~그리고 더...", "~뿐만 아니라..."

2. **부자연스러운 경우 (사실 전달에 '...' 강제 부착):**
   - 명확한 사실 발표: "~공개...", "~출시...", "~발표..." (공개/출시/발표 자체가 확정 사실이면 '...' 불필요)
   - 숫자/결과 보고: "~50% 향상...", "~매출 증가...", "~벤치마크 1위..."
   - 인물/기업 동향: "~사임...", "~합류...", "~인수..."
   - 제목이 이미 완결된 문장: 주어+서술어가 완성되어 여운의 여지 없음

3. **경계 사례 (맥락에 따라 판단):**
   - "OpenAI, 새 모델 출시..." → 부자연스러움 (확정 사실). 단, "OpenAI, 새 모델 출시...하지만 논란도" → 적절 (반전 암시)
   - "Google CEO의 깜짝 발표..." → 적절 (발표 내용 궁금증). 단, "Google CEO, AI 전략 발표..." → 부자연스러움
   - 기사 내용을 모르면 제목 자체만으로 판단 — 제목이 독자의 궁금증을 유발하는지가 핵심

**`[일반 KO]` 목록에서 놓친 기회 확인:**

다음 유형의 제목이 '...' 없이 끝나면 놓친 기회로 판정:
- 힌트/루머/예고 기사인데 평서문으로 끝남: "OpenAI, 새 모델 힌트" → "OpenAI, 새 모델 힌트..." 가 더 자연스러움
- 미래 전망/불확실성 기사: "AI 규제의 향방은" → "AI 규제의 향방은..." 가 더 여운 있음
- 열린 결말 구조인데 마침표/종결어미로 닫힘: "~될 수 있다" → "~될 수 있을까..."

**주의: 대부분의 뉴스 제목은 '...' 없이 끝나는 것이 정상.** 팩트 전달이 핵심인 뉴스 헤드라인에서 '...'는 소수 기사에만 어울림. "놓친 기회"가 0건이어도 정상.

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
- **Pass**: 부자연스러움 0건 + 놓친 기회 0-1건
- **Minor**: 부자연스러움 1-2건 또는 놓친 기회 3건+
- **Major**: 부자연스러움 3건+ 또는 사용률 >50%

#### 1.9.3 제목 품질 수정 가이드

| 이슈 유형 | 원인 | 수정 |
|-----------|------|------|
| '...' 남용 (>50% 사용률) | 프롬프트에서 "~좋음" 표현이 "~해라"로 해석됨 | 프롬프트에 "대부분의 제목은 '...' 없이 끝내되, 10-30%만 선택적으로 사용" 명시 (prompt-engineer) |
| 부자연스러운 '...' 반복 패턴 | LLM이 모든 제목에 기계적으로 '...' 부착 | 프롬프트에 부자연스러운 예시 추가: "나쁜 예: 'Apple, M5 칩 공개...' (확정 사실에 불필요)" (prompt-engineer) |
| '...' 전혀 미사용 (0%) | LLM이 '...' 지시를 무시 | 프롬프트에서 '...' 예시를 더 눈에 띄게 배치 + "반드시 1-2개 이상 사용" 추가 (prompt-engineer) |
| 미번역 제목 | Phase 3/4 번역 실패 | news_team.py 번역 retry 로직 확인 (backend-pipeline-developer) |
| one_line 누락 | 요약 프롬프트 미준수 | 요약 프롬프트에서 one_line 필수 강조 (prompt-engineer) |

**수정 대상 파일:** `scripts/agents/news_team.py`
- 번역+요약 프롬프트: `_summarize_batch()` 내 `title_rule` (line ~356-366)
- EN 제목 프롬프트: `en_fields_rule` 내 `display_title_en` (line ~369)
- KO 제목 프롬프트 (EN→KO 번역): `title_rule` (line ~356)

**수정 시 에이전트 선택:**
| 이슈 유형 | 에이전트 | 수정 대상 |
|-----------|---------|-----------|
| '...' 사용 프롬프트 조정 (남용/미사용/부자연스러움) | prompt-engineer | `_summarize_batch()` 내 title_rule |
| 미번역/one_line 누락 (로직 문제) | backend-pipeline-developer | `_process_articles()` Phase 3/4 |

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
| tags/glossary 누락률 높음, 용어 품질 | prompt-engineer | news_team.py 요약 프롬프트 |
| 용어 축적 로직, 배치 저장 오류 | backend-pipeline-developer | generate_features.py |
| EN 번역 실패 (Phase 4 간이 번역 미복구) | backend-pipeline-developer | news_team.py `_process_articles()` Phase 4 로직 (line ~661) |
| 제목 '...' 남용/미사용/부자연스러움 | prompt-engineer | news_team.py `_summarize_batch()` 내 title_rule (line ~356) |
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

**수정 시 참조해야 할 코드 위치:**
| 컴포넌트 | 파일 | 함수/변수 | 라인 |
|----------|------|-----------|------|
| Phase 4 간이 번역 | news_team.py | `_process_articles()` — 미번역 EN 기사 간이 LLM 번역 (제목+one_line) | ~661+ |
| AI 필터 (EN) | news_team.py | `_llm_ai_filter_batch()` EN 프롬프트 | ~778+ |
| AI 필터 (KO) | news_team.py | `_llm_ai_filter_batch()` KO 프롬프트 | ~713+ |
| AI 필터 소스 분기 | news_team.py | `_llm_filter_sources()` — Tier 3 + NEEDS_AI_FILTER 소스 필터링 | ~825+ |
| 분류 프롬프트 | news_team.py | `_CLASSIFY_PROMPT` | ~1387+ |
| 분류 배치 | news_team.py | `_classify_batch()` | ~1548 |
| 의심 키워드 | news_team.py | `_SUSPECT_KEYWORDS` | ~1755+ |
| 중복 임계값 | news_team.py | `DEDUP_THRESHOLD`, `EMBED_DEDUP_THRESHOLD` | ~1074-1075 |
| 중복 stopwords | news_team.py | `_DEDUP_STOPWORDS` | ~1108 |
| 중복 L4 가드 | news_team.py | `_deduplicate_candidates()` L4 고유명사 가드 | ~1261+ |
| 중복 L5 조건 | news_team.py | `_deduplicate_candidates()` L5 | ~1282 |
| 중복 L7 조건 | news_team.py | `_deduplicate_candidates()` L7 | ~1309 |
| 랭킹 프롬프트 | news_team.py | `_RANK_PROMPT` | ~1419+ |
| 랭킹 로직 | news_team.py | `_rank_category()` | ~1442+ |
| 랭킹 token_budget | news_team.py | `_rank_category()` 내 | ~1479 |
| 컨텍스트 축소 | news_team.py | `_rank_category()` 내 ctx_len | ~1456+ |
| 브리핑 생성 함수 | generate_features.py | `generate_daily_briefing()` | ~184 |
| 브리핑 프롬프트 | generate_features.py | prompt in `generate_daily_briefing()` | ~215-225 |
| 브리핑 입력 기사 선정 | generate_features.py | highlights + cat_articles 조합 | ~190-203 |
| 도메인 통계 | generate_features.py | DOMAIN_ALIASES + domain_stats 계산 | ~255-293 |
| 학문스낵 생성 프롬프트 | principle_team.py | `_CONTENT_PROMPT` | ~390+ |
| 학문스낵 Deep Dive 섹션 | principle_team.py | `_CONTENT_PROMPT` 내 인라인 JSON 스키마 | ~445+ |
| 학문스낵 검증 프롬프트 | principle_team.py | `_VERIFY_PROMPT` | ~589 |
| 학문스낵 생성 로직 | principle_team.py | `content_generator()` | ~499 |
| 학문스낵 검증 로직 | principle_team.py | `verifier()` | ~681 |
| 학문스낵 따옴표 복구 | principle_team.py | `_fix_unescaped_quotes()` | ~74 |
| 학문스낵 JSON 파싱 | principle_team.py | `_safe_json_parse()` (Phase 1 즉시 파싱 + phase1_applied 플래그 + Phase 2 폴백) | ~102+ |
| 학문스낵 regex 폴백 | principle_team.py | `_regex_extract_verification()` | ~642 |
| 학문스낵 verifier regex 호출 | principle_team.py | verifier 내 `_regex_extract_verification()` 호출 | ~719 |

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
| 7 | 학문스낵 | Pass | confidence 0.85, 설명 구체적 | 정상 |
| 8 | 제목 품질 | Pass | '...' 15% 사용, 부자연스러움 0건 | 정상 |

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
- AI 필터/분류/중복/랭킹/제목 품질/브리핑/용어·태그/학문스낵 8개 영역을 반드시 개별 평가하여 리포트에 포함
- 브리핑은 "오늘의 브리핑" 접기 섹션 로그가 있을 때 콘텐츠 품질 평가 (브리핑 생략/실패 시 구조 검사만)
- 학문스낵은 principle 파이프라인 로그가 있을 때 평가 (news-only 실행 시 생략 가능)
