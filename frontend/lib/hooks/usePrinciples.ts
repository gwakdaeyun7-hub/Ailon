/**
 * 학문 원리 데이터 관리 Hook - 새로운 3단계 구조
 * daily_principles 컬렉션에서 단일 원리 (Foundation → Application → Integration)를 가져옵니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Principle, DailyPrinciples } from '@/lib/types';

export function usePrinciples() {
  const [principle, setPrinciple] = useState<Principle | null>(null);
  const [disciplineInfo, setDisciplineInfo] = useState<DailyPrinciples['discipline_info'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrinciple = async () => {
      try {
        setLoading(true);
        setError(null);

        // daily_principles에서 오늘 원리 가져오기
        const today = new Date().toISOString().split('T')[0];
        const dailyRef = doc(db, 'daily_principles', today);
        const dailyDoc = await getDoc(dailyRef);

        if (dailyDoc.exists()) {
          const data = dailyDoc.data() as DailyPrinciples;
          setPrinciple(data.principle || null);
          setDisciplineInfo(data.discipline_info || null);
          return;
        }

        // 최근 7일 폴백
        for (let i = 1; i <= 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const prevRef = doc(db, 'daily_principles', dateStr);
          const prevDoc = await getDoc(prevRef);

          if (prevDoc.exists()) {
            const data = prevDoc.data() as DailyPrinciples;
            setPrinciple(data.principle || null);
            setDisciplineInfo(data.discipline_info || null);
            return;
          }
        }

        setError('학문 데이터를 찾을 수 없습니다.');
      } catch (err) {
        console.error('Error fetching principle:', err);
        setError('학문 원리를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrinciple();
  }, []);

  return {
    principle,
    disciplineInfo,
    loading,
    error,
  };
}
