/**
 * AI 뉴스 피드 — 3-Section 레이아웃
 * Section 1: 하이라이트 (Hero + 2x2 그리드)
 * Section 2: 카테고리별 가로 스크롤 (모델/연구, 제품/도구, 산업/비즈니스)
 * Section 3: 소스별 가로 스크롤 (한국 소스)
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Linking,
  Share,
  StatusBar,
  Modal,
  Animated,
  Dimensions,
  StyleSheet,
  LayoutAnimation,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  RefreshCw, ThumbsUp, Share2, MessageCircle, X, Cpu, Newspaper, Bookmark, ChevronDown, Heart, ExternalLink, Clock,
} from 'lucide-react-native';
import { useNews } from '@/hooks/useNews';
import { useDrawer } from '@/context/DrawerContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useReactions } from '@/hooks/useReactions';
import { useArticleViews } from '@/hooks/useArticleViews';
import { useArticle } from '@/hooks/useArticle';
import { useBatchStats } from '@/hooks/useBatchStats';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useAuth } from '@/hooks/useAuth';
import { NewsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { CommentSheet } from '@/components/shared/CommentSheet';
import { ShowMoreButton } from '@/components/feed/ShowMoreButton';
import { useShareLink } from '@/hooks/useShareLink';
import type { Article } from '@/lib/types';
import { Colors } from '@/lib/colors';
import { FontFamily } from '@/lib/theme';
import type { Language } from '@/lib/translations';
import {
  SOURCE_COLORS, CATEGORY_COLORS,
  getSourceName, getCategoryName, formatDate,
  getLocalizedTitle, getLocalizedOneLine, getLocalizedSections,
  getLocalizedWhyImportant, getLocalizedBackground, getLocalizedGlossary,
} from '@/lib/articleHelpers';
import type { BatchStats } from '@/hooks/useBatchStats';
import { DailyBriefingCard } from '@/components/briefing/DailyBriefingCard';
import type { ScrollView as ScrollViewType } from 'react-native';

import { RelatedArticlesSection } from '@/components/shared/RelatedArticlesSection';
import { HighlightedText, termKey } from '@/components/shared/HighlightedText';
import { useGlossaryDB } from '@/hooks/useGlossaryDB';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useReadStats } from '@/hooks/useReadStats';


// ─── 빈 배열 상수 (이슈 #17: 인라인 리터럴 참조 안정성) ────────────────
const EMPTY_ARTICLES: Article[] = [];
const EMPTY_RECORD: Record<string, Article[]> = {};
const EMPTY_ORDER: string[] = [];

const DEFAULT_CATEGORY_ORDER = ['research', 'models_products', 'industry_business'];
const DEFAULT_SOURCE_ORDER = ['aitimes', 'geeknews', 'zdnet_ai_editor', 'yozm_ai'];

function getTitle(a: Article) {
  return a.display_title || a.title;
}

// ─── 제목 말줄임 (네이티브 numberOfLines + ellipsizeMode 사용) ──────────
const TitleText = React.memo(function TitleText({ children, style, numberOfLines = 2 }: { children: string; style: any; numberOfLines?: number }) {
  return (
    <Text style={style} numberOfLines={numberOfLines} ellipsizeMode="tail">
      {children}
    </Text>
  );
});

// ─── 좋아요+뷰 카운트 (정적 — 피드 카드에서 리스너 폭발 방지) ──────────
const ArticleStats = React.memo(function ArticleStats({ likes }: { likes?: number }) {
  const { colors } = useTheme();
  const { showLikeCounts } = useFeatureFlags();
  const l = likes ?? 0;
  if (!showLikeCounts || l < 3) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <ThumbsUp size={12} color={colors.textSecondary} />
        <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>{l}</Text>
      </View>
    </View>
  );
});

// ─── 소스 뱃지 ──────────────────────────────────────────────────────────
const SourceBadge = React.memo(function SourceBadge({ sourceKey, name }: { sourceKey?: string; name?: string }) {
  const { colors } = useTheme();
  if (!sourceKey) return null;
  const color = SOURCE_COLORS[sourceKey] || colors.textSecondary;
  return (
    <View style={{
      backgroundColor: color + '18',
      paddingHorizontal: 8, paddingVertical: 4,
      borderRadius: 8, alignSelf: 'flex-start',
    }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color }}>{name || sourceKey}</Text>
    </View>
  );
});

// ─── 점수 뱃지 ──────────────────────────────────────────────────────────
function ScoreBadge({ article }: { article: Article }) {
  const { colors } = useTheme();
  const { score, category } = article;
  if (score == null) return null;
  return (
    <Text style={{ fontSize: 11, color: colors.textPrimary, fontWeight: '700' }}>{score}</Text>
  );
}

// ─── Section 1: 하이라이트 ──────────────────────────────────────────────
const HIGHLIGHT_CARD_WIDTH = 280;
const HIGHLIGHT_CARD_HEIGHT = 260;

const HighlightScrollCard = React.memo(function HighlightScrollCard({
  article, onToggle, likes, views, comments,
}: {
  article: Article; onToggle?: () => void; likes?: number; views?: number; comments?: number;
}) {
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const handlePress = () => {
    if (onToggle) {
      onToggle();
    } else {
      if (article.link) Linking.openURL(article.link);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={getLocalizedTitle(article, lang)}
      accessibilityRole="button"
      style={({ pressed }) => ({
        width: HIGHLIGHT_CARD_WIDTH,
        maxWidth: HIGHLIGHT_CARD_WIDTH,
        height: HIGHLIGHT_CARD_HEIGHT,
        flexGrow: 0,
        flexShrink: 0,
        backgroundColor: colors.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {article.image_url ? (
        <View style={{ width: HIGHLIGHT_CARD_WIDTH, height: 150, backgroundColor: colors.border, borderRadius: 8, overflow: 'hidden' }}>
          <Image
            source={article.image_url}
            style={{ width: HIGHLIGHT_CARD_WIDTH, height: 150 }}
            contentFit="cover"
            transition={200}
            recyclingKey={article.link}
          />
        </View>
      ) : (
        <View style={{ width: HIGHLIGHT_CARD_WIDTH, height: 150, backgroundColor: colors.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Newspaper size={28} color={colors.textDim} />
        </View>
      )}
      <View style={{ padding: 14, flex: 1, justifyContent: 'space-between', width: HIGHLIGHT_CARD_WIDTH }}>
        <View style={{ width: HIGHLIGHT_CARD_WIDTH - 28 }}>
          <SourceBadge sourceKey={article.source_key} name={getSourceName(article.source_key || '', t)} />
          <TitleText
            style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, lineHeight: 22, marginTop: 6, fontFamily: FontFamily.serif }}
            numberOfLines={2}
          >
            {getLocalizedTitle(article, lang)}
          </TitleText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>{formatDate(article.published, lang, article.date_estimated)}</Text>
          </View>
          <ArticleStats likes={likes} />
        </View>
      </View>
    </Pressable>
  );
});

// H5: SummaryModalContent — hooks를 null 체크 이후에 호출
function SummaryModalContent({ article, onClose, onOpenComments }: { article: Article; onClose: () => void; onOpenComments: () => void }) {
  const { views, trackView } = useArticleViews(article.link);
  const { likes, liked, toggleLike } = useReactions('news', article.link);
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showComments } = useFeatureFlags();
  const { isBookmarked, toggleBookmark } = useBookmarks(user?.uid ?? null);
  const { shareArticleLink } = useShareLink();
  // 이슈 #18: viewTracked 중복 호출 수정 — link 기반 추적
  const viewTrackedLink = useRef('');
  const insets = useSafeAreaInsets();
  const [toastMsg, setToastMsg] = useState('');
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [usedTermKeys, setUsedTermKeys] = useState<Set<string>>(new Set());
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const { allTerms: glossaryDBTerms } = useGlossaryDB();
  // articles 컬렉션에서 related_ids 조회 (daily_news에는 없음)
  const { article: fullArticle } = useArticle(article.article_id ?? null);
  const relatedIds = fullArticle?.related_ids ?? [];
  // M12: Toast animation ref for cleanup
  const toastAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    // M12: Stop previous animation before starting new one
    if (toastAnimRef.current) toastAnimRef.current.stop();
    const anim = Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]);
    toastAnimRef.current = anim;
    anim.start();
  };

  // 이슈 #18: 모달 열릴 때 뷰수 자동 증가 (link 기반 1회)
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

  // M8: handleShare — 웹 공유 링크 (article_id 있으면 URL, 없으면 텍스트 폴백)
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

  // M7: Single useMemo replacing both IIFEs
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
        {/* M9: Background overlay accessibility */}
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
          accessibilityLabel={t('modal.close')}
          accessibilityRole="button"
        />

        {/* H3: accessibilityLabel on bottom sheet container */}
        <View style={{
          width: '100%',
          backgroundColor: colors.card,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '85%',
        }} accessibilityViewIsModal={true} accessibilityLabel={articleTitle}>
          {/* 이슈 #13: 드래그 핸들 */}
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
                recyclingKey={`modal-${article.link}`}
              />
            ) : null}

            {/* F-Minimal: 소스 뱃지 + 날짜 + 카테고리 + 북마크 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingHorizontal: 20, paddingTop: 20, gap: 6 }}>
              {(() => {
                const sk = article.source_key || article.source;
                const sc = SOURCE_COLORS[sk] || colors.textSecondary;
                return (
                  <View style={{ backgroundColor: `${sc}18`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary }}>{getSourceName(sk, t)}</Text>
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

            {/* F-Minimal: 제목 — 세리프 22px, weight 900 */}
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

            {/* F-Minimal: 콘텐츠 영역 */}
            {oneLine ? (
              <View style={{ paddingHorizontal: 20 }}>
                {/* 1. One Line — left-border + teal 배경 */}
                <View style={{ marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: colors.primaryLight }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', lineHeight: 26, color: colors.textPrimary }}>
                    {oneLine}
                  </Text>
                </View>

                {/* 2. Background — 본문 스타일 */}
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

                {/* 4. Why Important — 세리프 소제목 + 본문 */}
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

                {/* Glossary — D4: no border box, compact accordion */}
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
                  onPress={() => Linking.openURL(article.link)}
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

          {/* 고정 하단 액션 바 — 탭 바와 동일한 균등 배치 */}
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

          {/* M4: Colors.toastBg → colors.toastBg */}
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

// H5: SummaryModal returns null before hooks when article is null
// H7: React.memo wrapper
const SummaryModal = React.memo(function SummaryModal({ article, onClose, onOpenComments }: { article: Article | null; onClose: () => void; onOpenComments: () => void }) {
  if (!article) return null;
  return <SummaryModalContent article={article} onClose={onClose} onOpenComments={onOpenComments} />;
});

function HighlightSection({ highlights, onArticlePress, allStats }: { highlights: Article[]; onArticlePress: (article: Article) => void; allStats: Record<string, BatchStats> }) {
  const stats = allStats;
  const { t } = useLanguage();
  const { colors } = useTheme();

  if (!highlights || highlights.length === 0) return null;

  return (
    <View style={{ paddingTop: 12, paddingBottom: 6, backgroundColor: colors.primaryLight }}>
      {/* 섹션 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, fontFamily: FontFamily.serif }}>{t('news.highlight_title')}</Text>
        <Text style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 8 }}>Top {highlights.length}</Text>
      </View>

      {/* 가로 스크롤 하이라이트 카드 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4, gap: 16 }}
      >
        {highlights.map((a, i) => (
          <HighlightScrollCard
            key={`hl-${i}-${a.link}`}
            article={a}
            onToggle={() => onArticlePress(a)}
            likes={stats[a.link]?.likes}
            views={stats[a.link]?.views}
            comments={stats[a.link]?.comments}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── 가로 스크롤 카드 (통일 디자인) ──────────────────────────────────────
const CARD_WIDTH = 240;
const HCARD_HEIGHT = 260;

const HScrollCard = React.memo(function HScrollCard({
  article, onToggle, likes, views, comments,
}: {
  article: Article; onToggle?: () => void; likes?: number; views?: number; comments?: number;
}) {
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const handlePress = () => {
    if (onToggle) {
      onToggle();
    } else {
      if (article.link) Linking.openURL(article.link);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={getLocalizedTitle(article, lang)}
      accessibilityRole="button"
      style={({ pressed }) => ({
        width: CARD_WIDTH,
        maxWidth: CARD_WIDTH,
        height: HCARD_HEIGHT,
        flexGrow: 0,
        flexShrink: 0,
        backgroundColor: colors.card,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {article.image_url ? (
        <View style={{ width: CARD_WIDTH, height: 140, backgroundColor: colors.border, borderRadius: 8, overflow: 'hidden' }}>
          <Image
            source={article.image_url}
            style={{ width: CARD_WIDTH, height: 140 }}
            contentFit="cover"
            transition={200}
            recyclingKey={article.link}
          />
        </View>
      ) : (
        <View style={{ width: CARD_WIDTH, height: 140, backgroundColor: colors.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Newspaper size={28} color={colors.textDim} />
        </View>
      )}
      <View style={{ padding: 14, flex: 1, width: CARD_WIDTH }}>
        <View style={{ width: CARD_WIDTH - 28 }}>
          <TitleText
            style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, lineHeight: 18, marginTop: 0, fontFamily: FontFamily.serif }}
            numberOfLines={2}
          >
            {getLocalizedTitle(article, lang)}
          </TitleText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>{formatDate(article.published, lang, article.date_estimated)}</Text>
          </View>
          <ArticleStats likes={likes} />
        </View>
      </View>
    </Pressable>
  );
});

// ─── Section 2: 카테고리 탭 + 세로 리스트 ──────────────────────────────
function CategoryTabSection({
  categorizedArticles, categoryOrder, onArticlePress, allStats,
  scrollViewRef,
}: {
  categorizedArticles: Record<string, Article[]>; categoryOrder: string[]; onArticlePress: (article: Article) => void; allStats: Record<string, BatchStats>;
  scrollViewRef?: React.RefObject<ScrollViewType>;
}) {
  const [activeTab, setActiveTab] = useState(categoryOrder[0] || 'research');
  // 0=5개, 1=10개, 2=15개, 3=20개(전체)
  const BATCH_SIZE = 5;
  const [expandLevel, setExpandLevel] = useState(0);
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const sectionY = useRef(0);

  const articles = categorizedArticles[activeTab] || [];
  const stats = allStats;
  const maxLevel = Math.max(0, Math.ceil(articles.length / BATCH_SIZE) - 1);

  const visible = useMemo(() => {
    const count = Math.min((expandLevel + 1) * BATCH_SIZE, articles.length);
    return articles.slice(0, count);
  }, [articles, expandLevel]);

  const isFullyExpanded = expandLevel >= maxLevel;
  const shownCount = visible.length;
  const totalCount = articles.length;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setExpandLevel(0);
  };

  return (
    <View style={{ marginTop: 16, marginBottom: 24 }} onLayout={(e) => { sectionY.current = e.nativeEvent.layout.y; }}>
      {/* 카테고리 탭 — Equal-Width Segmented Bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            borderWidth: 2,
            borderColor: colors.textPrimary,
            borderRadius: 22,
            overflow: 'hidden',
          }}
          accessibilityRole="tablist"
        >
          {categoryOrder.map((catKey, idx) => {
            const isActive = catKey === activeTab;
            const catName = getCategoryName(catKey, t);
            const isLast = idx === categoryOrder.length - 1;
            return (
              <Pressable
                key={catKey}
                onPress={() => handleTabChange(catKey)}
                accessibilityLabel={catName}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={{
                  flex: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  minHeight: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: isActive ? colors.primaryLight : colors.card,
                  borderRightWidth: isLast ? 0 : 2,
                  borderRightColor: isLast ? 'transparent' : colors.textPrimary,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: isActive ? colors.textPrimary : colors.textSecondary,
                  }}
                >
                  {catName}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 세로 기사 리스트 */}
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        {visible.map((a, i) => (
            <Pressable
              key={`cat-${activeTab}-${i}-${a.link}`}
              onPress={() => onArticlePress(a)}
              accessibilityLabel={getLocalizedTitle(a, lang)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                height: 120,
                backgroundColor: colors.card,
                borderRadius: 12,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', flex: 1 }}>
                {a.image_url ? (
                  <View style={{ width: 118, height: 118, backgroundColor: colors.border, borderRadius: 8, overflow: 'hidden' }}>
                    <Image
                      source={a.image_url}
                      style={{ width: 118, height: 118 }}
                      contentFit="cover"
                      transition={200}
                      recyclingKey={a.link}
                    />
                  </View>
                ) : (
                  <View style={{ width: 118, height: 118, backgroundColor: colors.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                    <Newspaper size={24} color={colors.textDim} />
                  </View>
                )}
                <View style={{ flex: 1, padding: 14, justifyContent: 'space-between' }}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <SourceBadge sourceKey={a.source_key} name={getSourceName(a.source_key || '', t)} />
                    </View>
                    <TitleText
                      style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, lineHeight: 20, marginTop: 6, fontFamily: FontFamily.serif }}
                      numberOfLines={2}
                    >
                      {getLocalizedTitle(a, lang)}
                    </TitleText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 11, color: colors.textSecondary }}>{formatDate(a.published, lang, a.date_estimated)}</Text>
                    </View>
                    <ArticleStats likes={stats[a.link]?.likes} />
                  </View>
                </View>
              </View>
            </Pressable>
        ))}
      </View>

      {totalCount > BATCH_SIZE && (
        <ShowMoreButton
          shownCount={shownCount}
          totalCount={totalCount}
          isExpanded={isFullyExpanded}
          onPress={() => {
            if (isFullyExpanded) {
              setExpandLevel(0);
              requestAnimationFrame(() => {
                scrollViewRef?.current?.scrollTo({ y: sectionY.current, animated: true });
              });
            } else {
              setExpandLevel(prev => Math.min(prev + 1, maxLevel));
            }
          }}
        />
      )}
    </View>
  );
}

// ─── Section 3: 소스별 가로 스크롤 (한국 소스) ──────────────────────────
const SourceHScrollSection = React.memo(function SourceHScrollSection({
  sourceKey, articles, onArticlePress, allStats,
}: {
  sourceKey: string; articles: Article[]; onArticlePress: (article: Article) => void; allStats: Record<string, BatchStats>;
}) {
  const [showMore, setShowMore] = useState(false);
  const stats = allStats;
  const { lang, t } = useLanguage();
  const { colors } = useTheme();

  if (!articles || articles.length === 0) return null;

  const name = getSourceName(sourceKey, t);
  const capped = useMemo(() => articles.slice(0, 10), [articles]);
  const first5 = useMemo(() => capped.slice(0, 5), [capped]);
  const more5 = useMemo(() => capped.slice(5), [capped]);
  const visible = useMemo(() => showMore ? capped : first5, [showMore, capped, first5]);

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, flex: 1, fontFamily: FontFamily.serif }}>
          {name}
        </Text>
        <Text style={{ fontSize: 11, color: colors.textSecondary }}>{capped.length}{t('news.articles_suffix')}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4, gap: 16, alignItems: 'center' }}
      >
        {visible.map((a, i) => (
          <HScrollCard
            key={`${sourceKey}-${i}-${a.link}`}
            article={a}
            onToggle={() => onArticlePress(a)}
            likes={stats[a.link]?.likes}
            views={stats[a.link]?.views}
            comments={stats[a.link]?.comments}
          />
        ))}

        {more5.length > 0 && !showMore && (
          <Pressable
            onPress={() => setShowMore(true)}
            accessibilityRole="button"
            accessibilityLabel={`${name} ${t('news.show_more')} ${more5.length}`}
            style={({ pressed }) => ({
              width: 80,
              alignSelf: 'center',
              minHeight: 44,
              marginRight: 12,
              backgroundColor: colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' }}>
              +{more5.length} {t('news.show_more')}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
});

// ─── GeekNews 세로 리스트 ────────────────────────────────────────────────
const GeekNewsSection = React.memo(function GeekNewsSection({ articles, onArticlePress, allStats }: { articles: Article[]; onArticlePress: (article: Article) => void; allStats: Record<string, BatchStats> }) {
  const [showMore, setShowMore] = useState(false);
  const stats = allStats;
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  if (!articles || articles.length === 0) return null;

  const capped = React.useMemo(() => articles.slice(0, 10), [articles]);
  const visible = React.useMemo(
    () => capped.slice(0, showMore ? 10 : 5),
    [showMore, capped],
  );
  const hasMore = !showMore && capped.length > 5;
  const moreCount = capped.length - 5;
  const color = SOURCE_COLORS['geeknews'] || colors.textSecondary;
  const name = getSourceName('geeknews', t);

  return (
    <View style={{ marginBottom: 24 }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}
        accessibilityRole="header"
      >
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, flex: 1, fontFamily: FontFamily.serif }}>{name}</Text>
        <Text style={{ fontSize: 11, color: colors.textSecondary }}>{capped.length}{t('news.articles_suffix')}</Text>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        {visible.map((a, i) => (
          <Pressable
            key={`geeknews-${i}-${a.link}`}
            onPress={() => onArticlePress(a)}
            accessibilityLabel={getLocalizedTitle(a, lang)}
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
              justifyContent: 'space-between',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <TitleText
                style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, lineHeight: 20, flex: 1, marginRight: 8, fontFamily: FontFamily.serif }}
                numberOfLines={2}
              >
                {getLocalizedTitle(a, lang)}
              </TitleText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>{formatDate(a.published, lang, a.date_estimated)}</Text>
              <ArticleStats likes={stats[a.link]?.likes} />
            </View>
          </Pressable>
        ))}
      </View>

      {hasMore && (
        <ShowMoreButton
          moreCount={moreCount}
          isExpanded={false}
          onPress={() => setShowMore(true)}
          sectionName={name}
        />
      )}
      {showMore && capped.length > 5 && (
        <ShowMoreButton
          isExpanded={true}
          onPress={() => setShowMore(false)}
          sectionName={name}
        />
      )}
    </View>
  );
});

// ─── 정렬: KST 날짜(일) 최신순 → 점수순 → 시간 최신순 ───
function sortByDateThenScore(articles: Article[]) {
  const KST_OFFSET = 9 * 60 * 60 * 1000;
  const toKSTDay = (pub: string) => Math.floor((new Date(pub || 0).getTime() + KST_OFFSET) / 86400000);
  const toTime = (pub: string) => new Date(pub || 0).getTime();
  return [...articles].sort((a, b) => {
    const dayA = toKSTDay(a.published);
    const dayB = toKSTDay(b.published);
    if (dayA !== dayB) return dayB - dayA;
    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return toTime(b.published) - toTime(a.published);
  });
}

// ─── Timestamp 처리 (이슈 #26) ──────────────────────────────────────────
const getUpdatedTime = (ua: any) => {
  if (!ua) return null;
  if (typeof ua === 'string') return new Date(ua);
  if (ua.toDate) return ua.toDate();
  if (ua.seconds !== undefined) return new Date(ua.seconds * 1000);
  return new Date(ua);
};

// ─── 메인 화면 ──────────────────────────────────────────────────────────
export default function NewsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [modalArticle, setModalArticle] = useState<Article | null>(null);
  const [commentArticleLink, setCommentArticleLink] = useState<string | null>(null);

  const mainScrollRef = useRef<ScrollViewType>(null);
  const { openDrawer, setActiveTab } = useDrawer();
  const { lang, t } = useLanguage();
  const { colors, isDark } = useTheme();
  const { newsData, loading, error, refresh } = useNews();
  const { showComments } = useFeatureFlags();
  const { user } = useAuth();
  const { recordRead } = useReadStats(user?.uid ?? null);

  const handleArticlePress = useCallback((article: Article) => {
    setModalArticle(article);
    recordRead(article.link);
  }, [recordRead]);

  const handleOpenComments = useCallback(() => {
    if (modalArticle) {
      setCommentArticleLink(modalArticle.link);
    }
  }, [modalArticle]);

  // M10: Extract onClose inline functions to useCallback
  const handleModalClose = useCallback(() => setModalArticle(null), []);
  const handleCommentClose = useCallback(() => setCommentArticleLink(null), []);

  useFocusEffect(
    useCallback(() => {
      setActiveTab('news');
    }, [setActiveTab])
  );


  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // ─── 새 구조 (3-Section) — 이슈 #17: 빈 배열 상수 참조 ───
  const rawHighlights = newsData?.highlights ?? EMPTY_ARTICLES;
  const highlights = React.useMemo(() => sortByDateThenScore(rawHighlights), [rawHighlights]);
  const rawCategorized = newsData?.categorized_articles ?? EMPTY_RECORD;
  // 하이라이트에 있는 기사를 카테고리에서 제외 (중복 표시 방지)
  const highlightLinks = React.useMemo(() => new Set(rawHighlights.map(a => a.link)), [rawHighlights]);
  const categorizedArticles = React.useMemo(() => {
    const sorted: Record<string, Article[]> = {};
    for (const [cat, articles] of Object.entries(rawCategorized)) {
      sorted[cat] = sortByDateThenScore(articles.filter(a => !highlightLinks.has(a.link)));
    }
    return sorted;
  }, [rawCategorized, highlightLinks]);
  const categoryOrder = newsData?.category_order ?? DEFAULT_CATEGORY_ORDER;
  const sourceArticles = newsData?.source_articles ?? EMPTY_RECORD;
  const sourceOrder = newsData?.source_order ?? DEFAULT_SOURCE_ORDER;


  // ─── 레거시 폴백 (기존 articles 배열 데이터) ───
  const legacyGrouped = React.useMemo(() => {
    const grouped: Record<string, Article[]> = {};
    if (highlights.length === 0 && newsData?.articles) {
      for (const a of newsData.articles) {
        const key = a.source_key || 'unknown';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(a);
      }
    }
    return grouped;
  }, [highlights.length, newsData?.articles]);
  const isLegacy = highlights.length === 0 && Object.keys(legacyGrouped).length > 0;
  const legacySourceOrder = newsData?.source_order ?? [
    'wired_ai', 'the_verge_ai', 'techcrunch_ai', 'mit_tech_review',
    'deepmind_blog', 'nvidia_blog', 'huggingface_blog',
    'aitimes', 'geeknews',
  ];

  // ─── 모든 article link를 모아 1회만 useBatchStats 호출 ───
  const allArticleLinks = React.useMemo(() => {
    const links = new Set<string>();
    for (const a of highlights) { if (a.link) links.add(a.link); }
    for (const articles of Object.values(categorizedArticles)) {
      for (const a of articles) { if (a.link) links.add(a.link); }
    }
    for (const articles of Object.values(sourceArticles)) {
      for (const a of articles) { if (a.link) links.add(a.link); }
    }
    if (newsData?.articles) {
      for (const a of newsData.articles) { if (a.link) links.add(a.link); }
    }
    return Array.from(links);
  }, [highlights, categorizedArticles, sourceArticles, newsData?.articles]);

  const allStats = useBatchStats(allArticleLinks);

  const totalArticles = newsData?.total_count
    ?? ((highlights.length
      + Object.values(categorizedArticles).reduce((s, a) => s + a.length, 0)
      + Object.values(sourceArticles).reduce((s, a) => s + a.length, 0))
    || (newsData?.articles?.length ?? 0));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      {/* ─── 헤더 — 이슈 #24: paddingTop 통일 ─── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, backgroundColor: colors.bg,
      }}>
        <Image
          source={require('@/assets/ailon_logo.png')}
          style={{ width: 36, height: 36, borderRadius: 8, marginRight: 10 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textPrimary, fontFamily: FontFamily.serifItalic }}>{t('news.header')}</Text>
          {totalArticles > 0 && (
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {(() => {
                const updatedTime = getUpdatedTime(newsData?.updated_at);
                if (updatedTime) {
                  return `${updatedTime.toLocaleTimeString(lang === 'en' ? 'en-US' : 'ko-KR', { hour: '2-digit', minute: '2-digit' })} ${t('news.updated')}`;
                }
                return `${totalArticles}${t('news.articles_count')}`;
              })()}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.textSecondary} />}
      >
        {loading ? (
          <View style={{ paddingHorizontal: 16, gap: 12, paddingTop: 8 }}>
            <NewsCardSkeleton />
            <NewsCardSkeleton />
            <NewsCardSkeleton />
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 }}>
            {/* 이슈 #2: 에러 색상 토큰화 */}
            <RefreshCw size={36} color={colors.textDim} style={{ marginBottom: 16 }} />
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16, marginBottom: 8 }}>{t(error)}</Text>
            <Pressable onPress={refresh} style={{ backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>{t('news.retry')}</Text>
            </Pressable>
          </View>
        ) : totalArticles === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
            <Cpu size={36} color={colors.textDim} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 }}>{t('news.no_news')}</Text>
          </View>
        ) : isLegacy ? (
          <>
            {/* 레거시 폴백: 기존 소스별 가로 스크롤 */}
            {legacySourceOrder.map(key => (
              <SourceHScrollSection
                key={key}
                sourceKey={key}
                articles={legacyGrouped[key] || []}
                onArticlePress={handleArticlePress}
                allStats={allStats}
              />
            ))}
          </>
        ) : (
          <>
            {/* Daily Briefing */}
            <DailyBriefingCard scrollViewRef={mainScrollRef} />

            {/* Section 1: 하이라이트 */}
            <HighlightSection highlights={highlights} onArticlePress={handleArticlePress} allStats={allStats} />

            {/* Section 2: 카테고리 탭 + 세로 리스트 */}
            <CategoryTabSection
              categorizedArticles={categorizedArticles}
              categoryOrder={categoryOrder}
              onArticlePress={handleArticlePress}
              allStats={allStats}
              scrollViewRef={mainScrollRef}
            />

            {/* 구분선: 카테고리 → 소스별 */}
            {sourceOrder.some(key => (sourceArticles[key]?.length ?? 0) > 0) && (
              <View style={{ paddingHorizontal: 16, marginTop: 24, marginBottom: 24 }}>
                <View style={{ height: 1, backgroundColor: colors.border }} />
              </View>
            )}

            {/* Section 3: 소스별 뉴스 (한국 소스, GeekNews 제외) */}
            {sourceOrder.filter(key => key !== 'geeknews').map(key => (
              <SourceHScrollSection
                key={key}
                sourceKey={key}
                articles={sourceArticles[key] || []}
                onArticlePress={handleArticlePress}
                allStats={allStats}
              />
            ))}

            {/* Section 4: GeekNews 세로 리스트 */}
            <GeekNewsSection articles={sourceArticles['geeknews'] || []} onArticlePress={handleArticlePress} allStats={allStats} />


          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* 요약 모달 */}
      <SummaryModal article={modalArticle} onClose={handleModalClose} onOpenComments={handleOpenComments} />


      {/* 댓글 시트 (모달과 같은 레벨) */}
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
