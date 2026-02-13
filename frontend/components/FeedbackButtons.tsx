/**
 * Feedback Buttons - like/dislike for news, snaps, ideas
 */

'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils/cn';

interface FeedbackButtonsProps {
  itemType: 'news' | 'snap' | 'idea';
  itemId: string;
  initialReaction?: 'like' | 'dislike' | null;
  size?: 'sm' | 'default';
}

export function FeedbackButtons({
  itemType,
  itemId,
  initialReaction = null,
  size = 'sm',
}: FeedbackButtonsProps) {
  const { user } = useAuth();
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(initialReaction);
  const [saving, setSaving] = useState(false);

  const handleReaction = async (newReaction: 'like' | 'dislike') => {
    if (!user || saving) return;

    setSaving(true);
    try {
      const feedbackId = `${user.uid}_${itemType}_${itemId}`;
      const feedbackRef = doc(db, 'user_feedback', feedbackId);

      if (reaction === newReaction) {
        await deleteDoc(feedbackRef);
        setReaction(null);
      } else {
        await setDoc(feedbackRef, {
          userId: user.uid,
          itemType,
          itemId,
          reaction: newReaction,
          createdAt: serverTimestamp(),
        });
        setReaction(newReaction);
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleReaction('like');
        }}
        disabled={saving}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          reaction === 'like'
            ? 'bg-foreground/10 text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        aria-label="좋아요"
      >
        <ThumbsUp className={iconSize} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleReaction('dislike');
        }}
        disabled={saving}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          reaction === 'dislike'
            ? 'bg-foreground/10 text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        aria-label="싫어요"
      >
        <ThumbsDown className={iconSize} />
      </button>
    </div>
  );
}
