/**
 * 뉴스 데이터 관리 Hook - 에이전트 팀 결과 지원
 */

'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyNews, Article, HorizontalArticle } from '@/lib/types';

export function useNews() {
  const [news, setNews] = useState<Article[]>([]);
  const [dailyOverview, setDailyOverview] = useState<string>('');
  const [highlight, setHighlight] = useState<Article | null>(null);
  const [themes, setThemes] = useState<string[]>([]);
  const [horizontalSections, setHorizontalSections] = useState<DailyNews['horizontal_sections']>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        let data: DailyNews | null = null;

        // 최근 7일 동안 데이터 찾기
        for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
          const date = new Date(Date.now() - daysAgo * 86400000)
            .toISOString()
            .split('T')[0];

          const newsRef = doc(db, 'daily_news', date);
          const newsDoc = await getDoc(newsRef);

          if (newsDoc.exists()) {
            data = newsDoc.data() as DailyNews;
            console.log(`📰 Found news data from ${date} (${daysAgo} days ago)`);
            break;
          }
        }

        if (data) {
          setNews(data.articles || []);
          setDailyOverview(data.daily_overview || '');
          setHighlight(data.highlight || null);
          setThemes(data.themes || []);
          setHorizontalSections(data.horizontal_sections || {});
        } else {
          console.warn('⚠️ No news data found in the last 7 days');
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

  return { news, dailyOverview, highlight, themes, horizontalSections, loading, error };
}
