/**
 * 시너지 아이디어 데이터 Hook - Firestore synergy_ideas 컬렉션
 * 오늘 데이터 우선, 없으면 최근 7일 fallback
 */

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailySynergyIdeas, SynergyIdea } from '@/lib/types';

export function useSynergyIdeas() {
  const [ideasData, setIdeasData] = useState<DailySynergyIdeas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      setError(null);
      setIdeasData(null);

      const today = new Date().toISOString().split('T')[0];
      const docSnap = await getDoc(doc(db, 'synergy_ideas', today));
      if (docSnap.exists()) {
        setIdeasData(docSnap.data() as DailySynergyIdeas);
        return;
      }

      // 오늘 데이터 없으면 최근 7일 fallback
      for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const prevSnap = await getDoc(doc(db, 'synergy_ideas', dateStr));
        if (prevSnap.exists()) {
          setIdeasData(prevSnap.data() as DailySynergyIdeas);
          return;
        }
      }
    } catch (err) {
      setError('아이디어를 불러오는 데 실패했어요.');
      console.error('useSynergyIdeas error:', err);
    } finally {
      setLoading(false);
    }
  };

  const ideas: SynergyIdea[] = ideasData?.ideas ?? [];

  return {
    ideasData,
    ideas,
    loading,
    error,
    refresh: fetchIdeas,
  };
}
