/**
 * AI 뉴스 피드 — 3-Section 레이아웃
 * Section 1: 하이라이트 (Hero + 2x2 그리드)
 * Section 2: 카테고리별 가로 스크롤 (모델/연구, 제품/도구, 산업/비즈니스)
 * Section 3: 소스별 가로 스크롤 (한국 소스)
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Bell, RefreshCw, ThumbsUp, Eye, Share2, ExternalLink, MessageCircle, X,
} from 'lucide-react-native';
import { useNews } from '@/hooks/useNews';
import { useDrawer } from '@/context/DrawerContext';
import { useLanguage } from '@/context/LanguageContext';
import { useReactions } from '@/hooks/useReactions';
import { useArticleViews } from '@/hooks/useArticleViews';
import { useBatchStats } from '@/hooks/useBatchStats';
import { NewsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { CommentSheet } from '@/components/shared/CommentSheet';
import type { Article } from '@/lib/types';
import { Colors } from '@/lib/colors';
import type { Language } from '@/lib/translations';
import type { BatchStats } from '@/hooks/useBatchStats';

// ─── 색상 ───────────────────────────────────────────────────────────────
const BG = Colors.bg;
const CARD = Colors.card;
const TEXT_PRIMARY = Colors.textPrimary;
const TEXT_SECONDARY = Colors.textSecondary;
const TEXT_LIGHT = Colors.textSecondary;
const BORDER = Colors.border;

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
function formatDate(str?: string) {
  if (!str) return '';
  try {
    // ZDNet 등 "2026.02.19 PM 08:20" 형식 처리
    const ymdMatch = str.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
    if (ymdMatch) {
      return `${ymdMatch[1]}/${ymdMatch[2]}/${ymdMatch[3]}`;
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}/${m}/${day}`;
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

function getCategoryName(catKey: string, t: (key: string) => string) {
  return t(`cat.${catKey}`);
}

// ─── 제목 말줄임 처리 (중복 "..." 방지) ─────────────────────────────────
function TitleText({ children, style, numberOfLines = 2 }: { children: string; style: any; numberOfLines?: number }) {
  const [display, setDisplay] = React.useState(children);
  const measured = React.useRef(false);

  React.useEffect(() => {
    measured.current = false;
    setDisplay(children);
  }, [children]);

  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
      ellipsizeMode="clip"
      onTextLayout={(e) => {
        if (measured.current) return;
        measured.current = true;
        const lines = e.nativeEvent.lines;
        const shown = lines.slice(0, numberOfLines).map((l: any) => l.text).join('');
        if (shown.length < children.length) {
          let t = shown.slice(0, -3).trimEnd();
          t = t.replace(/\.+$/, '').replace(/…+$/, '');
          setDisplay(t + '...');
        }
      }}
    >
      {display}
    </Text>
  );
}

// ─── 좋아요+뷰 카운트 (정적 — 피드 카드에서 리스너 폭발 방지) ──────────
const ArticleStats = React.memo(function ArticleStats({ likes, views }: { likes?: number; views?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <ThumbsUp size={11} color={TEXT_LIGHT} />
        <Text style={{ fontSize: 11, color: TEXT_LIGHT, fontWeight: '600' }}>{likes ?? 0}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <Eye size={11} color={TEXT_LIGHT} />
        <Text style={{ fontSize: 11, color: TEXT_LIGHT, fontWeight: '600' }}>{views ?? 0}</Text>
      </View>
    </View>
  );
});

// ─── 소스 뱃지 ──────────────────────────────────────────────────────────
const SourceBadge = React.memo(function SourceBadge({ sourceKey }: { sourceKey?: string }) {
  if (!sourceKey) return null;
  const { t } = useLanguage();
  const name = getSourceName(sourceKey, t);
  const color = SOURCE_COLORS[sourceKey] || TEXT_SECONDARY;
  return (
    <View style={{
      backgroundColor: color + '18',
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 6, alignSelf: 'flex-start',
    }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color }}>{name}</Text>
    </View>
  );
});

// ─── 점수 뱃지 ─────────────────────────────────────────────────────────
function ScoreBadge({ article }: { article: Article }) {
  const { score, score_rigor: rig, score_novelty: nov, score_potential: pot,
    score_utility: uti, score_impact: imp, score_access: acc,
    score_market: mag, score_signal: sig, score_breadth: brd } = article;
  if (!score) return null;
  const isBiz = !!(mag || sig || brd);
  const isResearch = !!(rig || nov || pot);
  const isMP = !!(uti || imp || acc);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Text style={{ fontSize: 11, color: isBiz ? '#B45309' : isResearch ? '#2563EB' : '#7C3AED', fontWeight: '700' }}>{score}</Text>
      {isBiz ? (
        <Text style={{ fontSize: 11, color: '#B45309' }}>M{mag} S{sig} B{brd}</Text>
      ) : isResearch ? (
        <Text style={{ fontSize: 11, color: '#2563EB' }}>R{rig} N{nov} P{pot}</Text>
      ) : isMP ? (
        <Text style={{ fontSize: 11, color: '#7C3AED' }}>U{uti} I{imp} A{acc}</Text>
      ) : null}
    </View>
  );
}

// ─── Section 1: 하이라이트 ──────────────────────────────────────────────
const HIGHLIGHT_CARD_WIDTH = 280;
const HIGHLIGHT_CARD_HEIGHT = 260;

const HighlightScrollCard = React.memo(function HighlightScrollCard({
  article, onToggle, likes, views,
}: {
  article: Article; onToggle?: () => void; likes?: number; views?: number;
}) {
  const { lang } = useLanguage();
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
        backgroundColor: CARD,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: BORDER,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {article.image_url ? (
        <View style={{ width: HIGHLIGHT_CARD_WIDTH, height: 150, backgroundColor: BORDER, borderRadius: 8, overflow: 'hidden' }}>
          <Image
            source={article.image_url}
            style={{ width: HIGHLIGHT_CARD_WIDTH, height: 150 }}
            contentFit="cover"
            transition={200}
            recyclingKey={article.link}
          />
        </View>
      ) : (
        <View style={{ width: HIGHLIGHT_CARD_WIDTH, height: 150, backgroundColor: BORDER, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28, color: TEXT_LIGHT }}>📰</Text>
        </View>
      )}
      <View style={{ padding: 14, flex: 1, justifyContent: 'space-between', width: HIGHLIGHT_CARD_WIDTH }}>
        <View style={{ width: HIGHLIGHT_CARD_WIDTH - 28 }}>
          <SourceBadge sourceKey={article.source_key} />
          <TitleText
            style={{ fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, lineHeight: 21, marginTop: 6 }}
            numberOfLines={2}
          >
            {getLocalizedTitle(article, lang)}
          </TitleText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{formatDate(article.published)}</Text>
            <ScoreBadge article={article} />
          </View>
          <ArticleStats likes={likes} views={views} />
        </View>
      </View>
    </Pressable>
  );
});

function SummaryModal({ article, onClose, onOpenComments }: { article: Article | null; onClose: () => void; onOpenComments: () => void }) {
  const { views, trackView } = useArticleViews(article?.link ?? '');
  const { likes, liked, toggleLike } = useReactions('news', article?.link ?? '');
  const { lang, t } = useLanguage();
  const viewTracked = useRef(false);
  const insets = useSafeAreaInsets();
  const [toastMsg, setToastMsg] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  // 모달 열릴 때 뷰수 자동 증가 (1회)
  useEffect(() => {
    if (article && !viewTracked.current) {
      viewTracked.current = true;
      trackView();
    }
    if (!article) {
      viewTracked.current = false;
    }
  }, [article, trackView]);

  if (!article) return null;

  const sourceName = getSourceName(article.source_key || '', t);
  const sourceColor = SOURCE_COLORS[article.source_key || ''] || TEXT_SECONDARY;

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

        {/* 바텀시트 */}
        <View style={{
          backgroundColor: CARD,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '85%',
        }}>
          {/* X 닫기 버튼 */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 16, paddingBottom: 12, paddingHorizontal: 20 }}>
            <Pressable
              onPress={onClose}
              accessibilityLabel={t('modal.close')}
              accessibilityRole="button"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} color={TEXT_SECONDARY} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator
            bounces
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* 썸네일 */}
            {article.image_url ? (
              <View style={{ width: '100%', height: 200, backgroundColor: BORDER }}>
                <Image
                  source={article.image_url}
                  style={{ width: '100%', height: 200 }}
                  contentFit="cover"
                  transition={200}
                  recyclingKey={article.link}
                />
              </View>
            ) : null}

            {/* 소스 뱃지 + 날짜 + 조회수 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginTop: article.image_url ? 16 : 20 }}>
              <View style={{
                backgroundColor: sourceColor + '18',
                paddingHorizontal: 8, paddingVertical: 3,
                borderRadius: 4,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: sourceColor }}>{sourceName}</Text>
              </View>
              <Text style={{ fontSize: 12, color: TEXT_LIGHT }}>{formatDate(article.published)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Eye size={11} color={TEXT_LIGHT} />
                <Text style={{ fontSize: 10, color: TEXT_LIGHT, fontWeight: '600' }}>{views}</Text>
              </View>
            </View>

            {/* 제목 */}
            <Text style={{
              fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, lineHeight: 28,
              marginTop: 14, marginBottom: 14,
              paddingHorizontal: 20,
            }}>
              {getLocalizedTitle(article, lang)}
            </Text>

            {/* 구분선 */}
            <View style={{ height: 1, backgroundColor: BORDER, marginBottom: 18, marginHorizontal: 20 }} />

            {/* 3-파트 요약 */}
            {(() => {
              const oneLine = getLocalizedOneLine(article, lang);
              const keyPoints = getLocalizedKeyPoints(article, lang);
              const whyImportant = getLocalizedWhyImportant(article, lang);
              if (oneLine) {
                return (
                  <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                    {/* 핵심 한줄 */}
                    <View style={{ backgroundColor: '#F0F4FF', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#6366F1', marginBottom: 6 }}>{t('modal.one_line')}</Text>
                      <Text style={{ fontSize: 16, color: TEXT_PRIMARY, lineHeight: 26, fontWeight: '700' }}>
                        {oneLine}
                      </Text>
                    </View>

                    {/* 주요 포인트 */}
                    {keyPoints.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#0891B2', marginBottom: 8 }}>{t('modal.key_points')}</Text>
                        {keyPoints.map((point, idx) => (
                          <View key={idx} style={{ flexDirection: 'row', marginBottom: 12, paddingRight: 4 }}>
                            <Text style={{ fontSize: 13, color: '#0891B2', marginRight: 8, lineHeight: 22, fontWeight: '700' }}>{idx + 1}.</Text>
                            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22, flex: 1 }}>{point}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* 왜 중요해요? */}
                    {whyImportant ? (
                      <View style={{ backgroundColor: '#FFFBEB', borderRadius: 10, padding: 14 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#D97706', marginBottom: 4 }}>{t('modal.why_important')}</Text>
                        <Text style={{ fontSize: 14, color: '#374151', lineHeight: 24 }}>
                          {whyImportant}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              }
              if (article.summary) {
                return (
                  <Text style={{
                    fontSize: 15, color: '#374151', lineHeight: 28, letterSpacing: 0.2, marginBottom: 16,
                    paddingHorizontal: 20,
                  }}>
                    {article.summary}
                  </Text>
                );
              }
              return (
                <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: TEXT_SECONDARY, marginBottom: 4 }}>
                    {t('modal.no_summary')}
                  </Text>
                  <Text style={{ fontSize: 13, color: TEXT_LIGHT, marginBottom: 12 }}>
                    {t('modal.check_original')}
                  </Text>
                  <Pressable
                    onPress={handleOpenOriginal}
                    style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#000', borderRadius: 8 }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>{t('modal.view_original')}</Text>
                  </Pressable>
                </View>
              );
            })()}

          </ScrollView>

          {/* 고정 하단 액션 바 */}
          <View style={{
            borderTopWidth: 1, borderTopColor: BORDER,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
            paddingHorizontal: 16, paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 10),
            gap: 8,
          }}>
            <Pressable
              onPress={handleLike}
              accessibilityLabel={liked ? t('modal.unlike') : t('modal.like')}
              accessibilityRole="button"
              style={({ pressed }) => ({
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: liked ? '#3B82F615' : BORDER,
                paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
                borderWidth: liked ? 1 : 0, borderColor: '#3B82F640',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <ThumbsUp size={18} color={liked ? '#3B82F6' : TEXT_SECONDARY} />
            </Pressable>

            <Pressable
              onPress={onOpenComments}
              accessibilityLabel={t('modal.comment')}
              accessibilityRole="button"
              style={({ pressed }) => ({
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: BORDER,
                paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <MessageCircle size={18} color={TEXT_SECONDARY} />
            </Pressable>

            <Pressable
              onPress={handleShare}
              accessibilityLabel={t('modal.share')}
              accessibilityRole="button"
              style={({ pressed }) => ({
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: BORDER,
                paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Share2 size={18} color={TEXT_SECONDARY} />
            </Pressable>
          </View>

          {/* 인라인 토스트 */}
          {toastMsg ? (
            <Animated.View style={{
              position: 'absolute', top: 20, left: 20, right: 20,
              backgroundColor: '#1F2937', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16,
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

  if (!highlights || highlights.length === 0) return null;

  return (
    <View style={{ paddingTop: 12, paddingBottom: 24, backgroundColor: '#F0F4FF' }}>
      {/* 섹션 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY }}>{t('news.highlight_title')}</Text>
        <Text style={{ fontSize: 11, color: TEXT_LIGHT, marginLeft: 8 }}>Top {highlights.length}</Text>
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
  article, showSourceBadge, onToggle, likes, views,
}: {
  article: Article; showSourceBadge?: boolean; onToggle?: () => void; likes?: number; views?: number;
}) {
  const { lang } = useLanguage();
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
        backgroundColor: CARD,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: BORDER,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {article.image_url ? (
        <View style={{ width: CARD_WIDTH, height: 140, backgroundColor: BORDER, borderRadius: 8, overflow: 'hidden' }}>
          <Image
            source={article.image_url}
            style={{ width: CARD_WIDTH, height: 140 }}
            contentFit="cover"
            transition={200}
            recyclingKey={article.link}
          />
        </View>
      ) : (
        <View style={{ width: CARD_WIDTH, height: 140, backgroundColor: BORDER, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28, color: TEXT_LIGHT }}>📰</Text>
        </View>
      )}
      <View style={{ padding: 14, flex: 1, width: CARD_WIDTH }}>
        <View style={{ width: CARD_WIDTH - 28 }}>
          {showSourceBadge && <SourceBadge sourceKey={article.source_key} />}
          <TitleText
            style={{ fontSize: 13, fontWeight: '700', color: TEXT_PRIMARY, lineHeight: 18, marginTop: showSourceBadge ? 6 : 0 }}
            numberOfLines={2}
          >
            {getLocalizedTitle(article, lang)}
          </TitleText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{formatDate(article.published)}</Text>
            <ScoreBadge article={article} />
          </View>
          <ArticleStats likes={likes} views={views} />
        </View>
      </View>
    </Pressable>
  );
});

// ─── Section 2: 카테고리 탭 + 세로 리스트 ──────────────────────────────
function CategoryTabSection({
  categorizedArticles, categoryOrder, onArticlePress, allStats,
}: {
  categorizedArticles: Record<string, Article[]>; categoryOrder: string[]; onArticlePress: (article: Article) => void; allStats: Record<string, BatchStats>;
}) {
  const [activeTab, setActiveTab] = useState(categoryOrder[0] || 'research');
  const [expandLevel, setExpandLevel] = useState(0); // 0=5개, 1=10개, 2=15개
  const { lang, t } = useLanguage();

  const articles = categorizedArticles[activeTab] || [];
  const stats = allStats;
  const visibleCount = Math.min(5 + expandLevel * 5, articles.length);
  const visible = articles.slice(0, visibleCount);
  const remaining = articles.length - visibleCount;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setExpandLevel(0);
  };

  return (
    <View style={{ marginBottom: 24 }}>
      {/* 섹션 헤더 + 카테고리 탭 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY, marginRight: 12 }}>{t('news.category_title')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          style={{ flex: 1 }}
          accessibilityRole="tablist"
        >
          {categoryOrder.map(catKey => {
            const isActive = catKey === activeTab;
            const color = CATEGORY_COLORS[catKey] || TEXT_SECONDARY;
            const catName = getCategoryName(catKey, t);
            return (
              <Pressable
                key={catKey}
                onPress={() => handleTabChange(catKey)}
                accessibilityLabel={catName}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={{
                  paddingHorizontal: 14, paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: isActive ? color : CARD,
                  borderWidth: 1,
                  borderColor: isActive ? color : BORDER,
                }}
              >
                <Text style={{
                  fontSize: 12, fontWeight: '700',
                  color: isActive ? '#FFF' : TEXT_SECONDARY,
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
              backgroundColor: CARD,
              borderRadius: 14,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: BORDER,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', flex: 1 }}>
              {a.image_url ? (
                <View style={{ width: 118, height: 118, backgroundColor: BORDER, borderRadius: 8, overflow: 'hidden' }}>
                  <Image
                    source={a.image_url}
                    style={{ width: 118, height: 118 }}
                    contentFit="cover"
                    transition={200}
                    recyclingKey={a.link}
                  />
                </View>
              ) : (
                <View style={{ width: 118, height: 118, backgroundColor: BORDER, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24, color: TEXT_LIGHT }}>📰</Text>
                </View>
              )}
              <View style={{ flex: 1, padding: 14, justifyContent: 'space-between' }}>
                <View>
                  <SourceBadge sourceKey={a.source_key} />
                  <TitleText
                    style={{ fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, lineHeight: 20, marginTop: 6 }}
                    numberOfLines={2}
                  >
                    {getLocalizedTitle(a, lang)}
                  </TitleText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{formatDate(a.published)}</Text>
                    <ScoreBadge article={a} />
                  </View>
                  <ArticleStats likes={stats[a.link]?.likes} views={stats[a.link]?.views} />
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {/* 더보기 */}
      {remaining > 0 && (
        <Pressable
          onPress={() => setExpandLevel(prev => prev + 1)}
          accessibilityLabel={`+${Math.min(remaining, 5)}${t('news.more')}`}
          accessibilityRole="button"
          style={{ alignItems: 'center', paddingVertical: 12, marginHorizontal: 16 }}
        >
          <View style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: BORDER, borderWidth: 1, borderColor: '#E5E7EB' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: TEXT_SECONDARY }}>
              +{Math.min(remaining, 5)}{t('news.more')}
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

  if (!articles || articles.length === 0) return null;

  const name = getSourceName(sourceKey, t);
  const color = SOURCE_COLORS[sourceKey] || TEXT_SECONDARY;
  const first5 = articles.slice(0, 5);
  const more5 = articles.slice(5, 10);
  const visible = showMore ? [...first5, ...more5] : first5;

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: color, marginRight: 8 }} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, flex: 1 }}>
          {name}
        </Text>
        <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{articles.length}{t('news.articles_suffix')}</Text>
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
          />
        ))}

        {more5.length > 0 && !showMore && (
          <Pressable
            onPress={() => setShowMore(true)}
            style={{
              width: 80,
              height: HCARD_HEIGHT,
              marginRight: 12,
              backgroundColor: BORDER,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: TEXT_SECONDARY, textAlign: 'center' }}>
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
  if (!articles || articles.length === 0) return null;

  const first5 = articles.slice(0, 5);
  const more5 = articles.slice(5, 10);
  const visible = React.useMemo(
    () => (showMore ? [...first5, ...more5] : first5),
    [showMore, first5, more5],
  );
  const color = SOURCE_COLORS['geeknews'] || TEXT_SECONDARY;
  const name = getSourceName('geeknews', t);

  return (
    <View style={{ marginBottom: 24 }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 }}
        accessibilityRole="header"
      >
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: color, marginRight: 8 }} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, flex: 1 }}>{name}</Text>
        <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{articles.length}{t('news.articles_suffix')}</Text>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        {visible.map((a, i) => (
          <Pressable
            key={`geeknews-${i}-${a.link}`}
            onPress={() => onArticlePress(a)}
            accessibilityLabel={getLocalizedTitle(a, lang)}
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: CARD,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: BORDER,
              padding: 14,
              justifyContent: 'space-between',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <TitleText
                style={{ fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, lineHeight: 20, flex: 1, marginRight: 8 }}
                numberOfLines={2}
              >
                {getLocalizedTitle(a, lang)}
              </TitleText>
              <ScoreBadge article={a} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{formatDate(a.published)}</Text>
              <ArticleStats likes={stats[a.link]?.likes} views={stats[a.link]?.views} />
            </View>
          </Pressable>
        ))}
      </View>

      {!showMore && more5.length > 0 && (
        <Pressable
          onPress={() => setShowMore(true)}
          accessibilityLabel={`${t('news.show_more')} ${more5.length}`}
          accessibilityRole="button"
          style={{ alignItems: 'center', paddingVertical: 14, minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.primary }}>{t('news.show_more')} ({more5.length})</Text>
        </Pressable>
      )}
    </View>
  );
});

// ─── 메인 화면 ──────────────────────────────────────────────────────────
export default function NewsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [modalArticle, setModalArticle] = useState<Article | null>(null);
  const [commentArticleLink, setCommentArticleLink] = useState<string | null>(null);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { openDrawer, setActiveTab } = useDrawer();
  const { lang, t } = useLanguage();
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
      const Notif = require('expo-notifications');
      const delivered = await Notif.getPresentedNotificationsAsync();
      setNotifications(delivered.sort((a: any, b: any) =>
        (b.date ?? 0) - (a.date ?? 0)
      ));
    } catch {
      setNotifications([]);
    }
    setNotifModalVisible(true);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // ─── 정렬: KST 날짜(일) 최신순 → 점수순 → 시간 최신순 ───
  const sortByDateThenScore = useCallback((articles: Article[]) => {
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
  }, []);

  // ─── 새 구조 (3-Section) ───
  const rawHighlights = newsData?.highlights ?? [];
  const highlights = React.useMemo(() => sortByDateThenScore(rawHighlights), [rawHighlights, sortByDateThenScore]);
  const rawCategorized = newsData?.categorized_articles ?? {};
  const categorizedArticles = React.useMemo(() => {
    const sorted: Record<string, Article[]> = {};
    for (const [cat, articles] of Object.entries(rawCategorized)) {
      sorted[cat] = sortByDateThenScore(articles);
    }
    return sorted;
  }, [rawCategorized, sortByDateThenScore]);
  const categoryOrder = newsData?.category_order ?? DEFAULT_CATEGORY_ORDER;
  const sourceArticles = newsData?.source_articles ?? {};
  const sourceOrder = newsData?.source_order ?? DEFAULT_SOURCE_ORDER;

  // ─── 레거시 폴백 (기존 articles 배열 데이터) ───
  const legacyGrouped: Record<string, Article[]> = {};
  if (highlights.length === 0 && newsData?.articles) {
    for (const a of newsData.articles) {
      const key = a.source_key || 'unknown';
      if (!legacyGrouped[key]) legacyGrouped[key] = [];
      legacyGrouped[key].push(a);
    }
  }
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
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ─── 헤더 ─── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: BG,
      }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginRight: 10,
        }}>
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>A</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY }}>{t('news.header')}</Text>
          {totalArticles > 0 && (
            <Text style={{ fontSize: 12, color: TEXT_LIGHT }}>
              {newsData?.updated_at
                ? `${new Date(newsData.updated_at.seconds ? newsData.updated_at.seconds * 1000 : newsData.updated_at).toLocaleTimeString(lang === 'en' ? 'en-US' : 'ko-KR', { hour: '2-digit', minute: '2-digit' })} ${t('news.updated')}`
                : `${totalArticles}${t('news.articles_count')}`}
            </Text>
          )}
          <View style={{ width: 40, height: 3, backgroundColor: Colors.primary, borderRadius: 2, marginTop: 12 }} />
        </View>
        <Pressable onPress={openNotifications} accessibilityLabel={t('notification.title')} accessibilityRole="button" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={22} color={TEXT_SECONDARY} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={TEXT_SECONDARY} />}
      >
        {loading ? (
          <View style={{ paddingHorizontal: 16, gap: 12, paddingTop: 8 }}>
            <NewsCardSkeleton />
            <NewsCardSkeleton />
            <NewsCardSkeleton />
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <RefreshCw size={28} color="#DC2626" />
            </View>
            <Text style={{ color: TEXT_PRIMARY, fontWeight: '700', fontSize: 16, marginBottom: 8 }}>{t('news.connection_error')}</Text>
            <Text style={{ color: TEXT_LIGHT, fontSize: 14, textAlign: 'center', marginBottom: 20 }}>{error}</Text>
            <Pressable onPress={refresh} style={{ backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>{t('news.retry')}</Text>
            </Pressable>
          </View>
        ) : totalArticles === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ color: TEXT_LIGHT, fontSize: 14 }}>{t('news.no_news')}</Text>
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
            />

            {/* 구분선: 카테고리 → 소스별 */}
            {sourceOrder.some(key => (sourceArticles[key]?.length ?? 0) > 0) && (
              <View style={{ paddingHorizontal: 16, marginBottom: 20, marginTop: 16 }}>
                <View style={{ height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, marginBottom: 20 }} />
                <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT_PRIMARY }}>
                  {t('news.source_title')}
                </Text>
                <Text style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 4 }}>
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
          <View style={{ flex: 0.85, backgroundColor: BG, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: BORDER }}>
              <Bell size={20} color={TEXT_PRIMARY} />
              <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: TEXT_PRIMARY, marginLeft: 8 }}>{t('notification.title')}</Text>
              <Pressable onPress={() => setNotifModalVisible(false)} accessibilityLabel={t('modal.close')} accessibilityRole="button" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} color={TEXT_SECONDARY} />
              </Pressable>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              {notifications.length === 0 ? (
                <View style={{ alignItems: 'center', paddingTop: 60 }}>
                  <Bell size={48} color={TEXT_SECONDARY} />
                  <Text style={{ color: TEXT_SECONDARY, fontSize: 15, marginTop: 16 }}>{t('notification.empty')}</Text>
                </View>
              ) : (
                notifications.map((n, i) => (
                  <View key={n.request?.identifier ?? i} style={{
                    backgroundColor: CARD, borderRadius: 12, padding: 14, marginBottom: 10,
                    borderWidth: 1, borderColor: BORDER,
                  }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: TEXT_PRIMARY }} numberOfLines={2}>
                      {n.request?.content?.title ?? 'Ailon'}
                    </Text>
                    <Text style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4 }} numberOfLines={3}>
                      {n.request?.content?.body ?? ''}
                    </Text>
                    {n.date ? (
                      <Text style={{ fontSize: 11, color: TEXT_LIGHT, marginTop: 6 }}>
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
