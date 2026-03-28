/**
 * InteractiveSim — WebView wrapper for interactive principle simulations.
 *
 * Uses lazy import for react-native-webview to avoid crashes when the
 * native module isn't available (e.g. before dev client rebuild).
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { SIMULATIONS } from './simulations';

// Lazy-load WebView to avoid TurboModule crash when native module is missing
let WebViewComponent: any = null;
try {
  WebViewComponent = require('react-native-webview').WebView;
} catch {}

interface InteractiveSimProps {
  id: string;
}

export function InteractiveSim({ id }: InteractiveSimProps) {
  const { isDark, colors } = useTheme();
  const { lang } = useLanguage();
  const [height, setHeight] = useState(960);

  const simFactory = SIMULATIONS[id];

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height' && typeof data.value === 'number') {
        setHeight(Math.max(400, Math.min(1800, data.value)));
      }
    } catch {}
  }, []);

  if (!simFactory) {
    return null;
  }

  // WebView native module not available — show rebuild notice
  if (!WebViewComponent) {
    return (
      <View style={{
        marginVertical: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}>
        <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
          {lang === 'ko' ? '인터랙티브 시뮬레이터' : 'Interactive Simulator'}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
          {lang === 'ko'
            ? 'Dev client 재빌드가 필요합니다. (react-native-webview)'
            : 'Dev client rebuild required. (react-native-webview)'}
        </Text>
      </View>
    );
  }

  const html = simFactory(isDark, lang);

  return (
    <View style={{ marginVertical: 12 }}>
      <WebViewComponent
        originWhitelist={['*']}
        source={{ html }}
        style={{ height, backgroundColor: colors.bg }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        onMessage={onMessage}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
        nestedScrollEnabled={false}
      />
    </View>
  );
}

export default InteractiveSim;
