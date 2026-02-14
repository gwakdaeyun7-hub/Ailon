/**
 * AI 뉴스 데이터 Hook - Firestore daily_news 컬렉션
 * targetDate: 특정 날짜 지정 가능 (히스토리 기능)
 */

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyNews, Article, NewsCategory } from '@/lib/types';

export function useNews(targetDate?: string) {
  const [newsData, setNewsData] = useState<DailyNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all');

  useEffect(() => {
    fetchNews();
  }, [targetDate]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      setNewsData(null);

      if (targetDate) {
        // 특정 날짜 조회 (히스토리)
        const docRef = doc(db, 'daily_news', targetDate);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNewsData(docSnap.data() as DailyNews);
        } else {
          setError('해당 날짜의 데이터가 없어요.');
        }
      } else {
        // 오늘 + 최근 7일 fallback
        const today = new Date().toISOString().split('T')[0];
        const docRef = doc(db, 'daily_news', today);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNewsData(docSnap.data() as DailyNews);
        } else {
          for (let i = 1; i <= 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const prevRef = doc(db, 'daily_news', dateStr);
            const prevSnap = await getDoc(prevRef);
            if (prevSnap.exists()) {
              setNewsData(prevSnap.data() as DailyNews);
              break;
            }
          }
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
