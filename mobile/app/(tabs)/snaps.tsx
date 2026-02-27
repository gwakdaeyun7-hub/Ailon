/**
 * 학문 스낵 — 인사이트 / 딥다이브 2-탭 구조
 * Foundation → Application → Integration 카드 + DeepDive 섹션
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
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
} from 'lucide-react-native';
import { usePrinciple } from '@/hooks/usePrinciple';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/lib/colors';
import type { DailyPrinciples, Principle, DeepDive } from '@/lib/types';

// ─── 날짜 포맷 ────────────────────────────────────────────────────────────
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr?: string, lang?: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    if (lang === 'en') {
      return `${EN_MONTHS[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
    }
    return `${y}/${m}/${d}`;
  } catch {
    return '';
  }
}

// ─── 로컬라이즈 헬퍼 (영어 필드 우선, 없으면 한국어 폴백) ──────────────────
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

// ─── 서브 탭 타입 ──────────────────────────────────────────────────────────
type SubTab = 'insight' | 'deepdive';

// ─── 섹션 타이틀 컴포넌트 ──────────────────────────────────────────────────
function SectionTitle({
  icon,
  iconColor,
  iconBg,
  title,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: colors.textDim,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
    </View>
  );
}

// ─── 콜아웃 박스 ───────────────────────────────────────────────────────────
function CalloutBox({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 12 }}>
      {children}
    </View>
  );
}

// ─── 칩 ────────────────────────────────────────────────────────────────────
function Chip({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

// ─── Foundation 카드 ───────────────────────────────────────────────────────
function FoundationCard({ principle, lang }: { principle: Principle; lang: string }) {
  const { colors } = useTheme();
  const { foundation } = principle;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <SectionTitle
        icon={<Lightbulb size={18} color={colors.coreTech} />}
        iconColor={colors.coreTech}
        iconBg={colors.coreTechBg}
        title={lang === 'en' ? 'Foundation' : '기본 원리'}
      />

      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: colors.textPrimary,
          lineHeight: 24,
          marginBottom: 8,
        }}
      >
        {L(foundation.keyIdea, foundation.keyIdea_en, lang)}
      </Text>

      <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textPrimary }}>
        {L(foundation.principle, foundation.principle_en, lang)}
      </Text>

      <CalloutBox>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textDim, marginBottom: 6 }}>
          {lang === 'en' ? 'Everyday Analogy' : '일상 속 비유'}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSecondary }}>
          {L(foundation.everydayAnalogy, foundation.everydayAnalogy_en, lang)}
        </Text>
      </CalloutBox>
    </View>
  );
}

// ─── Application 카드 ──────────────────────────────────────────────────────
function ApplicationCard({ principle, lang }: { principle: Principle; lang: string }) {
  const { colors } = useTheme();
  const { application } = principle;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <SectionTitle
        icon={<Cpu size={18} color={colors.indigo} />}
        iconColor={colors.indigo}
        iconBg={colors.indigoBg}
        title={lang === 'en' ? 'AI Application' : 'AI 응용'}
      />

      {/* applicationField 뱃지 */}
      <View
        style={{
          backgroundColor: colors.indigoBg,
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 5,
          alignSelf: 'flex-start',
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.indigo }}>
          {L(application.applicationField, application.applicationField_en, lang)}
        </Text>
      </View>

      <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textPrimary, marginBottom: 10 }}>
        {L(application.description, application.description_en, lang)}
      </Text>

      <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginBottom: 14 }}>
        {L(application.mechanism, application.mechanism_en, lang)}
      </Text>

      {/* 기술 용어 칩 */}
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

// ─── Integration 카드 ──────────────────────────────────────────────────────
function IntegrationCard({ principle, lang }: { principle: Principle; lang: string }) {
  const { colors } = useTheme();
  const { integration } = principle;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <SectionTitle
        icon={<Zap size={18} color={colors.primary} />}
        iconColor={colors.primary}
        iconBg={colors.primaryLight}
        title={lang === 'en' ? 'Integration' : '융합 사례'}
      />

      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: colors.textPrimary,
          lineHeight: 24,
          marginBottom: 8,
        }}
      >
        {L(integration.problemSolved, integration.problemSolved_en, lang)}
      </Text>

      <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textPrimary, marginBottom: 14 }}>
        {L(integration.solution, integration.solution_en, lang)}
      </Text>

      {/* 실제 사례 */}
      {integration.realWorldExamples.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          {LArr(integration.realWorldExamples, integration.realWorldExamples_en, lang).map((example, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 6, paddingRight: 8 }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginRight: 8 }}>•</Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSecondary, flex: 1 }}>
                {example}
              </Text>
            </View>
          ))}
        </View>
      )}

      <CalloutBox>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textDim, marginBottom: 6 }}>
          {lang === 'en' ? 'Why It Works' : '왜 효과적인가'}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSecondary }}>
          {L(integration.whyItWorks, integration.whyItWorks_en, lang)}
        </Text>
      </CalloutBox>
    </View>
  );
}

// ─── 딥다이브 섹션 컴포넌트 ────────────────────────────────────────────────
function DeepDiveSection({
  icon,
  iconColor,
  iconBg,
  title,
  children,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <SectionTitle icon={icon} iconColor={iconColor} iconBg={iconBg} title={title} />
      {children}
    </View>
  );
}

// ─── 딥다이브 탭 내용 ──────────────────────────────────────────────────────
function DeepDiveContent({ deepDive, lang }: { deepDive: DeepDive; lang: string }) {
  const { colors } = useTheme();

  return (
    <>
      {/* 역사 */}
      <DeepDiveSection
        icon={<History size={18} color={colors.coreTech} />}
        iconColor={colors.coreTech}
        iconBg={colors.coreTechBg}
        title={lang === 'en' ? 'History' : '발견의 역사'}
      >
        <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textPrimary }}>
          {L(deepDive.history, deepDive.history_en, lang)}
        </Text>
      </DeepDiveSection>

      {/* 메커니즘 */}
      <DeepDiveSection
        icon={<FlaskConical size={18} color={colors.indigo} />}
        iconColor={colors.indigo}
        iconBg={colors.indigoBg}
        title={lang === 'en' ? 'Mechanism' : '작동 원리'}
      >
        <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textPrimary }}>
          {L(deepDive.mechanism, deepDive.mechanism_en, lang)}
        </Text>
      </DeepDiveSection>

      {/* 수식 (있을 때만) */}
      {deepDive.formula && (
        <DeepDiveSection
          icon={<Layers size={18} color={colors.primary} />}
          iconColor={colors.primary}
          iconBg={colors.primaryLight}
          title={lang === 'en' ? 'Formula' : '공식'}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                lineHeight: 22,
                color: colors.textPrimary,
                fontFamily: 'monospace',
              }}
            >
              {deepDive.formula}
            </Text>
          </View>
        </DeepDiveSection>
      )}

      {/* 관련 원리 */}
      {deepDive.relatedPrinciples.length > 0 && (
        <DeepDiveSection
          icon={<Link2 size={18} color={colors.success} />}
          iconColor={colors.success}
          iconBg={colors.surface}
          title={lang === 'en' ? 'Related Principles' : '관련 원리'}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {LArr(deepDive.relatedPrinciples, deepDive.relatedPrinciples_en, lang).map((rp) => (
              <Chip key={rp} label={rp} />
            ))}
          </View>
        </DeepDiveSection>
      )}

      {/* 현대적 의의 */}
      <DeepDiveSection
        icon={<Globe size={18} color={colors.accent} />}
        iconColor={colors.accent}
        iconBg={colors.surface}
        title={lang === 'en' ? 'Modern Relevance' : '현대적 의의'}
      >
        <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textPrimary }}>
          {L(deepDive.modernRelevance, deepDive.modernRelevance_en, lang)}
        </Text>
      </DeepDiveSection>
    </>
  );
}

// ─── 메인 스크린 ───────────────────────────────────────────────────────────
export default function SnapsScreen() {
  const { principleData, loading, error, refresh } = usePrinciple();
  const { t, lang } = useLanguage();
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<SubTab>('insight');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const principle = principleData?.principle ?? null;
  const deepDive = principle?.foundation?.deepDive ?? null;

  // ─── 렌더링 ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>

      {/* ─── 헤더 ─── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 12,
          backgroundColor: colors.bg,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: colors.textPrimary,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <BookOpen size={18} color={colors.card} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textPrimary }}>
            {t('snaps.title')}
          </Text>
          {principleData && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              {/* 분야 뱃지 */}
              <View
                style={{
                  backgroundColor: colors.primaryLight,
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                  {getDisciplineName(principleData, lang)}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {formatDate(principleData.date, lang)}
              </Text>
            </View>
          )}
          <View
            style={{
              width: 40,
              height: 3,
              backgroundColor: Colors.primary,
              borderRadius: 2,
              marginTop: 12,
            }}
          />
        </View>
      </View>

      {/* ─── 서브 탭 바 (세그먼트 컨트롤) ─── */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 4,
          }}
        >
          <Pressable
            onPress={() => setActiveTab('insight')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: activeTab === 'insight' ? colors.primary : 'transparent',
              alignItems: 'center',
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'insight' }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: activeTab === 'insight' ? '#FFFFFF' : colors.textSecondary,
              }}
            >
              {lang === 'en' ? 'Insight' : '인사이트'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('deepdive')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: activeTab === 'deepdive' ? colors.primary : 'transparent',
              alignItems: 'center',
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'deepdive' }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: activeTab === 'deepdive' ? '#FFFFFF' : colors.textSecondary,
              }}
            >
              {lang === 'en' ? 'Deep Dive' : '딥다이브'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ─── 본문 ─── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.textSecondary} />
        }
      >
        {loading ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 16 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.errorBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <BookOpen size={28} color={colors.errorColor} />
            </View>
            <Text
              style={{
                color: colors.textPrimary,
                fontWeight: '700',
                fontSize: 16,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {t(error)}
            </Text>
            <Pressable
              onPress={refresh}
              style={{
                backgroundColor: Colors.primary,
                paddingHorizontal: 28,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>
                {t('news.retry')}
              </Text>
            </Pressable>
          </View>
        ) : !principle ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <BookOpen size={28} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: 4,
              }}
            >
              {lang === 'en' ? 'No content yet' : '아직 콘텐츠가 없어요'}
            </Text>
          </View>
        ) : activeTab === 'insight' ? (
          <>
            <FoundationCard principle={principle} lang={lang} />
            <ApplicationCard principle={principle} lang={lang} />
            <IntegrationCard principle={principle} lang={lang} />
          </>
        ) : deepDive ? (
          <DeepDiveContent deepDive={deepDive} lang={lang} />
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Layers size={28} color={colors.textDim} />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: 4,
              }}
            >
              {lang === 'en' ? 'Deep Dive not available' : '딥다이브 데이터가 없어요'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
              {lang === 'en'
                ? 'Detailed content will be available soon'
                : '상세 콘텐츠가 곧 제공될 예정이에요'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
