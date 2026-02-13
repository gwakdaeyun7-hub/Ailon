/**
 * 사용자 피드백 관리 Hook
 * user_feedback 컬렉션에서 피드백 데이터를 관리합니다.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

interface FeedbackMap {
  [key: string]: 'like' | 'dislike';
}

export function useUserFeedback() {
  const { user } = useAuth();
  const [feedbackMap, setFeedbackMap] = useState<FeedbackMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFeedbackMap({});
      return;
    }

    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const feedbackRef = collection(db, 'user_feedback');
        const q = query(feedbackRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);

        const map: FeedbackMap = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          const key = `${data.itemType}_${data.itemId}`;
          map[key] = data.reaction;
        });

        setFeedbackMap(map);
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [user]);

  const getReaction = useCallback(
    (itemType: string, itemId: string): 'like' | 'dislike' | null => {
      return feedbackMap[`${itemType}_${itemId}`] || null;
    },
    [feedbackMap]
  );

  const submitFeedback = useCallback(
    async (
      itemType: 'news' | 'snap' | 'idea',
      itemId: string,
      reaction: 'like' | 'dislike'
    ) => {
      if (!user) return;

      const feedbackId = `${user.uid}_${itemType}_${itemId}`;
      const feedbackRef = doc(db, 'user_feedback', feedbackId);
      const key = `${itemType}_${itemId}`;

      if (feedbackMap[key] === reaction) {
        await deleteDoc(feedbackRef);
        setFeedbackMap((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } else {
        await setDoc(feedbackRef, {
          userId: user.uid,
          itemType,
          itemId,
          reaction,
          createdAt: serverTimestamp(),
        });
        setFeedbackMap((prev) => ({ ...prev, [key]: reaction }));
      }
    },
    [user, feedbackMap]
  );

  return { feedbackMap, getReaction, submitFeedback, loading };
}
