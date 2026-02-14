/**
 * 시너지 랩 화면
 * - 점수바: View style width %
 * - 로드맵 아코디언: useState + LayoutAnimation
 * - 공유: Share.share() from react-native
 * - problem_addressed, narrative, technical_roadmap, market_feasibility, first_step 표시
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  RefreshControl,
  LayoutAnimation,
  Share,
} from 'react-native';
import { ChevronDown, ChevronUp, Share2, Lightbulb, Target, Map, TrendingUp, Rocket, RefreshCw } from 'lucide-react-native';
import { useSynergyIdeas } from '@/hooks/useSynergyIdeas';
import { IdeaCardSkeleton } from '@/components/shared/LoadingSkeleton';
import type { SynergyIdea, RoadmapPhase } from '@/lib/types';

const cardShadow = {
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
};

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  const pct = Math.min(Math.max((score / 10) * 100, 0), 100);
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-text-muted text-xs font-medium">{label}</Text>
        <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{score}/10</Text>
      </View>
      <View style={{ height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
        <View
          style={{
            width: `${pct}%`,
            height: 6,
            backgroundColor: color,
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
}

function RoadmapSection({ phases }: { phases: RoadmapPhase[] }) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((p) => !p);
  };

  return (
    <View className="mb-3">
      <Pressable
        onPress={toggle}
        className="active:opacity-70"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#FFEBEE',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Map size={12} color="#E53935" />
          </View>
          <Text className="text-text font-bold text-sm">기술 로드맵</Text>
        </View>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#FAFAFA',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {expanded ? <ChevronUp size={14} color="#757575" /> : <ChevronDown size={14} color="#757575" />}
        </View>
      </Pressable>

      {expanded && (
        <View
          className="rounded-xl p-4 mt-1"
          style={{ backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#F0F0F0' }}
        >
          {phases.map((phase, i) => (
            <View key={i} style={i < phases.length - 1 ? { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' } : undefined}>
              <View className="flex-row items-center justify-between mb-2">
                <Text style={{ color: '#E53935', fontSize: 13, fontWeight: '700' }}>Phase {phase.phase}: {phase.title}</Text>
                <Text className="text-text-dim text-xs">{phase.duration}</Text>
              </View>
              {phase.tasks.map((task, j) => (
                <View key={j} className="flex-row items-start gap-2 mb-1.5">
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: '#BDBDBD',
                      marginTop: 6,
                    }}
                  />
                  <Text className="text-text text-xs flex-1" style={{ lineHeight: 18 }}>{task}</Text>
                </View>
              ))}
              {phase.techStack?.length > 0 && (
                <View className="flex-row flex-wrap gap-1.5 mt-2">
                  {phase.techStack.map((tech, k) => (
                    <View key={k} className="bg-primary-light px-2.5 py-1 rounded-full">
                      <Text style={{ color: '#E53935', fontSize: 11 }}>{tech}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function MarketSection({ idea }: { idea: SynergyIdea }) {
  const [expanded, setExpanded] = useState(false);
  const mf = idea.market_feasibility;
  if (!mf) return null;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((p) => !p);
  };

  return (
    <View className="mb-3">
      <Pressable
        onPress={toggle}
        className="active:opacity-70"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#E8F5E9',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={12} color="#43A047" />
          </View>
          <Text className="text-text font-bold text-sm">시장 분석</Text>
        </View>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#FAFAFA',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {expanded ? <ChevronUp size={14} color="#757575" /> : <ChevronDown size={14} color="#757575" />}
        </View>
      </Pressable>

      {expanded && (
        <View
          className="rounded-xl p-4 mt-1"
          style={{ backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#F0F0F0' }}
        >
          {mf.tam && (
            <View className="mb-3">
              <Text className="text-text-muted text-xs mb-1 font-medium">전체 시장 규모 (TAM)</Text>
              <Text className="text-text text-sm font-bold">{mf.tam}</Text>
            </View>
          )}
          {mf.differentiation && (
            <View className="mb-3">
              <Text className="text-text-muted text-xs mb-1 font-medium">차별화 포인트</Text>
              <Text className="text-text text-sm" style={{ lineHeight: 20 }}>{mf.differentiation}</Text>
            </View>
          )}
          {mf.revenueModel && (
            <View className="mb-3">
              <Text className="text-text-muted text-xs mb-1 font-medium">수익 모델</Text>
              <Text className="text-text text-sm" style={{ lineHeight: 20 }}>{mf.revenueModel}</Text>
            </View>
          )}
          {mf.competitors?.length > 0 && (
            <View>
              <Text className="text-text-muted text-xs mb-2 font-medium">경쟁자</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {mf.competitors.map((c, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: '#FFFFFF',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#F0F0F0',
                    }}
                  >
                    <Text className="text-text-muted text-xs">{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function IdeaCard({ idea, rank }: { idea: SynergyIdea; rank: number }) {
  const [expanded, setExpanded] = useState(rank === 1);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((p) => !p);
  };

  const handleShare = () => {
    const text = `${idea.concept_name}\n\n${idea.narrative ?? idea.description ?? ''}\n\n첫 단계: ${idea.first_step ?? ''}`;
    Share.share({ message: text, title: idea.concept_name });
  };

  const totalScore = idea.total_score ?? 0;

  return (
    <View className="bg-card rounded-2xl mx-4 mb-3 overflow-hidden" style={cardShadow}>
      {/* Header */}
      <Pressable onPress={toggle} className="p-4 active:opacity-80">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#E53935',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>{rank}</Text>
            </View>
            <Text className="text-text font-bold text-base flex-1" style={{ lineHeight: 22 }} numberOfLines={2}>
              {idea.concept_name}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={handleShare}
              className="active:opacity-70"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#FAFAFA',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Share2 size={14} color="#757575" />
            </Pressable>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#FAFAFA',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {expanded ? <ChevronUp size={14} color="#757575" /> : <ChevronDown size={14} color="#757575" />}
            </View>
          </View>
        </View>

        {/* Problem Addressed */}
        {idea.problem_addressed && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 8,
              backgroundColor: '#FFF8E1',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 10,
            }}
          >
            <Target size={12} color="#FB8C00" style={{ marginTop: 2 }} />
            <Text style={{ color: '#E65100', fontSize: 12, flex: 1, lineHeight: 18 }} numberOfLines={2}>
              {idea.problem_addressed}
            </Text>
          </View>
        )}

        {/* Score Summary */}
        <View className="flex-row items-center gap-2 mt-1">
          <View
            style={{
              backgroundColor: '#FFEBEE',
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#E53935', fontSize: 12, fontWeight: '800' }}>
              총점 {totalScore}/30
            </Text>
          </View>
          {idea.tags?.slice(0, 2).map((tag, i) => (
            <View
              key={i}
              style={{
                backgroundColor: '#FAFAFA',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#F0F0F0',
              }}
            >
              <Text className="text-text-dim text-xs">{tag}</Text>
            </View>
          ))}
        </View>
      </Pressable>

      {/* Expanded Content */}
      {expanded && (
        <View className="px-4 pb-4" style={{ borderTopWidth: 1, borderTopColor: '#F0F0F0' }}>
          {/* Narrative */}
          {idea.narrative && (
            <View className="mt-4 mb-4">
              <Text className="text-text-muted text-xs uppercase tracking-wider mb-2 font-semibold">스토리</Text>
              <Text className="text-text text-sm" style={{ lineHeight: 22 }}>{idea.narrative}</Text>
            </View>
          )}

          {/* Score Bars */}
          <View className="mb-4">
            <Text className="text-text-muted text-xs uppercase tracking-wider mb-3 font-semibold">평가 점수</Text>
            <ScoreBar label="실현가능성" score={idea.feasibility_score ?? 0} color="#E53935" />
            <ScoreBar label="참신성" score={idea.novelty_score ?? 0} color="#FF7043" />
            <ScoreBar label="임팩트" score={idea.impact_score ?? 0} color="#43A047" />
          </View>

          {/* First Step */}
          {idea.first_step && (
            <Pressable
              className="active:opacity-80"
              style={{
                backgroundColor: '#E53935',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Rocket size={14} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>
                  오늘 당장 시작하기
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 22, fontWeight: '500' }}>
                  {idea.first_step}
                </Text>
              </View>
            </Pressable>
          )}

          {/* Implementation Plan */}
          {idea.implementation_plan && (
            <View
              className="rounded-xl p-4 mb-4"
              style={{ backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#F0F0F0' }}
            >
              <Text className="text-text font-bold text-sm mb-3">구현 로드맵</Text>
              {idea.implementation_plan.today && (
                <View className="mb-3">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#43A047' }} />
                    <Text style={{ color: '#43A047', fontSize: 12, fontWeight: '700' }}>오늘</Text>
                  </View>
                  <Text className="text-text text-xs" style={{ lineHeight: 18, marginLeft: 14 }}>
                    {idea.implementation_plan.today}
                  </Text>
                </View>
              )}
              {idea.implementation_plan.this_week && (
                <View className="mb-3">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FB8C00' }} />
                    <Text style={{ color: '#FB8C00', fontSize: 12, fontWeight: '700' }}>이번 주</Text>
                  </View>
                  <Text className="text-text text-xs" style={{ lineHeight: 18, marginLeft: 14 }}>
                    {idea.implementation_plan.this_week}
                  </Text>
                </View>
              )}
              {idea.implementation_plan.this_month && (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' }} />
                    <Text style={{ color: '#E53935', fontSize: 12, fontWeight: '700' }}>이번 달</Text>
                  </View>
                  <Text className="text-text text-xs" style={{ lineHeight: 18, marginLeft: 14 }}>
                    {idea.implementation_plan.this_month}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Technical Roadmap */}
          {idea.technical_roadmap?.phases?.length > 0 && (
            <RoadmapSection phases={idea.technical_roadmap.phases} />
          )}

          {/* Market Feasibility */}
          <MarketSection idea={idea} />

          {/* Key Innovation */}
          {idea.key_innovation && (
            <View className="mb-4">
              <Text className="text-text-muted text-xs uppercase tracking-wider mb-2 font-semibold">핵심 혁신</Text>
              <Text className="text-text text-sm" style={{ lineHeight: 22 }}>{idea.key_innovation}</Text>
            </View>
          )}

          {/* Required Tech */}
          {idea.required_tech?.length > 0 && (
            <View>
              <Text className="text-text-muted text-xs uppercase tracking-wider mb-2 font-semibold">필요 기술</Text>
              <View className="flex-row flex-wrap gap-2">
                {idea.required_tech.map((tech, i) => (
                  <View key={i} className="bg-primary-light px-3 py-1.5 rounded-full">
                    <Text style={{ color: '#E53935', fontSize: 12, fontWeight: '500' }}>{tech}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function IdeasScreen() {
  const { ideasData, ideas, loading, error, refresh } = useSynergyIdeas();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-5 pb-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-text text-2xl font-bold">시너지 랩</Text>
            <Text className="text-text-muted text-sm mt-1">
              {ideasData?.date ? `${ideasData.date} · ` : ''}AI x 학문 융합 아이디어
            </Text>
          </View>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FFEBEE',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lightbulb size={20} color="#E53935" />
          </View>
        </View>
        {/* Red accent line */}
        <View
          style={{
            width: 40,
            height: 3,
            backgroundColor: '#E53935',
            borderRadius: 2,
            marginTop: 12,
          }}
        />
      </View>

      {/* Source Info */}
      {ideasData?.source_principle && (
        <View
          className="mx-4 mb-3 rounded-2xl px-4 py-3"
          style={{
            backgroundColor: '#FFF3E0',
            borderWidth: 1,
            borderColor: '#FFE0B2',
          }}
        >
          <Text style={{ color: '#E65100', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
            오늘의 학문 원리
          </Text>
          <Text className="text-text text-sm" style={{ lineHeight: 20 }}>{ideasData.source_principle}</Text>
        </View>
      )}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E53935" />}
      >
        {loading ? (
          <>
            <IdeaCardSkeleton />
            <IdeaCardSkeleton />
            <IdeaCardSkeleton />
          </>
        ) : error ? (
          <View className="items-center justify-center py-20 px-8">
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#FFEBEE',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <RefreshCw size={28} color="#E53935" />
            </View>
            <Text className="text-text font-semibold text-base mb-2">연결에 문제가 있어요</Text>
            <Text className="text-text-muted text-sm text-center mb-5" style={{ lineHeight: 20 }}>{error}</Text>
            <Pressable
              onPress={refresh}
              className="active:opacity-70"
              style={{
                backgroundColor: '#E53935',
                paddingHorizontal: 28,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>다시 시도</Text>
            </Pressable>
          </View>
        ) : ideas.length === 0 ? (
          <View className="items-center justify-center py-20">
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#FFEBEE',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Lightbulb size={28} color="#E53935" />
            </View>
            <Text className="text-text font-semibold text-base mb-1">아직 아이디어가 없어요</Text>
            <Text className="text-text-muted text-sm">잠시 후 다시 확인해보세요</Text>
          </View>
        ) : (
          ideas.map((idea, index) => (
            <IdeaCard key={`${idea.concept_name}-${index}`} idea={idea} rank={index + 1} />
          ))
        )}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
