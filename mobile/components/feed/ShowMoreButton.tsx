import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

interface ShowMoreButtonProps {
  /** Number of currently shown items (for "5/20" format) */
  shownCount?: number;
  /** Total number of items (for "5/20" format) */
  totalCount?: number;
  /** Remaining count (for "(5)" format when shownCount/totalCount not provided) */
  moreCount?: number;
  /** If true, renders as collapse button */
  isExpanded?: boolean;
  onPress: () => void;
  /** Section name for accessibility context */
  sectionName?: string;
}

export function ShowMoreButton({
  shownCount,
  totalCount,
  moreCount,
  isExpanded,
  onPress,
  sectionName,
}: ShowMoreButtonProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const label = isExpanded
    ? t('news.collapse')
    : shownCount != null && totalCount != null
      ? `${t('news.show_more')} (${shownCount}/${totalCount})`
      : `${t('news.show_more')} (${moreCount ?? 0})`;

  const accessLabel = sectionName ? `${sectionName} ${label}` : label;

  return (
    <View style={{ alignItems: 'center', paddingVertical: 12 }}>
      <Pressable
        onPress={onPress}
        accessibilityLabel={accessLabel}
        accessibilityRole="button"
        accessibilityState={isExpanded != null ? { expanded: isExpanded } : undefined}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 20,
          paddingVertical: 10,
          minHeight: 44,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}
