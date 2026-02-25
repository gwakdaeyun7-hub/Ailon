import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

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
  const { colors } = useTheme();

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
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Pressable
        onPress={() => handleFeedback('like')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 9999,
          minHeight: 44,
          backgroundColor: reaction === 'like' ? colors.success + '33' : colors.surface,
        }}
        accessibilityLabel={t('feedback.like')}
      >
        <ThumbsUp
          size={14}
          color={reaction === 'like' ? colors.success : colors.textLight}
          strokeWidth={2}
        />
        <Text
          style={{
            fontSize: 12,
            color: reaction === 'like' ? colors.success : colors.textLight,
          }}
        >
          {t('feedback.like')}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => handleFeedback('dislike')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 9999,
          minHeight: 44,
          backgroundColor: reaction === 'dislike' ? colors.primary + '33' : colors.surface,
        }}
        accessibilityLabel={t('feedback.dislike')}
      >
        <ThumbsDown
          size={14}
          color={reaction === 'dislike' ? colors.primary : colors.textLight}
          strokeWidth={2}
        />
        <Text
          style={{
            fontSize: 12,
            color: reaction === 'dislike' ? colors.primary : colors.textLight,
          }}
        >
          {t('feedback.dislike')}
        </Text>
      </Pressable>
    </View>
  );
}
