/**
 * Firebase 초기화 - React Native (AsyncStorage 퍼시스턴스)
 * 웹(Next.js)과의 차이: initializeAuth() + getReactNativePersistence(AsyncStorage)
 */

import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 중복 초기화 방지
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// React Native에서는 initializeAuth + AsyncStorage 퍼시스턴스 사용
// 웹의 getAuth()와 달리 로그인 상태를 AsyncStorage에 저장
let auth: ReturnType<typeof initializeAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // 이미 초기화된 경우
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
