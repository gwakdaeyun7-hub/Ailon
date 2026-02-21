import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Zap } from 'lucide-react-native';

export default function AuthScreen() {
  const { user, signInWithGoogle } = useAuth();
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
      setError('로그인에 실패했어요. 다시 시도해주세요.');
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
            AI 트렌드 / 학문 원리 / 융합 아이디어
          </Text>
        </View>
      </View>

      {/* Bottom white section */}
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-text text-xl font-bold mb-2 text-center">
          매일 새로운 인사이트를 발견하세요
        </Text>
        <Text className="text-text-muted text-sm text-center mb-10 leading-relaxed">
          AI 뉴스, 다양한 학문의 핵심 원리, 그리고{'\n'}AI와 학문이 만나는 융합 아이디어까지
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
              <Text style={{ color: '#212121', fontWeight: '600', fontSize: 16 }}>Google로 시작하기</Text>
            </>
          )}
        </Pressable>

        {error && (
          <View className="mt-4 bg-primary-light rounded-xl px-4 py-3">
            <Text className="text-danger text-sm text-center">{error}</Text>
          </View>
        )}

        <Text className="text-text-dim text-xs mt-10 text-center leading-relaxed">
          로그인하면 이용약관 및 개인정보처리방침에{'\n'}동의하는 것으로 간주됩니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}
