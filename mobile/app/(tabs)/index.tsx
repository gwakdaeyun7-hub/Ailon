/**
 * AI 뉴스 피드 — 14개 소스별 섹션, 썸네일+제목, 탭→원문
 */

import React from 'react';
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
import { Menu, ExternalLink, RefreshCw } from 'lucide-react-native';
import { useNews } from '@/hooks/useNews';
import { useDrawer } from '@/context/DrawerContext';
import { NewsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import type { Article } from '@/lib/types';

// ─── 색상 ───────────────────────────────────────────────────────────────
const BG = '#F9FAFB';
const CARD = '#FFFFFF';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_LIGHT = '#9CA3AF';
const BORDER = '#F3F4F6';

// 소스별 브랜드 색상
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

// 소스 표시 순서 (Firestore source_order와 동일)
const SOURCE_ORDER = [
  'wired_ai', 'the_verge_ai', 'techcrunch_ai', 'venturebeat_ai',
  'mit_tech_review', 'infoq_ai',
  'openai_blog', 'deepmind_blog', 'nvidia_blog', 'huggingface_blog',
  'aitimes', 'geeknews', 'zdnet_korea', 'hankyung_it',
];

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

// ─── 뉴스 카드 (썸네일 + 제목) ─────────────────────────────────────────
function NewsCard({ article, accentColor }: { article: Article; accentColor: string }) {
  return (
    <Pressable
      onPress={() => article.link && Linking.openURL(article.link)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: CARD,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: BORDER,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {/* 썸네일 */}
      {article.image_url ? (
        <Image
          source={{ uri: article.image_url }}
          style={{ width: 80, height: 80 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{
          width: 80,
          height: 80,
          backgroundColor: accentColor + '15',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: accentColor + '25',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ExternalLink size={14} color={accentColor} />
          </View>
        </View>
      )}

      {/* 제목 + 날짜 */}
      <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12 }}>
        <Text
          style={{ fontSize: 13, fontWeight: '600', color: TEXT_PRIMARY, lineHeight: 18 }}
          numberOfLines={2}
        >
          {getTitle(article)}
        </Text>
        <Text style={{ fontSize: 10, color: TEXT_LIGHT, marginTop: 4 }}>
          {formatDate(article.published)}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── 소스 섹션 ──────────────────────────────────────────────────────────
function SourceSection({
  sourceKey, articles,
}: {
  sourceKey: string; articles: Article[];
}) {
  if (!articles || articles.length === 0) return null;

  const name = SOURCE_NAMES[sourceKey] || sourceKey;
  const color = SOURCE_COLORS[sourceKey] || TEXT_SECONDARY;
  const imgCount = articles.filter(a => a.image_url).length;

  return (
    <View style={{ marginBottom: 24 }}>
      {/* 소스 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 }}>
        <View style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: color, marginRight: 8 }} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: TEXT_PRIMARY, flex: 1 }}>
          {name}
        </Text>
        <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>
          {articles.length}개 {imgCount > 0 ? `· 이미지 ${imgCount}` : ''}
        </Text>
      </View>

      {/* 기사 리스트 */}
      <View style={{ paddingHorizontal: 16 }}>
        {articles.map((article, i) => (
          <NewsCard
            key={`${sourceKey}-${i}`}
            article={article}
            accentColor={color}
          />
        ))}
      </View>
    </View>
  );
}

// ─── 메인 화면 ──────────────────────────────────────────────────────────
export default function NewsScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const { openDrawer, setActiveTab } = useDrawer();
  const { newsData, loading, error, refresh } = useNews();

  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('news');
    }, [setActiveTab])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // 소스별 기사 그룹화
  const groupedBySource: Record<string, Article[]> = {};
  for (const article of (newsData?.articles ?? [])) {
    const key = article.source_key || 'unknown';
    if (!groupedBySource[key]) groupedBySource[key] = [];
    groupedBySource[key].push(article);
  }

  const sourceOrder = newsData?.source_order ?? SOURCE_ORDER;
  const totalArticles = newsData?.articles?.length ?? 0;
  const totalImages = (newsData?.articles ?? []).filter(a => a.image_url).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ─── 헤더 ─── */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: BG,
      }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: '#000000',
          alignItems: 'center', justifyContent: 'center', marginRight: 10,
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>A</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY }}>AI News</Text>
          {totalArticles > 0 && (
            <Text style={{ fontSize: 11, color: TEXT_LIGHT }}>
              {totalArticles}개 기사 · 이미지 {totalImages}개
            </Text>
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
        {/* 로딩 */}
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
            <Pressable onPress={refresh} style={{ backgroundColor: '#000000', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>다시 시도</Text>
            </Pressable>
          </View>
        ) : totalArticles === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ color: TEXT_LIGHT, fontSize: 14 }}>아직 뉴스가 없어요</Text>
          </View>
        ) : (
          <>
            {sourceOrder.map(key => (
              <SourceSection
                key={key}
                sourceKey={key}
                articles={groupedBySource[key] || []}
              />
            ))}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
