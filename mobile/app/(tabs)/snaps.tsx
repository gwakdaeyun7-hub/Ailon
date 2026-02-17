/**
 * 학문 스낵 화면 - 새로운 3단계 구조
 * Foundation (기본 원리) → Application (응용) → Integration (융합 사례)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  CheckCircle, ExternalLink, Sparkles, RefreshCw, Menu,
  Lightbulb, Zap, Target
} from 'lucide-react-native';
import { usePrinciples } from '@/hooks/usePrinciples';
import { useDrawer } from '@/context/DrawerContext';
import type { Principle, LearnMoreLink } from '@/lib/types';

const BG = '#FFFFFF';
const CARD = '#FFFFFF';
const PRIMARY = '#E53935';
const PRIMARY_LIGHT = '#FFEBEE';

// 학문 분야별 색상
const FIELD_COLORS: Record<string, string> = {
  '기초과학': '#3b82f6',
  '생명과학': '#43A047',
  '공학': '#FB8C00',
  '사회과학': '#E53935',
  '인문학': '#8b5cf6',
};

function getFieldColor(superCategory?: string): string {
  return FIELD_COLORS[superCategory ?? ''] ?? '#6366f1';
}

function LearnMoreLinkButton({ link }: { link: LearnMoreLink }) {
  const icon = link.type === 'youtube' ? '▶' : link.type === 'wikipedia' ? 'W' : '📄';
  const color = link.type === 'youtube' ? PRIMARY : link.type === 'wikipedia' ? '#3b82f6' : '#757575';

  return (
    <Pressable
      onPress={() => Linking.openURL(link.url)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F0F0F0',
      }}
    >
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{icon}</Text>
      <Text style={{ color: '#757575', fontSize: 12, maxWidth: 180 }} numberOfLines={1}>
        {link.title}
      </Text>
      <ExternalLink size={10} color="#BDBDBD" />
    </Pressable>
  );
}

// ─── 3단계 학습 카드 ───────────────────────────────────────────────────────
function ThreeStageCard({ principle }: { principle: Principle }) {
  const fieldColor = getFieldColor(principle.superCategory);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  const toggleStage = (stage: number) => {
    setExpandedStage(prev => (prev === stage ? null : stage));
  };

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
      {/* 헤더 */}
      <View
        style={{
          backgroundColor: fieldColor,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Sparkles size={16} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800', flex: 1 }}>
          {principle.title}
        </Text>
        {principle.superCategory && (
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
              {principle.superCategory}
            </Text>
          </View>
        )}
      </View>

      {/* 본문 */}
      <View
        style={{
          backgroundColor: CARD,
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
          borderWidth: 2,
          borderTopWidth: 0,
          borderColor: `${fieldColor}40`,
          shadowColor: fieldColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        {/* Stage 1: Foundation (기본 원리) */}
        <Pressable
          onPress={() => toggleStage(1)}
          style={{
            borderBottomWidth: 1,
            borderBottomColor: '#F0F0F0',
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#E3F2FD',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lightbulb size={14} color="#1976D2" />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#1976D2', flex: 1 }}>
              1단계: 기본 원리
            </Text>
            <CheckCircle
              size={18}
              color={expandedStage === 1 ? '#1976D2' : '#E0E0E0'}
            />
          </View>
          <Text style={{ fontSize: 13, color: '#757575', lineHeight: 19 }} numberOfLines={expandedStage === 1 ? undefined : 2}>
            {principle.foundation.keyIdea}
          </Text>
        </Pressable>

        {expandedStage === 1 && (
          <View style={{ padding: 16, backgroundColor: '#F5F5F5', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            <Text style={{ fontSize: 14, color: '#212121', lineHeight: 22, marginBottom: 12 }}>
              {principle.foundation.principle}
            </Text>
            {principle.foundation.everydayAnalogy && (
              <View
                style={{
                  backgroundColor: '#FFF9C4',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#FFF176',
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#F57F17', marginBottom: 4 }}>
                  💡 일상 비유
                </Text>
                <Text style={{ fontSize: 13, color: '#212121', lineHeight: 20 }}>
                  {principle.foundation.everydayAnalogy}
                </Text>
              </View>
            )}
            {principle.foundation.scientificContext && (
              <Text style={{ fontSize: 12, color: '#757575', lineHeight: 18, fontStyle: 'italic' }}>
                📚 {principle.foundation.scientificContext}
              </Text>
            )}
          </View>
        )}

        {/* Stage 2: Application (응용) */}
        <Pressable
          onPress={() => toggleStage(2)}
          style={{
            borderBottomWidth: 1,
            borderBottomColor: '#F0F0F0',
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#E8F5E9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={14} color="#43A047" />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#43A047', flex: 1 }}>
              2단계: 응용
            </Text>
            <CheckCircle
              size={18}
              color={expandedStage === 2 ? '#43A047' : '#E0E0E0'}
            />
          </View>
          <Text style={{ fontSize: 13, color: '#757575', lineHeight: 19 }} numberOfLines={expandedStage === 2 ? undefined : 2}>
            {principle.application.mechanism}
          </Text>
        </Pressable>

        {expandedStage === 2 && (
          <View style={{ padding: 16, backgroundColor: '#F5F5F5', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#43A047', marginBottom: 6 }}>
                응용 분야: {principle.application.applicationField}
              </Text>
              <Text style={{ fontSize: 14, color: '#212121', lineHeight: 22 }}>
                {principle.application.description}
              </Text>
            </View>
            {principle.application.technicalTerms?.length > 0 && (
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#757575', marginBottom: 8 }}>
                  관련 기술 용어
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {principle.application.technicalTerms.map((term, i) => (
                    <View
                      key={i}
                      style={{
                        backgroundColor: '#E8F5E9',
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: '#43A047', fontWeight: '600' }}>
                        {term}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Stage 3: Integration (융합 사례) */}
        <Pressable
          onPress={() => toggleStage(3)}
          style={{
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: PRIMARY_LIGHT,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Target size={14} color={PRIMARY} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: PRIMARY, flex: 1 }}>
              3단계: 융합 사례
            </Text>
            <CheckCircle
              size={18}
              color={expandedStage === 3 ? PRIMARY : '#E0E0E0'}
            />
          </View>
          <Text style={{ fontSize: 13, color: '#757575', lineHeight: 19 }} numberOfLines={expandedStage === 3 ? undefined : 2}>
            {principle.integration.problemSolved}
          </Text>
        </Pressable>

        {expandedStage === 3 && (
          <View style={{ padding: 16, backgroundColor: '#F5F5F5' }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: PRIMARY, marginBottom: 4 }}>
                해결한 문제
              </Text>
              <Text style={{ fontSize: 14, color: '#212121', lineHeight: 22, marginBottom: 12 }}>
                {principle.integration.problemSolved}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: PRIMARY, marginBottom: 4 }}>
                해결 방법
              </Text>
              <Text style={{ fontSize: 14, color: '#212121', lineHeight: 22 }}>
                {principle.integration.solution}
              </Text>
            </View>
            {principle.integration.realWorldExamples?.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#757575', marginBottom: 8 }}>
                  실제 사례
                </Text>
                {principle.integration.realWorldExamples.map((example, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: PRIMARY,
                        marginTop: 6,
                      }}
                    />
                    <Text style={{ fontSize: 13, color: '#212121', flex: 1, lineHeight: 20 }}>
                      {example}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <View
              style={{
                backgroundColor: '#E8F5E9',
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: '#C8E6C9',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#43A047', marginBottom: 4 }}>
                ✨ 왜 효과적인가요?
              </Text>
              <Text style={{ fontSize: 13, color: '#212121', lineHeight: 20 }}>
                {principle.integration.whyItWorks}
              </Text>
            </View>
          </View>
        )}

        {/* 검증 정보 */}
        {principle.verification && (
          <View
            style={{
              backgroundColor: principle.verification.verified ? '#E8F5E9' : '#FFF3E0',
              padding: 12,
              borderTopWidth: 1,
              borderTopColor: '#F0F0F0',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle
              size={14}
              color={principle.verification.verified ? '#43A047' : '#FB8C00'}
            />
            <Text
              style={{
                fontSize: 11,
                color: principle.verification.verified ? '#43A047' : '#FB8C00',
                flex: 1,
                fontWeight: '600',
              }}
            >
              {principle.verification.verified
                ? `검증 완료 (신뢰도 ${(principle.verification.confidence * 100).toFixed(0)}%)`
                : '검증 필요'}
            </Text>
          </View>
        )}

        {/* 더 알아보기 */}
        {principle.learn_more_links && principle.learn_more_links.length > 0 && (
          <View style={{ padding: 16, backgroundColor: '#FAFAFA' }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: '#757575',
                marginBottom: 10,
                letterSpacing: 0.5,
              }}
            >
              더 알아보기
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {principle.learn_more_links.map((link, i) => (
                <LearnMoreLinkButton key={i} link={link} />
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────
export default function SnapsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { selectedDates, openDrawer, setActiveTab } = useDrawer();
  const selectedDate = selectedDates.snaps;

  useFocusEffect(
    useCallback(() => {
      setActiveTab('snaps');
    }, [setActiveTab])
  );

  const { principlesData, principle, loading, error, refresh } = usePrinciples(selectedDate);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const dateLabel = selectedDate
    ? new Date(selectedDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    : '오늘';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 12,
          backgroundColor: BG,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#212121' }}>학문 스낵</Text>
            <Text style={{ fontSize: 14, color: '#757575', marginTop: 4 }}>
              {principlesData?.date ?? dateLabel} · 3단계 학습
            </Text>
          </View>
          <Pressable
            onPress={openDrawer}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FAFAFA',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#F0F0F0',
            }}
          >
            <Menu size={20} color="#757575" />
          </Pressable>
        </View>
        <View
          style={{
            width: 40,
            height: 3,
            backgroundColor: PRIMARY,
            borderRadius: 2,
            marginTop: 12,
          }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={PRIMARY} />
        }
      >
        {loading ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <View
              style={{
                backgroundColor: '#F5F5F5',
                borderRadius: 18,
                height: 400,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#BDBDBD', fontSize: 14 }}>로딩 중...</Text>
            </View>
          </View>
        ) : error ? (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 80,
              paddingHorizontal: 32,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: PRIMARY_LIGHT,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <RefreshCw size={28} color={PRIMARY} />
            </View>
            <Text style={{ color: '#212121', fontWeight: '700', fontSize: 16, marginBottom: 8 }}>
              연결에 문제가 있어요
            </Text>
            <Text
              style={{
                color: '#757575',
                fontSize: 14,
                textAlign: 'center',
                marginBottom: 20,
                lineHeight: 20,
              }}
            >
              {error}
            </Text>
            <Pressable
              onPress={refresh}
              style={{
                backgroundColor: PRIMARY,
                paddingHorizontal: 28,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>다시 시도</Text>
            </Pressable>
          </View>
        ) : !principle ? (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 80,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: PRIMARY_LIGHT,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Sparkles size={28} color={PRIMARY} />
            </View>
            <Text style={{ color: '#212121', fontWeight: '700', fontSize: 16, marginBottom: 4 }}>
              아직 학문 스낵이 없어요
            </Text>
            <Text style={{ color: '#757575', fontSize: 14 }}>잠시 후 다시 확인해보세요</Text>
          </View>
        ) : (
          <>
            {/* 학문 분야 정보 */}
            {principlesData?.discipline_info && (
              <View
                style={{
                  marginHorizontal: 16,
                  marginBottom: 16,
                  backgroundColor: '#FFF3E0',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#FFE0B2',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#E65100', marginBottom: 6 }}>
                  오늘의 학문
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 4 }}>
                  {principlesData.discipline_info.name}
                </Text>
                <Text style={{ fontSize: 13, color: '#757575', lineHeight: 19 }}>
                  {principlesData.discipline_info.focus}
                </Text>
              </View>
            )}

            {/* 3단계 학습 카드 */}
            <ThreeStageCard principle={principle} />

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
