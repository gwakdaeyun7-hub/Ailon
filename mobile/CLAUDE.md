# mobile/CLAUDE.md — React Native (Expo) Mobile App

이 파일은 mobile/ 디렉토리(React Native + Expo + NativeWind) 작업 시 참조하는 컨텍스트입니다.

---

## Mobile App Features

### Tab 1: News Feed (index.tsx ~1560 lines)
- **Highlights**: Hero card + 2x2 grid, top 1 article per category (3 total)
- **Daily Briefing**: AI-generated 2-3 min briefing card with TTS playback (expo-speech)
- **Categories**: Horizontal scroll tabs (research / models_products / industry_business), Top 20 per category
- **Sources**: 22 source sections, Korean sources (AI타임스, GeekNews, ZDNet AI, 요즘IT) in separate tabs
- **Article Card**: display_title, one_line, key_points (3-5), why_important, background, tags, glossary, "Read Original" button (Linking.openURL). 요약 모달: F-Minimal 디자인 (소스 뱃지+날짜+카테고리, 세리프 제목, teal 배경 One Line 16pt, 번호 스텝 key_points 15pt(배경 없음), 세리프 소제목 textSecondary, 태그 pill, 원문 버튼 textPrimary 테두리)
- **Interactions**: Like/dislike (ReactionBar), comments (CommentSheet modal), share, bookmark
- **Glossary Highlighting**: Auto-detects terms in text, tap for definition popup (HighlightedText)
- **Related Articles**: Horizontal carousel in summary modal (RelatedArticlesSection)
- **Timeline**: Vertical timeline of past coverage (TimelineSection)
- **Pull-to-refresh**, skeleton loading, batch stats fetching

### Tab 2: Snaps (snaps.tsx) — Principles/Daily Learning
- **단일 스크롤 자유 형식 텍스트 뷰**: 기존 3-카드 + 딥다이브 탭 구조 제거, 수식이 텍스트 속에 녹아든 자연스러운 읽기 경험
- **SnapsContentRenderer** (`components/snaps/SnapsContentRenderer.tsx`): 마크다운 파싱 + 블록 렌더링
  - 9가지 블록 타입: heading, formula, definition, definition_group, steps (번호 리스트 그룹), emphasis, list_item (불릿), lead, body
  - 인라인 서식: `**텍스트**` → fontWeight 700 굵은 글씨 (renderBoldText 헬퍼)
  - **lead 블록**: 콘텐츠 첫째 줄(원리 설명)을 16px/weight 500/textSecondary로 렌더링 — 히어로 제목(26pt)과 본문(15px) 사이 타이포그래피 계층
  - **definition_group 블록**: 연속 정의를 단일 컨테이너로 병합 (surface 배경, borderRadius 8, 항목 간 12dp gap). 단독 정의는 기존 DefinitionBlock 유지 (surface 배경)
  - 배경색 3-규칙: Teal(primaryLight)=수식, Beige(surface)=용어 정의(단독+그룹)+알고리즘 스텝, 없음=그 외
  - 수식 감지: LaTeX 명령, 그리스 문자, 수학 기호 패턴 (한글 25% 미만, 80자 이하), `latexToDisplay` 변환
  - 용어 정의: "term - description" 패턴 (용어 1~40자) → beige 배경 + 볼드 용어명. 첫 번째 비공백 줄은 definition 매칭 스킵 (리드/서브타이틀 오인 방지)
  - 볼드 서브헤딩: 줄 전체가 `**텍스트:**` 또는 `**텍스트**` 패턴이면 heading 블록으로 처리
  - 알고리즘 스텝: 연속 번호 리스트(1. 2. 3.)를 그룹화 → beige 배경 컨테이너
  - 강조 문장: ! 느낌표 종료 → 배경 없이 굵은 텍스트
  - 후처리: 연속 definition 블록을 definition_group으로 그룹화 (사이 spacer 흡수), ContentBlock에 `definitions?: { term: string; desc: string }[]` 필드 추가
- **buildFreeformContent**: 구조화된 Principle + DeepDive 데이터를 자유 텍스트로 조합 (curated 전용 모드에서는 content_ko/en이 이미 자유 형식 마크다운이므로 bypass됨)
- **Header**: 제목(serif 26pt), 분야 배지(superCategory 아이콘), connectionType, difficulty, readTime, keywords + 공유 아이콘(배지 행 우측). 날짜/제목 라벨/날짜 네비게이션 화살표 없음
- **connectionType**: 탭 시 educational Alert popup (direct_inspiration/structural_analogy/mathematical_foundation/conceptual_borrowing 4종)
- **4 Super Categories**: 공학(4), 자연과학(4), 형식과학(2), 응용과학(1) — 11 disciplines total
- AsyncStorage offline caching
- **Takeaway**: seed에서 전달된 핵심 인사이트 1문장, teal(primaryLight) 배경 + 시스템 기본 폰트 (색상바 없음)
- **normalizePrinciple**: snake_case 필드 폴백 (deepDiveHook, takeaway 등 신규 필드 포함)

### Tab 3: AI Tools & Tips (tools.tsx) — 준비 중
- "Coming Soon" 플레이스홀더 화면 (향후 업데이트에서 구현 예정)
- 탭 구조는 유지, 컴포넌트/훅/백엔드 생성 로직은 제거된 상태
- `generate_daily_tools()` 함수는 generate_features.py에 코드 존재하나 generate_daily.py에서 호출하지 않음

### Tab 4: Saved (saved.tsx)
- Bookmark collection with type filter (News | Principles)
- Delete with confirmation (아이콘 18px, textDim 색상)
- Real-time sync from `users/{uid}/bookmarks` subcollection
- **AI 요약 모달**: 뉴스 카드 탭 시 ArticleSummaryModal 표시 (saved.tsx 내 인라인 컴포넌트)
  - `useArticle(articleId)` 훅으로 `articles/{article_id}` 컬렉션에서 fetch
  - 모달 내용: 제목, 한줄요약(teal 배경), 핵심 포인트, 왜 중요한가, 배경, 태그, 원문 보기 버튼
  - 다국어(ko/en) 자동 분기
  - articleId 없는 이전 북마크: 안내 메시지 + 원문 링크 제공
- **날짜 표시**: 상단 배지 행에 `· 날짜` 형태로 표시 (footer에서 이동)
- **Empty state**: 비로그인→로그인 버튼, 빈 목록→"뉴스 보러가기" 버튼 (아이콘 48px)
- footer borderTop 구분선 제거, 뉴스 아닌 타입은 footer 미렌더링

### Tab 5: Profile (profile.tsx)
- **카드 그룹핑 (4+1)**: Avatar / Settings(Language+DarkMode) / Notification / More(Activity+Legal) / SignOut
- **Avatar**: 64px, 가로 배치 (flexDirection: 'row') — 이름+이메일 우측 배치
- **Settings 카드**: Language toggle (KO/EN, system language detection default) + dark/light theme switch
- **Notification 카드**: newsAlerts, commentReplies, likes (per-type toggles)
- **More 카드**: Activity + Legal links (Privacy Policy + Terms of Service, bilingual KO/EN via GitHub Pages)
- **Sign Out**: 카드 스타일 제거 → 단순 회색 텍스트 버튼
- **섹션 라벨**: 13pt, ko→letterSpacing 0, en→uppercase
- **스타일**: borderRadius 16 통일, fontWeight 제목 800 / 나머지 600

### Shared Components
- **CommentSheet**: Full-screen modal, threaded replies, author avatars, report (Flag icon) + delete (Trash icon) per comment, ReportReasonModal (4 reasons), auto-hide at 3+ reports
- **ReactionBar**: Like (count) + Comment + Share buttons
- **BookmarkButton**: Toggle bookmark with filled/stroke icon
- **HighlightedText**: Auto glossary term detection + definition modal
- **RelatedArticlesSection**: Horizontal card carousel (entity/cluster matching)
- **TimelineSection**: Vertical timeline with past article links
- **DailyBriefingCard**: 접힌 상태(TTS + 기사 수 텍스트) / 펼친 상태(도메인 도넛 차트 + 태그 클라우드 + 연구 기사 7일 스파크라인 + 브리핑 전문). 도넛 차트는 topic_cluster_id 기반 도메인 분포(Top 5 + Others) 표시, 7색 도메인 팔레트(NLP/Vision/ML/Robotics/Multimodal/Business/Others)
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
| useArticle | `articles/{article_id}` | Single article fetch (index.tsx 요약 모달, saved.tsx AI 요약 모달) |
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

### Design Principles
- **깔끔, 간단하게** — 불필요한 장식 요소, 과도한 애니메이션, 복잡한 중첩 레이아웃 지양. 콘텐츠가 곧 디자인
- **AI가 만든 티를 내지 않기** — 그라데이션 남발, 뉴모피즘, 글로우 이펙트, 과도한 아이콘 장식 등 제네릭 AI 앱 패턴 금지
- **가독성 > 장식** — 타이포그래피 계층(크기·굵기·색상)으로 정보 구조를 만들 것. 배경색·보더·그림자는 최소한으로

---

## Known Recurring Issues (Mobile)

- **index.tsx ~1560 lines**: 더 이상 inline 컴포넌트 추가 금지, components/feed/로 추출할 것 — `guard-index-bloat.sh` hook이 PreToolUse에서 자동 차단
- **TypeScript 타입 체크**: .ts/.tsx 수정 시 `mobile-typecheck.sh` hook이 `tsc --noEmit` 자동 실행 (정보 제공, 비차단)
- **EAS Build OneDrive 문제**: OneDrive 동기화 폴더에서 `eas build` 실행 시 빌드 서버 tar 해제 Permission denied. 반드시 `C:\dev\ailon` 등 로컬 폴더로 복사 후 빌드
