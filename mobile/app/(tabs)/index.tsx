/**
 * AI 트렌드 뉴스 화면
 * 구조:
 *   1. 하이라이트 카드 (최고 점수 기사 1개, 항상 상단)
 *   2. 카테고리 버튼 3개 (core_tech / dev_tools / trend_insight)
 *   3. 선택 카테고리 기사 목록 — 제목 + 좋아요/싫어요 수
 *   4. 제목 탭 → 상세 모달 (요약 + 원문링크 + 좋아요/싫어요/공유)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  RefreshControl,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  ExternalLink, Share2, X, Zap, Newspaper,
  RefreshCw, Menu, ThumbsUp, ThumbsDown,
} from 'lucide-react-native';
import { useNews } from '@/hooks/useNews';
import { useAuth } from '@/hooks/useAuth';
import { useDrawer } from '@/context/DrawerContext';
import { useReactions } from '@/hooks/useReactions';
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

// ─── 좋아요/싫어요 수 표시 (읽기 전용, 목록용) ───────────────────────────────
function ReactionCount({ itemId }: { itemId: string }) {
  const { likes, dislikes } = useReactions('news', itemId);
  if (likes === 0 && dislikes === 0) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {likes > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <ThumbsUp size={11} color="#E53935" />
          <Text style={{ color: '#E53935', fontSize: 11, fontWeight: '700' }}>{likes}</Text>
        </View>
      )}
      {dislikes > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <ThumbsDown size={11} color="#9E9E9E" />
          <Text style={{ color: '#9E9E9E', fontSize: 11, fontWeight: '600' }}>{dislikes}</Text>
        </View>
      )}
    </View>
  );
}

// ─── 상세 모달 ────────────────────────────────────────────────────────────────
function ArticleDetailModal({
  article,
  visible,
  onClose,
}: {
  article: Article | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const itemId = article?.link ?? article?.title ?? '';
  const { likes, dislikes, liked, disliked, toggleLike, toggleDislike } = useReactions('news', itemId);
  const catColor = getCategoryColor(article?.category);

  if (!article) return null;

  const handleLike = async () => {
    if (!user) { Alert.alert('로그인 필요', '좋아요를 남기려면 로그인이 필요해요.'); return; }
    await toggleLike();
  };
  const handleDislike = async () => {
    if (!user) { Alert.alert('로그인 필요', '싫어요를 남기려면 로그인이 필요해요.'); return; }
    await toggleDislike();
  };
  const handleShare = () => {
    Share.share({
      message: `${getDisplayTitle(article)}\n\n${article.link ?? ''}`,
      title: getDisplayTitle(article),
    });
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* 모달 헤더 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
          <View style={{ backgroundColor: `${catColor}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
            <Text style={{ color: catColor, fontSize: 12, fontWeight: '700' }}>
              {CATEGORIES.find(c => c.key === normalizeCategory(article.category))?.label ?? article.category}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} color="#757575" />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          {/* 흥미로운 제목 (한국어 요약) */}
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#212121', lineHeight: 30, marginBottom: 6 }}>
            {getDisplayTitle(article)}
          </Text>
          <Text style={{ fontSize: 12, color: '#BDBDBD', marginBottom: 20 }}>
            {article.source} · {article.published ? new Date(article.published).toLocaleDateString('ko-KR') : ''}
          </Text>

          {/* 임팩트 코멘트 */}
          {article.impact_comment && (
            <View style={{ flexDirection: 'row', gap: 10, backgroundColor: '#FFEBEE', borderRadius: 14, padding: 14, marginBottom: 18 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#E53935', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={13} color="#FFFFFF" />
              </View>
              <Text style={{ color: '#C62828', fontSize: 14, flex: 1, lineHeight: 22, fontWeight: '500' }}>
                {article.impact_comment}
              </Text>
            </View>
          )}

          {/* 요약 */}
          {article.summary && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 11, color: '#BDBDBD', fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>요약</Text>
              <Text style={{ fontSize: 15, color: '#424242', lineHeight: 24 }}>{article.summary}</Text>
            </View>
          )}

          {/* 원문 설명 */}
          {article.description && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 11, color: '#BDBDBD', fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>원문 내용</Text>
              <Text style={{ fontSize: 14, color: '#757575', lineHeight: 22 }}>{article.description}</Text>
            </View>
          )}

          {/* 원문 보기 버튼 */}
          {article.link && (
            <Pressable
              onPress={() => Linking.openURL(article.link)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#212121', borderRadius: 14, paddingVertical: 14, marginBottom: 24 }}
            >
              <ExternalLink size={15} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>원문 보기</Text>
            </Pressable>
          )}

          {/* 구분선 */}
          <View style={{ height: 1, backgroundColor: '#F0F0F0', marginBottom: 16 }} />

          {/* 좋아요 / 싫어요 / 공유 */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* 좋아요 */}
            <Pressable
              onPress={handleLike}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                paddingVertical: 12, borderRadius: 14,
                backgroundColor: liked ? '#FFEBEE' : '#F5F5F5',
                borderWidth: 1.5,
                borderColor: liked ? '#E53935' : 'transparent',
              }}
            >
              <ThumbsUp size={17} color={liked ? '#E53935' : '#9E9E9E'} fill={liked ? '#E53935' : 'none'} />
              <Text style={{ color: liked ? '#E53935' : '#9E9E9E', fontWeight: '700', fontSize: 14 }}>
                {likes > 0 ? likes : '좋아요'}
              </Text>
            </Pressable>

            {/* 싫어요 */}
            <Pressable
              onPress={handleDislike}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                paddingVertical: 12, borderRadius: 14,
                backgroundColor: disliked ? '#F5F5F5' : '#F5F5F5',
                borderWidth: 1.5,
                borderColor: disliked ? '#757575' : 'transparent',
              }}
            >
              <ThumbsDown size={17} color={disliked ? '#424242' : '#9E9E9E'} fill={disliked ? '#424242' : 'none'} />
              <Text style={{ color: disliked ? '#424242' : '#9E9E9E', fontWeight: '700', fontSize: 14 }}>
                {dislikes > 0 ? dislikes : '싫어요'}
              </Text>
            </Pressable>

            {/* 공유 */}
            <Pressable
              onPress={handleShare}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: '#F5F5F5' }}
            >
              <Share2 size={17} color="#9E9E9E" />
              <Text style={{ color: '#9E9E9E', fontWeight: '700', fontSize: 14 }}>공유</Text>
            </Pressable>
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── 하이라이트 카드 ──────────────────────────────────────────────────────────
function HighlightCard({ article, onPress }: { article: Article; onPress: () => void }) {
  const catColor = getCategoryColor(article.category);
  const catLabel = CATEGORIES.find(c => c.key === normalizeCategory(article.category))?.label;

  return (
    <Pressable
      onPress={onPress}
      style={{ marginHorizontal: 16, marginBottom: 20, borderRadius: 20, overflow: 'hidden', ...cardShadow }}
    >
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

      {/* 본문 */}
      <View style={{ backgroundColor: '#FFFFFF', padding: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: '#212121', lineHeight: 26, marginBottom: 10 }}>
          {getDisplayTitle(article)}
        </Text>
        {article.impact_comment && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFEBEE', borderRadius: 10, padding: 10, marginBottom: 10 }}>
            <Zap size={11} color="#E53935" style={{ marginTop: 3 }} />
            <Text style={{ color: '#C62828', fontSize: 13, flex: 1, lineHeight: 19 }} numberOfLines={2}>
              {article.impact_comment}
            </Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#BDBDBD', fontSize: 12 }}>{article.source}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ color: '#E53935', fontSize: 13, fontWeight: '700' }}>자세히 보기</Text>
            <ExternalLink size={12} color="#E53935" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── 기사 목록 아이템 (제목 + 좋아요/싫어요 수만) ────────────────────────────
function ArticleListItem({ article, onPress, isLast }: { article: Article; onPress: () => void; isLast: boolean }) {
  const catColor = getCategoryColor(article.category);
  const itemId = article.link ?? article.title;

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 14,
        paddingHorizontal: 0,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#F5F5F5',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        {/* 카테고리 색상 인디케이터 */}
        <View style={{ width: 3, height: '100%', minHeight: 20, backgroundColor: catColor, borderRadius: 2, marginTop: 3, flexShrink: 0 }} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#212121', lineHeight: 22 }} numberOfLines={2}>
            {getDisplayTitle(article)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: '#BDBDBD' }}>{article.source}</Text>
            <ReactionCount itemId={itemId} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────
export default function NewsScreen() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
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
              <HighlightCard
                article={newsData.highlight}
                onPress={() => setSelectedArticle(newsData.highlight!)}
              />
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

            {/* 3. 선택 카테고리 기사 목록 */}
            <View style={{ marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 16, ...cardShadow }}>
              {categoryArticles.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Newspaper size={32} color="#E0E0E0" />
                  <Text style={{ color: '#BDBDBD', fontSize: 14, marginTop: 10 }}>이 카테고리엔 아직 기사가 없어요</Text>
                </View>
              ) : (
                categoryArticles.map((article, index) => (
                  <ArticleListItem
                    key={`${article.title}-${index}`}
                    article={article}
                    onPress={() => setSelectedArticle(article)}
                    isLast={index === categoryArticles.length - 1}
                  />
                ))
              )}
            </View>

            <View style={{ height: 32 }} />
          </>
        )}
      </ScrollView>

      {/* 상세 모달 */}
      <ArticleDetailModal
        article={selectedArticle}
        visible={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </SafeAreaView>
  );
}
