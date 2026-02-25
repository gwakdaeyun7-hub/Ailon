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
  StatusBar,
  Modal,
  Share,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Bell, RefreshCw, ThumbsUp, Eye, Share2, ExternalLink, MessageCircle, X, Cpu, Newspaper, Bookmark, ChevronDown,
} from 'lucide-react-native';
import { useNews } from '@/hooks/useNews';
import { useDrawer } from '@/context/DrawerContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useReactions } from '@/hooks/useReactions';
import { useArticleViews } from '@/hooks/useArticleViews';
import { useBatchStats } from '@/hooks/useBatchStats';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useAuth } from '@/hooks/useAuth';
import { NewsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { CommentSheet } from '@/components/shared/CommentSheet';
import type { Article } from '@/lib/types';
import { Colors } from '@/lib/colors';
import type { Language } from '@/lib/translations';
import type { BatchStats } from '@/hooks/useBatchStats';

// expo-notifications (optional dependency) — 이슈 #25: any 타입 수정
let Notifications: typeof import('expo-notifications') | null = null;
try { Notifications = require('expo-notifications'); } catch {}

// ─── 빈 배열 상수 (이슈 #17: 인라인 리터럴 참조 안정성) ────────────────
const EMPTY_ARTICLES: Article[] = [];
const EMPTY_RECORD: Record<string, Article[]> = {};
const EMPTY_ORDER: string[] = [];

const SOURCE_COLORS: Record<string, string> = {
  wired_ai: '#000000',
  the_verge_ai: '#E1127A',
  techcrunch_ai: '#0A9E01',
  mit_tech_review: '#D32F2F',
  venturebeat: '#77216F',
  deepmind_blog: '#1D4ED8',
  nvidia_blog: '#76B900',
  huggingface_blog: '#FFD21E',
  aitimes: '#E53935',
  geeknews: '#FF6B35',
  zdnet_ai_editor: '#D32F2F',
  yozm_ai: '#6366F1',
  the_decoder: '#1A1A2E',
  marktechpost: '#0D47A1',
  arstechnica_ai: '#FF4611',
  the_rundown_ai: '#6C5CE7',
};

const SOURCE_NAMES: Record<string, string> = {
  wired_ai: 'Wired AI',
  the_verge_ai: 'The Verge AI',
  techcrunch_ai: 'TechCrunch AI',
  mit_tech_review: 'MIT Tech Review',
  venturebeat: 'VentureBeat',
  deepmind_blog: 'Google DeepMind',
  nvidia_blog: 'NVIDIA AI',
  huggingface_blog: 'Hugging Face',
  geeknews: 'GeekNews',
  the_decoder: 'The Decoder',
  marktechpost: 'MarkTechPost',
  arstechnica_ai: 'Ars Technica AI',
  the_rundown_ai: 'The Rundown AI',
};

const TRANSLATABLE_SOURCES = ['aitimes', 'zdnet_ai_editor', 'yozm_ai'];

function getSourceName(key: string, t?: (k: string) => string): string {
  if (TRANSLATABLE_SOURCES.includes(key) && t) return t(`source.${key}`);
  return SOURCE_NAMES[key] || key;
}

// CATEGORY_NAMES는 t() 기반으로 대체 — getCategoryName() 헬퍼 사용

const CATEGORY_COLORS: Record<string, string> = {
  research: '#7C3AED',
  models_products: '#0891B2',
  industry_business: '#D97706',
};

const DEFAULT_CATEGORY_ORDER = ['research', 'models_products', 'industry_business'];
const DEFAULT_SOURCE_ORDER = ['aitimes', 'geeknews', 'zdnet_ai_editor', 'yozm_ai'];

// ─── 헬퍼 ───────────────────────────────────────────────────────────────
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(str?: string, lang?: string): string {
  if (!str) return '';
  try {
    // ZDNet 등 "2026.02.19 PM 08:20" 형식 처리
    const ymdMatch = str.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
    if (ymdMatch) {
      if (lang === 'en') {
        const mi = parseInt(ymdMatch[2], 10) - 1;
        return `${EN_MONTHS[mi]} ${parseInt(ymdMatch[3], 10)}, ${ymdMatch[1]}`;
      }
      return `${ymdMatch[1]}/${ymdMatch[2]}/${ymdMatch[3]}`;
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    if (lang === 'en') {
      return `${EN_MONTHS[m]} ${day}, ${y}`;
    }
    return `${y}/${String(m + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
  } catch { return ''; }
}

function getTitle(a: Article) {
  return a.display_title || a.title;
}

function getLocalizedTitle(a: Article, lang: Language) {
  if (lang === 'en' && a.display_title_en) return a.display_title_en;
  return a.display_title || a.title;
}

function getLocalizedOneLine(a: Article, lang: Language) {
  if (lang === 'en' && a.one_line_en) return a.one_line_en;
  return a.one_line || '';
}

function getLocalizedKeyPoints(a: Article, lang: Language): string[] {
  if (lang === 'en' && a.key_points_en && a.key_points_en.length > 0) return a.key_points_en;
  return a.key_points || [];
}

function getLocalizedWhyImportant(a: Article, lang: Language) {
  if (lang === 'en' && a.why_important_en) return a.why_important_en;
  return a.why_important || '';
}

function getLocalizedBackground(a: Article, lang: Language) {
  if (lang === 'en' && a.background_en) return a.background_en;
  return a.background || '';
}

function getLocalizedGlossary(a: Article, lang: Language): { term: string; desc: string }[] {
  if (lang === 'en' && a.glossary_en && a.glossary_en.length > 0) return a.glossary_en;
  return a.glossary || [];
}

function getCategoryName(catKey: string, t: (key: string) => string) {
  return t(`cat.${catKey}`);
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
const ArticleStats = React.memo(function ArticleStats({ likes, views, comments }: { likes?: number; views?: number; comments?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <ThumbsUp size={11} color={colors.textSecondary} />
        <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>{likes ?? 0}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <MessageCircle size={11} color={colors.textSecondary} />
        <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>{comments ?? 0}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <Eye size={11} color={colors.textSecondary} />
        <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>{views ?? 0}</Text>
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
      paddingHorizontal: 6, paddingVertical: 2,
      borderRadius: 6, alignSelf: 'flex-start',
    }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color }}>{name || sourceKey}</Text>
    </View>
  );
});

// ─── 점수 뱃지 (이슈 #10: 색상 토큰화) ──────────────────────────────────
function ScoreBadge({ article }: { article: Article }) {
  const { colors } = useTheme();
  const { score, score_rigor: rig, score_novelty: nov, score_potential: pot,
    score_utility: uti, score_impact: imp, score_access: acc,
    score_market: mag, score_signal: sig, score_breadth: brd } = article;
  if (!score) return null;
  const isBiz = !!(mag || sig || brd);
  const isResearch = !!(rig || nov || pot);
  const isMP = !!(uti || imp || acc);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Text style={{ fontSize: 11, color: isBiz ? colors.scoreBiz : isResearch ? colors.scoreResearch : colors.scoreProduct, fontWeight: '700' }}>{score}</Text>
      {isBiz ? (
        <Text style={{ fontSize: 11, color: colors.scoreBiz }}>M{mag} S{sig} B{brd}</Text>
      ) : isResearch ? (
        <Text style={{ fontSize: 11, color: colors.scoreResearch }}>R{rig} N{nov} P{pot}</Text>
      ) : isMP ? (
        <Text style={{ fontSize: 11, color: colors.scoreProduct }}>U{uti} I{imp} A{acc}</Text>
      ) : null}
    </View>
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
        borderRadius: 14,
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
          <Newspaper size={28} color={colors.textLight} />
        </View>
      )}
      <View style={{ padding: 14, flex: 1, justifyContent: 'space-between', width: HIGHLIGHT_CARD_WIDTH }}>
        <View style={{ width: HIGHLIGHT_CARD_WIDTH - 28 }}>
          <SourceBadge sourceKey={article.source_key} name={getSourceName(article.source_key || '', t)} />
          <TitleText
            style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary, lineHeight: 21, marginTop: 6 }}
            numberOfLines={2}
          >
            {getLocalizedTitle(article, lang)}
          </TitleText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>{formatDate(article.published, lang)}</Text>
            <ScoreBadge article={article} />
          </View>
          <ArticleStats likes={likes} views={views} comments={comments} />
        </View>
      </View>
    </Pressable>
  );
});

function SummaryModal({ article, onClose, onOpenComments }: { article: Article | null; onClose: () => void; onOpenComments: () => void }) {
  const { views, trackView } = useArticleViews(article?.link ?? '');
  const { likes, liked, toggleLike } = useReactions('news', article?.link ?? '');
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks(user?.uid ?? null);
  // 이슈 #18: viewTracked 중복 호출 수정 — link 기반 추적
  const viewTrackedLink = useRef('');
  const insets = useSafeAreaInsets();
  const [toastMsg, setToastMsg] = useState('');
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  // 이슈 #18: 모달 열릴 때 뷰수 자동 증가 (link 기반 1회)
  useEffect(() => {
    if (article && article.link !== viewTrackedLink.current) {
      viewTrackedLink.current = article.link;
      trackView();
      setGlossaryOpen(false);
    }
  }, [article, trackView]);

  const bookmarked = useMemo(() => article ? isBookmarked('news', article.link) : false, [isBookmarked, article]);
  const handleToggleBookmark = useCallback(() => {
    if (!article) return;
    toggleBookmark('news', article.link, {
      title: getLocalizedTitle(article, lang),
      link: article.link,
      ...(article.category ? { category: article.category } : {}),
    });
  }, [toggleBookmark, article, lang]);

  if (!article) return null;

  const sourceName = getSourceName(article.source_key || '', t);
  const sourceColor = SOURCE_COLORS[article.source_key || ''] || colors.textSecondary;

  const handleOpenOriginal = () => {
    if (article.link) Linking.openURL(article.link);
  };

  const handleLike = async () => {
    const result = await toggleLike();
    if (result === 'no_user') {
      showToast(t('auth.login_required_toast'));
    }
  };

  const handleShare = async () => {
    try {
      const oneLine = getLocalizedOneLine(article, lang);
      const keyPoints = getLocalizedKeyPoints(article, lang);
      const whyImportant = getLocalizedWhyImportant(article, lang);
      let body = '';
      if (oneLine) {
        body += `${t('share.one_line_label')}\n${oneLine}`;
        if (keyPoints.length > 0) {
          body += `\n\n${t('share.key_points_label')}\n${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
        }
        if (whyImportant) {
          body += `\n\n${t('share.why_important_label')}\n${whyImportant}`;
        }
      } else if (article.summary) {
        body = article.summary;
      }
      await Share.share({
        message: `${getLocalizedTitle(article, lang)}\n\n${body}\n\n${t('share.footer')}`,
      });
    } catch {}
  };

  return (
    <Modal
      visible={!!article}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        {/* 배경 탭으로 닫기 */}
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        {/* 바텀시트 — 이슈 #4: accessibilityViewIsModal */}
        <View style={{
          width: '100%',
          backgroundColor: colors.card,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '85%',
        }} accessibilityViewIsModal={true}>
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
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator
            bounces
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* 썸네일 */}
            {article.image_url ? (
              <View style={{ width: '100%', height: 200, backgroundColor: colors.border }}>
                <Image
                  source={article.image_url}
                  style={{ width: '100%', height: 200 }}
                  contentFit="cover"
                  transition={200}
                  recyclingKey={article.link}
                />
              </View>
            ) : null}

            {/* 소스 뱃지 + 날짜 + 조회수 + 북마크 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: article.image_url ? 16 : 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={{
                  backgroundColor: sourceColor + '18',
                  paddingHorizontal: 8, paddingVertical: 3,
                  borderRadius: 4,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: sourceColor }}>{sourceName}</Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{formatDate(article.published, lang)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Eye size={11} color={colors.textSecondary} />
                  <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '600' }}>{views}</Text>
                </View>
              </View>
              <Pressable
                onPress={handleToggleBookmark}
                accessibilityLabel={bookmarked ? t('bookmark.remove') : t('bookmark.add')}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: bookmarked ? colors.bookmarkActiveColor + '14' : colors.surface,
                  borderWidth: 1, borderColor: bookmarked ? colors.bookmarkActiveColor + '30' : colors.border,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Bookmark
                  size={16}
                  color={bookmarked ? colors.bookmarkActiveColor : colors.textSecondary}
                  fill="none"
                  strokeWidth={2}
                />
              </Pressable>
            </View>

            {/* 제목 */}
            <Text style={{
              fontSize: 18, fontWeight: '800', color: colors.textPrimary, lineHeight: 28,
              marginTop: 14, marginBottom: 14,
              paddingHorizontal: 20,
            }}>
              {getLocalizedTitle(article, lang)}
            </Text>

            {/* 구분선 */}
            <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 12, marginHorizontal: 20 }} />

            {/* AI 요약 메타: 읽기 시간 + 생성 시점 */}
            {(() => {
              const summaryText = [
                getLocalizedOneLine(article, lang),
                ...getLocalizedKeyPoints(article, lang),
                getLocalizedWhyImportant(article, lang),
              ].join('');
              const readMin = Math.max(1, Math.round(summaryText.length / 500));
              const pubDate = article.published ? formatDate(article.published, lang) : '';
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 14 }}>
                  <Text style={{ fontSize: 11, color: colors.textLight }}>
                    {lang === 'en' ? `${readMin} min read` : `${readMin}분 분량`}
                  </Text>
                  {pubDate ? (
                    <>
                      <Text style={{ fontSize: 11, color: colors.textLight }}>·</Text>
                      <Text style={{ fontSize: 11, color: colors.textLight }}>
                        {lang === 'en' ? `AI summary · ${pubDate}` : `AI 요약 · ${pubDate}`}
                      </Text>
                    </>
                  ) : null}
                </View>
              );
            })()}

            {/* 3-파트 요약 + 배경/태그/용어 — 이슈 #1: 하드코딩 색상 수정 */}
            {(() => {
              const oneLine = getLocalizedOneLine(article, lang);
              const keyPoints = getLocalizedKeyPoints(article, lang);
              const whyImportant = getLocalizedWhyImportant(article, lang);
              const background = getLocalizedBackground(article, lang);
              const tags = article.tags;
              const glossary = getLocalizedGlossary(article, lang);
              if (oneLine) {
                return (
                  <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                    {/* 배경 맥락 (Task 5) */}
                    {background ? (
                      <View style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>
                          {lang === 'en' ? 'Background' : '배경'}
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.summaryBody, lineHeight: 22 }}>
                          {background}
                        </Text>
                      </View>
                    ) : null}

                    {/* 핵심 한줄 (Task 3: 인디케이터 바 + 폰트 조정) */}
                    <View style={{ backgroundColor: colors.highlightBg, borderRadius: 10, padding: 14, marginBottom: 16, flexDirection: 'row' }}>
                      <View style={{ width: 3, backgroundColor: colors.summaryIndigo, borderRadius: 2, marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.summaryIndigo, marginBottom: 6 }}>{t('modal.one_line')}</Text>
                        <Text style={{ fontSize: 16, color: colors.textPrimary, lineHeight: 28, fontWeight: '700' }}>
                          {oneLine}
                        </Text>
                      </View>
                    </View>

                    {/* 주요 포인트 (Task 4: 원형 뱃지 + 간격 증가) */}
                    {keyPoints.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.summaryTeal, marginBottom: 8 }}>{t('modal.key_points')}</Text>
                        {keyPoints.map((point, idx) => (
                          <View key={idx} style={{ flexDirection: 'row', marginBottom: 16, paddingRight: 4, alignItems: 'flex-start' }}>
                            <View style={{
                              width: 22, height: 22, borderRadius: 11,
                              backgroundColor: colors.summaryTeal,
                              alignItems: 'center', justifyContent: 'center',
                              marginRight: 10, marginTop: 1,
                            }}>
                              <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '700' }}>{idx + 1}</Text>
                            </View>
                            <Text style={{ fontSize: 14, color: colors.summaryBody, lineHeight: 22, flex: 1 }}>{point}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* 왜 중요해요? */}
                    {whyImportant ? (
                      <View style={{ backgroundColor: colors.summaryWarnBg, borderRadius: 10, padding: 14, marginBottom: tags && tags.length > 0 ? 16 : 0 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.summaryWarnText, marginBottom: 4 }}>{t('modal.why_important')}</Text>
                        <Text style={{ fontSize: 14, color: colors.summaryBody, lineHeight: 24 }}>
                          {whyImportant}
                        </Text>
                      </View>
                    ) : null}

                    {/* 키워드 태그 (Task 6) */}
                    {tags && tags.length > 0 ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: glossary.length > 0 ? 16 : 0 }}>
                        {tags.map((tag, idx) => (
                          <View key={idx} style={{
                            backgroundColor: colors.surface,
                            paddingHorizontal: 10, paddingVertical: 5,
                            borderRadius: 12,
                          }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {/* 용어 해설 (Task 7) */}
                    {glossary.length > 0 ? (
                      <View style={{ borderRadius: 10, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                        <Pressable
                          onPress={() => setGlossaryOpen(!glossaryOpen)}
                          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
                            {lang === 'en' ? 'Glossary' : '용어 해설'}
                          </Text>
                          <View style={{ transform: [{ rotate: glossaryOpen ? '180deg' : '0deg' }] }}>
                            <ChevronDown size={16} color={colors.textSecondary} />
                          </View>
                        </Pressable>
                        {glossaryOpen ? (
                          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                            {glossary.map((item, idx) => (
                              <View key={idx} style={{ marginBottom: idx < glossary.length - 1 ? 10 : 0 }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.summaryIndigo, marginBottom: 2 }}>{item.term}</Text>
                                <Text style={{ fontSize: 13, color: colors.summaryBody, lineHeight: 20 }}>{item.desc}</Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              }
              if (article.summary) {
                return (
                  <Text style={{
                    fontSize: 15, color: colors.summaryBody, lineHeight: 28, letterSpacing: 0.2, marginBottom: 16,
                    paddingHorizontal: 20,
                  }}>
                    {article.summary}
                  </Text>
                );
              }
              return (
                <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 }}>
                    {t('modal.no_summary')}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
                    {t('modal.check_original')}
                  </Text>
                  <Pressable
                    onPress={handleOpenOriginal}
                    style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.textPrimary, borderRadius: 8 }}
                  >
                    <Text style={{ color: colors.card, fontSize: 13, fontWeight: '700' }}>{t('modal.view_original')}</Text>
                  </Pressable>
                </View>
              );
            })()}

          </ScrollView>

          {/* 고정 하단 액션 바 — 탭 바와 동일한 균등 배치 */}
          <View style={{
            flexDirection: 'row',
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.card,
            paddingBottom: Math.max(insets.bottom, 10),
          }}>
            <Pressable
              onPress={handleLike}
              accessibilityLabel={liked ? t('modal.unlike') : t('modal.like')}
              accessibilityRole="button"
              style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}
            >
              <ThumbsUp size={22} color={liked ? colors.likeActiveColor : colors.textDim} />
            </Pressable>
            <Pressable
              onPress={onOpenComments}
              accessibilityLabel={t('modal.comment')}
              accessibilityRole="button"
              style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}
            >
              <MessageCircle size={22} color={colors.textDim} />
            </Pressable>
            <Pressable
              onPress={handleShare}
              accessibilityLabel={t('modal.share')}
              accessibilityRole="button"
              style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}
            >
              <Share2 size={22} color={colors.textDim} />
            </Pressable>
          </View>

          {/* 인라인 토스트 */}
          {toastMsg ? (
            <Animated.View style={{
              position: 'absolute', top: 20, left: 20, right: 20,
              backgroundColor: Colors.toastBg, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16,
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

function HighlightSection({ highlights, onArticlePress, allStats }: { highlights: Article[]; onArticlePress: (article: Article) => void; allStats: Record<string, BatchStats> }) {
  const stats = allStats;
  const { t } = useLanguage();
  const { colors } = useTheme();

  if (!highlights || highlights.length === 0) return null;

  return (
    <View style={{ paddingTop: 12, paddingBottom: 24, backgroundColor: colors.highlightBg }}>
      {/* 섹션 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>{t('news.highlight_title')}</Text>
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
  article, showSourceBadge, onToggle, likes, views, comments,
}: {
  article: Article; showSourceBadge?: boolean; onToggle?: () => void; likes?: number; views?: number; comments?: number;
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
          <Newspaper size={28} color={colors.textLight} />
        </View>
      )}
      <View style={{ padding: 14, flex: 1, width: CARD_WIDTH }}>
        <View style={{ width: CARD_WIDTH - 28 }}>
          {showSourceBadge && <SourceBadge sourceKey={article.source_key} name={getSourceName(article.source_key || '', t)} />}
          <TitleText
            style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, lineHeight: 18, marginTop: showSourceBadge ? 6 : 0 }}
            numberOfLines={2}
          >
            {getLocalizedTitle(article, lang)}
          </TitleText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>{formatDate(article.published, lang)}</Text>
            <ScoreBadge article={article} />
          </View>
          <ArticleStats likes={likes} views={views} comments={comments} />
        </View>
      </View>
    </Pressable>
  );
});

// ─── Section 2: 카테고리 탭 + 세로 리스트 ──────────────────────────────
function CategoryTabSection({
  categorizedArticles, categoryOrder, onArticlePress, allStats, filteredArticles,
}: {
  categorizedArticles: Record<string, Article[]>; categoryOrder: string[]; onArticlePress: (article: Article) => void; allStats: Record<string, BatchStats>; filteredArticles?: Article[];
}) {
  const [activeTab, setActiveTab] = useState(categoryOrder[0] || 'research');
  // 0=초기 5개, 1=전체 카테고리 기사, 2=AI 필터 제외 기사 포함
  const [expandLevel, setExpandLevel] = useState(0);
  const { lang, t } = useLanguage();
  const { colors } = useTheme();

  const articles = categorizedArticles[activeTab] || [];
  const filtered = filteredArticles || [];
  const stats = allStats;

  const visible = useMemo(() => {
    if (expandLevel === 0) return articles.slice(0, Math.min(5, articles.length));
    if (expandLevel === 1) return articles;
    // expandLevel >= 2: 카테고리 기사 + AI 필터 제외 기사
    return [...articles, ...filtered];
  }, [articles, filtered, expandLevel]);

  const remaining = expandLevel === 0 ? articles.length - Math.min(5, articles.length) : 0;
  const hasFiltered = expandLevel === 1 && filtered.length > 0;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setExpandLevel(0);
  };

  return (
    <View style={{ marginBottom: 24 }}>
      {/* 섹션 헤더 + 카테고리 탭 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginRight: 12 }}>{t('news.category_title')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          style={{ flex: 1 }}
          accessibilityRole="tablist"
        >
          {categoryOrder.map(catKey => {
            const isActive = catKey === activeTab;
            const color = CATEGORY_COLORS[catKey] || colors.textSecondary;
            const catName = getCategoryName(catKey, t);
            return (
              <Pressable
                key={catKey}
                onPress={() => handleTabChange(catKey)}
                accessibilityLabel={catName}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={{
                  paddingHorizontal: 14, paddingVertical: 10,
                  minHeight: 44,
                  borderRadius: 16,
                  backgroundColor: isActive ? color : colors.card,
                  borderWidth: 1,
                  borderColor: isActive ? color : colors.border,
                  justifyContent: 'center',
                }}
              >
                <Text style={{
                  fontSize: 12, fontWeight: '700',
                  color: isActive ? '#FFF' : colors.textSecondary,
                }}>
                  {catName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
              borderRadius: 14,
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
                  <Newspaper size={24} color={colors.textLight} />
                </View>
              )}
              <View style={{ flex: 1, padding: 14, justifyContent: 'space-between' }}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <SourceBadge sourceKey={a.source_key} name={getSourceName(a.source_key || '', t)} />
                    {a.ai_filtered && (
                      <View style={{ backgroundColor: colors.textLight, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFF' }}>FILTERED</Text>
                      </View>
                    )}
                  </View>
                  <TitleText
                    style={{ fontSize: 14, fontWeight: '700', color: a.ai_filtered ? colors.textSecondary : colors.textPrimary, lineHeight: 20, marginTop: 6 }}
                    numberOfLines={2}
                  >
                    {getLocalizedTitle(a, lang)}
                  </TitleText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>{formatDate(a.published, lang)}</Text>
                    <ScoreBadge article={a} />
                  </View>
                  <ArticleStats likes={stats[a.link]?.likes} views={stats[a.link]?.views} comments={stats[a.link]?.comments} />
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {/* 더보기 1단계: 전체 카테고리 기사 */}
      {remaining > 0 && (
        <Pressable
          onPress={() => setExpandLevel(1)}
          accessibilityLabel={`${remaining}${t('news.more')}`}
          accessibilityRole="button"
          style={{ alignItems: 'center', paddingVertical: 12, marginHorizontal: 16 }}
        >
          <View style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.border, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>
              +{remaining}{t('news.more')}
            </Text>
          </View>
        </Pressable>
      )}

      {/* 더보기 2단계: AI 필터 제외 기사 포함 */}
      {hasFiltered && (
        <Pressable
          onPress={() => setExpandLevel(2)}
          accessibilityRole="button"
          style={{ alignItems: 'center', paddingVertical: 12, marginHorizontal: 16 }}
        >
          <View style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textLight }}>
              {lang === 'en' ? `+${filtered.length} filtered` : `+${filtered.length}개 필터 제외 기사`}
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

// ─── Section 3: 소스별 가로 스크롤 (한국 소스) ──────────────────────────
function SourceHScrollSection({
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
  const color = SOURCE_COLORS[sourceKey] || colors.textSecondary;
  const first5 = articles.slice(0, 5);
  const more5 = articles.slice(5, 10);
  const visible = showMore ? [...first5, ...more5] : first5;

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: color, marginRight: 8 }} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary, flex: 1 }}>
          {name}
        </Text>
        <Text style={{ fontSize: 11, color: colors.textSecondary }}>{articles.length}{t('news.articles_suffix')}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4, gap: 16 }}
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
            style={{
              width: 80,
              height: HCARD_HEIGHT,
              marginRight: 12,
              backgroundColor: colors.border,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' }}>
              +{more5.length}{'\n'}{t('news.show_more')}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

// ─── GeekNews 세로 리스트 ────────────────────────────────────────────────
const GeekNewsSection = React.memo(function GeekNewsSection({ articles, onArticlePress, allStats }: { articles: Article[]; onArticlePress: (article: Article) => void; allStats: Record<string, BatchStats> }) {
  const [showMore, setShowMore] = useState(false);
  const stats = allStats;
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  if (!articles || articles.length === 0) return null;

  const visible = React.useMemo(
    () => articles.slice(0, showMore ? 10 : 5),
    [showMore, articles],
  );
  const hasMore = !showMore && articles.length > 5;
  const moreCount = Math.min(articles.length - 5, 5);
  const color = SOURCE_COLORS['geeknews'] || colors.textSecondary;
  const name = getSourceName('geeknews', t);

  return (
    <View style={{ marginBottom: 24 }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 }}
        accessibilityRole="header"
      >
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: color, marginRight: 8 }} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary, flex: 1 }}>{name}</Text>
        <Text style={{ fontSize: 11, color: colors.textSecondary }}>{articles.length}{t('news.articles_suffix')}</Text>
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
                style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, lineHeight: 20, flex: 1, marginRight: 8 }}
                numberOfLines={2}
              >
                {getLocalizedTitle(a, lang)}
              </TitleText>
              <ScoreBadge article={a} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>{formatDate(a.published, lang)}</Text>
              <ArticleStats likes={stats[a.link]?.likes} views={stats[a.link]?.views} comments={stats[a.link]?.comments} />
            </View>
          </Pressable>
        ))}
      </View>

      {hasMore && (
        <Pressable
          onPress={() => setShowMore(true)}
          accessibilityLabel={`${t('news.show_more')} ${moreCount}`}
          accessibilityRole="button"
          style={{ alignItems: 'center', paddingVertical: 14, minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.primary }}>{t('news.show_more')} ({moreCount})</Text>
        </Pressable>
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

interface DeliveredNotification {
  request?: { identifier?: string; content?: { title?: string; body?: string } };
  date?: number;
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
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<DeliveredNotification[]>([]);
  const { openDrawer, setActiveTab } = useDrawer();
  const { lang, t } = useLanguage();
  const { colors, isDark } = useTheme();
  const { newsData, loading, error, refresh } = useNews();

  const handleArticlePress = useCallback((article: Article) => {
    setModalArticle(article);
  }, []);

  const handleOpenComments = useCallback(() => {
    if (modalArticle) {
      setCommentArticleLink(modalArticle.link);
    }
  }, [modalArticle]);

  useFocusEffect(
    useCallback(() => {
      setActiveTab('news');
    }, [setActiveTab])
  );

  const openNotifications = useCallback(async () => {
    try {
      if (Notifications) {
        const delivered = await Notifications.getPresentedNotificationsAsync();
        setNotifications(delivered.sort((a: any, b: any) =>
          (b.date ?? 0) - (a.date ?? 0)
        ) as DeliveredNotification[]);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    }
    setNotifModalVisible(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // ─── 새 구조 (3-Section) — 이슈 #17: 빈 배열 상수 참조 ───
  const rawHighlights = newsData?.highlights ?? EMPTY_ARTICLES;
  const highlights = React.useMemo(() => sortByDateThenScore(rawHighlights), [rawHighlights]);
  const rawCategorized = newsData?.categorized_articles ?? EMPTY_RECORD;
  const categorizedArticles = React.useMemo(() => {
    const sorted: Record<string, Article[]> = {};
    for (const [cat, articles] of Object.entries(rawCategorized)) {
      sorted[cat] = sortByDateThenScore(articles);
    }
    return sorted;
  }, [rawCategorized]);
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
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: colors.textPrimary, alignItems: 'center', justifyContent: 'center', marginRight: 10,
        }}>
          <Text style={{ color: colors.card, fontSize: 16, fontWeight: '800' }}>A</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textPrimary }}>{t('news.header')}</Text>
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
          <View style={{ width: 40, height: 3, backgroundColor: Colors.primary, borderRadius: 2, marginTop: 12 }} />
        </View>
        <Pressable onPress={openNotifications} accessibilityLabel={t('notification.title')} accessibilityRole="button" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
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
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.errorBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <RefreshCw size={28} color={colors.errorColor} />
            </View>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16, marginBottom: 8 }}>{t(error)}</Text>
            <Pressable onPress={refresh} style={{ backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>{t('news.retry')}</Text>
            </Pressable>
          </View>
        ) : totalArticles === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Cpu size={28} color={Colors.primary} />
            </View>
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
            {/* Section 1: 하이라이트 */}
            <HighlightSection highlights={highlights} onArticlePress={handleArticlePress} allStats={allStats} />

            {/* Section 2: 카테고리 탭 + 세로 리스트 */}
            <CategoryTabSection
              categorizedArticles={categorizedArticles}
              categoryOrder={categoryOrder}
              onArticlePress={handleArticlePress}
              allStats={allStats}
              filteredArticles={newsData?.filtered_articles}
            />

            {/* 구분선: 카테고리 → 소스별 */}
            {sourceOrder.some(key => (sourceArticles[key]?.length ?? 0) > 0) && (
              <View style={{ paddingHorizontal: 16, marginBottom: 20, marginTop: 16 }}>
                <View style={{ height: 8, backgroundColor: colors.surface, borderRadius: 4, marginBottom: 20 }} />
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>
                  {t('news.source_title')}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                  {t('news.source_subtitle')}
                </Text>
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

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 요약 모달 */}
      <SummaryModal article={modalArticle} onClose={() => setModalArticle(null)} onOpenComments={handleOpenComments} />

      {/* 댓글 시트 (모달과 같은 레벨) */}
      <CommentSheet
        visible={!!commentArticleLink}
        onClose={() => setCommentArticleLink(null)}
        itemType="news"
        itemId={commentArticleLink ?? ''}
      />

      {/* 알림 내역 모달 */}
      <Modal visible={notifModalVisible} animationType="slide" transparent onRequestClose={() => setNotifModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Pressable style={{ flex: 0.15 }} onPress={() => setNotifModalVisible(false)} />
          <View style={{ flex: 0.85, backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' }} accessibilityViewIsModal={true}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Bell size={20} color={colors.textPrimary} />
              <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginLeft: 8 }}>{t('notification.title')}</Text>
              <Pressable onPress={() => setNotifModalVisible(false)} accessibilityLabel={t('modal.close')} accessibilityRole="button" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              {notifications.length === 0 ? (
                <View style={{ alignItems: 'center', paddingTop: 60 }}>
                  <Bell size={48} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 16 }}>{t('notification.empty')}</Text>
                </View>
              ) : (
                notifications.map((n, i) => (
                  <View key={n.request?.identifier ?? i} style={{
                    backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10,
                    borderWidth: 1, borderColor: colors.border,
                  }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }} numberOfLines={2}>
                      {n.request?.content?.title ?? 'Ailon'}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }} numberOfLines={3}>
                      {n.request?.content?.body ?? ''}
                    </Text>
                    {n.date ? (
                      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 6 }}>
                        {new Date(n.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
