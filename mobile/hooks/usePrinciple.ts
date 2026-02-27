/**
 * 원리 데이터 Hook - Firestore daily_principles 컬렉션
 * 오늘 데이터 우선, 없으면 최신 문서 fallback
 */

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyPrinciples } from '@/lib/types';

export function usePrinciple() {
  const [principleData, setPrincipleData] = useState<DailyPrinciples | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrinciple = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPrincipleData(null);

      // 오늘 날짜로 먼저 시도 (가장 빠른 경로)
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'daily_principles', today);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPrincipleData(docSnap.data() as DailyPrinciples);
        return;
      }

      // 오늘 데이터 없으면 단일 쿼리로 최신 문서 1개 가져오기
      const fallbackQuery = query(
        collection(db, 'daily_principles'),
        orderBy('date', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(fallbackQuery);
      if (!snapshot.empty) {
        setPrincipleData(snapshot.docs[0].data() as DailyPrinciples);
      }
    } catch (err) {
      setError('principle.connection_error');
      console.error('usePrinciple error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrinciple();
  }, [fetchPrinciple]);

  return {
    principleData,
    loading,
    error,
    refresh: fetchPrinciple,
  };
}
