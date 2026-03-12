/**
 * AI Tools Hook - Firestore daily_tools/{date} 컬렉션
 * 날짜 네비게이션 + AsyncStorage 오프라인 캐시 (usePrinciple 패턴)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/lib/firebase';
import type { DailyTools } from '@/lib/types';

const CACHE_PREFIX = 'tools_cache_';

function getKSTDate(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

export function useTools() {
  const [toolsData, setToolsData] = useState<DailyTools | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(getKSTDate);
  const hasData = useRef(false);

  const fetchByDate = useCallback(async (dateStr: string) => {
    try {
      if (!hasData.current) setLoading(true);
      setError(null);

      const docRef = doc(db, 'daily_tools', dateStr);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as DailyTools;
        setToolsData(data);
        hasData.current = true;
        AsyncStorage.setItem(CACHE_PREFIX + dateStr, JSON.stringify(data)).catch(() => {});
        return;
      }

      // 해당 날짜 없으면 최신 문서 1개 fallback (오늘일 때만)
      if (dateStr === getKSTDate()) {
        const fallbackQuery = query(
          collection(db, 'daily_tools'),
          orderBy('date', 'desc'),
          limit(1)
        );
        const snapshot = await getDocs(fallbackQuery);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data() as DailyTools;
          setToolsData(data);
          hasData.current = true;
          setCurrentDate(data.date);
          AsyncStorage.setItem(CACHE_PREFIX + data.date, JSON.stringify(data)).catch(() => {});
          return;
        }
      }

      // No data - try cache
      const cached = await AsyncStorage.getItem(CACHE_PREFIX + dateStr);
      if (cached) {
        setToolsData(JSON.parse(cached));
        hasData.current = true;
        return;
      }

      setToolsData(null);
    } catch (err) {
      console.error('useTools error:', err);
      try {
        const cached = await AsyncStorage.getItem(CACHE_PREFIX + dateStr);
        if (cached) {
          setToolsData(JSON.parse(cached));
          hasData.current = true;
          return;
        }
      } catch {}
      setError('tools.connection_error');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => fetchByDate(currentDate), [fetchByDate, currentDate]);

  const goNext = useCallback(() => {
    const today = getKSTDate();
    const next = shiftDate(currentDate, 1);
    if (next <= today) setCurrentDate(next);
  }, [currentDate]);

  const goPrev = useCallback(() => {
    const minDate = shiftDate(getKSTDate(), -30);
    setCurrentDate(prev => {
      const next = shiftDate(prev, -1);
      return next >= minDate ? next : prev;
    });
  }, []);

  const canGoNext = currentDate < getKSTDate();
  const canGoPrev = currentDate > shiftDate(getKSTDate(), -30);

  useEffect(() => {
    fetchByDate(currentDate);
  }, [currentDate, fetchByDate]);

  return {
    toolsData,
    loading,
    error,
    refresh,
    currentDate,
    goNext,
    goPrev,
    canGoNext,
    canGoPrev,
  };
}
