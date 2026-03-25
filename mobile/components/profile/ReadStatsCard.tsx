/**
 * ReadStatsCard — 읽은 기사 통계 카드
 * "이번 주 N개" / "총 N개 읽음" / "저장한 기사 N개"
 */

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { BookOpen, TrendingUp, Bookmark } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { cardShadow } from '@/lib/theme';

interface ReadStatsCardProps {
  weeklyCount: number;
  totalCount: number;
  savedCount: number;
  loading: boolean;
}

export default function ReadStatsCard({ weeklyCount, totalCount, savedCount, loading }: ReadStatsCardProps) {
  const { t, lang } = useLanguage();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.card, borderRadius: 16, padding: 20, alignItems: 'center', ...cardShadow }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const stats = [
    {
      icon: TrendingUp,
      value: weeklyCount,
      label: t('profile.stats_weekly'),
    },
    {
      icon: BookOpen,
      value: totalCount,
      label: t('profile.stats_total'),
    },
    {
      icon: Bookmark,
      value: savedCount,
      label: t('profile.stats_saved'),
    },
  ];

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.card, borderRadius: 16, padding: 20, ...cardShadow }}>
      <Text style={{
        color: colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
        ...(lang === 'en' ? { textTransform: 'uppercase', letterSpacing: 0.5 } : {}),
        marginBottom: 14,
      }}>
        {t('profile.stats_title')}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        {stats.map(({ icon: Icon, value, label }) => (
          <View key={label} style={{ alignItems: 'center', gap: 6 }}>
            <Icon size={20} color={colors.primary} />
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>
              {value}
            </Text>
            <Text style={{ color: colors.textDim, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
