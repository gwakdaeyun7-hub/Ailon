/**
 * 피드 카드용 일괄 좋아요수/뷰수 조회 Hook
 * getDoc 일괄 1회 조회 (리스너 폭발 방지)
 */

import { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
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

    const fetchStats = async () => {
      const newStats: Record<string, BatchStats> = {};

      await Promise.all(articleLinks.map(async (link) => {
        try {
          const encoded = encodeURIComponent(link).slice(0, 200);
          const reactionsId = `news_${encoded}`;
          const viewsId = encoded;

          const [reactionsSnap, viewsSnap] = await Promise.all([
            getDoc(doc(db, 'reactions', reactionsId)),
            getDoc(doc(db, 'article_views', viewsId)),
          ]);

          const likes = reactionsSnap.exists() ? (reactionsSnap.data()?.likes ?? 0) : 0;
          const views = viewsSnap.exists() ? (viewsSnap.data()?.views ?? 0) : 0;
          newStats[link] = { likes, views };
        } catch {
          newStats[link] = { likes: 0, views: 0 };
        }
      }));

      setStats(newStats);
    };

    fetchStats();
  }, [articleLinks]);

  return stats;
}
