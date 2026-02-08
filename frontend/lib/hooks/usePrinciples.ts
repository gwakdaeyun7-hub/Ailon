/**
 * 학문 원리 데이터 관리 Hook
 */

'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Principle } from '@/lib/types';

export function usePrinciples() {
  const [principles, setPrinciples] = useState<Principle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrinciples = async () => {
      try {
        setLoading(true);
        setError(null);

        const principlesRef = collection(db, 'principles');
        const q = query(principlesRef);
        const querySnapshot = await getDocs(q);

        const principlesData: Principle[] = [];
        querySnapshot.forEach((doc) => {
          principlesData.push(doc.data() as Principle);
        });

        setPrinciples(principlesData);
      } catch (err) {
        console.error('Error fetching principles:', err);
        setError('학문 원리를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrinciples();
  }, []);

  // 오늘의 원리 가져오기 (날짜 기반 로테이션)
  const getTodayPrinciple = (): Principle | null => {
    if (principles.length === 0) return null;

    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        86400000
    );
    const index = dayOfYear % principles.length;

    return principles[index];
  };

  // 카테고리별 원리 가져오기
  const getPrinciplesByCategory = (
    category: Principle['category']
  ): Principle[] => {
    return principles.filter((p) => p.category === category);
  };

  return {
    principles,
    loading,
    error,
    getTodayPrinciple,
    getPrinciplesByCategory,
  };
}
