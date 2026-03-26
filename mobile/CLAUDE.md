# mobile/CLAUDE.md — React Native (Expo) Mobile App

이 파일은 mobile/ 디렉토리(React Native + Expo + NativeWind) 작업 시 참조하는 컨텍스트입니다.

---

## Mobile App Features

### Tab 1: News Feed (index.tsx ~1300 lines)
- **Highlights**: Hero card + 2x2 grid, top 1 article per category (3 total)
- **Daily Briefing**: AI-generated 2-3 min briefing card with TTS playback (expo-speech)
- **Categories**: Horizontal scroll tab chips (research / models_products / industry_business), Top 20 per category. 섹션 헤더 텍스트 없이 탭 칩만 표시
- **Sources**: 22 source sections, Korean sources (AI타임스, GeekNews, ZDNet AI, 요즘IT) in separate tabs. 섹션 헤더 텍스트 없이 구분선만 표시
- **Article Card**: display_title, one_line, sections (소제목+내용 2-4개), why_important, background, tags, glossary, "Read Original" button (Linking.openURL). 요약 모달: F-Minimal 디자인 (소스 뱃지+날짜+읽기시간(Clock)+카테고리, 세리프 제목, teal 배경 One Line 16pt, 소제목+내용 sections 15pt(배경 없음), 세리프 소제목 textSecondary, 태그 pill, 원문 버튼 textPrimary 테두리). 기존 Firestore key_points 데이터는 폴백 렌더링 지원
- **Interactions**: Like/dislike (ReactionBar), comments (CommentSheet modal), share (웹 공유 링크 useShareLink + 텍스트 폴백), bookmark. 소셜 기능(좋아요 숫자, 댓글)은 Firestore feature flag(`app_config/social_features`)로 조건부 표시
- **Glossary Highlighting**: Auto-detects terms in text, tap for definition popup (HighlightedText)
- **Related Articles**: Horizontal carousel in summary modal (RelatedArticlesSection)
- **Timeline**: Vertical timeline of past coverage (TimelineSection)
- **Pull-to-refresh**, skeleton loading, batch stats fetching

### Tab 2: Snaps (snaps.tsx) — Principles/Daily Learning
- **단일 스크롤 자유 형식 텍스트 뷰**: 기존 3-카드 + 딥다이브 탭 구조 제거, 수식이 텍스트 속에 녹아든 자연스러운 읽기 경험
- **SnapsContentRenderer** (`components/snaps/SnapsContentRenderer.tsx`): 마크다운 파싱 + 블록 렌더링
  - 10가지 블록 타입: heading, subheading, formula, definition, definition_group, steps (번호 리스트 그룹), emphasis, list_item (불릿), lead, body
  - 인라인 서식: `**텍스트**` → fontWeight 700 굵은 글씨 (renderBoldText 헬퍼)
  - **lead 블록**: 콘텐츠 첫째 줄(원리 설명)을 16px/weight 400/textPrimary로 렌더링 — 히어로 제목(26pt)과 본문(15px) 사이 타이포그래피 계층
  - **heading 블록**: `## 섹션 제목` → 20px Lora-Bold serif, mt:36, 2번째부터 상단 1px 구분선 + accessibilityRole="header"
  - **subheading 블록**: `**텍스트:**` 독립 줄 → 15px/weight 600 sans-serif, mt:20, mb:6 + accessibilityRole="header" — heading과 크기(20 vs 15)+서체(serif vs sans)로 계층 구분
  - **definition_group 블록**: 연속 정의를 단일 컨테이너로 병합 (surface 배경, borderRadius 8, 항목 간 12dp gap). 단독 정의는 기존 DefinitionBlock 유지 (surface 배경)
  - 배경색 3-규칙: Teal(primaryLight)=수식, Beige(surface)=용어 정의(단독+그룹)+알고리즘 스텝, 없음=그 외
  - 수식 감지: LaTeX 명령, 그리스 문자, 수학 기호 패턴 (한글 25% 미만, 80자 이하), `latexToDisplay` 변환
  - 용어 정의: "term - description" 패턴 (용어 1~60자) → beige 배경 + 볼드 용어명. 첫 번째 비공백 줄은 definition 매칭 스킵 (리드/서브타이틀 오인 방지)
  - 볼드 서브헤딩: 줄 전체가 `**텍스트:**` 또는 `**텍스트**` 패턴이면 subheading 블록으로 처리 (heading과 별도 타이포그래피)
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
- **AI 요약 모달**: 뉴스 카드 탭 시 ArticleSummaryModal 바텀 시트 표시 (saved.tsx 내 인라인 컴포넌트, index.tsx SummaryModalContent와 동일 디자인)
  - `useArticle(articleId)` 훅으로 `articles/{article_id}` 컬렉션에서 fetch
  - 바텀 시트 디자인: 썸네일 이미지, 소스 뱃지+날짜+읽기시간(Clock)+카테고리 행, HighlightedText(용어집 하이라이팅), 용어집 아코디언, Related Articles, 하단 액션 바(좋아요/댓글/공유(웹 공유 링크 useShareLink)), Toast, CommentSheet 통합
  - 다국어(ko/en) 자동 분기 (articleHelpers.ts 공용 헬퍼 사용)
  - articleId 없는 이전 북마크: 안내 메시지 + 원문 링크 제공
- **날짜 표시**: 상단 배지 행에 `· 날짜` 형태로 표시 (footer에서 이동)
- **Empty state**: 비로그인→로그인 버튼, 빈 목록→"뉴스 보러가기" 버튼 (아이콘 48px)
- footer borderTop 구분선 제거, 뉴스 아닌 타입은 footer 미렌더링

### Tab 5: Profile (profile.tsx)
- **카드 그룹핑 (6+2)**: Avatar(사진+편집) / ReadStatsCard / Settings(Language+DarkMode+NotificationToggle) / Notification(per-type) / More(Activity+Legal) / SignOut / DeleteAccount / AppVersion
- **Avatar**: 64px, 가로 배치 (flexDirection: 'row') — 이름+이메일 우측 배치. photoURL 있으면 Image 표시, 없으면 이니셜. 편집 버튼(Pencil) → EditProfileModal
- **EditProfileModal** (`components/profile/EditProfileModal.tsx`): 닉네임 변경(30자 제한) + 사진 변경(expo-image-picker → Firebase Storage `profile_photos/{uid}`) + 사진 삭제
- **ReadStatsCard** (`components/profile/ReadStatsCard.tsx`): 이번 주/총 읽음/저장됨 3열 통계 (`useReadStats`)
- **Settings 카드**: Language toggle (EN/KO) + dark/light theme switch + NotificationToggle (알림 마스터 on/off)
- **NotificationToggle** (`components/profile/NotificationToggle.tsx`): 전체 알림 마스터 on/off — fcmToken/expoPushToken 등록/해제, Firestore `notificationsEnabled` 필드
- **Notification 카드**: newsAlerts, commentReplies, likes (per-type toggles)
- **More 카드**: Activity + Legal links (Privacy Policy + Terms of Service, bilingual KO/EN via GitHub Pages)
- **Sign Out**: 카드 스타일 제거 → 단순 회색 텍스트 버튼
- **DeleteAccountSection** (`components/profile/DeleteAccountSection.tsx`): 빨간 텍스트 + 확인 Alert → `deleteUserData` Cloud Function 호출 (8단계 계정 삭제)
- **AppVersionLabel** (`components/profile/AppVersionLabel.tsx`): expo-constants 버전 표시
- **섹션 라벨**: 13pt, ko→letterSpacing 0, en→uppercase
- **스타일**: borderRadius 16 통일, fontWeight 제목 800 / 나머지 600

### Shared Components
- **CommentSheet**: Full-screen modal, threaded replies, author avatars, report (Flag icon) + delete (Trash icon) per comment, ReportReasonModal (4 reasons), auto-hide at 3+ reports
- **ReactionBar**: Like (count) + Comment + Share buttons (`articleId` prop 시 웹 공유 URL)
- **BookmarkButton**: Toggle bookmark with filled/stroke icon
- **HighlightedText**: Auto glossary term detection + definition modal
- **RelatedArticlesSection**: Horizontal card carousel (entity/cluster matching)
- **TimelineSection**: Vertical timeline with past article links
- **DailyBriefingCard**: 접힌 상태(TTS + 라벨) / 펼친 상태(도메인 도넛 차트 + 태그 클라우드 + 연구 기사 7일 스파크라인 + 브리핑 전문). 도넛 차트는 topic_cluster_id 기반 도메인 분포(Top 5 + Others) 표시, 도메인 팔레트(NLP/Vision/ML/Robotics/Multimodal/Business/Infra/Regulation/Audio/Security/Science/Dev/Others). 핫토픽은 lang별 hot_topics/hot_topics_en 분기 (EN 없으면 KO 폴백)
- **ShareCard**: 오프스크린 렌더링 → react-native-view-shot 캡처 → expo-sharing 공유. 텍스트 폴백 내장 (현재 미사용 — index.tsx/saved.tsx 모두 useShareLink로 전환)
- **SideDrawer**: Animated left panel (82% width, max 320px)
- **ShowMoreButton**: 더보기/접기 pill 버튼 + ChevronDown/Up 아이콘 (카테고리, GeekNews 세로 리스트 공용)

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
| useNotifications | `users/{uid}` | Expo + FCM token registration, Android channels (news/social) + cold start router readiness detection |
| useNotificationSettings | `users/{uid}/preferences` | Per-type notification toggles |
| useReportComment | `reports`, `comments/{docId}/entries` | Comment reporting with dedup + reportCount increment |
| useShareImage | react-native-view-shot + expo-sharing | ShareCard 캡처 → 이미지 공유 (현재 미사용 — useShareLink로 대체) |
| useShareLink | OS Share API | 웹 공유 페이지 URL 생성 + OS 공유 시트 (index.tsx, saved.tsx, ReactionBar) |
| useReadStats | `users/{uid}/read_history` | Read tracking + weekly/total/saved stats |
| useFeatureFlags | `app_config/social_features` | Social feature flags (like counts, comments visibility) |

### Contexts
- **LanguageContext**: EN/KO toggle (default English), `t(key)` translation function, AsyncStorage persist
- **ThemeContext**: Dark/light mode, system-aware default, color tokens
- **DrawerContext**: Side drawer animation state (translateX, overlayOpacity)

### Styling
- **NativeWind** (TailwindCSS for RN) with dark-first theme
- **colors.ts**: Light (white bg, black text) / Dark (teal/cyan accent), ~50 color tokens (21개 dead token 제거 후)
- **theme.ts**: Spacing, font sizes, all radius=0 (pixel art/brutalist), cardShadow 제거(elevation 0), pixelShadow(offset 3px), Lora serif font + 4 pixel fonts, MIN_TOUCH_TARGET=44
- **Pixel Fonts**: `pixel: 'PressStart2P_400Regular'` (EN headings), `pixelBody: 'Silkscreen_400Regular'` (EN small), `pixelBold: 'Silkscreen_700Bold'` (EN bold small), `pixelKo: 'DotGothic16_400Regular'` (KO pixel)
- Primary: Teal (#5EEAD4 light/dark 통일), Accent: Orange (#B45309 light, #F59E0B dark)
- Light Text: 모든 텍스트 #000000 검정 통일 (textPrimary/textSecondary/textDim 동일값)

### Design Principles
- **Pixel Art / Brutalist** — borderRadius 전부 0, borderWidth 2px flat borders, cardShadow 제거 (그림자 없음), pixelShadow(offset 3) 선택적 사용. 모든 컴포넌트에 적용
- **깔끔, 간단하게** — 불필요한 장식 요소, 과도한 애니메이션, 복잡한 중첩 레이아웃 지양. 콘텐츠가 곧 디자인
- **AI가 만든 티를 내지 않기** — 그라데이션 남발, 뉴모피즘, 글로우 이펙트, 과도한 아이콘 장식 등 제네릭 AI 앱 패턴 금지
- **가독성 > 장식** — 타이포그래피 계층(크기·굵기·색상)으로 정보 구조를 만들 것. 배경색·보더·그림자는 최소한으로

---

## Known Recurring Issues (Mobile)

- **index.tsx ~1300 lines**: 더 이상 inline 컴포넌트 추가 금지, components/feed/로 추출할 것 — `guard-index-bloat.sh` hook이 PreToolUse에서 자동 차단
- **TypeScript 타입 체크**: .ts/.tsx 수정 시 `mobile-typecheck.sh` hook이 `tsc --noEmit` 자동 실행 (정보 제공, 비차단)
- **EAS Build OneDrive 문제**: OneDrive 동기화 폴더에서 `eas build` 실행 시 빌드 서버 tar 해제 Permission denied. 반드시 `C:\dev\ailon` 등 로컬 폴더로 복사 후 빌드

## Security Notes

- **딥링크 화이트리스트**: `useNotifications`에서 `VALID_TABS` 배열로 알림 딥링크 경로 검증 — 새 탭 추가 시 화이트리스트 업데이트 필요
- **Production console 제거**: `babel.config.js`에서 `NODE_ENV === "production"` 시 `transform-remove-console` 플러그인으로 console.* 자동 제거
- **에러 핸들링**: `useComments` deleteComment 등 Firestore 쓰기 작업은 try-catch 필수
