/**
 * 푸시 알림 Hook — Expo Notifications
 * 토큰 등록, 포그라운드 알림 표시, 알림 탭 리스너, 로그아웃 시 토큰 삭제
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { doc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

// expo-notifications는 dev build에서만 동작 (Expo Go에서는 네이티브 모듈 없음)
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
} catch {
  console.warn('[useNotifications] expo-notifications not available (Expo Go?)');
}

// 포그라운드에서 알림 표시
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Android 채널 생성
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

async function registerForPushNotifications(uid: string) {
  if (!Notifications) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: 'bffbb3e7-cf38-4b39-ada3-e8fb04b51349',
  });

  await setDoc(
    doc(db, 'users', uid),
    { expoPushToken: tokenData.data },
    { merge: true },
  );
}

async function clearPushToken(uid: string) {
  try {
    await updateDoc(doc(db, 'users', uid), { expoPushToken: deleteField() });
  } catch {
    // 문서 없으면 무시
  }
}

function handleNotificationNavigation(
  response: any,
  navigate: (path: string) => void,
) {
  const data = response?.notification?.request?.content?.data;
  if (data?.tab) {
    navigate(`/(tabs)/${data.tab}`);
  }
}

export function useNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const prevUidRef = useRef<string | null>(null);

  // 토큰 등록 / 로그아웃 시 삭제
  useEffect(() => {
    if (user) {
      registerForPushNotifications(user.uid);
      prevUidRef.current = user.uid;
    } else if (prevUidRef.current) {
      clearPushToken(prevUidRef.current);
      prevUidRef.current = null;
    }
  }, [user]);

  // 알림 탭 리스너 (앱이 백그라운드에서 열릴 때)
  useEffect(() => {
    if (!Notifications) return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationNavigation(response, (path) => router.push(path as any));
    });
    return () => sub.remove();
  }, [router]);

  // 콜드 스타트 처리
  useEffect(() => {
    if (!Notifications) return;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationNavigation(response, (path) => router.push(path as any));
      }
    });
  }, [router]);
}
