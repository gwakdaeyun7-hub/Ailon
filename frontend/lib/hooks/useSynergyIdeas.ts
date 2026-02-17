/**
 * 시너지 아이디어 데이터 관리 Hook
 * daily_ideas 컬렉션에서 확장된 아이디어 데이터를 가져옵니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailySynergyIdeas, SynergyIdea } from '@/lib/types';

export function useSynergyIdeas() {
  const [ideas, setIdeas] = useState<SynergyIdea[]>([]);
  const [sourceDiscipline, setSourceDiscipline] = useState<string>('');
  const [sourcePrinciple, setSourcePrinciple] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        setLoading(true);
        setError(null);

        let data: DailySynergyIdeas | null = null;

        // 최근 7일 동안 데이터 찾기
        for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
          const date = new Date(Date.now() - daysAgo * 86400000)
            .toISOString()
            .split('T')[0];

          const ideasRef = doc(db, 'synergy_ideas', date);
          const ideasDoc = await getDoc(ideasRef);

          if (ideasDoc.exists()) {
            data = ideasDoc.data() as DailySynergyIdeas;
            console.log(`💡 Found synergy ideas from ${date} (${daysAgo} days ago)`);
            break;
          }
        }

        if (data) {
          setIdeas((data.ideas || []) as SynergyIdea[]);
          setSourceDiscipline(data.source_discipline || '');
          setSourcePrinciple(data.source_principle || '');
        } else {
          console.warn('⚠️ No synergy ideas found in the last 7 days');
          setIdeas([]);
        }
      } catch (err) {
        console.error('Error fetching synergy ideas:', err);
        setError('융합 아이디어를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, []);

  return { ideas, sourceDiscipline, sourcePrinciple, loading, error };
}
