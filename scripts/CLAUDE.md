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
- `models_products` — NEW model/product/tool/feature release, first wide rollout (NOT: events/meetups, non-AI products)
- `research` — Paper, algorithm, benchmark, tutorial/how-to (includes paper-based tools). NOT: corporate tech/data licensing deals, concept comparison/explainer articles without novel method
- `industry_business` — Everything else (catch-all: funding, regulation, trends, strategy, events, concept explainers, corporate tech deals)
- industry_business가 50-65%인 것은 정상 (catch-all 설계). 60% 초과 시 경고만 출력. 메가 이벤트(예: Anthropic-Pentagon 갈등 등 다소스 대형 사건) 발생 시 70%+도 자연 편향으로 허용 — 연속 3회 70%+ 시에만 프롬프트 조정 검토
- 미분류 기사 → industry_business 기본값 적용 (로그로 개수 추적)

### Article Summary Structure (per article)
```
display_title / display_title_en  — 뉴스 헤드라인 스타일 제목 (여운·궁금증 어울리면 '...'로 끝내기 허용)
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

### Principle Pipeline (scripts/agents/principle_team.py)

5-node pipeline: `seed_selector → content_generator → verifier → [retry_reseed (conditional)] → assembler`
- Conditional retry: `should_retry` → `retry_reseed` (LangGraph conditional edges, max 3 retries)

- Generates 1 principle per day from 12 disciplines (engineering, natural/formal/applied science)
- **자유 형식 마크다운 텍스트** 생성 (기존 7-섹션 JSON 구조에서 전환)
- content_ko (300~600자) + content_en (영어 동일 내용) 쌍으로 생성
- Avoids same discipline in last 3 days, same seed in last 30 days
- **Curated 콘텐츠 지원**: `scripts/curated_principles/{seed_id}.md` 파일이 존재하면 LLM 생성 없이 직접 사용. front-matter(difficulty, connectionType, keywords) + `---EN---` 구분자로 KO/EN 분리
- Content prompt: 자유 형식 마크다운으로 한줄 정의 → 원리 해설 → AI 연결 → 수식과 직관 → 실제 임팩트 순 서사
  - 수식은 LaTeX가 아닌 평문 표기 (dE = E(new) - E(old) 형태)
  - 괄호 안에 AI 대응 개념 병기 (온도(탐색 범위))
  - 인라인 용어 정의 (Annealing(담금질) - 설명)
  - readTime: 코드에서 content_ko 글자 수 기반 계산 (`_calc_read_time`, 500자/분 기준)
- Verifier: 4-section evaluation (A. 사실정확성/principleAccuracy, B. 매핑정확성/mappingAccuracy, C. 텍스트품질/contentQuality, D. 한영일관성/bilingualConsistency)
  - Output: verified, confidence, principleAccuracy, mappingAccuracy, contentQuality, bilingualConsistency (0.0~1.0) + factCheck + issues[]
  - Retry if confidence < 0.7 OR any sub-score < 0.5
  - Curated 콘텐츠는 검증 건너뜀 (사전 검수 완료)
  - Regex fallback (`_regex_extract_verification`): JSON 파싱 완전 실패 시 raw text에서 verifier 필드를 regex로 직접 추출
  - Empty response detection: Gemini 빈 응답 시 파싱 생략 후 재시도
- Defense-in-depth: content=None → should_retry → retry_reseed flow (no exceptions)
- Code-level quality warnings: content_ko 길이 범위 (200~800자), content_en 존재, 한줄 정의 패턴, 수식 존재

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
| `daily_principles/{date}` | 1 doc/day | 3-step insight + deepDive + verification |
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

3-레이어 알림 시스템: 파이프라인(뉴스) + Cloud Functions(소셜) + 모바일 클라이언트

| 레이어 | 발송 방식 | 채널 | 내용 |
|--------|----------|------|------|
| 뉴스 알림 (`notifications.py`) | FCM (`firebase_admin.messaging`) + Expo 폴백 | `news` | title=하이라이트 기사 제목, body=one_line 한줄요약 (2줄 표시) |
| 댓글 답글 (`functions/index.js`) | Expo Push API | `social` | "{이름}님이 댓글에 답글을 남겼습니다" |
| 좋아요 (`functions/index.js`) | Expo Push API | `social` | "N명이 회원님의 글을 좋아합니다" (5분 디바운싱) |

- **이중언어**: `users/{uid}.language` 필드로 KO/EN 자동 전환 (LanguageContext 변경 시 + 로그인 시 Firestore 동기화)
- **FCM 알림**: `fcmToken` 저장된 사용자에게 `messaging.Notification(title=기사제목)`
- **Expo 폴백**: `fcmToken` 없는 사용자 → Expo Push API
- **Android 채널**: `news` (HIGH, 뉴스 알림), `social` (DEFAULT, 댓글/좋아요)
- **좋아요 디바운싱**: `users/{uid}.lastLikeNotifiedAt` 타임스탬프, 5분 내 중복 알림 억제
- **Cloud Functions**: v2 (`firebase-functions/v2/firestore`) — `onDocumentCreated`, `onDocumentUpdated`
- **딥링크 데이터**: `{ type, tab, articleId }` — 추후 기사 상세 딥링크 확장 가능

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
- Temperature: 0.0 (translate/summarize, classify, rank, entity, AI filter, verify), 0.3 (briefing, daily tools), 0.4 (principle generation)
- Thinking mode disabled for ALL pipeline LLM calls (speed + JSON stability)
- JSON mode via `response_mime_type: application/json`
- Retry: news `_llm_invoke_with_retry` max 3 attempts (string prompt), principle `_llm_invoke_with_retry` max 3 attempts (message list)
- 모든 파이프라인 노드는 `_safe_node` 데코레이터로 감싸져 있어 개별 노드 실패 시에도 파이프라인 중단 없음 + 노드별 소요 시간(`node_timings`) 자동 기록

---

## Known Recurring Issues (Pipeline)

- **Gemini JSON 잘림**: max_tokens 부족 시 JSON 배열이 잘림. `_parse_llm_json`에 6단계 복구 로직 있음 (1차 직접파싱 → 2차 앞뒤 텍스트 제거 → 3차 단일 객체 추출 → 4차 잘린 배열 복구 → 4-1차 잘린 객체 depth 기반 복구 → 5차 depth 기반 추출). 복구가 발동되면 ranker token_budget 확인 필요
- **Gemini markdown artifacts**: ```json 래퍼가 JSON 파싱을 깨뜨림 — strip before parse
- **Gemini `***` markdown wrapping**: json_mode에서도 `***\n"key": value\n***` 형태로 응답하는 버그. `_safe_json_parse`에 4단계 복구: 1) 원본 파싱 시도 2) `_fix_invalid_escapes` (LaTeX `\sigma`, `\LaTeX` 등 비표준 이스케이프 → `\\` 변환) + 파싱 3) JSON 영역 추출 (`{`...`}`) 4) 잘린 객체 depth 기반 복구. `***` 전용 방어: Phase 1) 시작/끝 `***` strip + trailing comma 제거 + `{}` 감싸기 + **즉시 json.loads 시도**, Phase 2) 컨텍스트 기반 `***` → `{`/`}` 치환 폴백. `phase1_applied` 플래그로 Phase 1 발동 시 Phase 2 완전 스킵 (문자열 값 오염 방지). 추가 방어: `_fix_unescaped_quotes()` — json.loads 에러 위치 기반 반복 quote escape 수정 (max 20 iterations), `_regex_extract_verification()` — JSON 파싱 완전 실패 시 regex로 verifier 필드 (verified, confidence, principleAccuracy, mappingAccuracy, insightClarity, deepDiveDepth, factCheck) + issues 배열 직접 추출하는 최종 폴백
- **Pipeline 0 articles**: API quota 초과 시 silent failure — 로그에서 확인
- **분류 편향 경고**: industry_business 60% 초과는 catch-all 설계상 정상일 수 있음. 미분류 기사 개수 로그로 확인
- **Tom's Hardware 범용 피드**: RSS가 AI 전용이 아니라 하드웨어 전반을 포함. NEEDS_AI_FILTER에 추가하여 비AI 기사 필터링 (tools.py line 222). 다른 Tier 1 소스와 달리 범용 피드이므로 필터 제거 시 비AI 기사 유입 주의. 필터율 30-80%가 정상 범위 (RSS 콘텐츠 비중에 따라 변동)
- **날짜 추정 기사 (`date_estimated`)**: RSS에 published 필드가 없는 기사는 `date_estimated=True`로 마킹되고 수집 시점이 대입됨. 스크래핑 단계에서 HTML meta/JSON-LD/time 태그로 복원 시도. 복원 실패 시 UI에 `~2026/03/10` 형식으로 표시. 소스별 날짜 누락률이 높으면 RSS 피드 구조 변경 확인 필요
- **VentureBeat/paywall 사이트**: trafilatura에 Chrome UA 설정 필요 (tools.py `_get_traf_config`)
- **key_points 2개**: 프롬프트에서 허용 범위 (팩트 부족 시). 0-1개는 문제
- **Pipeline QA logs**: print + GitHub Actions 어노테이션 (`::warning::`, `::error::`, `::group::`) + Job Summary. Firestore에는 저장 안 됨
- **Pipeline QA 스킬**: `/pipeline-qa`에 로그를 붙여넣으면 AI 필터/분류/중복감지/랭킹/제목 품질/브리핑/용어·태그/학문스낵 8개 영역 심층 분석 + 코드 자동 수정. 랭킹 검사는 **전체 기사**를 대상으로 카테고리별 순위 테이블 출력 + 미스랭킹 식별. 제목 품질 검사는 말줄임표('...') 적절성을 기사 단위로 판정 (적절/부자연스러움/놓친 기회). 상세 기준은 `.claude/skills/pipeline-qa/SKILL.md` 참조
- **EN 기사 번역 실패 폴백**: 배치+개별 재시도 모두 실패 시 Phase 3에서 `display_title = title` (영어 원본). Phase 4 간이 번역이 제목+one_line만 LLM으로 최소 복구 시도. Phase 4마저 실패 시 `ci_warning` 경고 + 영어 제목 유지 (제거하지 않음 — 상위 기사일 수 있으므로). 로그 패턴: `미번역 EN 기사 N개 감지`, `[간이 번역 복구]`, `미번역 EN 기사 N개 잔존`
