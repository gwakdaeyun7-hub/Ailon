/**
 * 사용자 인증 관리 Hook
 * Expo Go 호환: 시스템 Chrome 브라우저로 Google OAuth 처리
 */

import { useEffect, useState, useCallback } from 'react';
import {
  User,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Alert, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { auth, db } from '@/lib/firebase';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '__missing__';
const GOOGLE_AUTH_READY = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID != null;
const REDIRECT_URI = 'https://auth.expo.io/@skhiancgo/ailon';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  // 딥링크로 돌아온 OAuth 응답 처리
  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      const url = event.url;
      if (!url) return;

      // URL fragment에서 id_token 추출
      const hash = url.split('#')[1];
      if (!hash) return;

      const params = new URLSearchParams(hash);
      const idToken = params.get('id_token');
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        signInWithCredential(auth, credential).catch((err) =>
          console.error('signInWithCredential error:', err)
        );
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!GOOGLE_AUTH_READY) {
      Alert.alert(
        'Google 로그인 설정 필요',
        '.env 파일에 EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID를 추가해주세요.',
      );
      return;
    }

    const nonce = Math.random().toString(36).substring(2, 15);
    const params = new URLSearchParams({
      client_id: WEB_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'id_token',
      scope: 'openid profile email',
      nonce,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Chrome Custom Tab으로 열기 (ephemeral = 깨끗한 세션)
    const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI, {
      preferEphemeralSession: true,
      showInRecents: true,
    });

    if (result.type === 'success' && result.url) {
      const hash = result.url.split('#')[1] || '';
      const fragment = new URLSearchParams(hash);
      const idToken = fragment.get('id_token');
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  }, []);

  return { user, loading, signInWithGoogle, signOut };
}
