/**
 * 학문 스낵 화면
 * - 날짜 이동: 사이드바 통해서만 (날짜 필 제거)
 * - 검색: 헤더 돋보기 버튼 → 검색바 토글
 * - 북마크: SnapCard에 BookmarkButton 추가
 * - 오늘의 원리 하이라이트 카드
 * - SnapCard 확장/축소: LayoutAnimation + ReactionBar
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  LayoutAnimation,
  Linking,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronDown, ChevronUp, ExternalLink, BookOpen, Sparkles, RefreshCw, Search, X, Menu } from 'lucide-react-native';
import { usePrinciples } from '@/hooks/usePrinciples';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useDrawer } from '@/context/DrawerContext';
import { BookmarkButton } from '@/components/shared/BookmarkButton';
import { SnapCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { ReactionBar } from '@/components/shared/ReactionBar';
import type { Principle, LearnMoreLink } from '@/lib/types';

const DIFFICULTY_LABELS = { beginner: '입문', intermediate: '중급', advanced: '심화' };
const DIFFICULTY_COLORS = { beginner: '#43A047', intermediate: '#FB8C00', advanced: '#E53935' };

const cardShadow = {
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
};

const FIELD_COLORS: Record<string, string> = {
  '수학': '#3b82f6',
  '물리학': '#8b5cf6',
  '생물학': '#43A047',
  '화학': '#FB8C00',
  '경제학': '#E53935',
  '심리학': '#ec4899',
  '철학': '#6366f1',
  '컴퓨터과학': '#06b6d4',
  '통계학': '#14b8a6',
};

function getFieldColor(field?: string): string {
  if (!field) return '#E53935';
  return FIELD_COLORS[field] ?? '#FF7043';
}

function LearnMoreLinkButton({ link }: { link: LearnMoreLink }) {
  const icon = link.type === 'youtube' ? '▶' : link.type === 'wikipedia' ? 'W' : '📄';
  const color = link.type === 'youtube' ? '#E53935' : link.type === 'wikipedia' ? '#3b82f6' : '#757575';
  return (
    <Pressable
      onPress={() => Linking.openURL(link.url)}
      className="active:opacity-70"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FAFAFA', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#F0F0F0' }}
    >
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{icon}</Text>
      <Text className="text-text-muted text-xs" numberOfLines={1} style={{ maxWidth: 180 }}>{link.title}</Text>
      <ExternalLink size={10} color="#BDBDBD" />
    </Pressable>
  );
}

// ─── 오늘의 원리 하이라이트 카드 ─────────────────────────────────────────────
function TodayPrincipleCard({ principle }: { principle: Principle }) {
  const fieldColor = getFieldColor(principle.superCategory);
  const diffColor = DIFFICULTY_COLORS[principle.difficulty ?? 'intermediate'];
  return (
    <View className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{ elevation: 5, shadowColor: fieldColor, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 10, borderWidth: 1, borderColor: '#F0F0F0' }}>
      <View style={{ backgroundColor: fieldColor, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Sparkles size={14} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>오늘의 원리</Text>
        {principle.superCategory && (
          <View style={{ marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>{principle.superCategory}</Text>
          </View>
        )}
      </View>
      <View className="bg-card p-4">
        {principle.hook && (
          <Text style={{ color: '#C62828', fontSize: 13, fontStyle: 'italic', lineHeight: 20, marginBottom: 8 }}>"{principle.hook}"</Text>
        )}
        <Text className="text-text font-bold" style={{ fontSize: 17, lineHeight: 25, marginBottom: 6 }}>{principle.title}</Text>
        <Text className="text-text-muted text-sm" style={{ lineHeight: 20 }} numberOfLines={3}>
          {principle.simpleSummary ?? principle.description}
        </Text>
        {principle.difficulty && (
          <View style={{ marginTop: 10, flexDirection: 'row' }}>
            <View style={{ backgroundColor: `${diffColor}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: diffColor, fontSize: 12, fontWeight: '600' }}>
                {DIFFICULTY_LABELS[principle.difficulty]}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── 스낵 카드 ────────────────────────────────────────────────────────────────
function SnapCard({
  principle, isBookmarked, onBookmark,
}: { principle: Principle; isBookmarked: boolean; onBookmark: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const diffColor = DIFFICULTY_COLORS[principle.difficulty ?? 'intermediate'];
  const fieldColor = getFieldColor(principle.superCategory);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View className="bg-card rounded-2xl mx-4 mb-3 overflow-hidden" style={cardShadow}>
      <View style={{ height: 4, backgroundColor: fieldColor }} />
      <Pressable onPress={toggle} className="p-4 active:opacity-80">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${fieldColor}15` }}>
              <Text style={{ color: fieldColor, fontSize: 12, fontWeight: '700' }}>{principle.superCategory ?? '학문'}</Text>
            </View>
            {principle.difficulty && (
              <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${diffColor}15` }}>
                <Text style={{ color: diffColor, fontSize: 12, fontWeight: '600' }}>{DIFFICULTY_LABELS[principle.difficulty]}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <BookmarkButton isBookmarked={isBookmarked} onToggle={onBookmark} size={16} />
            <Pressable onPress={toggle} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center' }}>
              {expanded ? <ChevronUp size={16} color="#757575" /> : <ChevronDown size={16} color="#757575" />}
            </Pressable>
          </View>
        </View>
        {principle.hook && (
          <View className="bg-primary-light rounded-xl px-3 py-3 mb-3" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Sparkles size={14} color="#E53935" style={{ marginTop: 2 }} />
            <Text style={{ color: '#C62828', fontSize: 13, fontStyle: 'italic', flex: 1, lineHeight: 20 }} numberOfLines={expanded ? undefined : 2}>
              {principle.hook}
            </Text>
          </View>
        )}
        <Text className="text-text font-bold text-lg mb-1.5">{principle.title}</Text>
        <Text className="text-text-muted text-sm" style={{ lineHeight: 20 }} numberOfLines={expanded ? undefined : 2}>
          {principle.simpleSummary ?? principle.description}
        </Text>
      </Pressable>

      {expanded && (
        <View className="px-4 pb-4" style={{ borderTopWidth: 1, borderTopColor: '#F0F0F0' }}>
          <View className="mt-4 mb-4">
            <Text className="text-text-muted text-xs uppercase tracking-wider mb-2 font-semibold">상세 설명</Text>
            <Text className="text-text text-sm" style={{ lineHeight: 22 }}>{principle.explanation}</Text>
          </View>
          {principle.friendlyExplanation && (
            <View className="rounded-xl p-3 mb-4" style={{ backgroundColor: '#FFF3E0', borderWidth: 1, borderColor: '#FFE0B2' }}>
              <Text style={{ color: '#E65100', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>이렇게 생각해봐요</Text>
              <Text className="text-text text-sm" style={{ lineHeight: 22 }}>{principle.friendlyExplanation}</Text>
            </View>
          )}
          {principle.everydayAnalogy && !principle.friendlyExplanation && (
            <View className="rounded-xl p-3 mb-4" style={{ backgroundColor: '#FFF3E0', borderWidth: 1, borderColor: '#FFE0B2' }}>
              <Text style={{ color: '#E65100', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>일상 비유</Text>
              <Text className="text-text text-sm" style={{ lineHeight: 22 }}>{principle.everydayAnalogy}</Text>
            </View>
          )}
          {principle.aiRelevance && (
            <View className="bg-primary-light rounded-xl p-3 mb-4">
              <Text style={{ color: '#E53935', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>AI와의 연결</Text>
              <Text className="text-text text-sm" style={{ lineHeight: 22 }}>{principle.aiRelevance}</Text>
            </View>
          )}
          {principle.applicationIdeas?.length > 0 && (
            <View className="mb-4">
              <Text className="text-text-muted text-xs uppercase tracking-wider mb-2 font-semibold">AI 적용 아이디어</Text>
              {principle.applicationIdeas.map((idea, i) => (
                <View key={i} className="flex-row items-start gap-2 mb-2">
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF7043', marginTop: 6 }} />
                  <Text className="text-text text-sm flex-1" style={{ lineHeight: 22 }}>{idea}</Text>
                </View>
              ))}
            </View>
          )}
          {principle.realWorldExample && (
            <View className="mb-4">
              <Text className="text-text-muted text-xs uppercase tracking-wider mb-2 font-semibold">실생활 예시</Text>
              <Text className="text-text text-sm" style={{ lineHeight: 22 }}>{principle.realWorldExample}</Text>
            </View>
          )}
          {principle.learn_more_links && principle.learn_more_links.length > 0 && (
            <View className="mb-2">
              <Text className="text-text-muted text-xs uppercase tracking-wider mb-2 font-semibold">더 알아보기</Text>
              <View className="flex-row flex-wrap">
                {principle.learn_more_links.map((link, i) => <LearnMoreLinkButton key={i} link={link} />)}
              </View>
            </View>
          )}
          <ReactionBar
            itemType="snap"
            itemId={principle.title}
            shareText={`${principle.title}\n\n${principle.simpleSummary ?? principle.description ?? ''}`}
            shareTitle={principle.title}
          />
        </View>
      )}
    </View>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────
export default function SnapsScreen() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { selectedDates, openDrawer, setActiveTab } = useDrawer();
  const selectedDate = selectedDates.snaps;

  useFocusEffect(useCallback(() => {
    setActiveTab('snaps');
  }, [setActiveTab]));

  const { allPrinciples, principlesData, todayPrinciple, loading, error, refresh } = usePrinciples(selectedDate);
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks(user?.uid ?? null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // todayPrinciple이 있으면 목록에서 제외
  const basePrinciples = todayPrinciple
    ? allPrinciples.filter((p) => p.title !== todayPrinciple.title)
    : allPrinciples;

  // 검색 필터
  const displayPrinciples = searchQuery.trim()
    ? allPrinciples.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.simpleSummary ?? p.description).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.superCategory ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : basePrinciples;

  const fieldCount = new Set(allPrinciples.map((p) => p.superCategory).filter(Boolean)).size;

  const bookmarkMeta = (p: Principle) => ({
    title: p.title,
    subtitle: p.superCategory,
    category: p.difficulty,
  });

  // 선택된 날짜 표시
  const dateLabel = selectedDate
    ? new Date(selectedDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    : '오늘';

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-5 pb-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-text text-2xl font-bold">학문 스낵</Text>
            <Text className="text-text-muted text-sm mt-1">
              {principlesData?.date ? `${principlesData.date} · ` : `${dateLabel} · `}오늘의 학문 원리 {allPrinciples.length}개
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => { setShowSearch((s) => !s); setSearchQuery(''); }}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: showSearch ? '#FFEBEE' : '#FAFAFA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: showSearch ? '#FFCDD2' : '#F0F0F0' }}
            >
              <Search size={18} color={showSearch ? '#E53935' : '#757575'} />
            </Pressable>
            {fieldCount > 0 && (
              <View style={{ backgroundColor: '#FFEBEE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
                <Text style={{ color: '#E53935', fontSize: 12, fontWeight: '700' }}>{fieldCount}개 분야</Text>
              </View>
            )}
            {/* Hamburger → SideDrawer */}
            <Pressable
              onPress={openDrawer}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0' }}
            >
              <Menu size={20} color="#757575" />
            </Pressable>
          </View>
        </View>
        <View style={{ width: 40, height: 3, backgroundColor: '#E53935', borderRadius: 2, marginTop: 12 }} />
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: '#F0F0F0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}>
          <Search size={16} color="#BDBDBD" />
          <TextInput
            placeholder="원리 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            style={{ flex: 1, fontSize: 14, color: '#212121', paddingVertical: 0 }}
            placeholderTextColor="#BDBDBD"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}><X size={16} color="#BDBDBD" /></Pressable>
          )}
        </View>
      )}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E53935" />}
      >
        {/* Today's Highlight */}
        {!loading && !error && todayPrinciple && !searchQuery && (
          <TodayPrincipleCard principle={todayPrinciple} />
        )}

        {loading ? (
          <>
            <SnapCardSkeleton />
            <SnapCardSkeleton />
            <SnapCardSkeleton />
          </>
        ) : error ? (
          <View className="items-center justify-center py-20 px-8">
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <RefreshCw size={28} color="#E53935" />
            </View>
            <Text className="text-text font-semibold text-base mb-2">연결에 문제가 있어요</Text>
            <Text className="text-text-muted text-sm text-center mb-5" style={{ lineHeight: 20 }}>{error}</Text>
            <Pressable onPress={refresh} className="active:opacity-70" style={{ backgroundColor: '#E53935', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>다시 시도</Text>
            </Pressable>
          </View>
        ) : displayPrinciples.length === 0 ? (
          <View className="items-center justify-center py-20">
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <BookOpen size={28} color="#E53935" />
            </View>
            <Text className="text-text font-semibold text-base mb-1">
              {searchQuery ? `'${searchQuery}' 검색 결과가 없어요` : '아직 학문 스낵이 없어요'}
            </Text>
            <Text className="text-text-muted text-sm">
              {searchQuery ? '다른 키워드로 검색해보세요' : '잠시 후 다시 확인해보세요'}
            </Text>
          </View>
        ) : (
          displayPrinciples.map((principle, index) => (
            <SnapCard
              key={`${principle.title}-${index}`}
              principle={principle}
              isBookmarked={isBookmarked('snap', principle.title)}
              onBookmark={() => toggleBookmark('snap', principle.title, bookmarkMeta(principle))}
            />
          ))
        )}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
