import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Animated, Dimensions } from 'react-native';
import type { NewsCategory } from '@/lib/types';

export type TabKey = 'news' | 'snaps' | 'ideas';

interface DrawerContextValue {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  translateX: Animated.Value;
  overlayOpacity: Animated.Value;
  /** 현재 포커스된 탭 (드로어 콘텐츠 결정) */
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  /** 탭별 선택 날짜 */
  selectedDates: Record<TabKey, string | undefined>;
  setTabDate: (tab: TabKey, date: string | undefined) => void;
  /** 뉴스 탭 선택 카테고리 (context로 관리하여 드로어와 동기화) */
  newsCategory: NewsCategory;
  setNewsCategory: (cat: NewsCategory) => void;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.82, 320);
const ANIMATION_DURATION = 280;

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const [activeTab, setActiveTab] = useState<TabKey>('news');
  const [newsCategory, setNewsCategory] = useState<NewsCategory>('core_tech');

  const [selectedDates, setSelectedDates] = useState<Record<TabKey, string | undefined>>({
    news: undefined,
    snaps: undefined,
    ideas: undefined,
  });

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateX, overlayOpacity]);

  const closeDrawer = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -DRAWER_WIDTH,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => setIsOpen(false));
  }, [translateX, overlayOpacity]);

  const setTabDate = useCallback((tab: TabKey, date: string | undefined) => {
    setSelectedDates((prev) => ({ ...prev, [tab]: date }));
  }, []);

  return (
    <DrawerContext.Provider
      value={{
        isOpen, openDrawer, closeDrawer, translateX, overlayOpacity,
        activeTab, setActiveTab,
        selectedDates, setTabDate,
        newsCategory, setNewsCategory,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error('useDrawer must be used within DrawerProvider');
  return ctx;
}

export { DRAWER_WIDTH };
