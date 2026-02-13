/**
 * 학문 원리 데이터 Hook - Firestore daily_principles 컬렉션
 * frontend/lib/hooks/usePrinciples.ts와 동일한 쿼리 로직
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

      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'daily_principles', today);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setPrinciplesData(docSnap.data() as DailyPrinciples);
      } else {
        for (let i = 1; i <= 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const prevRef = doc(db, 'daily_principles', dateStr);
          const prevSnap = await getDoc(prevRef);
          if (prevSnap.exists()) {
            setPrinciplesData(prevSnap.data() as DailyPrinciples);
            break;
          }
        }
      }
    } catch (err) {
      setError('학문 원리를 불러오는 데 실패했어요.');
      console.error('usePrinciples error:', err);
    } finally {
      setLoading(false);
    }
  };

  const allPrinciples: Principle[] = principlesData?.principles ?? [];
  const todayPrinciple: Principle | null = principlesData?.today_principle ?? null;

  return {
    principlesData,
    allPrinciples,
    todayPrinciple,
    loading,
    error,
    refresh: fetchPrinciples,
  };
}
