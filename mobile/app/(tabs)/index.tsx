/**
 * AI 트렌드 뉴스 화면
 * 구조:
 *   1. 헤더: "A" 로고 + AI News + 검색 + 햄버거
 *   2. "오늘의 하이라이트" — 히어로 카드 (탭 → 상세 모달)
 *   3. 카테고리 탭 (모델/연구 | 제품/도구 | 산업/비즈니스)
 *   4. 뉴스 목록: 제목 + 날짜 + 좋아요/싫어요 수 (탭 → 상세 모달)
 *   5. 가로 스크롤 섹션: 공식 발표 / 한국 AI / GeekNews / 큐레이션
 *
 * 상세 모달: 요약 + 원문링크 + 좋아요/싫어요 + 공유 + 댓글
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Linking,
  StatusBar,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Search, Menu, ChevronDown, ChevronRight,
  ThumbsUp, ThumbsDown, Clock, Calendar,
  ExternalLink, RefreshCw, Zap, X,
} from 'lucide-react-native';
import { useNews } from '@/hooks/useNews';
import { useDrawer } from '@/context/DrawerContext';
import { useReactions } from '@/hooks/useReactions';
import { ReactionBar } from '@/components/shared/ReactionBar';
import { NewsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import type { Article, NewsCategory, HorizontalArticle } from '@/lib/types';

// ─── 색상 / 상수 ───────────────────────────────────────────────────────────────
const PRIMARY = '#F43F5E';
const PRIMARY_LIGHT = '#FFF1F2';
const BG = '#F5F7FA';
const CARD = '#FFFFFF';

const CATEGORY_COLORS: Record<string, string> = {
  model_research: '#F43F5E',
  product_tools: '#10B981',
  industry_business: '#F59E0B',
  core_tech: '#F43F5E',
  dev_tools: '#10B981',
  trend_insight: '#F59E0B',
  models_architecture: '#F43F5E',
  agentic_reality: '#F59E0B',
  opensource_code: '#10B981',
  physical_ai: '#F43F5E',
  policy_safety: '#F59E0B',
};

const CATEGORY_LABELS: Record<string, string> = {
  model_research: '모델/연구',
  product_tools: '제품/도구',
  industry_business: '산업/비즈니스',
  core_tech: '모델/연구',
  dev_tools: '제품/도구',
  trend_insight: '산업/비즈니스',
  models_architecture: '모델/연구',
  agentic_reality: '제품/도구',
  opensource_code: '제품/도구',
  physical_ai: '모델/연구',
  policy_safety: '산업/비즈니스',
};

const TABS = [
  { key: 'model_research', label: '모델/연구' },
  { key: 'product_tools', label: '제품/도구' },
  { key: 'industry_business', label: '산업/비즈니스' },
] as const;

const LEGACY: Record<string, NewsCategory> = {
  core_tech: 'model_research',
  dev_tools: 'product_tools',
  trend_insight: 'industry_business',
  models_architecture: 'model_research',
  agentic_reality: 'product_tools',
  opensource_code: 'product_tools',
  physical_ai: 'model_research',
  policy_safety: 'industry_business',
};

function normCat(cat?: string): NewsCategory {
  if (!cat) return 'model_research';
  if (cat === 'model_research' || cat === 'product_tools' || cat === 'industry_business') return cat;
  return (LEGACY[cat] as NewsCategory) ?? 'model_research';
}

function catColor(cat?: string) { return CATEGORY_COLORS[normCat(cat)] ?? PRIMARY; }
function catLabel(cat?: string) { return CATEGORY_LABELS[normCat(cat)] ?? '기타'; }
function displayTitle(a: Article) { return a.display_title || a.title; }

function formatDate(str?: string) {
  if (!str) return '';
  try {
    return new Date(str).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\. /g, '/').replace('.', '');
  } catch { return str.slice(5, 10); }
}

// 카테고리별 그라디언트 (이미지 없을 때)
const CAT_GRADIENTS: Record<string, [string, string]> = {
  model_research: ['#1E3A5F', '#0F1F3D'],
  product_tools: ['#064E3B', '#022C22'],
  industry_business: ['#78350F', '#3D1A05'],
  core_tech: ['#1E3A5F', '#0F1F3D'],
  dev_tools: ['#064E3B', '#022C22'],
  trend_insight: ['#78350F', '#3D1A05'],
};

// ─── 좋아요/싫어요 카운트 (읽기 전용) ──────────────────────────────────────────
function LikeCount({ itemId }: { itemId: string }) {
  const { likes, dislikes } = useReactions('news', itemId);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <ThumbsUp size={12} color="#9CA3AF" />
        <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>{likes}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <ThumbsDown size={12} color="#9CA3AF" />
        <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>{dislikes}</Text>
      </View>
    </View>
  );
}

// ─── 섹션 헤더 ────────────────────────────────────────────────────────────────
function SectionHeader({ title, color = PRIMARY }: { title: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 12 }}>
      <View style={{ width: 4, height: 22, backgroundColor: color, borderRadius: 2 }} />
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>{title}</Text>
    </View>
  );
}

// ─── 가로 스크롤 상세 모달 ────────────────────────────────────────────────────
function HorizontalDetailModal({
  article, visible, onClose,
}: { article: HorizontalArticle | null; visible: boolean; onClose: () => void }) {
  if (!article) return null;
  const color = article.brand_color ?? PRIMARY;
  const title = article.display_title || article.title;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: CARD }} edges={['top']}>
        {/* 헤더 */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
        }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color }}>{article.source}</Text>
          </View>
          <Pressable
            onPress={onClose}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
          {/* 제목 */}
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', lineHeight: 30, marginBottom: 16 }}>
            {title}
          </Text>

          {/* 요약/설명 */}
          {article.description ? (
            <Text style={{ fontSize: 15, color: '#374151', lineHeight: 25, marginBottom: 24 }}>
              {article.description}
            </Text>
          ) : null}

          {/* 원문 보기 버튼 (하단) */}
          {article.link ? (
            <Pressable
              onPress={() => Linking.openURL(article.link)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: pressed ? '#1F2937' : '#111827',
                borderRadius: 14, paddingVertical: 14, marginTop: 'auto' as any,
              })}
            >
              <ExternalLink size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>원문 보기</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── 가로 스크롤 카드 ─────────────────────────────────────────────────────────
function HorizontalCard({ article, onPress }: { article: HorizontalArticle; onPress: () => void }) {
  const color = article.brand_color ?? PRIMARY;
  const title = article.display_title || article.title;
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 210,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: `${color}40`,
        backgroundColor: CARD,
        marginRight: 12,
        shadowColor: color,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View style={{ height: 3, backgroundColor: color, borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800' }}>{article.source.charAt(0)}</Text>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '700', color }}>{article.source}</Text>
        </View>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', lineHeight: 19 }} numberOfLines={3}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

function HorizontalSection({
  title, articles, color = PRIMARY, showAll = false, onShowAll, limit = 5, onCardPress,
}: {
  title: string; articles: HorizontalArticle[]; color?: string; showAll?: boolean;
  onShowAll?: () => void; limit?: number; onCardPress?: (a: HorizontalArticle) => void;
}) {
  if (!articles || articles.length === 0) return null;
  const visible = showAll ? articles : articles.slice(0, limit);
  return (
    <View style={{ marginBottom: 20 }}>
      <SectionHeader title={title} color={color} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}>
        {visible.map((a, i) => (
          <HorizontalCard key={`${a.source}-${i}`} article={a} onPress={() => onCardPress?.(a)} />
        ))}
        {!showAll && articles.length > limit && onShowAll && (
          <Pressable onPress={onShowAll} style={{ width: 80, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ borderRadius: 20, borderWidth: 1.5, borderColor: color, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color, fontSize: 12, fontWeight: '700' }}>더보기</Text>
            </View>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

// ─── 뉴스 상세 모달 ───────────────────────────────────────────────────────────
function NewsDetailModal({
  article, visible, onClose,
}: { article: Article | null; visible: boolean; onClose: () => void }) {
  if (!article) return null;
  const itemId = article.link ?? article.title;
  const cc = catColor(article.category);
  const grad = CAT_GRADIENTS[normCat(article.category)] ?? ['#1E3A5F', '#0F1F3D'];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: CARD }} edges={['top']}>
        {/* ── 헤더 ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingHorizontal: 16, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
        }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: `${cc}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: `${cc}30` }}>
              <Text style={{ color: cc, fontSize: 12, fontWeight: '700' }}>{catLabel(article.category)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} color="#9CA3AF" />
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{formatDate(article.published)}</Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          {/* ── 제목 ── */}
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', lineHeight: 32, marginBottom: 16 }}>
            {displayTitle(article)}
          </Text>

          {/* ── impact_comment ── */}
          {article.impact_comment ? (
            <View style={{ flexDirection: 'row', gap: 8, backgroundColor: PRIMARY_LIGHT, borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <Zap size={14} color={PRIMARY} style={{ marginTop: 2 }} />
              <Text style={{ color: '#BE123C', fontSize: 14, flex: 1, lineHeight: 20, fontWeight: '500' }}>
                {article.impact_comment}
              </Text>
            </View>
          ) : null}

          {/* ── 요약 ── */}
          {(article.summary || article.description) ? (
            <Text style={{ fontSize: 15, color: '#374151', lineHeight: 25, marginBottom: 20 }}>
              {article.summary ?? article.description}
            </Text>
          ) : null}

          {/* ── 출처 / 읽기 시간 ── */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingBottom: 16, marginBottom: 16,
            borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
          }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cc }} />
            <Text style={{ fontSize: 13, color: '#6B7280', flex: 1 }}>{article.source}</Text>
            {article.reading_time && article.reading_time > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Clock size={12} color="#9CA3AF" />
                <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{article.reading_time}분 읽기</Text>
              </View>
            ) : null}
          </View>

          {/* ── 원문 보기 버튼 ── */}
          {article.link ? (
            <Pressable
              onPress={() => Linking.openURL(article.link)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: pressed ? '#1F2937' : '#111827',
                borderRadius: 14, paddingVertical: 14, marginBottom: 20,
              })}
            >
              <ExternalLink size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>원문 보기</Text>
            </Pressable>
          ) : null}

          {/* ── 반응 바: 좋아요 + 댓글 + 공유 ── */}
          <ReactionBar
            itemType="news"
            itemId={itemId}
            shareText={`${displayTitle(article)}\n\n${article.link ?? ''}`}
            shareTitle={displayTitle(article)}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── 히어로 하이라이트 카드 (탭 → 상세 모달) ─────────────────────────────────
function HeroCard({ article, onPress }: { article: Article; onPress: () => void }) {
  const grad = CAT_GRADIENTS[normCat(article.category)] ?? ['#1E3A5F', '#0F1F3D'];
  const itemId = article.link ?? article.title;

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          borderRadius: 18,
          borderWidth: 2,
          borderColor: '#a78bfa',
          backgroundColor: CARD,
          shadowColor: '#60a5fa',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: pressed ? 0.15 : 0.3,
          shadowRadius: 12,
          elevation: 8,
          opacity: pressed ? 0.95 : 1,
          overflow: 'hidden',
        })}
      >
        {/* 이미지 / 그라디언트 배경 */}
        <View style={{ backgroundColor: grad[0], minHeight: 180, padding: 16, justifyContent: 'flex-end' }}>
          {article.image_url ? (
            <>
              <Image source={{ uri: article.image_url }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} resizeMode="cover" />
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' }} />
            </>
          ) : (
            <>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: grad[1], opacity: 0.45 }} />
              <View style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.04)' }} />
              <View style={{ position: 'absolute', top: 20, right: 40, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            </>
          )}

          {/* HOT 배지 + 날짜 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <View style={{ backgroundColor: '#60a5fa', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>⭐ HOT</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} color="rgba(255,255,255,0.7)" />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{formatDate(article.published)}</Text>
            </View>
          </View>

          {/* 제목 */}
          <Text style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '800', lineHeight: 29, marginBottom: 12 }}>
            {displayTitle(article)}
          </Text>

          {/* 하단: 소스 + 좋아요 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{article.source}</Text>
            <LikeCount itemId={itemId} />
            <View style={{ marginLeft: 'auto' }}>
              <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// ─── 뉴스 목록 아이템 (간결: 제목 + 날짜 + 좋아요/싫어요) ────────────────────
function NewsListItem({
  article, isLast, onPress,
}: { article: Article; isLast: boolean; onPress: () => void }) {
  const cc = catColor(article.category);
  const itemId = article.link ?? article.title;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
        gap: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: pressed ? '#FAFAFA' : CARD,
      })}
    >
      {/* 카테고리 컬러 바 */}
      <View style={{ width: 3, height: 42, borderRadius: 2, backgroundColor: cc, flexShrink: 0 }} />

      {/* 텍스트 영역 */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 20, marginBottom: 4 }}
          numberOfLines={2}
        >
          {displayTitle(article)}
        </Text>
        {(article.impact_comment || article.summary) ? (
          <Text
            style={{ fontSize: 12, color: '#6B7280', lineHeight: 17, marginBottom: 5 }}
            numberOfLines={1}
          >
            {article.impact_comment || article.summary?.slice(0, 70)}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{formatDate(article.published)}</Text>
          <LikeCount itemId={itemId} />
        </View>
      </View>

      {/* 화살표 */}
      <ChevronRight size={15} color="#D1D5DB" />
    </Pressable>
  );
}

// ─── 공식 발표 세로 행 (3개) ─────────────────────────────────────────────────
function OfficialAnnouncementSection({
  articles, onCardPress,
}: { articles: HorizontalArticle[]; onCardPress: (a: HorizontalArticle) => void }) {
  if (!articles || articles.length === 0) return null;
  const visible = articles.slice(0, 3);
  return (
    <View style={{ marginBottom: 20 }}>
      <SectionHeader title="💫 공식 발표" color="#7C3AED" />
      <View style={{ marginHorizontal: 16, gap: 10 }}>
        {visible.map((a, i) => {
          const color = a.brand_color ?? '#7C3AED';
          const title = a.display_title || a.title;
          return (
            <Pressable
              key={`official-${i}`}
              onPress={() => onCardPress(a)}
              style={({ pressed }) => ({
                backgroundColor: CARD,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: `${color}30`,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                shadowColor: color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 2,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              {/* 소스 아바타 */}
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: `${color}15`,
                borderWidth: 1.5, borderColor: `${color}40`,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Text style={{ color, fontSize: 14, fontWeight: '800' }}>{a.source.charAt(0)}</Text>
              </View>
              {/* 텍스트 */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color, marginBottom: 2 }}>{a.source}</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 20 }} numberOfLines={2}>
                  {title}
                </Text>
              </View>
              <ChevronRight size={15} color="#D1D5DB" />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────
export default function NewsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showAllMap, setShowAllMap] = useState<Record<string, boolean>>({});
  const [showAllHs, setShowAllHs] = useState<Record<string, boolean>>({});
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedHArticle, setSelectedHArticle] = useState<HorizontalArticle | null>(null);
  const [hDetailVisible, setHDetailVisible] = useState(false);

  const { newsCategory, setNewsCategory, openDrawer, setActiveTab } = useDrawer();

  useFocusEffect(useCallback(() => {
    setActiveTab('news');
  }, [setActiveTab]));

  const { newsData, loading, error, refresh } = useNews();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const openDetail = (article: Article) => {
    setSelectedArticle(article);
    setDetailVisible(true);
  };

  const closeDetail = () => setDetailVisible(false);
  const openHDetail = (article: HorizontalArticle) => { setSelectedHArticle(article); setHDetailVisible(true); };

  // 카테고리별 기사 분류
  const articlesByCategory: Record<string, Article[]> = { model_research: [], product_tools: [], industry_business: [] };
  (newsData?.articles ?? []).forEach(a => {
    const k = normCat(a.category);
    if (articlesByCategory[k]) articlesByCategory[k].push(a);
  });

  const hs = newsData?.horizontal_sections ?? {};
  const highlightTitle = newsData?.highlight?.title;
  const categoryArticles = (articlesByCategory[newsCategory] ?? []).filter(a => a.title !== highlightTitle);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── 헤더 ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: BG }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>A</Text>
        </View>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: '#111827' }}>AI News</Text>
        <Pressable onPress={openDrawer} style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
          <Menu size={22} color="#374151" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={PRIMARY} />}
      >
        {loading ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <NewsCardSkeleton /><NewsCardSkeleton /><NewsCardSkeleton />
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: PRIMARY_LIGHT, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <RefreshCw size={28} color={PRIMARY} />
            </View>
            <Text style={{ color: '#111827', fontWeight: '700', fontSize: 16, marginBottom: 8 }}>연결에 문제가 있어요</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>{error}</Text>
            <Pressable onPress={refresh} style={{ backgroundColor: PRIMARY, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* ── 1. 오늘의 하이라이트 ── */}
            {newsData?.highlight ? (
              <View style={{ marginBottom: 8 }}>
                <View style={{ paddingTop: 8, paddingBottom: 10 }}>
                  <SectionHeader title="⭐ 오늘의 하이라이트" color="#60a5fa" />
                </View>
                <HeroCard article={newsData.highlight} onPress={() => openDetail(newsData.highlight!)} />
              </View>
            ) : null}

            {/* ── 2. 카테고리 탭 + 뉴스 목록 ── */}
            <View style={{
              marginHorizontal: 16,
              backgroundColor: CARD,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: '#e0e7ff',
              overflow: 'hidden',
              shadowColor: '#a78bfa',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 6,
              marginBottom: 20,
            }}>
              {/* 탭 */}
              <View style={{ flexDirection: 'row', padding: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fafafa' }}>
                {TABS.map(tab => {
                  const isActive = newsCategory === tab.key;
                  return (
                    <Pressable
                      key={tab.key}
                      onPress={() => setNewsCategory(tab.key)}
                      style={{ flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 12, backgroundColor: isActive ? '#60a5fa' : 'transparent' }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isActive ? '#FFFFFF' : '#6B7280' }}>
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* 뉴스 목록 */}
              {categoryArticles.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ color: '#D1D5DB', fontSize: 14 }}>이 카테고리엔 아직 기사가 없어요</Text>
                </View>
              ) : (() => {
                const showAll = showAllMap[newsCategory] ?? false;
                const visible = showAll ? categoryArticles : categoryArticles.slice(0, 5);
                return (
                  <>
                    {visible.map((article, i) => (
                      <NewsListItem
                        key={`${article.title}-${i}`}
                        article={article}
                        isLast={i === visible.length - 1 && (showAll || categoryArticles.length <= 5)}
                        onPress={() => openDetail(article)}
                      />
                    ))}
                    {!showAll && categoryArticles.length > 5 && (
                      <Pressable
                        onPress={() => setShowAllMap(prev => ({ ...prev, [newsCategory]: true }))}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}
                      >
                        <Text style={{ color: '#60a5fa', fontWeight: '700', fontSize: 14 }}>더보기</Text>
                        <ChevronDown size={14} color="#60a5fa" />
                      </Pressable>
                    )}
                  </>
                );
              })()}
            </View>

            {/* ── 3. 공식 발표 세로 + 가로 스크롤 섹션 ── */}
            <OfficialAnnouncementSection
              articles={hs.official_announcements ?? []}
              onCardPress={openHDetail}
            />
            <HorizontalSection
              title="🇰🇷 한국 AI"
              articles={hs.korean_ai ?? []}
              color="#E53935"
              showAll={showAllHs['korean'] ?? false}
              onShowAll={() => setShowAllHs(prev => ({ ...prev, korean: true }))}
              onCardPress={openHDetail}
            />
            <HorizontalSection
              title="🟠 GeekNews"
              articles={hs.geeknews ?? []}
              color="#FF6B35"
              showAll={showAllHs['geeknews'] ?? false}
              onShowAll={() => setShowAllHs(prev => ({ ...prev, geeknews: true }))}
              onCardPress={openHDetail}
            />
            <HorizontalSection
              title="📚 큐레이션"
              articles={hs.curation ?? []}
              color="#0EA5E9"
              showAll={showAllHs['curation'] ?? false}
              onShowAll={() => setShowAllHs(prev => ({ ...prev, curation: true }))}
              onCardPress={openHDetail}
            />

            <View style={{ height: 20 }} />
          </>
        )}
      </ScrollView>

      {/* ── 뉴스 상세 모달 ── */}
      <NewsDetailModal article={selectedArticle} visible={detailVisible} onClose={closeDetail} />
      {/* ── 가로 스크롤 카드 상세 모달 ── */}
      <HorizontalDetailModal article={selectedHArticle} visible={hDetailVisible} onClose={() => setHDetailVisible(false)} />
    </SafeAreaView>
  );
}
