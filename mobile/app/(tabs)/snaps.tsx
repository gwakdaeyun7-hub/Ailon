/**
 * 학문 스낵 — Foundation → Application → Integration + Deep Dive (접기식)
 * 3단계 스텝 인디케이터 + 컬러 스트라이프 + 액션바 + 스켈레톤 로딩
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Share,
  LayoutAnimation,
  Platform,
  UIManager,
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
  ChevronDown,
  Share2,
  Bookmark,
} from 'lucide-react-native';
import { usePrinciple } from '@/hooks/usePrinciple';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { cardShadow } from '@/lib/theme';
import type { DailyPrinciples, Principle, DeepDive } from '@/lib/types';

// LayoutAnimation on Android
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

// ─── Shared Components ────────────────────────────────────────────────────────

function StepBadge({ step, color, bg }: { step: number; color: string; bg: string }) {
  return (
    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 13, fontWeight: '800', color }}>{step}</Text>
    </View>
  );
}

function SectionTitle({ icon, title, step, stepColor, stepBg }: {
  icon: React.ReactNode;
  title: string;
  step?: number;
  stepColor?: string;
  stepBg?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
      {step != null && stepColor && stepBg && (
        <View style={{ marginRight: 8 }}>
          <StepBadge step={step} color={stepColor} bg={stepBg} />
        </View>
      )}
      <View style={{
        width: 30, height: 30, borderRadius: 10,
        backgroundColor: stepBg || colors.surface,
        alignItems: 'center', justifyContent: 'center', marginRight: 10,
      }}>
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
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
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
  const { foundation } = principle;
  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: 16, padding: 20,
      borderWidth: 1, borderColor: colors.border,
      borderLeftWidth: 4, borderLeftColor: colors.coreTech,
      ...cardShadow,
    }}>
      <SectionTitle
        icon={<Lightbulb size={16} color={colors.coreTech} />}
        title={lang === 'en' ? 'Foundation' : '기본 원리'}
        step={1} stepColor={colors.coreTech} stepBg={colors.coreTechBg}
      />
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, lineHeight: 28, marginBottom: 12 }}>
        {L(foundation.keyIdea, foundation.keyIdea_en, lang)}
      </Text>
      <Text style={{ fontSize: 15, lineHeight: 23, color: colors.textPrimary }}>
        {L(foundation.principle, foundation.principle_en, lang)}
      </Text>
      <CalloutBox>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textDim, marginBottom: 6 }}>
          {lang === 'en' ? 'Everyday Analogy' : '일상 속 비유'}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary }}>
          {L(foundation.everydayAnalogy, foundation.everydayAnalogy_en, lang)}
        </Text>
      </CalloutBox>
    </View>
  );
}

function ApplicationCard({ principle, lang }: { principle: Principle; lang: string }) {
  const { colors } = useTheme();
  const { application } = principle;
  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: 16, padding: 20,
      borderWidth: 1, borderColor: colors.border,
      borderLeftWidth: 4, borderLeftColor: colors.indigo,
      ...cardShadow,
    }}>
      <SectionTitle
        icon={<Cpu size={16} color={colors.indigo} />}
        title={lang === 'en' ? 'AI Application' : 'AI 응용'}
        step={2} stepColor={colors.indigo} stepBg={colors.indigoBg}
      />
      <View style={{
        backgroundColor: colors.indigoBg, borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 5,
        alignSelf: 'flex-start', marginBottom: 12,
      }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.indigo }}>
          {L(application.applicationField, application.applicationField_en, lang)}
        </Text>
      </View>
      <Text style={{ fontSize: 15, lineHeight: 23, color: colors.textPrimary, marginBottom: 12 }}>
        {L(application.description, application.description_en, lang)}
      </Text>
      <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginBottom: 14 }}>
        {L(application.mechanism, application.mechanism_en, lang)}
      </Text>
      {application.technicalTerms.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LArr(application.technicalTerms, application.technicalTerms_en, lang).map((term) => (
            <Chip key={term} label={term} />
          ))}
        </View>
      )}
    </View>
  );
}

function IntegrationCard({ principle, lang }: { principle: Principle; lang: string }) {
  const { colors } = useTheme();
  const { integration } = principle;
  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: 16, padding: 20,
      borderWidth: 1, borderColor: colors.border,
      borderLeftWidth: 4, borderLeftColor: colors.primary,
      ...cardShadow,
    }}>
      <SectionTitle
        icon={<Zap size={16} color={colors.primary} />}
        title={lang === 'en' ? 'Integration' : '융합 사례'}
        step={3} stepColor={colors.primary} stepBg={colors.primaryLight}
      />
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, lineHeight: 24, marginBottom: 10 }}>
        {L(integration.problemSolved, integration.problemSolved_en, lang)}
      </Text>
      <Text style={{ fontSize: 15, lineHeight: 23, color: colors.textPrimary, marginBottom: 14 }}>
        {L(integration.solution, integration.solution_en, lang)}
      </Text>
      {integration.realWorldExamples.length > 0 && (
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
          {lang === 'en' ? 'Why It Works' : '왜 효과적인가'}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary }}>
          {L(integration.whyItWorks, integration.whyItWorks_en, lang)}
        </Text>
      </CalloutBox>
    </View>
  );
}

// ─── Deep Dive ────────────────────────────────────────────────────────────────

function DeepDiveSection({ icon, iconBg, title, children }: {
  icon: React.ReactNode; iconBg: string; title: string; children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16,
      borderWidth: 1, borderColor: colors.border,
    }}>
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
  return (
    <>
      <DeepDiveSection icon={<History size={16} color={colors.coreTech} />} iconBg={colors.coreTechBg} title={lang === 'en' ? 'History' : '발견의 역사'}>
        <Text style={{ fontSize: 15, lineHeight: 23, color: colors.textPrimary }}>
          {L(deepDive.history, deepDive.history_en, lang)}
        </Text>
      </DeepDiveSection>

      <DeepDiveSection icon={<FlaskConical size={16} color={colors.indigo} />} iconBg={colors.indigoBg} title={lang === 'en' ? 'Mechanism' : '작동 원리'}>
        <Text style={{ fontSize: 15, lineHeight: 23, color: colors.textPrimary }}>
          {L(deepDive.mechanism, deepDive.mechanism_en, lang)}
        </Text>
      </DeepDiveSection>

      {deepDive.formula && (
        <DeepDiveSection icon={<Layers size={16} color={colors.primary} />} iconBg={colors.primaryLight} title={lang === 'en' ? 'Formula' : '공식'}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textPrimary, fontFamily: 'monospace' }}>
              {deepDive.formula}
            </Text>
          </View>
        </DeepDiveSection>
      )}

      {deepDive.relatedPrinciples.length > 0 && (
        <DeepDiveSection icon={<Link2 size={16} color={colors.success} />} iconBg={colors.surface} title={lang === 'en' ? 'Related Principles' : '관련 원리'}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {LArr(deepDive.relatedPrinciples, deepDive.relatedPrinciples_en, lang).map((rp) => (
              <Chip key={rp} label={rp} />
            ))}
          </View>
        </DeepDiveSection>
      )}

      <DeepDiveSection icon={<Globe size={16} color={colors.accent} />} iconBg={colors.surface} title={lang === 'en' ? 'Modern Relevance' : '현대적 의의'}>
        <Text style={{ fontSize: 15, lineHeight: 23, color: colors.textPrimary }}>
          {L(deepDive.modernRelevance, deepDive.modernRelevance_en, lang)}
        </Text>
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
    const title = principleData.principle?.title || '';
    const discipline = principleData.discipline_info?.name || '';
    toggleBookmark('snap', itemId, {
      title,
      subtitle: discipline,
      category: principleData.discipline_info?.superCategory || '',
    });
  }, [user, principleData, itemId, toggleBookmark]);

  const handleShare = useCallback(async () => {
    const p = principleData.principle;
    if (!p) return;
    const title = lang === 'en' && p.title_en ? p.title_en : p.title;
    const keyIdea = L(p.foundation.keyIdea, p.foundation.keyIdea_en, lang);
    const discipline = getDisciplineName(principleData, lang);
    await Share.share({
      message: `${title} — ${discipline}\n\n${keyIdea}\n\n— Ailon`,
    });
  }, [principleData, lang]);

  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 8 }}>
      <Pressable
        onPress={handleBookmark}
        style={({ pressed }) => ({
          flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
          backgroundColor: isBookmarked ? colors.bookmarkActiveBg : colors.surface,
          borderWidth: 1,
          borderColor: isBookmarked ? colors.bookmarkActiveBorder : colors.border,
          borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
          opacity: pressed ? 0.7 : 1,
        })}
        accessibilityLabel={lang === 'en' ? 'Bookmark' : '북마크'}
        accessibilityRole="button"
      >
        <Bookmark size={18} color={isBookmarked ? colors.bookmarkActiveColor : colors.textDim} fill={isBookmarked ? colors.bookmarkActiveColor : 'none'} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: isBookmarked ? colors.bookmarkActiveColor : colors.textDim }}>
          {lang === 'en' ? (isBookmarked ? 'Saved' : 'Save') : (isBookmarked ? '저장됨' : '저장')}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleShare}
        style={({ pressed }) => ({
          flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
          backgroundColor: colors.surface,
          borderWidth: 1, borderColor: colors.border,
          borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
          opacity: pressed ? 0.7 : 1,
        })}
        accessibilityLabel={lang === 'en' ? 'Share' : '공유'}
        accessibilityRole="button"
      >
        <Share2 size={18} color={colors.textDim} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textDim }}>
          {lang === 'en' ? 'Share' : '공유'}
        </Text>
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
      {/* Header skeleton */}
      <View style={{ marginBottom: 24 }}>
        <SkeletonBlock width={80} height={22} rounded={11} />
        <View style={{ height: 10 }} />
        <SkeletonBlock width="70%" height={28} />
        <View style={{ height: 8 }} />
        <SkeletonBlock width="90%" height={16} />
      </View>
      {/* Card skeletons */}
      {[colors.coreTech, colors.indigo, colors.primary].map((stripe, i) => (
        <React.Fragment key={i}>
          <View style={{
            backgroundColor: colors.card, borderRadius: 16, padding: 20,
            borderWidth: 1, borderColor: colors.border,
            borderLeftWidth: 4, borderLeftColor: stripe,
          }}>
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SnapsScreen() {
  const { principleData, loading, error, refresh } = usePrinciple();
  const { t, lang } = useLanguage();
  const { colors } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const toggleDeepDive = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDeepDiveOpen(prev => !prev);
  }, []);

  const principle = principleData?.principle ?? null;
  const deepDive = principle?.foundation?.deepDive ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.textSecondary} />
        }
      >
        {/* ─── Header ─── */}
        <View style={{ paddingTop: 20, paddingBottom: 16 }}>
          {/* 상단: 탭 라벨 + 날짜 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textDim }}>
              {t('snaps.title')}
            </Text>
            {principleData && (
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {formatDate(principleData.date, lang)}
              </Text>
            )}
          </View>

          {/* 학문 뱃지 + 히어로 원리명 + keyIdea 서브타이틀 */}
          {principleData && principle && (
            <>
              <View style={{
                backgroundColor: colors.primaryLight, borderRadius: 20,
                paddingHorizontal: 10, paddingVertical: 3,
                alignSelf: 'flex-start', marginBottom: 8,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                  {getDisciplineName(principleData, lang)}
                </Text>
              </View>
              <Text style={{ fontSize: 26, fontWeight: '800', color: colors.textPrimary, lineHeight: 34, marginBottom: 6 }}>
                {L(principle.title, principle.title_en, lang)}
              </Text>
              <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22 }} numberOfLines={2}>
                {L(principle.foundation.keyIdea, principle.foundation.keyIdea_en, lang)}
              </Text>
            </>
          )}
          <View style={{ width: 32, height: 3, backgroundColor: colors.primary, borderRadius: 2, marginTop: 14 }} />
        </View>

        {/* ─── Content ─── */}
        {loading ? (
          <SkeletonLoading />
        ) : error ? (
          /* 에러 상태 */
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
            <Pressable
              onPress={refresh}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>{t('principle.retry')}</Text>
            </Pressable>
          </View>
        ) : !principle ? (
          /* 빈 상태 */
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <BookOpen size={34} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
              {lang === 'en' ? "Preparing today's snack" : '오늘의 학문 스낵 준비 중'}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
              {lang === 'en' ? 'Discover a new principle every day' : '매일 새로운 원리를 만나보세요'}
            </Text>
            <Pressable
              onPress={refresh}
              style={({ pressed }) => ({
                marginTop: 20,
                backgroundColor: colors.primary,
                paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>
                {lang === 'en' ? 'Check again' : '다시 확인하기'}
              </Text>
            </Pressable>
          </View>
        ) : (
          /* 메인 콘텐츠 */
          <>
            {/* Step 1: Foundation */}
            <FoundationCard principle={principle} lang={lang} />
            <StepConnector />

            {/* Step 2: Application */}
            <ApplicationCard principle={principle} lang={lang} />
            <StepConnector />

            {/* Step 3: Integration */}
            <IntegrationCard principle={principle} lang={lang} />

            {/* Action Bar */}
            {principleData && <ActionBar principleData={principleData} lang={lang} />}

            {/* Deep Dive (접기식) */}
            {deepDive && (
              <View style={{ marginTop: 16 }}>
                <Pressable
                  onPress={toggleDeepDive}
                  style={({ pressed }) => ({
                    backgroundColor: colors.surface,
                    borderRadius: 16, padding: 18,
                    borderWidth: 1, borderColor: colors.border,
                    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const,
                    opacity: pressed ? 0.8 : 1,
                  })}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: deepDiveOpen }}
                  accessibilityLabel={lang === 'en' ? 'Deep Dive' : '더 깊이 알아보기'}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: 12,
                      backgroundColor: colors.indigoBg,
                      alignItems: 'center', justifyContent: 'center', marginRight: 12,
                    }}>
                      <Layers size={20} color={colors.indigo} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
                        {lang === 'en' ? 'Deep Dive' : '더 깊이 알아보기'}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        {lang === 'en' ? 'History, mechanism, formula & more' : '역사, 작동 원리, 공식 등'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ transform: [{ rotate: deepDiveOpen ? '180deg' : '0deg' }] }}>
                    <ChevronDown size={20} color={colors.textDim} />
                  </View>
                </Pressable>

                {deepDiveOpen && (
                  <View style={{ marginTop: 16 }}>
                    <DeepDiveContent deepDive={deepDive} lang={lang} />
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
