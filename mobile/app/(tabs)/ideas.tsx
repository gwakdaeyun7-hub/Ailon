import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlaskConical } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';

export default function IdeasScreen() {
  const { t } = useLanguage();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#212121' }}>{t('ideas.title')}</Text>
        <View style={{ width: 40, height: 3, backgroundColor: '#E53935', borderRadius: 2, marginTop: 12 }} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#FFEBEE',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <FlaskConical size={28} color="#E53935" />
        </View>
        <Text style={{ color: '#212121', fontWeight: '700', fontSize: 16, marginBottom: 4 }}>
          {t('placeholder.preparing')}
        </Text>
        <Text style={{ color: '#757575', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
          {t('placeholder.preparing_desc')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
