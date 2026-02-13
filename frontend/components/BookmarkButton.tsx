/**
 * Bookmark Button - save news, snaps, ideas
 */

'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils/cn';

interface BookmarkButtonProps {
  itemType: 'news' | 'snap' | 'idea';
  itemId: string;
  initialBookmarked?: boolean;
  size?: 'sm' | 'default';
}

export function BookmarkButton({
  itemType,
  itemId,
  initialBookmarked = false,
  size = 'sm',
}: BookmarkButtonProps) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    if (!user || saving) return;

    setSaving(true);
    try {
      const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', `${itemType}_${itemId}`);

      if (bookmarked) {
        await deleteDoc(bookmarkRef);
        setBookmarked(false);
      } else {
        await setDoc(bookmarkRef, {
          type: itemType,
          itemId,
          createdAt: serverTimestamp(),
        });
        setBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleToggle();
      }}
      disabled={saving}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        bookmarked
          ? 'bg-foreground/10 text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
      aria-label={bookmarked ? '북마크 해제' : '북마크'}
    >
      <Bookmark className={cn(iconSize, bookmarked && 'fill-current')} />
    </button>
  );
}
