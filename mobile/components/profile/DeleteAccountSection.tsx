/**
 * DeleteAccountSection — 계정 삭제 버튼 + 확인 모달
 * profile.tsx 하단에 배치, 빨간 텍스트 경고
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';

export default function DeleteAccountSection() {
  const { deleteAccount } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(() => {
    Alert.alert(
      t('profile.delete_account'),
      t('profile.delete_confirm'),
      [
        { text: t('profile.delete_cancel'), style: 'cancel' },
        {
          text: t('profile.delete_action'),
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
              // 삭제 후 auth 화면으로 이동
              router.replace('/auth');
            } catch (error: unknown) {
              const err = error as { code?: string };
              if (err.code === 'auth/requires-recent-login') {
                Alert.alert(t('profile.error'), t('profile.delete_reauth'));
              } else {
                Alert.alert(t('profile.error'), t('profile.delete_error'));
              }
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }, [deleteAccount, t, router]);

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
      <Pressable
        onPress={handleDelete}
        disabled={deleting}
        accessibilityRole="button"
        accessibilityLabel={t('profile.delete_account')}
        style={{
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 44,
          opacity: deleting ? 0.5 : 1,
        }}
      >
        {deleting ? (
          <ActivityIndicator size="small" color={colors.errorColor} />
        ) : (
          <>
            <Trash2 size={16} color={colors.errorColor} />
            <Text style={{ color: colors.errorColor, fontSize: 14, fontWeight: '600' }}>
              {t('profile.delete_account')}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
