/**
 * 학문 스낵 탭 -- 45개 학문원리 브라우저 (텍스트/수식 콘텐츠 전용)
 *
 * 2단 탭 구조:
 *  1) Super category (공학 / 자연과학 / 형식과학 / 응용과학)
 *  2) 카테고리 내 원리 목록 (horizontal scroll)
 *
 * 선택된 원리의 학문스낵 콘텐츠(마크다운) + Takeaway 표시.
 * 시뮬레이션은 Lab 탭에서만 표시.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { SnapsContentRenderer } from '@/components/snaps/SnapsContentRenderer';
import { FontFamily } from '@/lib/theme';
import {
  SUPER_CATEGORIES,
  getSuperCategoryEn,
  getDisciplineEn,
  getPrinciplesByCategory,
  type LabPrinciple,
} from '@/lib/labPrinciples';

// ---------------------------------------------------------------------------
// CONNECTION_TYPE / DIFFICULTY labels
// ---------------------------------------------------------------------------

const CONNECTION_LABELS: Record<string, { ko: string; en: string }> = {
  direct_inspiration: { ko: '직접 영감', en: 'Direct Inspiration' },
  structural_analogy: { ko: '구조적 유추', en: 'Structural Analogy' },
  mathematical_foundation: { ko: '수학적 토대', en: 'Mathematical Foundation' },
  conceptual_borrowing: { ko: '개념 차용', en: 'Conceptual Borrowing' },
};

const DIFFICULTY_LABELS: Record<string, { ko: string; en: string }> = {
  beginner: { ko: '입문', en: 'Beginner' },
  intermediate: { ko: '중급', en: 'Intermediate' },
  advanced: { ko: '심화', en: 'Advanced' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SnapsScreen() {
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

  const content = p
    ? (isKo ? p.contentKo : p.contentEn) || p.contentKo
    : '';

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
          {t('tab.snaps')}
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
            </Pressable>
          );
        })}
      </ScrollView>

      {/* -- Content -- */}
      <ScrollView
        key={p.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Discipline badge */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 6,
          marginTop: 16,
          marginBottom: 8,
        }}>
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.textDim,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}>
              {isKo ? p.superCategory : getSuperCategoryEn(p.superCategory)}
              {'  ·  '}
              {isKo ? p.disciplineName : getDisciplineEn(p.discipline)}
            </Text>
          </View>

          {/* Difficulty */}
          <View style={{
            paddingHorizontal: 6,
            paddingVertical: 2,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={{ fontSize: 9, fontWeight: '600', color: colors.textDim }}>
              {DIFFICULTY_LABELS[p.difficulty]?.[isKo ? 'ko' : 'en'] || p.difficulty}
            </Text>
          </View>

          {/* Connection type */}
          <View style={{
            paddingHorizontal: 6,
            paddingVertical: 2,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={{ fontSize: 9, fontWeight: '600', color: colors.textDim }}>
              {CONNECTION_LABELS[p.connectionType]?.[isKo ? 'ko' : 'en'] || p.connectionType}
            </Text>
          </View>
        </View>

        {/* Principle title */}
        <Text style={{
          fontSize: 22,
          fontWeight: '700',
          fontFamily: FontFamily.serif,
          color: colors.textPrimary,
          marginBottom: 16,
        }}>
          {p.principleName}
        </Text>

        {/* Snaps content (text/formula only, no simulation) */}
        {content ? (
          <SnapsContentRenderer content={content} />
        ) : null}

        {/* Takeaway */}
        {(isKo ? p.takeaway : p.takeawayEn || p.takeaway) ? (
          <View style={{
            marginTop: 24,
            padding: 14,
            backgroundColor: colors.primaryLight,
            borderWidth: 1,
            borderColor: colors.primaryBorder,
          }}>
            <Text style={{
              fontSize: 13,
              color: colors.textPrimary,
              lineHeight: 20,
            }}>
              {isKo ? p.takeaway : (p.takeawayEn || p.takeaway)}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
