import React from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useDrawer, DRAWER_WIDTH, type TabKey } from '@/context/DrawerContext';
import { useRecentDisciplines } from '@/hooks/useRecentDisciplines';
import type { NewsCategory } from '@/lib/types';

// ─── 공통: 날짜 옵션 (최근 7일) ──────────────────────────────────────────────
const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const DATE_OPTIONS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  return {
    dateStr: d.toISOString().split('T')[0],
    label: i === 0 ? '오늘' : `${d.getMonth() + 1}/${d.getDate()}(${DAYS_KO[d.getDay()]})`,
    isToday: i === 0,
  };
});

// ─── 학문 분야별 색상 ─────────────────────────────────────────────────────────
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

function getDisciplineColor(name?: string): string {
  if (!name) return '#FF7043';
  return FIELD_COLORS[name] ?? '#FF7043';
}

// ─── NEWS 탭: 카테고리별 날짜 히스토리 ───────────────────────────────────────
const NEWS_CATEGORIES: { key: NewsCategory; label: string; color: string; emoji: string }[] = [
  { key: 'model_research',    label: '모델/연구',     color: '#F43F5E', emoji: '🔬' },
  { key: 'product_tools',     label: '제품/도구',     color: '#10B981', emoji: '🛠' },
  { key: 'industry_business', label: '산업/비즈니스', color: '#F59E0B', emoji: '📈' },
];

function NewsCategorySection({
  catKey, label, color, emoji,
}: {
  catKey: NewsCategory; label: string; color: string; emoji: string;
}) {
  const { selectedDates, newsCategory, setNewsCategory, setTabDate, closeDrawer } = useDrawer();
  const isCatActive = newsCategory === catKey;
  const selectedDate = selectedDates.news;

  const handleSelect = (dateStr: string, isToday: boolean) => {
    setNewsCategory(catKey);
    setTabDate('news', isToday ? undefined : dateStr);
    closeDrawer();
  };

  return (
    <View style={{ marginBottom: 24 }}>
      {/* 카테고리 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14 }}>{emoji}</Text>
        </View>
        <Text style={{ color: '#212121', fontSize: 14, fontWeight: '700' }}>{label}</Text>
        {isCatActive && (
          <View style={{ backgroundColor: `${color}18`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
            <Text style={{ color, fontSize: 11, fontWeight: '700' }}>선택 중</Text>
          </View>
        )}
      </View>

      {/* 날짜 필 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {DATE_OPTIONS.map(({ dateStr, label: dateLabel, isToday }) => {
          const isSelected = isCatActive && (isToday ? selectedDate === undefined : selectedDate === dateStr);
          return (
            <Pressable
              key={dateStr}
              onPress={() => handleSelect(dateStr, isToday)}
              style={{
                backgroundColor: isSelected ? color : '#FAFAFA',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isSelected ? color : '#F0F0F0',
              }}
            >
              <Text style={{ color: isSelected ? '#FFFFFF' : '#757575', fontSize: 12, fontWeight: isSelected ? '700' : '500' }}>
                {dateLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── SNAPS 탭: 날짜별 학문 히스토리 ─────────────────────────────────────────
function SnapsDrawerContent() {
  const { selectedDates, setTabDate, closeDrawer } = useDrawer();
  const { disciplines, loading } = useRecentDisciplines();
  const selectedDate = selectedDates.snaps;

  if (loading) {
    return (
      <View style={{ paddingVertical: 32, alignItems: 'center' }}>
        <ActivityIndicator color="#E53935" />
        <Text style={{ color: '#BDBDBD', fontSize: 13, marginTop: 10 }}>학문 데이터 불러오는 중...</Text>
      </View>
    );
  }

  if (disciplines.length === 0) {
    return (
      <View style={{ paddingVertical: 32, alignItems: 'center' }}>
        <Text style={{ color: '#BDBDBD', fontSize: 14 }}>최근 학문 데이터가 없어요</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={{ color: '#757575', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
        날짜별 학문
      </Text>
      {disciplines.map(({ date, name, superCategory, isToday }) => {
        const isSelected = isToday ? selectedDate === undefined : selectedDate === date;
        const displayDate = isToday
          ? '오늘'
          : (() => {
              const d = new Date(date + 'T00:00:00');
              return `${d.getMonth() + 1}/${d.getDate()}(${DAYS_KO[d.getDay()]})`;
            })();
        const disciplineColor = getDisciplineColor(superCategory ?? name);

        return (
          <Pressable
            key={date}
            onPress={() => {
              setTabDate('snaps', isToday ? undefined : date);
              closeDrawer();
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 14,
              marginBottom: 8,
              borderRadius: 14,
              backgroundColor: isSelected ? '#FFEBEE' : '#FAFAFA',
              borderWidth: 1,
              borderColor: isSelected ? '#FFCDD2' : '#F0F0F0',
            }}
          >
            <Text style={{ color: isSelected ? '#E53935' : '#757575', fontSize: 13, fontWeight: isSelected ? '700' : '500', minWidth: 64 }}>
              {displayDate}
            </Text>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: disciplineColor }} />
              <Text style={{ color: '#212121', fontSize: 13, fontWeight: '600' }}>{name}</Text>
              {superCategory && superCategory !== name && (
                <Text style={{ color: '#BDBDBD', fontSize: 12 }}>· {superCategory}</Text>
              )}
            </View>
            {isSelected && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── IDEAS 탭: 날짜별 히스토리 ───────────────────────────────────────────────
function IdeasDrawerContent() {
  const { selectedDates, setTabDate, closeDrawer } = useDrawer();
  const selectedDate = selectedDates.ideas;

  return (
    <View>
      <Text style={{ color: '#757575', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
        날짜 선택
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {DATE_OPTIONS.map(({ dateStr, label, isToday }) => {
          const isSelected = isToday ? selectedDate === undefined : selectedDate === dateStr;
          return (
            <Pressable
              key={dateStr}
              onPress={() => {
                setTabDate('ideas', isToday ? undefined : dateStr);
                closeDrawer();
              }}
              style={{
                backgroundColor: isSelected ? '#FB8C00' : '#FAFAFA',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isSelected ? '#FB8C00' : '#F0F0F0',
              }}
            >
              <Text style={{ color: isSelected ? '#FFFFFF' : '#757575', fontSize: 12, fontWeight: isSelected ? '700' : '500' }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── 드로어 헤더 텍스트 ───────────────────────────────────────────────────────
const DRAWER_HEADERS: Record<TabKey, { title: string; subtitle: string }> = {
  news:  { title: 'AI 트렌드 히스토리',  subtitle: '카테고리별 날짜를 선택하세요' },
  snaps: { title: '학문 스낵 히스토리',  subtitle: '날짜별 학문을 선택하세요' },
  ideas: { title: '시너지 랩 히스토리',  subtitle: '날짜를 선택하세요' },
};

// ─── 메인 드로어 컴포넌트 ─────────────────────────────────────────────────────
export function SideDrawer() {
  const { isOpen, closeDrawer, translateX, overlayOpacity, activeTab } = useDrawer();
  const header = DRAWER_HEADERS[activeTab];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          zIndex: 100,
          opacity: overlayOpacity,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={closeDrawer} />
      </Animated.View>

      {/* Drawer Panel */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0,
          width: DRAWER_WIDTH,
          backgroundColor: '#FFFFFF',
          zIndex: 101,
          transform: [{ translateX }],
          shadowColor: '#000',
          shadowOffset: { width: 4, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 20,
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            <View>
              <Text style={{ color: '#212121', fontSize: 18, fontWeight: '800' }}>{header.title}</Text>
              <Text style={{ color: '#BDBDBD', fontSize: 12, marginTop: 2 }}>{header.subtitle}</Text>
            </View>
            <Pressable
              onPress={closeDrawer}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0' }}
            >
              <X size={16} color="#757575" />
            </Pressable>
          </View>

          {/* Tab-specific content */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            {activeTab === 'news' && NEWS_CATEGORIES.map((cat) => (
              <NewsCategorySection
                key={cat.key}
                catKey={cat.key}
                label={cat.label}
                color={cat.color}
                emoji={cat.emoji}
              />
            ))}
            {activeTab === 'snaps' && <SnapsDrawerContent />}
            {activeTab === 'ideas' && <IdeasDrawerContent />}
            <View style={{ height: 20 }} />
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}
