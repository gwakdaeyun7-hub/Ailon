# Story Timeline Component Specification

**Component**: `StoryTimeline`
**Design**: E - Conversational Story Flow (Chat Style)
**Location**: Main screen (`index.tsx`), between `<DailyBriefingCard />` and `<HighlightSection />`
**File path**: `mobile/components/story/StoryTimeline.tsx`

---

## 1. Data Interfaces

```typescript
interface StoryThread {
  story_id: string;
  title_ko: string;
  title_en: string;
  nodes: StoryNode[];
  summary_ko: string;
  summary_en: string;
}

interface StoryNode {
  type: 'narration' | 'article';
  text_ko?: string;
  text_en?: string;
  article_id?: string;
  title_ko?: string;
  title_en?: string;
  source?: string;
  link?: string;
  image_url?: string;
  date: string;
}
```

---

## 2. Component Props

```typescript
interface StoryTimelineProps {
  stories: StoryThread[];
}
```

---

## 3. Layout Position in index.tsx

```tsx
{/* Daily Briefing */}
<DailyBriefingCard />

{/* Story Timeline (NEW) */}
<StoryTimeline stories={stories} />

{/* Section 1: Highlights */}
<HighlightSection ... />
```

---

## 4. Collapsed State (Default)

The component renders collapsed on mount. The collapsed state is a single-row header bar.

### 4.1 Layout

```
[AI Icon] [Title Text]          [Story Count] [Chevron]
```

### 4.2 Container

| Property          | Value                                   |
|-------------------|-----------------------------------------|
| marginHorizontal  | 16                                      |
| marginTop         | 12                                      |
| marginBottom      | 8                                       |
| backgroundColor   | `colors.highlightBg`                    |
| borderRadius      | 16 (`Radius.lg`)                        |
| borderWidth       | 1                                       |
| borderColor       | `colors.border`                         |
| padding           | 16 (`Spacing.lg`)                       |

### 4.3 Header Row

| Property       | Value                                            |
|----------------|--------------------------------------------------|
| flexDirection  | `'row'`                                          |
| alignItems     | `'center'`                                       |

### 4.4 AI Icon (left)

| Property        | Value                                   |
|-----------------|-----------------------------------------|
| width           | 32                                      |
| height          | 32                                      |
| borderRadius    | 8 (`Radius.sm`)                         |
| backgroundColor | `colors.primary + '18'`                 |
| alignItems      | `'center'`                              |
| justifyContent  | `'center'`                              |
| marginRight     | 10                                      |
| Icon            | `<Cpu size={16} color={colors.primary} />` from lucide-react-native |

This matches the existing `DailyBriefingCard` icon pattern (32x32 rounded square with tinted background), ensuring visual consistency.

### 4.5 Title Text

| Property   | Value                              |
|------------|------------------------------------|
| fontSize   | 15 (`FontSize.base`)               |
| fontWeight | `'700'` (`FontWeight.bold`)        |
| color      | `colors.textPrimary`               |
| flex       | 1                                  |

- Korean: `'스토리 타임라인'`
- English: `'Story Timeline'`
- Translation key: `'story.title'`

### 4.6 Story Count Badge

| Property        | Value                               |
|-----------------|-------------------------------------|
| fontSize        | 11 (`FontSize.xs`)                  |
| color           | `colors.textSecondary`              |
| marginRight     | 8                                   |

- Format: `{stories.length}{t('briefing.stories')}` (e.g., "2개 스토리" / "2 stories")

### 4.7 Chevron Toggle

| Property        | Value                               |
|-----------------|-------------------------------------|
| width           | 36                                  |
| height          | 36                                  |
| borderRadius    | 18 (`Radius.full`)                  |
| backgroundColor | `colors.surface`                    |
| alignItems      | `'center'`                          |
| justifyContent  | `'center'`                          |
| Icon (collapsed)| `<ChevronDown size={16} color={colors.textSecondary} />` |
| Icon (expanded) | `<ChevronDown>` rotated 180 degrees via `Animated.Value` transform |
| Touch target    | 44x44pt (Pressable hitSlop={4})     |

### 4.8 Accessibility (collapsed)

| Attribute           | Value                                                        |
|---------------------|--------------------------------------------------------------|
| accessibilityRole   | `'button'`                                                   |
| accessibilityLabel  | `t('story.title') + ', ' + stories.length + t('briefing.stories')` |
| accessibilityHint   | `t('story.expand_hint')` ("Tap to expand story timeline" / "탭하여 스토리 타임라인 펼치기") |
| accessibilityState  | `{ expanded: false }`                                        |

---

## 5. Expanded State

When expanded, the component reveals the full chat-bubble conversation flow below the header.

### 5.1 Overall Structure

```
[Header Row]                         ← same as collapsed
[Multi-Story Tabs]                   ← only if stories.length > 1
[Chat Conversation Area]
  [Date Separator]
  [Narration Bubble - left]
  [Article Bubble - right]
  [Article Bubble - right]
  [Date Separator]
  [Narration Bubble - left]
  [Article Bubble - right]
  [Summary Section]
```

### 5.2 Expanded Container

The container expands from the collapsed header. The additional content area below the header:

| Property       | Value                               |
|----------------|-------------------------------------|
| marginTop      | 16 (`Spacing.lg`)                   |
| maxHeight      | 480 (ScrollView with this max)      |

The chat area is wrapped in a `ScrollView` (vertical) with:

| Property                        | Value    |
|---------------------------------|----------|
| showsVerticalScrollIndicator    | true     |
| nestedScrollEnabled             | true     |
| contentContainerStyle.paddingBottom | 8    |

---

## 6. Multi-Story Tabs (if stories.length > 1)

Shown only when 2+ stories exist. Rendered between the header and the chat area.

### 6.1 Tab Container

| Property        | Value                               |
|-----------------|-------------------------------------|
| flexDirection   | `'row'`                             |
| gap             | 8 (`Spacing.sm`)                    |
| marginBottom    | 16 (`Spacing.lg`)                   |

### 6.2 Individual Tab

**Active state:**

| Property        | Value                               |
|-----------------|-------------------------------------|
| paddingHorizontal | 14                                |
| paddingVertical | 8                                   |
| borderRadius    | 20 (`Radius.xl`)                    |
| backgroundColor | `colors.primary`                    |

Text:

| Property   | Value                              |
|------------|------------------------------------|
| fontSize   | 13 (`FontSize.sm`)                 |
| fontWeight | `'700'`                            |
| color      | `'#FFFFFF'`                        |
| numberOfLines | 1                               |

**Inactive state:**

| Property        | Value                               |
|-----------------|-------------------------------------|
| paddingHorizontal | 14                                |
| paddingVertical | 8                                   |
| borderRadius    | 20 (`Radius.xl`)                    |
| backgroundColor | `colors.surface`                    |
| borderWidth     | 1                                   |
| borderColor     | `colors.border`                     |

Text:

| Property   | Value                              |
|------------|------------------------------------|
| fontSize   | 13 (`FontSize.sm`)                 |
| fontWeight | `'600'`                            |
| color      | `colors.textSecondary`             |

**Tab label**: Story title, truncated to 1 line. Use `lang === 'en' ? story.title_en : story.title_ko`.

**If stories.length > 3**: Wrap tabs in a horizontal `ScrollView` with `showsHorizontalScrollIndicator={false}`.

### 6.3 Tab Accessibility

| Attribute           | Value                              |
|---------------------|------------------------------------|
| accessibilityRole   | `'tab'`                            |
| accessibilityState  | `{ selected: isActive }`           |
| accessibilityLabel  | story title                        |

---

## 7. Date Separator

Inserted between nodes when the date changes (compare `node.date.split('T')[0]`).

### 7.1 Layout

```
────────── 2026.02.28 ──────────
```

### 7.2 Container

| Property       | Value                               |
|----------------|-------------------------------------|
| flexDirection  | `'row'`                             |
| alignItems     | `'center'`                          |
| marginVertical | 16 (`Spacing.lg`)                   |
| gap            | 12 (`Spacing.md`)                   |

### 7.3 Horizontal Lines (left and right)

| Property        | Value                               |
|-----------------|-------------------------------------|
| flex            | 1                                   |
| height          | 1                                   |
| backgroundColor | `colors.border`                     |

### 7.4 Date Text

| Property   | Value                              |
|------------|------------------------------------|
| fontSize   | 11 (`FontSize.xs`)                 |
| fontWeight | `'600'`                            |
| color      | `colors.textDim`                   |

Format: Use the existing `formatDate(node.date, lang)` helper from `index.tsx`.

### 7.5 Accessibility

The date separator is decorative for screen readers. Wrap in `accessibilityElementsHidden={true}` / `importantForAccessibility="no"`.

---

## 8. Narration Bubble (AI, left-aligned)

### 8.1 Layout

```
[AI Avatar]  [Bubble Text                    ]
             [                               ]
```

### 8.2 Row Container

| Property       | Value                               |
|----------------|-------------------------------------|
| flexDirection  | `'row'`                             |
| alignItems     | `'flex-start'`                      |
| marginBottom   | 12 (`Spacing.md`)                   |
| paddingRight   | 48 (prevents bubble from being full-width; gives right margin for visual asymmetry) |

### 8.3 AI Avatar

| Property        | Value                               |
|-----------------|-------------------------------------|
| width           | 28                                  |
| height          | 28                                  |
| borderRadius    | 14 (`Radius.full`)                  |
| backgroundColor | `colors.primary + '18'`             |
| alignItems      | `'center'`                          |
| justifyContent  | `'center'`                          |
| marginRight     | 8 (`Spacing.sm`)                    |
| marginTop       | 2                                   |
| Icon            | `<Cpu size={13} color={colors.primary} />` |

The avatar only appears on the first narration bubble in a consecutive sequence. Subsequent narration bubbles without an intervening article or date separator omit the avatar and use `marginLeft: 36` (28 + 8) to maintain alignment.

### 8.4 Bubble

| Property        | Value                               |
|-----------------|-------------------------------------|
| backgroundColor | `colors.surface`                    |
| borderRadius    | 16 (`Radius.lg`)                    |
| borderTopLeftRadius | 4                               |
| padding         | 14                                  |
| flex            | 1                                   |
| maxWidth        | `'100%'`                            |

The `borderTopLeftRadius: 4` creates the chat-bubble "tail" pointing toward the avatar.

### 8.5 Bubble Text

| Property   | Value                              |
|------------|------------------------------------|
| fontSize   | 14                                 |
| lineHeight | 22                                 |
| color      | `colors.textPrimary`               |
| fontWeight | `'400'` (`FontWeight.normal`)      |

Text content: `lang === 'en' ? node.text_en : node.text_ko`

### 8.6 Accessibility

| Attribute           | Value                              |
|---------------------|------------------------------------|
| accessibilityRole   | `'text'`                           |
| accessibilityLabel  | `'AI: ' + narrationText`           |

---

## 9. Article Bubble (right-aligned)

### 9.1 Layout

```
                   [Bubble                    ]
                   [ [Thumbnail]  Title       ]
                   [              Source  Date ]
```

### 9.2 Row Container

| Property       | Value                               |
|----------------|-------------------------------------|
| flexDirection  | `'row'`                             |
| justifyContent | `'flex-end'`                        |
| marginBottom   | 12 (`Spacing.md`)                   |
| paddingLeft    | 48 (visual asymmetry, mirror of narration paddingRight) |

### 9.3 Bubble (Pressable)

| Property        | Value                                   |
|-----------------|-----------------------------------------|
| backgroundColor | `colors.card`                           |
| borderRadius    | 16 (`Radius.lg`)                        |
| borderTopRightRadius | 4                                  |
| borderWidth     | 1                                       |
| borderColor     | `colors.border`                         |
| padding         | 12 (`Spacing.md`)                       |
| flexDirection   | `'row'`                                 |
| maxWidth        | `'100%'`                                |
| flex            | 1                                       |
| Pressed opacity | 0.85                                    |

The `borderTopRightRadius: 4` creates the tail pointing right.

On press: `Linking.openURL(node.link)`.

### 9.4 Thumbnail (if image_url exists)

| Property        | Value                               |
|-----------------|-------------------------------------|
| width           | 56                                  |
| height          | 56                                  |
| borderRadius    | 8 (`Radius.sm`)                     |
| backgroundColor | `colors.border` (placeholder)       |
| marginRight     | 10                                  |
| overflow        | `'hidden'`                          |

Use `expo-image` `<Image>`:

```tsx
<Image
  source={node.image_url}
  style={{ width: 56, height: 56 }}
  contentFit="cover"
  transition={200}
  recyclingKey={node.article_id}
/>
```

If `image_url` is `undefined` or `null`: do not render thumbnail. The text content fills the full bubble width.

### 9.5 Text Content Area

| Property        | Value                               |
|-----------------|-------------------------------------|
| flex            | 1                                   |
| justifyContent  | `'center'`                          |

**Title:**

| Property     | Value                              |
|--------------|------------------------------------|
| fontSize     | 13 (`FontSize.sm`)                 |
| fontWeight   | `'700'` (`FontWeight.bold`)        |
| fontFamily   | `FontFamily.serif` (`'Lora-Bold'`) |
| color        | `colors.textPrimary`               |
| lineHeight   | 18                                 |
| numberOfLines| 2                                  |
| ellipsizeMode| `'tail'`                           |

Text: `lang === 'en' ? node.title_en : node.title_ko`

**Meta Row** (below title):

| Property       | Value                               |
|----------------|-------------------------------------|
| flexDirection  | `'row'`                             |
| alignItems     | `'center'`                          |
| marginTop      | 4 (`Spacing.xs`)                    |
| gap            | 6                                   |

**Source Text:**

| Property   | Value                              |
|------------|------------------------------------|
| fontSize   | 11 (`FontSize.xs`)                 |
| color      | `colors.textSecondary`             |
| fontWeight | `'600'`                            |

**Date Text:**

| Property   | Value                              |
|------------|------------------------------------|
| fontSize   | 11 (`FontSize.xs`)                 |
| color      | `colors.textDim`                   |

### 9.6 External Link Indicator

A small icon at the bottom-right corner of the bubble:

| Property | Value                                            |
|----------|--------------------------------------------------|
| Icon     | `<ExternalLink size={10} color={colors.textDim} />` |
| Position | absolute, bottom: 8, right: 8                   |
| opacity  | 0.6                                              |

### 9.7 Accessibility

| Attribute           | Value                                                        |
|---------------------|--------------------------------------------------------------|
| accessibilityRole   | `'link'`                                                     |
| accessibilityLabel  | `articleTitle + ', ' + node.source + ', ' + formattedDate`   |
| accessibilityHint   | `t('modal.view_original')` ("원문 보기" / "View Original")   |

---

## 10. Summary Section (AI Closing Remark)

Rendered at the bottom of the chat area after all nodes.

### 10.1 Layout

```
[Sparkles Icon]  AI Summary
[Summary text spanning full width    ]
[                                    ]
```

### 10.2 Container

| Property        | Value                               |
|-----------------|-------------------------------------|
| marginTop       | 8                                   |
| backgroundColor | `colors.indigoBg`                   |
| borderRadius    | 12 (`Radius.md`)                    |
| padding         | 14                                  |
| borderWidth     | 1                                   |
| borderColor     | `colors.primaryBorder`              |

### 10.3 Header Row

| Property       | Value                               |
|----------------|-------------------------------------|
| flexDirection  | `'row'`                             |
| alignItems     | `'center'`                          |
| gap            | 6                                   |
| marginBottom   | 8 (`Spacing.sm`)                    |

**Icon**: `<Cpu size={13} color={colors.summaryIndigo} />`

**Label:**

| Property   | Value                              |
|------------|------------------------------------|
| fontSize   | 12                                 |
| fontWeight | `'700'`                            |
| color      | `colors.summaryIndigo`             |

- Korean: `'AI 요약'`
- English: `'AI Summary'`
- Translation key: `'story.summary'`

### 10.4 Summary Text

| Property   | Value                              |
|------------|------------------------------------|
| fontSize   | 14                                 |
| lineHeight | 22                                 |
| color      | `colors.textPrimary`               |
| fontWeight | `'400'`                            |

Text: `lang === 'en' ? story.summary_en : story.summary_ko`

### 10.5 Accessibility

| Attribute           | Value                              |
|---------------------|------------------------------------|
| accessibilityRole   | `'summary'`                        |
| accessibilityLabel  | `'AI Summary: ' + summaryText`     |

---

## 11. Spacing and Dimensions Summary

All values are in density-independent pixels (dp/pt).

### 11.1 Design Token Reference

From `mobile/lib/theme.ts`:

| Token        | Value | Usage                                  |
|--------------|-------|----------------------------------------|
| Spacing.xs   | 4     | Minimal gaps (meta row margin)         |
| Spacing.sm   | 8     | Avatar-to-bubble gap, tab gap          |
| Spacing.md   | 12    | Bubble-to-bubble vertical gap, bubble padding |
| Spacing.lg   | 16    | Container padding, date separator margin |
| Spacing.xl   | 24    | (not used in this component)           |
| Spacing.xxl  | 32    | (not used in this component)           |
| Radius.sm    | 8     | Avatar, thumbnail                      |
| Radius.md    | 12    | Summary section                        |
| Radius.lg    | 16    | Outer container, chat bubbles          |
| Radius.xl    | 20    | Tab pills                             |
| FontSize.xs  | 11    | Date separator, source, story count    |
| FontSize.sm  | 13    | Tab text, article title                |
| FontSize.base| 15    | Header title                           |
| MIN_TOUCH_TARGET | 44 | All pressable elements                 |

### 11.2 Outer Container Dimensions

| Property         | Value |
|------------------|-------|
| marginHorizontal | 16    |
| marginTop        | 12    |
| marginBottom     | 8     |
| padding          | 16    |
| borderRadius     | 16    |

### 11.3 Chat Bubble Asymmetry

| Bubble Type | paddingLeft offset | paddingRight offset |
|-------------|-------------------|---------------------|
| Narration   | 0 (avatar + gap)  | 48                  |
| Article     | 48                | 0                   |

This 48dp offset ensures bubbles never span the full width, creating the characteristic chat stagger. The value is derived from the avatar column width (28 + 8 = 36) rounded up to 48 for breathing room.

---

## 12. Fold/Unfold Animation

### 12.1 Implementation

Use React Native `Animated.Value` (not `LayoutAnimation`, which can conflict with the parent `ScrollView`).

```typescript
const heightAnim = useRef(new Animated.Value(0)).current;
const chevronAnim = useRef(new Animated.Value(0)).current;
const [expanded, setExpanded] = useState(false);
const [contentHeight, setContentHeight] = useState(0);

const toggle = () => {
  const toValue = expanded ? 0 : 1;
  Animated.parallel([
    Animated.timing(heightAnim, {
      toValue,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,  // height cannot use native driver
    }),
    Animated.timing(chevronAnim, {
      toValue,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,  // transform can use native driver
    }),
  ]).start();
  setExpanded(!expanded);
};
```

### 12.2 Animated Height

```tsx
const animatedHeight = heightAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [0, contentHeight],
});

<Animated.View style={{ height: animatedHeight, overflow: 'hidden' }}>
  <View onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}>
    {/* chat content */}
  </View>
</Animated.View>
```

### 12.3 Chevron Rotation

```tsx
const chevronRotation = chevronAnim.interpolate({
  inputRange: [0, 1],
  outputRange: ['0deg', '180deg'],
});

<Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
  <ChevronDown size={16} color={colors.textSecondary} />
</Animated.View>
```

### 12.4 Animation Specifications

| Property  | Value                                                |
|-----------|------------------------------------------------------|
| Duration  | 280ms                                                |
| Easing    | `Easing.out(Easing.cubic)` (fast start, gentle stop)|
| Height    | Non-native driver (required for layout animation)    |
| Chevron   | Native driver (GPU-accelerated rotation)             |

### 12.5 Measuring Content Height

Use an offscreen measurement approach: render the content in an absolutely positioned, invisible wrapper on first render, capture its height via `onLayout`, then use that value as the `outputRange` target.

```tsx
{contentHeight === 0 && (
  <View
    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
    onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
  >
    {/* same chat content */}
  </View>
)}
```

### 12.6 Accessibility: Reduced Motion

```typescript
import { AccessibilityInfo } from 'react-native';

const [reduceMotion, setReduceMotion] = useState(false);
useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
}, []);
```

If `reduceMotion` is true, set `duration: 0` on all animations.

---

## 13. Multi-Story Handling

### 13.1 Strategy

| Story Count | Behavior                                               |
|-------------|--------------------------------------------------------|
| 0           | Do not render component at all                         |
| 1           | Render without tabs; show chat directly                |
| 2-3         | Render pill-shaped tabs below header                   |
| 4+          | Render tabs in horizontal ScrollView                   |

### 13.2 Tab Switching

When a tab is tapped, switch the active story index. The chat area cross-fades to the new story content.

```typescript
const [activeIdx, setActiveIdx] = useState(0);
const fadeAnim = useRef(new Animated.Value(1)).current;

const switchStory = (idx: number) => {
  if (idx === activeIdx) return;
  Animated.timing(fadeAnim, {
    toValue: 0,
    duration: 120,
    useNativeDriver: true,
  }).start(() => {
    setActiveIdx(idx);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  });
};
```

### 13.3 Swipe Between Stories

Not recommended for this component. The chat area is inside a vertical `ScrollView` which is inside the main screen `ScrollView`. Adding horizontal swipe gestures would create gesture conflicts. Tabs are sufficient for 2-4 stories.

---

## 14. Interactive States

### 14.1 Collapsed Header (Pressable)

| State    | Visual Change                           |
|----------|-----------------------------------------|
| Default  | `opacity: 1`                            |
| Pressed  | `opacity: 0.85`                         |

### 14.2 Article Bubble (Pressable)

| State    | Visual Change                           |
|----------|-----------------------------------------|
| Default  | `opacity: 1`, `borderColor: colors.border` |
| Pressed  | `opacity: 0.85`                         |

### 14.3 Tab (Pressable)

| State    | Visual Change                           |
|----------|-----------------------------------------|
| Default  | Per active/inactive styles above        |
| Pressed  | `opacity: 0.8`                          |

---

## 15. Edge Cases

### 15.1 Empty Stories Array

```typescript
if (!stories || stories.length === 0) return null;
```

### 15.2 Story with No Nodes

Skip stories where `story.nodes.length === 0`. If all stories are empty after filtering, return null.

### 15.3 Missing Image on Article Node

Do not render thumbnail. Text fills the full bubble width. No fallback icon needed (unlike feed cards) because the bubble is compact enough without it.

### 15.4 Very Long Narration Text

No truncation. Narration text renders at full length. The ScrollView handles overflow.

### 15.5 Very Long Article Title

Truncated to 2 lines via `numberOfLines={2}` and `ellipsizeMode="tail"`.

### 15.6 Missing Source on Article Node

Do not render source text. Show only date in the meta row.

### 15.7 Missing Summary

If `summary_ko` and `summary_en` are both empty, do not render the summary section.

### 15.8 Single Node Story

Render normally. Even a single narration or article bubble is valid.

---

## 16. Dark/Light Theme Mapping

All colors are referenced through the `colors` object from `useTheme()`. Key mappings:

| Semantic Role          | Light (`LightColors`)          | Dark (`DarkColors`)           |
|------------------------|--------------------------------|-------------------------------|
| Container bg           | `highlightBg` = `#F0FDFA`     | `highlightBg` = `#112525`    |
| Container border       | `border` = `#E7E5E4`          | `border` = `#302B28`         |
| Narration bubble bg    | `surface` = `#F5F2EE`         | `surface` = `#211D1B`        |
| Article bubble bg      | `card` = `#FFFFFF`             | `card` = `#231F1D`           |
| Article bubble border  | `border` = `#E7E5E4`          | `border` = `#302B28`         |
| Summary bg             | `indigoBg` = `#F0FDFA`        | `indigoBg` = `#112525`       |
| Summary border         | `primaryBorder` = `#99F6E4`   | `primaryBorder` = `#1A3B36`  |
| Summary accent         | `summaryIndigo` = `#0D7377`   | `summaryIndigo` = `#2DD4BF`  |
| Primary text           | `textPrimary` = `#1C1917`     | `textPrimary` = `#E7E5E4`   |
| Secondary text         | `textSecondary` = `#78716C`   | `textSecondary` = `#A8A29E` |
| Dim text               | `textDim` = `#A8A29E`         | `textDim` = `#78716C`       |
| Icon tint              | `primary` = `#0D7377`         | `primary` = `#14B8A6`       |
| Active tab bg          | `primary` = `#0D7377`         | `primary` = `#14B8A6`       |
| Inactive tab bg        | `surface` = `#F5F2EE`         | `surface` = `#211D1B`       |

---

## 17. Bilingual Text Resolution

All user-facing text uses either translations or field-level localization:

```typescript
const { lang, t } = useLanguage();

// For story title
const storyTitle = lang === 'en' ? story.title_en : story.title_ko;

// For narration text
const narration = lang === 'en' ? node.text_en : node.text_ko;

// For article title
const articleTitle = lang === 'en'
  ? (node.title_en || node.title_ko)
  : (node.title_ko || node.title_en);

// For summary
const summary = lang === 'en' ? story.summary_en : story.summary_ko;
```

Fallback chain: Prefer requested language, fall back to the other language, never show empty.

---

## 18. Required Translation Keys

Add to `mobile/lib/translations.ts`:

```typescript
// Story Timeline
'story.title': { ko: '스토리 타임라인', en: 'Story Timeline' },
'story.summary': { ko: 'AI 요약', en: 'AI Summary' },
'story.expand_hint': { ko: '탭하여 펼치기', en: 'Tap to expand' },
'story.collapse_hint': { ko: '탭하여 접기', en: 'Tap to collapse' },
```

---

## 19. Required Imports

```typescript
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, Animated, Easing, Linking, AccessibilityInfo,
} from 'react-native';
import { Image } from 'expo-image';
import { Cpu, ChevronDown, ExternalLink } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { FontFamily, Spacing, Radius, FontSize, FontWeight } from '@/lib/theme';
```

---

## 20. Performance Considerations

1. **Wrap in `React.memo`**: The component receives `stories` as a prop. Memoize to avoid re-renders when the parent re-renders for unrelated reasons.

2. **Defer expanded content**: Do not render the chat content at all until the user first expands. Use a `hasEverExpanded` flag:

   ```typescript
   const [hasEverExpanded, setHasEverExpanded] = useState(false);
   const toggle = () => {
     if (!hasEverExpanded) setHasEverExpanded(true);
     // ...animation
   };
   ```

   Render the chat content only when `hasEverExpanded` is true. This avoids measuring and rendering potentially dozens of bubble nodes on initial load when the component is collapsed.

3. **Image lazy loading**: `expo-image` handles this automatically with `recyclingKey`.

4. **Do not virtualize**: The chat area will have at most 10-20 nodes per story. FlatList overhead is not justified. A simple `.map()` inside `ScrollView` is appropriate.

---

## 21. Component File Structure

```
mobile/
  components/
    story/
      StoryTimeline.tsx       ← Main component (collapsed + expanded)
```

Keep it in a single file. The component is self-contained. Sub-components (NarrationBubble, ArticleBubble, DateSeparator, SummaryBlock) are defined as inner functions or `React.memo` wrappers within the same file, following the codebase pattern established in `index.tsx`.
