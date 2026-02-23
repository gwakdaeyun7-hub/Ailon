import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useDrawer, DRAWER_WIDTH } from '@/context/DrawerContext';
import { useLanguage } from '@/context/LanguageContext';

export function SideDrawer() {
  const { isOpen, closeDrawer, translateX, overlayOpacity } = useDrawer();
  const { t } = useLanguage();

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
            <Text style={{ color: '#212121', fontSize: 18, fontWeight: '800' }}>{t('drawer.title')}</Text>
            <Pressable
              onPress={closeDrawer}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0F0F0' }}
            >
              <X size={16} color="#757575" />
            </Pressable>
          </View>

          <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ color: '#757575', fontSize: 13, lineHeight: 20 }}>
              {t('drawer.desc')}
            </Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}
