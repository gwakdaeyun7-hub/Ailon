/**
 * 피드 카드용 일괄 좋아요수/뷰수 조회 Hook
 * reactions는 onSnapshot(실시간), views는 getDoc(1회)
 */

import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface BatchStats {
  likes: number;
  views: number;
}

export function useBatchStats(articleLinks: string[]): Record<string, BatchStats> {
  const [stats, setStats] = useState<Record<string, BatchStats>>({});
  const prevKey = useRef('');

  useEffect(() => {
    const key = JSON.stringify(articleLinks);
    if (key === prevKey.current || articleLinks.length === 0) return;
    prevKey.current = key;

    const result: Record<string, BatchStats> = {};
    const unsubs: (() => void)[] = [];

    // views는 1회 조회, reactions는 실시간 리스너
    articleLinks.forEach((link) => {
      const encoded = encodeURIComponent(link).slice(0, 200);
      const reactionsId = `news_${encoded}`;
      const viewsId = encoded;

      // views 1회 조회
      getDoc(doc(db, 'article_views', viewsId)).then((snap) => {
        const views = snap.exists() ? (snap.data()?.views ?? 0) : 0;
        setStats((prev) => ({
          ...prev,
          [link]: { likes: prev[link]?.likes ?? 0, views },
        }));
      }).catch(() => {});

      // reactions 실시간 리스너
      const unsub = onSnapshot(doc(db, 'reactions', reactionsId), (snap) => {
        const likes = snap.exists() ? (snap.data()?.likes ?? 0) : 0;
        setStats((prev) => ({
          ...prev,
          [link]: { likes, views: prev[link]?.views ?? 0 },
        }));
      });
      unsubs.push(unsub);
    });

    return () => { unsubs.forEach((u) => u()); };
  }, [articleLinks]);

  return stats;
}
