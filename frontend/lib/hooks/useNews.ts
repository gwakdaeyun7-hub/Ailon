/**
 * 뉴스 데이터 관리 Hook
 */

'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyNews, Article } from '@/lib/types';

export function useNews() {
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        // 오늘 날짜
        const today = new Date().toISOString().split('T')[0];

        // Firestore에서 오늘 뉴스 가져오기
        const newsRef = doc(db, 'daily_news', today);
        const newsDoc = await getDoc(newsRef);

        if (newsDoc.exists()) {
          const data = newsDoc.data() as DailyNews;
          setNews(data.articles || []);
        } else {
          // 오늘 뉴스가 없으면 어제 뉴스 가져오기
          const yesterday = new Date(Date.now() - 86400000)
            .toISOString()
            .split('T')[0];
          const yesterdayRef = doc(db, 'daily_news', yesterday);
          const yesterdayDoc = await getDoc(yesterdayRef);

          if (yesterdayDoc.exists()) {
            const data = yesterdayDoc.data() as DailyNews;
            setNews(data.articles || []);
          } else {
            setNews([]);
          }
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('뉴스를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return { news, loading, error };
}
