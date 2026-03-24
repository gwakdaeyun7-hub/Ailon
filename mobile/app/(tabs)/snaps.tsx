/**
 * 학문 스낵 -- 단일 스크롤 마크다운 뷰 (content_ko 있을 때)
 *              + 레거시 Notebook 카드 + 딥다이브 탭 (content_ko 없을 때)
 *
 * 새 UI: 헤더(제목+배지) -> SnapsContentRenderer(마크다운 본문) -> 액션바
 * 레거시: 인사이트 3단계 카드 + 딥다이브 탭 + 액션바
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookOpen,
  Lightbulb,
  Link2,
  Zap,
  Cpu,
  Globe,
  ChevronLeft,
  ChevronRight,
  Share2,
  Landmark,
  Sigma,
  Dna,
  Atom,
  Clock,
} from 'lucide-react-native';
import { usePrinciple } from '@/hooks/usePrinciple';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { cardShadow, FontFamily } from '@/lib/theme';
import { latexToDisplay } from '@/lib/latexToDisplay';
import { SnapsContentRenderer } from '@/components/snaps/SnapsContentRenderer';
import type { DailyPrinciples, Principle, DeepDive } from '@/lib/types';


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


// --- Category Icon System ---------------------------------------------------

type CategoryIconConfig = {
  icon: React.ComponentType<{ size: number; color: string }>;
  lightColor: string;
  darkColor: string;
  lightBg: string;
  darkBg: string;
};

const CATEGORY_ICONS: Record<string, CategoryIconConfig> = {
  '공학': { icon: Landmark, lightColor: '#B45309', darkColor: '#FBBF24', lightBg: '#FFFBEB', darkBg: '#2D2513' },
  '자연과학': { icon: Dna, lightColor: '#15803D', darkColor: '#4ADE80', lightBg: '#F0FDF4', darkBg: '#052E16' },
  '형식과학': { icon: Sigma, lightColor: '#0D7377', darkColor: '#2DD4BF', lightBg: '#F0FDFA', darkBg: '#112525' },
  '응용과학': { icon: Atom, lightColor: '#EA580C', darkColor: '#FB923C', lightBg: '#FFF7ED', darkBg: '#431407' },
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

const CONNECTION_TYPE_DESC: Record<string, { ko: string; en: string }> = {
  direct_inspiration: {
    ko: '이 학문의 원리가 직접적으로 AI 기술 설계에 영감을 주었습니다',
    en: 'This principle directly inspired AI technology design',
  },
  structural_analogy: {
    ko: 'AI와 구조적으로 유사하지만 직접적 영감 관계는 아닙니다',
    en: 'Structurally similar to AI but not a direct inspiration',
  },
  mathematical_foundation: {
    ko: '이 학문의 수학적 프레임워크가 AI의 기초가 되었습니다',
    en: 'The mathematical framework became a foundation of AI',
  },
  conceptual_borrowing: {
    ko: '이 학문의 개념과 용어가 AI에 차용되었으나 수학적 구현은 독립적으로 발전했습니다',
    en: 'Concepts and terminology borrowed from this field, but mathematical implementation evolved independently',
  },
};

function ConnectionTypeBadge({ type, colors, lang }: { type: string; colors: Record<string, string>; lang: string }) {
  const config: Record<string, { bg: string; color: string; ko: string; en: string }> = {
    direct_inspiration: { bg: colors.primaryLight, color: colors.textPrimary, ko: '직접 영감', en: 'Direct' },
    structural_analogy: { bg: colors.primaryLight, color: colors.textPrimary, ko: '구조적 유사', en: 'Structural' },
    mathematical_foundation: { bg: colors.primaryLight, color: colors.textPrimary, ko: '수학적 기반', en: 'Mathematical' },
    conceptual_borrowing: { bg: colors.primaryLight, color: colors.textPrimary, ko: '개념 차용', en: 'Conceptual' },
  };
  const c = config[type];
  if (!c) return null;
  const desc = CONNECTION_TYPE_DESC[type];
  const handlePress = () => {
    if (!desc) return;
    Alert.alert(
      lang === 'en' ? c.en : c.ko,
      lang === 'en' ? desc.en : desc.ko,
    );
  };
  return (
    <Pressable onPress={handlePress} hitSlop={4}>
      <View style={{ backgroundColor: c.bg, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: c.color }}>{lang === 'en' ? c.en : c.ko}</Text>
      </View>
    </Pressable>
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
    <View style={{ backgroundColor: isDark ? c.darkBg : c.lightBg, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? c.darkColor : c.lightColor }}>{lang === 'en' ? c.en : c.ko}</Text>
    </View>
  );
}


// =============================================================================
// Legacy Components (content_ko 없을 때 사용하는 기존 카드 UI)
// =============================================================================

// --- Notebook Card -----------------------------------------------------------

interface NotebookCardProps {
  step: 1 | 2 | 3;
  label: string;
  headline: string;
  body: string;
  problemLine?: string;
  subLine: string;
  accentColor: string;
  accentBg: string;
  IconComponent: React.ComponentType<{ size: number; color: string }>;
  keywords?: string[];
}

function NotebookCard({
  step, label, headline, body, problemLine, subLine,
  accentColor, accentBg, IconComponent, keywords,
}: NotebookCardProps) {
  const { colors } = useTheme();

  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: 14, marginBottom: 16,
      borderWidth: 1, borderColor: colors.border,
      overflow: 'hidden', ...cardShadow,
    }}
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${headline}`}
    >
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <View style={{
            width: 28, height: 28, borderRadius: 14,
            backgroundColor: accentBg,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <IconComponent size={14} color={accentColor} />
          </View>
          <Text style={{
            fontSize: 10, fontWeight: '700', color: colors.textDim,
            letterSpacing: 0.5, textTransform: 'uppercase',
          }}>
            {label}
          </Text>
        </View>
        <Text style={{
          fontFamily: FontFamily.serif, fontSize: 14, fontWeight: '700',
          color: colors.textPrimary, lineHeight: 21, marginBottom: 10,
        }}>
          {headline}
        </Text>
      </View>

      {problemLine ? (
        <View style={{
          marginHorizontal: 20, marginBottom: 10,
          backgroundColor: colors.warningLight, borderRadius: 10,
          paddingHorizontal: 12, paddingVertical: 8,
          borderWidth: 1, borderColor: colors.warningBorder,
        }}>
          <Text style={{ fontSize: 13, lineHeight: 20, color: colors.textPrimary, fontWeight: '600' }}>
            {problemLine}
          </Text>
        </View>
      ) : null}

      <Text style={{
        fontSize: 12, lineHeight: 19.2, color: colors.textSecondary,
        paddingHorizontal: 20, marginBottom: 12,
      }}>
        {body}
      </Text>

      {subLine ? (
        <View style={{
          marginHorizontal: 20, marginBottom: keywords && keywords.length > 0 ? 10 : 14,
          backgroundColor: accentBg, borderRadius: 8,
          paddingHorizontal: 10, paddingVertical: 6,
        }}>
          <Text style={{ fontSize: 11, lineHeight: 17, color: accentColor, fontWeight: '600' }}>
            {subLine}
          </Text>
        </View>
      ) : null}

      {keywords && keywords.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 20, marginBottom: 14 }}>
          {keywords.map((kw) => (
            <View key={kw} style={{
              backgroundColor: colors.tagBg, borderRadius: 14,
              paddingHorizontal: 10, paddingVertical: 4,
            }}>
              <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '600' }}>{kw}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 14 }} />
    </View>
  );
}

// --- Deep Dive Section -------------------------------------------------------

function DeepDiveSection({ icon, iconBg, title, children }: {
  icon: React.ReactNode; iconBg: string; title: string; children: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: 14, marginBottom: 14,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
        android: { elevation: 2 },
      }),
    }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 16,
      }}>
        <View style={{
          width: 26, height: 26, borderRadius: 8, backgroundColor: iconBg,
          alignItems: 'center', justifyContent: 'center', marginRight: 8,
        }}>
          {icon}
        </View>
        <Text style={{
          flex: 1, fontSize: 10, fontWeight: '700', color: colors.textDim,
          letterSpacing: 0.5, textTransform: 'uppercase',
        }}>{title}</Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {children}
      </View>
    </View>
  );
}

function DeepDiveContent({ deepDive, lang, principle, catConfig }: {
  deepDive: DeepDive; lang: string; principle?: Principle | null; catConfig?: { Icon: React.ComponentType<{ size: number; color: string }>; color: string; bg: string } | null;
}) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const foundationHeadline = principle?.foundation
    ? L(principle.foundation.headline, principle.foundation.headline_en, lang)
    : null;
  return (
    <>
      {foundationHeadline && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          marginBottom: 16, paddingHorizontal: 4,
        }}>
          {catConfig && <catConfig.Icon size={11} color={colors.textDim} />}
          <Text style={{ fontSize: 11, color: colors.textDim, flex: 1 }} numberOfLines={1}>
            {foundationHeadline}
          </Text>
          <ChevronRight size={10} color={colors.textDim} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textDim }}>
            {t('snaps.tab_deepdive')}
          </Text>
        </View>
      )}

      <DeepDiveSection
        icon={<Clock size={12} color={colors.coreTech} />}
        iconBg={colors.primaryLight}
        title={t('snaps.original_problem')}
      >
        <Text style={{ fontSize: 12, lineHeight: 19.2, color: colors.textSecondary }}>
          {L(deepDive.originalProblem, deepDive.originalProblem_en, lang)}
        </Text>
      </DeepDiveSection>

      {deepDive.bridge ? (
        <DeepDiveSection
          icon={<Link2 size={12} color={colors.teal} />}
          iconBg={colors.primaryLight}
          title={t('snaps.bridge')}
        >
          <Text style={{ fontSize: 12, lineHeight: 19.2, color: colors.textSecondary }}>
            {L(deepDive.bridge, deepDive.bridge_en, lang)}
          </Text>
        </DeepDiveSection>
      ) : null}

      <DeepDiveSection
        icon={<Lightbulb size={12} color={colors.primary} />}
        iconBg={colors.primaryLight}
        title={t('snaps.core_intuition')}
      >
        <Text style={{ fontSize: 12, lineHeight: 19.2, color: colors.textSecondary }}>
          {L(deepDive.coreIntuition, deepDive.coreIntuition_en, lang)}
        </Text>
        {deepDive.formula ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginTop: 12 }}>
            <Text style={{
              fontSize: 10, fontWeight: '700', color: colors.textDim,
              letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8,
            }}>
              {t('snaps.formula')}
            </Text>
            <Text style={{
              fontSize: 12, lineHeight: 19.2, color: colors.textPrimary,
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            }}>
              {latexToDisplay(L(deepDive.formula, deepDive.formula_en, lang))}
            </Text>
          </View>
        ) : null}
      </DeepDiveSection>

      <DeepDiveSection
        icon={<Globe size={12} color={colors.accent} />}
        iconBg={colors.surface}
        title={t('snaps.limits')}
      >
        <Text style={{ fontSize: 12, lineHeight: 19.2, color: colors.textSecondary }}>
          {L(deepDive.limits, deepDive.limits_en, lang)}
        </Text>
      </DeepDiveSection>
    </>
  );
}


// --- Action Bar -------------------------------------------------------------

function ActionBar({ principleData, lang }: { principleData: DailyPrinciples; lang: string }) {
  const { colors } = useTheme();

  const handleShare = useCallback(async () => {
    const p = principleData.principle;
    if (!p) return;
    const title = lang === 'en' && p.title_en ? p.title_en : p.title;
    // content_ko가 있으면 첫 줄, 없으면 foundation.headline 사용
    let snippet = '';
    if (p.content_ko) {
      snippet = (p.content_ko.split('\n').find(l => l.trim() !== '') || '').replace(/[#*]/g, '').trim();
    } else if (p.foundation) {
      snippet = L(p.foundation.headline, p.foundation.headline_en, lang);
    }
    await Share.share({
      message: `${title} \u2014 ${getDisciplineName(principleData, lang)}\n\n\u201C${snippet}\u201D\n\n\u2014 AILON`,
    });
  }, [principleData, lang]);

  return (
    <View style={{
      flexDirection: 'row', gap: 12,
      marginTop: 24, marginBottom: 8,
      paddingTop: 20,
      borderTopWidth: 1, borderTopColor: colors.border,
    }}>
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
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
          <SkeletonBlock width={80} height={22} rounded={11} />
          <SkeletonBlock width={60} height={22} rounded={11} />
        </View>
        <SkeletonBlock width="80%" height={28} />
        <View style={{ height: 8 }} />
        <SkeletonBlock width="50%" height={16} />
      </View>
      {/* Content skeleton: article-like paragraphs */}
      <View style={{ marginBottom: 20 }}>
        <SkeletonBlock width="40%" height={20} rounded={4} />
        <View style={{ height: 12 }} />
        <SkeletonBlock width="100%" height={16} />
        <View style={{ height: 6 }} />
        <SkeletonBlock width="95%" height={16} />
        <View style={{ height: 6 }} />
        <SkeletonBlock width="80%" height={16} />
      </View>
      <View style={{
        backgroundColor: colors.primaryLight, borderRadius: 8,
        borderLeftWidth: 3, borderLeftColor: colors.border,
        padding: 16, marginBottom: 20,
      }}>
        <SkeletonBlock width="70%" height={14} />
        <View style={{ height: 6 }} />
        <SkeletonBlock width="50%" height={14} />
      </View>
      <View style={{ marginBottom: 20 }}>
        <SkeletonBlock width="45%" height={20} rounded={4} />
        <View style={{ height: 12 }} />
        <SkeletonBlock width="100%" height={16} />
        <View style={{ height: 6 }} />
        <SkeletonBlock width="90%" height={16} />
        <View style={{ height: 6 }} />
        <SkeletonBlock width="70%" height={16} />
      </View>
    </View>
  );
}


// --- Segment Control (레거시 UI 전용) ----------------------------------------

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


// =============================================================================
// Main Screen
// =============================================================================

export default function SnapsScreen() {
  const { principleData, loading, error, refresh, currentDate, goNext, goPrev, canGoNext, canGoPrev } = usePrinciple();
  const { t, lang } = useLanguage();
  const { colors, isDark } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'insight' | 'deepdive'>('insight');
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const principle = principleData?.principle ?? null;
  const deepDive = principle?.deepDive ?? null;
  const superCategory = principle?.superCategory ?? principleData?.discipline_info?.superCategory;
  const catConfig = superCategory ? getCategoryConfig(superCategory, isDark) : null;

  // content_ko 존재 여부로 새 UI / 레거시 UI 분기
  const hasMarkdownContent = !!(principle?.content_ko);
  const markdownText = hasMarkdownContent
    ? (lang === 'en' && principle?.content_en ? principle.content_en : principle!.content_ko!)
    : '';

  const handleShare = useCallback(async () => {
    if (!principleData || !principle) return;
    const title = lang === 'en' && principle.title_en ? principle.title_en : principle.title;
    let snippet = '';
    if (principle.content_ko) {
      snippet = (principle.content_ko.split('\n').find(l => l.trim() !== '') || '').replace(/[#*]/g, '').trim();
    } else if (principle.foundation) {
      snippet = L(principle.foundation.headline, principle.foundation.headline_en, lang);
    }
    await Share.share({
      message: `${title} \u2014 ${getDisciplineName(principleData, lang)}\n\n\u201C${snippet}\u201D\n\n\u2014 AILON`,
    });
  }, [principleData, principle, lang]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.textSecondary} />}
      >
        {/* --- Header --- */}
        <View style={{ paddingTop: 20, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          {/* Badges + hero title + keywords */}
          {principleData && principle && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                  {/* Category badge with icon */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                    backgroundColor: catConfig?.bg || colors.primaryLight,
                    borderRadius: 16, paddingHorizontal: 8, paddingVertical: 3,
                  }}>
                    {catConfig && <catConfig.Icon size={12} color={catConfig.color} />}
                    <Text style={{ fontSize: 10, fontWeight: '700', color: catConfig?.color || colors.primary }}>
                      {getDisciplineName(principleData, lang)}
                    </Text>
                  </View>
                  {principle.connectionType && <ConnectionTypeBadge type={principle.connectionType} colors={colors} lang={lang} />}
                  {principle.difficulty && <DifficultyBadge level={principle.difficulty} colors={colors} lang={lang} isDark={isDark} />}
                  {/* Read time badge */}
                  {principle.readTime && (
                    <View style={{
                      backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 3,
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textDim }}>
                        {lang === 'en' ? (principle.readTime || '').replace('분', ' min') : principle.readTime}
                      </Text>
                    </View>
                  )}
                </View>
                <Pressable onPress={handleShare} style={({ pressed }) => ({
                  minWidth: 44, minHeight: 44, alignItems: 'center' as const, justifyContent: 'center' as const,
                  opacity: pressed ? 0.7 : 1,
                })} accessibilityLabel={lang === 'en' ? 'Share' : '공유'} accessibilityRole="button">
                  <Share2 size={18} color={colors.textDim} />
                </Pressable>
              </View>

              {/* Principle name (hero) */}
              <Text
                style={{
                  fontSize: 26, fontWeight: '800', color: colors.textPrimary,
                  lineHeight: 34, marginBottom: 8, fontFamily: FontFamily.serif,
                }}
                accessibilityRole="header"
              >
                {L(principle.title, principle.title_en, lang)}
              </Text>

              {/* Keywords */}
              {principle.keywords && principle.keywords.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {LArr(principle.keywords, principle.keywords_en, lang).map((kw) => (
                    <View key={kw} style={{
                      backgroundColor: colors.tagBg, borderRadius: 14,
                      paddingHorizontal: 8, paddingVertical: 3,
                    }}>
                      <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '600' }}>{kw}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* --- Content --- */}
        {loading ? (
          <SkeletonLoading />
        ) : error ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 16 }}>
            <BookOpen size={36} color={colors.textDim} style={{ marginBottom: 16 }} />
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
            <BookOpen size={36} color={colors.textDim} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
              {t('snaps.no_content')}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
              {t('snaps.no_content_desc')}
            </Text>
          </View>
        ) : hasMarkdownContent ? (
          /* ===== 새 UI: 단일 스크롤 마크다운 뷰 (content_ko 존재) ===== */
          <>
            <View style={{ paddingTop: 8 }}>
              <SnapsContentRenderer content={markdownText} />
            </View>

            {/* Takeaway */}
            {principle.takeaway && (
              <View style={{
                backgroundColor: colors.primaryLight, borderRadius: 12, padding: 14,
                marginTop: 16,
              }}>
                <Text style={{
                  fontSize: 10, fontWeight: '700', color: colors.textDim,
                  letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6,
                }}>
                  TAKEAWAY
                </Text>
                <Text style={{
                  fontSize: 13, lineHeight: 20, color: colors.textPrimary,
                }}>
                  {L(principle.takeaway, principle.takeaway_en, lang)}
                </Text>
              </View>
            )}

          </>
        ) : (
          /* ===== 레거시 UI: 카드 3장 + 딥다이브 탭 (content_ko 없음) ===== */
          <>
            {deepDive && <SegmentControl activeTab={activeTab} onTabChange={setActiveTab} colors={colors} t={t} />}

            {activeTab === 'insight' || !deepDive ? (
              <>
                {principle.foundation && (
                  <NotebookCard
                    step={1}
                    label={t('snaps.foundation')}
                    headline={L(principle.foundation.headline, principle.foundation.headline_en, lang)}
                    body={L(principle.foundation.body, principle.foundation.body_en, lang)}
                    subLine={L(principle.foundation.analogy, principle.foundation.analogy_en, lang)}
                    accentColor={colors.coreTech}
                    accentBg={colors.primaryLight}
                    IconComponent={Lightbulb}
                  />
                )}
                {principle.application && (
                  <NotebookCard
                    step={2}
                    label={t('snaps.application')}
                    headline={L(principle.application.headline, principle.application.headline_en, lang)}
                    body={L(principle.application.body, principle.application.body_en, lang)}
                    problemLine={principle.application.problem ? `${t('snaps.problem')}: ${L(principle.application.problem, principle.application.problem_en, lang)}` : undefined}
                    subLine={L(principle.application.mechanism, principle.application.mechanism_en, lang)}
                    accentColor={colors.teal}
                    accentBg={colors.primaryLight}
                    IconComponent={Cpu}
                  />
                )}
                {principle.integration && (
                  <NotebookCard
                    step={3}
                    label={t('snaps.integration')}
                    headline={L(principle.integration.headline, principle.integration.headline_en, lang)}
                    body={L(principle.integration.body, principle.integration.body_en, lang)}
                    subLine={L(principle.integration.impact, principle.integration.impact_en, lang)}
                    accentColor={colors.primary}
                    accentBg={colors.primaryLight}
                    IconComponent={Zap}
                  />
                )}

                {principle.takeaway && (
                  <View style={{
                    backgroundColor: colors.primaryLight, borderRadius: 12, padding: 14,
                    marginBottom: 16,
                  }}>
                    <Text style={{
                      fontSize: 10, fontWeight: '700', color: colors.textDim,
                      letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6,
                    }}>
                      TAKEAWAY
                    </Text>
                    <Text style={{
                      fontSize: 13, lineHeight: 20, color: colors.textPrimary,
                      fontFamily: FontFamily.serif, fontStyle: 'italic',
                    }}>
                      {L(principle.takeaway, principle.takeaway_en, lang)}
                    </Text>
                  </View>
                )}

                {deepDive && activeTab === 'insight' && (
                  <Pressable onPress={() => setActiveTab('deepdive')} style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                    backgroundColor: colors.primaryLight, borderRadius: 10, padding: 12,
                    borderWidth: 1, borderColor: colors.border,
                  }}>
                    <BookOpen size={14} color={colors.textPrimary} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary }}>
                      {L(
                        principle.deepDiveHook || '딥다이브 탭에서 더 자세히 알아보기',
                        principle.deepDiveHook_en || 'Explore the Deep Dive for more details',
                        lang,
                      )}
                    </Text>
                    <ChevronRight size={12} color={colors.teal} />
                  </Pressable>
                )}
              </>
            ) : (
              <DeepDiveContent deepDive={deepDive} lang={lang} principle={principle} catConfig={catConfig} />
            )}

          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
