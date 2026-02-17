/**
 * 학문 원리 데이터 Hook - Firestore daily_principles 컬렉션
 * targetDate: 특정 날짜 지정 가능 (히스토리 기능)
 * 
 * 새로운 구조: 단일 원리 (Foundation → Application → Integration)
 */

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyPrinciples, Principle } from '@/lib/types';

export function usePrinciples(targetDate?: string) {
  const [principlesData, setPrinciplesData] = useState<DailyPrinciples | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrinciples();
  }, [targetDate]);

  const fetchPrinciples = async () => {
    try {
      setLoading(true);
      setError(null);
      setPrinciplesData(null);

      if (targetDate) {
        const docRef = doc(db, 'daily_principles', targetDate);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPrinciplesData(docSnap.data() as DailyPrinciples);
        } else {
          setError('해당 날짜의 데이터가 없어요.');
        }
      } else {
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
      }
    } catch (err) {
      setError('학문 원리를 불러오는 데 실패했어요.');
      console.error('usePrinciples error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 단일 원리 (새로운 구조)
  const principle: Principle | null = principlesData?.principle ?? null;

  return {
    principlesData,
    principle,  // 단일 원리
    loading,
    error,
    refresh: fetchPrinciples,
  };
}
