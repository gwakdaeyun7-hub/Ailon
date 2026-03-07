# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ailon** is a bilingual (Korean/English) AI news curation and interdisciplinary learning mobile app. It collects AI news from 16 sources, processes them through a LangGraph pipeline (translate, summarize, categorize, rank, extract entities), and delivers curated content via a React Native mobile app. A secondary pipeline generates daily "principle" content linking academic disciplines to AI concepts.

## Architecture

```
ailon/
├── scripts/          # Python backend — LangGraph pipelines + Firebase writes
│   ├── agents/       # Pipeline core: config.py, news_team.py, principle_team.py, tools.py
│   ├── generate_daily.py      # Main orchestrator (news + principles + features)
│   ├── generate_features.py   # Post-pipeline: briefing, glossary, timeline, story, related articles
│   └── notifications.py       # Expo push notifications
├── mobile/           # React Native (Expo SDK 54) + NativeWind
│   ├── app/          # Expo Router file-based routing (tabs: index, snaps, saved, profile)
│   ├── components/   # UI: briefing/, feed/, shared/
│   ├── hooks/        # Data hooks: useNews, usePrinciple, useBriefing, useAuth, etc.
│   ├── context/      # DrawerContext, LanguageContext, ThemeContext
│   └── lib/          # firebase.ts, types.ts, colors.ts, translations.ts, theme.ts
├── functions/        # Firebase Cloud Functions (comment/like push notifications)
├── backend/          # Firebase config (firebase.json, firestore.rules)
└── .github/workflows/collect-news.yml  # Scheduled pipeline (6AM + 6PM KST)
```

## Key Commands

### Mobile (Expo/React Native)
```bash
cd mobile
npm install
npx expo start                    # Dev server (Expo Go or dev client)
npx expo start --android          # Android
eas build --platform android --profile preview   # APK build
eas build --platform android --profile production # AAB build
```

### Backend Pipeline (Python)
```bash
cd scripts
pip install -r requirements.txt
python generate_daily.py all      # Full pipeline (news + principles + features)
python generate_daily.py news     # News only
python generate_daily.py principle # Principles only
python generate_daily.py all --force  # Force regenerate principles
```

### Firebase
```bash
cd backend
firebase deploy --only firestore:rules
cd ../functions && firebase deploy --only functions
```

## Environment Variables

### Pipeline (scripts/) — `.env` or GitHub Actions secrets
- `GOOGLE_API_KEY` — Gemini API key (required)
- `FIREBASE_CREDENTIALS` — Firebase service account JSON string

### Mobile (mobile/) — `.env` with `EXPO_PUBLIC_` prefix
- `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID`

---

## Mobile App Features

### Tab 1: News Feed (index.tsx ~1500 lines)
- **Highlights**: Hero card + 2x2 grid, top 1 article per category (3 total)
- **Daily Briefing**: AI-generated 2-3 min briefing card with TTS playback (expo-speech)
- **Categories**: Horizontal scroll tabs (research / models_products / industry_business), Top 25 per category
- **Sources**: 16 source sections, Korean sources (AI타임스, GeekNews, ZDNet AI, 요즘IT) in separate tabs
- **Article Card**: display_title, one_line, key_points (3), why_important, background, tags, glossary
- **Interactions**: Like/dislike (ReactionBar), comments (CommentSheet modal), share, bookmark
- **Glossary Highlighting**: Auto-detects terms in text, tap for definition popup (HighlightedText)
- **Related Articles**: Horizontal carousel in summary modal (RelatedArticlesSection)
- **Timeline**: Vertical timeline of past coverage (TimelineSection)
- **Pull-to-refresh**, skeleton loading, batch stats fetching

### Tab 2: Snaps (snaps.tsx) — Principles/Daily Learning
- **3-Step Insight Cards** with progress dots:
  1. Foundation: Academic principle + everyday analogy (icon per superCategory)
  2. Application: AI connection + problem + mechanism
  3. Integration: Real-world impact
- **Deep Dive Tab** (왜의 사슬): originalProblem → bridge → coreIntuition → formula → limits
- **Metadata**: Difficulty badge (Beginner/Intermediate/Advanced), connectionType, keywords, readTime
- **6 Disciplines**: 학문 기원, 수학적 기초, 생물학적 영감, 철학적 토대, 인지과학, 물리학 최적화
- Date navigation, AsyncStorage offline caching

### Tab 3: Saved (saved.tsx)
- Bookmark collection with type filter (News | Principles)
- Delete with confirmation, "View Original" for news
- Real-time sync from `users/{uid}/bookmarks` subcollection

### Tab 4: Profile (profile.tsx)
- Google Sign-In authentication
- Language toggle (KO/EN), dark/light theme switch
- Notification settings: newsAlerts, commentReplies, likes (per-type toggles)

### Shared Components
- **CommentSheet**: Full-screen modal, threaded replies, author avatars
- **ReactionBar**: Like (count) + Comment + Share buttons
- **BookmarkButton**: Toggle bookmark with filled/stroke icon
- **HighlightedText**: Auto glossary term detection + definition modal
- **RelatedArticlesSection**: Horizontal card carousel (entity/cluster matching)
- **TimelineSection**: Vertical timeline with past article links
- **DailyBriefingCard**: Hero card with TTS, expandable text, story count
- **PersonalizedFeed**: Scoring based on like history (category +3, tag +2)
- **SideDrawer**: Animated left panel (82% width, max 320px)

### Hooks
| Hook | Data Source | Purpose |
|------|------------|---------|
| useNews | `daily_news/{date}` | Today's news (highlights, categories, sources) |
| usePrinciple | `daily_principles/{date}` | Daily principle with date navigation + offline cache |
| useAuth | Firebase Auth | Google Sign-In, auto user doc creation |
| useBookmarks | `users/{uid}/bookmarks` | Real-time bookmark sync |
| useReactions | `reactions/{itemId}` | Like/dislike with atomic transactions |
| useComments | `comments/{docId}/entries` | Threaded comments |
| useArticleViews | `article_views/{docId}` | View tracking (daily dedup) |
| useBatchStats | Multiple collections | Batch fetch likes/views/comments for feed cards |
| useBriefing | `daily_briefings/{date}` | AI briefing text + story count |
| useGlossaryDB | `glossary_terms` | Term search (max 200 terms) |
| useNotifications | `users/{uid}` | Expo push token registration |
| useNotificationSettings | `users/{uid}/preferences` | Per-type notification toggles |

### Contexts
- **LanguageContext**: KO/EN toggle, `t(key)` translation function, AsyncStorage persist
- **ThemeContext**: Dark/light mode, system-aware default, color tokens
- **DrawerContext**: Side drawer animation state (translateX, overlayOpacity)

### Styling
- **NativeWind** (TailwindCSS for RN) with dark-first theme
- **colors.ts**: Light (beige/cream) / Dark (teal/cyan accent), 50+ color tokens
- **theme.ts**: Spacing, font sizes, radius, card shadow, Lora serif font, MIN_TOUCH_TARGET=44
- Primary: Teal (#0D7377 light, #14B8A6 dark), Accent: Orange (#B45309 light, #F59E0B dark)

---

## Pipeline Architecture

### News Pipeline (scripts/agents/news_team.py)

LangGraph 8-node pipeline with parallel EN/KO branches:

`collector → [en_process, ko_process] (parallel Send) → categorizer → ranker → entity_extractor → selector → assembler`

| Node | Function | Key Config |
|------|----------|------------|
| collector | 16 RSS sources + scraping + LLM AI filter | trafilatura + Chrome UA, 10 parallel workers |
| en_process | EN→KO translation + summarization | batch=5, max_tokens=12288, thinking=False |
| ko_process | KO summarization | batch=2, max_tokens=12288, thinking=False |
| categorizer | LLM 3-category classification + 7-layer dedup | batch=5, 3 parallel workers |
| ranker | Per-category LLM ranking → score (1st=100, last=30) | token_budget=max(6144, count*100) |
| entity_extractor | Entity extraction + topic clustering | batch=5, 4 parallel workers |
| selector | Highlight Top 3 + Category Top 25 | today articles only for highlights |
| assembler | Final structure + timing report | Korean sources in separate sections |

### News Sources (16 total, 3 tiers)

**Tier 1+2 (12 EN sources)** — CATEGORY_SOURCES, used for highlights + categories:
Wired AI, TechCrunch AI, The Verge AI, MIT Tech Review, VentureBeat, MarkTechPost, The Decoder, The Rundown AI, Google DeepMind, NVIDIA, Hugging Face, Ars Technica AI

**Tier 3 (4 KO sources)** — SOURCE_SECTION_SOURCES, separate sections:
AI타임스, GeekNews, ZDNet AI 에디터 (HTML scrape), 요즘IT AI

### Key Constants (DO NOT lower without reason)

| Constant | Value | Why |
|----------|-------|-----|
| Ranker token_budget | `max(6144, count*100)` | 이전 `max(4096, count*100)`에서 41~44건 카테고리 JSON 잘림 발생 |
| Ranker ctx thresholds | >40: title only, 25-40: 150자, ≤25: 500자 | 대규모 카테고리 랭킹 정확도 |
| HIGHLIGHT_COUNT | 3 | 카테고리당 1개씩 |
| CATEGORY_TOP_N | 25 | 카테고리별 최대 기사 수 |
| MAX_ARTICLE_AGE_DAYS | 5 | 표시 범위 |
| CLASSIFY_BATCH_SIZE | 5 | LLM 안정성 |
| EN batch size | 5 | 번역+요약 |
| KO batch size | 2 | 한국어 본문이 길어서 |
| DEDUP layers | 7 (URL→orig_title→disp_title→one_line→key_tokens→embedding) | |
| Embedding threshold | 0.92 cosine | Layer 7 |

### Classification Categories
- `models_products` — NEW model/product/tool/feature release, first wide rollout
- `research` — Paper, algorithm, benchmark, tutorial/how-to
- `industry_business` — Everything else (catch-all: funding, regulation, trends, strategy)
- industry_business가 50-65%인 것은 정상 (catch-all 설계). 60% 초과 시 경고만 출력
- 미분류 기사 → industry_business 기본값 적용 (로그로 개수 추적)

### Article Summary Structure (per article)
```
display_title / display_title_en  — 뉴스 헤드라인 스타일 제목
one_line / one_line_en            — 사건 1문장 요약 (누가+무엇을)
key_points / key_points_en        — 구체적 세부정보 3개 (2개도 허용)
why_important / why_important_en  — 업계 영향 1-2문장
background / background_en       — 배경 맥락 1-2문장
tags / tags_en                   — 키워드 2-4개
glossary / glossary_en           — 전문 용어 2-3개 ({term, desc})
entities                         — [{name, type}] (model/company/person/technology/concept/dataset/framework)
topic_cluster_id                 — "domain/topic" (e.g., "nlp/language_models")
```

### Principle Pipeline (scripts/agents/principle_team.py)

4-node pipeline: `seed_selector → content_generator → verifier → assembler`

- Generates 1 principle per day from 6+ disciplines
- 3-step narrative: foundation → application → integration + deepDive
- Avoids same discipline in last 3 days, same seed in last 30 days
- Verifier: LLM fact-check, retry if confidence < 0.7

### Post-Pipeline Features (scripts/generate_features.py)

| Feature | Output | Description |
|---------|--------|-------------|
| save_articles | `articles/{id}` | Individual article docs (SHA256 URL hash) |
| find_related | `related_ids` | Top 3 related by entity+cluster+category matching |
| daily_briefing | `daily_briefings/{date}` | 2-3 min AI briefing (KO+EN), story_count |
| glossary | `glossary_terms/{term}` | Accumulated terms across articles |
| timeline | `timeline_ids` | Links to similar articles from past 90 days |
| patch_daily_news | `daily_news/{date}` | Reflects related_ids/timeline_ids back |

### Firestore Collections

| Collection | Format | Content |
|-----------|--------|---------|
| `daily_news/{date}` | 1 doc/day | highlights[], categorized_articles{}, source_articles{} |
| `daily_principles/{date}` | 1 doc/day | 3-step insight + deepDive + verification |
| `articles/{article_id}` | 1 doc/article | Full article + entities, related_ids, timeline_ids |
| `daily_briefings/{date}` | 1 doc/day | briefing_ko, briefing_en, story_count |
| `glossary_terms/{term}` | 1 doc/term | term/desc (KO+EN), article_ids |
| `users/{uid}` | 1 doc/user | profile, expoPushToken |
| `users/{uid}/bookmarks` | subcollection | type, itemId, metadata |
| `users/{uid}/preferences/notifications` | subdoc | newsAlerts, commentReplies, likes |
| `reactions/{itemId}` | 1 doc/item | likedBy[], dislikedBy[] |
| `comments/{docId}/entries` | subcollection | Threaded comments |
| `article_views/{docId}` | 1 doc/article | View counter |

### GitHub Actions (.github/workflows/collect-news.yml)
- Schedule: 6AM + 6PM KST daily
- Manual trigger: target (all/news/principle), force flag
- Python 3.11, timeout: 40 minutes

---

## LLM Usage

- Default model: `gemini-2.5-flash` via LangChain (`langchain-google-genai`)
- LLM instances cached per (model, temperature, max_tokens, thinking, json_mode) tuple
- Temperature: 0.0 (classify/rank), 0.3 (briefing), 0.4 (principle)
- Thinking mode disabled for translation/summarization (speed)
- JSON mode via `response_mime_type: application/json`

---

## Current Phase: Launch Readiness (MVP)

### What's Done
- 4-tab mobile app — feature complete (news feed, principles, saved, profile)
- All interactions: likes, comments, bookmarks, share, TTS, glossary highlight
- LangGraph news pipeline (8 nodes, 16 sources, EN/KO parallel)
- Principle pipeline (6 disciplines, 3-step insight + deep dive + verification)
- Post-pipeline: briefing, glossary, timeline, related articles
- Auth (Google), dark mode, bilingual (KO/EN), push notifications

### What NOT to Build Before Launch
- Synergy Lab (Phase 3 per PRD)
- Search functionality
- Onboarding tutorial
- Premium/payment features
- Any new pipeline nodes

### Build & Release
- Preview APK: `cd mobile && eas build --platform android --profile preview`
- Production AAB: `cd mobile && eas build --platform android --profile production`
- Submit: `eas submit --platform android`
- Bundle ID: `com.ailon.app`
- EAS Project ID: `bffbb3e7-cf38-4b39-ada3-e8fb04b51349`

### Pre-Launch Checklist
- [ ] Firestore security rules reviewed (backend/firestore.rules)
- [ ] Environment variables set in EAS secrets
- [ ] Pipeline running stable on GitHub Actions (check last 3 days)
- [ ] Google Sign-In configured for production SHA-256
- [ ] Splash screen / app icon assets finalized
- [ ] Play Store listing (screenshots, description, privacy policy)

---

## Known Recurring Issues

- **Gemini JSON 잘림**: max_tokens 부족 시 JSON 배열이 잘림. `_parse_llm_json`에 5단계 복구 로직 있음. 복구가 발동되면 ranker token_budget 확인 필요
- **Gemini markdown artifacts**: ```json 래퍼가 JSON 파싱을 깨뜨림 — strip before parse
- **Pipeline 0 articles**: API quota 초과 시 silent failure — 로그에서 확인
- **분류 편향 경고**: industry_business 60% 초과는 catch-all 설계상 정상일 수 있음. 미분류 기사 개수 로그로 확인
- **VentureBeat/paywall 사이트**: trafilatura에 Chrome UA 설정 필요 (tools.py `_get_traf_config`)
- **key_points 2개**: 프롬프트에서 허용 범위 (팩트 부족 시). 0-1개는 문제
- **index.tsx ~1500 lines**: 더 이상 inline 컴포넌트 추가 금지, components/feed/로 추출할 것
- **Pipeline QA logs**: print-only (GitHub Actions 로그), Firestore에 저장 안 됨

## Behavioral Guidelines

- **Think before coding**: State assumptions, surface tradeoffs, ask if unclear
- **Simplicity first**: Minimum code that solves the problem, no speculative features
- **Surgical changes**: Touch only what you must, match existing style
- **Goal-driven execution**: Define verifiable success criteria, loop until verified
