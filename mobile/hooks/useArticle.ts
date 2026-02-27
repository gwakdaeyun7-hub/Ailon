/**
 * Article Hook - Firestore articles/{article_id} 컬렉션
 * useArticle: 개별 기사 fetch
 * useArticles: 배치 기사 fetch (30개씩 chunk)
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, getDocs, collection, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Article } from '@/lib/types';

export function useArticle(articleId: string | null) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!articleId) return;
    setLoading(true);
    getDoc(doc(db, 'articles', articleId))
      .then(snap => {
        if (snap.exists()) setArticle(snap.data() as Article);
      })
      .catch(e => console.error('useArticle error:', e))
      .finally(() => setLoading(false));
  }, [articleId]);

  return { article, loading };
}

export function useArticles(articleIds: string[]) {
  const [articles, setArticles] = useState<Record<string, Article>>({});
  const [loading, setLoading] = useState(false);

  // Stable key for dependency
  const idsKey = articleIds.join(',');

  const fetchArticles = useCallback(async () => {
    if (!articleIds || articleIds.length === 0) return;
    setLoading(true);
    try {
      const result: Record<string, Article> = {};
      // Firestore 'in' queries support max 30 items
      for (let i = 0; i < articleIds.length; i += 30) {
        const chunk = articleIds.slice(i, i + 30);
        const q = query(collection(db, 'articles'), where(documentId(), 'in', chunk));
        const snap = await getDocs(q);
        snap.forEach(d => { result[d.id] = d.data() as Article; });
      }
      setArticles(result);
    } catch (e) {
      console.error('useArticles error:', e);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  return { articles, loading };
}
