import React, { useState } from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { useReactions, type ItemType } from '@/hooks/useReactions';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { CommentSheet } from '@/components/shared/CommentSheet';

interface ReactionBarProps {
  itemType: ItemType;
  itemId: string;
  shareText?: string;
  shareTitle?: string;
}

export function ReactionBar({ itemType, itemId, shareText, shareTitle }: ReactionBarProps) {
  const { likes, liked, toggleLike } = useReactions(itemType, itemId);
  const [commentOpen, setCommentOpen] = useState(false);
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { showLikeCounts, showComments } = useFeatureFlags();

  const handleShare = () => {
    Share.share({
      message: shareText ?? shareTitle ?? '',
      title: shareTitle,
    });
  };

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          gap: 4,
        }}
      >
        {/* Like */}
        <Pressable
          onPress={toggleLike}
          accessibilityLabel={t('feedback.like')}
          accessibilityRole="button"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
        >
          <Heart
            size={15}
            color={liked ? colors.primary : colors.textDim}
            fill={liked ? colors.primary : 'none'}
          />
          {showLikeCounts && likes > 0 && (
            <Text
              style={{
                color: liked ? colors.primary : colors.textDim,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {likes}
            </Text>
          )}
        </Pressable>

        {/* Comment */}
        {showComments && (
          <Pressable
            onPress={() => setCommentOpen(true)}
            accessibilityLabel={t('reaction.comment')}
            accessibilityRole="button"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
          >
            <MessageCircle size={15} color={colors.textDim} />
            <Text style={{ color: colors.textDim, fontSize: 12, fontWeight: '600' }}>{t('reaction.comment')}</Text>
          </Pressable>
        )}

        {/* Share */}
        <Pressable
          onPress={handleShare}
          accessibilityLabel={t('reaction.share')}
          accessibilityRole="button"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
        >
          <Share2 size={15} color={colors.textDim} />
          <Text style={{ color: colors.textDim, fontSize: 12, fontWeight: '600' }}>{t('reaction.share')}</Text>
        </Pressable>
      </View>

      {showComments && (
        <CommentSheet
          visible={commentOpen}
          onClose={() => setCommentOpen(false)}
          itemType={itemType}
          itemId={itemId}
        />
      )}
    </>
  );
}
