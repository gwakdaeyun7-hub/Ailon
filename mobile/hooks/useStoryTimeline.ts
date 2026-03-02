import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyStoryTimeline } from '@/lib/types';

export function useStoryTimeline(date: string) {
  const [data, setData] = useState<DailyStoryTimeline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    getDoc(doc(db, 'daily_story_timeline', date))
      .then(snap => {
        if (snap.exists()) setData(snap.data() as DailyStoryTimeline);
      })
      .catch(e => console.error('useStoryTimeline error:', e))
      .finally(() => setLoading(false));
  }, [date]);

  return { data, loading };
}
