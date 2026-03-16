# scripts/CLAUDE.md — Pipeline & Backend

이 파일은 scripts/ 디렉토리(Python 백엔드, LangGraph 파이프라인) 작업 시 참조하는 컨텍스트입니다.

---

## Pipeline Architecture

### News Pipeline (scripts/agents/news_team.py)

LangGraph 8-node pipeline with parallel EN/KO branches:

`collector → [en_process, ko_process] (parallel Send) → categorizer → ranker → entity_extractor → selector → assembler`

| Node | Function | Key Config |
|------|----------|------------|
| collector | 22 RSS sources + scraping + LLM AI filter + date recovery | trafilatura + Chrome UA, 6 RSS workers + 10 scrape workers + 4 AI filter workers. RSS 날짜 미추출 시 `date_estimated=True` 마킹 → 스크래핑에서 meta 태그(article:published_time 등), `<time>`, JSON-LD, trafilatura bare_extraction으로 날짜 복원 |
| en_process | EN→KO translation + summarization | batch=5, max_tokens=12288, 5 parallel workers, 4-phase retry (batch→individual→fallback→간이번역) |
| ko_process | KO summarization | batch=2, max_tokens=12288, 5 parallel workers, 3-phase retry |
| categorizer | LLM 3-category classification + 7-layer dedup | batch=5, 3 parallel workers |
| ranker | Per-category LLM ranking → score (1st=100, last=30) | token_budget=max(6144, count*150), 3 parallel workers (per-category) |
| entity_extractor | Entity extraction + topic clustering | batch=5, up to 4 parallel workers, 3-tier retry (batch→sub-batch→individual) |
| selector | Highlight Top 3 + Category Top 20 | today articles only for highlights |
| assembler | Final structure + timing report | Korean sources in separate sections |

### News Sources (22 total, 3 tiers)

**Tier 1 (12 EN sources)** — HIGHLIGHT_SOURCES + CATEGORY_SOURCES, 하이라이트 후보 + 카테고리 분류, Tom's Hardware만 AI 필터 적용 (범용 RSS 피드):
Wired AI, TechCrunch AI, The Verge AI, MIT Tech Review, VentureBeat, MarkTechPost, The Decoder, AI Business, SiliconANGLE, The Next Web, TechXplore AI, Tom's Hardware

**Tier 2 (6 EN sources)** — CATEGORY_SOURCES only (하이라이트 제외), AI 필터 없음:
Google DeepMind, NVIDIA, Hugging Face, Ars Technica AI, The Rundown AI, IEEE Spectrum AI

**Tier 3 (4 KO sources)** — SOURCE_SECTION_SOURCES, separate sections, AI 필터 "의심 시 제거" (AI + 개발/IT 기술 기사도 포함):
AI타임스, GeekNews, ZDNet AI 에디터 (HTML scrape), 요즘IT AI

### Key Constants (DO NOT lower without reason)

| Constant | Value | Why |
|----------|-------|-----|
| Ranker token_budget | `max(6144, count*150)` | 이전 `count*120`에서 107건 industry_business JSON 잘림 발생 → `count*150`으로 상향 |
| Ranker ctx thresholds | >40: title only, 25-40: 150자, ≤25: 500자 | 대규모 카테고리 랭킹 정확도 |
| HIGHLIGHT_COUNT | 3 | 카테고리당 1개씩 |
| CATEGORY_TOP_N | 20 | 카테고리별 최대 기사 수 |
| MAX_ARTICLE_AGE_DAYS | 5 | 표시 범위 |
| CLASSIFY_BATCH_SIZE | 5 | LLM 안정성 |
| EN batch size | 5 | 번역+요약 |
| KO batch size | 2 | 한국어 본문이 길어서 |
| DEDUP layers | 7 (L1 URL→L2 orig_title≥0.65→L3 disp_title≥0.65→L4 one_line≥0.65 + 고유명사 가드→L5 key_tokens(고유명사3+숫자1 겹침)→L6 embedding→L7 title_entity) | L4 가드: 양쪽 기사에 식별 가능한 고유명사(영어)가 있으면 최소 1개 공유 필요 — 문장 구조만 유사한 오탐 방지 (e.g., "Anthropic lawsuit" vs "Nintendo lawsuit") |
| Embedding threshold | 0.92 cosine | L6 |
| L7 title_entity | 제품+버전 일치 + one_line 토큰 Jaccard ≥ 0.30 | GPT-5.4 등 동일 이벤트 다소스 중복 감지. 버전 없는 제품명(예: "Code Review")은 L7 매칭 약화 — L5 nums_overlap도 0이면 전 레이어 통과 가능 (구조적 한계) |
| AI 필터 | Tier 1+2 중 Tom's Hardware만 AI 필터 적용 (NEEDS_AI_FILTER={"toms_hardware"}, 범용 RSS 피드), 나머지 17개는 전체 통과, Tier 3: "의심 시 제거" (AI+개발/IT 기술 포함). 모든 카테고리에 AI 필터 동일 적용 (research 면제 없음). KO 필터 INCLUDE 목록에 "AI 기업과 정부/국방부 관계 기사" 포함 | Tom's Hardware는 범용 하드웨어 피드로 비AI 기사 혼재, 나머지 Tier 1+2는 AI 전문 피드로 필터 불필요, Tier 3는 비AI 9%+완전 무관 기사 혼재 |

### Classification Categories
- `models_products` — NEW model/product/tool/feature release, first wide rollout (NOT: events/meetups, non-AI products). 상용 기업의 제품 출시만 해당
- `research` — Paper, algorithm, benchmark, tutorial/how-to (includes paper-based tools). 학술/연구 기관(Stanford, MIT, Google AI/DeepMind, MSR, FAIR, IBM Research 등) 출처의 프레임워크/모델 공개 포함. 경량화/최적화/에지 연구도 가중치 공개 여부와 무관하게 research. NOT: corporate tech/data licensing deals, concept comparison/explainer articles without novel method
- `industry_business` — Everything else (catch-all: funding, regulation, trends, strategy, events, concept explainers, corporate tech deals)
- industry_business가 50-65%인 것은 정상 (catch-all 설계). 60% 초과 시 경고만 출력. 메가 이벤트(예: Anthropic-Pentagon 갈등 등 다소스 대형 사건) 발생 시 70%+도 자연 편향으로 허용 — 연속 3회 70%+ 시에만 프롬프트 조정 검토
- 미분류 기사 → industry_business 기본값 적용 (로그로 개수 추적)

### Article Summary Structure (per article)
```
display_title / display_title_en  — 뉴스 헤드라인 스타일 제목 ('...'·'?' 비율 제한 없이 자유 사용, 확정 사실 서술어 뒤 구분자 금지)
one_line / one_line_en            — 사건 1문장 요약 (누가+무엇을)
key_points / key_points_en        — 구체적 세부정보 3개 (2개도 허용)
why_important / why_important_en  — 업계 영향 1-2문장
background / background_en       — 배경 맥락 1-2문장
tags / tags_en                   — 키워드 2-4개
glossary / glossary_en           — 전문 용어 2-3개 ({term, desc})
entities                         — [{name, type}] (model/company/person/technology/concept/dataset/framework)
topic_cluster_id                 — "domain/topic" (e.g., "nlp/language_models")
date_estimated                   — RSS/스크래핑에서 날짜 추출 실패 시 true (수집 시점으로 대체, UI에서 ~접두사 표시)
```

### Principle Pipeline (scripts/agents/principle_team.py) — Curated 전용 모드

5-node pipeline: `seed_selector → content_generator → verifier → [retry_reseed (conditional)] → assembler`
- **현재: curated 전용 모드** — LLM 생성 비활성화, 사전 작성된 37개 .md 파일만 사용
- 실제 실행 흐름: `seed_selector → content_generator(curated 파일 로드) → verifier(skip) → assembler(Firestore 저장)`
- Conditional retry, verifier, defense-in-depth는 코드에 존재하나 curated 모드에서 비활성화

**Curated 모드 동작:**
- seed_selector가 `scripts/curated_principles/` 폴더에 .md 파일이 있는 시드만 선택 → 30일 중복 회피 + 3일 분야(super_category) 로테이션
- content_generator가 curated 파일을 로드 (`_load_curated_content()`), LLM 호출 없음, `content_source='curated'`
- Curated 콘텐츠는 사전 검수 완료 → verifier 건너뜀
- assembler가 seed의 takeaway/takeaway_en을 Firestore 문서에 포함하여 `daily_principles/{date}`에 저장

**Curated 콘텐츠 사양 (37개 시드, 11분야):**
- **분야별 시드**: 제어공학 4, 전기/전자 3, 정보/통신 4, 로보틱스 1, 물리학 5, 생물학 3, 화학 1, 신경과학 3, 수학 6, 통계학 5, 의학 2
- **4 Super Categories**: 공학(4분야, 12시드), 자연과학(4분야, 12시드), 형식과학(2분야, 11시드), 응용과학(1분야, 2시드)
- **재분류**: 기존 최적화공학(4시드)은 원래 학문 기준으로 재분류됨 — 담금질 기법→물리학, 경사하강법·볼록최적화→수학, 베이지안 최적화→통계학
- **파일 형식**: front-matter(difficulty, connectionType, keywords) + 자유 형식 마크다운 KO 본문 + `---EN---` 구분자 + EN 본문
- content_ko (2000~5000자) + content_en (영어 동일 내용) 쌍
- **제목 규칙**: principle_name에 영어 알고리즘/원리 이름 사용, 콘텐츠 첫 줄 "English Name - 한줄 정의" 형태
- **connectionType 유형**: direct_inspiration, structural_analogy, mathematical_foundation, conceptual_borrowing
- 수식은 LaTeX가 아닌 평문 표기 (dE = E(x') - E(x) 형태), ≤/≥ 등 유니코드 수학 기호 사용
- readTime: 코드에서 content_ko 글자 수 기반 자동 계산 (`_calc_read_time`, 500자/분 기준)
- **난이도 관리 원칙** (대상: AI 관심 일반인~초중급) — curated 콘텐츠 작성 시 적용:
  - 구체적 적용 사례 포함, 공간적 비유 활용, 수식 중간 단계 추가
  - 전문 용어는 풀어쓴 설명 먼저, 인과 계보 과장 금지, 복합 개념 문장 분리
  - 상세 기준은 curated 콘텐츠 작성 시 참조 (골드 스탠다드: `opt_simulated_annealing.md`)

**LLM 생성 폴백 (비상 시만, 현재 비활성):**
- curated 풀 고갈(37개 모두 30일 내 사용) 시에만 LLM 폴백 발동
- Verifier: 4-section evaluation, confidence < 0.7 OR sub-score < 0.5 시 retry
- Defense-in-depth: content=None → should_retry → retry_reseed flow
- 정상 운영에서는 발생하지 않아야 함 — 발생 시 시드 추가 필요

### Post-Pipeline Features (scripts/generate_features.py)

| Feature | Output | Description |
|---------|--------|-------------|
| save_articles | `articles/{id}` | Individual article docs (SHA256 URL hash) |
| find_related | `related_ids` | Top 3 related by entity+cluster+category matching |
| daily_briefing | `daily_briefings/{date}` | 2-3 min AI briefing (KO+EN), story_count, hot_topics with subtag merging |
| glossary | `glossary_terms/{term}` | Accumulated terms across articles |
| timeline | `timeline_ids` | Links to similar articles from past 90 days |
| patch_daily_news | `daily_news/{date}` | Reflects related_ids/timeline_ids back |

### Firestore Collections

| Collection | Format | Content |
|-----------|--------|---------|
| `daily_news/{date}` | 1 doc/day | highlights[], categorized_articles{}, source_articles{}, archived_articles{} (이전 실행 고유 기사 보존) |
| `daily_principles/{date}` | 1 doc/day | curated 자유 형식 마크다운 (content_ko/en, principle_name, discipline, connectionType, difficulty, keywords, readTime, takeaway/takeaway_en, content_source='curated') |
| `articles/{article_id}` | 1 doc/article | Full article + entities, related_ids, timeline_ids |
| `daily_briefings/{date}` | 1 doc/day | briefing_ko, briefing_en, story_count, category_stats, domain_stats, hot_topics, trend_history |
| `glossary_terms/{term}` | 1 doc/term | term/desc (KO+EN), article_ids |
| `users/{uid}` | 1 doc/user | profile, expoPushToken, fcmToken, language (ko/en), lastLikeNotifiedAt |
| `users/{uid}/bookmarks` | subcollection | type, itemId, metadata |
| `users/{uid}/preferences/notifications` | subdoc | newsAlerts, commentReplies, likes |
| `reactions/{itemId}` | 1 doc/item | likedBy[], dislikedBy[] |
| `comments/{docId}/entries` | subcollection | Threaded comments |
| `article_views/{docId}` | 1 doc/article | View counter |
| `reports/{reportId}` | 1 doc/report | commentId, docId, reporterUid, authorUid, reason, commentText, status (pending/resolved/dismissed) |

### GitHub Actions (.github/workflows/collect-news.yml)
- Schedule: 6AM + 6PM KST daily
- Manual trigger: target (all/news/principle), force flag
- Python 3.11, timeout: 40 minutes
- 6AM+6PM: `save_news_to_firestore()`는 최신 실행 결과로 표시 데이터(highlights/categorized_articles/source_articles) 덮어쓰기. 기존 기사 중 중복되지 않는 것은 `archived_articles`에 별도 보존 (link 기준 dedup). 모바일은 표시 데이터만 읽음

### Push Notification System

- **3-레이어**: 파이프라인 뉴스(`notifications.py`, FCM+Expo 폴백) + Cloud Functions v2 소셜(댓글/좋아요, Expo Push API) + 모바일 클라이언트
- **KO/EN 자동전환** (`users/{uid}.language`), Android 채널 `news`(HIGH) / `social`(DEFAULT), 좋아요 5분 디바운싱

### CI Logging (`scripts/agents/ci_utils.py`)
- `ci_warning(msg)` / `ci_error(msg)` — `::warning::` / `::error::` 어노테이션 (CI에서만) + 항상 print + 내부 리스트에 수집
- `ci_group(title)` / `ci_endgroup()` — 긴 목록 접기 (수집 기사, EN/KO 결과, QA 목록, 랭킹 상세, 소스 섹션)
- `write_job_summary(md)` — `$GITHUB_STEP_SUMMARY`에 마크다운 테이블 (뉴스/원리 결과 + 경고/에러)
- `get_collected_warnings()` / `get_collected_errors()` — 수집된 경고/에러를 Job Summary에 반영, `reset_collected()`으로 초기화
- 로컬 실행 시 어노테이션 미출력, 기존 print 로그만 유지 (`CI` 환경변수 감지)

---

## LLM Usage

- Default model: `gemini-2.5-flash` via LangChain (`langchain-google-genai`)
- Embedding model: `gemini-embedding-001` (L6 dedup cosine similarity)
- LLM instances cached per (model, temperature, max_tokens, thinking, json_mode) tuple
- Temperature: 0.0 (translate/summarize, classify, rank, entity, AI filter, verify), 0.3 (briefing, daily tools), 0.4 (principle generation — curated 전용 모드에서 미사용)
- Thinking mode disabled for ALL pipeline LLM calls (speed + JSON stability)
- JSON mode via `response_mime_type: application/json`
- Retry: news `_llm_invoke_with_retry` max 3 attempts (string prompt), principle `_llm_invoke_with_retry` max 3 attempts (message list, curated 전용 모드에서 미사용)
- 모든 파이프라인 노드는 `_safe_node` 데코레이터로 감싸져 있어 개별 노드 실패 시에도 파이프라인 중단 없음 + 노드별 소요 시간(`node_timings`) 자동 기록

---

## Known Recurring Issues (Pipeline)

- **Gemini JSON 잘림**: max_tokens 부족 시 발생, `_parse_llm_json`에 6단계 복구 로직 존재. 발동 시 ranker token_budget 확인
- **Gemini markdown artifacts**: ` ```json ` 래퍼 및 `***` wrapping 버그, `_safe_json_parse`에 다단계 복구 존재
- **Pipeline 0 articles**: API quota 초과 시 silent failure — 로그에서 확인
- **분류 편향 경고**: industry_business 60% 초과는 catch-all 설계상 정상, 연속 3회 70%+에서만 프롬프트 조정 검토
- **Tom's Hardware 범용 피드**: NEEDS_AI_FILTER로 비AI 기사 필터링 중, 필터율 30-80% 정상
- **날짜 추정 (`date_estimated`)**: RSS 날짜 미추출 시 스크래핑 복원 시도, 실패 시 UI에 `~` 접두사 표시
- **VentureBeat/paywall**: trafilatura Chrome UA 설정 필요 (`_get_traf_config`)
- **key_points 2개**: 프롬프트 허용 범위, 0-1개는 문제
- **Pipeline QA**: print + GitHub Actions 어노테이션 + Job Summary, `/pipeline-qa` 스킬로 8개 영역 심층 분석 가능. `pipeline-post-check.sh` hook이 파이프라인 실행 후 7개 패턴(JSON 잘림, 0건 수집, 스크래핑 실패, 분류 편향, AI 필터, curated 풀 고갈, API 쿼터) 자동 감지
- **Python 구문 검증**: .py 파일 수정 시 `python-syntax-check.sh` hook이 `py_compile` 자동 실행, 구문 오류 즉시 차단
- **EN 번역 실패 폴백**: 4-phase retry (배치 → 개별 → 영어 원본 유지 → 간이 번역), 실패 시 영어 제목 유지
