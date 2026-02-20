/**
 * AI 뉴스 피드
 * - 소스별 가로 스크롤 섹션 (5+더보기5, 통일 카드: 썸네일+제목+날짜+좋아요+뷰)
 * - 하단 텍스트 섹션 (OpenAI, InfoQ — 이미지 없는 소스)
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Menu, RefreshCw, ThumbsUp, Eye, ChevronRight,
} from 'lucide-react-native';
import { useNews } from '@/hooks/useNews';
import { useDrawer } from '@/context/DrawerContext';
import { useReactions } from '@/hooks/useReactions';
import { useArticleViews } from '@/hooks/useArticleViews';
import { NewsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import type { Article } from '@/lib/types';

// ─── 색상 ───────────────────────────────────────────────────────────────
const BG = '#F9FAFB';
const CARD = '#FFFFFF';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_LIGHT = '#9CA3AF';
const BORDER = '#F3F4F6';

const SOURCE_COLORS: Record<string, string> = {
  wired_ai: '#000000',
  the_verge_ai: '#E1127A',
  techcrunch_ai: '#0A9E01',
  venturebeat_ai: '#7B68EE',
  mit_tech_review: '#D32F2F',
  infoq_ai: '#0078D7',
  openai_blog: '#10A37F',
  deepmind_blog: '#1D4ED8',
  nvidia_blog: '#76B900',
  huggingface_blog: '#FFD21E',
  aitimes: '#E53935',
  geeknews: '#FF6B35',
  zdnet_korea: '#D32F2F',
  hankyung_it: '#003876',
};

const SOURCE_NAMES: Record<string, string> = {
  wired_ai: 'Wired AI',
  the_verge_ai: 'The Verge AI',
  techcrunch_ai: 'TechCrunch AI',
  venturebeat_ai: 'VentureBeat AI',
  mit_tech_review: 'MIT Tech Review',
  infoq_ai: 'InfoQ AI/ML',
  openai_blog: 'OpenAI',
  deepmind_blog: 'Google DeepMind',
  nvidia_blog: 'NVIDIA AI',
  huggingface_blog: 'Hugging Face',
  aitimes: 'AI타임스',
  geeknews: 'GeekNews',
  zdnet_korea: 'ZDNet Korea',
  hankyung_it: '한국경제 IT',
};

const SOURCE_ORDER = [
  'wired_ai', 'the_verge_ai', 'techcrunch_ai', 'venturebeat_ai',
  'mit_tech_review',
  'deepmind_blog', 'nvidia_blog', 'huggingface_blog',
  'aitimes', 'geeknews', 'zdnet_korea', 'hankyung_it',
];

const TEXT_ONLY_ORDER = ['openai_blog', 'infoq_ai'];

// ─── 헬퍼 ───────────────────────────────────────────────────────────────
function formatDate(str?: string) {
  if (!str) return '';
  try {
    return new Date(str).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\. /g, '/').replace('.', '');
  } catch { return ''; }
}

function getTitle(a: Article) {
  return a.display_title || a.title;
}

// ─── 좋아요+뷰 카운트 (개별 기사용) ─────────────────────────────────────
function ArticleStats({ articleLink }: { articleLink: string }) {
  const { likes } = useReactions('news', articleLink);
  const { views } = useArticleViews(articleLink);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <ThumbsUp size={11} color={TEXT_LIGHT} />
        <Text style={{ fontSize: 10, color: TEXT_LIGHT, fontWeight: '600' }}>{likes}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <Eye size={11} color={TEXT_LIGHT} />
        <Text style={{ fontSize: 10, color: TEXT_LIGHT, fontWeight: '600' }}>{views}</Text>
      </View>
    </View>
  );
}

// ─── 가로 스크롤 카드 (통일 디자인) ──────────────────────────────────────
const CARD_WIDTH = 200;

function HScrollCard({ article }: { article: Article }) {
  const { trackView } = useArticleViews(article.link);

  const handlePress = async () => {
    await trackView();
    if (article.link) Linking.openURL(article.link);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        width: CARD_WIDTH,
        marginRight: 12,
        backgroundColor: CARD,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: BORDER,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {/* 썸네일 */}
      <Image
        source={{ uri: article.image_url }}
        style={{ width: CARD_WIDTH, height: 120 }}
        resizeMode="cover"
      />
      {/* 텍스트 영역 */}
      <View style={{ padding: 10 }}>
        <Text
          style={{ fontSize: 12, fontWeight: '700', color: TEXT_PRIMARY, lineHeight: 17 }}
          numberOfLines={2}
        >
          {getTitle(article)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={{ fontSize: 10, color: TEXT_LIGHT }}>{formatDate(article.published)}</Text>
          <ArticleStats articleLink={article.link} />
        </View>
      </View>
    </Pressable>
  );
}

// ─── 소스별 가로 스크롤 섹션 (5+더보기5) ──────────────────────────────────
function SourceHScrollSection({
  sourceKey, articles,
}: {
  sourceKey: string; articles: Article[];
}) {
  const [showMore, setShowMore] = useState(false);

  if (!articles || articles.length === 0) return null;

  const name = SOURCE_NAMES[sourceKey] || sourceKey;
  const color = SOURCE_COLORS[sourceKey] || TEXT_SECONDARY;
  const first5 = articles.slice(0, 5);
  const more5 = articles.slice(5, 10);
  const visible = showMore ? [...first5, ...more5] : first5;

  return (
    <View style={{ marginBottom: 24 }}>
      {/* 소스 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: color, marginRight: 8 }} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, flex: 1 }}>
          {name}
        </Text>
        <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{articles.length}개</Text>
      </View>

      {/* 가로 스크롤 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
      >
        {visible.map((a, i) => (
          <HScrollCard key={`${sourceKey}-${i}`} article={a} />
        ))}

        {/* 더보기 버튼 */}
        {more5.length > 0 && !showMore && (
          <Pressable
            onPress={() => setShowMore(true)}
            style={{
              width: 80,
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

// ─── 하단 텍스트 섹션 (OpenAI, InfoQ) ───────────────────────────────────
function TextOnlySection({
  sourceKey, articles,
}: {
  sourceKey: string; articles: Article[];
}) {
  if (!articles || articles.length === 0) return null;

  const name = SOURCE_NAMES[sourceKey] || sourceKey;
  const color = SOURCE_COLORS[sourceKey] || TEXT_SECONDARY;

  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: color, marginRight: 8 }} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, flex: 1 }}>
          {name}
        </Text>
        <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{articles.length}개</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {articles.map((a, i) => (
          <TextOnlyCard key={`text-${sourceKey}-${i}`} article={a} color={color} />
        ))}
      </View>
    </View>
  );
}

function TextOnlyCard({ article, color }: { article: Article; color: string }) {
  const { trackView } = useArticleViews(article.link);

  const handlePress = async () => {
    await trackView();
    if (article.link) Linking.openURL(article.link);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: CARD,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: 'hidden',
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: color }} />
      <View style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: TEXT_PRIMARY, lineHeight: 18 }} numberOfLines={2}>
          {getTitle(article)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontSize: 10, color: TEXT_LIGHT }}>{formatDate(article.published)}</Text>
          <ArticleStats articleLink={article.link} />
        </View>
      </View>
      <ChevronRight size={14} color={TEXT_LIGHT} style={{ marginRight: 12 }} />
    </Pressable>
  );
}

// ─── 메인 화면 ──────────────────────────────────────────────────────────
export default function NewsScreen() {
  const [refreshing, setRefreshing] = useState(false);
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

  // 소스별 기사 그룹화 (이미지 소스)
  const groupedBySource: Record<string, Article[]> = {};
  for (const a of (newsData?.articles ?? [])) {
    const key = a.source_key || 'unknown';
    if (!groupedBySource[key]) groupedBySource[key] = [];
    groupedBySource[key].push(a);
  }

  // 텍스트 전용 소스 그룹화
  const groupedTextOnly: Record<string, Article[]> = {};
  for (const a of (newsData?.text_only_articles ?? [])) {
    const key = a.source_key || 'unknown';
    if (!groupedTextOnly[key]) groupedTextOnly[key] = [];
    groupedTextOnly[key].push(a);
  }

  const sourceOrder = newsData?.source_order ?? SOURCE_ORDER;
  const textOnlyOrder = newsData?.text_only_order ?? TEXT_ONLY_ORDER;
  const totalArticles = (newsData?.articles?.length ?? 0) + (newsData?.text_only_articles?.length ?? 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ─── 헤더 ─── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: BG,
      }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginRight: 10,
        }}>
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>A</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY }}>AI News</Text>
          {totalArticles > 0 && (
            <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{totalArticles}개 기사</Text>
          )}
        </View>
        <Pressable onPress={openDrawer} style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
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
        ) : (
          <>
            {/* 이미지 소스 — 가로 스크롤 섹션 */}
            {sourceOrder.map(key => (
              <SourceHScrollSection
                key={key}
                sourceKey={key}
                articles={groupedBySource[key] || []}
              />
            ))}

            {/* 구분선 */}
            {(newsData?.text_only_articles?.length ?? 0) > 0 && (
              <View style={{ height: 1, backgroundColor: BORDER, marginHorizontal: 16, marginVertical: 8 }} />
            )}

            {/* 텍스트 전용 소스 — 하단 세로 리스트 */}
            {textOnlyOrder.map(key => (
              <TextOnlySection
                key={key}
                sourceKey={key}
                articles={groupedTextOnly[key] || []}
              />
            ))}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
