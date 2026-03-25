/**
 * NotificationToggle — 알림 마스터 토글
 * ON: FCM/Expo 토큰 재등록, OFF: Firestore에서 토큰 제거
 * 기존 Notification 카드(per-type 토글)와 별도로 Settings 카드에 배치
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Switch } from 'react-native';
import { Bell } from 'lucide-react-native';
import { doc, updateDoc, deleteField, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

// expo-notifications 동적 로드
let Notifications: typeof import('expo-notifications') | null = null;
try { Notifications = require('expo-notifications'); } catch {}

interface NotificationToggleProps {
  /** 기존 useNotificationSettings와 별도로, 마스터 토글 상태를 Firestore users/{uid}에 저장 */
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export default function NotificationToggle({ enabled, onToggle }: NotificationToggleProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [toggling, setToggling] = useState(false);

  const handleToggle = useCallback(async (value: boolean) => {
    if (!user || toggling) return;
    setToggling(true);

    try {
      const userRef = doc(db, 'users', user.uid);

      if (value) {
        // 알림 ON: 토큰 재등록
        if (Notifications) {
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: 'bffbb3e7-cf38-4b39-ada3-e8fb04b51349',
          });
          const update: Record<string, unknown> = {
            expoPushToken: tokenData.data,
            notificationsEnabled: true,
          };

          if (Platform.OS === 'android') {
            try {
              const deviceToken = await Notifications.getDevicePushTokenAsync();
              update.fcmToken = deviceToken.data;
            } catch {}
          }

          await setDoc(userRef, update, { merge: true });
        } else {
          await setDoc(userRef, { notificationsEnabled: true }, { merge: true });
        }
      } else {
        // 알림 OFF: 토큰 삭제
        await updateDoc(userRef, {
          expoPushToken: deleteField(),
          fcmToken: deleteField(),
          notificationsEnabled: false,
        });
      }

      onToggle(value);
    } catch (error) {
      console.error('Notification toggle error:', error);
    } finally {
      setToggling(false);
    }
  }, [user, toggling, onToggle]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Bell size={20} color={colors.textSecondary} />
      <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>
        {t('profile.notifications_toggle')}
      </Text>
      <Switch
        value={enabled}
        onValueChange={handleToggle}
        disabled={toggling}
        trackColor={{ false: colors.border, true: colors.switchTrackActive }}
        thumbColor={enabled ? colors.primary : colors.textDim}
        accessibilityLabel={t('profile.notifications_toggle')}
      />
    </View>
  );
}
