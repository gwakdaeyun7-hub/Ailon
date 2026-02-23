/**
 * 저장한 항목 화면
 * - Firestore users/{uid}/bookmarks 서브컬렉션
 * - 타입별 통계 (뉴스 / 원리 / 아이디어)
 * - 뉴스 북마크: 원문 링크 바로 열기
 * - 삭제: 각 카드 우측 휴지통 버튼
 */

import React from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark, ExternalLink, Trash2, Newspaper, BookOpen, Lightbulb } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useLanguage } from '@/context/LanguageContext';
import type { Bookmark as BookmarkType } from '@/lib/types';

function useTypeConfig() {
  const { t } = useLanguage();
  return {
    news: { label: t('saved.type_news'), color: '#E53935', bgColor: '#FFEBEE', Icon: Newspaper },
    snap: { label: t('saved.type_principle'), color: '#3b82f6', bgColor: '#EFF6FF', Icon: BookOpen },
    principle: { label: t('saved.type_principle'), color: '#3b82f6', bgColor: '#EFF6FF', Icon: BookOpen },
    idea: { label: t('saved.type_idea'), color: '#FF7043', bgColor: '#FFF3E0', Icon: Lightbulb },
  } as const;
}

const cardShadow = {
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
};

function SavedItemCard({
  bookmark,
  onDelete,
  typeConfig,
}: { bookmark: BookmarkType; onDelete: () => void; typeConfig: ReturnType<typeof useTypeConfig> }) {
  const { t } = useLanguage();
  const config = typeConfig[bookmark.type] ?? typeConfig.news;
  const meta = bookmark.metadata;
  const Icon = config.Icon;

  return (
    <View
      className="bg-card rounded-2xl mx-4 mb-3 p-4"
      style={cardShadow}
    >
      {/* Type badge + 삭제 */}
      <View className="flex-row items-center justify-between mb-3">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ backgroundColor: config.bgColor, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon size={11} color={config.color} />
            <Text style={{ color: config.color, fontSize: 11, fontWeight: '700' }}>{config.label}</Text>
          </View>
          {meta?.category && (
            <Text className="text-text-dim text-xs">{meta.category}</Text>
          )}
        </View>
        <Pressable
          onPress={onDelete}
          className="active:opacity-70"
          style={{ padding: 6 }}
          accessibilityLabel={t('saved.delete')}
        >
          <Trash2 size={15} color="#BDBDBD" />
        </Pressable>
      </View>

      {/* 제목 */}
      <Text
        className="text-text font-bold text-base"
        style={{ lineHeight: 22, marginBottom: 4 }}
        numberOfLines={2}
      >
        {meta?.title ?? bookmark.itemId}
      </Text>

      {/* 부제목 */}
      {meta?.subtitle && (
        <Text className="text-text-muted text-xs" style={{ lineHeight: 16 }} numberOfLines={1}>
          {meta.subtitle}
        </Text>
      )}

      {/* Footer: 저장일 + 원문 링크 (뉴스만) */}
      <View className="flex-row items-center justify-between mt-3">
        <Text className="text-text-dim text-xs">
          {typeof bookmark.createdAt === 'string'
            ? new Date(bookmark.createdAt).toLocaleDateString('ko-KR')
            : ''}
        </Text>
        {bookmark.type === 'news' && meta?.link && (
          <Pressable
            onPress={() => Linking.openURL(meta.link!)}
            className="active:opacity-70"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Text style={{ color: '#E53935', fontSize: 12, fontWeight: '600' }}>{t('saved.view_original')}</Text>
            <ExternalLink size={12} color="#E53935" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function SavedScreen() {
  const { user } = useAuth();
  const { bookmarks, toggleBookmark } = useBookmarks(user?.uid ?? null);
  const { t } = useLanguage();
  const typeConfig = useTypeConfig();

  // 최신순 정렬
  const sorted = [...bookmarks].sort((a, b) => {
    const da = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
    const db = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });

  const newsCount = bookmarks.filter((b) => b.type === 'news').length;
  const snapCount = bookmarks.filter((b) => b.type === 'snap' || b.type === 'principle').length;
  const ideaCount = bookmarks.filter((b) => b.type === 'idea').length;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-5 pb-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-text text-2xl font-bold">{t('saved.title')}</Text>
            <Text className="text-text-muted text-sm mt-1">
              {sorted.length > 0 ? `${sorted.length}${t('saved.total')}` : t('saved.empty')}
            </Text>
          </View>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' }}>
            <Bookmark size={20} color="#E53935" />
          </View>
        </View>
        <View style={{ width: 40, height: 3, backgroundColor: '#E53935', borderRadius: 2, marginTop: 12 }} />
      </View>

      {/* 타입별 통계 카드 */}
      {sorted.length > 0 && (
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 8 }}>
          {newsCount > 0 && (
            <View style={{ flex: 1, backgroundColor: '#FFEBEE', borderRadius: 14, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: '#E53935', fontSize: 20, fontWeight: '800' }}>{newsCount}</Text>
              <Text style={{ color: '#E53935', fontSize: 11, fontWeight: '600' }}>{t('saved.type_news')}</Text>
            </View>
          )}
          {snapCount > 0 && (
            <View style={{ flex: 1, backgroundColor: '#EFF6FF', borderRadius: 14, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: '#3b82f6', fontSize: 20, fontWeight: '800' }}>{snapCount}</Text>
              <Text style={{ color: '#3b82f6', fontSize: 11, fontWeight: '600' }}>{t('saved.type_principle')}</Text>
            </View>
          )}
          {ideaCount > 0 && (
            <View style={{ flex: 1, backgroundColor: '#FFF3E0', borderRadius: 14, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: '#FF7043', fontSize: 20, fontWeight: '800' }}>{ideaCount}</Text>
              <Text style={{ color: '#FF7043', fontSize: 11, fontWeight: '600' }}>{t('saved.type_idea')}</Text>
            </View>
          )}
        </View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {!user ? (
          <View className="items-center justify-center py-20 px-8">
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Bookmark size={28} color="#E53935" />
            </View>
            <Text className="text-text font-semibold text-base mb-1">{t('auth.login_required')}</Text>
            <Text className="text-text-muted text-sm text-center" style={{ lineHeight: 20 }}>
              {t('saved.bookmark_login')}
            </Text>
          </View>
        ) : sorted.length === 0 ? (
          <View className="items-center justify-center py-20 px-8">
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Bookmark size={28} color="#E53935" />
            </View>
            <Text className="text-text font-semibold text-base mb-1">{t('saved.no_items_yet')}</Text>
            <Text className="text-text-muted text-sm text-center" style={{ lineHeight: 20 }}>
              {t('saved.bookmark_hint')}
            </Text>
          </View>
        ) : (
          sorted.map((bookmark, i) => (
            <SavedItemCard
              key={`${bookmark.type}_${bookmark.itemId}_${i}`}
              bookmark={bookmark}
              onDelete={() => toggleBookmark(bookmark.type, bookmark.itemId)}
              typeConfig={typeConfig}
            />
          ))
        )}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
