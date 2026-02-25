/**
 * 피드 카드용 일괄 좋아요수/뷰수 조회 Hook
 * getDoc 일괄 1회 조회 (리스너 폭발 방지)
 */

import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface BatchStats {
  likes: number;
  views: number;
  comments: number;
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

          const commentsId = `news_${encoded}`;

          const [reactionsSnap, viewsSnap, commentsSnap] = await Promise.all([
            getDoc(doc(db, 'reactions', reactionsId)),
            getDoc(doc(db, 'article_views', viewsId)),
            getCountFromServer(collection(db, 'comments', commentsId, 'entries')),
          ]);

          const likes = reactionsSnap.exists() ? (reactionsSnap.data()?.likes ?? 0) : 0;
          const views = viewsSnap.exists() ? (viewsSnap.data()?.views ?? 0) : 0;
          const comments = commentsSnap.data().count;
          newStats[link] = { likes, views, comments };
        } catch {
          newStats[link] = { likes: 0, views: 0, comments: 0 };
        }
      }));

      setStats(newStats);
    };

    fetchStats();
  }, [articleLinks]);

  return stats;
}
