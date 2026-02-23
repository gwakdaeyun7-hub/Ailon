import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Bookmark, User as UserIcon, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useRouter } from 'expo-router';

const cardShadow = {
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { bookmarks } = useBookmarks(user?.uid ?? null);
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? 'AI';

  const handleSignOut = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
          } catch {
            Alert.alert('오류', '로그아웃 중 문제가 발생했어요.');
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <UserIcon size={32} color="#E53935" />
          </View>
          <Text style={{ color: '#212121', fontSize: 20, fontWeight: '800', marginBottom: 8 }}>로그인이 필요해요</Text>
          <Text style={{ color: '#BDBDBD', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>
            로그인하면 북마크 저장, 좋아요, 댓글 등 더 많은 기능을 이용할 수 있어요
          </Text>
          <Pressable
            onPress={() => router.push('/auth')}
            style={{ backgroundColor: '#E53935', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 16 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Google로 로그인</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <Text style={{ color: '#212121', fontSize: 24, fontWeight: '800' }}>프로필</Text>
        <View style={{ width: 40, height: 3, backgroundColor: '#E53935', borderRadius: 2, marginTop: 12 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + Info */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, alignItems: 'center', ...cardShadow }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#E53935', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800' }}>{initials}</Text>
          </View>
          <Text style={{ color: '#212121', fontSize: 20, fontWeight: '800', marginBottom: 4 }}>
            {user.displayName ?? '사용자'}
          </Text>
          <Text style={{ color: '#BDBDBD', fontSize: 14 }}>{user.email}</Text>
        </View>

        {/* Stats */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, ...cardShadow }}>
          <Text style={{ color: '#757575', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>활동 현황</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' }}>
              <Bookmark size={18} color="#E53935" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#212121', fontSize: 16, fontWeight: '700' }}>{bookmarks.length}개</Text>
              <Text style={{ color: '#BDBDBD', fontSize: 13 }}>저장된 북마크</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/saved')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ color: '#E53935', fontSize: 13, fontWeight: '600' }}>보기</Text>
              <ChevronRight size={14} color="#E53935" />
            </Pressable>
          </View>
        </View>

        {/* Sign Out */}
        <View style={{ marginHorizontal: 16, marginBottom: 32 }}>
          <Pressable
            onPress={handleSignOut}
            disabled={signingOut}
            style={{ backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12, ...cardShadow, borderWidth: 1, borderColor: '#FFCDD2' }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={16} color="#E53935" />
            </View>
            <Text style={{ color: '#E53935', fontSize: 15, fontWeight: '700', flex: 1 }}>
              {signingOut ? '로그아웃 중...' : '로그아웃'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
