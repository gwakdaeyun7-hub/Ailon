/**
 * AI 도구 & 팁 — 독립 탭 (뉴스 → 학문스낵 → AI 도구 → 저장 → 프로필)
 * daily_tools/{date} 기반 도구 카드 + 팁 + 카테고리 필터 + 날짜 네비게이션
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Wand2 } from 'lucide-react-native';
import { useTools } from '@/hooks/useTools';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { ToolsContent } from '@/components/tools/ToolsContent';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr?: string, lang?: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    if (lang === 'en') return `${EN_MONTHS[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
    return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일`;
  } catch { return ''; }
}

const TOOL_CATEGORIES = [null, 'coding', 'research', 'productivity', 'creative', 'writing', 'other'] as const;

// ─── Category Filter ─────────────────────────────────────────────────────────

function CategoryFilter({ selected, onSelect }: {
  selected: string | null;
  onSelect: (cat: string | null) => void;
}) {
  const { t } = useLanguage();
  const { colors } = useTheme();

  const labels: Record<string, string> = {
    all: t('feed.all'),
    coding: t('tools.cat_coding'),
    research: t('tools.cat_research'),
    productivity: t('tools.cat_productivity'),
    creative: t('tools.cat_creative'),
    writing: t('tools.cat_writing'),
    other: t('tools.cat_other'),
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
      style={{ marginBottom: 16 }}
    >
      {TOOL_CATEGORIES.map((cat) => {
        const isActive = cat === selected;
        const key = cat ?? 'all';
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(cat)}
            hitSlop={{ top: 7, bottom: 7 }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={{
              backgroundColor: isActive ? colors.primaryLight : colors.surface,
              borderWidth: 1,
              borderColor: isActive ? colors.primaryBorder : colors.border,
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: isActive ? '700' : '600',
              color: isActive ? colors.primary : colors.textDim,
            }}>
              {labels[key]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ToolsScreen() {
  const {
    toolsData, loading, error, refresh,
    currentDate, goNext, goPrev, canGoNext, canGoPrev,
  } = useTools();
  const { t, lang } = useLanguage();
  const { colors } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    if (scrollable > 0) setScrollProgress(Math.min(contentOffset.y / scrollable, 1));
  }, []);

  // Filter tools by category
  const filteredData = useMemo(() => {
    if (!toolsData) return null;
    if (!selectedCategory) return toolsData;
    return {
      ...toolsData,
      tools: toolsData.tools.filter(t => t.category === selectedCategory),
    };
  }, [toolsData, selectedCategory]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Scroll progress bar */}
      <View style={{ height: 3, backgroundColor: 'transparent' }}>
        <View style={{
          height: 3, backgroundColor: colors.primary,
          width: `${scrollProgress * 100}%`,
          borderTopRightRadius: 2, borderBottomRightRadius: 2,
        }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.textSecondary} />
        }
      >
        {/* ─── Header ─── */}
        <View style={{ paddingTop: 20, paddingBottom: 20 }}>
          {/* Title + date navigation */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textDim }}>
              {t('tools.title')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Pressable
                onPress={goPrev}
                disabled={!canGoPrev}
                style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: canGoPrev ? 1 : 0.3 }}
                accessibilityLabel={lang === 'en' ? 'Previous day' : '이전 날짜'}
                accessibilityRole="button"
              >
                <ChevronLeft size={20} color={colors.textSecondary} />
              </Pressable>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {formatDate(currentDate, lang)}
              </Text>
              <Pressable
                onPress={goNext}
                disabled={!canGoNext}
                style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: canGoNext ? 1 : 0.3 }}
                accessibilityLabel={lang === 'en' ? 'Next day' : '다음 날짜'}
                accessibilityRole="button"
              >
                <ChevronRight size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
          <View style={{ width: 32, height: 3, backgroundColor: colors.primary, borderRadius: 2 }} />
        </View>

        {/* ─── Category Filter ─── */}
        {!loading && !error && toolsData && toolsData.tools?.length > 0 && (
          <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
        )}

        {/* ─── Content ─── */}
        <ToolsContent
          toolsData={filteredData}
          loading={loading}
          error={error}
          onRefresh={refresh}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
