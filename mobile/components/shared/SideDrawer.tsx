import React from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { X, Newspaper, BookOpen, Lightbulb } from 'lucide-react-native';
import { useDrawer, DRAWER_WIDTH, type TabKey } from '@/context/DrawerContext';

// ─── 날짜 옵션 (최근 7일) ────────────────────────────────────────────────────
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

interface TabSection {
  key: TabKey;
  label: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
}

const TAB_SECTIONS: TabSection[] = [
  { key: 'news', label: 'AI 트렌드', Icon: Newspaper, color: '#E53935' },
  { key: 'snaps', label: '학문 스낵', Icon: BookOpen, color: '#3b82f6' },
  { key: 'ideas', label: '시너지 랩', Icon: Lightbulb, color: '#FB8C00' },
];

function TabDateSection({ section }: { section: TabSection }) {
  const { selectedDates, setTabDate, closeDrawer } = useDrawer();
  const selectedDate = selectedDates[section.key];
  const { Icon, color, label, key } = section;

  const handleSelect = (dateStr: string, isToday: boolean) => {
    setTabDate(key, isToday ? undefined : dateStr);
    closeDrawer();
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </View>
        <Text style={{ color: '#212121', fontSize: 14, fontWeight: '700' }}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {DATE_OPTIONS.map(({ dateStr, label: dateLabel, isToday }) => {
          const isSelected = isToday ? selectedDate === undefined : selectedDate === dateStr;
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

export function SideDrawer() {
  const { isOpen, closeDrawer, translateX, overlayOpacity } = useDrawer();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
          top: 0,
          left: 0,
          bottom: 0,
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
          {/* Drawer Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            <View>
              <Text style={{ color: '#212121', fontSize: 18, fontWeight: '800' }}>날짜 히스토리</Text>
              <Text style={{ color: '#BDBDBD', fontSize: 12, marginTop: 2 }}>탭별 날짜를 선택하세요</Text>
            </View>
            <Pressable
              onPress={closeDrawer}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0' }}
            >
              <X size={16} color="#757575" />
            </Pressable>
          </View>

          {/* Sections */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {TAB_SECTIONS.map((section) => (
              <TabDateSection key={section.key} section={section} />
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}
