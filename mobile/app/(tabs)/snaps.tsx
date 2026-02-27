/**
 * 학문 스낵 — 인사이트 / 딥다이브 2-탭 구조
 * 스텝 인디케이터 + 컬러 스트라이프 + 액션바 + 스켈레톤
 * 날짜 네비게이션 + 스크롤 프로그레스 + 뱃지 + limitations/keyPapers
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
  Link2,
  Globe,
  ChevronLeft,
  ChevronRight,
  Share2,
  Bookmark,
  FileText,
  AlertTriangle,
} from 'lucide-react-native';
import { usePrinciple } from '@/hooks/usePrinciple';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { cardShadow } from '@/lib/theme';
import type { DailyPrinciples, Principle, DeepDive } from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Badge Components ────────────────────────────────────────────────────────

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

function DifficultyBadge({ level, colors, lang }: { level: string; colors: Record<string, string>; lang: string }) {
  const config: Record<string, { bg: string; color: string; ko: string; en: string }> = {
    beginner: { bg: colors.summaryWarnBg, color: colors.summaryWarnText, ko: '입문', en: 'Beginner' },
    intermediate: { bg: colors.warningLight, color: colors.warning, ko: '중급', en: 'Intermediate' },
    advanced: { bg: colors.primaryLight, color: colors.primary, ko: '심화', en: 'Advanced' },
  };
  const c = config[level];
  if (!c) return null;
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: c.color }}>{lang === 'en' ? c.en : c.ko}</Text>
    </View>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function StepBadge({ step, color, bg }: { step: number; color: string; bg: string }) {
  return (
    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 13, fontWeight: '800', color }}>{step}</Text>
    </View>
  );
}

function SectionTitle({ icon, title, step, stepColor, stepBg }: {
  icon: React.ReactNode; title: string; step?: number; stepColor?: string; stepBg?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
      {step != null && stepColor && stepBg && (
        <View style={{ marginRight: 8 }}>
          <StepBadge step={step} color={stepColor} bg={stepBg} />
        </View>
      )}
      <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: stepBg || colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
        {icon}
      </View>
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textDim, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {title}
      </Text>
    </View>
  );
}

function CalloutBox({ children, emphasized }: { children: React.ReactNode; emphasized?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{
      backgroundColor: emphasized ? colors.primaryLight : colors.surface,
      borderRadius: 12, padding: 16, marginTop: 16,
      ...(emphasized ? { borderLeftWidth: 3, borderLeftColor: colors.primary } : {}),
    }}>
      {children}
    </View>
  );
}

function Chip({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
      <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

function StepConnector() {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', height: 24, justifyContent: 'center' }}>
      <View style={{ width: 2, height: 24, backgroundColor: colors.border, borderRadius: 1 }} />
    </View>
  );
}

// ─── Card Components ──────────────────────────────────────────────────────────

function FoundationCard({ principle, lang }: { principle: Principle; lang: string }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: 16, padding: 20,
      borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.coreTech, ...cardShadow,
    }}>
      <SectionTitle icon={<Lightbulb size={16} color={colors.coreTech} />} title={t('snaps.foundation')} step={1} stepColor={colors.coreTech} stepBg={colors.coreTechBg} />
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, lineHeight: 28, marginBottom: 12 }}>
        {L(principle.foundation.keyIdea, principle.foundation.keyIdea_en, lang)}
      </Text>
      <Text style={{ fontSize: 15, lineHeight: 23, color: colors.textPrimary }}>
        {L(principle.foundation.principle, principle.foundation.principle_en, lang)}
      </Text>
      <CalloutBox>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textDim, marginBottom: 6 }}>
          {t('snaps.analogy')}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary }}>
          {L(principle.foundation.everydayAnalogy, principle.foundation.everydayAnalogy_en, lang)}
        </Text>
      </CalloutBox>
    </View>
  );
}

function ApplicationCard({ principle, lang }: { principle: Principle; lang: string }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { application } = principle;
  const [mechExpanded, setMechExpanded] = useState(false);
  const mechanismText = L(application.mechanism, application.mechanism_en, lang);
  const showToggle = mechanismText.length > 120;
  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: 16, padding: 20,
      borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.indigo, ...cardShadow,
    }}>
      <SectionTitle icon={<Cpu size={16} color={colors.indigo} />} title={t('snaps.application')} step={2} stepColor={colors.indigo} stepBg={colors.indigoBg} />
      <View style={{ backgroundColor: colors.indigoBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.indigo }}>
          {L(application.applicationField, application.applicationField_en, lang)}
        </Text>
      </View>
      <Text style={{ fontSize: 15, lineHeight: 23, color: colors.textPrimary, marginBottom: 12 }}>
        {L(application.description, application.description_en, lang)}
      </Text>
      <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary }} numberOfLines={!showToggle || mechExpanded ? undefined : 3}>
        {mechanismText}
      </Text>
      {showToggle && (
        <Pressable onPress={() => setMechExpanded(v => !v)} style={{ marginTop: 4, marginBottom: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.indigo }}>
            {mechExpanded ? (lang === 'en' ? 'Show less' : '접기') : (lang === 'en' ? 'Show more' : '더 보기')}
          </Text>
        </Pressable>
      )}
      {!showToggle && <View style={{ height: 14 }} />}
      {application.technicalTerms?.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: application.limitations ? 14 : 0 }}>
          {LArr(application.technicalTerms, application.technicalTerms_en, lang).map((term) => (
            <Chip key={term} label={term} />
          ))}
        </View>
      )}
      {application.limitations && (
        <View style={{
          backgroundColor: colors.warningLight, borderRadius: 12, padding: 14, marginTop: 14,
          borderLeftWidth: 3, borderLeftColor: colors.warning, flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertTriangle size={16} color={colors.warning} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.warning, marginBottom: 4 }}>
              {lang === 'en' ? 'Limitations' : '한계점'}
            </Text>
            <Text style={{ fontSize: 13, lineHeight: 20, color: colors.textSecondary }}>
              {L(application.limitations, application.limitations_en, lang)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function IntegrationCard({ principle, lang }: { principle: Principle; lang: string }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { integration } = principle;
  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: 16, padding: 20,
      borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.primary, ...cardShadow,
    }}>
      <SectionTitle icon={<Zap size={16} color={colors.primary} />} title={t('snaps.integration')} step={3} stepColor={colors.primary} stepBg={colors.primaryLight} />
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, lineHeight: 24, marginBottom: 10 }}>
        {L(integration.problemSolved, integration.problemSolved_en, lang)}
      </Text>
      <Text style={{ fontSize: 15, lineHeight: 23, color: colors.textPrimary, marginBottom: 14 }}>
        {L(integration.solution, integration.solution_en, lang)}
      </Text>
      {integration.realWorldExamples?.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          {LArr(integration.realWorldExamples, integration.realWorldExamples_en, lang).map((example, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 6, paddingRight: 8 }}>
              <Text style={{ fontSize: 14, color: colors.primary, marginRight: 8, fontWeight: '700' }}>•</Text>
              <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary, flex: 1 }}>{example}</Text>
            </View>
          ))}
        </View>
      )}
      <CalloutBox emphasized>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 6 }}>
          {t('snaps.why_works')}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary }}>
          {L(integration.whyItWorks, integration.whyItWorks_en, lang)}
        </Text>
      </CalloutBox>
      {integration.keyPapers && integration.keyPapers.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textDim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {lang === 'en' ? 'Key Papers' : '핵심 논문'}
          </Text>
          {LArr(integration.keyPapers, integration.keyPapers_en, lang).map((paper, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
              <FileText size={14} color={colors.indigo} style={{ marginTop: 2 }} />
              <Text style={{ fontSize: 13, lineHeight: 20, color: colors.textSecondary, flex: 1 }}>{paper}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Deep Dive ────────────────────────────────────────────────────────────────

function DeepDiveSection({ icon, iconBg, title, children }: {
  icon: React.ReactNode; iconBg: string; title: string; children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          {icon}
        </View>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textDim, letterSpacing: 0.5, textTransform: 'uppercase' }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function DeepDiveContent({ deepDive, lang }: { deepDive: DeepDive; lang: string }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <>
      <DeepDiveSection icon={<History size={16} color={colors.coreTech} />} iconBg={colors.coreTechBg} title={t('snaps.history')}>
        <Text style={{ fontSize: 15, lineHeight: 23, color: colors.textPrimary }}>{L(deepDive.history, deepDive.history_en, lang)}</Text>
      </DeepDiveSection>
      <DeepDiveSection icon={<FlaskConical size={16} color={colors.indigo} />} iconBg={colors.indigoBg} title={t('snaps.deep_mechanism')}>
        <Text style={{ fontSize: 15, lineHeight: 23, color: colors.textPrimary }}>{L(deepDive.mechanism, deepDive.mechanism_en, lang)}</Text>
      </DeepDiveSection>
      {deepDive.formula && (
        <DeepDiveSection icon={<Layers size={16} color={colors.primary} />} iconBg={colors.primaryLight} title={t('snaps.formula')}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textPrimary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{deepDive.formula}</Text>
          </View>
        </DeepDiveSection>
      )}
      {deepDive.relatedPrinciples?.length > 0 && (
        <DeepDiveSection icon={<Link2 size={16} color={colors.success} />} iconBg={colors.surface} title={t('snaps.related')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {LArr(deepDive.relatedPrinciples, deepDive.relatedPrinciples_en, lang).map((rp) => <Chip key={rp} label={rp} />)}
          </View>
        </DeepDiveSection>
      )}
      <DeepDiveSection icon={<Globe size={16} color={colors.accent} />} iconBg={colors.surface} title={t('snaps.modern')}>
        <Text style={{ fontSize: 15, lineHeight: 23, color: colors.textPrimary }}>{L(deepDive.modernRelevance, deepDive.modernRelevance_en, lang)}</Text>
      </DeepDiveSection>
    </>
  );
}

// ─── Action Bar ───────────────────────────────────────────────────────────────

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
    const keyIdea = L(p.foundation.keyIdea, p.foundation.keyIdea_en, lang);
    await Share.share({ message: `${title} — ${getDisciplineName(principleData, lang)}\n\n${keyIdea}\n\n— Ailon` });
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ width, height, rounded }: { width: number | string; height: number; rounded?: number }) {
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
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: stripe }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <SkeletonBlock width={26} height={26} rounded={13} />
              <View style={{ width: 8 }} />
              <SkeletonBlock width={30} height={30} rounded={10} />
              <View style={{ width: 10 }} />
              <SkeletonBlock width={100} height={14} />
            </View>
            <SkeletonBlock width="85%" height={18} />
            <View style={{ height: 10 }} />
            <SkeletonBlock width="100%" height={14} />
            <View style={{ height: 6 }} />
            <SkeletonBlock width="75%" height={14} />
          </View>
          {i < 2 && (
            <View style={{ alignItems: 'center', height: 24, justifyContent: 'center' }}>
              <View style={{ width: 2, height: 24, backgroundColor: colors.border, borderRadius: 1 }} />
            </View>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Segment Control ──────────────────────────────────────────────────────────

function SegmentControl({ activeTab, onTabChange, colors, t }: {
  activeTab: 'insight' | 'deepdive';
  onTabChange: (tab: 'insight' | 'deepdive') => void;
  colors: Record<string, string>;
  t: (key: string) => string;
}) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 3, marginBottom: 16 }}>
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SnapsScreen() {
  const { principleData, loading, error, refresh, currentDate, goNext, goPrev, canGoNext, canGoPrev } = usePrinciple();
  const { t, lang } = useLanguage();
  const { colors } = useTheme();

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
  const deepDive = principle?.foundation?.deepDive ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Scroll progress bar */}
      <View style={{ height: 3, backgroundColor: 'transparent' }}>
        <View style={{ height: 3, backgroundColor: colors.primary, width: `${scrollProgress * 100}%`, borderTopRightRadius: 2, borderBottomRightRadius: 2 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.textSecondary} />}
      >
        {/* ─── Header ─── */}
        <View style={{ paddingTop: 20, paddingBottom: 16 }}>
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
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                <View style={{ backgroundColor: colors.primaryLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{getDisciplineName(principleData, lang)}</Text>
                </View>
                {principle.connectionType && <ConnectionTypeBadge type={principle.connectionType} colors={colors} lang={lang} />}
                {principle.difficulty && <DifficultyBadge level={principle.difficulty} colors={colors} lang={lang} />}
              </View>
              <Text style={{ fontSize: 26, fontWeight: '800', color: colors.textPrimary, lineHeight: 34, marginBottom: 6 }}>
                {L(principle.title, principle.title_en, lang)}
              </Text>
              <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22 }} numberOfLines={2}>
                {L(principle.foundation.keyIdea, principle.foundation.keyIdea_en, lang)}
              </Text>
              {principle.keywords && principle.keywords.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {LArr(principle.keywords, principle.keywords_en, lang).map((kw) => (
                    <View key={kw} style={{ backgroundColor: colors.tagBg, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, color: colors.tagText, fontWeight: '600' }}>{kw}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
          <View style={{ width: 32, height: 3, backgroundColor: colors.primary, borderRadius: 2, marginTop: 14 }} />
        </View>

        {/* ─── Content ─── */}
        {loading ? (
          <SkeletonLoading />
        ) : error ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 16 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.errorBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <BookOpen size={30} color={colors.errorColor} />
            </View>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 17, marginBottom: 6, textAlign: 'center' }}>{t('principle.connection_error')}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
              {lang === 'en' ? 'Check your connection and try again' : '인터넷 연결을 확인하고 다시 시도해주세요'}
            </Text>
            <Pressable onPress={refresh} style={({ pressed }) => ({ backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, opacity: pressed ? 0.8 : 1 })}>
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
                <FoundationCard principle={principle} lang={lang} />
                <StepConnector />
                <ApplicationCard principle={principle} lang={lang} />
                <StepConnector />
                <IntegrationCard principle={principle} lang={lang} />
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
