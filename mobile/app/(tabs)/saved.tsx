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
import { Bookmark, ExternalLink, Trash2, Newspaper, BookOpen } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { cardShadow, FontFamily } from '@/lib/theme';
import type { ThemeColors } from '@/lib/colors';
import type { Bookmark as BookmarkType } from '@/lib/types';

function useTypeConfig(colors: ThemeColors) {
  const { t } = useLanguage();
  return {
    news: { label: t('saved.type_news'), color: colors.primary, bgColor: colors.primaryLight, Icon: Newspaper },
    snap: { label: t('saved.type_principle'), color: colors.coreTech, bgColor: colors.coreTechBg, Icon: BookOpen },
    principle: { label: t('saved.type_principle'), color: colors.coreTech, bgColor: colors.coreTechBg, Icon: BookOpen },
  } as const;
}

function SavedItemCard({
  bookmark,
  onDelete,
  typeConfig,
  lang,
  colors,
}: { bookmark: BookmarkType; onDelete: (bookmark: BookmarkType) => void; typeConfig: ReturnType<typeof useTypeConfig>; lang: string; colors: ThemeColors }) {
  const { t } = useLanguage();
  const config = typeConfig[bookmark.type] ?? typeConfig.news;
  const meta = bookmark.metadata;
  const Icon = config.Icon;

  return (
    <View
      style={{ backgroundColor: colors.card, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 16, ...cardShadow }}
    >
      {/* Type badge + 삭제 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ backgroundColor: config.bgColor, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon size={11} color={config.color} />
            <Text style={{ color: config.color, fontSize: 11, fontWeight: '700' }}>{config.label}</Text>
          </View>
          {meta?.category && (
            <Text style={{ color: colors.textDim, fontSize: 12 }}>{meta.category}</Text>
          )}
        </View>
        <Pressable
          onPress={() => onDelete(bookmark)}
          accessibilityLabel={t('saved.delete')}
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 44, minWidth: 44,
            alignItems: 'center' as const, justifyContent: 'center' as const,
            marginRight: -10, marginTop: -8,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Trash2 size={16} color={colors.textLight} />
        </Pressable>
      </View>

      {/* 제목 */}
      <Text
        style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16, lineHeight: 22, marginBottom: 4, fontFamily: FontFamily.serif }}
        numberOfLines={2}
      >
        {meta?.title ?? bookmark.itemId}
      </Text>

      {/* 부제목 */}
      {meta?.subtitle && (
        <Text style={{ color: colors.textDim, fontSize: 13, lineHeight: 18, marginTop: 2 }} numberOfLines={2}>
          {meta.subtitle}
        </Text>
      )}

      {/* Footer: 저장일 + 원문 링크 (뉴스만) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ color: colors.textLight, fontSize: 12 }}>
          {typeof bookmark.createdAt === 'string'
            ? new Date(bookmark.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR')
            : ''}
        </Text>
        {bookmark.type === 'news' && meta?.link && (
          <Pressable
            onPress={() => Linking.openURL(meta.link!)}
            accessibilityLabel={t('saved.view_original')}
            accessibilityRole="link"
            style={({ pressed }) => ({
              flexDirection: 'row' as const, alignItems: 'center' as const,
              gap: 4, minHeight: 44, paddingVertical: 8, paddingLeft: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>{t('saved.view_original')}</Text>
            <ExternalLink size={12} color={colors.primary} />
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
  const { colors } = useTheme();
  const typeConfig = useTypeConfig(colors);

  // 최신순 정렬
  const sorted = useMemo(() => [...bookmarks].sort((a, b) => {
    const da = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
    const db_ = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
    return db_ - da;
  }), [bookmarks]);

  const { newsCount, snapCount } = useMemo(() => {
    let news = 0, snap = 0;
    for (const b of bookmarks) {
      if (b.type === 'news') news++;
      else if (b.type === 'snap' || b.type === 'principle') snap++;
    }
    return { newsCount: news, snapCount: snap };
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
      colors={colors}
    />
  ), [handleDelete, typeConfig, lang, colors]);

  const keyExtractor = useCallback(
    (item: BookmarkType, index: number) => `${item.type}_${item.itemId}_${index}`,
    [],
  );

  const ListEmptyComponent = !user ? (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Bookmark size={30} color={colors.primary} />
      </View>
      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 17, lineHeight: 24, marginBottom: 6 }}>{t('auth.login_required')}</Text>
      <Text style={{ color: colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
        {t('saved.bookmark_login')}
      </Text>
    </View>
  ) : (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Bookmark size={30} color={colors.primary} />
      </View>
      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 17, lineHeight: 24, marginBottom: 6 }}>{t('saved.no_items_yet')}</Text>
      <Text style={{ color: colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
        {t('saved.bookmark_hint')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '800', fontFamily: FontFamily.serifItalic }}>{t('saved.title')}</Text>
            <Text style={{ color: colors.textDim, fontSize: 14, marginTop: 4 }}>
              {sorted.length > 0 ? `${sorted.length}${t('saved.total')}` : t('saved.empty')}
            </Text>
          </View>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Bookmark size={20} color={colors.primary} />
          </View>
        </View>
        <View style={{ width: 40, height: 3, backgroundColor: colors.primary, borderRadius: 2, marginTop: 12 }} />
      </View>

      {/* 타입별 통계 카드 */}
      {sorted.length > 0 && (
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, gap: 8 }}>
          {newsCount > 0 && (
            <View style={{ flex: 1, backgroundColor: colors.primaryLight, borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', minHeight: 56 }}>
              <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '800' }}>{newsCount}</Text>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>{t('saved.type_news')}</Text>
            </View>
          )}
          {snapCount > 0 && (
            <View style={{ flex: 1, backgroundColor: colors.coreTechBg, borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', minHeight: 56 }}>
              <Text style={{ color: colors.coreTech, fontSize: 20, fontWeight: '800' }}>{snapCount}</Text>
              <Text style={{ color: colors.coreTech, fontSize: 11, fontWeight: '600', marginTop: 2 }}>{t('saved.type_principle')}</Text>
            </View>
          )}
        </View>
      )}

      <FlatList
        data={sorted}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={sorted.length === 0 ? { flexGrow: 1 } : undefined}
        ListHeaderComponent={sorted.length > 0 ? <View style={{ height: 4 }} /> : null}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={<View style={{ height: 24 }} />}
      />
    </SafeAreaView>
  );
}
