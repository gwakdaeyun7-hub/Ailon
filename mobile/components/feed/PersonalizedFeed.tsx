/**
 * PersonalizedFeed — "맞춤" 탭 콘텐츠
 * 사용자의 좋아요/조회 기반으로 기사 추천 순서 재정렬
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import type { Article } from '@/lib/types';

interface Props {
  articles: Article[];
  userLikes: string[]; // 좋아요한 기사 링크들
  renderCard: (article: Article, idx: number) => React.ReactNode;
}

/**
 * 간단한 규칙 기반 개인화 점수:
 * - 좋아요한 기사와 같은 카테고리: +3
 * - 좋아요한 기사와 태그 겹침: tag당 +2
 * - 기본 스코어 반영: score/100 * 1
 */
function personalizeScore(article: Article, likedArticles: Article[]): number {
  let bonus = 0;
  const aCat = article.category ?? '';
  const aTags = new Set((article.tags ?? []).map(t => t.toLowerCase()));

  for (const liked of likedArticles) {
    if (liked.category === aCat && aCat) bonus += 3;
    for (const tag of liked.tags ?? []) {
      if (aTags.has(tag.toLowerCase())) bonus += 2;
    }
  }
  bonus += (article.score ?? 0) / 100;
  return bonus;
}

export const PersonalizedFeed = React.memo(function PersonalizedFeed({ articles, userLikes, renderCard }: Props) {
  const { t } = useLanguage();
  const { colors } = useTheme();

  // Filter liked articles for scoring reference
  const likedArticles = useMemo(() => {
    const likeSet = new Set(userLikes);
    return articles.filter(a => likeSet.has(a.link));
  }, [articles, userLikes]);

  const sorted = useMemo(() => {
    if (likedArticles.length === 0) {
      // No like history — return by score
      return [...articles].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
    return [...articles]
      .map(a => ({ article: a, pScore: personalizeScore(a, likedArticles) }))
      .sort((a, b) => b.pScore - a.pScore)
      .map(item => item.article);
  }, [articles, likedArticles]);

  if (sorted.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
        <Text style={{ fontSize: 14, color: colors.textSecondary }}>{t('feed.no_data')}</Text>
      </View>
    );
  }

  return (
    <View>
      {sorted.map((article, idx) => renderCard(article, idx))}
    </View>
  );
});
