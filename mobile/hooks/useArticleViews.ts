/**
 * 기사 조회수 추적 Hook — Firestore article_views 컬렉션
 * 클릭 시 increment, 실시간 구독
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function makeSafeId(link: string): string {
  return encodeURIComponent(link).slice(0, 200);
}

export function useArticleViews(articleLink: string) {
  const [views, setViews] = useState(0);
  const docId = makeSafeId(articleLink);

  useEffect(() => {
    if (!articleLink) return;
    const ref = doc(db, 'article_views', docId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setViews((snap.data() as any).views ?? 0);
      }
    });
    return unsub;
  }, [docId]);

  const trackView = useCallback(async () => {
    if (!articleLink) return;
    const ref = doc(db, 'article_views', docId);
    await setDoc(ref, { views: increment(1) }, { merge: true });
  }, [docId]);

  return { views, trackView };
}
