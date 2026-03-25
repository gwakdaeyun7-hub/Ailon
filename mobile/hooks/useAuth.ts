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
  updateProfile,
  deleteUser,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db, storage } from '@/lib/firebase';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

interface GoogleSignInModule {
  configure: (opts: { webClientId: string }) => void;
  hasPlayServices: () => Promise<void>;
  signIn: () => Promise<{ data?: { idToken?: string | null } | null } | null>;
  signOut: () => Promise<void>;
}

let GoogleSignin: GoogleSignInModule | null = null;
let statusCodes: Record<string, string> = {};

try {
  const mod = require('@react-native-google-signin/google-signin');
  GoogleSignin = mod.GoogleSignin;
  statusCodes = mod.statusCodes;
  GoogleSignin!.configure({ webClientId: WEB_CLIENT_ID });
} catch {
  console.warn('Google Sign-In native module not available (Expo Go?)');
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Firebase 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        setLoading(false);

        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);

          // 언어 설정 Firestore 동기화 (서버 측 이중언어 알림용)
          const savedLang = await AsyncStorage.getItem('ailon_language');
          const language = savedLang === 'en' ? 'en' : 'ko';

          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              language,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            });
          } else {
            await setDoc(userRef, { lastLoginAt: serverTimestamp(), language }, { merge: true });
          }
        }
      } catch (error: unknown) {
        console.error('Auth state change error:', error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!GoogleSignin) {
      Alert.alert('Notice', 'Google Sign-In is only available in development builds.');
      return;
    }
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      const idToken = response?.data?.idToken;
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      }
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled
      } else if (err.code === statusCodes.IN_PROGRESS) {
        // already in progress
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services is not available.');
      } else {
        console.error('Google sign-in error:', error);
        Alert.alert('Login Error', 'Please try again.');
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

  /**
   * 프로필 업데이트 (닉네임 + 프로필 사진)
   * Firebase Auth updateProfile + Firestore users/{uid} 동기화
   */
  const updateUserProfile = useCallback(async (updates: {
    displayName?: string;
    photoURI?: string; // 로컬 파일 URI (갤러리에서 선택한 이미지)
  }) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const uid = auth.currentUser.uid;
    const authUpdates: { displayName?: string; photoURL?: string } = {};
    const firestoreUpdates: Record<string, unknown> = {};

    // 닉네임 업데이트
    if (updates.displayName !== undefined) {
      authUpdates.displayName = updates.displayName;
      firestoreUpdates.displayName = updates.displayName;
    }

    // 프로필 사진 업데이트 (Storage 업로드)
    if (updates.photoURI) {
      const response = await fetch(updates.photoURI);
      const blob = await response.blob();
      const storageRef = ref(storage, `profile_photos/${uid}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      authUpdates.photoURL = downloadURL;
      firestoreUpdates.photoURL = downloadURL;
    }

    // Firebase Auth 프로필 업데이트
    if (Object.keys(authUpdates).length > 0) {
      await updateProfile(auth.currentUser, authUpdates);
    }

    // Firestore 동기화
    if (Object.keys(firestoreUpdates).length > 0) {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, firestoreUpdates, { merge: true });
    }

    // UI에 반영되도록 user 상태 갱신 (Auth의 currentUser를 다시 읽음)
    await auth.currentUser.reload();
    setUser({ ...auth.currentUser });
  }, []);

  /**
   * 계정 삭제: Firestore 데이터(bookmarks, preferences) + users/{uid} 삭제 → Auth 계정 삭제
   * read_history/{uid}/articles 서브컬렉션도 삭제
   */
  const deleteAccount = useCallback(async () => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const uid = auth.currentUser.uid;

    // 1. Firestore 서브컬렉션 삭제 (bookmarks, preferences)
    const subcollections = ['bookmarks', 'preferences'];
    for (const sub of subcollections) {
      const subRef = collection(db, 'users', uid, sub);
      const snap = await getDocs(subRef);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }

    // 2. read_history/{uid}/articles 서브컬렉션 삭제
    try {
      const readHistoryRef = collection(db, 'read_history', uid, 'articles');
      const readSnap = await getDocs(readHistoryRef);
      if (!readSnap.empty) {
        const batch = writeBatch(db);
        readSnap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      // 부모 문서 삭제 (존재할 경우)
      await deleteDoc(doc(db, 'read_history', uid)).catch(() => {});
    } catch {
      // read_history가 없을 수 있음
    }

    // 3. users/{uid} 문서 삭제
    await deleteDoc(doc(db, 'users', uid));

    // 4. Google Sign-In 연결 해제
    if (GoogleSignin) {
      try { await GoogleSignin.signOut(); } catch {}
    }

    // 5. Firebase Auth 계정 삭제
    await deleteUser(auth.currentUser);

    // 6. 로컬 상태 초기화
    setUser(null);
  }, []);

  return { user, loading, signInWithGoogle, signOut, updateUserProfile, deleteAccount };
}
