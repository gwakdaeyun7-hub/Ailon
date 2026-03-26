/**
 * 저장한 항목 화면
 * - Firestore users/{uid}/bookmarks 서브컬렉션
 * - 타입별 통계 (뉴스 / 원리 / 아이디어)
 * - 뉴스 북마크: 카드 탭 → AI 요약 모달 (articles/{article_id})
 * - 원문 링크 바로 열기
 * - 삭제: 각 카드 우측 휴지통 버튼
 */

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, Pressable, Alert, Modal, ScrollView, ActivityIndicator, Animated, StyleSheet, LayoutAnimation, Share } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bookmark, ExternalLink, Trash2, Newspaper, BookOpen, X, ChevronDown, Heart, Share2, MessageCircle, Clock } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useArticle } from '@/hooks/useArticle';
import { useReactions } from '@/hooks/useReactions';
import { useArticleViews } from '@/hooks/useArticleViews';
import { useGlossaryDB } from '@/hooks/useGlossaryDB';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { cardShadow, FontFamily } from '@/lib/theme';
import type { ThemeColors } from '@/lib/colors';
import type { Bookmark as BookmarkType, Article } from '@/lib/types';
import { CommentSheet } from '@/components/shared/CommentSheet';
import { useShareLink } from '@/hooks/useShareLink';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useReadStats } from '@/hooks/useReadStats';
import { HighlightedText } from '@/components/shared/HighlightedText';
import { RelatedArticlesSection } from '@/components/shared/RelatedArticlesSection';
import {
  SOURCE_COLORS, CATEGORY_COLORS,
  getSourceName, getCategoryName, formatDate,
  getLocalizedTitle, getLocalizedOneLine, getLocalizedSections,
  getLocalizedWhyImportant, getLocalizedBackground, getLocalizedGlossary,
} from '@/lib/articleHelpers';
import { openArticle } from '@/lib/openArticle';

function useTypeConfig(colors: ThemeColors) {
  const { t } = useLanguage();
  return {
    news: { label: t('saved.type_news'), color: colors.textPrimary, bgColor: colors.primaryLight, Icon: Newspaper },
    snap: { label: t('saved.type_principle'), color: colors.textPrimary, bgColor: colors.primaryLight, Icon: BookOpen },
    principle: { label: t('saved.type_principle'), color: colors.textPrimary, bgColor: colors.primaryLight, Icon: BookOpen },
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
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
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
            onPress={() => openArticle(meta.link!)}
            accessibilityLabel={t('saved.view_original')}
            accessibilityRole="link"
            style={({ pressed }) => ({
              flexDirection: 'row' as const, alignItems: 'center' as const,
              gap: 4, minHeight: 44, paddingVertical: 8, paddingLeft: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{t('saved.view_original')}</Text>
            <ExternalLink size={12} color={colors.textPrimary} />
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

/** 기사 요약 모달 내부 콘텐츠 — index.tsx SummaryModalContent와 동일한 디자인 */
function ArticleSummaryContent({ article, onClose, onOpenComments }: { article: Article; onClose: () => void; onOpenComments: () => void }) {
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showComments } = useFeatureFlags();
  const { isBookmarked, toggleBookmark } = useBookmarks(user?.uid ?? null);
  const { shareArticleLink } = useShareLink();
  const { likes, liked, toggleLike } = useReactions('news', article.link);
  const { views, trackView } = useArticleViews(article.link);
  const { allTerms: glossaryDBTerms } = useGlossaryDB();
  const insets = useSafeAreaInsets();

  const [toastMsg, setToastMsg] = useState('');
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [usedTermKeys, setUsedTermKeys] = useState<Set<string>>(new Set());
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const viewTrackedLink = useRef('');

  // related_ids 조회
  const relatedIds = article.related_ids ?? [];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastAnimRef.current) toastAnimRef.current.stop();
    const anim = Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]);
    toastAnimRef.current = anim;
    anim.start();
  };

  useEffect(() => {
    if (article.link !== viewTrackedLink.current) {
      viewTrackedLink.current = article.link;
      trackView();
      setGlossaryOpen(false);
      setUsedTermKeys(new Set());
    }
  }, [article, trackView]);

  const bookmarked = useMemo(() => isBookmarked('news', article.link), [isBookmarked, article]);
  const handleToggleBookmark = useCallback(() => {
    toggleBookmark('news', article.link, {
      title: getLocalizedTitle(article, lang),
      link: article.link,
      ...(article.category ? { category: article.category } : {}),
      ...(article.article_id ? { articleId: article.article_id } : {}),
    });
  }, [toggleBookmark, article, lang]);

  const handleLike = async () => {
    const result = await toggleLike();
    if (result === 'no_user') {
      showToast(t('auth.login_required_toast'));
    }
  };

  const handleShare = async () => {
    const title = getLocalizedTitle(article, lang);
    const oneLine = getLocalizedOneLine(article, lang);
    if (article.article_id) {
      await shareArticleLink(article.article_id, title, oneLine, lang);
    } else {
      try {
        await Share.share({ message: `${title}\n\n${article.link || ''}\n\n${t('share.footer')}` });
      } catch (err) {
        console.warn('Share failed:', err);
      }
    }
  };

  const handleTermsDetected = useCallback((keys: string[]) => {
    setUsedTermKeys(prev => {
      const next = new Set(prev);
      for (const k of keys) next.add(k);
      return next.size === prev.size ? prev : next;
    });
  }, []);

  const { oneLine, sections, whyImportant, background, tags, glossary, readMin } = useMemo(() => {
    const ol = getLocalizedOneLine(article, lang);
    const sc = getLocalizedSections(article, lang);
    const wi = getLocalizedWhyImportant(article, lang);
    const bg = getLocalizedBackground(article, lang);
    const tg = (lang === 'en' && article.tags_en && article.tags_en.length > 0) ? article.tags_en : article.tags;
    const gl = getLocalizedGlossary(article, lang);
    const summaryText = [ol, ...sc.map(s => s.content), wi].join('');
    const rm = Math.max(1, Math.round(summaryText.length / 500));
    return { oneLine: ol, sections: sc, whyImportant: wi, background: bg, tags: tg, glossary: gl, readMin: rm };
  }, [article, lang]);

  const articleTitle = getLocalizedTitle(article, lang);

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
          accessibilityLabel={t('modal.close')}
          accessibilityRole="button"
        />

        <View style={{
          width: '100%',
          backgroundColor: colors.card,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '85%',
        }} accessibilityViewIsModal={true} accessibilityLabel={articleTitle}>
          {/* 드래그 핸들 */}
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          {/* X 닫기 버튼 */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8, paddingBottom: 12, paddingHorizontal: 20 }}>
            <Pressable
              onPress={onClose}
              accessibilityLabel={t('modal.close')}
              accessibilityRole="button"
              style={{ width: 44, height: 44, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator
            bounces
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {/* 썸네일 이미지 — 풀 너비 */}
            {article.image_url ? (
              <Image
                source={article.image_url}
                style={{ width: '100%', height: 200 }}
                contentFit="cover"
                transition={200}
                recyclingKey={`saved-modal-${article.link}`}
              />
            ) : null}

            {/* 소스 뱃지 + 날짜 + 카테고리 + 북마크 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingHorizontal: 20, paddingTop: 20, gap: 6 }}>
              {(() => {
                const sk = article.source_key || article.source;
                const sc = SOURCE_COLORS[sk] || colors.textSecondary;
                return (
                  <View style={{ backgroundColor: `${sc}18`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: sc }}>{getSourceName(sk, t)}</Text>
                  </View>
                );
              })()}
              <Text style={{ fontSize: 11, color: colors.textDim }}>{formatDate(article.published, lang, article.date_estimated)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Clock size={11} color={colors.textDim} strokeWidth={2} />
                <Text style={{ fontSize: 11, color: colors.textDim }}>{readMin}{lang === 'ko' ? '분' : ' min'}</Text>
              </View>
              {article.category ? (
                <View style={{ backgroundColor: `${CATEGORY_COLORS[article.category] || colors.textDim}18`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary }}>{getCategoryName(article.category, t)}</Text>
                </View>
              ) : null}
              <View style={{ marginLeft: 'auto' }}>
                <Pressable
                  onPress={handleToggleBookmark}
                  accessibilityLabel={bookmarked ? t('bookmark.remove') : t('bookmark.add')}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Bookmark
                    size={18}
                    color={bookmarked ? colors.bookmarkActiveColor : colors.textSecondary}
                    fill="none"
                    strokeWidth={2}
                  />
                </Pressable>
              </View>
            </View>

            {/* 제목 — 세리프 22px, weight 900 */}
            <Text
              accessibilityRole="header"
              style={{
                fontSize: 22, fontWeight: '900', color: colors.textPrimary, lineHeight: 32,
                letterSpacing: -0.3,
                paddingHorizontal: 20, fontFamily: FontFamily.serif,
                marginTop: 8,
              }}
            >
              {articleTitle}
            </Text>

            {/* 콘텐츠 영역 */}
            {oneLine ? (
              <View style={{ paddingHorizontal: 20 }}>
                {/* 1. One Line — left-border 강조 */}
                <View style={{ marginTop: 16, borderLeftWidth: 2, borderLeftColor: colors.primary, paddingLeft: 14, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', lineHeight: 26, color: colors.textPrimary }}>
                    {oneLine}
                  </Text>
                </View>

                {/* 2. Background */}
                {background ? (
                  <Text style={{ fontSize: 14, lineHeight: 23, letterSpacing: 0.2, color: colors.textSecondary, marginTop: 20 }}>
                    {background}
                  </Text>
                ) : null}

                {/* 3. Sections — 소제목 + 내용 블록 (레거시 key_points 폴백 포함) */}
                {sections.length > 0 && (
                  <View style={{ marginTop: 24 }}>
                    {sections.map((section, idx) => (
                      <View key={idx} style={{ marginTop: idx === 0 ? 0 : 32 }}>
                        {section.subtitle ? (
                          <Text style={{ fontSize: 18, fontWeight: '700', lineHeight: 26, letterSpacing: -0.2, color: colors.textPrimary, fontFamily: FontFamily.serif, marginBottom: 10 }}>{section.subtitle}</Text>
                        ) : null}
                        <HighlightedText
                          text={section.content}
                          glossaryTerms={glossaryDBTerms}
                          style={{ fontSize: 15, color: colors.textPrimary, lineHeight: 24 }}
                          usedTermKeys={usedTermKeys}
                          onTermsDetected={handleTermsDetected}
                        />
                      </View>
                    ))}
                  </View>
                )}

                {/* 4. Why Important — 세리프 소제목 */}
                {whyImportant ? (
                  <View style={{ marginTop: 24 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', lineHeight: 26, color: colors.textSecondary, fontFamily: FontFamily.serif, marginBottom: 8 }}>{t('modal.why_important')}</Text>
                    <HighlightedText
                      text={whyImportant}
                      glossaryTerms={glossaryDBTerms}
                      style={{ fontSize: 15, color: colors.textPrimary, lineHeight: 26, letterSpacing: 0.2 }}
                      usedTermKeys={usedTermKeys}
                      onTermsDetected={handleTermsDetected}
                    />
                  </View>
                ) : null}

                {/* Tags — 필 스타일 */}
                {tags && tags.length > 0 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 24 }}>
                    {tags.map((tag, idx) => (
                      <View key={idx} style={{ backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary }}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Glossary — 아코디언 */}
                {glossary.length > 0 ? (
                  <View style={{ marginTop: 24 }}>
                    <Pressable
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setGlossaryOpen(!glossaryOpen);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={t('modal.glossary')}
                      accessibilityState={{ expanded: glossaryOpen }}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: colors.textSecondary }}>
                        {t('modal.glossary').toUpperCase()}
                      </Text>
                      <View style={{ transform: [{ rotate: glossaryOpen ? '180deg' : '0deg' }] }}>
                        <ChevronDown size={12} color={colors.textDim} />
                      </View>
                    </Pressable>
                    {glossaryOpen ? (
                      <View style={{ paddingTop: 10 }}>
                        {glossary.map((item, idx) => (
                          <View key={idx} style={{ marginBottom: idx < glossary.length - 1 ? 10 : 0, paddingLeft: 12 }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary, marginBottom: 1 }}>{item.term}</Text>
                            <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 17 }}>{item.desc}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Related Articles */}
                {relatedIds.length > 0 && (
                  <RelatedArticlesSection relatedIds={relatedIds} />
                )}

              </View>
            ) : article.summary ? (
              <Text style={{
                fontSize: 15, color: colors.textPrimary, lineHeight: 24, letterSpacing: 0.2, marginBottom: 16,
                paddingHorizontal: 20,
              }}>
                {article.summary}
              </Text>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 }}>
                  {t('modal.no_summary')}
                </Text>
              </View>
            )}

            {/* Read Original 버튼 */}
            {article.link ? (
              <View style={{ paddingHorizontal: 20, marginTop: 32, marginBottom: 8 }}>
                <Pressable
                  onPress={() => openArticle(article.link)}
                  accessibilityRole="button"
                  accessibilityLabel={t('article.read_original')}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderWidth: 1.5,
                    borderColor: colors.textPrimary,
                    borderRadius: 14,
                    paddingVertical: 13,
                    paddingHorizontal: 20,
                    minHeight: 44,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <ExternalLink size={16} color={colors.textPrimary} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>{t('article.read_original')}</Text>
                </Pressable>
              </View>
            ) : null}

          </ScrollView>

          {/* 고정 하단 액션 바 */}
          <View style={{
            flexDirection: 'row',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
            backgroundColor: colors.card,
            paddingBottom: Math.max(insets.bottom, 10),
          }}>
            <Pressable
              onPress={handleLike}
              accessibilityLabel={liked ? t('modal.unlike') : t('modal.like')}
              accessibilityRole="button"
              style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}
            >
              <Heart size={22} color={liked ? colors.primary : colors.textDim} fill={liked ? colors.primary : 'none'} />
            </Pressable>
            {showComments && (
              <Pressable
                onPress={onOpenComments}
                accessibilityLabel={t('modal.comment')}
                accessibilityRole="button"
                style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}
              >
                <MessageCircle size={22} color={colors.textDim} />
              </Pressable>
            )}
            <Pressable
              onPress={handleShare}
              accessibilityLabel={t('modal.share')}
              accessibilityRole="button"
              style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}
            >
              <Share2 size={22} color={colors.textDim} />
            </Pressable>
          </View>

          {/* 토스트 */}
          {toastMsg ? (
            <Animated.View style={{
              position: 'absolute', top: 20, left: 20, right: 20,
              backgroundColor: colors.toastBg, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16,
              alignItems: 'center', opacity: toastOpacity,
            }} pointerEvents="none" accessibilityLiveRegion="assertive">
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>{toastMsg}</Text>
            </Animated.View>
          ) : null}

        </View>
      </View>
    </Modal>
  );
}

/** 기사 요약 모달 — articleId로 Firestore에서 fetch 후 표시 */
function ArticleSummaryModal({
  visible,
  onClose,
  articleId,
  fallbackLink,
  onOpenComments,
}: { visible: boolean; onClose: () => void; articleId: string | null; fallbackLink?: string; onOpenComments: (link: string) => void }) {
  const { article, loading } = useArticle(visible ? articleId : null);
  const { lang, t } = useLanguage();
  const { colors } = useTheme();

  if (!visible) return null;

  // 로딩 중
  if (loading) {
    return (
      <Modal visible transparent animationType="slide" onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <View style={{ width: '100%', backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingVertical: 80, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </Modal>
    );
  }

  // 기사를 찾을 수 없을 때
  if (!article) {
    const link = fallbackLink;
    return (
      <Modal visible transparent animationType="slide" onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <View style={{ width: '100%', backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 32, alignItems: 'center' }}>
            <View style={{ alignItems: 'center', paddingTop: 12, marginBottom: 20, width: '100%' }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>
            <Text style={{ color: colors.textDim, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 20 }}>
              {lang === 'en'
                ? 'Article summary is not available.\nThis may be an older bookmark.'
                : '기사 요약을 불러올 수 없습니다.\n이전에 저장한 북마크일 수 있습니다.'}
            </Text>
            {link && (
              <Pressable
                onPress={() => openArticle(link)}
                style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
              >
                <Text style={{ color: colors.card, fontWeight: '600', fontSize: 14 }}>
                  {lang === 'en' ? 'View Original' : '원문 보기'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <ArticleSummaryContent
      article={article}
      onClose={onClose}
      onOpenComments={() => onOpenComments(article.link)}
    />
  );
}

export default function SavedScreen() {
  const { user } = useAuth();
  const { bookmarks, toggleBookmark } = useBookmarks(user?.uid ?? null);
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const typeConfig = useTypeConfig(colors);
  const { showComments } = useFeatureFlags();
  const { recordRead } = useReadStats(user?.uid ?? null);

  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkType | null>(null);
  const [commentArticleLink, setCommentArticleLink] = useState<string | null>(null);

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
    if (bookmark.type === 'news') recordRead(bookmark.itemId);
  }, [recordRead]);

  const handleCloseModal = useCallback(() => {
    setSelectedBookmark(null);
  }, []);

  const handleOpenComments = useCallback((link: string) => {
    setCommentArticleLink(link);
  }, []);

  const handleCommentClose = useCallback(() => setCommentArticleLink(null), []);

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
        onOpenComments={handleOpenComments}
      />

      {/* 댓글 시트 */}
      {showComments && (
        <CommentSheet
          visible={!!commentArticleLink}
          onClose={handleCommentClose}
          itemType="news"
          itemId={commentArticleLink ?? ''}
        />
      )}
    </SafeAreaView>
  );
}
