/**
 * 학문 스냅 데이터 관리 Hook
 * daily_principles 컬렉션에서 학문 스냅 데이터를 가져옵니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Principle, DailyPrinciples } from '@/lib/types';

export function useAcademicSnaps() {
  const [snaps, setSnaps] = useState<Principle[]>([]);
  const [disciplineInfo, setDisciplineInfo] = useState<DailyPrinciples['discipline_info'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSnaps = async () => {
      try {
        setLoading(true);
        setError(null);

        const today = new Date().toISOString().split('T')[0];

        // Try today's data first
        const todayRef = doc(db, 'daily_principles', today);
        const todayDoc = await getDoc(todayRef);

        if (todayDoc.exists()) {
          const data = todayDoc.data() as DailyPrinciples;
          setSnaps(data.principles || []);
          setDisciplineInfo(data.discipline_info || null);
          return;
        }

        // Fallback to yesterday
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const yesterdayRef = doc(db, 'daily_principles', yesterday);
        const yesterdayDoc = await getDoc(yesterdayRef);

        if (yesterdayDoc.exists()) {
          const data = yesterdayDoc.data() as DailyPrinciples;
          setSnaps(data.principles || []);
          setDisciplineInfo(data.discipline_info || null);
          return;
        }

        setSnaps([]);
      } catch (err) {
        console.error('Error fetching academic snaps:', err);
        setError('학문 스냅을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSnaps();
  }, []);

  return { snaps, disciplineInfo, loading, error };
}
