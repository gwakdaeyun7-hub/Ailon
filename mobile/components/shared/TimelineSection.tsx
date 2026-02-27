/**
 * Timeline Section — 요약 모달 내 관련 타임라인 표시
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
    .filter((a): a is Article => !!a);

  if (nodes.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 10 }}>
        {t('modal.timeline')}
      </Text>
      <View style={{ paddingLeft: 12 }}>
        {nodes.map((node, idx) => {
          const title = lang === 'en'
            ? (node.display_title_en || node.display_title || node.title)
            : (node.display_title || node.title);
          const date = node.published?.split('T')[0] ?? '';
          const isLast = idx === nodes.length - 1;

          return (
            <View key={node.article_id || idx} style={{ flexDirection: 'row', minHeight: 48 }}>
              {/* Timeline line + dot */}
              <View style={{ width: 20, alignItems: 'center' }}>
                <View style={{
                  width: 10, height: 10, borderRadius: 5,
                  backgroundColor: colors.summaryIndigo,
                  marginTop: 4,
                }} />
                {!isLast && (
                  <View style={{ width: 2, flex: 1, backgroundColor: colors.border, marginTop: 2 }} />
                )}
              </View>
              {/* Content */}
              <Pressable
                onPress={() => node.link && Linking.openURL(node.link)}
                style={{ flex: 1, paddingLeft: 8, paddingBottom: isLast ? 0 : 12 }}
              >
                <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '600', lineHeight: 18 }} numberOfLines={2}>
                  {title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Clock size={10} color={colors.textSecondary} />
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>{date}</Text>
                  {node.source && (
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>· {node.source}</Text>
                  )}
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
});
