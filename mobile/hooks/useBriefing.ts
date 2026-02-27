/**
 * Daily Briefing Hook - Firestore daily_briefings/{date} 컬렉션
 */

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyBriefing } from '@/lib/types';

function getKSTDateString(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

export function useBriefing() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBriefing = useCallback(async () => {
    try {
      setLoading(true);
      // 1) 오늘 날짜 브리핑 시도
      const today = getKSTDateString();
      const snap = await getDoc(doc(db, 'daily_briefings', today));
      if (snap.exists()) {
        setBriefing(snap.data() as DailyBriefing);
        return;
      }
      // 2) 오늘 것이 없으면 가장 최근 브리핑으로 fallback
      const q = query(collection(db, 'daily_briefings'), orderBy('date', 'desc'), limit(1));
      const qs = await getDocs(q);
      if (!qs.empty) {
        setBriefing(qs.docs[0].data() as DailyBriefing);
      }
    } catch (e) {
      console.error('useBriefing error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBriefing(); }, [fetchBriefing]);

  return { briefing, loading, refresh: fetchBriefing };
}
