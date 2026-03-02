/**
 * 학문 스낵 — 인사이트 / 딥다이브 2-탭 구조
 * 스텝 인디케이터 + 좌측 타임라인 레일 + 액션바 + 스켈레톤
 * 날짜 네비게이션 + 스크롤 프로그레스 + 뱃지 + limitations/keyPapers
 * 카드 접기/펼치기 + DeepDive 아코디언 + 카테고리 아이콘
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
  Link2,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Share2,
  Bookmark,
  FileText,
  AlertTriangle,
  Landmark,
  Sigma,
  Dna,
  Scale,
  Brain,
  Atom,
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

function animateLayout() {
  LayoutAnimation.configureNext(LayoutAnimation.create(
    250,
    LayoutAnimation.Types.easeInEaseOut,
    LayoutAnimation.Properties.opacity,
  ));
}

// ─── Category Icon System ─────────────────────────────────────────────────────

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

// ─── Shared Components ────────────────────────────────────────────────────────

function StepBadge({ step, color, bg }: { step: number; color: string; bg: string }) {
  return (
    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: color }}>
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

function CalloutBox({ children, emphasized, icon }: { children: React.ReactNode; emphasized?: boolean; icon?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{
      backgroundColor: emphasized ? colors.primaryLight : colors.surface,
      borderRadius: 14, padding: 16, marginTop: 24,
      ...(emphasized ? { borderLeftWidth: 3, borderLeftColor: colors.primary } : {}),
      flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    }}>
      {icon && (
        <View style={{ marginTop: 2 }}>{icon}</View>
      )}
      <View style={{ flex: 1 }}>{children}</View>
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

function ExpandToggle({ expanded, onToggle, lang, t }: {
  expanded: boolean; onToggle: () => void; lang: string; t: (key: string) => string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 10, marginTop: 12, borderRadius: 10,
        backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1,
      })}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={expanded ? t('snaps.show_less') : t('snaps.show_more')}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
        {expanded ? t('snaps.show_less') : t('snaps.show_more')}
      </Text>
      {expanded
        ? <ChevronUp size={14} color={colors.primary} />
        : <ChevronDown size={14} color={colors.primary} />
      }
    </Pressable>
  );
}

// ─── Timeline Rail ────────────────────────────────────────────────────────────

function TimelineRail({ children, stepColors }: { children: React.ReactNode; stepColors: string[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ position: 'relative', paddingLeft: 20, marginBottom: 8 }}>
      {/* Continuous rail line */}
      <View style={{
        position: 'absolute', left: 6, top: 0, bottom: 0, width: 4,
        backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden',
      }}>
        {/* Gradient segments */}
        {stepColors.map((color, i) => (
          <View key={i} style={{
            flex: 1, backgroundColor: color, opacity: 0.3,
          }} />
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

// ─── Card Components ──────────────────────────────────────────────────────────

function FoundationCard({ principle, lang }: { principle: Principle; lang: string }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    animateLayout();
    setExpanded(v => !v);
  }, []);

  const summaryText = L(principle.foundation.keyIdea, principle.foundation.keyIdea_en, lang);

  return (
    <View style={{ position: 'relative', marginBottom: 32 }}>
      <TimelineNode color={colors.coreTech} bg={colors.coreTechBg} step={1} />
      <View style={{
        backgroundColor: colors.card, borderRadius: 16, padding: 24,
        borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.coreTech, ...cardShadow,
      }}>
        <SectionTitle icon={<Lightbulb size={16} color={colors.coreTech} />} title={t('snaps.foundation')} />

        {/* Always visible: summary line */}
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, lineHeight: 28 }} numberOfLines={expanded ? undefined : 2}>
          {summaryText}
        </Text>

        {expanded && (
          <>
            <Text style={{ fontSize: 16, lineHeight: 26, color: colors.textPrimary, marginTop: 16 }}>
              {L(principle.foundation.principle, principle.foundation.principle_en, lang)}
            </Text>
            <CalloutBox icon={<Lightbulb size={16} color={colors.coreTech} />}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textDim, marginBottom: 6 }}>
                {t('snaps.analogy')}
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textSecondary }}>
                {L(principle.foundation.everydayAnalogy, principle.foundation.everydayAnalogy_en, lang)}
              </Text>
            </CalloutBox>
          </>
        )}

        <ExpandToggle expanded={expanded} onToggle={toggleExpand} lang={lang} t={t} />
      </View>
    </View>
  );
}

function ApplicationCard({ principle, lang }: { principle: Principle; lang: string }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const application = principle.application ?? {} as any;
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    animateLayout();
    setExpanded(v => !v);
  }, []);

  const summaryText = L(application.description, application.description_en, lang) || '';

  return (
    <View style={{ position: 'relative', marginBottom: 32 }}>
      <TimelineNode color={colors.indigo} bg={colors.indigoBg} step={2} />
      <View style={{
        backgroundColor: colors.card, borderRadius: 16, padding: 24,
        borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.indigo, ...cardShadow,
      }}>
        <SectionTitle icon={<Cpu size={16} color={colors.indigo} />} title={t('snaps.application')} />

        {/* Field badge */}
        <View style={{ backgroundColor: colors.indigoBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.indigo }}>
            {L(application.applicationField, application.applicationField_en, lang)}
          </Text>
        </View>

        {/* Always visible: summary */}
        <Text style={{ fontSize: 16, lineHeight: 26, color: colors.textPrimary }} numberOfLines={expanded ? undefined : 2}>
          {summaryText}
        </Text>

        {expanded && (
          <>
            {/* Mechanism */}
            <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textSecondary, marginTop: 16 }}>
              {L(application.mechanism, application.mechanism_en, lang)}
            </Text>

            {/* Technical terms */}
            {application.technicalTerms?.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                {LArr(application.technicalTerms, application.technicalTerms_en, lang).map((term: string) => (
                  <Chip key={term} label={term} />
                ))}
              </View>
            )}

            {/* Limitations */}
            {application.limitations && (
              <View style={{
                backgroundColor: colors.warningLight, borderRadius: 14, padding: 14, marginTop: 24,
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
          </>
        )}

        <ExpandToggle expanded={expanded} onToggle={toggleExpand} lang={lang} t={t} />
      </View>
    </View>
  );
}

function IntegrationCard({ principle, lang }: { principle: Principle; lang: string }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { integration } = principle;
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    animateLayout();
    setExpanded(v => !v);
  }, []);

  const summaryText = L(integration.problemSolved, integration.problemSolved_en, lang);

  return (
    <View style={{ position: 'relative', marginBottom: 8 }}>
      <TimelineNode color={colors.primary} bg={colors.primaryLight} step={3} />
      <View style={{
        backgroundColor: colors.card, borderRadius: 16, padding: 24,
        borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.primary, ...cardShadow,
      }}>
        <SectionTitle icon={<Zap size={16} color={colors.primary} />} title={t('snaps.integration')} />

        {/* Always visible: summary */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, lineHeight: 26 }} numberOfLines={expanded ? undefined : 2}>
          {summaryText}
        </Text>

        {expanded && (
          <>
            <Text style={{ fontSize: 16, lineHeight: 26, color: colors.textPrimary, marginTop: 16 }}>
              {L(integration.solution, integration.solution_en, lang)}
            </Text>

            {integration.realWorldExamples?.length > 0 && (
              <View style={{ marginTop: 16, marginBottom: 12 }}>
                {LArr(integration.realWorldExamples, integration.realWorldExamples_en, lang).map((example, i) => (
                  <View key={i} style={{ flexDirection: 'row', marginBottom: 6, paddingRight: 8 }}>
                    <Text style={{ fontSize: 14, color: colors.primary, marginRight: 8, fontWeight: '700' }}>•</Text>
                    <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textSecondary, flex: 1 }}>{example}</Text>
                  </View>
                ))}
              </View>
            )}

            <CalloutBox emphasized icon={<Zap size={16} color={colors.primary} />}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 6 }}>
                {t('snaps.why_works')}
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textSecondary }}>
                {L(integration.whyItWorks, integration.whyItWorks_en, lang)}
              </Text>
            </CalloutBox>

            {integration.keyPapers && integration.keyPapers.length > 0 && (
              <View style={{ marginTop: 24 }}>
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
          </>
        )}

        <ExpandToggle expanded={expanded} onToggle={toggleExpand} lang={lang} t={t} />
      </View>
    </View>
  );
}

// ─── Deep Dive Accordion ──────────────────────────────────────────────────────

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
    <View style={{ backgroundColor: colors.card, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
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
        <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          {icon}
        </View>
        <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: colors.textDim, letterSpacing: 0.5, textTransform: 'uppercase' }}>{title}</Text>
        {expanded
          ? <ChevronUp size={18} color={colors.textDim} />
          : <ChevronDown size={18} color={colors.textDim} />
        }
      </Pressable>

      {/* Preview (collapsed) */}
      {!expanded && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          {children && React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === Text) {
              return React.cloneElement(child as React.ReactElement<any>, { numberOfLines: 2 });
            }
            // For non-Text children (like formula/chips), show nothing in preview
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
        <Text style={{ fontSize: 16, lineHeight: 26, color: colors.textPrimary }}>{L(deepDive.history, deepDive.history_en, lang)}</Text>
      </DeepDiveAccordionSection>

      <DeepDiveAccordionSection
        icon={<FlaskConical size={16} color={colors.indigo} />}
        iconBg={colors.indigoBg}
        title={t('snaps.deep_mechanism')}
      >
        <Text style={{ fontSize: 16, lineHeight: 26, color: colors.textPrimary }}>{L(deepDive.mechanism, deepDive.mechanism_en, lang)}</Text>
      </DeepDiveAccordionSection>

      {deepDive.formula && (
        <DeepDiveAccordionSection
          icon={<Layers size={16} color={colors.primary} />}
          iconBg={colors.primaryLight}
          title={t('snaps.formula')}
        >
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textPrimary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{deepDive.formula}</Text>
          </View>
        </DeepDiveAccordionSection>
      )}

      {deepDive.relatedPrinciples?.length > 0 && (
        <DeepDiveAccordionSection
          icon={<Link2 size={16} color={colors.success} />}
          iconBg={colors.surface}
          title={t('snaps.related')}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {LArr(deepDive.relatedPrinciples, deepDive.relatedPrinciples_en, lang).map((rp) => <Chip key={rp} label={rp} />)}
          </View>
        </DeepDiveAccordionSection>
      )}

      <DeepDiveAccordionSection
        icon={<Globe size={16} color={colors.accent} />}
        iconBg={colors.surface}
        title={t('snaps.modern')}
      >
        <Text style={{ fontSize: 16, lineHeight: 26, color: colors.textPrimary }}>{L(deepDive.modernRelevance, deepDive.modernRelevance_en, lang)}</Text>
      </DeepDiveAccordionSection>
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
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: stripe }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <SkeletonBlock width={28} height={28} rounded={14} />
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
          {i < 2 && <View style={{ height: 32 }} />}
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

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
  const deepDive = principle?.foundation?.deepDive ?? null;
  const superCategory = principleData?.discipline_info?.superCategory;
  const catConfig = superCategory ? getCategoryConfig(superCategory, isDark) : null;

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
              </View>
              <Text style={{ fontSize: 26, fontWeight: '800', color: colors.textPrimary, lineHeight: 34, marginBottom: 8, fontFamily: FontFamily.serif }}>
                {L(principle.title, principle.title_en, lang)}
              </Text>
              <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22 }} numberOfLines={2}>
                {L(principle.foundation.keyIdea, principle.foundation.keyIdea_en, lang)}
              </Text>
              {principle.keywords && principle.keywords.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                  {LArr(principle.keywords, principle.keywords_en, lang).map((kw) => (
                    <View key={kw} style={{ backgroundColor: colors.tagBg, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, color: colors.tagText, fontWeight: '600' }}>{kw}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
          <View style={{ width: 32, height: 3, backgroundColor: colors.primary, borderRadius: 2, marginTop: 16 }} />
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
                {/* Timeline rail wrapping the 3 cards */}
                <TimelineRail stepColors={[colors.coreTech, colors.indigo, colors.primary]}>
                  <FoundationCard principle={principle} lang={lang} />
                  <ApplicationCard principle={principle} lang={lang} />
                  <IntegrationCard principle={principle} lang={lang} />
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
