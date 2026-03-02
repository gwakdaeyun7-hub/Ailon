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

/**
 * 구 Firestore 데이터(keyIdea/principle/everydayAnalogy 등)를
 * 신 UI 구조(headline/body/analogy 등)로 정규화
 */
function normalizePrinciple(raw: any): DailyPrinciples {
  if (!raw?.principle) return raw;

  const p = raw.principle;
  const f = p.foundation;
  const a = p.application;
  const ig = p.integration;

  // Foundation: keyIdea → headline, principle → body, everydayAnalogy → analogy
  if (f && !f.headline && f.keyIdea) {
    f.headline = f.keyIdea;
    f.body = f.body || f.principle || f.description || '';
    f.analogy = f.analogy || f.everydayAnalogy || '';
    f.headline_en = f.headline_en || f.keyIdea_en;
    f.body_en = f.body_en || f.principle_en || f.description_en;
    f.analogy_en = f.analogy_en || f.everydayAnalogy_en;
  }

  // Application: description → headline, mechanism → body
  if (a && !a.headline && (a.description || a.mechanism)) {
    a.headline = a.description || '';
    a.body = a.body || a.mechanism || '';
    a.headline_en = a.headline_en || a.description_en;
    a.body_en = a.body_en || a.mechanism_en;
  }

  // Integration: problemSolved → headline, solution → body, realWorldImpact → impact
  if (ig && !ig.headline && (ig.problemSolved || ig.solution)) {
    ig.headline = ig.problemSolved || '';
    ig.body = ig.body || ig.solution || '';
    ig.impact = ig.impact || ig.realWorldImpact || '';
    ig.headline_en = ig.headline_en || ig.problemSolved_en;
    ig.body_en = ig.body_en || ig.solution_en;
    ig.impact_en = ig.impact_en || ig.realWorldImpact_en;
  }

  // DeepDive: foundation.deepDive → top-level deepDive
  if (!p.deepDive && f?.deepDive) {
    const dd = f.deepDive;
    p.deepDive = {
      history: dd.history || '',
      history_en: dd.history_en,
      mechanism: dd.mechanism || dd.coreMechanism || '',
      mechanism_en: dd.mechanism_en || dd.coreMechanism_en,
      formula: dd.formula || dd.coreFormula,
      formula_en: dd.formula_en || dd.coreFormula_en,
      modern: dd.modern || dd.modernRelevance || '',
      modern_en: dd.modern_en || dd.modernRelevance_en,
    };
  }

  return raw as DailyPrinciples;
}

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
        const data = normalizePrinciple(docSnap.data());
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
          const data = normalizePrinciple(snapshot.docs[0].data());
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
        setPrincipleData(normalizePrinciple(JSON.parse(cached)));
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
          setPrincipleData(normalizePrinciple(JSON.parse(cached)));
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
