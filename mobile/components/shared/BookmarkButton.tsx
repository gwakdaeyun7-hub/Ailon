import React from 'react';
import { Pressable } from 'react-native';
import { Bookmark, BookmarkCheck } from 'lucide-react-native';

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onToggle: () => void;
  size?: number;
}

export function BookmarkButton({ isBookmarked, onToggle, size = 18 }: BookmarkButtonProps) {
  return (
    <Pressable
      onPress={onToggle}
      className="p-1.5 rounded-full active:opacity-70"
      accessibilityLabel={isBookmarked ? '북마크 제거' : '북마크 추가'}
    >
      {isBookmarked ? (
        <BookmarkCheck size={size} color="#e53935" strokeWidth={2} />
      ) : (
        <Bookmark size={size} color="#999999" strokeWidth={2} />
      )}
    </Pressable>
  );
}
