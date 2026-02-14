import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, SafeAreaView, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AuthScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (err: any) {
      setError('로그인에 실패했어요. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        {/* Logo */}
        <View className="w-20 h-20 rounded-3xl bg-primary/20 items-center justify-center mb-6">
          <Text className="text-4xl">🧠</Text>
        </View>

        <Text className="text-3xl font-bold text-text mb-2">Ailon</Text>
        <Text className="text-text-muted text-center text-base mb-12 leading-relaxed">
          AI 트렌드 · 학문 원리 · 융합 아이디어{'\n'}매일 새로운 인사이트를 발견하세요
        </Text>

        {/* Google Sign-In Button */}
        <Pressable
          onPress={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white flex-row items-center justify-center gap-3 py-4 px-6 rounded-2xl active:opacity-80"
        >
          {loading ? (
            <ActivityIndicator color="#e53935" />
          ) : (
            <>
              <Text className="text-xl">G</Text>
              <Text className="text-gray-800 font-semibold text-base">Google로 시작하기</Text>
            </>
          )}
        </Pressable>

        {error && (
          <Text className="text-danger text-sm mt-4 text-center">{error}</Text>
        )}

        <Text className="text-text-dim text-xs mt-8 text-center leading-relaxed">
          로그인하면 이용약관 및 개인정보처리방침에{'\n'}동의하는 것으로 간주됩니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}
