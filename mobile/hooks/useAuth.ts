/**
 * 사용자 인증 관리 Hook
 * Expo Go 호환: expo-web-browser OAuth 방식 사용
 * APK 빌드: 동일 코드 동작 (expo-web-browser는 네이티브 빌드에서도 작동)
 */

import { useEffect, useState } from 'react';
import {
  User,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { auth, db } from '@/lib/firebase';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth 클라이언트 ID가 설정되지 않은 경우 placeholder로 크래시 방지
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '__missing__';
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_AUTH_READY = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID != null;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [_request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
  });

  // Firebase 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          });
        } else {
          await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Google OAuth 응답 처리
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).catch((err) =>
        console.error('signInWithCredential error:', err)
      );
    }
  }, [response]);

  // expo-web-browser OAuth 방식 (Expo Go + 네이티브 빌드 모두 호환)
  const signInWithGoogle = async () => {
    if (!GOOGLE_AUTH_READY) {
      Alert.alert(
        'Google 로그인 설정 필요',
        '.env 파일에 EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID를 추가해주세요.',
      );
      return;
    }
    await promptAsync();
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  return { user, loading, signInWithGoogle, signOut };
}
