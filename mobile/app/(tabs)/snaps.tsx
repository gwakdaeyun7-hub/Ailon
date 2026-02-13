/**
 * 학문 스낵 화면
 * - "알고 계셨나요?" 스타일 hook 표시
 * - "~이에요/해요" 말투
 * - 카카오톡/넷플릭스/배달앱 비유 (friendlyExplanation)
 * - learn_more_links: Linking.openURL()
 * - SnapCard 확장/축소: LayoutAnimation
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
  Linking,
} from 'react-native';
import { ChevronDown, ChevronUp, ExternalLink, BookOpen, Sparkles } from 'lucide-react-native';
import { usePrinciples } from '@/hooks/usePrinciples';
import { SnapCardSkeleton } from '@/components/shared/LoadingSkeleton';
import type { Principle, LearnMoreLink } from '@/lib/types';

const DIFFICULTY_LABELS = { beginner: '입문', intermediate: '중급', advanced: '심화' };
const DIFFICULTY_COLORS = { beginner: '#22c55e', intermediate: '#f59e0b', advanced: '#ef4444' };

function LearnMoreLinkButton({ link }: { link: LearnMoreLink }) {
  const icon = link.type === 'youtube' ? '▶' : link.type === 'wikipedia' ? 'W' : '📄';
  const color = link.type === 'youtube' ? '#ef4444' : link.type === 'wikipedia' ? '#3b82f6' : '#888888';

  return (
    <Pressable
      onPress={() => Linking.openURL(link.url)}
      className="flex-row items-center gap-2 bg-surface rounded-xl px-3 py-2 mr-2 mb-2 active:opacity-70"
    >
      <Text style={{ color }} className="text-xs font-bold">{icon}</Text>
      <Text className="text-text-muted text-xs" numberOfLines={1} style={{ maxWidth: 180 }}>
        {link.title}
      </Text>
      <ExternalLink size={10} color="#555555" />
    </Pressable>
  );
}

function SnapCard({ principle }: { principle: Principle }) {
  const [expanded, setExpanded] = useState(false);
  const diffColor = DIFFICULTY_COLORS[principle.difficulty ?? 'intermediate'];

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View className="bg-card rounded-2xl mx-4 mb-3 overflow-hidden">
      {/* Card Header */}
      <Pressable onPress={toggle} className="p-4 active:opacity-80">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className="px-2.5 py-1 rounded-full bg-accent/20">
              <Text className="text-accent text-xs font-semibold">{principle.superCategory ?? '학문'}</Text>
            </View>
            {principle.difficulty && (
              <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${diffColor}20` }}>
                <Text style={{ color: diffColor }} className="text-xs font-medium">
                  {DIFFICULTY_LABELS[principle.difficulty]}
                </Text>
              </View>
            )}
          </View>
          {expanded ? (
            <ChevronUp size={16} color="#888888" />
          ) : (
            <ChevronDown size={16} color="#888888" />
          )}
        </View>

        {/* Hook (알고 계셨나요?) */}
        {principle.hook && (
          <View className="flex-row items-start gap-2 bg-accent/10 rounded-xl px-3 py-2 mb-3">
            <Sparkles size={14} color="#8b5cf6" style={{ marginTop: 2 }} />
            <Text className="text-accent text-sm flex-1 leading-relaxed italic" numberOfLines={expanded ? undefined : 2}>
              {principle.hook}
            </Text>
          </View>
        )}

        {/* Title */}
        <Text className="text-text font-bold text-lg mb-1">{principle.title}</Text>

        {/* Description (simpleSummary 또는 description) */}
        <Text className="text-text-muted text-sm leading-relaxed" numberOfLines={expanded ? undefined : 2}>
          {principle.simpleSummary ?? principle.description}
        </Text>
      </Pressable>

      {/* Expanded Content */}
      {expanded && (
        <View className="px-4 pb-4 border-t border-border">
          {/* Explanation */}
          <View className="mt-3 mb-3">
            <Text className="text-text-muted text-xs uppercase tracking-wider mb-2">상세 설명</Text>
            <Text className="text-text text-sm leading-relaxed">{principle.explanation}</Text>
          </View>

          {/* Friendly Explanation (카카오톡/넷플릭스 비유) */}
          {principle.friendlyExplanation && (
            <View className="bg-surface rounded-xl p-3 mb-3">
              <Text className="text-text-muted text-xs mb-1.5">💡 이렇게 생각해봐요</Text>
              <Text className="text-text text-sm leading-relaxed">{principle.friendlyExplanation}</Text>
            </View>
          )}

          {/* Everyday Analogy */}
          {principle.everydayAnalogy && !principle.friendlyExplanation && (
            <View className="bg-surface rounded-xl p-3 mb-3">
              <Text className="text-text-muted text-xs mb-1.5">일상 비유</Text>
              <Text className="text-text text-sm leading-relaxed">{principle.everydayAnalogy}</Text>
            </View>
          )}

          {/* AI Relevance */}
          {principle.aiRelevance && (
            <View className="bg-primary/10 rounded-xl p-3 mb-3">
              <Text className="text-primary text-xs font-semibold mb-1.5">AI와의 연결</Text>
              <Text className="text-text text-sm leading-relaxed">{principle.aiRelevance}</Text>
            </View>
          )}

          {/* Application Ideas */}
          {principle.applicationIdeas?.length > 0 && (
            <View className="mb-3">
              <Text className="text-text-muted text-xs uppercase tracking-wider mb-2">AI 적용 아이디어</Text>
              {principle.applicationIdeas.map((idea, i) => (
                <View key={i} className="flex-row items-start gap-2 mb-1.5">
                  <Text className="text-accent text-sm">•</Text>
                  <Text className="text-text text-sm flex-1 leading-relaxed">{idea}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Real World Example */}
          {principle.realWorldExample && (
            <View className="mb-3">
              <Text className="text-text-muted text-xs uppercase tracking-wider mb-2">실생활 예시</Text>
              <Text className="text-text text-sm leading-relaxed">{principle.realWorldExample}</Text>
            </View>
          )}

          {/* Learn More Links */}
          {principle.learn_more_links && principle.learn_more_links.length > 0 && (
            <View>
              <Text className="text-text-muted text-xs uppercase tracking-wider mb-2">더 알아보기</Text>
              <View className="flex-row flex-wrap">
                {principle.learn_more_links.map((link, i) => (
                  <LearnMoreLinkButton key={i} link={link} />
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function SnapsScreen() {
  const { allPrinciples, principlesData, loading, error, refresh } = usePrinciples();
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
        <Text className="text-text text-2xl font-bold">학문 스낵</Text>
        <Text className="text-text-muted text-sm mt-1">
          {principlesData?.date ? `${principlesData.date} · ` : ''}
          오늘의 학문 원리 {allPrinciples.length}개
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
      >
        {loading ? (
          <>
            <SnapCardSkeleton />
            <SnapCardSkeleton />
            <SnapCardSkeleton />
          </>
        ) : error ? (
          <View className="items-center justify-center py-20">
            <Text className="text-text-muted text-center">{error}</Text>
            <Pressable onPress={refresh} className="mt-4 px-6 py-2 bg-primary rounded-xl active:opacity-70">
              <Text className="text-white font-semibold">다시 시도</Text>
            </Pressable>
          </View>
        ) : allPrinciples.length === 0 ? (
          <View className="items-center justify-center py-20">
            <BookOpen size={40} color="#555555" />
            <Text className="text-text-muted mt-4">아직 학문 스낵이 없어요</Text>
          </View>
        ) : (
          allPrinciples.map((principle, index) => (
            <SnapCard key={`${principle.title}-${index}`} principle={principle} />
          ))
        )}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
