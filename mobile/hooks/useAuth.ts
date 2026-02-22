/**
 * 사용자 인증 관리 Hook
 * 네이티브 Google Sign-In SDK 사용 (Android)
 * Expo Go에서는 로그인 불가 (네이티브 빌드 필요)
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
import { Alert } from 'react-native';
import { auth, db } from '@/lib/firebase';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

let GoogleSignin: any = null;
let statusCodes: any = {};

try {
  const mod = require('@react-native-google-signin/google-signin');
  GoogleSignin = mod.GoogleSignin;
  statusCodes = mod.statusCodes;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
} catch {
  console.warn('Google Sign-In native module not available (Expo Go?)');
}

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

  const signInWithGoogle = useCallback(async () => {
    if (!GoogleSignin) {
      Alert.alert('알림', '개발 빌드에서만 Google 로그인이 가능합니다.');
      return;
    }
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      const idToken = response.data?.idToken;
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // 사용자가 취소
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // 이미 진행 중
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('오류', 'Google Play 서비스를 사용할 수 없습니다.');
      } else {
        console.error('Google sign-in error:', error);
        Alert.alert('로그인 오류', '다시 시도해주세요.');
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (GoogleSignin) await GoogleSignin.signOut();
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  }, []);

  return { user, loading, signInWithGoogle, signOut };
}
