/**
 * 저장한 항목 화면
 * - Firestore users/{uid}/bookmarks 서브컬렉션
 * - 타입별 통계 (뉴스 / 원리 / 아이디어)
 * - 뉴스 북마크: 원문 링크 바로 열기
 * - 삭제: 각 카드 우측 휴지통 버튼
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, FlatList, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark, ExternalLink, Trash2, Newspaper, BookOpen, Lightbulb } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useLanguage } from '@/context/LanguageContext';
import { Colors } from '@/lib/colors';
import { cardShadow } from '@/lib/theme';
import type { Bookmark as BookmarkType } from '@/lib/types';

function useTypeConfig() {
  const { t } = useLanguage();
  return {
    news: { label: t('saved.type_news'), color: Colors.primary, bgColor: Colors.primaryLight, Icon: Newspaper },
    snap: { label: t('saved.type_principle'), color: Colors.coreTech, bgColor: Colors.coreTechBg, Icon: BookOpen },
    principle: { label: t('saved.type_principle'), color: Colors.coreTech, bgColor: Colors.coreTechBg, Icon: BookOpen },
    idea: { label: t('saved.type_idea'), color: Colors.accent, bgColor: Colors.warningLight, Icon: Lightbulb },
  } as const;
}

function SavedItemCard({
  bookmark,
  onDelete,
  typeConfig,
  lang,
}: { bookmark: BookmarkType; onDelete: (bookmark: BookmarkType) => void; typeConfig: ReturnType<typeof useTypeConfig>; lang: string }) {
  const { t } = useLanguage();
  const config = typeConfig[bookmark.type] ?? typeConfig.news;
  const meta = bookmark.metadata;
  const Icon = config.Icon;

  return (
    <View
      style={{ backgroundColor: Colors.card, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 16, ...cardShadow }}
    >
      {/* Type badge + 삭제 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ backgroundColor: config.bgColor, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon size={11} color={config.color} />
            <Text style={{ color: config.color, fontSize: 11, fontWeight: '700' }}>{config.label}</Text>
          </View>
          {meta?.category && (
            <Text style={{ color: Colors.textDim, fontSize: 12 }}>{meta.category}</Text>
          )}
        </View>
        <Pressable
          onPress={() => onDelete(bookmark)}
          style={{ padding: 14 }}
          accessibilityLabel={t('saved.delete')}
        >
          <Trash2 size={15} color={Colors.textDim} />
        </Pressable>
      </View>

      {/* 제목 */}
      <Text
        style={{ color: Colors.textPrimary, fontWeight: '700', fontSize: 16, lineHeight: 22, marginBottom: 4 }}
        numberOfLines={2}
      >
        {meta?.title ?? bookmark.itemId}
      </Text>

      {/* 부제목 */}
      {meta?.subtitle && (
        <Text style={{ color: Colors.textDim, fontSize: 12, lineHeight: 16 }} numberOfLines={1}>
          {meta.subtitle}
        </Text>
      )}

      {/* Footer: 저장일 + 원문 링크 (뉴스만) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <Text style={{ color: Colors.textDim, fontSize: 12 }}>
          {typeof bookmark.createdAt === 'string'
            ? new Date(bookmark.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR')
            : ''}
        </Text>
        {bookmark.type === 'news' && meta?.link && (
          <Pressable
            onPress={() => Linking.openURL(meta.link!)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '600' }}>{t('saved.view_original')}</Text>
            <ExternalLink size={12} color={Colors.primary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function SavedScreen() {
  const { user } = useAuth();
  const { bookmarks, toggleBookmark } = useBookmarks(user?.uid ?? null);
  const { lang, t } = useLanguage();
  const typeConfig = useTypeConfig();

  // 최신순 정렬
  const sorted = useMemo(() => [...bookmarks].sort((a, b) => {
    const da = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
    const db_ = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
    return db_ - da;
  }), [bookmarks]);

  const { newsCount, snapCount, ideaCount } = useMemo(() => {
    let news = 0, snap = 0, idea = 0;
    for (const b of bookmarks) {
      if (b.type === 'news') news++;
      else if (b.type === 'snap' || b.type === 'principle') snap++;
      else if (b.type === 'idea') idea++;
    }
    return { newsCount: news, snapCount: snap, ideaCount: idea };
  }, [bookmarks]);

  const handleDelete = useCallback((bookmark: BookmarkType) => {
    Alert.alert(
      t('saved.delete'),
      t('saved.delete_confirm'),
      [
        { text: t('saved.delete_cancel'), style: 'cancel' },
        {
          text: t('saved.delete_action'),
          style: 'destructive',
          onPress: () => toggleBookmark(bookmark.type, bookmark.itemId),
        },
      ],
    );
  }, [t, toggleBookmark]);

  const renderItem = useCallback(({ item }: { item: BookmarkType }) => (
    <SavedItemCard
      bookmark={item}
      onDelete={handleDelete}
      typeConfig={typeConfig}
      lang={lang}
    />
  ), [handleDelete, typeConfig, lang]);

  const keyExtractor = useCallback(
    (item: BookmarkType, index: number) => `${item.type}_${item.itemId}_${index}`,
    [],
  );

  const ListEmptyComponent = !user ? (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Bookmark size={28} color={Colors.primary} />
      </View>
      <Text style={{ color: Colors.textPrimary, fontWeight: '600', fontSize: 16, marginBottom: 4 }}>{t('auth.login_required')}</Text>
      <Text style={{ color: Colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
        {t('saved.bookmark_login')}
      </Text>
    </View>
  ) : (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Bookmark size={28} color={Colors.primary} />
      </View>
      <Text style={{ color: Colors.textPrimary, fontWeight: '600', fontSize: 16, marginBottom: 4 }}>{t('saved.no_items_yet')}</Text>
      <Text style={{ color: Colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
        {t('saved.bookmark_hint')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: Colors.textPrimary, fontSize: 24, fontWeight: '800' }}>{t('saved.title')}</Text>
            <Text style={{ color: Colors.textDim, fontSize: 14, marginTop: 4 }}>
              {sorted.length > 0 ? `${sorted.length}${t('saved.total')}` : t('saved.empty')}
            </Text>
          </View>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Bookmark size={20} color={Colors.primary} />
          </View>
        </View>
        <View style={{ width: 40, height: 3, backgroundColor: Colors.primary, borderRadius: 2, marginTop: 12 }} />
      </View>

      {/* 타입별 통계 카드 */}
      {sorted.length > 0 && (
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 8 }}>
          {newsCount > 0 && (
            <View style={{ flex: 1, backgroundColor: Colors.primaryLight, borderRadius: 14, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: Colors.primary, fontSize: 20, fontWeight: '800' }}>{newsCount}</Text>
              <Text style={{ color: Colors.primary, fontSize: 11, fontWeight: '600' }}>{t('saved.type_news')}</Text>
            </View>
          )}
          {snapCount > 0 && (
            <View style={{ flex: 1, backgroundColor: Colors.coreTechBg, borderRadius: 14, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: Colors.coreTech, fontSize: 20, fontWeight: '800' }}>{snapCount}</Text>
              <Text style={{ color: Colors.coreTech, fontSize: 11, fontWeight: '600' }}>{t('saved.type_principle')}</Text>
            </View>
          )}
          {ideaCount > 0 && (
            <View style={{ flex: 1, backgroundColor: Colors.warningLight, borderRadius: 14, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: Colors.accent, fontSize: 20, fontWeight: '800' }}>{ideaCount}</Text>
              <Text style={{ color: Colors.accent, fontSize: 11, fontWeight: '600' }}>{t('saved.type_idea')}</Text>
            </View>
          )}
        </View>
      )}

      <FlatList
        data={sorted}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={<View style={{ height: 24 }} />}
      />
    </SafeAreaView>
  );
}
