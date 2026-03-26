/**
 * 읽은 기사 통계 Hook — read_history/{uid} 서브컬렉션
 * 기사 상세 열 때 recordRead() 호출, 프로필에서 통계 표시
 */

import { useEffect, useState, useCallback } from 'react';
import { collection, doc, setDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ReadStats {
  weeklyCount: number;
  totalCount: number;
}

export function useReadStats(userId: string | null) {
  const [stats, setStats] = useState<ReadStats>({ weeklyCount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setStats({ weeklyCount: 0, totalCount: 0 });
      setLoading(false);
      return;
    }

    try {
      const historyRef = collection(db, 'users', userId, 'read_history');
      const allSnap = await getDocs(historyRef);
      const totalCount = allSnap.size;

      // 이번 주 (월요일 기준)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - mondayOffset);
      monday.setHours(0, 0, 0, 0);

      const weeklyQuery = query(
        historyRef,
        where('readAt', '>=', Timestamp.fromDate(monday)),
      );
      const weeklySnap = await getDocs(weeklyQuery);

      setStats({ weeklyCount: weeklySnap.size, totalCount });
    } catch (error) {
      console.error('Read stats fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /** 기사 읽음 기록 (중복 방지: articleId를 doc ID로 사용) */
  const recordRead = useCallback(async (articleId: string) => {
    if (!userId || !articleId) return;
    try {
      const safeId = articleId.replace(/[\/\.#$\[\]?&=:%+@]/g, '_').slice(0, 200);
      const docRef = doc(db, 'users', userId, 'read_history', safeId);
      await setDoc(docRef, {
        articleId,
        readAt: Timestamp.now(),
      }, { merge: true }); // merge: 재방문 시 readAt만 업데이트
      // 로컬 통계 즉시 반영 (낙관적)
      setStats((prev) => ({
        ...prev,
        totalCount: prev.totalCount + 1,
        weeklyCount: prev.weeklyCount + 1,
      }));
    } catch (error) {
      console.error('Record read error:', error);
    }
  }, [userId]);

  return { stats, loading, recordRead, refetch: fetchStats };
}
