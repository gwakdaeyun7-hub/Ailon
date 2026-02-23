import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { Zap } from 'lucide-react-native';

export default function AuthScreen() {
  const { user, signInWithGoogle } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 로그인 성공 시 자동 이동
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // OAuth는 비동기 — user 상태 변화로 자동 이동
    } catch (err: any) {
      setError(t('auth.login_failed'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Top gradient-like section */}
      <View
        style={{
          backgroundColor: '#E53935',
          paddingTop: 60,
          paddingBottom: 48,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          {/* Logo */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Zap size={40} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Text style={{ fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }}>
            Ailon
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 }}>
            {t('auth.tagline')}
          </Text>
        </View>
      </View>

      {/* Bottom white section */}
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-text text-xl font-bold mb-2 text-center">
          {t('auth.discover')}
        </Text>
        <Text className="text-text-muted text-sm text-center mb-10 leading-relaxed">
          {t('auth.discover_desc')}
        </Text>

        {/* Google Sign-In Button */}
        <Pressable
          onPress={handleGoogleSignIn}
          disabled={loading}
          className="w-full active:opacity-80"
          style={{
            backgroundColor: '#FFFFFF',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#F0F0F0',
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#E53935" />
          ) : (
            <>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#4285F4' }}>G</Text>
              <Text style={{ color: '#212121', fontWeight: '600', fontSize: 16 }}>{t('auth.google_start')}</Text>
            </>
          )}
        </Pressable>

        {error && (
          <View className="mt-4 bg-primary-light rounded-xl px-4 py-3">
            <Text className="text-danger text-sm text-center">{error}</Text>
          </View>
        )}

        <Text className="text-text-dim text-xs mt-10 text-center leading-relaxed">
          {t('auth.terms')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
