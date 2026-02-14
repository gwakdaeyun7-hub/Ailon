/**
 * AI 트렌드 뉴스 화면
 * - 3 신규 카테고리 탭 (Core Tech / Dev & Tools / Trend & Insight)
 * - 레거시 5 카테고리 지원 (Firestore 하위호환)
 * - TOP 3 단신: impact_comment 표시
 * - 상세 모달: Modal presentationStyle="pageSheet"
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
} from 'react-native';
import { ExternalLink, Share2, X, ChevronRight, Zap } from 'lucide-react-native';
import { useNews } from '@/hooks/useNews';
import { NewsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import type { Article, NewsCategory } from '@/lib/types';
import { NEWS_CATEGORY_LABELS, NEWS_CATEGORY_COLORS } from '@/lib/types';

// 표시할 카테고리 탭 (신규 3개 우선, 레거시 5개 하위호환)
const DISPLAY_CATEGORIES: Array<{ key: NewsCategory | 'all'; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'core_tech', label: 'Core Tech' },
  { key: 'dev_tools', label: 'Dev & Tools' },
  { key: 'trend_insight', label: 'Trend & Insight' },
  { key: 'models_architecture', label: '모델&아키텍처' },
  { key: 'agentic_reality', label: '에이전틱' },
  { key: 'opensource_code', label: '오픈소스' },
  { key: 'physical_ai', label: 'Physical AI' },
  { key: 'policy_safety', label: '정책&안전' },
];

function getCategoryColor(category?: string): string {
  if (!category) return '#e53935';
  return NEWS_CATEGORY_COLORS[category] ?? '#e53935';
}

function ArticleDetailModal({ article, visible, onClose }: { article: Article | null; visible: boolean; onClose: () => void }) {
  if (!article) return null;

  const catColor = getCategoryColor(article.category);

  return (
    <Modal visible={visible} presentationStyle="pageSheet" animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Pressable onPress={onClose} className="p-2 rounded-full bg-surface active:opacity-70">
            <X size={18} color="#1a1a1a" />
          </Pressable>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => Share.share({ message: `${article.title}\n\n${article.summary ?? article.description}\n\n${article.link}`, title: article.title })}
              className="p-2 rounded-full bg-surface active:opacity-70"
            >
              <Share2 size={18} color="#1a1a1a" />
            </Pressable>
            <Pressable
              onPress={() => article.link && Linking.openURL(article.link)}
              className="p-2 rounded-full bg-surface active:opacity-70"
            >
              <ExternalLink size={18} color="#1a1a1a" />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          {/* Category badge */}
          {article.category && (
            <View className="flex-row mb-3">
              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: `${catColor}20` }}>
                <Text style={{ color: catColor }} className="text-xs font-semibold">
                  {NEWS_CATEGORY_LABELS[article.category] ?? article.category}
                </Text>
              </View>
            </View>
          )}

          {/* Title */}
          <Text className="text-text text-xl font-bold mb-3 leading-tight">{article.title}</Text>

          {/* Source & Date */}
          <Text className="text-text-muted text-sm mb-4">
            {article.source} · {article.published ? new Date(article.published).toLocaleDateString('ko-KR') : ''}
          </Text>

          {/* Impact Comment */}
          {article.impact_comment && (
            <View className="bg-primary/10 rounded-2xl p-4 mb-4 flex-row gap-2">
              <Zap size={16} color="#e53935" />
              <Text className="text-primary text-sm flex-1 leading-relaxed">{article.impact_comment}</Text>
            </View>
          )}

          {/* Summary */}
          {article.summary && (
            <View className="mb-4">
              <Text className="text-text-muted text-xs uppercase tracking-wider mb-2">요약</Text>
              <Text className="text-text text-base leading-relaxed">{article.summary}</Text>
            </View>
          )}

          {/* Description */}
          <View className="mb-4">
            <Text className="text-text-muted text-xs uppercase tracking-wider mb-2">원문 내용</Text>
            <Text className="text-text-muted text-sm leading-relaxed">{article.description}</Text>
          </View>

          {/* How-to Guide */}
          {article.howToGuide && (
            <View className="bg-surface rounded-2xl p-4 mb-4">
              <Text className="text-accent text-sm font-semibold mb-2">실전 가이드</Text>
              <Text className="text-text text-sm leading-relaxed">{article.howToGuide}</Text>
            </View>
          )}

          {/* Open in browser */}
          {article.link && (
            <Pressable
              onPress={() => Linking.openURL(article.link)}
              className="flex-row items-center justify-center gap-2 bg-primary/20 rounded-2xl py-3 mt-2 mb-6 active:opacity-70"
            >
              <ExternalLink size={16} color="#e53935" />
              <Text className="text-primary font-semibold">원문 보기</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function NewsCard({ article, onPress }: { article: Article; onPress: () => void }) {
  const catColor = getCategoryColor(article.category);

  return (
    <Pressable
      onPress={onPress}
      className="bg-card rounded-2xl p-4 mb-3 mx-4 active:opacity-80"
    >
      {/* Category + Source */}
      <View className="flex-row items-center justify-between mb-2">
        {article.category && (
          <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${catColor}20` }}>
            <Text style={{ color: catColor }} className="text-xs font-semibold">
              {NEWS_CATEGORY_LABELS[article.category] ?? article.category}
            </Text>
          </View>
        )}
        <Text className="text-text-dim text-xs">{article.source}</Text>
      </View>

      {/* Title */}
      <Text className="text-text font-semibold text-base leading-snug mb-2" numberOfLines={2}>
        {article.title}
      </Text>

      {/* Impact Comment (신규 필드) */}
      {article.impact_comment && (
        <View className="flex-row items-start gap-1.5 bg-primary/10 rounded-xl px-3 py-2 mb-2">
          <Zap size={12} color="#e53935" style={{ marginTop: 2 }} />
          <Text className="text-primary text-xs flex-1 leading-relaxed" numberOfLines={2}>
            {article.impact_comment}
          </Text>
        </View>
      )}

      {/* Summary */}
      {article.summary && (
        <Text className="text-text-muted text-sm leading-relaxed" numberOfLines={3}>
          {article.summary}
        </Text>
      )}

      {/* Footer */}
      <View className="flex-row items-center justify-between mt-3">
        <Text className="text-text-dim text-xs">
          {article.published ? new Date(article.published).toLocaleDateString('ko-KR') : ''}
        </Text>
        <ChevronRight size={14} color="#999999" />
      </View>
    </Pressable>
  );
}

export default function NewsScreen() {
  const { newsData, filteredArticles, loading, error, selectedCategory, setSelectedCategory, refresh } = useNews();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // 현재 데이터에 실제로 존재하는 카테고리만 탭에 표시 (+ 전체)
  const existingCats = new Set(newsData?.articles?.map((a) => a.category) ?? []);
  const visibleTabs = DISPLAY_CATEGORIES.filter(
    (c) => c.key === 'all' || existingCats.has(c.key as NewsCategory)
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-text text-2xl font-bold">AI 트렌드</Text>
        <Text className="text-text-muted text-sm mt-1">
          {newsData?.date ? `${newsData.date} 기준` : '오늘의 AI 뉴스'}
        </Text>
      </View>

      {/* Daily Overview */}
      {newsData?.daily_overview && (
        <View className="mx-4 mb-3 bg-surface rounded-2xl p-4">
          <Text className="text-text-muted text-sm leading-relaxed" numberOfLines={3}>
            {newsData.daily_overview}
          </Text>
        </View>
      )}

      {/* Category Tabs */}
      {visibleTabs.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {visibleTabs.map((cat) => {
            const isActive = selectedCategory === cat.key;
            const color = cat.key !== 'all' ? getCategoryColor(cat.key) : '#e53935';
            return (
              <Pressable
                key={cat.key}
                onPress={() => setSelectedCategory(cat.key as NewsCategory | 'all')}
                className={`px-4 py-2 rounded-full ${isActive ? '' : 'bg-surface'}`}
                style={isActive ? { backgroundColor: `${color}20`, borderWidth: 1, borderColor: color } : undefined}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: isActive ? color : '#555555' }}
                >
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#e53935" />}
      >
        {loading ? (
          <>
            <NewsCardSkeleton />
            <NewsCardSkeleton />
            <NewsCardSkeleton />
          </>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-text-muted text-center">{error}</Text>
            <Pressable onPress={refresh} className="mt-4 px-6 py-2 bg-primary rounded-xl active:opacity-70">
              <Text className="text-white font-semibold">다시 시도</Text>
            </Pressable>
          </View>
        ) : filteredArticles.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-text-muted">아직 뉴스가 없어요</Text>
          </View>
        ) : (
          filteredArticles.map((article, index) => (
            <NewsCard
              key={`${article.title}-${index}`}
              article={article}
              onPress={() => setSelectedArticle(article)}
            />
          ))
        )}
        <View className="h-6" />
      </ScrollView>

      {/* Detail Modal */}
      <ArticleDetailModal
        article={selectedArticle}
        visible={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </SafeAreaView>
  );
}
