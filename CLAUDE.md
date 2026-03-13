# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AILON** (AI Insight Linked On Network) is a bilingual (Korean/English) AI news curation and interdisciplinary learning mobile app developed by 정다윗 (David Jung). It collects AI news from 22 sources, processes them through a LangGraph pipeline (translate, summarize, categorize, rank, extract entities), and delivers curated content via a React Native mobile app. A secondary pipeline generates daily "principle" content linking academic disciplines to AI concepts.

## Architecture

```
ailon/
├── scripts/          # Python backend — LangGraph pipelines + Firebase writes
│   ├── agents/       # Pipeline core: config.py, news_team.py, principle_team.py, tools.py
│   ├── generate_daily.py      # Main orchestrator (news + principles + features)
│   ├── generate_features.py   # Post-pipeline: briefing, glossary, timeline, story, related articles
│   └── notifications.py       # FCM 알림 (하이라이트 기사 제목) + Expo 폴백
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

> **상세 내용은 [`scripts/CLAUDE.md`](scripts/CLAUDE.md)로 분리됨** — News Pipeline (8-node), Principle Pipeline (5-node), News Sources (22개, 3 tiers), Key Constants, Classification Categories, Article Summary Structure, Post-Pipeline Features, Firestore Collections, GitHub Actions, Push Notifications, CI Logging, LLM Usage 참조

---

## Current Phase: Launch Readiness (MVP)

### What's Done
- 5-tab mobile app (news feed, snaps, AI tools [준비 중], saved, profile)
- All interactions: likes, comments, bookmarks (news/principle), share, TTS, glossary highlight
- LangGraph news pipeline (8 nodes, 22 sources, EN/KO parallel)
- Principle pipeline (12 disciplines, 4 super categories, 3-step insight + deep dive + verification)
- Post-pipeline: briefing, glossary, timeline, related articles
- Auth (Google), dark mode, bilingual (KO/EN), push notifications

### What NOT to Build Before Launch
- Synergy Lab (Phase 3 per PRD)
- Search functionality
- Onboarding tutorial
- Premium/payment features
- Any new LangGraph pipeline nodes

### Build & Release
- **IMPORTANT**: OneDrive 폴더에서 직접 `eas build` 하면 tar Permission denied 에러 발생. 반드시 OneDrive 밖으로 복사 후 빌드:
  ```bash
  xcopy "C:\Users\82105\OneDrive\바탕 화면\머릿속\Think AI\Ailon\ailon" "C:\dev\ailon" /E /I /H
  cd C:\dev\ailon\mobile
  npm install   # 최초 또는 dependencies 변경 시
  eas build --platform android --profile production
  ```
- **Development (hot reload)**: Dev client APK 1회 빌드 → 이후 `npx expo start`로 실시간 코드 반영 (같은 WiFi 필요)
  ```bash
  eas build --platform android --profile development   # 1회만 (네이티브 코드 변경 시 재빌드)
  npx expo start                                       # 매일 개발 시
  ```
- Preview APK: `eas build --platform android --profile preview`
- Production AAB: `eas build --platform android --profile production`
- Submit: `eas submit --platform android`
- Bundle ID: `com.ailon.app` (dev/preview/production 동일 — 동시 설치 불가, 하나만 유지)
- EAS Project ID: `bffbb3e7-cf38-4b39-ada3-e8fb04b51349`
- `.easignore`: node_modules, .expo, .jks, .env, .claude 제외

### Pre-Launch Checklist
- [x] Firestore security rules reviewed + deployed (reports 컬렉션, article_views 비로그인 쓰기 허용)
- [x] Environment variables set in EAS secrets (8개)
- [ ] Pipeline running stable on GitHub Actions (check last 3 days)
- [x] Google Sign-In configured for production SHA-256 (Firebase Console에 등록 완료)
- [x] Splash screen / app icon assets finalized (character.png 픽셀아트)
- [x] Privacy Policy + Terms of Service (docs/, GitHub Pages: gwakdaeyun7-hub.github.io/Ailon/) — 영문 버전 포함 (CCPA, DMCA, Publisher Opt-Out)
- [x] Production AAB 빌드 성공 (C:\dev\ailon에서 빌드)
- [x] 댓글 신고/삭제 기능 (useReportComment, 3건 자동 숨김)
- [x] app.json: versionCode 1, android permissions, expo-dev-client 제거
- [x] Play Store listing 콘텐츠 준비 (play-store-listing.md: 설명, Data Safety, 콘텐츠 등급, 카테고리)
- [x] AI Summary 뱃지 + Read Original 버튼 (요약 모달)
- [x] 기본 언어 시스템 감지 (expo-localization, 영어 기본값)
- [ ] Play Store 스크린샷 촬영 (영문 UI)
- [ ] Play Store Console 등록 + 심사 제출

---

## Known Recurring Issues

> **파이프라인 관련 이슈는 [`scripts/CLAUDE.md`](scripts/CLAUDE.md)의 Known Recurring Issues (Pipeline) 참조** — Gemini JSON/markdown 버그, Pipeline 0 articles, 분류 편향, Tom's Hardware 필터, 날짜 추정, VentureBeat paywall, key_points, Pipeline QA, EN 번역 폴백

- **index.tsx ~1500 lines**: 더 이상 inline 컴포넌트 추가 금지, components/feed/로 추출할 것 (상세: `mobile/CLAUDE.md`)
- **EAS Build OneDrive 문제**: OneDrive 동기화 폴더에서 `eas build` 실행 시 빌드 서버 tar 해제 Permission denied. 반드시 `C:\dev\ailon` 등 로컬 폴더로 복사 후 빌드 (상세: `mobile/CLAUDE.md`)

## Behavioral Guidelines

- **Think before coding**: State assumptions, surface tradeoffs, ask if unclear
- **Simplicity first**: Minimum code that solves the problem, no speculative features
- **Surgical changes**: Touch only what you must, match existing style
- **Goal-driven execution**: Define verifiable success criteria, loop until verified
