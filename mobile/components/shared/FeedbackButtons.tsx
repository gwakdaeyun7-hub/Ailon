import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLanguage } from '@/context/LanguageContext';

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
      setReaction(reaction); // 롤백
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-row gap-2">
      <Pressable
        onPress={() => handleFeedback('like')}
        className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${
          reaction === 'like' ? 'bg-green-500/20' : 'bg-surface'
        }`}
        accessibilityLabel={t('feedback.like')}
      >
        <ThumbsUp
          size={14}
          color={reaction === 'like' ? '#22c55e' : '#888888'}
          strokeWidth={2}
        />
        <Text className={`text-xs ${reaction === 'like' ? 'text-green-400' : 'text-text-muted'}`}>
          {t('feedback.like')}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => handleFeedback('dislike')}
        className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${
          reaction === 'dislike' ? 'bg-red-500/20' : 'bg-surface'
        }`}
        accessibilityLabel={t('feedback.dislike')}
      >
        <ThumbsDown
          size={14}
          color={reaction === 'dislike' ? '#ef4444' : '#888888'}
          strokeWidth={2}
        />
        <Text className={`text-xs ${reaction === 'dislike' ? 'text-red-400' : 'text-text-muted'}`}>
          {t('feedback.dislike')}
        </Text>
      </Pressable>
    </View>
  );
}
