import React from 'react';
import { Pressable } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onToggle: () => void;
  size?: number;
}

export function BookmarkButton({ isBookmarked, onToggle, size = 18 }: BookmarkButtonProps) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => ({
        padding: 6,
        borderRadius: 9999,
        opacity: pressed ? 0.7 : 1,
      })}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel={isBookmarked ? t('bookmark.remove') : t('bookmark.add')}
    >
      <Bookmark
        size={size}
        color={isBookmarked ? colors.primary : colors.textLight}
        fill={isBookmarked ? colors.primary : 'none'}
        strokeWidth={2}
      />
    </Pressable>
  );
}
