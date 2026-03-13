/**
 * AI 도구 & 팁 — 준비 중 (Phase 2)
 */

import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wand2 } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

export default function ToolsScreen() {
  const { lang } = useLanguage();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Wand2 size={36} color={colors.textDim} style={{ marginBottom: 20 }} />
        <Text style={{
          fontSize: 18, fontWeight: '700', color: colors.textPrimary,
          marginBottom: 8, textAlign: 'center',
        }}>
          {lang === 'en' ? 'Coming Soon' : '준비 중이에요'}
        </Text>
        <Text style={{
          fontSize: 14, color: colors.textSecondary,
          textAlign: 'center', lineHeight: 20,
        }}>
          {lang === 'en'
            ? 'AI tools & tips will be available in a future update.'
            : '새로운 AI 도구 & 팁 기능을 준비하고 있어요.\n업데이트를 기대해 주세요!'}
        </Text>
      </View>
    </SafeAreaView>
  );
}
