# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AILON** (AI Insight Linked On Network) is a bilingual (Korean/English) AI news curation and interdisciplinary learning mobile app developed by 정다윗 (David Jung). It collects AI news from 22 sources, processes them through a LangGraph pipeline (translate, summarize, categorize, rank, extract entities), and delivers curated content via a React Native mobile app. A secondary pipeline delivers daily "principle" content (curated 전용 — 45개 사전 작성 콘텐츠) linking academic disciplines to AI concepts.

## Architecture

```
ailon/
├── scripts/          # Python backend — LangGraph pipelines + Firebase writes
│   ├── agents/       # Pipeline core: config.py, news_team.py, principle_team.py, tools.py
│   ├── generate_daily.py      # Main orchestrator (news + principles + features)
│   ├── generate_features.py   # Post-pipeline: briefing, glossary, timeline, story, related articles
│   └── notifications.py       # FCM 알림 (제목 + one_line 2줄 표시) + Expo 폴백
├── mobile/           # React Native (Expo SDK 54) + NativeWind
│   ├── app/          # Expo Router file-based routing (tabs: index, snaps, tools, saved, profile)
│   ├── components/   # UI: briefing/, feed/, shared/
│   ├── hooks/        # Data hooks: useNews, usePrinciple, useBriefing, useAuth, etc.
│   ├── context/      # DrawerContext, LanguageContext, ThemeContext
│   └── lib/          # firebase.ts, types.ts, colors.ts, translations.ts, theme.ts
├── functions/        # Firebase Cloud Functions v2 (comment/like push notifications)
├── backend/          # Firebase config (firebase.json, firestore.rules)
└── .github/workflows/collect-news.yml  # Scheduled pipeline (6AM + 6PM KST)
```

## Key Commands

### Mobile (Expo/React Native)
```bash
cd mobile
npm install
npx expo start                    # Dev server (dev client 연결, hot reload)
npx expo start --android          # Android
eas build --platform android --profile development  # Dev client APK (1회 빌드 후 hot reload)
eas build --platform android --profile preview      # Preview APK
eas build --platform android --profile production   # Production AAB
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

> **상세 내용은 `mobile/CLAUDE.md`로 분리됨** — Tab 1~5 상세, Shared Components, Hooks, Contexts, Styling 참조

---

## Pipeline & Backend

> **상세 내용은 [`scripts/CLAUDE.md`](scripts/CLAUDE.md)로 분리됨** — News Pipeline (8-node), Principle Pipeline (curated 전용, 5-node), News Sources (22개, 3 tiers), Key Constants, Classification Categories, Article Summary Structure, Post-Pipeline Features, Firestore Collections, GitHub Actions, Push Notifications, CI Logging, LLM Usage 참조

---

## Current Phase: Launch Readiness (MVP)

### What's Done
- 5-tab mobile app (news feed, snaps, AI tools [준비 중], saved, profile)
- All interactions: likes, comments, bookmarks (news/principle), share, TTS, glossary highlight, saved tab AI 요약 모달
- LangGraph news pipeline (8 nodes, 22 sources, EN/KO parallel)
- Principle pipeline (curated 전용 — 11 disciplines, 4 super categories, 45개 사전 작성 콘텐츠, LLM 생성 비활성화)
- Post-pipeline: briefing, glossary, timeline, related articles
- Auth (Google), dark mode, bilingual (KO/EN), push notifications

### What NOT to Build Before Launch
- Synergy Lab (Phase 3 per PRD)
- Search functionality
- Onboarding tutorial
- Premium/payment features
- Any new LangGraph pipeline nodes

### Build & Release
- **OneDrive 외부에서 빌드 필수** — OneDrive 폴더에서 `eas build` 시 tar Permission denied 에러 발생. `C:\dev\ailon`으로 복사 후 빌드
- Bundle ID: `com.ailon.app` / EAS Project ID: `bffbb3e7-cf38-4b39-ada3-e8fb04b51349`
- 빌드 명령어 및 상세는 `mobile/CLAUDE.md` 참조

### Pre-Launch Checklist
> [`docs/launch-checklist.md`](docs/launch-checklist.md) 참조

---

## Known Recurring Issues

> 각 하위 CLAUDE.md 참조: [`scripts/CLAUDE.md`](scripts/CLAUDE.md) (Pipeline), [`mobile/CLAUDE.md`](mobile/CLAUDE.md) (Mobile)

## Behavioral Guidelines

- **Think before coding**: State assumptions, surface tradeoffs, ask if unclear
- **Simplicity first**: Minimum code that solves the problem, no speculative features
- **Surgical changes**: Touch only what you must, match existing style
- **Goal-driven execution**: Define verifiable success criteria, loop until verified
- **Do NOT add inline components to index.tsx** — 이미 ~1560줄, `guard-index-bloat.sh` hook이 자동 차단. `components/feed/`로 추출할 것

## Hooks (`.claude/hooks/`)

| Hook | Trigger | Mode | Scope |
|------|---------|------|-------|
| `guard-index-bloat.sh` | PreToolUse (Edit\|Write) | Block | index.tsx에 inline 컴포넌트 추가 차단 |
| `pipeline-post-check.sh` | PostToolUse (Bash) | Info | 파이프라인 실행 후 7개 QA 패턴 자동 감지 |
| `python-syntax-check.sh` | PostToolUse (Edit\|Write) | Block | .py 파일 구문 오류 즉시 차단 |
| `mobile-typecheck.sh` | PostToolUse (Edit\|Write) | Info | .ts/.tsx 수정 후 tsc 타입 체크 |
| *(inline)* | Stop / Notification | Info | 비프음 알림 (800Hz, 0.3s) |

설정: `.claude/settings.local.json` (gitignore 대상). 훅 스크립트 자체는 커밋 대상.
