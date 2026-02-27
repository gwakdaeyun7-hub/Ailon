/**
 * Quiz Entry Card — 뉴스 피드 하단 퀴즈 진입점
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { HelpCircle, ChevronRight } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  onPress: () => void;
  questionCount?: number;
}

export const QuizEntryCard = React.memo(function QuizEntryCard({ onPress, questionCount = 5 }: Props) {
  const { t } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
      <Pressable
        onPress={onPress}
        accessibilityLabel={t('quiz.start')}
        accessibilityRole="button"
        style={({ pressed }) => ({
          backgroundColor: colors.highlightBg,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: colors.summaryIndigo + '20',
          alignItems: 'center', justifyContent: 'center', marginRight: 12,
        }}>
          <HelpCircle size={20} color={colors.summaryIndigo} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
            {t('quiz.title')}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {questionCount}{t('quiz.of')}{questionCount} {t('quiz.question')}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
});
