import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Send, MessageCircle, CornerDownRight } from 'lucide-react-native';
import { useComments, type Comment } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { Colors } from '@/lib/colors';
import type { ItemType } from '@/hooks/useReactions';

interface ReplyTo {
  id: string;
  authorName: string;
}

function CommentItem({
  comment,
  isReply,
  onReply,
}: {
  comment: Comment;
  isReply?: boolean;
  onReply?: (target: ReplyTo) => void;
}) {
  const { lang, t } = useLanguage();
  const initials = comment.authorName.slice(0, 2).toUpperCase();
  const date = new Date(comment.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, paddingLeft: isReply ? 44 : 0, borderBottomWidth: 1, borderBottomColor: Colors.surface }}>
      {isReply && (
        <CornerDownRight size={14} color={Colors.placeholder} style={{ marginTop: 4 }} />
      )}
      <View style={{ width: isReply ? 28 : 34, height: isReply ? 28 : 34, borderRadius: isReply ? 14 : 17, backgroundColor: isReply ? Colors.warningLight : Colors.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Text style={{ color: isReply ? Colors.warning : Colors.primary, fontSize: isReply ? 10 : 12, fontWeight: '700' }}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <Text style={{ color: Colors.textPrimary, fontSize: isReply ? 12 : 13, fontWeight: '700' }}>{comment.authorName}</Text>
          <Text style={{ color: Colors.placeholder, fontSize: 11 }}>{date}</Text>
        </View>
        <Text style={{ color: Colors.textDark, fontSize: isReply ? 13 : 14, lineHeight: 20 }}>{comment.text}</Text>
        {!isReply && onReply && (
          <Pressable
            onPress={() => onReply({ id: comment.id, authorName: comment.authorName })}
            accessibilityRole="button"
            style={{ marginTop: 6, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, minHeight: 44 }}
          >
            <Text style={{ color: Colors.textLight, fontSize: 12, fontWeight: '600' }}>{t('comment.reply')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface CommentThread {
  parent: Comment;
  replies: Comment[];
}

interface CommentSheetProps {
  visible: boolean;
  onClose: () => void;
  itemType: ItemType;
  itemId: string;
}

export function CommentSheet({ visible, onClose, itemType, itemId }: CommentSheetProps) {
  const { comments, loading, addComment } = useComments(itemType, itemId);
  const { user } = useAuth();
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const inputRef = useRef<TextInput>(null);

  const threads = useMemo<CommentThread[]>(() => {
    const topLevel = comments.filter(c => !c.parentId);
    const replyMap = new Map<string, Comment[]>();
    for (const c of comments) {
      if (c.parentId) {
        const arr = replyMap.get(c.parentId) || [];
        arr.push(c);
        replyMap.set(c.parentId, arr);
      }
    }
    return topLevel.map(parent => ({
      parent,
      replies: replyMap.get(parent.id) || [],
    }));
  }, [comments]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addComment(text, replyTo?.id);
      setText('');
      setReplyTo(null);
    } catch (e) {
      console.error('Comment error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (target: ReplyTo) => {
    setReplyTo(target);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.card }} accessibilityViewIsModal={true}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={18} color={Colors.primary} />
            <Text style={{ color: Colors.textPrimary, fontSize: 17, fontWeight: '700' }}>{t('comment.title')}</Text>
            {comments.length > 0 && (
              <View style={{ backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '700' }}>{comments.length}</Text>
              </View>
            )}
          </View>
          <Pressable onPress={onClose} accessibilityLabel={t('comment.close')} accessibilityRole="button" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* Comments List */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : comments.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <MessageCircle size={24} color={Colors.primary} />
              </View>
              <Text style={{ color: Colors.textDark, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>{t('comment.first')}</Text>
              <Text style={{ color: Colors.placeholder, fontSize: 13 }}>{t('comment.curious')}</Text>
            </View>
          ) : (
            <FlatList
              data={threads}
              keyExtractor={(thread) => thread.parent.id}
              renderItem={({ item: thread }) => (
                <View>
                  <CommentItem comment={thread.parent} onReply={handleReply} />
                  {thread.replies.map(reply => (
                    <CommentItem key={reply.id} comment={reply} isReply />
                  ))}
                </View>
              )}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Reply indicator */}
          {replyTo && (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.warningLight, borderTopWidth: 1, borderTopColor: Colors.warningBorder }}>
              <CornerDownRight size={14} color={Colors.warning} />
              <Text style={{ flex: 1, fontSize: 13, color: Colors.warning, fontWeight: '600', marginLeft: 8 }}>
                @{replyTo.authorName} {t('comment.reply_to')}
              </Text>
              <Pressable onPress={cancelReply} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 10 }}>
                <X size={14} color={Colors.warning} />
              </Pressable>
            </View>
          )}

          {/* Input */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', alignItems: 'flex-end', gap: 10, backgroundColor: Colors.card }}>
            {user ? (
              <>
                <TextInput
                  ref={inputRef}
                  value={text}
                  onChangeText={setText}
                  placeholder={replyTo ? `@${replyTo.authorName} ${t('comment.reply_placeholder')}` : t('comment.placeholder')}
                  placeholderTextColor={Colors.placeholder}
                  multiline
                  maxLength={300}
                  accessibilityLabel={replyTo ? t('comment.reply_placeholder') : t('comment.placeholder')}
                  style={{ flex: 1, fontSize: 14, color: Colors.textPrimary, backgroundColor: Colors.bg, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: replyTo ? Colors.warningBorder : Colors.border, maxHeight: 100 }}
                />
                <Pressable
                  onPress={handleSubmit}
                  disabled={!text.trim() || submitting}
                  accessibilityLabel={t('comment.send')}
                  accessibilityRole="button"
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: text.trim() ? Colors.primary : Colors.border, alignItems: 'center', justifyContent: 'center' }}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={Colors.card} />
                  ) : (
                    <Send size={16} color={text.trim() ? Colors.card : Colors.placeholder} />
                  )}
                </Pressable>
              </>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8, gap: 8 }}>
                <Text style={{ color: Colors.textLight, fontSize: 13 }}>{t('comment.login_required')}</Text>
                <Pressable
                  onPress={() => { onClose(); router.push('/auth'); }}
                  style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.primaryLight, borderRadius: 8 }}
                >
                  <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '700' }}>{t('comment.login')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
