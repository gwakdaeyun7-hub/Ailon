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
  Menu, RefreshCw, ThumbsUp, Eye, Share2, ExternalLink, MessageCircle, X,
} from 'lucide-react-native';
import { useNews } from '@/hooks/useNews';
import { useDrawer } from '@/context/DrawerContext';
import { useReactions } from '@/hooks/useReactions';
import { useArticleViews } from '@/hooks/useArticleViews';
import { useBatchStats } from '@/hooks/useBatchStats';
import { NewsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { CommentSheet } from '@/components/shared/CommentSheet';
import type { Article } from '@/lib/types';

// ─── 색상 ───────────────────────────────────────────────────────────────
const BG = '#F9FAFB';
const CARD = '#FFFFFF';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_LIGHT = '#636B78';
const BORDER = '#F3F4F6';

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
  aitimes: 'AI타임스',
  geeknews: 'GeekNews',
  zdnet_ai_editor: 'ZDNet AI 에디터',
  yozm_ai: '요즘IT AI',
};

const CATEGORY_NAMES: Record<string, string> = {
  model_research: '모델/연구',
  product_tools: '제품/도구',
  industry_business: '산업/비즈니스',
};

const CATEGORY_COLORS: Record<string, string> = {
  model_research: '#7C3AED',
  product_tools: '#0891B2',
  industry_business: '#D97706',
};

const DEFAULT_CATEGORY_ORDER = ['model_research', 'product_tools', 'industry_business'];
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

// ─── 좋아요+뷰 카운트 (정적 — 피드 카드에서 리스너 폭발 방지) ──────────
const ArticleStats = React.memo(function ArticleStats({ likes, views }: { likes?: number; views?: number }) {
  if (!likes && !views) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {(likes ?? 0) > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <ThumbsUp size={12} color={TEXT_LIGHT} />
          <Text style={{ fontSize: 11, color: TEXT_LIGHT, fontWeight: '600' }}>{likes}</Text>
        </View>
      )}
      {(views ?? 0) > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Eye size={12} color={TEXT_LIGHT} />
          <Text style={{ fontSize: 11, color: TEXT_LIGHT, fontWeight: '600' }}>{views}</Text>
        </View>
      )}
    </View>
  );
});

// ─── 소스 뱃지 ──────────────────────────────────────────────────────────
const SourceBadge = React.memo(function SourceBadge({ sourceKey }: { sourceKey?: string }) {
  if (!sourceKey) return null;
  const name = SOURCE_NAMES[sourceKey] || sourceKey;
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

// ─── Section 1: 하이라이트 ──────────────────────────────────────────────
const HIGHLIGHT_CARD_WIDTH = 280;
const HIGHLIGHT_CARD_HEIGHT = 260;

const HighlightScrollCard = React.memo(function HighlightScrollCard({
  article, onToggle, likes, views,
}: {
  article: Article; onToggle?: () => void; likes?: number; views?: number;
}) {
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
      accessibilityLabel={getTitle(article)}
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
          <Text
            style={{ fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, lineHeight: 21, marginTop: 6 }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {getTitle(article)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{formatDate(article.published)}</Text>
          <ArticleStats likes={likes} views={views} />
        </View>
      </View>
    </Pressable>
  );
});

function SummaryModal({ article, onClose, onOpenComments }: { article: Article | null; onClose: () => void; onOpenComments: () => void }) {
  const { views, trackView } = useArticleViews(article?.link ?? '');
  const { likes, liked, toggleLike } = useReactions('news', article?.link ?? '');
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

  const sourceName = SOURCE_NAMES[article.source_key || ''] || article.source_key || '';
  const sourceColor = SOURCE_COLORS[article.source_key || ''] || TEXT_SECONDARY;

  const handleOpenOriginal = () => {
    if (article.link) Linking.openURL(article.link);
  };

  const handleLike = async () => {
    const result = await toggleLike();
    if (result === 'already') {
      showToast('오늘은 이미 좋아요를 눌렀어요');
    }
  };

  const handleShare = async () => {
    try {
      const summary = article.one_line || article.summary || '';
      await Share.share({
        message: `[${sourceName}] ${getTitle(article)}\n\n${summary}\n\n원문: ${article.link}\n\n— Ailon AI 뉴스`,
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
          {/* 드래그 핸들바 + X 닫기 버튼 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 16, paddingBottom: 12, paddingHorizontal: 20 }}>
            <View style={{ flex: 1 }} />
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Pressable
                onPress={onClose}
                accessibilityLabel="닫기"
                accessibilityRole="button"
                style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} color={TEXT_SECONDARY} />
              </Pressable>
            </View>
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
              {getTitle(article)}
            </Text>

            {/* 구분선 */}
            <View style={{ height: 1, backgroundColor: BORDER, marginBottom: 18, marginHorizontal: 20 }} />

            {/* 3-파트 요약 */}
            {article.one_line ? (
              <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                {/* 핵심 한줄 */}
                <View style={{ backgroundColor: '#F0F4FF', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#6366F1', marginBottom: 6 }}>핵심 한줄</Text>
                  <Text style={{ fontSize: 16, color: TEXT_PRIMARY, lineHeight: 26, fontWeight: '700' }}>
                    {article.one_line}
                  </Text>
                </View>

                {/* 주요 포인트 */}
                {article.key_points && article.key_points.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0891B2', marginBottom: 8 }}>주요 포인트</Text>
                    {article.key_points.map((point, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', marginBottom: 12, paddingRight: 4 }}>
                        <Text style={{ fontSize: 13, color: '#0891B2', marginRight: 8, lineHeight: 22, fontWeight: '700' }}>{idx + 1}.</Text>
                        <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22, flex: 1 }}>{point}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 왜 중요해요? */}
                {article.why_important ? (
                  <View style={{ backgroundColor: '#FFFBEB', borderRadius: 10, padding: 14 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#D97706', marginBottom: 4 }}>왜 중요해요?</Text>
                    <Text style={{ fontSize: 14, color: '#374151', lineHeight: 24 }}>
                      {article.why_important}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : article.summary ? (
              <Text style={{
                fontSize: 15, color: '#374151', lineHeight: 28, letterSpacing: 0.2, marginBottom: 16,
                paddingHorizontal: 20,
              }}>
                {article.summary}
              </Text>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: TEXT_SECONDARY, marginBottom: 4 }}>
                  아직 AI 요약이 준비되지 않았어요
                </Text>
                <Text style={{ fontSize: 13, color: TEXT_LIGHT, marginBottom: 12 }}>
                  원문을 직접 확인해보세요
                </Text>
                <Pressable
                  onPress={handleOpenOriginal}
                  style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#000', borderRadius: 8 }}
                >
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>원문 보기</Text>
                </Pressable>
              </View>
            )}

          </ScrollView>

          {/* 고정 하단 액션 바 */}
          <View style={{
            borderTopWidth: 1, borderTopColor: BORDER,
            paddingHorizontal: 20, paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 12),
          }}>
            {/* 원문 보기 — 전폭 프라이머리 버튼 */}
            <Pressable
              onPress={handleOpenOriginal}
              accessibilityLabel="원문 보기"
              accessibilityRole="link"
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                backgroundColor: '#000', paddingVertical: 12, borderRadius: 10,
                opacity: pressed ? 0.8 : 1, marginBottom: 10,
              })}
            >
              <ExternalLink size={15} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>원문 보기</Text>
            </Pressable>

            {/* 좋아요 | 댓글 | 공유 — 균등 배치 */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={handleLike}
                accessibilityLabel={liked ? '좋아요 취소' : '좋아요'}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
                  backgroundColor: liked ? '#EF444415' : BORDER,
                  paddingVertical: 10, borderRadius: 10,
                  borderWidth: liked ? 1 : 0, borderColor: '#EF444440',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <ThumbsUp size={14} color={liked ? '#EF4444' : TEXT_SECONDARY} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: liked ? '#EF4444' : TEXT_SECONDARY }}>
                  {likes > 0 ? likes : '좋아요'}
                </Text>
              </Pressable>

              <Pressable
                onPress={onOpenComments}
                accessibilityLabel="댓글"
                accessibilityRole="button"
                style={({ pressed }) => ({
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
                  backgroundColor: BORDER, paddingVertical: 10, borderRadius: 10,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <MessageCircle size={14} color={TEXT_SECONDARY} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: TEXT_SECONDARY }}>댓글</Text>
              </Pressable>

              <Pressable
                onPress={handleShare}
                accessibilityLabel="공유"
                accessibilityRole="button"
                style={({ pressed }) => ({
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
                  backgroundColor: BORDER, paddingVertical: 10, borderRadius: 10,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Share2 size={14} color={TEXT_SECONDARY} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: TEXT_SECONDARY }}>공유</Text>
              </Pressable>
            </View>
          </View>

          {/* 인라인 토스트 */}
          {toastMsg ? (
            <Animated.View style={{
              position: 'absolute', top: 20, left: 20, right: 20,
              backgroundColor: '#1F2937', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16,
              alignItems: 'center', opacity: toastOpacity,
            }} pointerEvents="none">
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>{toastMsg}</Text>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function HighlightSection({ highlights, onArticlePress }: { highlights: Article[]; onArticlePress: (article: Article) => void }) {
  const links = React.useMemo(() => highlights.map(a => a.link).filter(Boolean), [highlights]);
  const stats = useBatchStats(links);

  if (!highlights || highlights.length === 0) return null;

  return (
    <View style={{ paddingTop: 12, paddingBottom: 20, backgroundColor: '#F0F4FF' }}>
      {/* 섹션 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY }}>오늘의 하이라이트</Text>
        <Text style={{ fontSize: 11, color: TEXT_LIGHT, marginLeft: 8 }}>Top {highlights.length}</Text>
      </View>

      {/* 가로 스크롤 하이라이트 카드 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4, gap: 100 }}
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
      accessibilityLabel={getTitle(article)}
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
          <Text
            style={{ fontSize: 13, fontWeight: '700', color: TEXT_PRIMARY, lineHeight: 18, marginTop: showSourceBadge ? 6 : 0 }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {getTitle(article)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{formatDate(article.published)}</Text>
          <ArticleStats likes={likes} views={views} />
        </View>
      </View>
    </Pressable>
  );
});

// ─── Section 2: 카테고리 탭 + 세로 리스트 ──────────────────────────────
function CategoryTabSection({
  categorizedArticles, categoryOrder, onArticlePress,
}: {
  categorizedArticles: Record<string, Article[]>; categoryOrder: string[]; onArticlePress: (article: Article) => void;
}) {
  const [activeTab, setActiveTab] = useState(categoryOrder[0] || 'model_research');
  const [showMore, setShowMore] = useState(false);

  const articles = categorizedArticles[activeTab] || [];
  const links = React.useMemo(() => articles.map(a => a.link).filter(Boolean), [articles]);
  const stats = useBatchStats(links);
  const first5 = articles.slice(0, 5);
  const more5 = articles.slice(5, 10);
  const visible = showMore ? [...first5, ...more5] : first5;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowMore(false);
  };

  return (
    <View style={{ marginBottom: 24 }}>
      {/* 카테고리 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10, marginBottom: 16 }}
      >
        {categoryOrder.map(catKey => {
          const isActive = catKey === activeTab;
          const color = CATEGORY_COLORS[catKey] || TEXT_SECONDARY;
          return (
            <Pressable
              key={catKey}
              onPress={() => handleTabChange(catKey)}
              accessibilityLabel={CATEGORY_NAMES[catKey] || catKey}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={{
                paddingHorizontal: 14, paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: isActive ? color : CARD,
                borderWidth: 1,
                borderColor: isActive ? color : BORDER,
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: '700',
                color: isActive ? '#FFF' : TEXT_SECONDARY,
              }}>
                {CATEGORY_NAMES[catKey] || catKey}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 세로 기사 리스트 */}
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        {visible.map((a, i) => (
          <Pressable
            key={`cat-${activeTab}-${i}-${a.link}`}
            onPress={() => onArticlePress(a)}
            accessibilityLabel={getTitle(a)}
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
              ) : null}
              <View style={{ flex: 1, padding: 14, justifyContent: 'space-between' }}>
                <View>
                  <SourceBadge sourceKey={a.source_key} />
                  <Text
                    style={{ fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, lineHeight: 20, marginTop: 6 }}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {getTitle(a)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{formatDate(a.published)}</Text>
                  <ArticleStats likes={stats[a.link]?.likes} views={stats[a.link]?.views} />
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {/* 더보기 */}
      {more5.length > 0 && !showMore && (
        <Pressable
          onPress={() => setShowMore(true)}
          accessibilityLabel={`${more5.length}개 더 보기`}
          accessibilityRole="button"
          style={{ alignItems: 'center', paddingVertical: 12, marginHorizontal: 16 }}
        >
          <View style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: BORDER, borderWidth: 1, borderColor: '#E5E7EB' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: TEXT_SECONDARY }}>
              +{more5.length}개 더보기
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

// ─── Section 3: 소스별 가로 스크롤 (한국 소스) ──────────────────────────
function SourceHScrollSection({
  sourceKey, articles, onArticlePress,
}: {
  sourceKey: string; articles: Article[]; onArticlePress: (article: Article) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const links = React.useMemo(() => articles.map(a => a.link).filter(Boolean), [articles]);
  const stats = useBatchStats(links);

  if (!articles || articles.length === 0) return null;

  const name = SOURCE_NAMES[sourceKey] || sourceKey;
  const color = SOURCE_COLORS[sourceKey] || TEXT_SECONDARY;
  const first5 = articles.slice(0, 5);
  const more5 = articles.slice(5, 10);
  const visible = showMore ? [...first5, ...more5] : first5;

  return (
    <View style={{ marginBottom: 32 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: color, marginRight: 8 }} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, flex: 1 }}>
          {name}
        </Text>
        <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{articles.length}개</Text>
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
              +{more5.length}개{'\n'}더보기
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

// ─── GeekNews 세로 리스트 ────────────────────────────────────────────────
function GeekNewsSection({ articles, onArticlePress }: { articles: Article[]; onArticlePress: (article: Article) => void }) {
  const [showMore, setShowMore] = useState(false);
  const links = React.useMemo(() => articles.map(a => a.link).filter(Boolean), [articles]);
  const stats = useBatchStats(links);
  if (!articles || articles.length === 0) return null;

  const first5 = articles.slice(0, 5);
  const more5 = articles.slice(5, 10);
  const visible = showMore ? [...first5, ...more5] : first5;
  const color = SOURCE_COLORS['geeknews'] || TEXT_SECONDARY;

  return (
    <View style={{ marginBottom: 32 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: color, marginRight: 8 }} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, flex: 1 }}>GeekNews</Text>
        <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{articles.length}개</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {visible.map((a, i) => (
          <React.Fragment key={`geeknews-${i}-${a.link}`}>
            <Pressable
              onPress={() => onArticlePress(a)}
              accessibilityLabel={getTitle(a)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: CARD,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: BORDER,
                padding: 16,
                marginBottom: 14,
                justifyContent: 'space-between',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{ fontSize: 13, fontWeight: '700', color: TEXT_PRIMARY, lineHeight: 20 }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {getTitle(a)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{formatDate(a.published)}</Text>
                <ArticleStats likes={stats[a.link]?.likes} views={stats[a.link]?.views} />
              </View>
            </Pressable>
            {i < visible.length - 1 && (
              <View style={{ height: 1, backgroundColor: '#E5E7EB', marginBottom: 14 }} />
            )}
          </React.Fragment>
        ))}
      </View>

      {!showMore && more5.length > 0 && (
        <Pressable onPress={() => setShowMore(true)} style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ fontSize: 12, color: TEXT_LIGHT }}>더보기 ({more5.length}개)</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── 메인 화면 ──────────────────────────────────────────────────────────
export default function NewsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [modalArticle, setModalArticle] = useState<Article | null>(null);
  const [commentArticleLink, setCommentArticleLink] = useState<string | null>(null);
  const { openDrawer, setActiveTab } = useDrawer();
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // ─── 새 구조 (3-Section) ───
  const highlights = newsData?.highlights ?? [];
  const categorizedArticles = newsData?.categorized_articles ?? {};
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
          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY }}>AI 트렌드</Text>
          {totalArticles > 0 && (
            <Text style={{ fontSize: 12, color: TEXT_LIGHT }}>
              {newsData?.updated_at
                ? `${new Date(newsData.updated_at.seconds ? newsData.updated_at.seconds * 1000 : newsData.updated_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 업데이트`
                : `${totalArticles}개 기사`}
            </Text>
          )}
        </View>
        <Pressable onPress={openDrawer} accessibilityLabel="메뉴 열기" accessibilityRole="button" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Menu size={22} color={TEXT_SECONDARY} />
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
            <Text style={{ color: TEXT_PRIMARY, fontWeight: '700', fontSize: 16, marginBottom: 8 }}>연결에 문제가 있어요</Text>
            <Text style={{ color: TEXT_LIGHT, fontSize: 14, textAlign: 'center', marginBottom: 20 }}>{error}</Text>
            <Pressable onPress={refresh} style={{ backgroundColor: '#000', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>다시 시도</Text>
            </Pressable>
          </View>
        ) : totalArticles === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ color: TEXT_LIGHT, fontSize: 14 }}>아직 뉴스가 없어요</Text>
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
              />
            ))}
          </>
        ) : (
          <>
            {/* Section 1: 하이라이트 */}
            <HighlightSection highlights={highlights} onArticlePress={handleArticlePress} />

            {/* Section 2: 카테고리 탭 + 세로 리스트 */}
            <CategoryTabSection
              categorizedArticles={categorizedArticles}
              categoryOrder={categoryOrder}
              onArticlePress={handleArticlePress}
            />

            {/* 구분선: 카테고리 → 소스별 */}
            {sourceOrder.some(key => (sourceArticles[key]?.length ?? 0) > 0) && (
              <View style={{ paddingHorizontal: 16, marginBottom: 20, marginTop: 16 }}>
                <View style={{ height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, marginBottom: 20 }} />
                <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT_PRIMARY }}>
                  소스별 뉴스
                </Text>
                <Text style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 4 }}>
                  한국 AI 미디어 소식
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
              />
            ))}

            {/* Section 4: GeekNews 세로 리스트 */}
            {(sourceArticles['geeknews']?.length ?? 0) > 0 && (
              <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
              </View>
            )}
            <GeekNewsSection articles={sourceArticles['geeknews'] || []} onArticlePress={handleArticlePress} />
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
    </SafeAreaView>
  );
}
