import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Animated, Dimensions } from 'react-native';
export type TabKey = 'news' | 'snaps' | 'ideas';

interface DrawerContextValue {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  translateX: Animated.Value;
  overlayOpacity: Animated.Value;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.82, 320);
const ANIMATION_DURATION = 280;

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const [activeTab, setActiveTab] = useState<TabKey>('news');

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

  return (
    <DrawerContext.Provider
      value={{
        isOpen, openDrawer, closeDrawer, translateX, overlayOpacity,
        activeTab, setActiveTab,
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
