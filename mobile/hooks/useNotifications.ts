/**
 * 푸시 알림 Hook — Expo Notifications
 * - FCM 디바이스 토큰 + Expo 푸시 토큰 등록
 * - Android 알림 채널 분리 (news / social)
 * - 딥링크 네비게이션 (type + articleId)
 * - 로그아웃 시 토큰 삭제
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

  // Android 채널: 뉴스 / 소셜
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('news', {
      name: 'News Alerts',
      description: 'Daily AI news updates with highlights',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
    Notifications.setNotificationChannelAsync('social', {
      name: 'Comments & Likes',
      description: 'Comment replies and likes on your content',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
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

  // Expo Push Token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: 'bffbb3e7-cf38-4b39-ada3-e8fb04b51349',
  });

  // FCM 디바이스 토큰 (Android — 리치 알림 이미지 지원)
  let fcmToken: string | null = null;
  if (Platform.OS === 'android') {
    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      fcmToken = deviceToken.data as string;
    } catch {
      // dev build에서만 동작
    }
  }

  const update: Record<string, any> = { expoPushToken: tokenData.data };
  if (fcmToken) update.fcmToken = fcmToken;

  await setDoc(doc(db, 'users', uid), update, { merge: true });
}

async function clearPushToken(uid: string) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      expoPushToken: deleteField(),
      fcmToken: deleteField(),
    });
  } catch {
    // 문서 없으면 무시
  }
}

function handleNotificationNavigation(
  response: any,
  navigate: (path: string) => void,
) {
  const data = response?.notification?.request?.content?.data;
  // articleId가 있으면 추후 기사 상세 딥링크에 활용 가능
  // 현재는 해당 탭으로 이동
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
