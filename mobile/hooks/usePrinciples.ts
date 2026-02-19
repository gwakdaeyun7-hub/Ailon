/**
 * 학문 원리 데이터 Hook - Firestore daily_principles 컬렉션
 * 오늘 데이터 우선, 없으면 최근 7일 fallback
 */

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyPrinciples, Principle } from '@/lib/types';

export function usePrinciples() {
  const [principlesData, setPrinciplesData] = useState<DailyPrinciples | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrinciples();
  }, []);

  const fetchPrinciples = async () => {
    try {
      setLoading(true);
      setError(null);
      setPrinciplesData(null);

      const today = new Date().toISOString().split('T')[0];
      const docSnap = await getDoc(doc(db, 'daily_principles', today));
      if (docSnap.exists()) {
        setPrinciplesData(docSnap.data() as DailyPrinciples);
        return;
      }

      // 오늘 데이터 없으면 최근 7일 fallback
      for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const prevSnap = await getDoc(doc(db, 'daily_principles', dateStr));
        if (prevSnap.exists()) {
          setPrinciplesData(prevSnap.data() as DailyPrinciples);
          return;
        }
      }
    } catch (err) {
      setError('학문 원리를 불러오는 데 실패했어요.');
      console.error('usePrinciples error:', err);
    } finally {
      setLoading(false);
    }
  };

  const principle: Principle | null = principlesData?.principle ?? null;

  return {
    principlesData,
    principle,
    loading,
    error,
    refresh: fetchPrinciples,
  };
}
