/**
 * AI 트렌드 뉴스 화면
 * - 날짜 이동: 사이드바 통해서만 (날짜 필 제거)
 * - 상단: 하이라이트 카드 1개 (전체 항상 표시)
 * - 중간: 카테고리 3개 버튼 (core_tech / dev_tools / trend_insight)
 * - 하단: 선택 카테고리 기사 목록 (아코디언: 기본=제목만, 펼침=summary+impact+원문링크+ReactionBar)
 * - 검색, 북마크 유지
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  SafeAreaView,
  RefreshControl,
  Linking,
  Share,
  TextInput,
  LayoutAnimation,
} from 'react-native';
import {
  ExternalLink, Share2, X, ChevronRight, Zap,
  Newspaper, RefreshCw, Search, Menu, ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { useNews } from '@/hooks/useNews';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useDrawer } from '@/context/DrawerContext';
import { BookmarkButton } from '@/components/shared/BookmarkButton';
import { NewsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { ReactionBar } from '@/components/shared/ReactionBar';
import type { Article, NewsCategory } from '@/lib/types';
import { NEWS_CATEGORY_LABELS, NEWS_CATEGORY_COLORS } from '@/lib/types';

// ─── 카테고리 탭 (3개 핵심 + 레거시 하위호환) ──────────────────────────────────
const PRIMARY_CATEGORIES: Array<{ key: NewsCategory | 'all'; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'core_tech', label: '🔬 모델·논문' },
  { key: 'dev_tools', label: '🛠 개발·도구' },
  { key: 'trend_insight', label: '📈 트렌드' },
];

const LEGACY_CATEGORIES: Array<{ key: NewsCategory | 'all'; label: string }> = [
  { key: 'models_architecture', label: '모델·아키텍처' },
  { key: 'agentic_reality', label: '에이전틱' },
  { key: 'opensource_code', label: '오픈소스' },
  { key: 'physical_ai', label: 'Physical AI' },
  { key: 'policy_safety', label: '정책·안전' },
];

const cardShadow = {
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
};

function getCategoryColor(category?: string): string {
  if (!category) return '#E53935';
  return NEWS_CATEGORY_COLORS[category] ?? '#E53935';
}

// ─── 상세 모달 ────────────────────────────────────────────────────────────────
function ArticleDetailModal({ article, visible, onClose }: { article: Article | null; visible: boolean; onClose: () => void }) {
  if (!article) return null;
  const catColor = getCategoryColor(article.category);

  return (
    <Modal visible={visible} presentationStyle="pageSheet" animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-3" style={{ borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
          <Pressable onPress={onClose} className="active:opacity-70" style={{ padding: 8, borderRadius: 20, backgroundColor: '#FAFAFA' }}>
            <X size={18} color="#212121" />
          </Pressable>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => Share.share({ message: `${article.title}\n\n${article.summary ?? article.description}\n\n${article.link}`, title: article.title })}
              className="active:opacity-70"
              style={{ padding: 8, borderRadius: 20, backgroundColor: '#FAFAFA' }}
            >
              <Share2 size={18} color="#212121" />
            </Pressable>
            <Pressable
              onPress={() => article.link && Linking.openURL(article.link)}
              className="active:opacity-70"
              style={{ padding: 8, borderRadius: 20, backgroundColor: '#FAFAFA' }}
            >
              <ExternalLink size={18} color="#212121" />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 px-5 py-5">
          {article.category && (
            <View className="flex-row mb-4">
              <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: `${catColor}15` }}>
                <Text style={{ color: catColor }} className="text-xs font-bold tracking-wide">
                  {NEWS_CATEGORY_LABELS[article.category] ?? article.category}
                </Text>
              </View>
            </View>
          )}
          <Text className="text-text text-xl font-bold mb-2" style={{ lineHeight: 30 }}>
            {article.summary ?? article.title}
          </Text>
          {article.summary && (
            <Text className="text-text-dim text-sm mb-3" style={{ lineHeight: 20 }}>{article.title}</Text>
          )}
          <Text className="text-text-muted text-sm mb-5">
            {article.source} · {article.published ? new Date(article.published).toLocaleDateString('ko-KR') : ''}
          </Text>
          {article.impact_comment && (
            <View className="bg-primary-light rounded-2xl p-4 mb-5" style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E53935', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={14} color="#FFFFFF" />
              </View>
              <Text className="text-text text-sm flex-1" style={{ lineHeight: 22 }}>{article.impact_comment}</Text>
            </View>
          )}
          {article.summary && (
            <View className="mb-5">
              <Text className="text-text-muted text-xs uppercase tracking-wider mb-2 font-semibold">요약</Text>
              <Text className="text-text text-base" style={{ lineHeight: 24 }}>{article.summary}</Text>
            </View>
          )}
          <View className="mb-5">
            <Text className="text-text-muted text-xs uppercase tracking-wider mb-2 font-semibold">원문 내용</Text>
            <Text className="text-text-muted text-sm" style={{ lineHeight: 22 }}>{article.description}</Text>
          </View>
          {article.howToGuide && (
            <View className="rounded-2xl p-4 mb-5" style={{ backgroundColor: '#FFF3E0' }}>
              <Text className="text-accent text-sm font-bold mb-2">실전 가이드</Text>
              <Text className="text-text text-sm" style={{ lineHeight: 22 }}>{article.howToGuide}</Text>
            </View>
          )}
          {article.link && (
            <Pressable
              onPress={() => Linking.openURL(article.link)}
              className="active:opacity-70"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E53935', borderRadius: 16, paddingVertical: 14, marginTop: 4, marginBottom: 24 }}
            >
              <ExternalLink size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>원문 보기</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── 하이라이트 뉴스 카드 ──────────────────────────────────────────────────────
function HighlightNewsCard({
  article, onPress, isBookmarked, onBookmark,
}: { article: Article; onPress: () => void; isBookmarked: boolean; onBookmark: () => void }) {
  const catColor = getCategoryColor(article.category);

  return (
    <Pressable
      onPress={onPress}
      className="mx-4 mb-4 rounded-2xl overflow-hidden active:opacity-90"
      style={{ elevation: 5, shadowColor: '#E53935', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 10, borderWidth: 1, borderColor: '#FFCDD2' }}
    >
      <View style={{ backgroundColor: '#E53935', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Zap size={14} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>오늘의 주목 기사</Text>
        {article.category && (
          <View style={{ marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>
              {NEWS_CATEGORY_LABELS[article.category] ?? article.category}
            </Text>
          </View>
        )}
      </View>

      <View className="bg-card p-4">
        <Text className="text-text font-bold" style={{ fontSize: 17, lineHeight: 26, marginBottom: 8 }}>
          {article.summary ?? article.title}
        </Text>
        {article.impact_comment && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFEBEE', borderRadius: 10, padding: 10, marginBottom: 10 }}>
            <Zap size={12} color="#E53935" style={{ marginTop: 2 }} />
            <Text style={{ color: '#C62828', fontSize: 13, flex: 1, lineHeight: 19 }}>{article.impact_comment}</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <Text className="text-text-muted text-xs">
            {article.source} · {article.published ? new Date(article.published).toLocaleDateString('ko-KR') : ''}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BookmarkButton isBookmarked={isBookmarked} onToggle={onBookmark} size={16} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#E53935', fontSize: 12, fontWeight: '700' }}>자세히</Text>
              <ChevronRight size={14} color="#E53935" />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── 아코디언 뉴스 카드 ───────────────────────────────────────────────────────
function AccordionNewsCard({
  article, isBookmarked, onBookmark,
}: { article: Article; isBookmarked: boolean; onBookmark: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = getCategoryColor(article.category);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((p) => !p);
  };

  return (
    <View
      className="bg-card rounded-2xl mb-3 mx-4 overflow-hidden"
      style={{ ...cardShadow, borderLeftWidth: 3, borderLeftColor: catColor }}
    >
      {/* Title Row — always visible */}
      <Pressable onPress={toggle} className="p-4 active:opacity-80">
        <View className="flex-row items-center justify-between mb-2">
          {article.category && (
            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${catColor}15` }}>
              <Text style={{ color: catColor }} className="text-xs font-bold">
                {NEWS_CATEGORY_LABELS[article.category] ?? article.category}
              </Text>
            </View>
          )}
          <Text className="text-text-dim text-xs">{article.source}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <Text className="text-text font-bold text-base flex-1" style={{ lineHeight: 23 }}>
            {article.summary ?? article.title}
          </Text>
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
            {expanded ? <ChevronUp size={14} color="#757575" /> : <ChevronDown size={14} color="#757575" />}
          </View>
        </View>
      </Pressable>

      {/* Expanded Content */}
      {expanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#F5F5F5' }}>
          {/* Korean summary headline */}
          {article.summary && (
            <View className="mt-3 mb-3">
              <Text className="text-text-muted text-xs uppercase tracking-wider mb-1.5 font-semibold">원문 제목</Text>
              <Text className="text-text-dim text-sm" style={{ lineHeight: 20 }}>{article.title}</Text>
            </View>
          )}

          {/* Impact comment */}
          {article.impact_comment && (
            <View className="bg-primary-light rounded-xl px-3 py-2.5 mb-3" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#E53935', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                <Zap size={10} color="#FFFFFF" />
              </View>
              <Text className="text-text text-xs flex-1" style={{ lineHeight: 18 }}>
                {article.impact_comment}
              </Text>
            </View>
          )}

          {/* Source link */}
          {article.link && (
            <Pressable
              onPress={() => Linking.openURL(article.link)}
              className="active:opacity-70"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FAFAFA', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0', alignSelf: 'flex-start' }}
            >
              <ExternalLink size={13} color="#E53935" />
              <Text style={{ color: '#E53935', fontSize: 12, fontWeight: '600' }}>원문 보기</Text>
            </Pressable>
          )}

          {/* Bottom row: bookmark + reaction */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <BookmarkButton isBookmarked={isBookmarked} onToggle={onBookmark} size={16} />
            <Text className="text-text-dim text-xs">
              {article.published ? new Date(article.published).toLocaleDateString('ko-KR') : ''}
            </Text>
          </View>

          <ReactionBar
            itemType="news"
            itemId={article.link ?? article.title}
            shareText={`${article.summary ?? article.title}\n\n${article.link ?? ''}`}
            shareTitle={article.summary ?? article.title}
          />
        </View>
      )}
    </View>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────
export default function NewsScreen() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { selectedDates } = useDrawer();
  const selectedDate = selectedDates.news;
  const { openDrawer } = useDrawer();

  const { newsData, filteredArticles, loading, error, selectedCategory, setSelectedCategory, refresh } = useNews(selectedDate);
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks(user?.uid ?? null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // 검색 필터 적용
  const searchedArticles = searchQuery.trim()
    ? filteredArticles.filter((a) =>
        (a.summary ?? a.title).toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.source.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredArticles;

  // 현재 데이터에 실제로 존재하는 카테고리만 표시 (3개 우선 + 레거시 하위호환)
  const existingCats = new Set(newsData?.articles?.map((a) => a.category) ?? []);
  const visibleTabs = [
    ...PRIMARY_CATEGORIES.filter((c) => c.key === 'all' || existingCats.has(c.key as NewsCategory)),
    ...LEGACY_CATEGORIES.filter((c) => existingCats.has(c.key as NewsCategory)),
  ];

  const bookmarkMeta = (article: Article) => ({
    title: article.summary ?? article.title,
    subtitle: article.source,
    category: article.category,
    link: article.link,
  });

  // 선택된 날짜 표시
  const dateLabel = selectedDate
    ? new Date(selectedDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    : '오늘';

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-5 pb-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-text text-2xl font-bold">오늘의 AI 트렌드</Text>
            <Text className="text-text-muted text-sm mt-1">
              {newsData?.date ? `${newsData.date} 기준` : `${dateLabel} 기준 AI 뉴스`}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => { setShowSearch((s) => !s); setSearchQuery(''); }}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: showSearch ? '#FFEBEE' : '#FAFAFA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: showSearch ? '#FFCDD2' : '#F0F0F0' }}
            >
              <Search size={18} color={showSearch ? '#E53935' : '#757575'} />
            </Pressable>
            {/* Hamburger → SideDrawer */}
            <Pressable
              onPress={openDrawer}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0' }}
            >
              <Menu size={20} color="#757575" />
            </Pressable>
          </View>
        </View>
        <View style={{ width: 40, height: 3, backgroundColor: '#E53935', borderRadius: 2, marginTop: 12 }} />
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: '#F0F0F0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}>
          <Search size={16} color="#BDBDBD" />
          <TextInput
            placeholder="뉴스 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            style={{ flex: 1, fontSize: 14, color: '#212121', paddingVertical: 0 }}
            placeholderTextColor="#BDBDBD"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={16} color="#BDBDBD" />
            </Pressable>
          )}
        </View>
      )}

      {/* Category Tabs */}
      {visibleTabs.length > 1 && !searchQuery && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {visibleTabs.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => setSelectedCategory(cat.key as NewsCategory | 'all')}
                style={isActive
                  ? { backgroundColor: '#E53935', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }
                  : { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#F0F0F0' }
                }
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? '#FFFFFF' : '#757575' }}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Article List */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E53935" />}
      >
        {/* Daily Overview */}
        {newsData?.daily_overview && !searchQuery && (
          <View className="mx-4 mb-3 rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', ...cardShadow }}>
            <Text className="text-text-muted text-sm" style={{ lineHeight: 20 }} numberOfLines={3}>
              {newsData.daily_overview}
            </Text>
          </View>
        )}

        {/* Highlight Card — always show in '전체' tab when no search */}
        {!loading && !error && newsData?.highlight && selectedCategory === 'all' && !searchQuery && (
          <HighlightNewsCard
            article={newsData.highlight}
            onPress={() => setSelectedArticle(newsData.highlight!)}
            isBookmarked={isBookmarked('news', newsData.highlight.link)}
            onBookmark={() => toggleBookmark('news', newsData.highlight!.link, bookmarkMeta(newsData.highlight!))}
          />
        )}

        {loading ? (
          <>
            <NewsCardSkeleton />
            <NewsCardSkeleton />
            <NewsCardSkeleton />
          </>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-20 px-8">
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <RefreshCw size={28} color="#E53935" />
            </View>
            <Text className="text-text font-semibold text-base mb-2">연결에 문제가 있어요</Text>
            <Text className="text-text-muted text-sm text-center mb-5" style={{ lineHeight: 20 }}>{error}</Text>
            <Pressable
              onPress={refresh}
              className="active:opacity-70"
              style={{ backgroundColor: '#E53935', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>다시 시도</Text>
            </Pressable>
          </View>
        ) : searchedArticles.length === 0 ? (
          <View className="items-center justify-center py-20">
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Newspaper size={28} color="#E53935" />
            </View>
            <Text className="text-text font-semibold text-base mb-1">
              {searchQuery ? `'${searchQuery}' 검색 결과가 없어요` : '아직 뉴스가 없어요'}
            </Text>
            <Text className="text-text-muted text-sm">
              {searchQuery ? '다른 키워드로 검색해보세요' : '잠시 후 다시 확인해보세요'}
            </Text>
          </View>
        ) : (
          searchedArticles.map((article, index) => (
            <AccordionNewsCard
              key={`${article.title}-${index}`}
              article={article}
              isBookmarked={isBookmarked('news', article.link)}
              onBookmark={() => toggleBookmark('news', article.link, bookmarkMeta(article))}
            />
          ))
        )}
        <View className="h-6" />
      </ScrollView>

      {/* Detail Modal (하이라이트 카드 탭 시) */}
      <ArticleDetailModal
        article={selectedArticle}
        visible={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </SafeAreaView>
  );
}
