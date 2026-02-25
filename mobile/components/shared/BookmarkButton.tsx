import React, { useRef, useCallback, useEffect } from 'react';
import { Pressable, Animated } from 'react-native';
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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);

  // Scale bounce on toggle (skip initial render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isBookmarked, scaleAnim]);

  const handlePress = useCallback(() => {
    onToggle();
  }, [onToggle]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={isBookmarked ? t('bookmark.remove') : t('bookmark.add')}
      accessibilityRole="button"
      style={({ pressed }) => ({
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        minHeight: 44,
        minWidth: 44,
        backgroundColor: isBookmarked ? colors.bookmarkActiveBg : colors.border,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: isBookmarked ? 1 : 0,
        borderColor: isBookmarked ? colors.bookmarkActiveBorder : 'transparent',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Bookmark
          size={size}
          color={isBookmarked ? colors.bookmarkActiveColor : colors.textSecondary}
          fill={isBookmarked ? colors.bookmarkActiveColor : 'none'}
          strokeWidth={2}
        />
      </Animated.View>
    </Pressable>
  );
}
