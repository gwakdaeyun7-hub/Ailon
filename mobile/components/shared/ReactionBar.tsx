import React, { useState } from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { useReactions, type ItemType } from '@/hooks/useReactions';
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
          borderTopColor: '#F5F5F5',
          gap: 4,
        }}
      >
        {/* Like */}
        <Pressable
          onPress={toggleLike}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 20,
            backgroundColor: liked ? '#FFEBEE' : '#FAFAFA',
            borderWidth: 1,
            borderColor: liked ? '#FFCDD2' : '#F0F0F0',
          }}
        >
          <Heart
            size={15}
            color={liked ? '#E53935' : '#BDBDBD'}
            fill={liked ? '#E53935' : 'none'}
          />
          {likes > 0 && (
            <Text
              style={{
                color: liked ? '#E53935' : '#BDBDBD',
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
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 20,
            backgroundColor: '#FAFAFA',
            borderWidth: 1,
            borderColor: '#F0F0F0',
          }}
        >
          <MessageCircle size={15} color="#BDBDBD" />
          <Text style={{ color: '#BDBDBD', fontSize: 12, fontWeight: '600' }}>댓글</Text>
        </Pressable>

        {/* Share */}
        <Pressable
          onPress={handleShare}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 20,
            backgroundColor: '#FAFAFA',
            borderWidth: 1,
            borderColor: '#F0F0F0',
          }}
        >
          <Share2 size={15} color="#BDBDBD" />
          <Text style={{ color: '#BDBDBD', fontSize: 12, fontWeight: '600' }}>공유</Text>
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
