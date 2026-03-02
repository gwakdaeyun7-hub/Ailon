/**
 * StoryTimeline - AI 스토리 타임라인 (채팅 스타일)
 * Design E: Conversational chat-bubble layout
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Linking, LayoutAnimation, Platform, UIManager } from 'react-native';
import { BookOpen, ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native';
import { useStoryTimeline } from '@/hooks/useStoryTimeline';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import type { StoryThread, StoryNode } from '@/lib/types';

// Android LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  date: string;
}

/** 날짜 포맷: "2026-03-02" -> "3월 2일" / "Mar 2" */
function formatNodeDate(dateStr: string, lang: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (lang === 'en') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[month - 1]} ${day}`;
  }
  return `${month}월 ${day}일`;
}

/** 날짜 구분선 */
function DateSeparator({ dateStr, lang, colors }: { dateStr: string; lang: string; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <Text style={{ fontSize: 11, color: colors.textDim, marginHorizontal: 10 }}>
        {formatNodeDate(dateStr, lang)}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
}

/** AI 나레이션 버블 (왼쪽 정렬) */
function NarrationBubble({ text, colors }: { text: string; colors: any }) {
  return (
    <View style={{
      alignSelf: 'flex-start',
      maxWidth: '80%',
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
      borderTopLeftRadius: 4,
      marginBottom: 8,
    }}>
      <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textPrimary }}>
        {text}
      </Text>
    </View>
  );
}

/** 기사 카드 버블 (오른쪽 정렬) */
function ArticleBubble({ node, lang, colors }: { node: StoryNode; lang: string; colors: any }) {
  const title = lang === 'en'
    ? (node.title_en || node.title_ko || '')
    : (node.title_ko || node.title_en || '');
  const meta = [node.source, formatNodeDate(node.date, lang)].filter(Boolean).join(' · ');

  const handlePress = useCallback(() => {
    if (node.link) Linking.openURL(node.link);
  }, [node.link]);

  return (
    <Pressable
      onPress={handlePress}
      style={{
        alignSelf: 'flex-end',
        maxWidth: '75%',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        borderTopRightRadius: 4,
        padding: 12,
        marginBottom: 8,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', lineHeight: 18, color: colors.textPrimary }}>
        {title}
      </Text>
      {meta ? (
        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
          {meta}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** 요약 버블 */
function SummaryBubble({ text, label, colors }: { text: string; label: string; colors: any }) {
  return (
    <View style={{
      backgroundColor: colors.summaryIndigo + '15',
      borderRadius: 12,
      padding: 14,
      marginTop: 8,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Sparkles size={13} color={colors.summaryIndigo} />
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.summaryIndigo, marginLeft: 5 }}>
          {label}
        </Text>
      </View>
      <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textPrimary, textAlign: 'center' }}>
        {text}
      </Text>
    </View>
  );
}

/** 스토리 노드 목록 렌더 */
function StoryNodes({ story, lang, colors, summaryLabel }: {
  story: StoryThread;
  lang: string;
  colors: any;
  summaryLabel: string;
}) {
  let lastDate = '';

  return (
    <View style={{ paddingTop: 8, paddingBottom: 4 }}>
      {story.nodes.map((node, idx) => {
        const showDateSep = node.date !== lastDate;
        if (node.date) lastDate = node.date;

        const text = node.type === 'narration'
          ? (lang === 'en' ? (node.text_en || node.text_ko) : (node.text_ko || node.text_en))
          : undefined;

        return (
          <React.Fragment key={idx}>
            {showDateSep && node.date ? (
              <DateSeparator dateStr={node.date} lang={lang} colors={colors} />
            ) : null}
            {node.type === 'narration' && text ? (
              <NarrationBubble text={text} colors={colors} />
            ) : node.type === 'article' ? (
              <ArticleBubble node={node} lang={lang} colors={colors} />
            ) : null}
          </React.Fragment>
        );
      })}

      {/* Summary */}
      {(() => {
        const summaryText = lang === 'en'
          ? (story.summary_en || story.summary_ko)
          : (story.summary_ko || story.summary_en);
        return summaryText ? (
          <SummaryBubble text={summaryText} label={summaryLabel} colors={colors} />
        ) : null;
      })()}
    </View>
  );
}

export const StoryTimeline = React.memo(function StoryTimeline({ date }: Props) {
  const { data, loading } = useStoryTimeline(date);
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  }, []);

  const selectStory = useCallback((idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveIdx(idx);
  }, []);

  // 로딩 중이거나 데이터 없으면 렌더하지 않음
  if (loading || !data || !data.stories || data.stories.length === 0) return null;

  const stories = data.stories;
  const activeStory = stories[activeIdx] || stories[0];
  const storyTitle = lang === 'en'
    ? (activeStory.title_en || activeStory.title_ko)
    : (activeStory.title_ko || activeStory.title_en);

  return (
    <View style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 8 }}>
      {/* Collapsed header bar */}
      <Pressable
        onPress={toggle}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        accessibilityRole="button"
        accessibilityLabel={t('story.title')}
      >
        <View style={{
          width: 30, height: 30, borderRadius: 8,
          backgroundColor: colors.primary + '18',
          alignItems: 'center', justifyContent: 'center', marginRight: 10,
        }}>
          <BookOpen size={15} color={colors.primary} />
        </View>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
          {t('story.title')}
        </Text>
        <View style={{
          backgroundColor: colors.primary + '18',
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 2,
          marginRight: 8,
        }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>
            {stories.length}{t('story.count')}
          </Text>
        </View>
        {expanded
          ? <ChevronUp size={18} color={colors.textSecondary} />
          : <ChevronDown size={18} color={colors.textSecondary} />
        }
      </Pressable>

      {/* Expanded content */}
      {expanded ? (
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 12,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderWidth: 1,
          borderTopWidth: 0,
          borderColor: colors.border,
          padding: 14,
          marginTop: -4,
        }}>
          {/* Multi-story pill tabs */}
          {stories.length > 1 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {stories.map((s, idx) => {
                const isActive = idx === activeIdx;
                const label = lang === 'en'
                  ? (s.title_en || s.title_ko)
                  : (s.title_ko || s.title_en);
                return (
                  <Pressable
                    key={s.story_id}
                    onPress={() => selectStory(idx)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 14,
                      backgroundColor: isActive ? colors.primary + '18' : 'transparent',
                      borderWidth: 1,
                      borderColor: isActive ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{
                      fontSize: 12,
                      fontWeight: isActive ? '600' : '400',
                      color: isActive ? colors.primary : colors.textSecondary,
                    }} numberOfLines={1}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {/* Story title */}
          <Text style={{
            fontSize: 14, fontWeight: '700', color: colors.textPrimary,
            marginBottom: 6,
          }}>
            {storyTitle}
          </Text>

          {/* Chat nodes */}
          <StoryNodes
            story={activeStory}
            lang={lang}
            colors={colors}
            summaryLabel={t('story.summary')}
          />
        </View>
      ) : null}
    </View>
  );
});
