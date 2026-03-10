# Ailon AI News App - 6 New Features UI/UX Specification

**Date**: 2026-02-27
**Platform**: React Native (Expo Router)
**Design System Base**: `mobile/lib/theme.ts` tokens + `mobile/lib/colors.ts`

---

## Table of Contents

1. [Design System Extensions](#1-design-system-extensions)
2. [Feature 1: AI News Timeline](#2-feature-1-ai-news-timeline)
3. [Feature 2: Smart Daily Briefing](#3-feature-2-smart-daily-briefing)
4. [Feature 3: Related Articles](#4-feature-3-related-articles)
5. [Feature 4: AI Glossary](#5-feature-4-ai-glossary)
6. [Feature 5: Personalized Feed](#6-feature-5-personalized-feed)
7. [Feature 6: AI News Quiz](#7-feature-6-ai-news-quiz)
8. [Translation Keys](#8-translation-keys)
9. [Color Token Extensions](#9-color-token-extensions)

---

## 1. Design System Extensions

### New Color Tokens

Add to `mobile/lib/colors.ts`:

```typescript
// LightColors additions
timelineLine: '#E0E0E0',
timelineNode: '#6366F1',
timelineNodeBg: '#EDE9FE',
briefingGradientStart: '#1E3A5F',
briefingGradientEnd: '#0F172A',
briefingAccent: '#60A5FA',
relatedCardBorder: '#E5E7EB',
glossaryHighlight: '#6D28D9',
glossaryHighlightBg: '#F5F3FF',
glossaryPopoverBg: '#FFFFFF',
glossaryPopoverShadow: '#00000020',
personalizedBg: '#FFF7ED',
personalizedAccent: '#F59E0B',
personalizedReasonBg: '#FFFBEB',
quizCorrect: '#16A34A',
quizCorrectBg: '#F0FDF4',
quizIncorrect: '#DC2626',
quizIncorrectBg: '#FEF2F2',
quizOptionBg: '#F9FAFB',
quizOptionBorder: '#E5E7EB',
quizOptionSelected: '#3B82F6',
quizProgressBg: '#E5E7EB',
quizProgressFill: '#3B82F6',
audioPlayBg: '#EFF6FF',
audioPlayIcon: '#2563EB',

// DarkColors additions
timelineLine: '#3A3A3A',
timelineNode: '#818CF8',
timelineNodeBg: '#2D2650',
briefingGradientStart: '#1E293B',
briefingGradientEnd: '#0F172A',
briefingAccent: '#93C5FD',
relatedCardBorder: '#2C2C2C',
glossaryHighlight: '#A78BFA',
glossaryHighlightBg: '#1E1B2E',
glossaryPopoverBg: '#2A2A2A',
glossaryPopoverShadow: '#00000060',
personalizedBg: '#1C1917',
personalizedAccent: '#FBBF24',
personalizedReasonBg: '#1C1917',
quizCorrect: '#4ADE80',
quizCorrectBg: '#052E16',
quizIncorrect: '#FF5252',
quizIncorrectBg: '#3D1F1F',
quizOptionBg: '#1E1E1E',
quizOptionBorder: '#2C2C2C',
quizOptionSelected: '#64B5F6',
quizProgressBg: '#2C2C2C',
quizProgressFill: '#64B5F6',
audioPlayBg: '#1A2332',
audioPlayIcon: '#64B5F6',
```

### New Theme Tokens

Add to `mobile/lib/theme.ts`:

```typescript
export const AnimationDuration = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

export const ZIndex = {
  popover: 100,
  modal: 50,
  overlay: 40,
  floating: 30,
} as const;
```

---

## 2. Feature 1: AI News Timeline

### Purpose
사용자가 특정 뉴스 토픽의 시간 흐름을 파악할 수 있도록, 요약 모달 내에서 관련 기사들의 시간순 타임라인을 제공한다.

### Placement
`SummaryModalContent` 내부, "왜 중요해요?" 섹션과 태그 섹션 사이에 접이식(collapsible) 섹션으로 삽입.

### Component Structure

```
SummaryModalContent
  +-- ...existing sections...
  +-- TimelineSection (new)
  |     +-- TimelineToggle (Pressable header)
  |     +-- TimelineList (conditional render)
  |           +-- TimelineNode (repeated)
  |                 +-- TimelineDot
  |                 +-- TimelineLine
  |                 +-- TimelineContent
  |                       +-- TimelineDate
  |                       +-- TimelineTitle
  |                       +-- TimelineOneLiner
```

### File: `mobile/components/shared/TimelineSection.tsx`

### Layout Specification

```
TimelineSection container:
  marginTop: 0
  marginBottom: Spacing.lg (16)
  paddingHorizontal: 0 (inherits parent's 20px)

TimelineToggle (header):
  flexDirection: 'row'
  alignItems: 'center'
  justifyContent: 'space-between'
  padding: Spacing.md + 2 (14)
  borderRadius: Radius.sm + 2 (10)
  borderWidth: 1
  borderColor: colors.border
  minHeight: MIN_TOUCH_TARGET (44)

TimelineList:
  paddingTop: Spacing.lg (16)
  paddingLeft: Spacing.lg (16)

TimelineNode:
  flexDirection: 'row'
  marginBottom: Spacing.xl (24)
  (last item): marginBottom: 0

TimelineDot:
  width: 12
  height: 12
  borderRadius: 6
  backgroundColor: colors.timelineNode
  borderWidth: 2
  borderColor: colors.timelineNodeBg
  marginTop: 4

TimelineLine:
  position: 'absolute'
  left: 5 (center of 12px dot)
  top: 16 (dot bottom)
  bottom: -24 (connects to next node's dot)
  width: 2
  backgroundColor: colors.timelineLine

TimelineContent:
  flex: 1
  marginLeft: Spacing.lg (16)

TimelineDate:
  fontSize: FontSize.xs (11)
  fontWeight: FontWeight.medium (600)
  color: colors.textSecondary
  marginBottom: Spacing.xs (4)

TimelineTitle:
  fontSize: FontSize.sm (13)
  fontWeight: FontWeight.bold (700)
  color: colors.textPrimary
  lineHeight: 18
  numberOfLines: 2

TimelineOneLiner:
  fontSize: FontSize.xs (11)
  color: colors.textSecondary
  lineHeight: 16
  marginTop: Spacing.xs (4)
  numberOfLines: 2
```

### Interaction Specification

| State | Behavior |
|-------|----------|
| Collapsed (default) | Header shows "AI Timeline" + ChevronDown icon |
| Expanded | ChevronDown rotates 180deg, list renders below |
| Node press | Calls `onNodePress(article)` to open that article's summary modal |
| Toggle animation | ChevronDown rotation: 250ms ease-out |
| No timeline data | Section does not render at all |

### Accessibility

```
TimelineToggle:
  accessibilityRole: "button"
  accessibilityLabel: t('modal.timeline') (e.g., "AI 타임라인")
  accessibilityState: { expanded: isExpanded }

TimelineNode:
  accessibilityRole: "button"
  accessibilityLabel: `${date}, ${title}. ${oneLiner}`

TimelineList container:
  accessibilityRole: "list"

Screen reader announcement:
  When expanded: announce "Timeline expanded, {count} items"
```

### Multilingual

- Date format: `formatDate()` utility (already exists) handles ko/en
- Title: use `getLocalizedTitle(article, lang)`
- One-liner: use `getLocalizedOneLine(article, lang)`

### Edge Cases

- 0 timeline items: do not render section
- 1 timeline item: render without connecting line
- 10+ items: show first 5, "Show more" button at bottom
- Long titles: `numberOfLines={2}` with `ellipsizeMode="tail"`

---

## 3. Feature 2: Smart Daily Briefing

### Purpose
매일 AI 뉴스의 핵심을 한 화면에서 요약하고, 음성으로도 들을 수 있는 데일리 브리핑을 제공한다.

### Placement
홈 화면(`NewsScreen`) 최상단, 헤더 바로 아래, `HighlightSection` 위에 Hero 카드로 삽입.

### Component Structure

```
NewsScreen ScrollView
  +-- DailyBriefingCard (new Hero card)
  |     +-- BriefingHeader
  |     |     +-- BriefingIcon (Sparkles)
  |     |     +-- BriefingTitle
  |     |     +-- BriefingDate
  |     +-- BriefingSummary (2-line preview)
  |     +-- BriefingActions
  |           +-- ViewFullButton ("전체 브리핑 보기")
  |           +-- AudioPlayButton ("음성으로 듣기")
  +-- HighlightSection (existing)
  +-- ...

DailyBriefingModal (fullscreen)
  +-- BriefingModalHeader
  |     +-- CloseButton
  |     +-- AudioPlayer (floating mini bar)
  +-- ScrollView
  |     +-- BriefingTopicSection (repeated per topic)
  |     |     +-- TopicIcon
  |     |     +-- TopicTitle
  |     |     +-- TopicSummary
  |     |     +-- TopicArticleLinks
  +-- AudioPlayerBar (sticky bottom)
        +-- PlayPauseButton
        +-- ProgressBar
        +-- SpeedControl
        +-- TimeRemaining
```

### Files
- `mobile/components/briefing/DailyBriefingCard.tsx`
- `mobile/components/briefing/DailyBriefingModal.tsx`
- `mobile/components/briefing/AudioPlayerBar.tsx`

### Layout Specification

```
DailyBriefingCard (Hero):
  marginHorizontal: Spacing.lg (16)
  marginTop: Spacing.md (12)
  marginBottom: Spacing.xl (24)
  borderRadius: Radius.xl (20)
  overflow: 'hidden'
  backgroundColor: colors.briefingGradientStart
  padding: Spacing.xl (24)
  minHeight: 180

BriefingHeader:
  flexDirection: 'row'
  alignItems: 'center'
  gap: Spacing.sm (8)
  marginBottom: Spacing.md (12)

BriefingIcon:
  width: 32
  height: 32
  borderRadius: Radius.sm (8)
  backgroundColor: colors.briefingAccent + '20'
  alignItems: 'center'
  justifyContent: 'center'
  Icon: Sparkles, size 16, color: colors.briefingAccent

BriefingTitle:
  fontSize: FontSize.lg (17)
  fontWeight: FontWeight.heavy (800)
  color: '#FFFFFF'

BriefingDate:
  fontSize: FontSize.xs (11)
  color: '#FFFFFF' + 'AA'
  marginLeft: 'auto'

BriefingSummary:
  fontSize: FontSize.base (15)
  color: '#FFFFFF' + 'DD'
  lineHeight: 24
  numberOfLines: 2
  marginBottom: Spacing.lg (16)

BriefingActions:
  flexDirection: 'row'
  gap: Spacing.md (12)

ViewFullButton:
  flex: 1
  paddingVertical: Spacing.md (12)
  borderRadius: Radius.md (12)
  backgroundColor: '#FFFFFF'
  alignItems: 'center'
  minHeight: MIN_TOUCH_TARGET (44)
  Text:
    fontSize: FontSize.sm (13)
    fontWeight: FontWeight.bold (700)
    color: colors.briefingGradientStart

AudioPlayButton:
  width: MIN_TOUCH_TARGET (44)
  height: MIN_TOUCH_TARGET (44)
  borderRadius: 22
  backgroundColor: colors.audioPlayBg
  alignItems: 'center'
  justifyContent: 'center'
  Icon: Volume2, size 20, color: colors.audioPlayIcon

---

DailyBriefingModal:
  Full-screen Modal
  backgroundColor: colors.bg
  SafeAreaView edges: ['top', 'bottom']

BriefingModalHeader:
  flexDirection: 'row'
  alignItems: 'center'
  paddingHorizontal: Spacing.lg (16)
  paddingVertical: Spacing.md (12)
  borderBottomWidth: 1
  borderBottomColor: colors.border

BriefingTopicSection:
  paddingHorizontal: Spacing.xl (24)
  paddingVertical: Spacing.lg (16)
  borderBottomWidth: 1
  borderBottomColor: colors.border

TopicTitle:
  fontSize: FontSize.lg (17)
  fontWeight: FontWeight.heavy (800)
  color: colors.textPrimary
  marginBottom: Spacing.sm (8)

TopicSummary:
  fontSize: FontSize.base (15)
  color: colors.summaryBody
  lineHeight: 26

AudioPlayerBar:
  position: sticky bottom
  height: 64
  backgroundColor: colors.card
  borderTopWidth: 1
  borderTopColor: colors.border
  flexDirection: 'row'
  alignItems: 'center'
  paddingHorizontal: Spacing.lg (16)
  gap: Spacing.md (12)
  paddingBottom: safe area bottom inset

PlayPauseButton:
  width: MIN_TOUCH_TARGET (44)
  height: MIN_TOUCH_TARGET (44)
  borderRadius: 22
  backgroundColor: colors.primary
  Icon: Play/Pause, size 20, color: '#FFF'

ProgressBar:
  flex: 1
  height: 4
  borderRadius: 2
  backgroundColor: colors.quizProgressBg
  ProgressFill:
    height: 4
    borderRadius: 2
    backgroundColor: colors.primary

SpeedControl:
  minWidth: 44
  minHeight: 44
  Text: "1x" / "1.5x" / "2x"
  fontSize: FontSize.xs (11)
  fontWeight: FontWeight.bold (700)

TimeRemaining:
  fontSize: FontSize.xs (11)
  color: colors.textSecondary
  minWidth: 40
  textAlign: 'right'
```

### Interaction Specification

| State | Behavior |
|-------|----------|
| Card press (full area) | Opens DailyBriefingModal |
| "View Full" button press | Opens DailyBriefingModal |
| "Audio" button press | Opens modal + starts audio playback |
| Audio playing | AudioPlayerBar visible at modal bottom |
| Play/Pause toggle | Toggles TTS playback |
| Speed control tap | Cycles: 1x -> 1.5x -> 2x -> 1x |
| Modal dismiss | Swipe down or X button; audio pauses |
| Pull to refresh (home) | Refreshes briefing data |
| No briefing data | Card does not render |

### Accessibility

```
DailyBriefingCard:
  accessibilityRole: "button"
  accessibilityLabel: t('briefing.title') + ", " + briefingDate + ". " + briefingSummaryPreview

AudioPlayButton:
  accessibilityLabel: t('briefing.listen')
  accessibilityRole: "button"
  accessibilityHint: t('briefing.listen_hint')

AudioPlayerBar PlayPause:
  accessibilityLabel: isPlaying ? t('briefing.pause') : t('briefing.play')
  accessibilityRole: "button"

ProgressBar:
  accessibilityRole: "progressbar"
  accessibilityValue: { min: 0, max: duration, now: currentTime }

SpeedControl:
  accessibilityLabel: `${t('briefing.speed')} ${speed}x`
  accessibilityRole: "button"
```

### Edge Cases

- No briefing available: hide card entirely
- Audio error: show toast "음성을 불러올 수 없어요" / "Unable to load audio"
- Long briefing: ScrollView with sticky audio bar
- Background audio: audio continues when modal is open but screen dims
- Network error during TTS: fallback to text-only mode

---

## 4. Feature 3: Related Articles

### Purpose
현재 읽고 있는 기사와 관련된 기사 3개를 자동으로 추천하여, 사용자가 연관 뉴스를 탐색할 수 있도록 한다.

### Placement
`SummaryModalContent` 내부, "원문 보기" 버튼 아래, 하단 액션 바 위.

### Component Structure

```
SummaryModalContent ScrollView
  +-- ...existing sections...
  +-- ViewOriginalButton (existing)
  +-- RelatedArticlesSection (new)
        +-- SectionTitle ("관련 기사")
        +-- HorizontalScrollView
              +-- RelatedArticleCard (x3)
                    +-- CardImage (or placeholder)
                    +-- CardSourceBadge
                    +-- CardTitle
                    +-- CardDate
```

### File: `mobile/components/shared/RelatedArticlesSection.tsx`

### Layout Specification

```
RelatedArticlesSection:
  marginTop: Spacing.lg (16)
  paddingBottom: Spacing.sm (8)

SectionTitle:
  fontSize: FontSize.sm (13)
  fontWeight: FontWeight.bold (700)
  color: colors.textSecondary
  paddingHorizontal: Spacing.xl (24) -- NOTE: inherits from modal padding (20)
  marginBottom: Spacing.md (12)

HorizontalScrollView:
  horizontal: true
  showsHorizontalScrollIndicator: false
  contentContainerStyle:
    paddingHorizontal: 20
    gap: Spacing.md (12)

RelatedArticleCard:
  width: 200
  height: 180
  backgroundColor: colors.card
  borderRadius: Radius.md (12)
  borderWidth: 1
  borderColor: colors.relatedCardBorder
  overflow: 'hidden'

CardImage:
  width: 200
  height: 100
  contentFit: 'cover'
  (fallback):
    backgroundColor: colors.border
    Icon: Newspaper, size 24, color: colors.textLight
    alignItems: 'center'
    justifyContent: 'center'

CardContent:
  padding: Spacing.md (12)
  flex: 1
  justifyContent: 'space-between'

CardSourceBadge:
  (reuse existing SourceBadge component pattern)
  fontSize: FontSize.xs - 1 (10)
  marginBottom: Spacing.xs (4)

CardTitle:
  fontSize: FontSize.sm (13)
  fontWeight: FontWeight.bold (700)
  color: colors.textPrimary
  lineHeight: 18
  numberOfLines: 2

CardDate:
  fontSize: FontSize.xs (11)
  color: colors.textSecondary
  marginTop: Spacing.xs (4)
```

### Interaction Specification

| State | Behavior |
|-------|----------|
| Card press | Closes current modal, opens new SummaryModal for the related article |
| Card press feedback | opacity: 0.85 on pressed state |
| Horizontal scroll | Free scroll with momentum, no snap |
| 0 related articles | Section does not render |
| 1-2 related articles | Show available cards, no "empty" placeholders |
| Loading state | 3 skeleton cards (reuse SkeletonItem pattern) |

### Accessibility

```
RelatedArticlesSection:
  accessibilityRole: "list"
  accessibilityLabel: t('related.title')

RelatedArticleCard:
  accessibilityRole: "button"
  accessibilityLabel: `${t('related.title')}: ${title}, ${source}, ${date}`
  accessibilityHint: t('related.hint')

HorizontalScrollView:
  accessibilityRole: "scrollbar" (handled automatically by RN)
```

### Multilingual

- Title: `getLocalizedTitle(article, lang)`
- Date: `formatDate(article.published, lang)`
- Source: `getSourceName(article.source_key, t)`

### Edge Cases

- No related articles: section hidden
- Related article has no image: show Newspaper icon placeholder
- Same article as current: filter out from list
- Network error on fetch: section hidden (fail gracefully)

---

## 5. Feature 4: AI Glossary

### Purpose
기사 요약 내 전문 용어를 인라인으로 하이라이트하고, 탭 시 팝오버로 설명을 보여준다.
또한 프로필 내에 "AI 사전" 전용 섹션을 두어 분야별 용어를 탐색, 검색할 수 있다.

### Part A: Inline Term Highlighting (Summary Modal)

#### Component Structure

```
SummaryModalContent
  +-- ...existing text sections...
  +-- HighlightedText (replaces plain Text for oneLine, keyPoints, whyImportant)
        +-- TextSegment (normal text)
        +-- TermHighlight (highlighted, tappable)

TermPopover (absolute positioned)
  +-- PopoverArrow
  +-- PopoverContent
        +-- TermTitle
        +-- TermDescription
        +-- DismissArea (tap outside)
```

#### File: `mobile/components/shared/HighlightedText.tsx`
#### File: `mobile/components/shared/TermPopover.tsx`

#### Layout Specification

```
TermHighlight (inline):
  backgroundColor: colors.glossaryHighlightBg
  borderRadius: 4
  paddingHorizontal: 2
  Text:
    color: colors.glossaryHighlight
    fontWeight: FontWeight.medium (600)
    textDecorationLine: 'underline'
    textDecorationStyle: 'dotted'

TermPopover:
  position: 'absolute'
  zIndex: ZIndex.popover (100)
  maxWidth: 280
  backgroundColor: colors.glossaryPopoverBg
  borderRadius: Radius.md (12)
  padding: Spacing.lg (16)
  shadowColor: colors.glossaryPopoverShadow
  shadowOffset: { width: 0, height: 4 }
  shadowOpacity: 1
  shadowRadius: 12
  elevation: 8

PopoverArrow:
  width: 12
  height: 8
  (CSS triangle pointing to the highlighted term)

TermTitle (in popover):
  fontSize: FontSize.base (15)
  fontWeight: FontWeight.heavy (800)
  color: colors.glossaryHighlight
  marginBottom: Spacing.sm (8)

TermDescription (in popover):
  fontSize: FontSize.sm (13)
  color: colors.textPrimary
  lineHeight: 20
```

#### Interaction

| State | Behavior |
|-------|----------|
| Term tap | Show popover positioned above/below the term |
| Tap outside popover | Dismiss popover |
| Another term tap | Close current, open new popover |
| Scroll while popover open | Dismiss popover |
| Popover positioning | Auto-detect: show above if near bottom, below if near top |
| Animation | fadeIn 200ms, fadeOut 150ms |

#### Accessibility

```
TermHighlight:
  accessibilityRole: "button"
  accessibilityLabel: `${term}, ${t('glossary.tap_to_define')}`
  accessibilityHint: t('glossary.tap_hint')

TermPopover:
  accessibilityRole: "alert"
  accessibilityLiveRegion: "polite"
  accessibilityLabel: `${term}: ${description}`
```

### Part B: AI Dictionary Section (Profile)

#### Component Structure

```
ProfileScreen ScrollView
  +-- ...existing sections...
  +-- GlossaryEntryPoint (new card, between Activity and Sign Out)
        +-- GlossaryIcon
        +-- GlossaryTitle
        +-- GlossaryCount
        +-- ChevronRight

GlossaryScreen (new screen: mobile/app/glossary.tsx)
  +-- SafeAreaView
        +-- GlossaryHeader
        |     +-- BackButton
        |     +-- Title
        +-- SearchBar
        +-- CategoryFilter (horizontal scrollable chips)
        +-- RecentTermsSection (if any)
        |     +-- SectionTitle
        |     +-- TermList
        +-- AllTermsSection
              +-- AlphabetIndex (optional)
              +-- TermList
                    +-- TermRow (repeated)
                          +-- TermName
                          +-- TermCategory
                          +-- TermPreview
                          +-- ChevronRight
```

#### Files
- `mobile/components/glossary/GlossaryEntryPoint.tsx`
- `mobile/app/glossary.tsx`

#### Layout Specification

```
GlossaryEntryPoint (Profile card):
  (Follows existing profile card pattern)
  marginHorizontal: 16
  marginBottom: 16
  backgroundColor: colors.card
  borderRadius: Radius.xl (20)
  padding: 20
  ...cardShadow
  flexDirection: 'row'
  alignItems: 'center'
  gap: 12

GlossaryIcon:
  width: 40
  height: 40
  borderRadius: 20
  backgroundColor: colors.glossaryBg
  Icon: BookOpenCheck, size 18, color: colors.glossaryTerm

---

GlossaryScreen:

SearchBar:
  marginHorizontal: Spacing.lg (16)
  marginBottom: Spacing.md (12)
  height: MIN_TOUCH_TARGET (44)
  borderRadius: Radius.md (12)
  backgroundColor: colors.surface
  borderWidth: 1
  borderColor: colors.border
  paddingHorizontal: Spacing.lg (16)
  flexDirection: 'row'
  alignItems: 'center'
  gap: Spacing.sm (8)
  SearchIcon: size 16, color: colors.textLight
  TextInput:
    flex: 1
    fontSize: FontSize.base (15)
    color: colors.textPrimary
    placeholder color: colors.placeholder

CategoryFilter:
  horizontal ScrollView
  paddingHorizontal: Spacing.lg (16)
  marginBottom: Spacing.lg (16)
  gap: Spacing.sm (8)
  Chip:
    paddingHorizontal: Spacing.md (12)
    paddingVertical: Spacing.sm (8)
    minHeight: 36
    borderRadius: Radius.lg (16)
    borderWidth: 1
    (active):
      backgroundColor: colors.glossaryTerm
      borderColor: colors.glossaryTerm
      Text color: '#FFF'
    (inactive):
      backgroundColor: colors.card
      borderColor: colors.border
      Text color: colors.textSecondary

TermRow:
  paddingHorizontal: Spacing.lg (16)
  paddingVertical: Spacing.md + 2 (14)
  borderBottomWidth: 1
  borderBottomColor: colors.border
  minHeight: 60

TermName:
  fontSize: FontSize.base (15)
  fontWeight: FontWeight.bold (700)
  color: colors.textPrimary

TermCategory:
  fontSize: FontSize.xs (11)
  color: colors.textSecondary
  marginTop: 2

TermPreview:
  fontSize: FontSize.sm (13)
  color: colors.textDim
  numberOfLines: 1
  marginTop: Spacing.xs (4)
```

#### Interaction

| State | Behavior |
|-------|----------|
| Search input | Debounce 300ms, filter terms by name/description |
| Category chip tap | Toggle filter, multiple selection allowed |
| Term row tap | Expand inline or navigate to detail view |
| Recent terms | Store in AsyncStorage, max 20 items, LIFO |
| Back button | Navigate back to profile |
| Empty search result | Show "No terms found" empty state |

#### Accessibility

```
SearchBar:
  accessibilityLabel: t('glossary.search')
  accessibilityRole: "search"
  TextInput accessibilityLabel: t('glossary.search_placeholder')

CategoryFilter chip:
  accessibilityRole: "button"
  accessibilityState: { selected: isActive }

TermRow:
  accessibilityRole: "button"
  accessibilityLabel: `${term}. ${category}. ${preview}`
```

---

## 6. Feature 5: Personalized Feed

### Purpose
사용자의 관심사에 맞춘 "맞춤" 탭을 카테고리 탭에 추가하고, 추천 이유를 라벨로 보여준다.

### Placement
`CategoryTabSection` 내의 카테고리 탭 맨 앞에 "맞춤" 탭을 추가.

### Component Structure

```
CategoryTabSection
  +-- TabBar
  |     +-- PersonalizedTab (new, first position)  <-- "맞춤" / "For You"
  |     +-- ResearchTab (existing)
  |     +-- ModelsProductsTab (existing)
  |     +-- IndustryBusinessTab (existing)
  +-- (when PersonalizedTab active):
        +-- InterestKeywordsBar
        |     +-- KeywordChip (horizontal scroll)
        +-- PersonalizedArticleList
              +-- PersonalizedArticleCard (repeated)
                    +-- RecommendationReasonLabel (new)
                    +-- (rest of card follows existing vertical list card layout)
```

### File: `mobile/components/feed/PersonalizedFeed.tsx`

### Layout Specification

```
PersonalizedTab (in tab bar):
  (Follows existing Pressable tab pattern)
  paddingHorizontal: 14
  paddingVertical: 10
  minHeight: 44
  borderRadius: 16
  (active):
    backgroundColor: colors.personalizedAccent
    borderColor: colors.personalizedAccent
    Text color: '#FFF'
    Icon: Sparkles, size 12, marginRight 4
  (inactive):
    backgroundColor: colors.card
    borderColor: colors.border
    Text color: colors.textSecondary

InterestKeywordsBar:
  horizontal ScrollView
  paddingHorizontal: Spacing.lg (16)
  marginBottom: Spacing.md (12)
  gap: Spacing.sm (8)

KeywordChip:
  paddingHorizontal: Spacing.md (12)
  paddingVertical: Spacing.sm - 2 (6)
  borderRadius: Radius.full (9999)
  backgroundColor: colors.personalizedAccent + '15'
  borderWidth: 1
  borderColor: colors.personalizedAccent + '40'
  Text:
    fontSize: FontSize.xs (11)
    fontWeight: FontWeight.medium (600)
    color: colors.personalizedAccent

RecommendationReasonLabel:
  flexDirection: 'row'
  alignItems: 'center'
  gap: Spacing.xs (4)
  marginBottom: Spacing.sm (8)
  paddingHorizontal: Spacing.sm (8)
  paddingVertical: Spacing.xs (4)
  borderRadius: Spacing.sm (8)
  backgroundColor: colors.personalizedReasonBg
  alignSelf: 'flex-start'
  Icon: Sparkles, size 10, color: colors.personalizedAccent
  Text:
    fontSize: FontSize.xs (11)
    color: colors.personalizedAccent
    fontWeight: FontWeight.medium (600)
```

### Interaction Specification

| State | Behavior |
|-------|----------|
| "맞춤" tab active | Shows personalized articles instead of category articles |
| Keyword chip tap | Filters personalized articles by that keyword |
| Article card tap | Opens SummaryModal (same as existing) |
| Not logged in | Show login prompt card instead of articles |
| No personalization data | Show "Start reading to get recommendations" message |
| Keyword long-press | Remove keyword from interests (with confirmation) |

### Login Required State

```
LoginPromptCard:
  marginHorizontal: Spacing.lg (16)
  padding: Spacing.xl (24)
  borderRadius: Radius.xl (20)
  backgroundColor: colors.card
  borderWidth: 1
  borderColor: colors.border
  alignItems: 'center'
  gap: Spacing.lg (16)

  Icon: UserIcon, size 32, color: colors.textLight
  Title:
    fontSize: FontSize.base (15)
    fontWeight: FontWeight.bold (700)
    color: colors.textPrimary
  Description:
    fontSize: FontSize.sm (13)
    color: colors.textSecondary
    textAlign: 'center'
  LoginButton:
    backgroundColor: colors.primary
    paddingHorizontal: 28
    paddingVertical: 12
    borderRadius: Radius.md (12)
```

### Accessibility

```
PersonalizedTab:
  accessibilityRole: "tab"
  accessibilityState: { selected: isActive }
  accessibilityLabel: t('feed.personalized')

KeywordChip:
  accessibilityRole: "button"
  accessibilityState: { selected: isActive }
  accessibilityLabel: keyword

RecommendationReasonLabel:
  accessibilityLabel: reason text (e.g., "관심 키워드: LLM")
```

### Multilingual

- Tab label: `t('feed.personalized')` -> "맞춤" / "For You"
- Reason labels: `t('feed.reason_keyword')` -> "관심 키워드" / "Interest"
- Empty state text: `t('feed.empty')` / `t('feed.empty_desc')`

---

## 7. Feature 6: AI News Quiz

### Purpose
기사 내용을 기반으로 퀴즈를 출제하여 사용자의 이해도를 확인하고 재미를 준다.

### Placement
- Entry point 1: 홈 화면 하단, `GeekNewsSection` 아래에 QuizEntryCard
- Entry point 2: 요약 모달 하단의 "Take Quiz" 버튼 (선택적)
- Quiz screen: 별도 풀스크린 모달 또는 새 탭

### Component Structure

```
Entry Point (Home):
QuizEntryCard
  +-- QuizIcon
  +-- QuizTitle
  +-- QuizSubtitle
  +-- StartButton

Quiz Screen (Modal):
QuizModal
  +-- QuizHeader
  |     +-- CloseButton
  |     +-- ProgressIndicator (e.g., "3/5")
  |     +-- ProgressBar
  +-- QuizContent (AnimatedView for card transitions)
  |     +-- QuizCard
  |           +-- QuestionText
  |           +-- OptionsList
  |                 +-- OptionButton (x4)
  |                       +-- OptionLetter (A/B/C/D)
  |                       +-- OptionText
  |           +-- (after answer):
  |                 +-- AnswerFeedback
  |                 |     +-- CorrectIncorrectIcon
  |                 |     +-- ExplanationText
  |                 +-- NextButton / ViewArticleButton
  +-- QuizFooter
        +-- (QuestionCounter)

QuizResultScreen
  +-- ResultHeader
  |     +-- ScoreCircle (animated)
  |     +-- ScoreText
  |     +-- ScoreLabel
  +-- ResultBreakdown
  |     +-- ResultRow (per question, correct/incorrect indicator)
  +-- ResultActions
        +-- RetryButton
        +-- ShareButton
        +-- HomeButton
```

### Files
- `mobile/components/quiz/QuizEntryCard.tsx`
- `mobile/components/quiz/QuizModal.tsx`
- `mobile/components/quiz/QuizCard.tsx`
- `mobile/components/quiz/QuizResultScreen.tsx`

### Layout Specification

```
QuizEntryCard (Home):
  marginHorizontal: Spacing.lg (16)
  marginBottom: Spacing.xl (24)
  padding: Spacing.xl (24)
  borderRadius: Radius.xl (20)
  backgroundColor: colors.card
  borderWidth: 1
  borderColor: colors.border
  flexDirection: 'row'
  alignItems: 'center'
  gap: Spacing.lg (16)
  ...cardShadow

QuizIcon:
  width: 48
  height: 48
  borderRadius: Radius.md (12)
  backgroundColor: colors.quizOptionSelected + '15'
  alignItems: 'center'
  justifyContent: 'center'
  Icon: Brain/Lightbulb, size 24, color: colors.quizOptionSelected

QuizTitle:
  fontSize: FontSize.lg (17)
  fontWeight: FontWeight.heavy (800)
  color: colors.textPrimary

QuizSubtitle:
  fontSize: FontSize.sm (13)
  color: colors.textSecondary
  marginTop: 2

StartButton:
  paddingHorizontal: Spacing.lg (16)
  paddingVertical: Spacing.md (12)
  borderRadius: Radius.md (12)
  backgroundColor: colors.primary
  minHeight: MIN_TOUCH_TARGET (44)
  Text:
    fontSize: FontSize.sm (13)
    fontWeight: FontWeight.bold (700)
    color: '#FFF'

---

QuizModal (fullscreen):
  backgroundColor: colors.bg

QuizHeader:
  flexDirection: 'row'
  alignItems: 'center'
  paddingHorizontal: Spacing.lg (16)
  paddingVertical: Spacing.md (12)
  gap: Spacing.md (12)

ProgressBar:
  flex: 1
  height: 6
  borderRadius: 3
  backgroundColor: colors.quizProgressBg
  ProgressFill:
    height: 6
    borderRadius: 3
    backgroundColor: colors.quizProgressFill
    Animated width transition: 300ms

ProgressText:
  fontSize: FontSize.sm (13)
  fontWeight: FontWeight.bold (700)
  color: colors.textPrimary
  minWidth: 40
  textAlign: 'center'

QuizCard:
  marginHorizontal: Spacing.lg (16)
  marginTop: Spacing.xl (24)

QuestionText:
  fontSize: FontSize.xl (20)
  fontWeight: FontWeight.heavy (800)
  color: colors.textPrimary
  lineHeight: 30
  marginBottom: Spacing.xl (24)

OptionButton:
  flexDirection: 'row'
  alignItems: 'center'
  gap: Spacing.md (12)
  padding: Spacing.lg (16)
  borderRadius: Radius.lg (16)
  borderWidth: 2
  marginBottom: Spacing.md (12)
  minHeight: 56

  (default):
    backgroundColor: colors.quizOptionBg
    borderColor: colors.quizOptionBorder
  (selected, before reveal):
    backgroundColor: colors.quizOptionSelected + '10'
    borderColor: colors.quizOptionSelected
  (correct, after reveal):
    backgroundColor: colors.quizCorrectBg
    borderColor: colors.quizCorrect
  (incorrect, after reveal):
    backgroundColor: colors.quizIncorrectBg
    borderColor: colors.quizIncorrect
  (unselected wrong, after reveal):
    opacity: 0.5

OptionLetter:
  width: 32
  height: 32
  borderRadius: 16
  alignItems: 'center'
  justifyContent: 'center'
  (default):
    backgroundColor: colors.surface
  (correct): backgroundColor: colors.quizCorrect
  (incorrect): backgroundColor: colors.quizIncorrect
  Text:
    fontSize: FontSize.sm (13)
    fontWeight: FontWeight.bold (700)
    (default): color: colors.textPrimary
    (correct/incorrect): color: '#FFF'

OptionText:
  flex: 1
  fontSize: FontSize.base (15)
  fontWeight: FontWeight.medium (600)
  color: colors.textPrimary
  lineHeight: 22

AnswerFeedback:
  marginTop: Spacing.lg (16)
  padding: Spacing.lg (16)
  borderRadius: Radius.md (12)
  (correct):
    backgroundColor: colors.quizCorrectBg
    borderLeftWidth: 4
    borderLeftColor: colors.quizCorrect
  (incorrect):
    backgroundColor: colors.quizIncorrectBg
    borderLeftWidth: 4
    borderLeftColor: colors.quizIncorrect

ExplanationText:
  fontSize: FontSize.sm (13)
  color: colors.summaryBody
  lineHeight: 20

NextButton:
  marginTop: Spacing.lg (16)
  alignSelf: 'center'
  paddingHorizontal: Spacing.xxl (32)
  paddingVertical: Spacing.md (12)
  borderRadius: Radius.md (12)
  backgroundColor: colors.textPrimary
  minHeight: MIN_TOUCH_TARGET (44)
  Text:
    fontSize: FontSize.base (15)
    fontWeight: FontWeight.bold (700)
    color: colors.card

---

QuizResultScreen:

ScoreCircle:
  width: 120
  height: 120
  borderRadius: 60
  borderWidth: 8
  (high score >=80%): borderColor: colors.quizCorrect
  (medium 50-79%): borderColor: colors.personalizedAccent
  (low <50%): borderColor: colors.quizIncorrect
  alignItems: 'center'
  justifyContent: 'center'
  alignSelf: 'center'
  marginVertical: Spacing.xxl (32)

ScoreText:
  fontSize: 36
  fontWeight: FontWeight.heavy (800)
  color: colors.textPrimary

ScoreLabel:
  fontSize: FontSize.sm (13)
  color: colors.textSecondary
  marginTop: Spacing.xs (4)

ResultRow:
  flexDirection: 'row'
  alignItems: 'center'
  gap: Spacing.md (12)
  padding: Spacing.md (12)
  borderBottomWidth: 1
  borderBottomColor: colors.border

ResultIcon:
  width: 24
  height: 24
  borderRadius: 12
  (correct): backgroundColor: colors.quizCorrectBg, Icon: Check, color: colors.quizCorrect
  (incorrect): backgroundColor: colors.quizIncorrectBg, Icon: X, color: colors.quizIncorrect

ResultActions:
  flexDirection: 'row'
  gap: Spacing.md (12)
  paddingHorizontal: Spacing.lg (16)
  paddingVertical: Spacing.xl (24)

RetryButton:
  flex: 1
  paddingVertical: Spacing.md (12)
  borderRadius: Radius.md (12)
  backgroundColor: colors.surface
  borderWidth: 1
  borderColor: colors.border
  Text: colors.textPrimary

ShareButton:
  flex: 1
  paddingVertical: Spacing.md (12)
  borderRadius: Radius.md (12)
  backgroundColor: colors.primary
  Text: '#FFF'
```

### Interaction Specification

| State | Behavior |
|-------|----------|
| Entry card press | Opens QuizModal |
| Option tap | Highlights selected option (blue border) |
| Option tap (already answered) | No-op |
| Confirm answer | After 500ms, reveals correct/incorrect with animation |
| Correct answer animation | Option scales 1.02x, green border, checkmark icon appears |
| Incorrect answer animation | Option shakes (translateX -5 -> 5 -> 0, 200ms), red border |
| Next button | Slides current card left, slides new card from right (250ms) |
| Last question "Next" | Transitions to QuizResultScreen |
| Score circle animation | Count-up animation from 0 to final score (800ms) |
| Share button | Native share sheet with score text |
| Retry button | Resets quiz to question 1 |
| Close/X button | Confirm dialog if quiz in progress, direct close if on results |
| `prefers-reduced-motion` | Disable shake/slide animations; use opacity transitions |

### Accessibility

```
QuizCard:
  accessibilityRole: "radiogroup"
  accessibilityLabel: questionText

OptionButton:
  accessibilityRole: "radio"
  accessibilityState: { selected: isSelected, checked: isSelected }
  accessibilityLabel: `${letter}. ${optionText}`
  (after reveal, correct):
    accessibilityLabel: `${letter}. ${optionText}. ${t('quiz.correct')}`
  (after reveal, incorrect):
    accessibilityLabel: `${letter}. ${optionText}. ${t('quiz.incorrect')}`

AnswerFeedback:
  accessibilityLiveRegion: "assertive"
  accessibilityLabel: isCorrect
    ? `${t('quiz.correct')}. ${explanation}`
    : `${t('quiz.incorrect')}. ${explanation}`

ProgressBar:
  accessibilityRole: "progressbar"
  accessibilityLabel: `${t('quiz.progress')}: ${current} / ${total}`
  accessibilityValue: { min: 0, max: total, now: current }

ScoreCircle:
  accessibilityLabel: `${t('quiz.score')}: ${score}%`
```

### Multilingual

- Quiz questions and options: localized by backend (`question_ko`, `question_en`)
- UI labels: all via `t()` function
- Share message format:
  - ko: "AI 뉴스 퀴즈에서 {score}점을 받았어요! - Ailon"
  - en: "I scored {score}% on the AI News Quiz! - Ailon"

### Edge Cases

- No quiz available: entry card shows "Coming soon" state
- Network error during quiz: save progress locally, retry on reconnect
- Single question quiz: skip progress bar, go straight to results
- All correct: show celebratory confetti animation (respect reduced-motion)
- All wrong: show encouraging message, suggest reviewing articles
- Timer (optional future): not in v1, but leave space in header for timer icon

---

## 8. Translation Keys

Add the following to `mobile/lib/translations.ts`:

```typescript
// --- AI Timeline ---
'modal.timeline': { ko: 'AI 타임라인', en: 'AI Timeline' },
'modal.timeline_expanded': { ko: '타임라인 펼침, {count}개 항목', en: 'Timeline expanded, {count} items' },
'modal.timeline_more': { ko: '더보기', en: 'Show more' },

// --- Daily Briefing ---
'briefing.title': { ko: '오늘의 AI 브리핑', en: "Today's AI Briefing" },
'briefing.view_full': { ko: '전체 브리핑 보기', en: 'View Full Briefing' },
'briefing.listen': { ko: '음성으로 듣기', en: 'Listen' },
'briefing.listen_hint': { ko: '브리핑을 음성으로 들을 수 있어요', en: 'Listen to the briefing' },
'briefing.play': { ko: '재생', en: 'Play' },
'briefing.pause': { ko: '일시정지', en: 'Pause' },
'briefing.speed': { ko: '속도', en: 'Speed' },
'briefing.audio_error': { ko: '음성을 불러올 수 없어요', en: 'Unable to load audio' },
'briefing.no_briefing': { ko: '오늘의 브리핑이 아직 준비되지 않았어요', en: "Today's briefing is not ready yet" },

// --- Related Articles ---
'related.title': { ko: '관련 기사', en: 'Related Articles' },
'related.hint': { ko: '탭하면 기사 요약을 볼 수 있어요', en: 'Tap to view article summary' },

// --- AI Glossary ---
'glossary.title': { ko: 'AI 사전', en: 'AI Dictionary' },
'glossary.search': { ko: '용어 검색', en: 'Search terms' },
'glossary.search_placeholder': { ko: '용어를 검색하세요...', en: 'Search for a term...' },
'glossary.recent': { ko: '최근 본 용어', en: 'Recently Viewed' },
'glossary.all': { ko: '전체 용어', en: 'All Terms' },
'glossary.no_results': { ko: '검색 결과가 없어요', en: 'No results found' },
'glossary.tap_to_define': { ko: '탭하면 뜻을 볼 수 있어요', en: 'Tap to see definition' },
'glossary.tap_hint': { ko: '용어 설명 팝업', en: 'Term definition popup' },
'glossary.count': { ko: '개 용어', en: ' terms' },

// --- Personalized Feed ---
'feed.personalized': { ko: '맞춤', en: 'For You' },
'feed.reason_keyword': { ko: '관심 키워드', en: 'Interest' },
'feed.reason_history': { ko: '읽은 기사 기반', en: 'Based on reading history' },
'feed.reason_trending': { ko: '인기 급상승', en: 'Trending' },
'feed.empty': { ko: '아직 맞춤 추천이 없어요', en: 'No recommendations yet' },
'feed.empty_desc': { ko: '기사를 읽으면 맞춤 추천이 시작돼요', en: 'Start reading articles to get personalized recommendations' },
'feed.login_required': { ko: '맞춤 추천을 받으려면 로그인하세요', en: 'Log in for personalized recommendations' },

// --- AI News Quiz ---
'quiz.title': { ko: 'AI 뉴스 퀴즈', en: 'AI News Quiz' },
'quiz.subtitle': { ko: '오늘의 AI 뉴스를 얼마나 알고 있나요?', en: 'How well do you know today\'s AI news?' },
'quiz.start': { ko: '퀴즈 시작', en: 'Start Quiz' },
'quiz.next': { ko: '다음', en: 'Next' },
'quiz.correct': { ko: '정답!', en: 'Correct!' },
'quiz.incorrect': { ko: '오답', en: 'Incorrect' },
'quiz.progress': { ko: '진행', en: 'Progress' },
'quiz.score': { ko: '점수', en: 'Score' },
'quiz.result_title': { ko: '퀴즈 결과', en: 'Quiz Results' },
'quiz.retry': { ko: '다시 풀기', en: 'Try Again' },
'quiz.share': { ko: '결과 공유', en: 'Share Results' },
'quiz.share_message': { ko: 'AI 뉴스 퀴즈에서 {score}점을 받았어요!', en: 'I scored {score}% on the AI News Quiz!' },
'quiz.home': { ko: '홈으로', en: 'Go Home' },
'quiz.coming_soon': { ko: '곧 만나요', en: 'Coming Soon' },
'quiz.confirm_exit': { ko: '퀴즈를 종료할까요? 진행 상황이 사라져요.', en: 'Quit the quiz? Your progress will be lost.' },
'quiz.confirm_exit_yes': { ko: '종료', en: 'Quit' },
'quiz.confirm_exit_no': { ko: '계속하기', en: 'Continue' },
'quiz.view_article': { ko: '기사 보기', en: 'View Article' },
'quiz.great_job': { ko: '대단해요!', en: 'Great job!' },
'quiz.keep_going': { ko: '계속 도전해보세요!', en: 'Keep going!' },
'quiz.try_again': { ko: '기사를 다시 읽어볼까요?', en: 'Try reading the articles again!' },
```

---

## 9. Color Token Extensions

### Full Token Table

| Token Name | Light | Dark | Usage |
|------------|-------|------|-------|
| `timelineLine` | `#E0E0E0` | `#3A3A3A` | Timeline vertical connector line |
| `timelineNode` | `#6366F1` | `#818CF8` | Timeline dot fill |
| `timelineNodeBg` | `#EDE9FE` | `#2D2650` | Timeline dot border/bg |
| `briefingGradientStart` | `#1E3A5F` | `#1E293B` | Hero card background |
| `briefingGradientEnd` | `#0F172A` | `#0F172A` | Hero card gradient end |
| `briefingAccent` | `#60A5FA` | `#93C5FD` | Hero card accent elements |
| `relatedCardBorder` | `#E5E7EB` | `#2C2C2C` | Related article card border |
| `glossaryHighlight` | `#6D28D9` | `#A78BFA` | Inline term highlight text |
| `glossaryHighlightBg` | `#F5F3FF` | `#1E1B2E` | Inline term highlight bg |
| `glossaryPopoverBg` | `#FFFFFF` | `#2A2A2A` | Popover background |
| `glossaryPopoverShadow` | `#00000020` | `#00000060` | Popover shadow |
| `personalizedBg` | `#FFF7ED` | `#1C1917` | Personalized section bg |
| `personalizedAccent` | `#F59E0B` | `#FBBF24` | "맞춤" tab active + keyword chips |
| `personalizedReasonBg` | `#FFFBEB` | `#1C1917` | Recommendation reason label bg |
| `quizCorrect` | `#16A34A` | `#4ADE80` | Correct answer color |
| `quizCorrectBg` | `#F0FDF4` | `#052E16` | Correct answer background |
| `quizIncorrect` | `#DC2626` | `#FF5252` | Incorrect answer color |
| `quizIncorrectBg` | `#FEF2F2` | `#3D1F1F` | Incorrect answer background |
| `quizOptionBg` | `#F9FAFB` | `#1E1E1E` | Quiz option default bg |
| `quizOptionBorder` | `#E5E7EB` | `#2C2C2C` | Quiz option default border |
| `quizOptionSelected` | `#3B82F6` | `#64B5F6` | Quiz option selected accent |
| `quizProgressBg` | `#E5E7EB` | `#2C2C2C` | Progress bar track |
| `quizProgressFill` | `#3B82F6` | `#64B5F6` | Progress bar fill |
| `audioPlayBg` | `#EFF6FF` | `#1A2332` | Audio play button bg |
| `audioPlayIcon` | `#2563EB` | `#64B5F6` | Audio play button icon |

All color pairs maintain WCAG AA contrast ratios:
- Text on colored backgrounds: >= 4.5:1
- Large text / icons on colored backgrounds: >= 3:1
- Interactive state changes are distinguishable without color alone (border, icon, weight changes)

---

## Implementation Priority Recommendation

| Priority | Feature | Complexity | Dependencies |
|----------|---------|------------|-------------|
| 1 | Related Articles | Low | Existing Article data + tags matching |
| 2 | AI Timeline | Low-Medium | Existing SummaryModal + timeline data from backend |
| 3 | Personalized Feed | Medium | User interaction tracking + recommendation engine |
| 4 | AI Glossary (Inline) | Medium | Term matching in summary text |
| 5 | Daily Briefing | Medium-High | Backend briefing generation + TTS integration |
| 6 | AI News Quiz | High | Backend quiz generation + score tracking |

---

## File Structure Summary

```
mobile/
  components/
    shared/
      TimelineSection.tsx          -- Feature 1
      RelatedArticlesSection.tsx   -- Feature 3
      HighlightedText.tsx          -- Feature 4a
      TermPopover.tsx              -- Feature 4a
    briefing/
      DailyBriefingCard.tsx        -- Feature 2
      DailyBriefingModal.tsx       -- Feature 2
      AudioPlayerBar.tsx           -- Feature 2
    glossary/
      GlossaryEntryPoint.tsx       -- Feature 4b
    feed/
      PersonalizedFeed.tsx         -- Feature 5
    quiz/
      QuizEntryCard.tsx            -- Feature 6
      QuizModal.tsx                -- Feature 6
      QuizCard.tsx                 -- Feature 6
      QuizResultScreen.tsx         -- Feature 6
  app/
    glossary.tsx                   -- Feature 4b (new screen)
  lib/
    colors.ts                      -- Extended with new tokens
    theme.ts                       -- Extended with animation/zindex tokens
    translations.ts                -- Extended with new keys
```
