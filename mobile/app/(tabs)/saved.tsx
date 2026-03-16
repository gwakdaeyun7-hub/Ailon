/**
 * 저장한 항목 화면
 * - Firestore users/{uid}/bookmarks 서브컬렉션
 * - 타입별 통계 (뉴스 / 원리 / 아이디어)
 * - 뉴스 북마크: 카드 탭 → AI 요약 모달 (articles/{article_id})
 * - 원문 링크 바로 열기
 * - 삭제: 각 카드 우측 휴지통 버튼
 */

import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, Linking, Alert, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bookmark, ExternalLink, Trash2, Newspaper, BookOpen, X } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useArticle } from '@/hooks/useArticle';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { cardShadow, FontFamily } from '@/lib/theme';
import type { ThemeColors } from '@/lib/colors';
import type { Bookmark as BookmarkType, Article } from '@/lib/types';

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
  onPress,
  typeConfig,
  lang,
  colors,
}: { bookmark: BookmarkType; onDelete: (bookmark: BookmarkType) => void; onPress?: (bookmark: BookmarkType) => void; typeConfig: ReturnType<typeof useTypeConfig>; lang: string; colors: ThemeColors }) {
  const { t } = useLanguage();
  const config = (bookmark.type in typeConfig ? typeConfig[bookmark.type as keyof typeof typeConfig] : typeConfig.news);
  const meta = bookmark.metadata;
  const Icon = config.Icon;

  const cardContent = (
    <View
      style={{ backgroundColor: colors.card, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 16, ...cardShadow }}
    >
      {/* Type badge + 날짜 + 삭제 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ backgroundColor: config.bgColor, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon size={11} color={config.color} />
            <Text style={{ color: config.color, fontSize: 11, fontWeight: '700' }}>{config.label}</Text>
          </View>
          {meta?.category && (
            <Text style={{ color: colors.textDim, fontSize: 12 }}>{meta.category}</Text>
          )}
          {typeof bookmark.createdAt === 'string' && (
            <Text style={{ color: colors.textLight, fontSize: 12 }}>
              {'· '}
              {new Date(bookmark.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR')}
            </Text>
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
          <Trash2 size={18} color={colors.textDim} />
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

      {/* Footer: 원문 링크 (뉴스만) */}
      {bookmark.type === 'news' && meta?.link && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8 }}>
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
        </View>
      )}
    </View>
  );

  // 뉴스 타입이고 articleId가 있으면 카드 전체를 탭 가능하게 감싸기
  if (bookmark.type === 'news' && onPress) {
    return (
      <Pressable
        onPress={() => onPress(bookmark)}
        accessibilityRole="button"
        accessibilityLabel={lang === 'en' ? 'View AI summary' : 'AI 요약 보기'}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
}

/** 기사 요약 모달 — articleId로 Firestore에서 fetch 후 표시 */
function ArticleSummaryModal({
  visible,
  onClose,
  articleId,
  fallbackLink,
  lang,
  colors,
}: { visible: boolean; onClose: () => void; articleId: string | null; fallbackLink?: string; lang: string; colors: ThemeColors }) {
  const { article, loading } = useArticle(visible ? articleId : null);

  const getField = useCallback((ko: string | undefined, en: string | undefined) => {
    return lang === 'en' ? (en || ko || '') : (ko || '');
  }, [lang]);

  const title = article ? getField(article.display_title, article.display_title_en) || article.title : '';
  const oneLine = article ? getField(article.one_line, article.one_line_en) : '';
  const keyPoints = article ? (lang === 'en' ? (article.key_points_en || article.key_points) : article.key_points) || [] : [];
  const whyImportant = article ? getField(article.why_important, article.why_important_en) : '';
  const background = article ? getField(article.background, article.background_en) : '';
  const tags = article?.tags || [];
  const link = article?.link || fallbackLink;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
        {/* Header: 닫기 버튼 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>AI Summary</Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close"
            accessibilityRole="button"
            style={({ pressed }) => ({
              minHeight: 44, minWidth: 44,
              alignItems: 'center' as const, justifyContent: 'center' as const,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <X size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Content */}
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !article ? (
          /* 기사를 찾을 수 없을 때 */
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <Text style={{ color: colors.textDim, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 20 }}>
              {lang === 'en'
                ? 'Article summary is not available.\nThis may be an older bookmark.'
                : '기사 요약을 불러올 수 없습니다.\n이전에 저장한 북마크일 수 있습니다.'}
            </Text>
            {link && (
              <Pressable
                onPress={() => Linking.openURL(link)}
                style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
              >
                <Text style={{ color: colors.card, fontWeight: '600', fontSize: 14 }}>
                  {lang === 'en' ? 'View Original' : '원문 보기'}
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* 제목 */}
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800', lineHeight: 30, fontFamily: FontFamily.serif, marginBottom: 16 }}>
              {title}
            </Text>

            {/* 한줄 요약 */}
            {oneLine ? (
              <View style={{ backgroundColor: colors.primaryLight, borderRadius: 12, padding: 14, marginBottom: 20 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 15, lineHeight: 22, fontWeight: '600' }}>
                  {oneLine}
                </Text>
              </View>
            ) : null}

            {/* 핵심 포인트 */}
            {keyPoints.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 10, fontFamily: FontFamily.serif }}>
                  {lang === 'en' ? 'Key Points' : '핵심 포인트'}
                </Text>
                {keyPoints.map((point, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', marginBottom: 8, paddingRight: 8 }}>
                    <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700', marginRight: 8, minWidth: 20 }}>
                      {idx + 1}.
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, flex: 1 }}>
                      {point}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 왜 중요한가 */}
            {whyImportant ? (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 8, fontFamily: FontFamily.serif }}>
                  {lang === 'en' ? 'Why It Matters' : '왜 중요한가'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
                  {whyImportant}
                </Text>
              </View>
            ) : null}

            {/* 배경 */}
            {background ? (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 8, fontFamily: FontFamily.serif }}>
                  {lang === 'en' ? 'Background' : '배경'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
                  {background}
                </Text>
              </View>
            ) : null}

            {/* 태그 */}
            {tags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                {tags.map((tag, idx) => (
                  <View key={idx} style={{ backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                    <Text style={{ color: colors.textDim, fontSize: 12 }}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 원문 보기 버튼 */}
            {link && (
              <Pressable
                onPress={() => Linking.openURL(link)}
                accessibilityRole="link"
                accessibilityLabel={lang === 'en' ? 'View Original' : '원문 보기'}
                style={({ pressed }) => ({
                  flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
                  backgroundColor: colors.primary, borderRadius: 14,
                  paddingVertical: 14, gap: 6,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: colors.card, fontSize: 15, fontWeight: '700' }}>
                  {lang === 'en' ? 'Read Original Article' : '원문 보기'}
                </Text>
                <ExternalLink size={16} color={colors.card} />
              </Pressable>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

export default function SavedScreen() {
  const { user } = useAuth();
  const { bookmarks, toggleBookmark } = useBookmarks(user?.uid ?? null);
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const typeConfig = useTypeConfig(colors);

  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkType | null>(null);

  // 최신순 정렬
  const sorted = useMemo(() => [...bookmarks].sort((a, b) => {
    const da = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
    const db_ = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
    return db_ - da;
  }), [bookmarks]);

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

  const handleCardPress = useCallback((bookmark: BookmarkType) => {
    setSelectedBookmark(bookmark);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedBookmark(null);
  }, []);

  const renderItem = useCallback(({ item }: { item: BookmarkType }) => (
    <SavedItemCard
      bookmark={item}
      onDelete={handleDelete}
      onPress={handleCardPress}
      typeConfig={typeConfig}
      lang={lang}
      colors={colors}
    />
  ), [handleDelete, handleCardPress, typeConfig, lang, colors]);

  const keyExtractor = useCallback(
    (item: BookmarkType, index: number) => `${item.type}_${item.itemId}_${index}`,
    [],
  );

  const router = useRouter();

  const ListEmptyComponent = !user ? (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
      <Bookmark size={48} color={colors.textDim} style={{ marginBottom: 20 }} />
      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 17, lineHeight: 24, marginBottom: 6 }}>{t('auth.login_required')}</Text>
      <Text style={{ color: colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
        {t('saved.bookmark_login')}
      </Text>
      <Pressable
        onPress={() => router.push('/auth')}
        style={{ backgroundColor: colors.primary, paddingHorizontal: 36, paddingVertical: 14, borderRadius: 16, marginTop: 20 }}
      >
        <Text style={{ color: colors.card, fontWeight: '700', fontSize: 16 }}>{t('auth.google_login')}</Text>
      </Pressable>
    </View>
  ) : (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
      <Bookmark size={48} color={colors.textDim} style={{ marginBottom: 20 }} />
      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 17, lineHeight: 24, marginBottom: 6 }}>{t('saved.no_items_yet')}</Text>
      <Text style={{ color: colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
        {t('saved.bookmark_hint')}
      </Text>
      <Pressable
        onPress={() => router.push('/(tabs)/')}
        style={{ backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14, marginTop: 20 }}
      >
        <Text style={{ color: colors.card, fontWeight: '600', fontSize: 14 }}>
          {lang === 'ko' ? '뉴스 보러가기' : 'Browse News'}
        </Text>
      </Pressable>
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
        </View>
      </View>

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

      {/* 기사 요약 모달 */}
      <ArticleSummaryModal
        visible={selectedBookmark !== null}
        onClose={handleCloseModal}
        articleId={selectedBookmark?.metadata?.articleId ?? null}
        fallbackLink={selectedBookmark?.metadata?.link}
        lang={lang}
        colors={colors}
      />
    </SafeAreaView>
  );
}
