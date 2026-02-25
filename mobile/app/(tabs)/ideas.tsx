import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlaskConical } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { Colors } from '@/lib/colors';

export default function IdeasScreen() {
  const { t } = useLanguage();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.textPrimary }}>{t('ideas.title')}</Text>
        <View style={{ width: 40, height: 3, backgroundColor: Colors.primary, borderRadius: 2, marginTop: 12 }} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: Colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <FlaskConical size={28} color={Colors.primary} />
        </View>
        <Text style={{ color: Colors.textPrimary, fontWeight: '700', fontSize: 16, marginBottom: 4 }}>
          {t('placeholder.preparing')}
        </Text>
        <Text style={{ color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
          {t('placeholder.preparing_desc')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
