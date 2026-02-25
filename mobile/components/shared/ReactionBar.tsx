import React, { useState } from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { useReactions, type ItemType } from '@/hooks/useReactions';
import { useLanguage } from '@/context/LanguageContext';
import { CommentSheet } from '@/components/shared/CommentSheet';
import { Colors } from '@/lib/colors';

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
          borderTopColor: Colors.border,
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
            borderRadius: 20,
            backgroundColor: liked ? Colors.primaryLight : Colors.bg,
            borderWidth: 1,
            borderColor: liked ? '#FFCDD2' : Colors.border,
          }}
        >
          <Heart
            size={15}
            color={liked ? Colors.primary : Colors.textDim}
            fill={liked ? Colors.primary : 'none'}
          />
          {likes > 0 && (
            <Text
              style={{
                color: liked ? Colors.primary : Colors.textDim,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {likes}
            </Text>
          )}
        </Pressable>

        {/* Comment */}
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
            borderRadius: 20,
            backgroundColor: Colors.bg,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <MessageCircle size={15} color={Colors.textDim} />
          <Text style={{ color: Colors.textDim, fontSize: 12, fontWeight: '600' }}>{t('reaction.comment')}</Text>
        </Pressable>

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
            borderRadius: 20,
            backgroundColor: Colors.bg,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Share2 size={15} color={Colors.textDim} />
          <Text style={{ color: Colors.textDim, fontSize: 12, fontWeight: '600' }}>{t('reaction.share')}</Text>
        </Pressable>
      </View>

      <CommentSheet
        visible={commentOpen}
        onClose={() => setCommentOpen(false)}
        itemType={itemType}
        itemId={itemId}
      />
    </>
  );
}
