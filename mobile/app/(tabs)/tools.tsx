/**
 * Lab 탭 — 오늘의 학문 원리에 대응하는 인터랙티브 시뮬레이션
 *
 * - usePrinciple()로 오늘의 원리 fetch
 * - Firestore seed_id → SIMULATIONS 레지스트리 매핑
 * - 대응 시뮬레이션 있으면 InteractiveSim 렌더링
 * - 없으면 빈 상태 표시
 */

import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlaskConical, BookOpen } from 'lucide-react-native';
import { usePrinciple } from '@/hooks/usePrinciple';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { SIMULATIONS } from '@/components/snaps/simulations';
import { InteractiveSim } from '@/components/snaps/InteractiveSim';
import { FontFamily } from '@/lib/theme';

/** seed_id → simulation ID 매핑 */
const SEED_TO_SIM: Record<string, string> = {
  opt_simulated_annealing: 'sa',
};

export default function LabScreen() {
  const { lang } = useLanguage();
  const { colors, isDark } = useTheme();
  const { principleData, loading } = usePrinciple();

  const seedId = (principleData as any)?.seed_id as string | undefined;
  const simId = seedId ? SEED_TO_SIM[seedId] : undefined;
  const hasSimulation = simId != null && SIMULATIONS[simId] != null;

  const principleName = principleData?.principle?.title
    || principleData?.principle?.title_en
    || '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <Text style={{
          fontSize: 20,
          fontWeight: '800',
          color: colors.textPrimary,
          letterSpacing: -0.3,
        }}>
          Lab
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : hasSimulation ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Principle context badge */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 16,
            marginBottom: 4,
            gap: 6,
          }}>
            <BookOpen size={14} color={colors.textDim} strokeWidth={2} />
            <Text style={{
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: colors.textDim,
            }}>
              {lang === 'ko' ? '오늘의 학문 스낵' : "TODAY'S SNACK"}
            </Text>
          </View>

          {/* Principle name */}
          <Text style={{
            fontSize: 22,
            fontWeight: '700',
            fontFamily: FontFamily.serif,
            color: colors.textPrimary,
            marginBottom: 16,
          }}>
            {principleName}
          </Text>

          {/* Simulation */}
          <InteractiveSim id={simId!} />
        </ScrollView>
      ) : (
        /* Empty state — no simulation for today's principle */
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <FlaskConical size={36} color={colors.textDim} style={{ marginBottom: 20 }} />
          <Text style={{
            fontSize: 16,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 8,
            textAlign: 'center',
          }}>
            {lang === 'ko' ? '오늘은 실험이 없어요' : 'No experiment today'}
          </Text>
          {principleName ? (
            <Text style={{
              fontSize: 13,
              color: colors.textSecondary,
              textAlign: 'center',
              lineHeight: 20,
            }}>
              {lang === 'ko'
                ? `오늘의 원리 "${principleName}"에 대응하는\n시뮬레이션을 준비 중이에요.`
                : `A simulation for "${principleName}"\nis coming soon.`}
            </Text>
          ) : (
            <Text style={{
              fontSize: 13,
              color: colors.textSecondary,
              textAlign: 'center',
              lineHeight: 20,
            }}>
              {lang === 'ko'
                ? '시뮬레이션이 있는 원리가 나오면\n여기에서 직접 실험해볼 수 있어요.'
                : 'When a principle with a simulation appears,\nyou can experiment with it here.'}
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
