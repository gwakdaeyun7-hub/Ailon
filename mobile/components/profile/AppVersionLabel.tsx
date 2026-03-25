/**
 * AppVersionLabel — 앱 버전 표시
 * 프로필 탭 최하단에 "AILON v1.0.0" 형태로 표시
 */

import React from 'react';
import { View, Text } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '@/context/ThemeContext';

export default function AppVersionLabel() {
  const { colors } = useTheme();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={{ alignItems: 'center', paddingVertical: 16, marginBottom: 16 }}>
      <Text style={{ color: colors.textDim, fontSize: 12, fontWeight: '400' }}>
        AILON v{version}
      </Text>
    </View>
  );
}
