/**
 * AI 뉴스 데이터 Hook - Firestore daily_news 컬렉션
 * 오늘 데이터 우선, 없으면 최근 7일 fallback
 */

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyNews } from '@/lib/types';

export function useNews() {
  const [newsData, setNewsData] = useState<DailyNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      setNewsData(null);

      // 오늘 날짜로 먼저 시도 (가장 빠른 경로)
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'daily_news', today);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setNewsData(docSnap.data() as DailyNews);
        return;
      }

      // 오늘 데이터 없으면 단일 쿼리로 최신 문서 1개 가져오기
      const fallbackQuery = query(
        collection(db, 'daily_news'),
        orderBy('date', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(fallbackQuery);
      if (!snapshot.empty) {
        setNewsData(snapshot.docs[0].data() as DailyNews);
      }
    } catch (err) {
      setError('뉴스를 불러오는 데 실패했어요.');
      console.error('useNews error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    newsData,
    loading,
    error,
    refresh: fetchNews,
  };
}
