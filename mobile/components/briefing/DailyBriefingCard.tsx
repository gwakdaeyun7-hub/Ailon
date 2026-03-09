/**
 * Daily Briefing Card — Morphing Blob 스타일 리뉴얼
 * 접힌 상태: 미니 카드 (글로우 + TTS + 기사 수)
 * 펼친 상태: 데이터 분석 리포트 (KPI 그리드 + 도넛 차트 + 태그 클라우드 + 브리핑 전문)
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated as RNAnimated,
} from 'react-native';
import {
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Newspaper,
  TrendingUp,
  Zap,
  Hash,
  BarChart3,
} from 'lucide-react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Speech from '@/lib/speech';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useBriefing } from '@/hooks/useBriefing';
import { useNews } from '@/hooks/useNews';
import type { Article } from '@/lib/types';

// Android LayoutAnimation 활성화
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── 도넛 차트 카테고리 색상 ──
const CATEGORY_COLORS = {
  research: '#14B8A6',
  models_products: '#8B5CF6',
  industry_business: '#F59E0B',
} as const;

const CATEGORY_LABELS: Record<string, Record<'ko' | 'en', string>> = {
  research: { ko: '연구', en: 'Research' },
  models_products: { ko: '모델/제품', en: 'Models' },
  industry_business: { ko: '산업', en: 'Industry' },
};

// ── 카테고리 통계 계산 (categorized_articles fallback) ──
function computeCategoryStats(
  categorizedArticles?: Record<string, Article[]>,
  backendStats?: {
    research: number;
    models_products: number;
    industry_business: number;
    total: number;
  },
) {
  if (backendStats && backendStats.total > 0) return backendStats;
  if (!categorizedArticles) return null;
  const research = categorizedArticles['research']?.length ?? 0;
  const models_products = categorizedArticles['models_products']?.length ?? 0;
  const industry_business =
    categorizedArticles['industry_business']?.length ?? 0;
  const total = research + models_products + industry_business;
  if (total === 0) return null;
  return { research, models_products, industry_business, total };
}

// ── 태그 클라우드 추출 (categorized_articles에서 상위 tags 추출) ──
function extractTopTags(
  categorizedArticles?: Record<string, Article[]>,
  lang: 'ko' | 'en' = 'ko',
  maxTags = 12,
): { tag: string; count: number }[] {
  if (!categorizedArticles) return [];
  const freq: Record<string, number> = {};
  for (const articles of Object.values(categorizedArticles)) {
    for (const article of articles) {
      const tags = lang === 'en' ? (article.tags_en ?? article.tags) : article.tags;
      if (!tags) continue;
      for (const tag of tags) {
        const normalized = tag.trim().toLowerCase();
        if (normalized.length < 2) continue;
        freq[normalized] = (freq[normalized] ?? 0) + 1;
      }
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTags)
    .map(([tag, count]) => ({ tag, count }));
}

// ── 도넛 차트 컴포넌트 ──
const DonutChart = React.memo(function DonutChart({
  stats,
  lang,
  size = 120,
  textColor = '#E7E5E4',
  subTextColor = '#A8A29E',
}: {
  stats: { research: number; models_products: number; industry_business: number; total: number };
  lang: 'ko' | 'en';
  size?: number;
  textColor?: string;
  subTextColor?: string;
}) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const segments = [
    { key: 'research' as const, value: stats.research },
    { key: 'models_products' as const, value: stats.models_products },
    { key: 'industry_business' as const, value: stats.industry_business },
  ].filter((s) => s.value > 0);

  let cumulativeOffset = 0;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          {segments.map((segment) => {
            const ratio = segment.value / stats.total;
            const dashLength = ratio * circumference;
            const gapLength = circumference - dashLength;
            const offset = cumulativeOffset;
            cumulativeOffset += dashLength;

            return (
              <Circle
                key={segment.key}
                cx={center}
                cy={center}
                r={radius}
                stroke={CATEGORY_COLORS[segment.key]}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${gapLength}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                fill="none"
              />
            );
          })}
        </G>
      </Svg>
      {/* 가운데 총 기사 수 */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: textColor,
          }}
        >
          {stats.total}
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: subTextColor,
            marginTop: -2,
          }}
        >
          {lang === 'en' ? 'articles' : '기사'}
        </Text>
      </View>
    </View>
  );
});

// ── KPI 카드 ──
const KPICard = React.memo(function KPICard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bgColor,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Icon size={16} color={color} />
      <Text style={{ fontSize: 20, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 10, color: color + 'BB', fontWeight: '500' }}>
        {label}
      </Text>
    </View>
  );
});

// ── 메인 컴포넌트 ──
export const DailyBriefingCard = React.memo(function DailyBriefingCard() {
  const { lang, t } = useLanguage();
  const { colors, isDark } = useTheme();
  const { briefing, loading } = useBriefing();
  const { newsData } = useNews();
  const [speaking, setSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // 글로우 애니메이션
  const glowAnim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(glowAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: false,
        }),
        RNAnimated.timing(glowAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glowAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const text = briefing
    ? lang === 'en'
      ? briefing.briefing_en
      : briefing.briefing_ko
    : '';

  const handleTTS = useCallback(() => {
    if (!Speech || !text) return;
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
    } else {
      Speech.speak(text, {
        language: lang === 'en' ? 'en-US' : 'ko-KR',
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
      });
      setSpeaking(true);
    }
  }, [speaking, text, lang]);

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  // 데이터 계산
  const categoryStats = useMemo(
    () =>
      computeCategoryStats(
        newsData?.categorized_articles,
        briefing?.category_stats,
      ),
    [newsData?.categorized_articles, briefing?.category_stats],
  );

  const topTags = useMemo(
    () => extractTopTags(newsData?.categorized_articles, lang),
    [newsData?.categorized_articles, lang],
  );

  const highlightCount = newsData?.highlights?.length ?? 0;
  const uniqueTopics = useMemo(() => {
    if (!newsData?.categorized_articles) return 0;
    const clusters = new Set<string>();
    for (const articles of Object.values(newsData.categorized_articles)) {
      for (const a of articles) {
        if (a.topic_cluster_id) clusters.add(a.topic_cluster_id);
      }
    }
    return clusters.size;
  }, [newsData?.categorized_articles]);

  const categoryCount = useMemo(() => {
    if (!categoryStats) return 0;
    let count = 0;
    if (categoryStats.research > 0) count++;
    if (categoryStats.models_products > 0) count++;
    if (categoryStats.industry_business > 0) count++;
    return count;
  }, [categoryStats]);

  if (loading || !briefing) return null;

  // ── 접힌 상태 ──
  if (!expanded) {
    return (
      <View style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 8 }}>
        <Pressable
          onPress={toggleExpand}
          accessibilityRole="button"
          accessibilityLabel={t('briefing.readMore')}
        >
          <RNAnimated.View
            style={{
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              borderRadius: 18,
              backgroundColor: colors.primary,
              opacity: glowOpacity,
            }}
          />
          <View
            style={{
              backgroundColor: isDark ? '#1E2A2A' : '#EBF8F7',
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* 왼쪽: 글로우 도트 + 레이블 */}
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primary,
                marginRight: 10,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: colors.textPrimary,
                }}
              >
                {t('briefing.title')}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  marginTop: 1,
                }}
              >
                {briefing.story_count}
                {t('briefing.stories')}
              </Text>
            </View>

            {/* TTS 버튼 (접힌 상태에서도 재생 가능) */}
            {text ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleTTS();
                }}
                hitSlop={8}
                accessibilityLabel={
                  speaking ? t('briefing.stop') : t('briefing.listen')
                }
                accessibilityRole="button"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: speaking
                    ? colors.primary + '30'
                    : colors.primary + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                {speaking ? (
                  <Pause size={14} color={colors.primary} />
                ) : (
                  <Play size={14} color={colors.primary} />
                )}
              </Pressable>
            ) : null}

            {/* 미니 스파크라인 힌트 (카테고리 바) */}
            {categoryStats ? (
              <View
                style={{
                  flexDirection: 'row',
                  height: 20,
                  width: 36,
                  borderRadius: 4,
                  overflow: 'hidden',
                  marginRight: 6,
                }}
              >
                {(['research', 'models_products', 'industry_business'] as const).map(
                  (cat) => {
                    const ratio =
                      categoryStats[cat] / categoryStats.total;
                    if (ratio === 0) return null;
                    return (
                      <View
                        key={cat}
                        style={{
                          flex: ratio,
                          backgroundColor: CATEGORY_COLORS[cat],
                        }}
                      />
                    );
                  },
                )}
              </View>
            ) : null}

            <ChevronDown size={16} color={colors.textSecondary} />
          </View>
        </Pressable>
      </View>
    );
  }

  // ── 펼친 상태 ──
  return (
    <View style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 8 }}>
      <View
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.primary + '30',
        }}
      >
        {/* 그라디언트 히어로 헤더 */}
        <View
          style={{
            backgroundColor: isDark ? '#0F2928' : '#D5F0EE',
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.primary + '25',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Newspaper size={18} color={colors.primary} />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '800',
                    color: colors.textPrimary,
                  }}
                >
                  {t('briefing.title')}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    marginTop: 1,
                  }}
                >
                  {briefing.story_count}
                  {t('briefing.stories')}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {/* TTS 컨트롤 */}
              {text ? (
                <Pressable
                  onPress={handleTTS}
                  accessibilityLabel={
                    speaking ? t('briefing.stop') : t('briefing.listen')
                  }
                  accessibilityRole="button"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: speaking
                      ? colors.primary + '30'
                      : colors.primary + '15',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 16,
                    gap: 5,
                  }}
                >
                  {speaking ? (
                    <Pause size={13} color={colors.primary} />
                  ) : (
                    <Play size={13} color={colors.primary} />
                  )}
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.primary,
                    }}
                  >
                    {speaking ? t('briefing.stop') : t('briefing.listen')}
                  </Text>
                </Pressable>
              ) : null}

              {/* 접기 버튼 */}
              <Pressable
                onPress={toggleExpand}
                hitSlop={8}
                accessibilityLabel={t('briefing.collapse')}
                accessibilityRole="button"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronUp size={16} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          {/* TTS 프로그레스 바 (재생 중 표시) */}
          {speaking && (
            <View
              style={{
                height: 3,
                backgroundColor: colors.primary + '20',
                borderRadius: 2,
                marginTop: 12,
                overflow: 'hidden',
              }}
            >
              <RNAnimated.View
                style={{
                  height: 3,
                  backgroundColor: colors.primary,
                  borderRadius: 2,
                  width: '60%',
                }}
              />
            </View>
          )}
        </View>

        {/* 본문 영역 */}
        <View
          style={{
            backgroundColor: isDark ? '#1A2322' : '#F4FBFA',
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          {/* 2x2 KPI 인사이트 그리드 */}
          <View style={{ gap: 8, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <KPICard
                icon={Newspaper}
                label={t('briefing.articles')}
                value={categoryStats?.total ?? briefing.story_count}
                color={CATEGORY_COLORS.research}
                bgColor={CATEGORY_COLORS.research + '15'}
              />
              <KPICard
                icon={Hash}
                label={t('briefing.topics')}
                value={uniqueTopics || '--'}
                color={CATEGORY_COLORS.models_products}
                bgColor={CATEGORY_COLORS.models_products + '15'}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <KPICard
                icon={Zap}
                label={t('briefing.highlights')}
                value={highlightCount || '--'}
                color={CATEGORY_COLORS.industry_business}
                bgColor={CATEGORY_COLORS.industry_business + '15'}
              />
              <KPICard
                icon={BarChart3}
                label={t('briefing.categories')}
                value={categoryCount || '--'}
                color={colors.primary}
                bgColor={colors.primary + '15'}
              />
            </View>
          </View>

          {/* 도넛 차트 + 범례 */}
          {categoryStats && categoryStats.total > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? '#15201F' : '#EDF7F6',
                borderRadius: 14,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <DonutChart stats={categoryStats} lang={lang} size={110} textColor={colors.textPrimary} subTextColor={colors.textSecondary} />
              <View style={{ flex: 1, marginLeft: 20, gap: 10 }}>
                {(
                  [
                    'research',
                    'models_products',
                    'industry_business',
                  ] as const
                ).map((cat) => {
                  const count = categoryStats[cat];
                  if (count === 0) return null;
                  const pct = Math.round(
                    (count / categoryStats.total) * 100,
                  );
                  return (
                    <View
                      key={cat}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          backgroundColor: CATEGORY_COLORS[cat],
                          marginRight: 8,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                          flex: 1,
                        }}
                      >
                        {CATEGORY_LABELS[cat][lang]}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: colors.textPrimary,
                          marginRight: 4,
                        }}
                      >
                        {count}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.textSecondary,
                        }}
                      >
                        ({pct}%)
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 키워드 태그 클라우드 */}
          {topTags.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.textSecondary,
                  marginBottom: 10,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {t('modal.tags')}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                {topTags.map(({ tag, count }) => {
                  // 크기 변화: count 기반 (최소 11, 최대 15)
                  const maxCount = topTags[0]?.count ?? 1;
                  const ratio = count / maxCount;
                  const fontSize = 11 + ratio * 4;
                  const opacity = 0.6 + ratio * 0.4;
                  return (
                    <View
                      key={tag}
                      style={{
                        backgroundColor: colors.primary + Math.round(opacity * 20).toString(16).padStart(2, '0'),
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontSize,
                          color: colors.primary,
                          fontWeight: ratio > 0.5 ? '600' : '400',
                          opacity,
                        }}
                      >
                        {tag}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 브리핑 텍스트 전문 */}
          {text ? (
            <View
              style={{
                backgroundColor: isDark ? '#15201F' : '#EDF7F6',
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textPrimary,
                  lineHeight: 22,
                }}
              >
                {text}
              </Text>
            </View>
          ) : null}

          {/* 하단 접기 버튼 */}
          <Pressable
            onPress={toggleExpand}
            accessibilityLabel={t('briefing.collapse')}
            accessibilityRole="button"
            style={{
              alignSelf: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 14,
              backgroundColor: colors.primary + '12',
              gap: 4,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.primary,
              }}
            >
              {t('briefing.collapse')}
            </Text>
            <ChevronUp size={14} color={colors.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
});
