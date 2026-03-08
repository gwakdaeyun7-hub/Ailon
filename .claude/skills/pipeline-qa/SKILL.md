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
- AI 필터/분류/중복/랭킹 4개 영역을 반드시 개별 평가하여 리포트에 포함
