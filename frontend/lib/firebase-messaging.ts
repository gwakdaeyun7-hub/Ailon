/**
 * Firebase Cloud Messaging 설정
 * 푸시 알림 토큰 관리 및 알림 수신 처리
 */

import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import app from './firebase';

let messaging: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') return null;

  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch {
      console.warn('Firebase Messaging is not supported in this browser');
      return null;
    }
  }
  return messaging;
}

export async function requestNotificationPermission(): Promise<string | null> {
  const msg = getMessagingInstance();
  if (!msg) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('VAPID key not configured');
      return null;
    }

    const token = await getToken(msg, { vapidKey });
    return token;
  } catch (error) {
    console.error('Failed to get notification token:', error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  const msg = getMessagingInstance();
  if (!msg) return () => {};

  return onMessage(msg, callback);
}
