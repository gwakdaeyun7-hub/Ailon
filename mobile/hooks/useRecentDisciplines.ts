/**
 * 최근 7일간의 학문 스낵 날짜별 학문명을 fetch
 * SideDrawer의 snaps 섹션에서 "날짜 · 학문명" 형태로 표시하는 데 사용
 */

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface DisciplineDay {
  date: string;
  name: string;
  superCategory?: string;
  isToday: boolean;
}

export function useRecentDisciplines() {
  const [disciplines, setDisciplines] = useState<DisciplineDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDisciplines = async () => {
      const results: DisciplineDay[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        try {
          const snap = await getDoc(doc(db, 'daily_principles', dateStr));
          if (snap.exists()) {
            const data = snap.data();
            results.push({
              date: dateStr,
              name: data.discipline_info?.name ?? data.discipline_key ?? '학문',
              superCategory: data.discipline_info?.superCategory,
              isToday: i === 0,
            });
          }
        } catch {
          // 해당 날짜 데이터 없으면 skip
        }
      }
      setDisciplines(results);
      setLoading(false);
    };
    fetchDisciplines();
  }, []);

  return { disciplines, loading };
}
