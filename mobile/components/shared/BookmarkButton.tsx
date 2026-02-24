import React from 'react';
import { Pressable } from 'react-native';
import { Bookmark, BookmarkCheck } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onToggle: () => void;
  size?: number;
}

export function BookmarkButton({ isBookmarked, onToggle, size = 18 }: BookmarkButtonProps) {
  const { t } = useLanguage();
  return (
    <Pressable
      onPress={onToggle}
      className="p-1.5 rounded-full active:opacity-70"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel={isBookmarked ? t('bookmark.remove') : t('bookmark.add')}
    >
      {isBookmarked ? (
        <BookmarkCheck size={size} color="#e53935" strokeWidth={2} />
      ) : (
        <Bookmark size={size} color="#999999" strokeWidth={2} />
      )}
    </Pressable>
  );
}
