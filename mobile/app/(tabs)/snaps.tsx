/**
 * 학문 스낵 -- 인사이트 / 딥다이브 2-탭 구조
 * 간소화된 SnackCard (3줄 스토리) + 타임라인 레일 + DeepDive 아코디언
 *
 * 인사이트 3섹션: foundation(headline/body/analogy), application(headline/body/mechanism), integration(headline/body/impact)
 * 딥다이브: history, mechanism, formula, modern
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Share,
  Platform,
  LayoutAnimation,
  UIManager,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookOpen,
  Lightbulb,
  Layers,
  Zap,
  History,
  Cpu,
  FlaskConical,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Share2,
  Bookmark,
  Landmark,
  Sigma,
  Dna,
  Scale,
  Brain,
  Atom,
  Clock,
} from 'lucide-react-native';
import { usePrinciple } from '@/hooks/usePrinciple';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { cardShadow, FontFamily } from '@/lib/theme';
import type { DailyPrinciples, Principle, DeepDive } from '@/lib/types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Helpers ----------------------------------------------------------------

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr?: string, lang?: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    if (lang === 'en') return `${EN_MONTHS[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
    return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일`;
  } catch { return ''; }
}

function L(ko: string, en: string | undefined, lang: string): string {
  if (lang === 'en' && en) return en;
  return ko;
}

function LArr(ko: string[], en: string[] | undefined, lang: string): string[] {
  if (lang === 'en' && en && en.length > 0) return en;
  return ko;
}

function getDisciplineName(data: DailyPrinciples, lang: string): string {
  if (lang === 'en' && data.discipline_info.name_en) return data.discipline_info.name_en;
  return data.discipline_info.name;
}

function animateLayout() {
  LayoutAnimation.configureNext(LayoutAnimation.create(
    250,
    LayoutAnimation.Types.easeInEaseOut,
    LayoutAnimation.Properties.opacity,
  ));
}

// --- Category Icon System ---------------------------------------------------

type CategoryIconConfig = {
  icon: React.ComponentType<{ size: number; color: string }>;
  lightColor: string;
  darkColor: string;
  lightBg: string;
  darkBg: string;
};

const CATEGORY_ICONS: Record<string, CategoryIconConfig> = {
  '학문 기원': { icon: Landmark, lightColor: '#B45309', darkColor: '#FBBF24', lightBg: '#FFFBEB', darkBg: '#2D2513' },
  '수학적 기초': { icon: Sigma, lightColor: '#0D7377', darkColor: '#2DD4BF', lightBg: '#F0FDFA', darkBg: '#112525' },
  '생물학적 영감': { icon: Dna, lightColor: '#15803D', darkColor: '#4ADE80', lightBg: '#F0FDF4', darkBg: '#052E16' },
  '철학적 토대': { icon: Scale, lightColor: '#6366F1', darkColor: '#A5B4FC', lightBg: '#EEF2FF', darkBg: '#1E1B4B' },
  '인지과학 연결': { icon: Brain, lightColor: '#7C3AED', darkColor: '#C4B5FD', lightBg: '#F5F3FF', darkBg: '#2E1065' },
  '물리학 최적화': { icon: Atom, lightColor: '#EA580C', darkColor: '#FB923C', lightBg: '#FFF7ED', darkBg: '#431407' },
};

function getCategoryConfig(superCategory: string, isDark: boolean): { Icon: React.ComponentType<{ size: number; color: string }>; color: string; bg: string } | null {
  const cfg = CATEGORY_ICONS[superCategory];
  if (!cfg) return null;
  return {
    Icon: cfg.icon,
    color: isDark ? cfg.darkColor : cfg.lightColor,
    bg: isDark ? cfg.darkBg : cfg.lightBg,
  };
}

// --- Badge Components -------------------------------------------------------

function ConnectionTypeBadge({ type, colors, lang }: { type: string; colors: Record<string, string>; lang: string }) {
  const config: Record<string, { bg: string; color: string; ko: string; en: string }> = {
    direct_inspiration: { bg: colors.coreTechBg, color: colors.coreTech, ko: '직접 영감', en: 'Direct' },
    structural_analogy: { bg: colors.indigoBg, color: colors.indigo, ko: '구조적 유사', en: 'Structural' },
    mathematical_foundation: { bg: colors.glossaryBg, color: colors.glossaryTerm, ko: '수학적 기반', en: 'Mathematical' },
  };
  const c = config[type];
  if (!c) return null;
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: c.color }}>{lang === 'en' ? c.en : c.ko}</Text>
    </View>
  );
}

function DifficultyBadge({ level, colors, lang, isDark }: { level: string; colors: Record<string, string>; lang: string; isDark: boolean }) {
  const config: Record<string, { lightBg: string; lightColor: string; darkBg: string; darkColor: string; ko: string; en: string }> = {
    beginner: { lightBg: '#F0FDF4', lightColor: '#15803D', darkBg: '#052E16', darkColor: '#4ADE80', ko: '입문', en: 'Easy' },
    intermediate: { lightBg: '#FFFBEB', lightColor: '#B45309', darkBg: '#2D2513', darkColor: '#FBBF24', ko: '중급', en: 'Medium' },
    advanced: { lightBg: '#FEF2F2', lightColor: '#DC2626', darkBg: '#3D1F1F', darkColor: '#FF5252', ko: '심화', en: 'Hard' },
  };
  const c = config[level];
  if (!c) return null;
  return (
    <View style={{ backgroundColor: isDark ? c.darkBg : c.lightBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? c.darkColor : c.lightColor }}>{lang === 'en' ? c.en : c.ko}</Text>
    </View>
  );
}

// --- Timeline Rail ----------------------------------------------------------

function TimelineRail({ children, stepColors }: { children: React.ReactNode; stepColors: string[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ position: 'relative', paddingLeft: 20, marginBottom: 8 }}>
      <View style={{
        position: 'absolute', left: 6, top: 0, bottom: 0, width: 4,
        backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden',
      }}>
        {stepColors.map((color, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: color, opacity: 0.3 }} />
        ))}
      </View>
      {children}
    </View>
  );
}

function TimelineNode({ color, bg, step }: { color: string; bg: string; step: number }) {
  return (
    <View style={{
      position: 'absolute', left: -20, top: 24, width: 28, height: 28,
      borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: color, zIndex: 1,
    }}>
      <Text style={{ fontSize: 13, fontWeight: '800', color }}>{step}</Text>
    </View>
  );
}

// --- Snack Card (unified for all 3 insight sections) ------------------------

interface SnackCardProps {
  step: number;
  emoji: string;
  label: string;
  headline: string;
  body: string;
  subLine: string;
  subEmoji: string;
  borderColor: string;
  nodeColor: string;
  nodeBg: string;
  subColor: string;
  IconComponent: React.ComponentType<{ size: number; color: string }>;
  keywords?: string[];
  isLast?: boolean;
}

function SnackCard({
  step, emoji, label, headline, body, subLine, subEmoji,
  borderColor, nodeColor, nodeBg, subColor, IconComponent,
  keywords, isLast,
}: SnackCardProps) {
  const { colors } = useTheme();

  return (
    <View style={{ position: 'relative', marginBottom: isLast ? 8 : 32 }}>
      <TimelineNode color={nodeColor} bg={nodeBg} step={step} />
      <View
        style={{
          backgroundColor: colors.card, borderRadius: 16, padding: 20,
          borderWidth: 1, borderColor: colors.border,
          borderLeftWidth: 4, borderLeftColor: borderColor,
          ...cardShadow,
        }}
        accessibilityRole="summary"
        accessibilityLabel={`${label}: ${headline}`}
      >
        {/* Section label row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 }}>
          <View style={{
            width: 28, height: 28, borderRadius: 9,
            backgroundColor: nodeBg, alignItems: 'center', justifyContent: 'center',
          }}>
            <IconComponent size={14} color={nodeColor} />
          </View>
          <Text style={{
            fontSize: 12, fontWeight: '700', color: colors.textDim,
            letterSpacing: 0.5, textTransform: 'uppercase',
          }}>
            {`[${step}] ${emoji} ${label}`}
          </Text>
        </View>

        {/* Headline -- quoted, bold */}
        <Text style={{
          fontSize: 16, fontWeight: '800', color: colors.textPrimary,
          lineHeight: 24, marginBottom: 10,
        }}>
          {`\u201C${headline}\u201D`}
        </Text>

        {/* Body -- 2~3 lines */}
        <Text style={{
          fontSize: 14, lineHeight: 22, color: colors.textSecondary,
          marginBottom: subLine ? 12 : 0,
        }}>
          {body}
        </Text>

        {/* Sub line -- colored box */}
        {subLine ? (
          <View style={{
            backgroundColor: nodeBg, borderRadius: 10,
            paddingHorizontal: 12, paddingVertical: 8,
            marginBottom: keywords && keywords.length > 0 ? 12 : 0,
          }}>
            <Text style={{ fontSize: 13, lineHeight: 20, color: subColor }}>
              {`${subEmoji} ${subLine}`}
            </Text>
          </View>
        ) : null}

        {/* Keywords (foundation card only) */}
        {keywords && keywords.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {keywords.map((kw) => (
              <View key={kw} style={{
                backgroundColor: colors.tagBg, borderRadius: 16,
                paddingHorizontal: 10, paddingVertical: 4,
              }}>
                <Text style={{ fontSize: 11, color: colors.tagText, fontWeight: '600' }}>{kw}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// --- Deep Dive Accordion ----------------------------------------------------

function DeepDiveAccordionSection({ icon, iconBg, title, children, defaultExpanded }: {
  icon: React.ReactNode; iconBg: string; title: string; children: React.ReactNode; defaultExpanded?: boolean;
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);

  const toggle = useCallback(() => {
    animateLayout();
    setExpanded(v => !v);
  }, []);

  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: 16, marginBottom: 16,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    }}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', padding: 20,
          opacity: pressed ? 0.7 : 1,
          ...(expanded ? { paddingBottom: 12 } : {}),
        })}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={{
          width: 30, height: 30, borderRadius: 10, backgroundColor: iconBg,
          alignItems: 'center', justifyContent: 'center', marginRight: 10,
        }}>
          {icon}
        </View>
        <Text style={{
          flex: 1, fontSize: 13, fontWeight: '700', color: colors.textDim,
          letterSpacing: 0.5, textTransform: 'uppercase',
        }}>{title}</Text>
        {expanded
          ? <ChevronUp size={18} color={colors.textDim} />
          : <ChevronDown size={18} color={colors.textDim} />
        }
      </Pressable>

      {/* Preview (collapsed): first 2 lines */}
      {!expanded && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          {children && React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === Text) {
              return React.cloneElement(child as React.ReactElement<any>, { numberOfLines: 2 });
            }
            return null;
          })}
        </View>
      )}

      {/* Full content (expanded) */}
      {expanded && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          {children}
        </View>
      )}
    </View>
  );
}

function DeepDiveContent({ deepDive, lang }: { deepDive: DeepDive; lang: string }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <>
      <DeepDiveAccordionSection
        icon={<History size={16} color={colors.coreTech} />}
        iconBg={colors.coreTechBg}
        title={t('snaps.history')}
        defaultExpanded
      >
        <Text style={{ fontSize: 15, lineHeight: 24, color: colors.textPrimary }}>
          {L(deepDive.history, deepDive.history_en, lang)}
        </Text>
      </DeepDiveAccordionSection>

      <DeepDiveAccordionSection
        icon={<FlaskConical size={16} color={colors.indigo} />}
        iconBg={colors.indigoBg}
        title={t('snaps.deep_mechanism')}
      >
        <Text style={{ fontSize: 15, lineHeight: 24, color: colors.textPrimary }}>
          {L(deepDive.mechanism, deepDive.mechanism_en, lang)}
        </Text>
      </DeepDiveAccordionSection>

      {deepDive.formula && (
        <DeepDiveAccordionSection
          icon={<Layers size={16} color={colors.primary} />}
          iconBg={colors.primaryLight}
          title={t('snaps.formula')}
        >
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <Text style={{
              fontSize: 14, lineHeight: 22, color: colors.textPrimary,
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            }}>
              {L(deepDive.formula, deepDive.formula_en, lang)}
            </Text>
          </View>
        </DeepDiveAccordionSection>
      )}

      <DeepDiveAccordionSection
        icon={<Globe size={16} color={colors.accent} />}
        iconBg={colors.surface}
        title={t('snaps.modern')}
      >
        <Text style={{ fontSize: 15, lineHeight: 24, color: colors.textPrimary }}>
          {L(deepDive.modern, deepDive.modern_en, lang)}
        </Text>
      </DeepDiveAccordionSection>
    </>
  );
}

// --- Action Bar -------------------------------------------------------------

function ActionBar({ principleData, lang }: { principleData: DailyPrinciples; lang: string }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { bookmarks, toggleBookmark } = useBookmarks(user?.uid ?? null);
  const itemId = principleData.date;
  const isBookmarked = bookmarks.some(b => (b.type === 'snap' || b.type === 'principle') && b.itemId === itemId);

  const handleBookmark = useCallback(() => {
    if (!user) return;
    toggleBookmark('snap', itemId, {
      title: principleData.principle?.title || '',
      subtitle: principleData.discipline_info?.name || '',
      category: principleData.discipline_info?.superCategory || '',
    });
  }, [user, principleData, itemId, toggleBookmark]);

  const handleShare = useCallback(async () => {
    const p = principleData.principle;
    if (!p) return;
    const title = lang === 'en' && p.title_en ? p.title_en : p.title;
    const headline = L(p.foundation.headline, p.foundation.headline_en, lang);
    await Share.share({
      message: `${title} \u2014 ${getDisciplineName(principleData, lang)}\n\n\u201C${headline}\u201D\n\n\u2014 Ailon`,
    });
  }, [principleData, lang]);

  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 8 }}>
      <Pressable onPress={handleBookmark} style={({ pressed }) => ({
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
        backgroundColor: isBookmarked ? colors.bookmarkActiveBg : colors.surface,
        borderWidth: 1, borderColor: isBookmarked ? colors.bookmarkActiveBorder : colors.border,
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, opacity: pressed ? 0.7 : 1,
      })} accessibilityLabel={lang === 'en' ? 'Bookmark' : '북마크'} accessibilityRole="button">
        <Bookmark size={18} color={isBookmarked ? colors.bookmarkActiveColor : colors.textDim} fill={isBookmarked ? colors.bookmarkActiveColor : 'none'} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: isBookmarked ? colors.bookmarkActiveColor : colors.textDim }}>
          {lang === 'en' ? (isBookmarked ? 'Saved' : 'Save') : (isBookmarked ? '저장됨' : '저장')}
        </Text>
      </Pressable>
      <Pressable onPress={handleShare} style={({ pressed }) => ({
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, opacity: pressed ? 0.7 : 1,
      })} accessibilityLabel={lang === 'en' ? 'Share' : '공유'} accessibilityRole="button">
        <Share2 size={18} color={colors.textDim} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textDim }}>{lang === 'en' ? 'Share' : '공유'}</Text>
      </Pressable>
    </View>
  );
}

// --- Skeleton ---------------------------------------------------------------

function SkeletonBlock({ width, height, rounded }: { width: number | `${number}%`; height: number; rounded?: number }) {
  const { colors } = useTheme();
  return <View style={{ width, height, backgroundColor: colors.surface, borderRadius: rounded ?? 8 }} />;
}

function SkeletonLoading() {
  const { colors } = useTheme();
  return (
    <View style={{ paddingTop: 8 }}>
      <View style={{ marginBottom: 24 }}>
        <SkeletonBlock width={80} height={22} rounded={11} />
        <View style={{ height: 10 }} />
        <SkeletonBlock width="70%" height={28} />
        <View style={{ height: 8 }} />
        <SkeletonBlock width="90%" height={16} />
      </View>
      {[colors.coreTech, colors.indigo, colors.primary].map((stripe, i) => (
        <React.Fragment key={i}>
          <View style={{
            backgroundColor: colors.card, borderRadius: 16, padding: 20,
            borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: stripe,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <SkeletonBlock width={28} height={28} rounded={9} />
              <View style={{ width: 8 }} />
              <SkeletonBlock width={100} height={12} />
            </View>
            <SkeletonBlock width="85%" height={16} />
            <View style={{ height: 10 }} />
            <SkeletonBlock width="100%" height={14} />
            <View style={{ height: 6 }} />
            <SkeletonBlock width="75%" height={14} />
            <View style={{ height: 10 }} />
            <SkeletonBlock width="90%" height={32} rounded={10} />
          </View>
          {i < 2 && <View style={{ height: 32 }} />}
        </React.Fragment>
      ))}
    </View>
  );
}

// --- Segment Control --------------------------------------------------------

function SegmentControl({ activeTab, onTabChange, colors, t }: {
  activeTab: 'insight' | 'deepdive';
  onTabChange: (tab: 'insight' | 'deepdive') => void;
  colors: Record<string, string>;
  t: (key: string) => string;
}) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 3, marginBottom: 24 }}>
      {(['insight', 'deepdive'] as const).map((tab) => {
        const active = activeTab === tab;
        return (
          <Pressable key={tab} onPress={() => onTabChange(tab)} style={{
            flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
            backgroundColor: active ? colors.card : 'transparent',
            ...(active ? Platform.select({
              ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
              android: { elevation: 2 },
            }) : {}),
          }} accessibilityRole="tab" accessibilityState={{ selected: active }}>
            <Text style={{ fontSize: 14, fontWeight: active ? '700' : '500', color: active ? colors.textPrimary : colors.textDim }}>
              {tab === 'insight' ? t('snaps.tab_insight') : t('snaps.tab_deepdive')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// --- Main Screen ------------------------------------------------------------

export default function SnapsScreen() {
  const { principleData, loading, error, refresh, currentDate, goNext, goPrev, canGoNext, canGoPrev } = usePrinciple();
  const { t, lang } = useLanguage();
  const { colors, isDark } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'insight' | 'deepdive'>('insight');
  const [scrollProgress, setScrollProgress] = useState(0);

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

  const principle = principleData?.principle ?? null;
  const deepDive = principle?.deepDive ?? null;
  const superCategory = principle?.superCategory ?? principleData?.discipline_info?.superCategory;
  const catConfig = superCategory ? getCategoryConfig(superCategory, isDark) : null;

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.textSecondary} />}
      >
        {/* --- Header --- */}
        <View style={{ paddingTop: 20, paddingBottom: 20 }}>
          {/* Top: tab label + date nav */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textDim }}>{t('snaps.title')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Pressable onPress={goPrev} disabled={!canGoPrev}
                style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: canGoPrev ? 1 : 0.3 }}
                accessibilityLabel={lang === 'en' ? 'Previous day' : '이전 날짜'} accessibilityRole="button">
                <ChevronLeft size={20} color={colors.textSecondary} />
              </Pressable>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>{formatDate(currentDate, lang)}</Text>
              <Pressable onPress={goNext} disabled={!canGoNext}
                style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: canGoNext ? 1 : 0.3 }}
                accessibilityLabel={lang === 'en' ? 'Next day' : '다음 날짜'} accessibilityRole="button">
                <ChevronRight size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Badges + hero title + keywords */}
          {principleData && principle && (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {/* Category badge with icon */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  backgroundColor: catConfig?.bg || colors.primaryLight,
                  borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
                }}>
                  {catConfig && <catConfig.Icon size={12} color={catConfig.color} />}
                  <Text style={{ fontSize: 11, fontWeight: '700', color: catConfig?.color || colors.primary }}>
                    {getDisciplineName(principleData, lang)}
                  </Text>
                </View>
                {principle.connectionType && <ConnectionTypeBadge type={principle.connectionType} colors={colors} lang={lang} />}
                {principle.difficulty && <DifficultyBadge level={principle.difficulty} colors={colors} lang={lang} isDark={isDark} />}
                {/* Read time badge */}
                {principle.readTime && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
                  }}>
                    <Clock size={11} color={colors.textDim} />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textDim }}>{principle.readTime}</Text>
                  </View>
                )}
              </View>

              {/* Principle name (hero) */}
              <Text style={{
                fontSize: 26, fontWeight: '800', color: colors.textPrimary,
                lineHeight: 34, marginBottom: 8, fontFamily: FontFamily.serif,
              }}>
                {L(principle.title, principle.title_en, lang)}
              </Text>

              {/* Keywords */}
              {principle.keywords && principle.keywords.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {LArr(principle.keywords, principle.keywords_en, lang).map((kw) => (
                    <View key={kw} style={{
                      backgroundColor: colors.tagBg, borderRadius: 16,
                      paddingHorizontal: 10, paddingVertical: 4,
                    }}>
                      <Text style={{ fontSize: 11, color: colors.tagText, fontWeight: '600' }}>{kw}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
          <View style={{ width: 32, height: 3, backgroundColor: colors.primary, borderRadius: 2, marginTop: 16 }} />
        </View>

        {/* --- Content --- */}
        {loading ? (
          <SkeletonLoading />
        ) : error ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 16 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.errorBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <BookOpen size={30} color={colors.errorColor} />
            </View>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 17, marginBottom: 6, textAlign: 'center' }}>
              {t('principle.connection_error')}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
              {lang === 'en' ? 'Check your connection and try again' : '인터넷 연결을 확인하고 다시 시도해주세요'}
            </Text>
            <Pressable onPress={refresh} style={({ pressed }) => ({
              backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 12,
              borderRadius: 12, opacity: pressed ? 0.8 : 1,
            })}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>{t('principle.retry')}</Text>
            </Pressable>
          </View>
        ) : !principle ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <BookOpen size={34} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
              {t('snaps.no_content')}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
              {t('snaps.no_content_desc')}
            </Text>
          </View>
        ) : (
          <>
            {/* Segment control */}
            {deepDive && <SegmentControl activeTab={activeTab} onTabChange={setActiveTab} colors={colors} t={t} />}

            {activeTab === 'insight' || !deepDive ? (
              <>
                {/* Timeline rail wrapping the 3 snack cards */}
                <TimelineRail stepColors={[colors.coreTech, colors.indigo, colors.primary]}>
                  {/* 1. Foundation */}
                  <SnackCard
                    step={1}
                    emoji={'\uD83D\uDCA1'}
                    label={t('snaps.foundation')}
                    headline={L(principle.foundation.headline, principle.foundation.headline_en, lang)}
                    body={L(principle.foundation.body, principle.foundation.body_en, lang)}
                    subLine={L(principle.foundation.analogy, principle.foundation.analogy_en, lang)}
                    subEmoji={'\uD83D\uDCAD'}
                    borderColor={colors.coreTech}
                    nodeColor={colors.coreTech}
                    nodeBg={colors.coreTechBg}
                    subColor={colors.coreTech}
                    IconComponent={Lightbulb}
                    keywords={LArr(principle.keywords ?? [], principle.keywords_en, lang)}
                  />
                  {/* 2. Application */}
                  <SnackCard
                    step={2}
                    emoji={'\u26A1'}
                    label={t('snaps.application')}
                    headline={L(principle.application.headline, principle.application.headline_en, lang)}
                    body={L(principle.application.body, principle.application.body_en, lang)}
                    subLine={L(principle.application.mechanism, principle.application.mechanism_en, lang)}
                    subEmoji={'\uD83D\uDD27'}
                    borderColor={colors.indigo}
                    nodeColor={colors.indigo}
                    nodeBg={colors.indigoBg}
                    subColor={colors.indigo}
                    IconComponent={Cpu}
                  />
                  {/* 3. Integration */}
                  <SnackCard
                    step={3}
                    emoji={'\uD83C\uDF0D'}
                    label={t('snaps.integration')}
                    headline={L(principle.integration.headline, principle.integration.headline_en, lang)}
                    body={L(principle.integration.body, principle.integration.body_en, lang)}
                    subLine={L(principle.integration.impact, principle.integration.impact_en, lang)}
                    subEmoji={'\uD83C\uDFAF'}
                    borderColor={colors.primary}
                    nodeColor={colors.primary}
                    nodeBg={colors.primaryLight}
                    subColor={colors.primary}
                    IconComponent={Zap}
                    isLast
                  />
                </TimelineRail>

                {/* Deep Dive nudge */}
                {deepDive && activeTab === 'insight' && (
                  <Pressable onPress={() => setActiveTab('deepdive')} style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                    backgroundColor: colors.indigoBg, borderRadius: 12, padding: 14, marginTop: 16,
                    borderWidth: 1, borderColor: colors.border,
                  }}>
                    <BookOpen size={16} color={colors.indigo} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.indigo }}>
                      {lang === 'en' ? 'Explore the Deep Dive for more details' : '딥다이브 탭에서 더 자세히 알아보기'}
                    </Text>
                    <ChevronRight size={14} color={colors.indigo} />
                  </Pressable>
                )}
              </>
            ) : (
              <DeepDiveContent deepDive={deepDive} lang={lang} />
            )}

            {/* Action Bar (both tabs) */}
            {principleData && <ActionBar principleData={principleData} lang={lang} />}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
