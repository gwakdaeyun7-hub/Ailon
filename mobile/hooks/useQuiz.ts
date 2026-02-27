/**
 * Daily Quiz Hook - Firestore daily_quizzes/{date} 컬렉션
 */

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyQuiz } from '@/lib/types';

function getKSTDateString(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

export function useQuiz() {
  const [quiz, setQuiz] = useState<DailyQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);

  const fetchQuiz = useCallback(async () => {
    try {
      setLoading(true);
      const today = getKSTDateString();
      const snap = await getDoc(doc(db, 'daily_quizzes', today));
      if (snap.exists()) {
        setQuiz(snap.data() as DailyQuiz);
      }
    } catch (e) {
      console.error('useQuiz error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuiz(); }, [fetchQuiz]);

  const submitAnswer = useCallback((questionIndex: number, selectedIndex: number) => {
    if (!quiz) return;
    setAnswers(prev => ({ ...prev, [questionIndex]: selectedIndex }));
    if (quiz.questions[questionIndex]?.correct_index === selectedIndex) {
      setScore(prev => prev + 20);
    }
  }, [quiz]);

  const reset = useCallback(() => {
    setAnswers({});
    setScore(0);
  }, []);

  return { quiz, loading, answers, score, submitAnswer, reset, refresh: fetchQuiz };
}
