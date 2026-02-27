/**
 * 원리 데이터 Hook - Firestore daily_principles 컬렉션
 * 날짜 네비게이션 + AsyncStorage 오프라인 캐시 + SWR 패턴
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/lib/firebase';
import type { DailyPrinciples } from '@/lib/types';

const CACHE_PREFIX = 'principle_cache_';

/** KST(UTC+9) 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
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

export function usePrinciple() {
  const [principleData, setPrincipleData] = useState<DailyPrinciples | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(getKSTDate);
  const hasData = useRef(false);

  const fetchByDate = useCallback(async (dateStr: string) => {
    try {
      if (!hasData.current) setLoading(true);
      setError(null);

      const docRef = doc(db, 'daily_principles', dateStr);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as DailyPrinciples;
        setPrincipleData(data);
        hasData.current = true;
        AsyncStorage.setItem(CACHE_PREFIX + dateStr, JSON.stringify(data)).catch(() => {});
        return;
      }

      // 해당 날짜 데이터 없으면 최신 문서 1개 fallback (오늘 날짜일 때만)
      if (dateStr === getKSTDate()) {
        const fallbackQuery = query(
          collection(db, 'daily_principles'),
          orderBy('date', 'desc'),
          limit(1)
        );
        const snapshot = await getDocs(fallbackQuery);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data() as DailyPrinciples;
          setPrincipleData(data);
          hasData.current = true;
          setCurrentDate(data.date);
          AsyncStorage.setItem(CACHE_PREFIX + data.date, JSON.stringify(data)).catch(() => {});
          return;
        }
      }

      // No data found - try cache
      const cached = await AsyncStorage.getItem(CACHE_PREFIX + dateStr);
      if (cached) {
        setPrincipleData(JSON.parse(cached));
        hasData.current = true;
        return;
      }

      setPrincipleData(null);
    } catch (err) {
      console.error('usePrinciple error:', err);
      // Try offline cache on error
      try {
        const cached = await AsyncStorage.getItem(CACHE_PREFIX + dateStr);
        if (cached) {
          setPrincipleData(JSON.parse(cached));
          hasData.current = true;
          return;
        }
      } catch {}
      setError('principle.connection_error');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => fetchByDate(currentDate), [fetchByDate, currentDate]);

  const goNext = useCallback(() => {
    const today = getKSTDate();
    const next = shiftDate(currentDate, 1);
    if (next <= today) {
      setCurrentDate(next);
    }
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
    principleData,
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
