/**
 * Daily Briefing Card
 * Collapsed: TTS + label + article count + chevron
 * Expanded: Header + Donut + Hot Topics + Sparkline + Briefing Text + Collapse
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
} from 'react-native';
import {
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
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

// ── Domain color map key → theme color key ──
const DOMAIN_COLOR_KEYS: Record<string, string> = {
  NLP: 'domainNLP',
  Vision: 'domainVision',
  ML: 'domainML',
  Robotics: 'domainRobotics',
  Multimodal: 'domainMultimodal',
  Infra: 'domainNLP', // reuse teal
  Business: 'domainBusiness',
  Regulation: 'domainBusiness', // reuse indigo
  Audio: 'domainMultimodal', // reuse rose
  Security: 'domainSecurity',
  Science: 'domainScience',
  Dev: 'domainDev',
  Others: 'domainOthers',
};

// ── Domain aliases for client-side fallback ──
const DOMAIN_ALIASES: Record<string, string> = {
  nlp: 'NLP', language: 'NLP', text: 'NLP',
  search: 'NLP', chatbot: 'NLP', rag: 'NLP', translation: 'NLP',
  vision: 'Vision', image: 'Vision', video: 'Vision',
  visual: 'Vision', '3d': 'Vision',
  ml: 'ML', training: 'ML', optimization: 'ML', machine_learning: 'ML',
  data: 'ML', analytics: 'ML', benchmark: 'ML', evaluation: 'ML',
  multimodal: 'Multimodal', agents: 'Multimodal',
  creative: 'Multimodal', generative: 'Multimodal', gaming: 'Multimodal',
  infra: 'Infra', compute: 'Infra', hardware: 'Infra',
  cloud: 'Infra', chip: 'Infra', edge: 'Infra', mobile: 'Infra',
  business: 'Business', funding: 'Business',
  startup: 'Business', enterprise: 'Business', education: 'Business',
  regulation: 'Regulation', policy: 'Regulation', safety: 'Regulation',
  ethics: 'Regulation', copyright: 'Regulation', governance: 'Regulation',
  robotics: 'Robotics', autonomous: 'Robotics', embodied: 'Robotics',
  drone: 'Robotics',
  audio: 'Audio', speech: 'Audio', music: 'Audio', voice: 'Audio',
  security: 'Security', cyber: 'Security', privacy: 'Security',
  adversarial: 'Security', surveillance: 'Security',
  science: 'Science', healthcare: 'Science', health: 'Science',
  medical: 'Science', drug: 'Science', bio: 'Science', biotech: 'Science',
  climate: 'Science', protein: 'Science', materials: 'Science',
  dev: 'Dev', coding: 'Dev', devops: 'Dev',
  software: 'Dev', code: 'Dev', testing: 'Dev',
};

type DomainStat = { domain: string; count: number };

// ── Compute domain stats from backend or client fallback ──
function computeDomainStats(
  backendDomainStats?: DomainStat[],
  categorizedArticles?: Record<string, Article[]>,
  highlights?: Article[],
): { items: DomainStat[]; total: number } | null {
  // Prefer backend data
  if (backendDomainStats && backendDomainStats.length > 0) {
    const total = backendDomainStats.reduce((s, d) => s + d.count, 0);
    if (total > 0) return { items: backendDomainStats, total };
  }
  // Client-side fallback
  if (!categorizedArticles) return null;
  const freq: Record<string, number> = {};
  const allArticles: Article[] = [...(highlights ?? [])];
  for (const arts of Object.values(categorizedArticles)) {
    allArticles.push(...arts);
  }
  const seen = new Set<string>();
  for (const a of allArticles) {
    if (a.link && seen.has(a.link)) continue;
    if (a.link) seen.add(a.link);
    const cluster = a.topic_cluster_id ?? '';
    let raw = cluster.includes('/') ? cluster.split('/')[0].trim().toLowerCase() : cluster.trim().toLowerCase();
    if (!raw) raw = 'other';
    const domain = DOMAIN_ALIASES[raw] ?? (raw.charAt(0).toUpperCase() + raw.slice(1));
    freq[domain] = (freq[domain] ?? 0) + 1;
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const items: DomainStat[] = [];
  let othersCount = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i < 5) items.push({ domain: sorted[i][0], count: sorted[i][1] });
    else othersCount += sorted[i][1];
  }
  if (othersCount > 0) items.push({ domain: 'Others', count: othersCount });
  const total = items.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;
  return { items, total };
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

// ── Donut Chart (domain-based) ──
const DonutChart = React.memo(function DonutChart({
  domainStats,
  lang,
  colorMap,
  size = 120,
  textColor = '#E7E5E4',
  subTextColor = '#A8A29E',
}: {
  domainStats: { items: DomainStat[]; total: number };
  lang: 'ko' | 'en';
  colorMap: Record<string, string>;
  size?: number;
  textColor?: string;
  subTextColor?: string;
}) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulativeOffset = 0;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          {domainStats.items.map((item) => {
            if (item.count <= 0) return null;
            const ratio = item.count / domainStats.total;
            const dashLength = ratio * circumference;
            const gapLength = circumference - dashLength;
            const offset = cumulativeOffset;
            cumulativeOffset += dashLength;

            return (
              <Circle
                key={item.domain}
                cx={center}
                cy={center}
                r={radius}
                stroke={colorMap[item.domain] ?? colorMap['Others']}
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
          {domainStats.total}
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
      {/* Date labels */}
      {labelIndices.map((idx) => {
        const isLast = idx === data.length - 1;
        return (
          <SvgText
            key={idx}
            x={points[idx].x}
            y={height - 6}
            textAnchor={idx === 0 ? 'start' : idx === data.length - 1 ? 'end' : 'middle'}
            fontSize={10}
            fontWeight={isLast ? '700' : '400'}
            fill={isLast ? textColor : dimColor}
          >
            {formatDate(data[idx].date)}
          </SvgText>
        );
      })}
    </Svg>
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
  const domainStats = useMemo(
    () =>
      computeDomainStats(
        briefing?.domain_stats,
        newsData?.categorized_articles,
        newsData?.highlights,
      ),
    [briefing?.domain_stats, newsData?.categorized_articles, newsData?.highlights],
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

  const domainColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [domain, colorKey] of Object.entries(DOMAIN_COLOR_KEYS)) {
      map[domain] = (colors as any)[colorKey] ?? colors.domainOthers;
    }
    return map;
  }, [colors]);

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
                  <Pause size={14} color={colors.textPrimary} />
                ) : (
                  <Play size={14} color={colors.textPrimary} />
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

            <ChevronDown size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
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
            backgroundColor: colors.primaryLight,
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
                    <Pause size={14} color={colors.textPrimary} />
                  ) : (
                    <Play size={14} color={colors.textPrimary} />
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
                <ChevronUp size={16} color={colors.textPrimary} />
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
          {/* 1. Topic Domain Distribution (Donut) */}
          {domainStats && domainStats.total > 0 && (
            <View style={{ marginBottom: 20 }}>
              <SectionTitle title={t('briefing.domainDist')} color={colors.textSecondary} />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.primaryLight,
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <DonutChart
                  domainStats={domainStats}
                  lang={lang}
                  colorMap={domainColorMap}
                  size={110}
                  textColor={colors.textPrimary}
                  subTextColor={colors.textSecondary}
                />
                <View style={{ flex: 1, marginLeft: 20, gap: 10 }}>
                  {domainStats.items.map((item) => {
                    if (item.count <= 0) return null;
                    const pct = Math.round((item.count / domainStats.total) * 100);
                    const label = t(`domain.${item.domain}`) !== `domain.${item.domain}`
                      ? t(`domain.${item.domain}`)
                      : item.domain;
                    return (
                      <View
                        key={item.domain}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            backgroundColor: domainColorMap[item.domain] ?? domainColorMap['Others'],
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
                          {label}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: colors.textPrimary,
                            marginRight: 4,
                          }}
                        >
                          {item.count}
                        </Text>
                        <Text
                          style={{ fontSize: 11, color: colors.textSecondary }}
                        >
                          ({pct}%)
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* 2. Hot Topics */}
          {hotTopics.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <SectionTitle title={t('briefing.hotTopics')} color={colors.textSecondary} />
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
                          color: colors.textPrimary,
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
                  backgroundColor: colors.primaryLight,
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
                  backgroundColor: colors.primaryLight,
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
                color: colors.textPrimary,
              }}
            >
              {t('briefing.collapse')}
            </Text>
            <ChevronUp size={14} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
});
