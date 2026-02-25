/**
 * 기사 조회수 추적 Hook — Firestore article_views 컬렉션
 * 하루 1회만 증가 (AsyncStorage로 디바이스별 일일 중복 방지)
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/lib/firebase';

function makeSafeId(link: string): string {
  return encodeURIComponent(link).slice(0, 200);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useArticleViews(articleLink: string) {
  const [views, setViews] = useState(0);
  const docId = makeSafeId(articleLink);

  useEffect(() => {
    if (!articleLink) return;
    const ref = doc(db, 'article_views', docId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setViews((snap.data() as { views?: number }).views ?? 0);
      }
    }, (error) => {
      console.error('Article views snapshot error:', error);
    });
    return unsub;
  }, [docId, articleLink]);

  const trackView = useCallback(async () => {
    if (!articleLink) return;
    try {
      const key = `view_${todayStr()}_${docId}`;
      const already = await AsyncStorage.getItem(key);
      if (already) return;

      const ref = doc(db, 'article_views', docId);
      await setDoc(ref, { views: increment(1) }, { merge: true });
      await AsyncStorage.setItem(key, '1');
    } catch (err) {
      console.error('Track view error:', err);
    }
  }, [articleLink, docId]);

  return { views, trackView };
}
