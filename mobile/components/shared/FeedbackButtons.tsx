import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLanguage } from '@/context/LanguageContext';

const FEEDBACK_COLORS = {
  positive: '#43A047',
  negative: '#E53935',
  neutral: '#888888',
} as const;

interface FeedbackButtonsProps {
  userId: string | null;
  itemType: 'news' | 'snap' | 'idea';
  itemId: string;
  initialReaction?: 'like' | 'dislike' | null;
}

export function FeedbackButtons({ userId, itemType, itemId, initialReaction = null }: FeedbackButtonsProps) {
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(initialReaction);
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();

  const handleFeedback = async (type: 'like' | 'dislike') => {
    if (!userId || saving) return;

    const prevReaction = reaction;
    const newReaction = reaction === type ? null : type;
    setReaction(newReaction);

    try {
      setSaving(true);
      const feedbackRef = doc(db, 'users', userId, 'feedback', `${itemType}_${itemId}`);
      if (newReaction) {
        await setDoc(feedbackRef, {
          userId,
          itemType,
          itemId,
          reaction: newReaction,
          createdAt: serverTimestamp(),
        });
      } else {
        await setDoc(feedbackRef, { reaction: null }, { merge: true });
      }
    } catch (err) {
      console.error('Feedback error:', err);
      setReaction(prevReaction);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-row gap-2">
      <Pressable
        onPress={() => handleFeedback('like')}
        className={`flex-row items-center gap-1 px-3 py-2.5 rounded-full ${
          reaction === 'like' ? 'bg-green-500/20' : 'bg-surface'
        }`}
        style={{ minHeight: 44 }}
        accessibilityLabel={t('feedback.like')}
      >
        <ThumbsUp
          size={14}
          color={reaction === 'like' ? FEEDBACK_COLORS.positive : FEEDBACK_COLORS.neutral}
          strokeWidth={2}
        />
        <Text className={`text-xs ${reaction === 'like' ? 'text-green-400' : 'text-text-muted'}`}>
          {t('feedback.like')}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => handleFeedback('dislike')}
        className={`flex-row items-center gap-1 px-3 py-2.5 rounded-full ${
          reaction === 'dislike' ? 'bg-red-500/20' : 'bg-surface'
        }`}
        style={{ minHeight: 44 }}
        accessibilityLabel={t('feedback.dislike')}
      >
        <ThumbsDown
          size={14}
          color={reaction === 'dislike' ? FEEDBACK_COLORS.negative : FEEDBACK_COLORS.neutral}
          strokeWidth={2}
        />
        <Text className={`text-xs ${reaction === 'dislike' ? 'text-red-400' : 'text-text-muted'}`}>
          {t('feedback.dislike')}
        </Text>
      </Pressable>
    </View>
  );
}
