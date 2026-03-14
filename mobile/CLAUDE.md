# mobile/CLAUDE.md — React Native (Expo) Mobile App

이 파일은 mobile/ 디렉토리(React Native + Expo + NativeWind) 작업 시 참조하는 컨텍스트입니다.

---

## Mobile App Features

### Tab 1: News Feed (index.tsx ~1500 lines)
- **Highlights**: Hero card + 2x2 grid, top 1 article per category (3 total)
- **Daily Briefing**: AI-generated 2-3 min briefing card with TTS playback (expo-speech)
- **Categories**: Horizontal scroll tabs (research / models_products / industry_business), Top 20 per category
- **Sources**: 22 source sections, Korean sources (AI타임스, GeekNews, ZDNet AI, 요즘IT) in separate tabs
- **Article Card**: display_title, one_line, key_points (3), why_important, background, tags, glossary, "AI Summary" badge, "Read Original" button (Linking.openURL)
- **Interactions**: Like/dislike (ReactionBar), comments (CommentSheet modal), share, bookmark
- **Glossary Highlighting**: Auto-detects terms in text, tap for definition popup (HighlightedText)
- **Related Articles**: Horizontal carousel in summary modal (RelatedArticlesSection)
- **Timeline**: Vertical timeline of past coverage (TimelineSection)
- **Pull-to-refresh**, skeleton loading, batch stats fetching

### Tab 2: Snaps (snaps.tsx) — Principles/Daily Learning
- **단일 스크롤 자유 형식 텍스트 뷰**: 기존 3-카드 + 딥다이브 탭 구조 제거, 수식이 텍스트 속에 녹아든 자연스러운 읽기 경험
- **SnapsContentRenderer** (`components/snaps/SnapsContentRenderer.tsx`): 마크다운 파싱 + 블록 렌더링
  - 7가지 블록 타입: heading, formula, definition, steps (번호 리스트 그룹), emphasis, list_item (불릿), body
  - 인라인 서식: `**텍스트**` → fontWeight 700 굵은 글씨 (renderBoldText 헬퍼)
  - 배경색 3-규칙: Teal(primaryLight)=수식, Beige(surface)=용어 정의+알고리즘 스텝, 없음=그 외
  - 수식 감지: LaTeX 명령, 그리스 문자, 수학 기호 패턴 (한글 25% 미만, 80자 이하), `latexToDisplay` 변환
  - 용어 정의: "term - description" 패턴 (용어 1~40자) → beige 배경 + 볼드 용어명
  - 알고리즘 스텝: 연속 번호 리스트(1. 2. 3.)를 그룹화 → beige 배경 컨테이너
  - 강조 문장: ! 느낌표 종료 → 배경 없이 굵은 텍스트
- **buildFreeformContent**: 구조화된 Principle + DeepDive 데이터를 자유 텍스트로 조합 (curated 전용 모드에서는 content_ko/en이 이미 자유 형식 마크다운이므로 bypass됨)
- **Header**: 제목(serif 26pt), 분야 배지(superCategory 아이콘), connectionType, difficulty, readTime, keywords
- **connectionType**: 탭 시 educational Alert popup (direct_inspiration/structural_analogy/mathematical_foundation 설명)
- **4 Super Categories**: 공학(5), 자연과학(4), 형식과학(2), 응용과학(1) — 12 disciplines total
- Date navigation, AsyncStorage offline caching
- **normalizePrinciple**: snake_case 필드 폴백 (deepDiveHook, takeaway 등 신규 필드 포함)

### Tab 3: AI Tools & Tips (tools.tsx) — 준비 중
- "Coming Soon" 플레이스홀더 화면 (향후 업데이트에서 구현 예정)
- 탭 구조는 유지, 컴포넌트/훅/백엔드 생성 로직은 제거된 상태
- `generate_daily_tools()` 함수는 generate_features.py에 코드 존재하나 generate_daily.py에서 호출하지 않음

### Tab 4: Saved (saved.tsx)
- Bookmark collection with type filter (News | Principles)
- Delete with confirmation, "View Original" for news
- Real-time sync from `users/{uid}/bookmarks` subcollection

### Tab 5: Profile (profile.tsx)
- Google Sign-In authentication
- Language toggle (KO/EN, system language detection default), dark/light theme switch
- Notification settings: newsAlerts, commentReplies, likes (per-type toggles)
- Legal links: Privacy Policy + Terms of Service (bilingual KO/EN via GitHub Pages)

### Shared Components
- **CommentSheet**: Full-screen modal, threaded replies, author avatars, report (Flag icon) + delete (Trash icon) per comment, ReportReasonModal (4 reasons), auto-hide at 3+ reports
- **ReactionBar**: Like (count) + Comment + Share buttons
- **BookmarkButton**: Toggle bookmark with filled/stroke icon
- **HighlightedText**: Auto glossary term detection + definition modal
- **RelatedArticlesSection**: Horizontal card carousel (entity/cluster matching)
- **TimelineSection**: Vertical timeline with past article links
- **DailyBriefingCard**: 접힌 상태(TTS + 미니 도넛 링) / 펼친 상태(도메인 도넛 차트 + 태그 클라우드 + 스파크라인 + 브리핑 전문). 도넛 차트는 topic_cluster_id 기반 도메인 분포(Top 5 + Others) 표시, 7색 도메인 팔레트(NLP/Vision/ML/Robotics/Multimodal/Business/Others)
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
| useNotifications | `users/{uid}` | Expo + FCM token registration, Android channels (news/social) |
| useNotificationSettings | `users/{uid}/preferences` | Per-type notification toggles |
| useReportComment | `reports`, `comments/{docId}/entries` | Comment reporting with dedup + reportCount increment |

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

## Known Recurring Issues (Mobile)

- **index.tsx ~1500 lines**: 더 이상 inline 컴포넌트 추가 금지, components/feed/로 추출할 것 — `guard-index-bloat.sh` hook이 PreToolUse에서 자동 차단
- **TypeScript 타입 체크**: .ts/.tsx 수정 시 `mobile-typecheck.sh` hook이 `tsc --noEmit` 자동 실행 (정보 제공, 비차단)
- **EAS Build OneDrive 문제**: OneDrive 동기화 폴더에서 `eas build` 실행 시 빌드 서버 tar 해제 Permission denied. 반드시 `C:\dev\ailon` 등 로컬 폴더로 복사 후 빌드
