/**
 * AI 뉴스 피드 — 3-Section 레이아웃
 * Section 1: 하이라이트 (Hero + 2x2 그리드)
 * Section 2: 카테고리별 가로 스크롤 (모델/연구, 제품/도구, 산업/비즈니스)
 * Section 3: 소스별 가로 스크롤 (한국 소스)
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
  Menu, RefreshCw, ThumbsUp, Eye,
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
  mit_tech_review: '#D32F2F',
  deepmind_blog: '#1D4ED8',
  nvidia_blog: '#76B900',
  huggingface_blog: '#FFD21E',
  aitimes: '#E53935',
  geeknews: '#FF6B35',
  ainews_kr: '#1E88E5',
  zdnet_ai_editor: '#D32F2F',
  yozm_ai: '#6366F1',
};

const SOURCE_NAMES: Record<string, string> = {
  wired_ai: 'Wired AI',
  the_verge_ai: 'The Verge AI',
  techcrunch_ai: 'TechCrunch AI',
  mit_tech_review: 'MIT Tech Review',
  deepmind_blog: 'Google DeepMind',
  nvidia_blog: 'NVIDIA AI',
  huggingface_blog: 'Hugging Face',
  aitimes: 'AI타임스',
  geeknews: 'GeekNews',
  ainews_kr: '인공지능신문',
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
const DEFAULT_SOURCE_ORDER = ['aitimes', 'geeknews', 'ainews_kr', 'zdnet_ai_editor', 'yozm_ai'];

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

// ─── 좋아요+뷰 카운트 ──────────────────────────────────────────────────
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

// ─── 소스 뱃지 ──────────────────────────────────────────────────────────
function SourceBadge({ sourceKey }: { sourceKey?: string }) {
  if (!sourceKey) return null;
  const name = SOURCE_NAMES[sourceKey] || sourceKey;
  const color = SOURCE_COLORS[sourceKey] || TEXT_SECONDARY;
  return (
    <View style={{
      backgroundColor: color + '18',
      paddingHorizontal: 6, paddingVertical: 2,
      borderRadius: 4, alignSelf: 'flex-start',
    }}>
      <Text style={{ fontSize: 9, fontWeight: '700', color }}>{name}</Text>
    </View>
  );
}

// ─── Section 1: 하이라이트 ──────────────────────────────────────────────
const HIGHLIGHT_CARD_WIDTH = 280;
const HIGHLIGHT_CARD_HEIGHT = 260;

function HighlightScrollCard({
  article, isFirst, isExpanded, onToggle,
}: {
  article: Article; isFirst?: boolean; isExpanded?: boolean; onToggle?: () => void;
}) {
  const { trackView } = useArticleViews(article.link);

  const handlePress = () => {
    if (onToggle) {
      onToggle();
    } else {
      trackView();
      if (article.link) Linking.openURL(article.link);
    }
  };

  const cardWidth = isFirst ? 300 : HIGHLIGHT_CARD_WIDTH;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        width: cardWidth,
        height: HIGHLIGHT_CARD_HEIGHT,
        marginRight: 12,
        backgroundColor: CARD,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: isExpanded ? 2 : 1,
        borderColor: isExpanded ? '#3B82F6' : BORDER,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {article.image_url ? (
        <Image
          source={{ uri: article.image_url }}
          style={{ width: cardWidth, height: 150 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ width: cardWidth, height: 150, backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28, color: TEXT_LIGHT }}>📰</Text>
        </View>
      )}
      <View style={{ padding: 12, flex: 1, justifyContent: 'space-between' }}>
        <View>
          <SourceBadge sourceKey={article.source_key} />
          <Text
            style={{ fontSize: 13, fontWeight: '800', color: TEXT_PRIMARY, lineHeight: 18, marginTop: 4 }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {getTitle(article)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 10, color: TEXT_LIGHT }}>{formatDate(article.published)}</Text>
          <ArticleStats articleLink={article.link} />
        </View>
      </View>
    </Pressable>
  );
}

function ExpandedSummary({ article, onClose }: { article: Article; onClose: () => void }) {
  const { trackView } = useArticleViews(article.link);

  const handleOpenOriginal = async () => {
    await trackView();
    if (article.link) Linking.openURL(article.link);
  };

  return (
    <View style={{
      marginHorizontal: 16, marginTop: 8, marginBottom: 12,
      backgroundColor: CARD, borderRadius: 12, padding: 16,
      borderWidth: 1, borderColor: '#3B82F6' + '40',
    }}>
      <Text style={{
        fontSize: 13, fontWeight: '800', color: TEXT_PRIMARY, lineHeight: 20, marginBottom: 10,
      }}>
        {getTitle(article)}
      </Text>
      <Text style={{
        fontSize: 13, color: TEXT_SECONDARY, lineHeight: 22,
      }}>
        {article.summary || '요약이 아직 없어요.'}
      </Text>
      <View style={{ flexDirection: 'row', marginTop: 14, gap: 10 }}>
        <Pressable
          onPress={handleOpenOriginal}
          style={{
            backgroundColor: '#000', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>원문 보기</Text>
        </Pressable>
        <Pressable
          onPress={onClose}
          style={{
            backgroundColor: BORDER, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
          }}
        >
          <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: '700' }}>접기</Text>
        </Pressable>
      </View>
    </View>
  );
}

function HighlightSection({ highlights }: { highlights: Article[] }) {
  const [expandedLink, setExpandedLink] = useState<string | null>(null);

  if (!highlights || highlights.length === 0) return null;

  const expandedArticle = expandedLink ? highlights.find(a => a.link === expandedLink) : null;

  return (
    <View style={{ paddingTop: 8, paddingBottom: 16, backgroundColor: '#F0F4FF' }}>
      {/* 섹션 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY }}>오늘의 하이라이트</Text>
        <Text style={{ fontSize: 11, color: TEXT_LIGHT, marginLeft: 8 }}>Top {highlights.length}</Text>
      </View>

      {/* 가로 스크롤 하이라이트 카드 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
      >
        {highlights.map((a, i) => (
          <HighlightScrollCard
            key={`hl-${i}`}
            article={a}
            isFirst={i === 0}
            isExpanded={expandedLink === a.link}
            onToggle={() => setExpandedLink(prev => prev === a.link ? null : a.link)}
          />
        ))}
      </ScrollView>

      {/* 펼쳐진 요약 (카드 아래 전체 너비) */}
      {expandedArticle && (
        <ExpandedSummary
          article={expandedArticle}
          onClose={() => setExpandedLink(null)}
        />
      )}
    </View>
  );
}

// ─── 가로 스크롤 카드 (통일 디자인) ──────────────────────────────────────
const CARD_WIDTH = 200;
const HCARD_HEIGHT = 220;

function HScrollCard({
  article, showSourceBadge, isExpanded, onToggle,
}: {
  article: Article; showSourceBadge?: boolean; isExpanded?: boolean; onToggle?: () => void;
}) {
  const { trackView } = useArticleViews(article.link);

  const handlePress = () => {
    if (onToggle) {
      onToggle();
    } else {
      trackView();
      if (article.link) Linking.openURL(article.link);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        width: CARD_WIDTH,
        height: HCARD_HEIGHT,
        marginRight: 12,
        backgroundColor: CARD,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: isExpanded ? 2 : 1,
        borderColor: isExpanded ? '#3B82F6' : BORDER,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {article.image_url ? (
        <Image
          source={{ uri: article.image_url }}
          style={{ width: CARD_WIDTH, height: 120 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ width: CARD_WIDTH, height: 120, backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28, color: TEXT_LIGHT }}>📰</Text>
        </View>
      )}
      <View style={{ padding: 10, flex: 1, justifyContent: 'space-between' }}>
        <View>
          {showSourceBadge && <SourceBadge sourceKey={article.source_key} />}
          <Text
            style={{ fontSize: 12, fontWeight: '700', color: TEXT_PRIMARY, lineHeight: 17, marginTop: showSourceBadge ? 4 : 0 }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {getTitle(article)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 10, color: TEXT_LIGHT }}>{formatDate(article.published)}</Text>
          <ArticleStats articleLink={article.link} />
        </View>
      </View>
    </Pressable>
  );
}

// ─── Section 2: 카테고리별 가로 스크롤 ──────────────────────────────────
function CategorySection({
  categoryKey, articles,
}: {
  categoryKey: string; articles: Article[];
}) {
  const [showMore, setShowMore] = useState(false);
  const [expandedLink, setExpandedLink] = useState<string | null>(null);

  if (!articles || articles.length === 0) return null;

  const name = CATEGORY_NAMES[categoryKey] || categoryKey;
  const color = CATEGORY_COLORS[categoryKey] || TEXT_SECONDARY;
  const first5 = articles.slice(0, 5);
  const more5 = articles.slice(5, 10);
  const visible = showMore ? [...first5, ...more5] : first5;
  const expandedArticle = expandedLink ? visible.find(a => a.link === expandedLink) : null;

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: color, marginRight: 8 }} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, flex: 1 }}>
          {name}
        </Text>
        <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{articles.length}개</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
      >
        {visible.map((a, i) => (
          <HScrollCard
            key={`${categoryKey}-${i}`}
            article={a}
            showSourceBadge
            isExpanded={expandedLink === a.link}
            onToggle={() => setExpandedLink(prev => prev === a.link ? null : a.link)}
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

      {expandedArticle && (
        <ExpandedSummary
          article={expandedArticle}
          onClose={() => setExpandedLink(null)}
        />
      )}
    </View>
  );
}

// ─── Section 3: 소스별 가로 스크롤 (한국 소스) ──────────────────────────
function SourceHScrollSection({
  sourceKey, articles,
}: {
  sourceKey: string; articles: Article[];
}) {
  const [showMore, setShowMore] = useState(false);
  const [expandedLink, setExpandedLink] = useState<string | null>(null);

  if (!articles || articles.length === 0) return null;

  const name = SOURCE_NAMES[sourceKey] || sourceKey;
  const color = SOURCE_COLORS[sourceKey] || TEXT_SECONDARY;
  const first5 = articles.slice(0, 5);
  const more5 = articles.slice(5, 10);
  const visible = showMore ? [...first5, ...more5] : first5;
  const expandedArticle = expandedLink ? visible.find(a => a.link === expandedLink) : null;

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: color, marginRight: 8 }} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, flex: 1 }}>
          {name}
        </Text>
        <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>{articles.length}개</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
      >
        {visible.map((a, i) => (
          <HScrollCard
            key={`${sourceKey}-${i}`}
            article={a}
            isExpanded={expandedLink === a.link}
            onToggle={() => setExpandedLink(prev => prev === a.link ? null : a.link)}
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

      {expandedArticle && (
        <ExpandedSummary
          article={expandedArticle}
          onClose={() => setExpandedLink(null)}
        />
      )}
    </View>
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
        ) : isLegacy ? (
          <>
            {/* 레거시 폴백: 기존 소스별 가로 스크롤 */}
            {legacySourceOrder.map(key => (
              <SourceHScrollSection
                key={key}
                sourceKey={key}
                articles={legacyGrouped[key] || []}
              />
            ))}
          </>
        ) : (
          <>
            {/* Section 1: 하이라이트 */}
            <HighlightSection highlights={highlights} />

            {/* Section 2: 카테고리별 뉴스 */}
            {categoryOrder.map(catKey => (
              <CategorySection
                key={catKey}
                categoryKey={catKey}
                articles={categorizedArticles[catKey] || []}
              />
            ))}

            {/* 구분선 */}
            {sourceOrder.some(key => (sourceArticles[key]?.length ?? 0) > 0) && (
              <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                <View style={{ height: 1, backgroundColor: BORDER }} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: TEXT_SECONDARY, marginTop: 12 }}>
                  소스별 뉴스
                </Text>
              </View>
            )}

            {/* Section 3: 소스별 뉴스 (한국 소스) */}
            {sourceOrder.map(key => (
              <SourceHScrollSection
                key={key}
                sourceKey={key}
                articles={sourceArticles[key] || []}
              />
            ))}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
