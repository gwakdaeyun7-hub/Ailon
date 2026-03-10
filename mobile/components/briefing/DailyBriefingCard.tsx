/**
 * Daily Briefing Card — Design 10 "Morphing Blob"
 * Collapsed: Blob glow + TTS + label + mini sparkline bars
 * Expanded: Header + Donut + Hot Topics + Sparkline + Briefing Text + Collapse
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
  ScrollView,
} from 'react-native';
import {
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Newspaper,
  Flame,
} from 'lucide-react-native';
import Svg, { Circle, G, Path, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import Speech from '@/lib/speech';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useBriefing } from '@/hooks/useBriefing';
import { useNews } from '@/hooks/useNews';
import type { Article } from '@/lib/types';

// Android LayoutAnimation
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORY_LABELS: Record<string, Record<'ko' | 'en', string>> = {
  research: { ko: '연구', en: 'Research' },
  models_products: { ko: '모델/제품', en: 'Models' },
  industry_business: { ko: '산업', en: 'Industry' },
};

// ── Category stats from categorized_articles or backend stats ──
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

// ── Extract top tags from categorized_articles ──
function extractTopTags(
  categorizedArticles?: Record<string, Article[]>,
  lang: 'ko' | 'en' = 'ko',
  maxTags = 8,
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

// ── Section Title ──
const SectionTitle = React.memo(function SectionTitle({
  icon: Icon,
  title,
  color,
}: {
  icon?: React.ElementType;
  title: string;
  color: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 }}>
      {Icon && <Icon size={14} color={color} />}
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
    </View>
  );
});

// ── Donut Chart ──
const DonutChart = React.memo(function DonutChart({
  stats,
  lang,
  categoryColors,
  size = 120,
  textColor = '#E7E5E4',
  subTextColor = '#A8A29E',
}: {
  stats: { research: number; models_products: number; industry_business: number; total: number };
  lang: 'ko' | 'en';
  categoryColors: Record<'research' | 'models_products' | 'industry_business', string>;
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
                stroke={categoryColors[segment.key]}
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
        <Text style={{ fontSize: 22, fontWeight: '800', color: textColor }}>
          {stats.total}
        </Text>
        <Text style={{ fontSize: 11, color: subTextColor, marginTop: -2 }}>
          {lang === 'en' ? 'articles' : '기사'}
        </Text>
      </View>
    </View>
  );
});

// ── Sparkline Chart (SVG) ──
const SparklineChart = React.memo(function SparklineChart({
  data,
  primaryColor,
  textColor,
  dimColor,
  width = 280,
  height = 100,
}: {
  data: { date: string; count: number }[];
  primaryColor: string;
  textColor: string;
  dimColor: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const paddingLeft = 8;
  const paddingRight = 8;
  const paddingTop = 12;
  const paddingBottom = 28;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const minVal = Math.min(...data.map((d) => d.count), 0);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartW;
    const y = paddingTop + chartH - ((d.count - minVal) / range) * chartH;
    return { x, y };
  });

  // Line path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  // Area fill path (closed at bottom)
  const areaPath =
    linePath +
    ` L${points[points.length - 1].x},${paddingTop + chartH}` +
    ` L${points[0].x},${paddingTop + chartH} Z`;

  const lastPoint = points[points.length - 1];

  // Date labels (show first, middle, last)
  const labelIndices = data.length <= 7
    ? data.map((_, i) => i)
    : [0, Math.floor(data.length / 2), data.length - 1];

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length >= 3) return `${parts[1]}.${parts[2]}`;
    return dateStr;
  };

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={primaryColor} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={primaryColor} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      {/* Area fill */}
      <Path d={areaPath} fill="url(#sparkFill)" />
      {/* Line */}
      <Path d={linePath} stroke={primaryColor} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {/* End dot */}
      <Circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={primaryColor} />
      <Circle cx={lastPoint.x} cy={lastPoint.y} r={6} fill={primaryColor} opacity={0.25} />
      {/* Date labels */}
      {labelIndices.map((idx) => {
        const isLast = idx === data.length - 1;
        return (
          <SvgText
            key={idx}
            x={points[idx].x}
            y={height - 6}
            textAnchor="middle"
            fontSize={10}
            fontWeight={isLast ? '700' : '400'}
            fill={isLast ? primaryColor : dimColor}
          >
            {formatDate(data[idx].date)}
          </SvgText>
        );
      })}
    </Svg>
  );
});

// ── Mini Donut Ring (collapsed state preview) ──
const MiniDonut = React.memo(function MiniDonut({
  stats,
  categoryColors,
}: {
  stats: { research: number; models_products: number; industry_business: number; total: number };
  categoryColors: Record<'research' | 'models_products' | 'industry_business', string>;
}) {
  const size = 20;
  const strokeWidth = 3;
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
              stroke={categoryColors[segment.key]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${gapLength}`}
              strokeDashoffset={-offset}
              fill="none"
            />
          );
        })}
      </G>
    </Svg>
  );
});

// ── Mini Sparkline Bars (collapsed state) ──
const MiniSparkBars = React.memo(function MiniSparkBars({
  data,
  primaryColor,
  dimColor,
}: {
  data: { date: string; count: number }[];
  primaryColor: string;
  dimColor: string;
}) {
  // Show last 7 entries (or fill with dummy)
  const bars = data.length >= 7 ? data.slice(-7) : data;
  if (bars.length === 0) return null;
  const maxVal = Math.max(...bars.map((d) => d.count), 1);
  const barHeight = 20;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: barHeight, width: 38, gap: 2 }}>
      {bars.map((d, i) => {
        const h = Math.max(4, (d.count / maxVal) * barHeight);
        const isLast = i === bars.length - 1;
        return (
          <View
            key={i}
            style={{
              width: 3.5,
              height: h,
              borderRadius: 1.5,
              backgroundColor: isLast ? primaryColor : dimColor,
            }}
          />
        );
      })}
    </View>
  );
});

// ── Main Component ──
export const DailyBriefingCard = React.memo(function DailyBriefingCard({
  scrollViewRef,
}: {
  scrollViewRef?: React.RefObject<ScrollView>;
}) {
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const { briefing, loading } = useBriefing();
  const { newsData } = useNews();
  const [speaking, setSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Glow animation (pulsing blob)
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
    outputRange: [0.25, 0.6],
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

  const cardRef = useRef<View>(null);

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  // 하단 접기: 접으면서 카드 위치로 스크롤
  const collapseWithScroll = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (scrollViewRef?.current && cardRef.current) {
      cardRef.current.measureLayout(
        scrollViewRef.current as any,
        (_x, y) => {
          scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: false });
        },
        () => {
          scrollViewRef.current?.scrollTo({ y: 0, animated: false });
        },
      );
    }
    setExpanded(false);
  }, [scrollViewRef]);

  // Data
  const categoryStats = useMemo(
    () =>
      computeCategoryStats(
        newsData?.categorized_articles,
        briefing?.category_stats,
      ),
    [newsData?.categorized_articles, briefing?.category_stats],
  );

  const hotTopics = useMemo(() => {
    if (briefing?.hot_topics && briefing.hot_topics.length > 0) {
      return briefing.hot_topics.slice(0, 8);
    }
    return extractTopTags(newsData?.categorized_articles, lang, 8);
  }, [briefing?.hot_topics, newsData?.categorized_articles, lang]);

  const trendData = useMemo(() => {
    return briefing?.trend_history ?? [];
  }, [briefing?.trend_history]);

  const dateLabel = useMemo(() => {
    if (!briefing?.date) return '';
    const parts = briefing.date.split('-');
    if (parts.length === 3) return `${parts[1]}.${parts[2]}`;
    return briefing.date;
  }, [briefing?.date]);

  const categoryColors = useMemo(() => ({
    research: colors.scoreResearch,
    models_products: colors.scoreProduct,
    industry_business: colors.scoreBiz,
  }), [colors.scoreResearch, colors.scoreProduct, colors.scoreBiz]);

  if (loading || !briefing) return null;

  // ── Collapsed State ──
  if (!expanded) {
    return (
      <View ref={cardRef} style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 12 }}>
        <Pressable
          onPress={toggleExpand}
          accessibilityRole="button"
          accessibilityLabel={t('briefing.readMore')}
        >
          {/* Blob glow */}
          <RNAnimated.View
            style={{
              position: 'absolute',
              top: -3,
              left: -3,
              right: -3,
              bottom: -3,
              borderRadius: 19,
              backgroundColor: colors.primary,
              opacity: glowOpacity,
            }}
          />
          <View
            style={{
              backgroundColor: colors.primaryLight,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* TTS button (left) */}
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
                  marginRight: 10,
                }}
              >
                {speaking ? (
                  <Pause size={14} color={colors.primary} />
                ) : (
                  <Play size={14} color={colors.primary} />
                )}
              </Pressable>
            ) : null}

            {/* Label */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: colors.textPrimary,
                  }}
                >
                  {t('briefing.title')}
                </Text>
              </View>
            </View>

            {/* Mini donut ring */}
            {categoryStats ? (
              <MiniDonut stats={categoryStats} categoryColors={categoryColors} />
            ) : null}

            <ChevronDown size={16} color={colors.textSecondary} style={{ marginLeft: 8 }} />
          </View>
        </Pressable>
      </View>
    );
  }

  // ── Expanded State ──
  return (
    <View ref={cardRef} style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 12 }}>
      <View
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.primaryBorder,
        }}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.highlightBg,
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
                    fontFamily: 'Lora-Bold',
                    color: colors.textPrimary,
                  }}
                >
                  {t('briefing.infographic')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1, gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textSecondary,
                    }}
                  >
                    {dateLabel}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {/* TTS */}
              {text ? (
                <Pressable
                  onPress={handleTTS}
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
                  }}
                >
                  {speaking ? (
                    <Pause size={14} color={colors.primary} />
                  ) : (
                    <Play size={14} color={colors.primary} />
                  )}
                </Pressable>
              ) : null}

              {/* Collapse */}
              <Pressable
                onPress={toggleExpand}
                hitSlop={8}
                accessibilityLabel={t('briefing.collapse')}
                accessibilityRole="button"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primary + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronUp size={16} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Body */}
        <View
          style={{
            backgroundColor: colors.primaryLight,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          {/* 1. Category Distribution (Donut) */}
          {categoryStats && categoryStats.total > 0 && (
            <View style={{ marginBottom: 20 }}>
              <SectionTitle title={t('briefing.categoryDist')} color={colors.textSecondary} />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.glossaryBg,
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <DonutChart
                  stats={categoryStats}
                  lang={lang}
                  categoryColors={categoryColors}
                  size={110}
                  textColor={colors.textPrimary}
                  subTextColor={colors.textSecondary}
                />
                <View style={{ flex: 1, marginLeft: 20, gap: 10 }}>
                  {(['research', 'models_products', 'industry_business'] as const).map(
                    (cat) => {
                      const count = categoryStats[cat];
                      if (count === 0) return null;
                      const pct = Math.round((count / categoryStats.total) * 100);
                      return (
                        <View
                          key={cat}
                          style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 3,
                              backgroundColor: categoryColors[cat],
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
                            style={{ fontSize: 11, color: colors.textSecondary }}
                          >
                            ({pct}%)
                          </Text>
                        </View>
                      );
                    },
                  )}
                </View>
              </View>
            </View>
          )}

          {/* 2. Hot Topics */}
          {hotTopics.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <SectionTitle icon={Flame} title={t('briefing.hotTopics')} color={colors.textSecondary} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {hotTopics.map(({ tag, count }, idx) => {
                  const isHot = idx < 3;
                  return (
                    <View
                      key={tag}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: isHot ? colors.primary + '60' : colors.border,
                        backgroundColor: isHot
                          ? colors.primary + '15'
                          : colors.tagBg,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: isHot ? '600' : '400',
                          color: isHot ? colors.primary : colors.tagText,
                        }}
                      >
                        {tag}
                        {count > 1 && (
                          <Text style={{ fontSize: 10, color: colors.textDim }}>
                            {' '}{count}
                          </Text>
                        )}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 3. 7-Day Trend Sparkline */}
          {trendData.length >= 2 && (
            <View style={{ marginBottom: 20 }}>
              <SectionTitle title={t('briefing.trend')} color={colors.textSecondary} />
              <View
                style={{
                  backgroundColor: colors.glossaryBg,
                  borderRadius: 14,
                  padding: 12,
                  alignItems: 'center',
                }}
              >
                <SparklineChart
                  data={trendData}
                  primaryColor={colors.primary}
                  textColor={colors.textPrimary}
                  dimColor={colors.textDim}
                  width={280}
                  height={100}
                />
              </View>
            </View>
          )}

          {/* 4. Briefing Text */}
          {text ? (
            <View style={{ marginBottom: 16 }}>
              <SectionTitle title={t('briefing.briefingText')} color={colors.textSecondary} />
              <View
                style={{
                  backgroundColor: colors.glossaryBg,
                  borderRadius: 12,
                  padding: 14,
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
            </View>
          ) : null}

          {/* Bottom collapse button */}
          <Pressable
            onPress={collapseWithScroll}
            accessibilityLabel={t('briefing.collapse')}
            accessibilityRole="button"
            style={{
              alignSelf: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
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
