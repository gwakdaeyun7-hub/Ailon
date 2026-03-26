/**
 * Related Articles Section — 요약 모달 내 관련 기사 가로 스크롤
 */

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Newspaper } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useArticles } from '@/hooks/useArticle';
import type { Article } from '@/lib/types';
import { openArticle } from '@/lib/openArticle';

interface Props {
  relatedIds: string[];
}

const CARD_W = 200;
const CARD_H = 140;

export const RelatedArticlesSection = React.memo(function RelatedArticlesSection({ relatedIds }: Props) {
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const { articles, loading } = useArticles(relatedIds);

  if (!relatedIds || relatedIds.length === 0) return null;
  if (loading) return null;

  const items = relatedIds
    .map(id => articles[id])
    .filter((a): a is Article => !!a);

  if (items.length === 0) return null;

  return (
    <View style={{ marginTop: 24, marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 10, paddingHorizontal: 20 }}>
        {t('modal.related')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      >
        {items.map((a, idx) => {
          const title = lang === 'en'
            ? (a.display_title_en || a.display_title || a.title)
            : (a.display_title || a.title);
          return (
            <Pressable
              key={a.article_id || idx}
              onPress={() => a.link && openArticle(a.link)}
              style={{
                width: CARD_W,
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: 'hidden',
              }}
            >
              {a.image_url ? (
                <Image
                  source={a.image_url}
                  style={{ width: CARD_W, height: 80 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={{ width: CARD_W, height: 80, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <Newspaper size={24} color={colors.textDim} />
                </View>
              )}
              <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary, lineHeight: 16 }} numberOfLines={2}>
                  {title}
                </Text>
                {a.source && (
                  <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 4 }}>{a.source}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});
