/**
 * Lab 탭 -- 45개 학문원리 시뮬레이션 전용 브라우저
 *
 * 2단 탭 구조:
 *  1) Super category (공학 / 자연과학 / 형식과학 / 응용과학)
 *  2) 카테고리 내 원리 목록 (horizontal scroll)
 *
 * 시뮬레이션이 있는 원리: InteractiveSim 표시
 * 시뮬레이션이 없는 원리: "시뮬레이션 준비 중" 빈 상태 표시
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { InteractiveSim } from '@/components/snaps/InteractiveSim';
import { SIMULATIONS } from '@/components/snaps/simulations';
import {
  SUPER_CATEGORIES,
  getSuperCategoryEn,
  getPrinciplesByCategory,
  getSimId,
  type LabPrinciple,
} from '@/lib/labPrinciples';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LabScreen() {
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const isKo = lang === 'ko';

  // --- State ---
  const [catIdx, setCatIdx] = useState(0);
  const [principleIdx, setPrincipleIdx] = useState(0);
  const principleScrollRef = useRef<ScrollView>(null);

  const cat = SUPER_CATEGORIES[catIdx];
  const principles = getPrinciplesByCategory(cat);
  const p = principles[principleIdx] as LabPrinciple | undefined;

  // Reset principle selection when switching category
  useEffect(() => {
    setPrincipleIdx(0);
    principleScrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [catIdx]);

  const simId = p ? getSimId(p.id) : undefined;
  const hasSim = simId != null && SIMULATIONS[simId] != null;

  const handleCatPress = useCallback((idx: number) => setCatIdx(idx), []);
  const handlePrinciplePress = useCallback((idx: number) => setPrincipleIdx(idx), []);

  if (!p) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* -- Header -- */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{
          fontSize: 20,
          fontWeight: '800',
          color: colors.textPrimary,
          letterSpacing: -0.3,
        }}>
          {t('lab.title')}
        </Text>
      </View>

      {/* -- Super Category Tabs -- */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
        style={{ flexGrow: 0, paddingBottom: 10 }}
      >
        {SUPER_CATEGORIES.map((c, idx) => {
          const active = idx === catIdx;
          return (
            <Pressable
              key={c}
              onPress={() => handleCatPress(idx)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: active ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.border,
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: active ? '700' : '500',
                color: active ? '#000' : colors.textDim,
              }}>
                {isKo ? c : getSuperCategoryEn(c)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* -- Principle Tabs -- */}
      <ScrollView
        ref={principleScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        style={{
          flexGrow: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {principles.map((item, idx) => {
          const active = idx === principleIdx;
          const itemHasSim = (() => {
            const sid = getSimId(item.id);
            return sid != null && SIMULATIONS[sid] != null;
          })();
          return (
            <Pressable
              key={item.id}
              onPress={() => handlePrinciplePress(idx)}
              style={{
                paddingHorizontal: 12,
                paddingTop: 8,
                paddingBottom: 10,
                borderBottomWidth: 2,
                borderBottomColor: active ? colors.primary : 'transparent',
                marginBottom: -1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: active ? '700' : '500',
                  color: active ? colors.textPrimary : colors.textDim,
                }}
                numberOfLines={1}
              >
                {item.principleName}
              </Text>
              {itemHasSim && (
                <View style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.primary,
                }} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* -- Content: Simulation only -- */}
      <ScrollView
        key={p.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Principle title */}
        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.textPrimary,
          marginTop: 20,
          marginBottom: 16,
        }}>
          {p.principleName}
        </Text>

        {hasSim ? (
          /* Simulation exists */
          <InteractiveSim id={simId!} />
        ) : (
          /* Empty state: simulation not yet available */
          <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 80,
            paddingHorizontal: 32,
          }}>
            <Text style={{
              fontSize: 15,
              fontWeight: '600',
              color: colors.textPrimary,
              textAlign: 'center',
            }}>
              {t('lab.sim_coming_soon')}
            </Text>
            <Text style={{
              fontSize: 13,
              color: colors.textDim,
              marginTop: 8,
              textAlign: 'center',
              lineHeight: 20,
            }}>
              {t('lab.sim_coming_soon_desc')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
