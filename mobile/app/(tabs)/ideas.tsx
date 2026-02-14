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
import { ChevronDown, ChevronUp, Share2, Lightbulb, Target, Map, TrendingUp } from 'lucide-react-native';
import { useSynergyIdeas } from '@/hooks/useSynergyIdeas';
import { IdeaCardSkeleton } from '@/components/shared/LoadingSkeleton';
import type { SynergyIdea, RoadmapPhase } from '@/lib/types';

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  const pct = Math.min(Math.max((score / 10) * 100, 0), 100);
  return (
    <View className="mb-2">
      <View className="flex-row justify-between mb-1">
        <Text className="text-text-muted text-xs">{label}</Text>
        <Text className="text-text-muted text-xs">{score}/10</Text>
      </View>
      <View className="h-2 bg-surface rounded-full overflow-hidden">
        <View style={{ width: `${pct}%`, height: 8, backgroundColor: color, borderRadius: 4 }} />
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
      <Pressable onPress={toggle} className="flex-row items-center justify-between py-2">
        <View className="flex-row items-center gap-2">
          <Map size={14} color="#e53935" />
          <Text className="text-text font-semibold text-sm">기술 로드맵</Text>
        </View>
        {expanded ? <ChevronUp size={14} color="#a0a0a0" /> : <ChevronDown size={14} color="#a0a0a0" />}
      </Pressable>

      {expanded && (
        <View className="bg-surface rounded-xl p-3 mt-1">
          {phases.map((phase, i) => (
            <View key={i} className={`${i < phases.length - 1 ? 'mb-3 pb-3 border-b border-border' : ''}`}>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-primary text-xs font-semibold">Phase {phase.phase}: {phase.title}</Text>
                <Text className="text-text-dim text-xs">{phase.duration}</Text>
              </View>
              {phase.tasks.map((task, j) => (
                <View key={j} className="flex-row items-start gap-1.5 mb-1">
                  <Text className="text-text-muted text-xs mt-0.5">•</Text>
                  <Text className="text-text text-xs flex-1 leading-relaxed">{task}</Text>
                </View>
              ))}
              {phase.techStack?.length > 0 && (
                <View className="flex-row flex-wrap gap-1 mt-1.5">
                  {phase.techStack.map((tech, k) => (
                    <View key={k} className="bg-primary/10 px-2 py-0.5 rounded">
                      <Text className="text-primary text-xs">{tech}</Text>
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
      <Pressable onPress={toggle} className="flex-row items-center justify-between py-2">
        <View className="flex-row items-center gap-2">
          <TrendingUp size={14} color="#22c55e" />
          <Text className="text-text font-semibold text-sm">시장 분석</Text>
        </View>
        {expanded ? <ChevronUp size={14} color="#a0a0a0" /> : <ChevronDown size={14} color="#a0a0a0" />}
      </Pressable>

      {expanded && (
        <View className="bg-surface rounded-xl p-3 mt-1">
          {mf.tam && (
            <View className="mb-2">
              <Text className="text-text-muted text-xs mb-1">전체 시장 규모 (TAM)</Text>
              <Text className="text-text text-sm font-semibold">{mf.tam}</Text>
            </View>
          )}
          {mf.differentiation && (
            <View className="mb-2">
              <Text className="text-text-muted text-xs mb-1">차별화 포인트</Text>
              <Text className="text-text text-sm">{mf.differentiation}</Text>
            </View>
          )}
          {mf.revenueModel && (
            <View className="mb-2">
              <Text className="text-text-muted text-xs mb-1">수익 모델</Text>
              <Text className="text-text text-sm">{mf.revenueModel}</Text>
            </View>
          )}
          {mf.competitors?.length > 0 && (
            <View>
              <Text className="text-text-muted text-xs mb-1">경쟁자</Text>
              <View className="flex-row flex-wrap gap-1">
                {mf.competitors.map((c, i) => (
                  <View key={i} className="bg-card px-2 py-0.5 rounded">
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
  const [expanded, setExpanded] = useState(rank === 1); // 1위 기본 펼침

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((p) => !p);
  };

  const handleShare = () => {
    const text = `💡 ${idea.concept_name}\n\n${idea.narrative ?? idea.description ?? ''}\n\n첫 단계: ${idea.first_step ?? ''}`;
    Share.share({ message: text, title: idea.concept_name });
  };

  const totalScore = idea.total_score ?? 0;

  return (
    <View className="bg-card rounded-2xl mx-4 mb-3 overflow-hidden">
      {/* Header */}
      <Pressable onPress={toggle} className="p-4 active:opacity-80">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            <View className="w-7 h-7 rounded-full bg-primary items-center justify-center">
              <Text className="text-white text-xs font-bold">{rank}</Text>
            </View>
            <Text className="text-text font-bold text-base flex-1" numberOfLines={2}>
              {idea.concept_name}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Pressable onPress={handleShare} className="p-1.5 rounded-full bg-surface active:opacity-70 mr-1">
              <Share2 size={14} color="#a0a0a0" />
            </Pressable>
            {expanded ? <ChevronUp size={16} color="#a0a0a0" /> : <ChevronDown size={16} color="#a0a0a0" />}
          </View>
        </View>

        {/* Problem Addressed */}
        {idea.problem_addressed && (
          <View className="flex-row items-start gap-1.5 mb-2">
            <Target size={12} color="#f59e0b" style={{ marginTop: 2 }} />
            <Text className="text-warning text-xs flex-1" numberOfLines={2}>{idea.problem_addressed}</Text>
          </View>
        )}

        {/* Score Summary */}
        <View className="flex-row items-center gap-2 mt-1">
          <View className="bg-primary/10 px-3 py-1 rounded-full">
            <Text className="text-primary text-xs font-bold">총점 {totalScore}/30</Text>
          </View>
          {idea.tags?.slice(0, 2).map((tag, i) => (
            <View key={i} className="bg-surface px-2 py-1 rounded-full">
              <Text className="text-text-dim text-xs">{tag}</Text>
            </View>
          ))}
        </View>
      </Pressable>

      {/* Expanded Content */}
      {expanded && (
        <View className="px-4 pb-4 border-t border-border">
          {/* Narrative */}
          {idea.narrative && (
            <View className="mt-3 mb-3">
              <Text className="text-text-muted text-xs uppercase tracking-wider mb-2">스토리</Text>
              <Text className="text-text text-sm leading-relaxed">{idea.narrative}</Text>
            </View>
          )}

          {/* Score Bars */}
          <View className="mb-3">
            <Text className="text-text-muted text-xs uppercase tracking-wider mb-2">평가 점수</Text>
            <ScoreBar label="실현가능성" score={idea.feasibility_score ?? 0} color="#e53935" />
            <ScoreBar label="참신성" score={idea.novelty_score ?? 0} color="#ff6b6b" />
            <ScoreBar label="임팩트" score={idea.impact_score ?? 0} color="#22c55e" />
          </View>

          {/* First Step */}
          {idea.first_step && (
            <View className="bg-success/10 rounded-xl p-3 mb-3">
              <Text className="text-success text-xs font-semibold mb-1">오늘 당장 시작하기</Text>
              <Text className="text-text text-sm leading-relaxed">{idea.first_step}</Text>
            </View>
          )}

          {/* Implementation Plan */}
          {idea.implementation_plan && (
            <View className="bg-surface rounded-xl p-3 mb-3">
              <Text className="text-text font-semibold text-sm mb-2">구현 로드맵</Text>
              {idea.implementation_plan.today && (
                <View className="mb-2">
                  <Text className="text-success text-xs font-semibold mb-1">오늘</Text>
                  <Text className="text-text text-xs leading-relaxed">{idea.implementation_plan.today}</Text>
                </View>
              )}
              {idea.implementation_plan.this_week && (
                <View className="mb-2">
                  <Text className="text-warning text-xs font-semibold mb-1">이번 주</Text>
                  <Text className="text-text text-xs leading-relaxed">{idea.implementation_plan.this_week}</Text>
                </View>
              )}
              {idea.implementation_plan.this_month && (
                <View>
                  <Text className="text-primary text-xs font-semibold mb-1">이번 달</Text>
                  <Text className="text-text text-xs leading-relaxed">{idea.implementation_plan.this_month}</Text>
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
            <View className="mb-3">
              <Text className="text-text-muted text-xs uppercase tracking-wider mb-2">핵심 혁신</Text>
              <Text className="text-text text-sm">{idea.key_innovation}</Text>
            </View>
          )}

          {/* Required Tech */}
          {idea.required_tech?.length > 0 && (
            <View>
              <Text className="text-text-muted text-xs uppercase tracking-wider mb-2">필요 기술</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {idea.required_tech.map((tech, i) => (
                  <View key={i} className="bg-primary/10 px-2.5 py-1 rounded-full">
                    <Text className="text-primary text-xs">{tech}</Text>
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
      <View className="px-4 pt-4 pb-2">
        <Text className="text-text text-2xl font-bold">시너지 랩</Text>
        <Text className="text-text-muted text-sm mt-1">
          {ideasData?.date ? `${ideasData.date} · ` : ''}AI × 학문 융합 아이디어
        </Text>
      </View>

      {/* Source Info */}
      {ideasData?.source_principle && (
        <View className="mx-4 mb-3 bg-accent/10 rounded-2xl px-4 py-3">
          <Text className="text-accent text-xs font-semibold mb-1">오늘의 학문 원리</Text>
          <Text className="text-text text-sm">{ideasData.source_principle}</Text>
        </View>
      )}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#e53935" />}
      >
        {loading ? (
          <>
            <IdeaCardSkeleton />
            <IdeaCardSkeleton />
            <IdeaCardSkeleton />
          </>
        ) : error ? (
          <View className="items-center justify-center py-20">
            <Text className="text-text-muted text-center">{error}</Text>
            <Pressable onPress={refresh} className="mt-4 px-6 py-2 bg-primary rounded-xl active:opacity-70">
              <Text className="text-white font-semibold">다시 시도</Text>
            </Pressable>
          </View>
        ) : ideas.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Lightbulb size={40} color="#6a6a6a" />
            <Text className="text-text-muted mt-4">아직 아이디어가 없어요</Text>
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
