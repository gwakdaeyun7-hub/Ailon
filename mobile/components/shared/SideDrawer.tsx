import React from 'react';
import { View, Text, Pressable, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useDrawer, DRAWER_WIDTH } from '@/context/DrawerContext';
import type { NewsCategory } from '@/lib/types';

const NEWS_CATEGORIES: { key: NewsCategory; label: string; color: string; emoji: string }[] = [
  { key: 'model_research',    label: '모델/연구',     color: '#F43F5E', emoji: '🔬' },
  { key: 'product_tools',     label: '제품/도구',     color: '#10B981', emoji: '🛠' },
  { key: 'industry_business', label: '산업/비즈니스', color: '#F59E0B', emoji: '📈' },
];

export function SideDrawer() {
  const { isOpen, closeDrawer, translateX, overlayOpacity, newsCategory, setNewsCategory } = useDrawer();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <Animated.View
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 100, opacity: overlayOpacity,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={closeDrawer} />
      </Animated.View>

      {/* Drawer Panel */}
      <Animated.View
        style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: DRAWER_WIDTH, backgroundColor: '#FFFFFF', zIndex: 101,
          transform: [{ translateX }],
          shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
          shadowOpacity: 0.15, shadowRadius: 20, elevation: 20,
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingVertical: 16,
            borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
          }}>
            <View>
              <Text style={{ color: '#212121', fontSize: 18, fontWeight: '800' }}>AI 뉴스</Text>
              <Text style={{ color: '#BDBDBD', fontSize: 12, marginTop: 2 }}>카테고리를 선택하세요</Text>
            </View>
            <Pressable
              onPress={closeDrawer}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0' }}
            >
              <X size={16} color="#757575" />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            <Text style={{ color: '#757575', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
              카테고리
            </Text>
            {NEWS_CATEGORIES.map(({ key, label, color, emoji }) => {
              const isActive = newsCategory === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => { setNewsCategory(key); closeDrawer(); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
                    borderRadius: 14,
                    backgroundColor: isActive ? `${color}12` : '#FAFAFA',
                    borderWidth: 1.5,
                    borderColor: isActive ? `${color}50` : '#F0F0F0',
                  }}
                >
                  <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: isActive ? `${color}20` : '#FFFFFF',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: isActive ? `${color}40` : '#F0F0F0',
                  }}>
                    <Text style={{ fontSize: 15 }}>{emoji}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: isActive ? '700' : '500', color: isActive ? color : '#212121' }}>
                    {label}
                  </Text>
                  {isActive && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}
