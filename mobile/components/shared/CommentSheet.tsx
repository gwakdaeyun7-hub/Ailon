import React, { useState, useRef } from 'react';
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
import { X, Send, MessageCircle } from 'lucide-react-native';
import { useComments, type Comment } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import type { ItemType } from '@/hooks/useReactions';

function CommentItem({ comment }: { comment: Comment }) {
  const initials = comment.authorName.slice(0, 2).toUpperCase();
  const date = new Date(comment.createdAt).toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Text style={{ color: '#E53935', fontSize: 12, fontWeight: '700' }}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <Text style={{ color: '#212121', fontSize: 13, fontWeight: '700' }}>{comment.authorName}</Text>
          <Text style={{ color: '#BDBDBD', fontSize: 11 }}>{date}</Text>
        </View>
        <Text style={{ color: '#424242', fontSize: 14, lineHeight: 20 }}>{comment.text}</Text>
      </View>
    </View>
  );
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
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addComment(text);
      setText('');
    } catch (e) {
      console.error('Comment error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={18} color="#E53935" />
            <Text style={{ color: '#212121', fontSize: 17, fontWeight: '700' }}>댓글</Text>
            {comments.length > 0 && (
              <View style={{ backgroundColor: '#FFEBEE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                <Text style={{ color: '#E53935', fontSize: 12, fontWeight: '700' }}>{comments.length}</Text>
              </View>
            )}
          </View>
          <Pressable onPress={onClose} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#757575" />
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
              <ActivityIndicator color="#E53935" />
            </View>
          ) : comments.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <MessageCircle size={24} color="#E53935" />
              </View>
              <Text style={{ color: '#424242', fontSize: 15, fontWeight: '600', marginBottom: 4 }}>첫 댓글을 남겨보세요</Text>
              <Text style={{ color: '#BDBDBD', fontSize: 13 }}>여러분의 생각이 궁금해요</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => <CommentItem comment={item} />}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Input */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', flexDirection: 'row', alignItems: 'flex-end', gap: 10, backgroundColor: '#FFFFFF' }}>
            {user ? (
              <>
                <TextInput
                  ref={inputRef}
                  value={text}
                  onChangeText={setText}
                  placeholder="댓글을 입력하세요..."
                  placeholderTextColor="#BDBDBD"
                  multiline
                  maxLength={300}
                  style={{ flex: 1, fontSize: 14, color: '#212121', backgroundColor: '#FAFAFA', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#F0F0F0', maxHeight: 100 }}
                />
                <Pressable
                  onPress={handleSubmit}
                  disabled={!text.trim() || submitting}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: text.trim() ? '#E53935' : '#F0F0F0', alignItems: 'center', justifyContent: 'center' }}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Send size={16} color={text.trim() ? '#FFFFFF' : '#BDBDBD'} />
                  )}
                </Pressable>
              </>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8, gap: 8 }}>
                <Text style={{ color: '#9E9E9E', fontSize: 13 }}>댓글을 작성하려면 로그인이 필요해요</Text>
                <Pressable
                  onPress={() => { onClose(); router.push('/auth'); }}
                  style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFEBEE', borderRadius: 8 }}
                >
                  <Text style={{ color: '#E53935', fontSize: 13, fontWeight: '700' }}>로그인하기</Text>
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
