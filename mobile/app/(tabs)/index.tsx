/**
 * AI 뉴스 피드 (단순하고 깔끔한 카드 형식)
 *
 * 구조:
 *   1. 헤더: A 로고 + AI News + 검색 + 메뉴
 *   2. 하이라이트 카드 (오늘의 뉴스 1개)
 *   3. 카테고리 탭 (상단)
 *   4. 뉴스 카드 목록 (날짜순, 최대10개, 이미지 없는 기사도 표시)
 *   5. 가로 스크롤 섹션 (공식발표, 한국AI, GeekNews, 큐레이션)
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
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Search, Menu, ChevronRight,
  ThumbsUp, ThumbsDown, Calendar,
  ExternalLink, RefreshCw, X,
} from 'lucide-react-native';
import { useNews } from '@/hooks/useNews';
import { useDrawer } from '@/context/DrawerContext';
import { useReactions } from '@/hooks/useReactions';
import { ReactionBar } from '@/components/shared/ReactionBar';
import { NewsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import type { Article, NewsCategory, HorizontalArticle } from '@/lib/types';

// ─── 색상 ───────────────────────────────────────────────────────────────
const BG = '#F9FAFB';
const CARD = '#FFFFFF';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_LIGHT = '#9CA3AF';
const BORDER = '#F3F4F6';

const CATEGORY_COLORS: Record<string, string> = {
  model_research: '#F43F5E',
  product_tools: '#10B981',
  industry_business: '#F59E0B',
};

const CATEGORY_LABELS: Record<string, string> = {
  model_research: '모음/논문',
  product_tools: '개발/도구',
  industry_business: '트렌드',
};

const TABS = [
  { key: 'model_research', label: '모음/논문' },
  { key: 'product_tools', label: '개발/도구' },
  { key: 'industry_business', label: '트렌드' },
] as const;

// ─── 헬퍼 함수 ───────────────────────────────────────────────────────────
function formatDate(str?: string) {
  if (!str) return '';
  try {
    return new Date(str).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\. /g, '/').replace('.', '');
  } catch { return str.slice(5, 10); }
}

function displayTitle(a: Article) { return a.display_title || a.title; }

function LikeCount({ itemId }: { itemId: string }) {
  const { likes, dislikes } = useReactions('news', itemId);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <ThumbsUp size={14} color={TEXT_LIGHT} />
        <Text style={{ fontSize: 11, color: TEXT_LIGHT, fontWeight: '600' }}>{likes}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <ThumbsDown size={14} color={TEXT_LIGHT} />
        <Text style={{ fontSize: 11, color: TEXT_LIGHT, fontWeight: '600' }}>{dislikes}</Text>
      </View>
    </View>
  );
}

// ─── 뉴스 상세 모달 ───────────────────────────────────────────────────────
function NewsDetailModal({
  article, visible, onClose,
}: { article: Article | null; visible: boolean; onClose: () => void }) {
  if (!article) return null;
  const itemId = article.link ?? article.title;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: CARD }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 이미지 헤더 */}
          {article.image_url && (
            <View style={{ height: 220, overflow: 'hidden' }}>
              <Image source={{ uri: article.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
              <Pressable
                onPress={onClose}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          )}

          {/* 콘텐츠 */}
          <View style={{ padding: 20 }}>
            {/* 제목 */}
            <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY, lineHeight: 28, marginBottom: 12 }}>
              {displayTitle(article)}
            </Text>

            {/* 메타 정보 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER }}>
              <View style={{ backgroundColor: CATEGORY_COLORS[article.category as NewsCategory] + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: CATEGORY_COLORS[article.category as NewsCategory], fontSize: 11, fontWeight: '700' }}>
                  {CATEGORY_LABELS[article.category as NewsCategory] || '기타'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} color={TEXT_LIGHT} />
                <Text style={{ fontSize: 12, color: TEXT_LIGHT }}>{formatDate(article.published)}</Text>
              </View>
            </View>

            {/* 요약 */}
            {(article.summary || article.description) && (
              <Text style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 25, marginBottom: 20 }}>
                {article.summary ?? article.description}
              </Text>
            )}

            {/* 원문 보기 */}
            {article.link && (
              <Pressable
                onPress={() => Linking.openURL(article.link)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: pressed ? '#1F2937' : TEXT_PRIMARY,
                  borderRadius: 12,
                  paddingVertical: 14,
                  marginBottom: 20,
                })}
              >
                <ExternalLink size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>원문 보기</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>

        {/* 반응 바 */}
        <View style={{ borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: CARD, paddingHorizontal: 20, paddingVertical: 12 }}>
          <ReactionBar
            itemType="news"
            itemId={itemId}
            shareText={`${displayTitle(article)}\n\n${article.link ?? ''}`}
            shareTitle={displayTitle(article)}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── 하이라이트 카드 ───────────────────────────────────────────────────────
function HighlightCard({ article, onPress }: { article: Article; onPress: () => void }) {
  const catColor = CATEGORY_COLORS[article.category as NewsCategory] || '#6B7280';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 14,
        overflow: 'hidden',
        opacity: pressed ? 0.95 : 1,
      })}
    >
      {article.image_url ? (
        <View style={{ height: 200, overflow: 'hidden', backgroundColor: '#F3F4F6' }}>
          <Image source={{ uri: article.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
          <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF', lineHeight: 24 }} numberOfLines={2}>
              {displayTitle(article)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} color="rgba(255,255,255,0.8)" />
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{formatDate(article.published)}</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>{article.source}</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={{ height: 200, backgroundColor: catColor, justifyContent: 'flex-end', padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF', lineHeight: 24 }} numberOfLines={2}>
            {displayTitle(article)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} color="rgba(255,255,255,0.8)" />
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{formatDate(article.published)}</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>{article.source}</Text>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

// ─── 뉴스 카드 ───────────────────────────────────────────────────────────
function NewsCard({ article, onPress }: { article: Article; onPress: () => void }) {
  const itemId = article.link ?? article.title;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: CARD,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: BORDER,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
        opacity: pressed ? 0.95 : 1,
      })}
    >
      {/* 이미지 (있을 때만) */}
      {article.image_url ? (
        <View style={{ height: 160, overflow: 'hidden', backgroundColor: '#F3F4F6' }}>
          <Image source={{ uri: article.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      ) : null}

      {/* 텍스트 영역 */}
      <View style={{ padding: 14 }}>
        {/* 제목 */}
        <Text style={{ fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, lineHeight: 20, marginBottom: 8 }} numberOfLines={2}>
          {displayTitle(article)}
        </Text>

        {/* 메타 정보 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} color={TEXT_LIGHT} />
              <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{formatDate(article.published)}</Text>
            </View>
            <LikeCount itemId={itemId} />
          </View>
          {article.link && (
            <Pressable
              onPress={(e) => { e.stopPropagation(); Linking.openURL(article.link); }}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: BORDER, borderRadius: 6 }}
            >
              <ExternalLink size={12} color={TEXT_SECONDARY} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_SECONDARY }}>뷰</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ─── 가로 스크롤 카드 ───────────────────────────────────────────────────────
function HorizontalCard({ article, onPress }: { article: HorizontalArticle; onPress: () => void }) {
  const title = article.display_title || article.title;
  const brandColor = (article as any).brand_color;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 160,
        height: 200,
        marginRight: 12,
        backgroundColor: CARD,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: BORDER,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
        opacity: pressed ? 0.95 : 1,
      })}
    >
      {/* 이미지 */}
      {article.image_url ? (
        <View style={{ height: 90, overflow: 'hidden', backgroundColor: '#F3F4F6' }}>
          <Image source={{ uri: article.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      ) : (
        <View style={{ height: 90, backgroundColor: brandColor || '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 20, color: brandColor ? '#FFFFFF' : TEXT_LIGHT, fontWeight: '800' }}>
            {article.source?.charAt(0)?.toUpperCase() || 'N'}
          </Text>
        </View>
      )}

      {/* 제목 + 메타 */}
      <View style={{ flex: 1, padding: 10, justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: TEXT_PRIMARY, lineHeight: 16 }} numberOfLines={2}>
          {title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 10, color: TEXT_LIGHT }}>{formatDate(article.published)}</Text>
          <Text style={{ fontSize: 10, color: TEXT_LIGHT }}>·</Text>
          <Text style={{ fontSize: 10, color: TEXT_LIGHT }} numberOfLines={1}>{article.source}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── 가로 스크롤 섹션 ───────────────────────────────────────────────────────
function HorizontalSection({
  title, articles, onCardPress,
}: {
  title: string; articles: HorizontalArticle[]; onCardPress?: (a: HorizontalArticle) => void;
}) {
  if (!articles || articles.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT_PRIMARY, paddingHorizontal: 16, marginBottom: 12 }}>
        {title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
      >
        {articles.slice(0, 10).map((a, i) => (
          <HorizontalCard
            key={`${a.source}-${i}`}
            article={a}
            onPress={() => onCardPress?.(a)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── 가로 스크롤 상세 모달 ───────────────────────────────────────────────────
function HorizontalDetailModal({
  article, visible, onClose,
}: { article: HorizontalArticle | null; visible: boolean; onClose: () => void }) {
  if (!article) return null;
  const title = article.display_title || article.title;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: CARD }} edges={['top']}>
        {/* 헤더 */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: BORDER,
        }}>
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: TEXT_SECONDARY }}>
            {article.source}
          </Text>
          <Pressable
            onPress={onClose}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} color={TEXT_SECONDARY} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
          {/* 이미지 */}
          {article.image_url && (
            <View style={{ height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              <Image source={{ uri: article.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          )}

          {/* 제목 */}
          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, lineHeight: 26, marginBottom: 12 }}>
            {title}
          </Text>

          {/* 설명 */}
          {article.description && (
            <Text style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 22, marginBottom: 20 }}>
              {article.description}
            </Text>
          )}

          {/* 원문 보기 */}
          {article.link && (
            <Pressable
              onPress={() => Linking.openURL(article.link)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: pressed ? '#1F2937' : TEXT_PRIMARY,
                borderRadius: 12,
                paddingVertical: 14,
                marginTop: 'auto' as any,
              })}
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

// ─── 메인 화면 ────────────────────────────────────────────────────────────
export default function NewsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('model_research');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedHArticle, setSelectedHArticle] = useState<HorizontalArticle | null>(null);
  const [hDetailVisible, setHDetailVisible] = useState(false);

  const { openDrawer, setActiveTab } = useDrawer();
  const { newsData, loading, error, refresh } = useNews();

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

  const openDetail = (article: Article) => {
    setSelectedArticle(article);
    setDetailVisible(true);
  };

  // 카테고리별 뉴스 필터링 (날짜내림차순, 최대10개)
  const filteredNews = (newsData?.articles ?? [])
    .filter(a => a.category === selectedCategory)
    .sort((a, b) => new Date(b.published || 0).getTime() - new Date(a.published || 0).getTime())
    .slice(0, 10);

  // 하이라이트 기사
  const highlight = newsData?.highlight ?? null;

  // 가로 스크롤 섹션 데이터
  const hs = newsData?.horizontal_sections ?? {};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ─── 헤더 ─── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: BG }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>A</Text>
        </View>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY }}>AI News</Text>
        <Pressable style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
          <Search size={22} color={TEXT_SECONDARY} />
        </Pressable>
        <Pressable onPress={openDrawer} style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
          <Menu size={22} color={TEXT_SECONDARY} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={TEXT_SECONDARY} />}
      >
        {/* ─── 하이라이트 ─── */}
        {highlight && (
          <HighlightCard
            article={highlight}
            onPress={() => openDetail(highlight)}
          />
        )}

        {/* ─── 카테고리 탭 ─── */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20, gap: 8 }}>
          {TABS.map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setSelectedCategory(tab.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: selectedCategory === tab.key ? '#000000' : BORDER,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: selectedCategory === tab.key ? '#FFFFFF' : TEXT_SECONDARY }}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ─── 뉴스 목록 ─── */}
        {loading ? (
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
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
            <Pressable onPress={refresh} style={{ backgroundColor: '#000000', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>다시 시도</Text>
            </Pressable>
          </View>
        ) : filteredNews.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ color: TEXT_LIGHT, fontSize: 14 }}>아직 뉴스가 없어요</Text>
          </View>
        ) : (
          <>
            {filteredNews.map((article, i) => (
              <NewsCard
                key={`news-${i}`}
                article={article}
                onPress={() => openDetail(article)}
              />
            ))}
          </>
        )}

        {/* ─── 가로 스크롤 섹션 ─── */}
        <View style={{ marginVertical: 20 }}>
          <HorizontalSection
            title="💫 공식 발표"
            articles={
              (hs.official_announcements && !Array.isArray(hs.official_announcements))
                ? Object.values(hs.official_announcements as Record<string, HorizontalArticle[]>).flat()
                : []
            }
            onCardPress={(a) => { setSelectedHArticle(a); setHDetailVisible(true); }}
          />
          <HorizontalSection
            title="🇰🇷 한국 AI"
            articles={hs.korean_ai ?? []}
            onCardPress={(a) => { setSelectedHArticle(a); setHDetailVisible(true); }}
          />
          <HorizontalSection
            title="🟠 GeekNews"
            articles={hs.geeknews ?? []}
            onCardPress={(a) => { setSelectedHArticle(a); setHDetailVisible(true); }}
          />
          <HorizontalSection
            title="📚 큐레이션"
            articles={hs.curation ?? []}
            onCardPress={(a) => { setSelectedHArticle(a); setHDetailVisible(true); }}
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── 뉴스 상세 모달 ─── */}
      <NewsDetailModal
        article={selectedArticle}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
      />

      {/* ─── 가로 스크롤 상세 모달 ─── */}
      <HorizontalDetailModal
        article={selectedHArticle}
        visible={hDetailVisible}
        onClose={() => setHDetailVisible(false)}
      />
    </SafeAreaView>
  );
}
