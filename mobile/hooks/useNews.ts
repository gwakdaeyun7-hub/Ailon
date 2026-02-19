/**
 * AI 뉴스 데이터 Hook - Firestore daily_news 컬렉션
 * 오늘 데이터 우선, 없으면 최근 7일 fallback
 */

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyNews, Article, NewsCategory } from '@/lib/types';

export function useNews() {
  const [newsData, setNewsData] = useState<DailyNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      setNewsData(null);

      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'daily_news', today);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setNewsData(docSnap.data() as DailyNews);
        return;
      }

      // 오늘 데이터 없으면 최근 7일 fallback
      for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const prevSnap = await getDoc(doc(db, 'daily_news', dateStr));
        if (prevSnap.exists()) {
          setNewsData(prevSnap.data() as DailyNews);
          return;
        }
      }
    } catch (err) {
      setError('뉴스를 불러오는 데 실패했어요.');
      console.error('useNews error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles: Article[] = (newsData?.articles ?? []).filter((a) => {
    if (selectedCategory === 'all') return true;
    return a.category === selectedCategory;
  });

  return {
    newsData,
    filteredArticles,
    loading,
    error,
    selectedCategory,
    setSelectedCategory,
    refresh: fetchNews,
  };
}
