/**
 * Timeline Section — 메인 화면 하이라이트 위에 표시
 * 하이라이트 기사들의 timeline_ids를 모아 과거 관련 기사 타임라인 표시
 * 세로 리스트 레이아웃
 */

import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
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
    <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Clock size={16} color={colors.textSecondary} />
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
          {t('modal.timeline')}
        </Text>
      </View>
      <View style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}>
        {nodes.slice(0, 9).map((node, idx) => {
          const title = lang === 'en'
            ? (node.display_title_en || node.display_title || node.title)
            : (node.display_title || node.title);
          const date = node.published?.split('T')[0] ?? '';
          const isLast = idx === Math.min(nodes.length, 9) - 1;

          return (
            <Pressable
              key={node.article_id || idx}
              onPress={() => node.link && Linking.openURL(node.link)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: colors.border,
                borderStyle: 'dashed' as any,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <View style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: colors.summaryTeal,
                }} />
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{date}</Text>
              </View>
              <Text
                style={{ fontSize: 14, color: colors.textPrimary, fontWeight: '600', lineHeight: 20, marginLeft: 16 }}
                numberOfLines={2}
              >
                {title}
              </Text>
              {node.source && (
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, marginLeft: 16 }}>
                  {node.source}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});
