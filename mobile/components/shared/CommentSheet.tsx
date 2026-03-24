import React, { useState, useRef, useMemo, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Send, MessageCircle, CornerDownRight, Flag, Trash2, AlertTriangle } from 'lucide-react-native';
import { useComments, type Comment } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { useReportComment, type ReportReason } from '@/hooks/useReportComment';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import type { ItemType } from '@/hooks/useReactions';

const REPORT_HIDE_THRESHOLD = 3;

interface ReplyTo {
  id: string;
  authorName: string;
}

/** Reason selection modal for reporting */
function ReportReasonModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (reason: ReportReason) => void;
}) {
  const { t } = useLanguage();
  const { colors } = useTheme();

  const reasons: { key: ReportReason; label: string }[] = [
    { key: 'abuse', label: t('comment.report_abuse') },
    { key: 'spam', label: t('comment.report_spam') },
    { key: 'misinformation', label: t('comment.report_misinfo') },
    { key: 'other', label: t('comment.report_other') },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 }}
        onPress={onClose}
      >
        <Pressable
          style={{ width: '100%', maxWidth: 320, backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' }}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
            <Flag size={16} color={colors.errorColor} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>{t('comment.report_title')}</Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 13, paddingHorizontal: 20, paddingBottom: 16 }}>
            {t('comment.report_reason')}
          </Text>

          {/* Reason buttons */}
          {reasons.map((r) => (
            <Pressable
              key={r.key}
              onPress={() => onSelect(r.key)}
              accessibilityRole="button"
              accessibilityLabel={r.label}
              style={{ paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 15 }}>{r.label}</Text>
            </Pressable>
          ))}

          {/* Cancel */}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('comment.report_cancel')}
            style={{ paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 15, fontWeight: '600' }}>{t('comment.report_cancel')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CommentItem({
  comment,
  isReply,
  isOwnComment,
  onReply,
  onDelete,
  onReport,
}: {
  comment: Comment;
  isReply?: boolean;
  isOwnComment: boolean;
  onReply?: (target: ReplyTo) => void;
  onDelete?: (commentId: string) => void;
  onReport?: (comment: Comment) => void;
}) {
  const { lang, t } = useLanguage();
  const { colors } = useTheme();

  const isHidden = comment.reportCount >= REPORT_HIDE_THRESHOLD;

  const initials = comment.authorName.slice(0, 2).toUpperCase();
  const date = new Date(comment.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isHidden) {
    return (
      <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, paddingLeft: isReply ? 44 : 0, borderBottomWidth: 1, borderBottomColor: colors.surface }}>
        {isReply && (
          <CornerDownRight size={14} color={colors.placeholder} style={{ marginTop: 4 }} />
        )}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.surface, borderRadius: 8 }}>
          <AlertTriangle size={14} color={colors.textDim} />
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontStyle: 'italic' }}>{t('comment.hidden')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, paddingLeft: isReply ? 44 : 0, borderBottomWidth: 1, borderBottomColor: colors.surface }}>
      {isReply && (
        <CornerDownRight size={14} color={colors.placeholder} style={{ marginTop: 4 }} />
      )}
      <View style={{ width: isReply ? 28 : 34, height: isReply ? 28 : 34, borderRadius: isReply ? 14 : 17, backgroundColor: isReply ? colors.warningLight : colors.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Text style={{ color: colors.textPrimary, fontSize: isReply ? 10 : 12, fontWeight: '700' }}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <Text style={{ color: colors.textPrimary, fontSize: isReply ? 12 : 13, fontWeight: '700' }}>{comment.authorName}</Text>
          <Text style={{ color: colors.textDim, fontSize: 11 }}>{date}</Text>
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: isReply ? 13 : 14, lineHeight: 20 }}>{comment.text}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          {!isReply && onReply && (
            <Pressable
              onPress={() => onReply({ id: comment.id, authorName: comment.authorName })}
              accessibilityRole="button"
              style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, minHeight: 44 }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>{t('comment.reply')}</Text>
            </Pressable>
          )}
          {isOwnComment && onDelete ? (
            <Pressable
              onPress={() => onDelete(comment.id)}
              accessibilityRole="button"
              accessibilityLabel={t('comment.delete')}
              style={{ paddingVertical: 8, paddingHorizontal: 10, minHeight: 44, justifyContent: 'center' }}
            >
              <Trash2 size={14} color={colors.textDim} />
            </Pressable>
          ) : (
            !isOwnComment && onReport && (
              <Pressable
                onPress={() => onReport(comment)}
                accessibilityRole="button"
                accessibilityLabel={t('comment.report')}
                style={{ paddingVertical: 8, paddingHorizontal: 10, minHeight: 44, justifyContent: 'center' }}
              >
                <Flag size={14} color={colors.textDim} />
              </Pressable>
            )
          )}
        </View>
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
  const { comments, loading, addComment, deleteComment, docId } = useComments(itemType, itemId);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { reportComment, reportedIds } = useReportComment();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const [reportTarget, setReportTarget] = useState<Comment | null>(null);
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

  const handleReply = useCallback((target: ReplyTo) => {
    setReplyTo(target);
    inputRef.current?.focus();
  }, []);

  const cancelReply = () => {
    setReplyTo(null);
  };

  const handleDelete = useCallback((commentId: string) => {
    Alert.alert(
      t('comment.delete'),
      t('comment.delete_confirm'),
      [
        { text: t('comment.delete_cancel'), style: 'cancel' },
        {
          text: t('comment.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(commentId);
            } catch (e) {
              console.error('Delete comment error:', e);
            }
          },
        },
      ],
    );
  }, [deleteComment, t]);

  const handleReportPress = useCallback((comment: Comment) => {
    if (!user) {
      Alert.alert('', t('comment.report_login'));
      return;
    }
    // 이미 신고한 댓글 체크 (로컬 캐시 우선)
    if (reportedIds.has(comment.id)) {
      Alert.alert('', t('comment.report_already'));
      return;
    }
    setReportTarget(comment);
  }, [user, reportedIds, t]);

  const handleReportSubmit = useCallback(async (reason: ReportReason) => {
    if (!reportTarget) return;
    setReportTarget(null);

    const result = await reportComment({
      commentId: reportTarget.id,
      docId,
      authorUid: reportTarget.authorUid,
      commentText: reportTarget.text,
      reason,
    });

    if (result === 'already_reported') {
      Alert.alert('', t('comment.report_already'));
    } else if (result === 'no_user') {
      Alert.alert('', t('comment.report_login'));
    } else {
      Alert.alert('', t('comment.report_success'));
    }
  }, [reportTarget, reportComment, docId, t]);

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }} accessibilityViewIsModal={true}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={18} color={colors.primary} />
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700' }}>{t('comment.title')}</Text>
            {comments.length > 0 && (
              <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>{comments.length}</Text>
              </View>
            )}
          </View>
          <Pressable onPress={onClose} accessibilityLabel={t('comment.close')} accessibilityRole="button" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color={colors.textSecondary} />
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
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : comments.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
              <MessageCircle size={32} color={colors.textDim} style={{ marginBottom: 12 }} />
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>{t('comment.first')}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{t('comment.curious')}</Text>
            </View>
          ) : (
            <FlatList
              data={threads}
              keyExtractor={(thread) => thread.parent.id}
              renderItem={({ item: thread }) => (
                <View>
                  <CommentItem
                    comment={thread.parent}
                    isOwnComment={user?.uid === thread.parent.authorUid}
                    onReply={handleReply}
                    onDelete={handleDelete}
                    onReport={handleReportPress}
                  />
                  {thread.replies.map(reply => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      isReply
                      isOwnComment={user?.uid === reply.authorUid}
                      onDelete={handleDelete}
                      onReport={handleReportPress}
                    />
                  ))}
                </View>
              )}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Reply indicator */}
          {replyTo && (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.warningLight, borderTopWidth: 1, borderTopColor: colors.warningBorder }}>
              <CornerDownRight size={14} color={colors.warning} />
              <Text style={{ flex: 1, fontSize: 13, color: colors.textPrimary, fontWeight: '600', marginLeft: 8 }}>
                @{replyTo.authorName} {t('comment.reply_to')}
              </Text>
              <Pressable onPress={cancelReply} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 10 }}>
                <X size={14} color={colors.warning} />
              </Pressable>
            </View>
          )}

          {/* Input */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'flex-end', gap: 10, backgroundColor: colors.card }}>
            {user ? (
              <>
                <TextInput
                  ref={inputRef}
                  value={text}
                  onChangeText={setText}
                  placeholder={replyTo ? `@${replyTo.authorName} ${t('comment.reply_placeholder')}` : t('comment.placeholder')}
                  placeholderTextColor={colors.placeholder}
                  multiline
                  maxLength={300}
                  accessibilityLabel={replyTo ? t('comment.reply_placeholder') : t('comment.placeholder')}
                  style={{ flex: 1, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.bg, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: replyTo ? colors.warningBorder : colors.border, maxHeight: 100 }}
                />
                <Pressable
                  onPress={handleSubmit}
                  disabled={!text.trim() || submitting}
                  accessibilityLabel={t('comment.send')}
                  accessibilityRole="button"
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: text.trim() ? colors.primary : colors.border, alignItems: 'center', justifyContent: 'center' }}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.card} />
                  ) : (
                    <Send size={16} color={text.trim() ? colors.card : colors.placeholder} />
                  )}
                </Pressable>
              </>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8, gap: 8 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t('comment.login_required')}</Text>
                <Pressable
                  onPress={() => { onClose(); router.push('/auth'); }}
                  style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.primaryLight, borderRadius: 8 }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>{t('comment.login')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Report reason picker */}
      <ReportReasonModal
        visible={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        onSelect={handleReportSubmit}
      />
    </Modal>
  );
}
