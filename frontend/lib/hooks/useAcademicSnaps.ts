/**
 * 학문 스냅 데이터 관리 Hook (New Structure)
 * daily_principles 컬렉션에서 단일 원리(Foundation-Application-Integration) 데이터를 가져옵니다.
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

        // 최근 7일 동안 데이터 찾기
        for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
          const date = new Date(Date.now() - daysAgo * 86400000)
            .toISOString()
            .split('T')[0];

          const ref = doc(db, 'daily_principles', date);
          const docSnap = await getDoc(ref);

          if (docSnap.exists()) {
            const data = docSnap.data() as DailyPrinciples;
            // New structure: single principle object, wrap in array for backward compatibility
            setSnaps(data.principle ? [data.principle] : []);
            setDisciplineInfo(data.discipline_info || null);
            console.log(`📚 Found academic snaps from ${date} (${daysAgo} days ago)`);
            return;
          }
        }

        console.warn('⚠️ No academic snaps found in the last 7 days');
        setSnaps([]);
      } catch (err) {
        console.error('Error fetching academic snaps:', err);
        setError('학문 스냅을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSnaps();
  }, []); // Trigger re-render only on mount
  return { snaps, disciplineInfo, loading, error };
}
