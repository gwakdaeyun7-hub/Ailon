/**
 * 학문 원리 데이터 관리 Hook - 에이전트 팀 동적 생성 결과 지원
 * daily_principles 컬렉션에서 매일 에이전트가 생성한 원리를 가져옵니다.
 * 폴백: 기존 principles 컬렉션에서 로테이션 방식으로 가져옵니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Principle, DailyPrinciples } from '@/lib/types';

export function usePrinciples() {
  const [principles, setPrinciples] = useState<Principle[]>([]);
  const [todayPrincipleData, setTodayPrincipleData] = useState<Principle | null>(null);
  const [disciplineInfo, setDisciplineInfo] = useState<DailyPrinciples['discipline_info'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrinciples = async () => {
      try {
        setLoading(true);
        setError(null);

        // 먼저 daily_principles에서 오늘 에이전트 생성 결과 확인
        const today = new Date().toISOString().split('T')[0];
        const dailyRef = doc(db, 'daily_principles', today);
        const dailyDoc = await getDoc(dailyRef);

        if (dailyDoc.exists()) {
          const data = dailyDoc.data() as DailyPrinciples;
          setPrinciples(data.principles || []);
          setTodayPrincipleData(data.today_principle || null);
          setDisciplineInfo(data.discipline_info || null);
          return;
        }

        // 어제 데이터 시도
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const yesterdayRef = doc(db, 'daily_principles', yesterday);
        const yesterdayDoc = await getDoc(yesterdayRef);

        if (yesterdayDoc.exists()) {
          const data = yesterdayDoc.data() as DailyPrinciples;
          setPrinciples(data.principles || []);
          setTodayPrincipleData(data.today_principle || null);
          setDisciplineInfo(data.discipline_info || null);
          return;
        }

        // 폴백: 기존 principles 컬렉션에서 가져오기
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

  // 오늘의 원리 가져오기
  const getTodayPrinciple = (): Principle | null => {
    // 에이전트가 선정한 오늘의 원리가 있으면 사용
    if (todayPrincipleData) return todayPrincipleData;

    // 폴백: 날짜 기반 로테이션
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
    disciplineInfo,
    getTodayPrinciple,
    getPrinciplesByCategory,
  };
}
