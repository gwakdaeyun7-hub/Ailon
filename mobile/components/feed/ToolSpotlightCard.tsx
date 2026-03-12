/**
 * Tool Spotlight Card — 뉴스 피드 브리핑 아래에 표시되는 "오늘의 AI 도구" 카드
 * Phase 1: daily_briefings/{date}.tool_spotlight 필드 기반
 */

import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { Wrench, ExternalLink } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useBriefing } from '@/hooks/useBriefing';
import { cardShadow, FontFamily } from '@/lib/theme';
import type { ToolSpotlight } from '@/lib/types';

const CATEGORY_COLORS: Record<string, { light: string; dark: string }> = {
  coding: { light: '#0D7377', dark: '#14B8A6' },
  research: { light: '#7C3AED', dark: '#A78BFA' },
  productivity: { light: '#B45309', dark: '#FBBF24' },
  creative: { light: '#EA580C', dark: '#FB923C' },
  writing: { light: '#15803D', dark: '#4ADE80' },
  other: { light: '#6B7280', dark: '#9CA3AF' },
};

export function ToolSpotlightCard() {
  const { briefing } = useBriefing();
  const { t, lang } = useLanguage();
  const { colors, isDark } = useTheme();

  const tool: ToolSpotlight | undefined = briefing?.tool_spotlight;
  if (!tool?.name) return null;

  const catColor = CATEGORY_COLORS[tool.category] || CATEGORY_COLORS.other;
  const accent = isDark ? catColor.dark : catColor.light;
  const name = lang === 'en' ? (tool.name_en || tool.name) : tool.name;
  const desc = lang === 'en' ? tool.description_en : tool.description_ko;
  const why = lang === 'en' ? tool.why_useful_en : tool.why_useful_ko;
  const catLabel = t(`tools.cat_${tool.category}`) || tool.category;

  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: 14, marginHorizontal: 16,
      marginBottom: 20, borderWidth: 1, borderColor: colors.border,
      overflow: 'hidden', ...cardShadow,
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
      }}>
        <View style={{
          width: 28, height: 28, borderRadius: 8,
          backgroundColor: accent + '18', alignItems: 'center', justifyContent: 'center',
        }}>
          <Wrench size={14} color={accent} />
        </View>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textDim, letterSpacing: 0.3, textTransform: 'uppercase' }}>
          {t('tool.spotlight_title')}
        </Text>
        <View style={{ marginLeft: 'auto', backgroundColor: accent + '18', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: accent }}>{catLabel}</Text>
        </View>
      </View>

      {/* Tool name + description */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, fontFamily: FontFamily.serif, marginBottom: 4 }}>
          {name}
        </Text>
        <Text style={{ fontSize: 12, lineHeight: 18, color: colors.textSecondary }}>
          {desc}
        </Text>
      </View>

      {/* Why useful */}
      {why ? (
        <View style={{
          marginHorizontal: 16, marginBottom: 12,
          backgroundColor: accent + '0D', borderRadius: 8,
          paddingHorizontal: 10, paddingVertical: 6,
        }}>
          <Text style={{ fontSize: 11, lineHeight: 17, color: accent, fontWeight: '600' }}>
            {why}
          </Text>
        </View>
      ) : null}

      {/* Try it button */}
      {tool.url ? (
        <Pressable
          onPress={() => Linking.openURL(tool.url)}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            marginHorizontal: 16, marginBottom: 14,
            backgroundColor: accent, borderRadius: 10,
            paddingVertical: 10, opacity: pressed ? 0.8 : 1,
          })}
          accessibilityRole="link"
          accessibilityLabel={`${t('tool.try_it')} ${name}`}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
            {t('tool.try_it')}
          </Text>
          <ExternalLink size={14} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}
