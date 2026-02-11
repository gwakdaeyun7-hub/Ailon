/**
 * 뉴스 데이터 관리 Hook - 에이전트 팀 결과 지원
 */

'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyNews, Article } from '@/lib/types';

export function useNews() {
  const [news, setNews] = useState<Article[]>([]);
  const [dailyOverview, setDailyOverview] = useState<string>('');
  const [highlight, setHighlight] = useState<Article | null>(null);
  const [themes, setThemes] = useState<string[]>([]);
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

        let data: DailyNews | null = null;

        if (newsDoc.exists()) {
          data = newsDoc.data() as DailyNews;
        } else {
          // 오늘 뉴스가 없으면 어제 뉴스 가져오기
          const yesterday = new Date(Date.now() - 86400000)
            .toISOString()
            .split('T')[0];
          const yesterdayRef = doc(db, 'daily_news', yesterday);
          const yesterdayDoc = await getDoc(yesterdayRef);

          if (yesterdayDoc.exists()) {
            data = yesterdayDoc.data() as DailyNews;
          }
        }

        if (data) {
          setNews(data.articles || []);
          setDailyOverview(data.daily_overview || '');
          setHighlight(data.highlight || null);
          setThemes(data.themes || []);
        } else {
          setNews([]);
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

  return { news, dailyOverview, highlight, themes, loading, error };
}
