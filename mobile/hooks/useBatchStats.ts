/**
 * 피드 카드용 일괄 좋아요수/뷰수 조회 Hook
 * 리스너 대신 getDoc 사용 → 리스너 폭발 방지
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

    let cancelled = false;

    (async () => {
      const result: Record<string, BatchStats> = {};

      await Promise.all(
        articleLinks.map(async (link) => {
          const encoded = encodeURIComponent(link).slice(0, 200);
          const reactionsId = `news_${encoded}`;
          const viewsId = encoded;

          const [reactSnap, viewsSnap] = await Promise.all([
            getDoc(doc(db, 'reactions', reactionsId)).catch(() => null),
            getDoc(doc(db, 'article_views', viewsId)).catch(() => null),
          ]);

          result[link] = {
            likes: reactSnap?.exists() ? (reactSnap.data()?.likes ?? 0) : 0,
            views: viewsSnap?.exists() ? (viewsSnap.data()?.views ?? 0) : 0,
          };
        })
      );

      if (!cancelled) setStats(result);
    })();

    return () => { cancelled = true; };
  }, [articleLinks]);

  return stats;
}
