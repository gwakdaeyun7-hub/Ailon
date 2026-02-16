/**
 * AI 트렌드 뉴스 화면
 * 구조:
 *   1. 하이라이트 카드 (최고 점수 기사 1개, 아코디언)
 *   2. 카테고리 버튼 3개 (core_tech / dev_tools / trend_insight)
 *   3. 선택 카테고리 기사 목록 — 제목만 표시, 탭 시 요약+원문링크+ReactionBar 펼침
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  ExternalLink, Zap, Newspaper,
  RefreshCw, Menu, ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { useNews } from '@/hooks/useNews';
import { useDrawer } from '@/context/DrawerContext';
import { ReactionBar } from '@/components/shared/ReactionBar';
import { NewsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import type { Article, NewsCategory } from '@/lib/types';
import { NEWS_CATEGORY_COLORS } from '@/lib/types';

// ─── 3개 핵심 카테고리 ────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'core_tech' as NewsCategory, label: '🔬 모델·논문' },
  { key: 'dev_tools' as NewsCategory, label: '🛠 개발·도구' },
  { key: 'trend_insight' as NewsCategory, label: '📈 트렌드' },
];

// 레거시 카테고리 → 새 카테고리 매핑
const LEGACY_MAP: Record<string, NewsCategory> = {
  models_architecture: 'core_tech',
  agentic_reality: 'trend_insight',
  opensource_code: 'dev_tools',
  physical_ai: 'core_tech',
  policy_safety: 'trend_insight',
};

function normalizeCategory(cat?: string): NewsCategory {
  if (!cat) return 'core_tech';
  if (cat === 'core_tech' || cat === 'dev_tools' || cat === 'trend_insight') return cat;
  return LEGACY_MAP[cat] ?? 'core_tech';
}

function getCategoryColor(category?: string): string {
  const norm = normalizeCategory(category);
  return NEWS_CATEGORY_COLORS[norm] ?? '#E53935';
}

// 기사 흥미로운 제목: 한국어 요약이 있으면 우선, 없으면 원문 제목
function getDisplayTitle(article: Article): string {
  return article.summary ?? article.title;
}

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
};

// ─── 하이라이트 카드 (아코디언) ──────────────────────────────────────────────
function HighlightCard({ article }: { article: Article }) {
  const [expanded, setExpanded] = useState(false);
  const catLabel = CATEGORIES.find(c => c.key === normalizeCategory(article.category))?.label;
  const itemId = article.link ?? article.title;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((p) => !p);
  };

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 20, borderRadius: 20, overflow: 'hidden', ...cardShadow }}>
      {/* 상단 배너 */}
      <View style={{ backgroundColor: '#E53935', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Zap size={13} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>오늘의 주목 기사</Text>
        {catLabel && (
          <View style={{ marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>{catLabel}</Text>
          </View>
        )}
      </View>

      {/* 접힌 상태: 제목 + 출처 + 펼침 버튼 */}
      <Pressable onPress={toggle} style={{ backgroundColor: '#FFFFFF', padding: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: '#212121', lineHeight: 26, marginBottom: 10 }}>
          {getDisplayTitle(article)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#BDBDBD', fontSize: 12 }}>{article.source}</Text>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' }}>
            {expanded ? <ChevronUp size={14} color="#E53935" /> : <ChevronDown size={14} color="#E53935" />}
          </View>
        </View>
      </Pressable>

      {/* 펼친 상태: impact + 요약 + 원문링크 + ReactionBar */}
      {expanded && (
        <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#F5F5F5' }}>
          {article.impact_comment && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFEBEE', borderRadius: 10, padding: 10, marginTop: 12, marginBottom: 10 }}>
              <Zap size={11} color="#E53935" style={{ marginTop: 3 }} />
              <Text style={{ color: '#C62828', fontSize: 13, flex: 1, lineHeight: 19 }}>{article.impact_comment}</Text>
            </View>
          )}
          {(article.summary || article.description) && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 11, color: '#BDBDBD', fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>요약</Text>
              <Text style={{ fontSize: 14, color: '#424242', lineHeight: 22 }}>
                {article.summary ?? article.description}
              </Text>
            </View>
          )}
          {article.link && (
            <Pressable
              onPress={() => Linking.openURL(article.link)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#212121', borderRadius: 12, paddingVertical: 12, marginBottom: 12 }}
            >
              <ExternalLink size={14} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>원문 보기</Text>
            </Pressable>
          )}
          <ReactionBar
            itemType="news"
            itemId={itemId}
            shareText={`${getDisplayTitle(article)}\n\n${article.link ?? ''}`}
            shareTitle={getDisplayTitle(article)}
          />
        </View>
      )}
    </View>
  );
}

// ─── 기사 아코디언 아이템 ─────────────────────────────────────────────────────
function ArticleAccordionItem({ article, isLast }: { article: Article; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = getCategoryColor(article.category);
  const itemId = article.link ?? article.title;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((p) => !p);
  };

  return (
    <View style={{ borderBottomWidth: isLast ? 0 : 1, borderBottomColor: '#F5F5F5' }}>
      {/* 접힌 상태: 제목만 */}
      <Pressable onPress={toggle} style={{ paddingVertical: 14, paddingHorizontal: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ width: 3, alignSelf: 'stretch', minHeight: 20, backgroundColor: catColor, borderRadius: 2, flexShrink: 0 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#212121', lineHeight: 22, marginBottom: 4 }} numberOfLines={expanded ? undefined : 2}>
              {getDisplayTitle(article)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: '#BDBDBD' }}>{article.source}</Text>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0' }}>
                {expanded ? <ChevronUp size={11} color="#757575" /> : <ChevronDown size={11} color="#757575" />}
              </View>
            </View>
          </View>
        </View>
      </Pressable>

      {/* 펼친 상태: impact + 요약 + 원문링크 + ReactionBar */}
      {expanded && (
        <View style={{ paddingHorizontal: 13, paddingBottom: 14 }}>
          {article.impact_comment && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFEBEE', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 }}>
              <Zap size={11} color="#E53935" style={{ marginTop: 2 }} />
              <Text style={{ color: '#C62828', fontSize: 12, flex: 1, lineHeight: 18 }}>{article.impact_comment}</Text>
            </View>
          )}
          {article.description && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 11, color: '#BDBDBD', fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>원문 요약</Text>
              <Text style={{ fontSize: 13, color: '#757575', lineHeight: 20 }}>{article.description}</Text>
            </View>
          )}
          {article.link && (
            <Pressable
              onPress={() => Linking.openURL(article.link)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FAFAFA', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' }}
            >
              <ExternalLink size={13} color={catColor} />
              <Text style={{ color: catColor, fontSize: 13, fontWeight: '600' }}>원문 보기</Text>
            </Pressable>
          )}
          <ReactionBar
            itemType="news"
            itemId={itemId}
            shareText={`${getDisplayTitle(article)}\n\n${article.link ?? ''}`}
            shareTitle={getDisplayTitle(article)}
          />
        </View>
      )}
    </View>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────
export default function NewsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { selectedDates, openDrawer, activeTab: _activeTab, setActiveTab, newsCategory: selectedCat, setNewsCategory } = useDrawer();
  const selectedDate = selectedDates.news;

  // 이 탭에 포커스될 때 드로어가 news 콘텐츠를 표시하도록 설정
  useFocusEffect(useCallback(() => {
    setActiveTab('news');
  }, [setActiveTab]));

  const { newsData, loading, error, refresh } = useNews(selectedDate);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // 카테고리별 기사 분류 (레거시 카테고리도 새 3개로 병합)
  const articlesByCategory: Record<NewsCategory, Article[]> = {
    core_tech: [],
    dev_tools: [],
    trend_insight: [],
    models_architecture: [],
    agentic_reality: [],
    opensource_code: [],
    physical_ai: [],
    policy_safety: [],
  };
  (newsData?.articles ?? []).forEach((a) => {
    const norm = normalizeCategory(a.category);
    articlesByCategory[norm]?.push(a);
  });

  // 선택된 카테고리에서 하이라이트와 같은 기사는 중복 방지를 위해 제외
  const highlightTitle = newsData?.highlight?.title;
  const categoryArticles = (articlesByCategory[selectedCat] ?? []).filter(
    (a) => a.title !== highlightTitle
  );

  // 선택된 날짜 표시
  const dateLabel = selectedDate
    ? new Date(selectedDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    : '오늘';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      {/* 헤더 */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#212121' }}>AI 트렌드</Text>
            <Text style={{ fontSize: 13, color: '#BDBDBD', marginTop: 2 }}>{dateLabel} 기준 AI 뉴스</Text>
          </View>
          <Pressable
            onPress={openDrawer}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0', ...cardShadow }}
          >
            <Menu size={18} color="#757575" />
          </Pressable>
        </View>
        <View style={{ width: 36, height: 3, backgroundColor: '#E53935', borderRadius: 2, marginTop: 12 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E53935" />}
      >
        {loading ? (
          <View style={{ paddingHorizontal: 16 }}>
            <NewsCardSkeleton />
            <NewsCardSkeleton />
            <NewsCardSkeleton />
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <RefreshCw size={28} color="#E53935" />
            </View>
            <Text style={{ color: '#212121', fontWeight: '600', fontSize: 16, marginBottom: 8 }}>연결에 문제가 있어요</Text>
            <Text style={{ color: '#BDBDBD', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>{error}</Text>
            <Pressable onPress={refresh} style={{ backgroundColor: '#E53935', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* 1. 하이라이트 카드 */}
            {newsData?.highlight && (
              <HighlightCard article={newsData.highlight} />
            )}

            {/* 2. 카테고리 버튼 3개 */}
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 }}>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCat === cat.key;
                const count = articlesByCategory[cat.key]?.length ?? 0;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => setNewsCategory(cat.key)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 14,
                      alignItems: 'center',
                      backgroundColor: isActive ? '#E53935' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: isActive ? '#E53935' : '#F0F0F0',
                      ...cardShadow,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#FFFFFF' : '#757575', textAlign: 'center' }}>
                      {cat.label}
                    </Text>
                    {count > 0 && (
                      <Text style={{ fontSize: 10, color: isActive ? 'rgba(255,255,255,0.75)' : '#BDBDBD', marginTop: 2 }}>
                        {count}개
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* 3. 선택 카테고리 기사 목록 (아코디언) */}
            <View style={{ marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 16, ...cardShadow }}>
              {categoryArticles.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Newspaper size={32} color="#E0E0E0" />
                  <Text style={{ color: '#BDBDBD', fontSize: 14, marginTop: 10 }}>이 카테고리엔 아직 기사가 없어요</Text>
                </View>
              ) : (
                categoryArticles.map((article, index) => (
                  <ArticleAccordionItem
                    key={`${article.title}-${index}`}
                    article={article}
                    isLast={index === categoryArticles.length - 1}
                  />
                ))
              )}
            </View>

            <View style={{ height: 32 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
