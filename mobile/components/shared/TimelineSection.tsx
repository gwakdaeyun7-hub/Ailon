/**
 * Timeline Section — 메인 화면 하이라이트 위에 표시
 * 하이라이트 기사들의 timeline_ids를 모아 과거 관련 기사 타임라인 표시
 */

import React from 'react';
import { View, Text, Pressable, Linking, ScrollView } from 'react-native';
import { Clock } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useArticles } from '@/hooks/useArticle';
import type { Article } from '@/lib/types';

interface Props {
  timelineIds: string[];
}

export const TimelineSection = React.memo(function TimelineSection({ timelineIds }: Props) {
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const { articles, loading } = useArticles(timelineIds);

  if (!timelineIds || timelineIds.length === 0) return null;
  if (loading) return null;

  const nodes = timelineIds
    .map(id => articles[id])
    .filter((a): a is Article => !!a)
    .sort((a, b) => (b.published ?? '').localeCompare(a.published ?? ''));

  if (nodes.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Clock size={16} color={colors.textSecondary} />
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
          {t('modal.timeline')}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {nodes.slice(0, 10).map((node, idx) => {
          const title = lang === 'en'
            ? (node.display_title_en || node.display_title || node.title)
            : (node.display_title || node.title);
          const date = node.published?.split('T')[0] ?? '';

          return (
            <Pressable
              key={node.article_id || idx}
              onPress={() => node.link && Linking.openURL(node.link)}
              style={{
                width: 200,
                backgroundColor: colors.cardBg,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <View style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: colors.summaryIndigo,
                }} />
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>{date}</Text>
              </View>
              <Text
                style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '600', lineHeight: 18 }}
                numberOfLines={3}
              >
                {title}
              </Text>
              {node.source && (
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 6 }}>
                  {node.source}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});
