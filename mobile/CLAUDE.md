# mobile/CLAUDE.md — React Native (Expo) Mobile App

이 파일은 mobile/ 디렉토리(React Native + Expo + NativeWind) 작업 시 참조하는 컨텍스트입니다.

---

## Mobile App Features

### Tab 1: News Feed (index.tsx ~1300 lines)
- **Highlights**: Hero card + 2x2 grid, top 1 article per category (3 total)
- **Daily Briefing**: AI-generated 2-3 min briefing card with TTS playback (expo-speech)
- **Categories**: Horizontal scroll tab chips (research / models_products / industry_business), Top 20 per category. 섹션 헤더 텍스트 없이 탭 칩만 표시
- **Sources**: 22 source sections, Korean sources (AI타임스, GeekNews, ZDNet AI, 요즘IT) in separate tabs. 섹션 헤더 텍스트 없이 구분선만 표시
- **Article Card**: display_title, one_line, sections (소제목+내용 2-4개), why_important, background, tags, glossary, "Read Original" button (openArticle → expo-web-browser In-App Browser). 요약 모달: F-Minimal 디자인 (소스 뱃지+읽기시간(Clock)+날짜(우측), 배경↔본문 구분선, 세리프 제목, One Line 16pt(장식 없음), 소제목+내용 sections 15pt(배경 없음), 본문↔왜중요해요 구분선, 세리프 소제목 textSecondary, 태그 pill, 원문 버튼 textPrimary 테두리). 기존 Firestore key_points 데이터는 폴백 렌더링 지원
- **Interactions**: Like/dislike, comments (CommentSheet modal), share (웹 공유 링크 useShareLink + 텍스트 폴백), bookmark. 소셜 기능(좋아요 숫자, 댓글)은 Firestore feature flag(`app_config/social_features`)로 조건부 표시
- **Glossary Highlighting**: Auto-detects terms in text, tap for definition popup (HighlightedText)
- **Related Articles**: Horizontal carousel in summary modal (RelatedArticlesSection)
- **Pull-to-refresh**, skeleton loading, batch stats fetching

### Tab 2: Snaps (snaps.tsx ~267 lines) — 45개 학문원리 텍스트 브라우저
- **45개 전체 학문원리 브라우저**: `labPrinciplesData.json` 기반 2단 탭 구조로 모든 curated 원리의 텍스트/수식 콘텐츠 자유 탐색 (시뮬레이션 없음 — Lab 탭에서만 표시)
  - **1단 탭**: Super Category (공학/자연과학/형식과학/응용과학) — 4개 pill 탭
  - **2단 탭**: 카테고리 내 원리 목록 (horizontal scroll, teal 하단 인디케이터)
  - 카테고리 전환 시 원리 탭 자동 리셋 + 스크롤 초기화
- **데이터**: `lib/labPrinciplesData.json` (45개 원리 콘텐츠 KO/EN 번들) + `lib/labPrinciples.ts` (타입, 그룹핑 헬퍼)
- **콘텐츠 렌더링**: 분야 배지 (superCategory·discipline) + difficulty·connectionType 태그 + 세리프 제목(22pt) + **SnapsContentRenderer** (학문스낵 마크다운 전체 표시) + Takeaway (teal 배경)
- **SnapsContentRenderer** (`components/snaps/SnapsContentRenderer.tsx`): 마크다운 파싱 + 블록 렌더링
  - 11가지 블록 타입: heading, subheading, formula, definition, definition_group, steps (번호 리스트 그룹), emphasis, list_item (불릿), lead, body, simulation (`:::sim <id>` 파서 → simId 필드)
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
- **connectionType**: 탭 시 educational Alert popup (direct_inspiration/structural_analogy/mathematical_foundation/conceptual_borrowing 4종)
- **4 Super Categories**: 공학(4), 자연과학(4), 형식과학(2), 응용과학(1) — 11 disciplines total

### Tab 3: Lab (tools.tsx ~216 lines) — 시뮬레이션 전용 브라우저
- **시뮬레이션 전용 브라우저**: 2단 탭 구조로 45개 원리의 인터랙티브 시뮬레이션만 표시 (텍스트 콘텐츠는 Snaps 탭)
  - **1단 탭**: Super Category (공학/자연과학/형식과학/응용과학) — 4개 pill 탭
  - **2단 탭**: 카테고리 내 원리 목록 (horizontal scroll, teal 하단 인디케이터) + **teal dot indicator** (시뮬레이션 존재 여부 표시, 6px 원형)
  - 카테고리 전환 시 원리 탭 자동 리셋 + 스크롤 초기화
- **데이터**: `lib/labPrinciples.ts` (타입, 그룹핑 헬퍼, sim 매핑) — 콘텐츠 JSON 미사용 (시뮬레이션 전용)
- **시뮬레이션 있는 원리**: 제목(18pt bold) + InteractiveSim 표시
- **시뮬레이션 없는 원리**: "시뮬레이션 준비 중" empty state (번역 키: `lab.sim_coming_soon`, `lab.sim_coming_soon_desc`)
- **SEED_TO_SIM** (`lib/labPrinciples.ts` 내) — 45개 매핑:
  - Optimization: `opt_simulated_annealing→sa`, `opt_gradient_descent→gd`, `opt_convex_optimization→convex`, `opt_bayesian_optimization→bayesopt`
  - Control Engineering: `ctrl_optimal_control→dp`, `ctrl_kalman_filter→kalman`, `ctrl_pid_control→pid`, `ctrl_cybernetics→cybernetics`, `ctrl_model_predictive_control→mpc`, `ctrl_lyapunov_stability→lyapunov`
  - Electrical Engineering: `ee_fourier_transform→fourier`, `ee_nyquist_sampling→nyquist`, `ee_quantization→quantize`
  - Information Theory: `info_shannon_entropy→entropy`, `info_kl_divergence→kl`, `info_channel_capacity→channel`, `info_mutual_information→mutual`
  - Physics: `phys_boltzmann_distribution→boltzmann`, `phys_diffusion_process→diffusion`, `phys_hopfield_network→hopfield`, `phys_renormalization_group→renorm`
  - Biology: `bio_natural_selection→evolution`, `bio_hebbian_learning→hebbian`, `bio_swarm_intelligence→swarm`
  - Neuroscience: `neuro_visual_cortex_cnn→visualcortex`, `neuro_dopamine_td→dopamine`, `neuro_attention_mechanism→attention`, `neuro_predictive_coding→predcoding`, `neuro_experience_replay→replay`
  - Chemistry: `chem_molecular_graph→molgraph`
  - Mathematics: `math_linear_algebra_nn→linalg`, `math_universal_approximation→uat`, `math_curse_dimensionality→curse`, `math_information_geometry→infogeo`, `math_graph_theory_gnn→gnn`, `math_manifold_hypothesis→manifold`
  - Statistics: `stat_bayesian_inference→bayesian`, `stat_bias_variance_tradeoff→biasvar`, `stat_maximum_likelihood→mle`, `stat_bootstrapping→bootstrap`, `stat_markov_chain_monte_carlo→mcmc`
  - Robotics: `robo_subsumption→subsumption`, `robo_imitation_learning→imitation`
  - Medicine: `med_epidemiology_network→epidemic`, `med_clinical_trial_design→clinical`
- **SIMULATIONS 레지스트리**: `components/snaps/simulations/index.ts` — `Record<string, (isDark, lang) => string>`. 현재 45개:
  - `sa` — Simulated Annealing: 5가지 목적함수(+Deceptive), 파라미터 슬라이더, Advanced 토글(냉각 스케줄 3종 Geometric/Logarithmic/Linear + Steps/Temp), 에너지 지형 플롯(탭으로 초기 위치 설정, 온도별 마커 색상), 수렴 그래프, 수용 확률 실시간 표시(Step/Pause 모드), 완료 시 전역/지역 최적해 판정(런타임 수치 탐색), 경계 반사(reflection)
  - `gd` — Gradient Descent: 2D 등고선 맵에서 Vanilla GD/Momentum/Adam 3종 경로 비교
  - `swarm` — Swarm Intelligence (Boid): Separation/Alignment/Cohesion 토글+가중치, 3 프리셋(무작위 방황/조기 수렴/균형 군집 — 피드백 균형 체험), 규칙-피드백 매핑 힌트, 장애물/먹이(attractor), 실시간 통계+교육적 판정
  - `bayesian` — Bayesian Inference: Beta 분포 Prior→Posterior 업데이트, 동전 던지기 인터랙션
  - `convex`, `bayesopt`, `dp`, `kalman`, `pid`, `cybernetics`, `mpc`, `lyapunov`, `fourier`, `nyquist`, `quantize`, `entropy`, `kl`, `channel`, `mutual`, `boltzmann`, `diffusion`, `hopfield`, `renorm`, `evolution`, `hebbian`, `visualcortex`, `dopamine`, `attention`, `predcoding`, `replay`, `molgraph`, `linalg`, `uat`, `curse`, `infogeo`, `gnn`, `manifold`, `biasvar`, `mle`, `bootstrap`, `mcmc`, `subsumption`, `imitation`, `epidemic`, `clinical`
- **시뮬레이션 공통**: self-contained HTML/JS/Canvas, KO/EN 바이링구얼, dark/light 테마, 패널 borderRadius 8px 통일
  - **AI Lens / AI Bridge** (12개 sim): 학문 원리↔AI 해석을 연결하는 토글 또는 주석. Tier 1(레이블/주석 추가 8개: visualcortex, predcoding, mle, entropy, kl, clinical, subsumption, attention) + Tier 2(토글/모드 추가 4개: fourier, quantize, gd, gnn). 패턴: 기존 시뮬레이션 파라미터를 AI 용어로 재해석하는 듀얼 레이블·주석·모드 전환 (Boltzmann 패턴 참조)
- **이전 모드 복원**: 기존 daily-principle 모드(usePrinciple() → 당일 원리 1개 표시)는 git commit `85173a6` 이전 tools.tsx로 복원 가능
- **탭 아이콘**: FlaskConical (lucide), 라벨 `tab.lab`

### Tab 4: Saved (saved.tsx)
- Bookmark collection with type filter (News | Principles)
- Delete with confirmation (아이콘 18px, textDim 색상)
- Real-time sync from `users/{uid}/bookmarks` subcollection
- **AI 요약 모달**: 뉴스 카드 탭 시 ArticleSummaryModal 바텀 시트 표시 (saved.tsx 내 인라인 컴포넌트, index.tsx SummaryModalContent와 동일 디자인)
  - `useArticle(articleId)` 훅으로 `articles/{article_id}` 컬렉션에서 fetch
  - 바텀 시트 디자인: 썸네일 이미지, 소스 뱃지+읽기시간(Clock)+날짜(우측) 행, HighlightedText(용어집 하이라이팅), 용어집 아코디언, Related Articles, 하단 액션 바(좋아요/댓글/공유(웹 공유 링크 useShareLink)), Toast, CommentSheet 통합
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
- **Notification 카드**: newsAlerts, commentReplies, likes (per-type toggles) — 마스터 토글 off 시 비활성(opacity 0.4 + disabled)
- **More 카드**: Activity + Legal links (Privacy Policy + Terms of Service, bilingual KO/EN via GitHub Pages)
- **Sign Out**: 카드 스타일 제거 → 단순 회색 텍스트 버튼
- **DeleteAccountSection** (`components/profile/DeleteAccountSection.tsx`): 빨간 텍스트 + 확인 Alert → `deleteUserData` Cloud Function 호출 (8단계 계정 삭제)
- **AppVersionLabel** (`components/profile/AppVersionLabel.tsx`): expo-constants 버전 표시
- **섹션 라벨**: 13pt, ko→letterSpacing 0, en→uppercase
- **스타일**: borderRadius 16 통일, fontWeight 제목 800 / 나머지 600

### Shared Components
- **CommentSheet**: Full-screen modal, threaded replies, author avatars, report (Flag icon) + delete (Trash icon) per comment, ReportReasonModal (4 reasons), auto-hide at 3+ reports
- **BookmarkButton**: Toggle bookmark with filled/stroke icon
- **HighlightedText**: Auto glossary term detection + definition modal
- **RelatedArticlesSection**: Horizontal card carousel (entity/cluster matching)
- **DailyBriefingCard**: 접힌 상태(TTS + 라벨) / 펼친 상태(도메인 도넛 차트 + 태그 클라우드 + 연구 기사 7일 스파크라인 + 브리핑 전문). 도넛 차트는 topic_cluster_id 기반 도메인 분포(Top 5 + Others) 표시, 도메인 팔레트(NLP/Vision/ML/Robotics/Multimodal/Business/Infra/Regulation/Audio/Security/Science/Dev/Others). 핫토픽은 lang별 hot_topics/hot_topics_en 분기 (EN 없으면 KO 폴백)
- **SideDrawer**: Animated left panel (82% width, max 320px)
- **ShowMoreButton**: 더보기/접기 pill 버튼 + ChevronDown/Up 아이콘 (카테고리, GeekNews 세로 리스트 공용)
- **InteractiveSim** (`components/snaps/InteractiveSim.tsx`): WebView wrapper for simulations. react-native-webview lazy import (네이티브 모듈 없으면 graceful fallback). theme(isDark)/lang aware, 동적 높이 조절

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
| useNotifications | `users/{uid}` | Expo + FCM token registration (notificationsEnabled 마스터 토글 확인 후), Android channels (news/social) + cold start router readiness detection |
| useNotificationSettings | `users/{uid}/preferences` | Per-type notification toggles |
| useReportComment | `reports`, `comments/{docId}/entries` | Comment reporting with dedup + reportCount increment |
| useShareLink | OS Share API | 웹 공유 페이지 URL 생성 + 텍스트 폴백 + OS 공유 시트 (index.tsx, saved.tsx) |
| useReadStats | `users/{uid}/read_history` | Read tracking + weekly/total/saved stats |
| useFeatureFlags | `app_config/social_features` | Social feature flags (like counts, comments visibility) |

### Contexts
- **LanguageContext**: EN/KO toggle (default English), `t(key)` translation function, AsyncStorage persist
- **ThemeContext**: Dark/light mode, system-aware default, color tokens
- **DrawerContext**: Side drawer animation state (translateX, overlayOpacity)

### Styling
- **NativeWind** (TailwindCSS for RN) with dark-first theme
- **colors.ts**: Light (white bg, black text) / Dark (teal/cyan accent), ~50 color tokens (21개 dead token 제거 후)
- **theme.ts**: Spacing, font sizes, soft borderRadius (8~16), subtle cardShadow (elevation 2~4), Lora serif font, MIN_TOUCH_TARGET=44
- Primary: Teal (#5EEAD4 light/dark 통일), Accent: Orange (#B45309 light, #F59E0B dark)
- Light Text: 모든 텍스트 #000000 검정 통일 (textPrimary/textSecondary/textDim 동일값)

### Design Principles
- **부드럽고 모던한 톤** — 적절한 borderRadius(8~16), 미묘한 그림자(subtle shadow)로 깊이감 부여, 부드러운 곡선과 여백으로 친근한 느낌. 딱딱하거나 날카로운 요소 지양
- **깔끔, 간단하게** — 불필요한 장식 요소, 과도한 애니메이션, 복잡한 중첩 레이아웃 지양. 콘텐츠가 곧 디자인
- **AI가 만든 티를 내지 않기** — 그라데이션 남발, 뉴모피즘, 글로우 이펙트, 과도한 아이콘 장식 등 제네릭 AI 앱 패턴 금지
- **가독성 > 장식** — 타이포그래피 계층(크기·굵기·색상)으로 정보 구조를 만들 것. 배경색·보더·그림자는 최소한으로

---

## Known Recurring Issues (Mobile)

- **index.tsx ~1300 lines**: 더 이상 inline 컴포넌트 추가 금지, components/feed/로 추출할 것 — `guard-index-bloat.sh` hook이 PreToolUse에서 자동 차단
- **TypeScript 타입 체크**: .ts/.tsx 수정 시 `mobile-typecheck.sh` hook이 `tsc --noEmit` 자동 실행 (정보 제공, 비차단)
- **EAS Build OneDrive 문제**: OneDrive 동기화 폴더에서 `eas build` 실행 시 빌드 서버 tar 해제 Permission denied. 반드시 `C:\dev\ailon` 등 로컬 폴더로 복사 후 빌드
- **react-native-webview 네이티브 모듈**: Lab 탭 시뮬레이션에 필요. 네이티브 모듈이므로 추가/업데이트 시 dev client 재빌드 필요 (hot reload 불가). InteractiveSim은 lazy import로 모듈 미설치 시 fallback 표시

## Security Notes

- **딥링크 화이트리스트**: `useNotifications`에서 `VALID_TABS` 배열로 알림 딥링크 경로 검증 — 새 탭 추가 시 화이트리스트 업데이트 필요
- **Production console 제거**: `babel.config.js`에서 `NODE_ENV === "production"` 시 `transform-remove-console` 플러그인으로 console.* 자동 제거
- **에러 핸들링**: `useComments` deleteComment 등 Firestore 쓰기 작업은 try-catch 필수
