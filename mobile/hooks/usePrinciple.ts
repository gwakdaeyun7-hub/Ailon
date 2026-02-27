/**
 * 원리 데이터 Hook - Firestore daily_principles 컬렉션
 * 오늘 데이터 우선, 없으면 최신 문서 fallback
 * KST(UTC+9) 기준 날짜 사용, SWR 패턴 적용
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyPrinciples } from '@/lib/types';

/** KST(UTC+9) 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
function getKSTDate(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

export function usePrinciple() {
  const [principleData, setPrincipleData] = useState<DailyPrinciples | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasData = useRef(false);

  const fetchPrinciple = useCallback(async () => {
    try {
      // SWR: 데이터가 이미 있으면 loading 표시하지 않음 (새로고침 시 기존 데이터 유지)
      if (!hasData.current) setLoading(true);
      setError(null);

      // KST 기준 오늘 날짜로 먼저 시도 (가장 빠른 경로)
      const today = getKSTDate();
      const docRef = doc(db, 'daily_principles', today);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as DailyPrinciples;
        setPrincipleData(data);
        hasData.current = true;
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
        const data = snapshot.docs[0].data() as DailyPrinciples;
        setPrincipleData(data);
        hasData.current = true;
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
