/**
 * AI 트렌드 뉴스 화면 — Figma 디자인 기반
 * 구조:
 *   1. 헤더: "A" 로고 + AI News + 검색 + 햄버거
 *   2. "오늘의 하이라이트" 섹션 — 히어로 카드 (그라디언트 배경)
 *   3. 가로 스크롤 섹션: 공식 발표 / 한국 AI / 큐레이션
 *   4. 카테고리 탭 (모델/연구 | 제품/도구 | 산업/비즈니스)
 *   5. 뉴스 카드 목록 (오른쪽 썸네일, 아코디언 → 요약 + 원문링크 + ReactionBar)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Linking,
  LayoutAnimation,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Search, Menu, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown, Clock, Calendar,
  ExternalLink, RefreshCw, Zap,
} from 'lucide-react-native';
import { useNews } from '@/hooks/useNews';
import { useDrawer } from '@/context/DrawerContext';
import { useReactions } from '@/hooks/useReactions';
import { ReactionBar } from '@/components/shared/ReactionBar';
import { NewsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import type { Article, NewsCategory, HorizontalArticle } from '@/lib/types';

// ─── 색상 / 상수 ───────────────────────────────────────────────────────────────
const PRIMARY = '#F43F5E';      // rose-500
const PRIMARY_LIGHT = '#FFF1F2'; // rose-50
const BG = '#F5F7FA';
const CARD = '#FFFFFF';

const CATEGORY_COLORS: Record<string, string> = {
  model_research:    '#F43F5E',
  product_tools:     '#10B981',
  industry_business: '#F59E0B',
  // 하위 호환
  core_tech:           '#F43F5E',
  dev_tools:           '#10B981',
  trend_insight:       '#F59E0B',
  models_architecture: '#F43F5E',
  agentic_reality:     '#F59E0B',
  opensource_code:     '#10B981',
  physical_ai:         '#F43F5E',
  policy_safety:       '#F59E0B',
};

const CATEGORY_LABELS: Record<string, string> = {
  model_research:    '모델/연구',
  product_tools:     '제품/도구',
  industry_business: '산업/비즈니스',
  // 하위 호환
  core_tech:           '모델/연구',
  dev_tools:           '제품/도구',
  trend_insight:       '산업/비즈니스',
  models_architecture: '모델/연구',
  agentic_reality:     '제품/도구',
  opensource_code:     '제품/도구',
  physical_ai:         '모델/연구',
  policy_safety:       '산업/비즈니스',
};

const TABS = [
  { key: 'model_research',    label: '모델/연구' },
  { key: 'product_tools',     label: '제품/도구' },
  { key: 'industry_business', label: '산업/비즈니스' },
] as const;

// 레거시 카테고리 → 신규 매핑
const LEGACY: Record<string, NewsCategory> = {
  core_tech:           'model_research',
  dev_tools:           'product_tools',
  trend_insight:       'industry_business',
  models_architecture: 'model_research',
  agentic_reality:     'product_tools',
  opensource_code:     'product_tools',
  physical_ai:         'model_research',
  policy_safety:       'industry_business',
};

function normCat(cat?: string): NewsCategory {
  if (!cat) return 'model_research';
  if (cat === 'model_research' || cat === 'product_tools' || cat === 'industry_business') return cat;
  return (LEGACY[cat] as NewsCategory) ?? 'model_research';
}

function catColor(cat?: string) { return CATEGORY_COLORS[normCat(cat)] ?? PRIMARY; }
function catLabel(cat?: string) { return CATEGORY_LABELS[normCat(cat)] ?? '기타'; }

function displayTitle(a: Article) { return a.summary ?? a.title; }

function formatDate(str?: string) {
  if (!str) return '';
  try { return new Date(str).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '. '); }
  catch { return str.slice(0, 10); }
}

// 카테고리별 그라디언트 색상 (이미지 대체용)
const CAT_GRADIENTS: Record<string, [string, string]> = {
  model_research:    ['#1E3A5F', '#0F1F3D'],
  product_tools:     ['#064E3B', '#022C22'],
  industry_business: ['#78350F', '#3D1A05'],
  // 하위 호환
  core_tech:     ['#1E3A5F', '#0F1F3D'],
  dev_tools:     ['#064E3B', '#022C22'],
  trend_insight: ['#78350F', '#3D1A05'],
};

// ─── 좋아요/싫어요 카운트 표시 (읽기 전용) ────────────────────────────────────
function LikeCount({ itemId }: { itemId: string }) {
  const { likes, dislikes } = useReactions('news', itemId);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <ThumbsUp size={13} color="#9CA3AF" />
        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>{likes}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <ThumbsDown size={13} color="#9CA3AF" />
        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>{dislikes}</Text>
      </View>
    </View>
  );
}

// ─── 가로 스크롤 카드 (공식 발표 / 한국 AI / 큐레이션) ──────────────────────
function HorizontalCard({ article }: { article: HorizontalArticle }) {
  const color = article.brand_color ?? PRIMARY;
  return (
    <Pressable
      onPress={() => article.link && Linking.openURL(article.link)}
      style={{
        width: 220, backgroundColor: CARD, borderRadius: 14, overflow: 'hidden',
        marginRight: 12, elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6,
      }}
    >
      {/* 상단 컬러 바 */}
      <View style={{ height: 4, backgroundColor: color }} />
      <View style={{ padding: 12 }}>
        {/* 소스 배지 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800' }}>{article.source.charAt(0)}</Text>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: color }}>{article.source}</Text>
        </View>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', lineHeight: 19 }} numberOfLines={3}>
          {article.title}
        </Text>
      </View>
    </Pressable>
  );
}

function HorizontalSection({
  title,
  articles,
  color = PRIMARY,
}: {
  title: string;
  articles: HorizontalArticle[];
  color?: string;
}) {
  if (!articles || articles.length === 0) return null;
  return (
    <View style={{ marginBottom: 20 }}>
      <SectionHeader title={title} color={color} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
      >
        {articles.map((a, i) => (
          <HorizontalCard key={`${a.source}-${i}`} article={a} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── 섹션 헤더 (컬러 왼쪽 바) ────────────────────────────────────────────────
function SectionHeader({ title, color = PRIMARY }: { title: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 12 }}>
      <View style={{ width: 4, height: 22, backgroundColor: color, borderRadius: 2 }} />
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>{title}</Text>
    </View>
  );
}

// ─── 히어로 하이라이트 카드 ───────────────────────────────────────────────────
function HeroCard({ article }: { article: Article }) {
  const [expanded, setExpanded] = useState(false);
  const grad = CAT_GRADIENTS[normCat(article.category)] ?? ['#1E3A5F', '#0F1F3D'];
  const itemId = article.link ?? article.title;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(p => !p);
  };

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 20, borderRadius: 18, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12 }}>
      {/* 이미지 영역 (그라디언트 배경) */}
      <Pressable onPress={toggle} style={{ backgroundColor: grad[0], minHeight: 190, padding: 16, justifyContent: 'flex-end' }}>
        {/* 그라디언트 오버레이 패턴 */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: grad[1], opacity: 0.45 }} />

        {/* 배경 장식 원 */}
        <View style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.04)' }} />
        <View style={{ position: 'absolute', top: 20, right: 40, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)' }} />

        {/* HOT 배지 + 날짜 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <View style={{ backgroundColor: PRIMARY, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>HOT</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} color="rgba(255,255,255,0.7)" />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{formatDate(article.published)}</Text>
          </View>
        </View>

        {/* 제목 */}
        <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800', lineHeight: 30, marginBottom: 12 }}>
          {displayTitle(article)}
        </Text>

        {/* 통계 행 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <LikeCount itemId={itemId} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Clock size={12} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>5분</Text>
          </View>
          <View style={{ marginLeft: 'auto', width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            {expanded ? <ChevronUp size={13} color="#FFFFFF" /> : <ChevronDown size={13} color="#FFFFFF" />}
          </View>
        </View>
      </Pressable>

      {/* 펼침: 요약 + 원문 + ReactionBar */}
      {expanded && (
        <View style={{ backgroundColor: CARD, padding: 16 }}>
          {article.impact_comment && (
            <View style={{ flexDirection: 'row', gap: 8, backgroundColor: PRIMARY_LIGHT, borderRadius: 10, padding: 10, marginBottom: 10 }}>
              <Zap size={13} color={PRIMARY} style={{ marginTop: 2 }} />
              <Text style={{ color: '#BE123C', fontSize: 13, flex: 1, lineHeight: 19 }}>{article.impact_comment}</Text>
            </View>
          )}
          {(article.summary || article.description) && (
            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 12 }}>
              {article.description ?? article.summary}
            </Text>
          )}
          {article.link && (
            <Pressable onPress={() => Linking.openURL(article.link)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#111827', borderRadius: 12, paddingVertical: 12, marginBottom: 12 }}>
              <ExternalLink size={14} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>원문 보기</Text>
            </Pressable>
          )}
          <ReactionBar itemType="news" itemId={itemId} shareText={`${displayTitle(article)}\n\n${article.link ?? ''}`} shareTitle={displayTitle(article)} />
        </View>
      )}
    </View>
  );
}

// ─── 뉴스 카드 (오른쪽 썸네일) ──────────────────────────────────────────────
function NewsCard({ article, isLast }: { article: Article; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const cc = catColor(article.category);
  const cl = catLabel(article.category);
  const itemId = article.link ?? article.title;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(p => !p);
  };

  // 썸네일 박스 (이미지 없을 경우 카테고리별 색상 박스)
  const thumbColor = cc;

  return (
    <View style={{ borderBottomWidth: isLast ? 0 : 1, borderBottomColor: '#F3F4F6' }}>
      <Pressable onPress={toggle} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, paddingHorizontal: 16, gap: 12 }}>
        {/* 왼쪽: 텍스트 */}
        <View style={{ flex: 1 }}>
          {/* 카테고리 배지 + 날짜 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <View style={{ backgroundColor: PRIMARY_LIGHT, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: `${PRIMARY}30` }}>
              <Text style={{ color: PRIMARY, fontSize: 11, fontWeight: '700' }}>{cl}</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#9CA3AF' }}>· {formatDate(article.published)}</Text>
          </View>

          {/* 제목 */}
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', lineHeight: 22, marginBottom: 8 }} numberOfLines={expanded ? undefined : 2}>
            {displayTitle(article)}
          </Text>

          {/* 좋아요/싫어요 */}
          <LikeCount itemId={itemId} />
        </View>

        {/* 오른쪽: 썸네일 */}
        <View style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: thumbColor, overflow: 'hidden', flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.12)' }} />
          <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800', opacity: 0.6 }}>
            {cl.charAt(0)}
          </Text>
          {/* 펼침 인디케이터 */}
          <View style={{ position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}>
            {expanded ? <ChevronUp size={10} color="#FFFFFF" /> : <ChevronDown size={10} color="#FFFFFF" />}
          </View>
        </View>
      </Pressable>

      {/* 펼침: impact + 요약 + 원문 + ReactionBar */}
      {expanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          {article.impact_comment && (
            <View style={{ flexDirection: 'row', gap: 8, backgroundColor: PRIMARY_LIGHT, borderRadius: 10, padding: 10, marginBottom: 10 }}>
              <Zap size={11} color={PRIMARY} style={{ marginTop: 2 }} />
              <Text style={{ color: '#BE123C', fontSize: 12, flex: 1, lineHeight: 18 }}>{article.impact_comment}</Text>
            </View>
          )}
          {article.description && (
            <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 10 }}>{article.description}</Text>
          )}
          {article.link && (
            <Pressable onPress={() => Linking.openURL(article.link)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' }}>
              <ExternalLink size={13} color={cc} />
              <Text style={{ color: cc, fontSize: 13, fontWeight: '600' }}>원문 보기</Text>
            </Pressable>
          )}
          <ReactionBar itemType="news" itemId={itemId} shareText={`${displayTitle(article)}\n\n${article.link ?? ''}`} shareTitle={displayTitle(article)} />
        </View>
      )}
    </View>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────
export default function NewsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const { selectedDates, newsCategory, setNewsCategory, openDrawer, setActiveTab } = useDrawer();
  const selectedDate = selectedDates.news;

  useFocusEffect(useCallback(() => {
    setActiveTab('news');
  }, [setActiveTab]));

  const { newsData, loading, error, refresh } = useNews(selectedDate);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // 카테고리 + 레거시 매핑 병합
  const articlesByCategory: Record<string, Article[]> = { model_research: [], product_tools: [], industry_business: [] };
  (newsData?.articles ?? []).forEach(a => {
    const k = normCat(a.category);
    if (articlesByCategory[k]) articlesByCategory[k].push(a);
  });

  // 가로 스크롤 섹션 데이터
  const hs = newsData?.horizontal_sections ?? {};

  const highlightTitle = newsData?.highlight?.title;
  const categoryArticles = (articlesByCategory[newsCategory] ?? []).filter(a => a.title !== highlightTitle);

  const dateLabel = selectedDate
    ? new Date(selectedDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    : '오늘';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── 헤더 ─────────────────────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: BG }}>
        {/* 앱 로고 */}
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>A</Text>
        </View>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: '#111827' }}>AI News</Text>
        <Pressable
          onPress={() => setShowSearch(s => !s)}
          style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}
        >
          <Search size={20} color="#374151" />
        </Pressable>
        <Pressable
          onPress={openDrawer}
          style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}
        >
          <Menu size={22} color="#374151" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={PRIMARY} />}
      >
        {loading ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <NewsCardSkeleton />
            <NewsCardSkeleton />
            <NewsCardSkeleton />
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
            {/* ── 오늘의 하이라이트 ──────────────────────────────────────── */}
            {newsData?.highlight && (
              <View style={{ marginBottom: 8 }}>
                <View style={{ paddingTop: 8, paddingBottom: 10 }}>
                  <SectionHeader title="오늘의 하이라이트" color={PRIMARY} />
                </View>
                <HeroCard article={newsData.highlight} />
              </View>
            )}

            {/* ── 가로 스크롤 섹션 ────────────────────────────────────── */}
            <HorizontalSection
              title="공식 발표"
              articles={hs.official_announcements ?? []}
              color="#7C3AED"
            />
            <HorizontalSection
              title="한국 AI"
              articles={hs.korean_ai ?? []}
              color="#E53935"
            />
            <HorizontalSection
              title="큐레이션"
              articles={hs.curation ?? []}
              color="#0EA5E9"
            />

            {/* ── 카테고리 탭 + 기사 목록 ───────────────────────────────── */}
            <View style={{ marginHorizontal: 16, backgroundColor: CARD, borderRadius: 18, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, marginBottom: 20 }}>
              {/* 탭 */}
              <View style={{ flexDirection: 'row', padding: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                {TABS.map(tab => {
                  const isActive = newsCategory === tab.key;
                  return (
                    <Pressable
                      key={tab.key}
                      onPress={() => setNewsCategory(tab.key)}
                      style={{
                        flex: 1, alignItems: 'center', paddingVertical: 9,
                        borderRadius: 12,
                        backgroundColor: isActive ? PRIMARY : 'transparent',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isActive ? '#FFFFFF' : '#6B7280' }}>
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* 기사 목록 */}
              {categoryArticles.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ color: '#D1D5DB', fontSize: 14 }}>이 카테고리엔 아직 기사가 없어요</Text>
                </View>
              ) : (
                categoryArticles.map((article, i) => (
                  <NewsCard
                    key={`${article.title}-${i}`}
                    article={article}
                    isLast={i === categoryArticles.length - 1}
                  />
                ))
              )}
            </View>

            <View style={{ height: 20 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
