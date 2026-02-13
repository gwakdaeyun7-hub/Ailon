/**
 * 시너지 아이디어 데이터 Hook - Firestore synergy_ideas 컬렉션
 * frontend/lib/hooks/useSynergyIdeas.ts와 동일한 쿼리 로직
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

      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'synergy_ideas', today);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setIdeasData(docSnap.data() as DailySynergyIdeas);
      } else {
        for (let i = 1; i <= 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const prevRef = doc(db, 'synergy_ideas', dateStr);
          const prevSnap = await getDoc(prevRef);
          if (prevSnap.exists()) {
            setIdeasData(prevSnap.data() as DailySynergyIdeas);
            break;
          }
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
