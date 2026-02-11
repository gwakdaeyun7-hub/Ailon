/**
 * 융합 아이디어 데이터 관리 Hook
 * daily_ideas 컬렉션에서 에이전트 팀이 생성한 아이디어를 가져옵니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyIdeas, FusionIdea } from '@/lib/types';

export function useIdeas() {
  const [ideas, setIdeas] = useState<FusionIdea[]>([]);
  const [sourceDiscipline, setSourceDiscipline] = useState<string>('');
  const [sourcePrinciple, setSourcePrinciple] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        setLoading(true);
        setError(null);

        const today = new Date().toISOString().split('T')[0];
        const ideasRef = doc(db, 'daily_ideas', today);
        const ideasDoc = await getDoc(ideasRef);

        let data: DailyIdeas | null = null;

        if (ideasDoc.exists()) {
          data = ideasDoc.data() as DailyIdeas;
        } else {
          // 어제 데이터 시도
          const yesterday = new Date(Date.now() - 86400000)
            .toISOString()
            .split('T')[0];
          const yesterdayRef = doc(db, 'daily_ideas', yesterday);
          const yesterdayDoc = await getDoc(yesterdayRef);

          if (yesterdayDoc.exists()) {
            data = yesterdayDoc.data() as DailyIdeas;
          }
        }

        if (data) {
          setIdeas(data.ideas || []);
          setSourceDiscipline(data.source_discipline || '');
          setSourcePrinciple(data.source_principle || '');
        } else {
          setIdeas([]);
        }
      } catch (err) {
        console.error('Error fetching ideas:', err);
        setError('융합 아이디어를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, []);

  return { ideas, sourceDiscipline, sourcePrinciple, loading, error };
}
