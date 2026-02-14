import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export type ItemType = 'news' | 'snap' | 'idea';

// URL 등 특수문자 포함 ID를 Firestore 경로 안전 문자열로 변환
function makeSafeId(itemType: ItemType, itemId: string): string {
  return `${itemType}_${encodeURIComponent(itemId).slice(0, 200)}`;
}

interface ReactionData {
  likes: number;
  likedBy: string[];
}

interface UseReactionsReturn {
  likes: number;
  liked: boolean;
  toggleLike: () => Promise<void>;
}

export function useReactions(itemType: ItemType, itemId: string): UseReactionsReturn {
  const { user } = useAuth();
  const [data, setData] = useState<ReactionData>({ likes: 0, likedBy: [] });

  const docId = makeSafeId(itemType, itemId);

  useEffect(() => {
    if (!itemId) return;
    const ref = doc(db, 'reactions', docId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data() as ReactionData;
        setData({ likes: d.likes ?? 0, likedBy: d.likedBy ?? [] });
      } else {
        setData({ likes: 0, likedBy: [] });
      }
    });
    return unsub;
  }, [docId]);

  const toggleLike = useCallback(async () => {
    if (!user) return;
    const ref = doc(db, 'reactions', docId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const current: ReactionData = snap.exists()
        ? (snap.data() as ReactionData)
        : { likes: 0, likedBy: [] };

      const alreadyLiked = current.likedBy.includes(user.uid);
      const newLikedBy = alreadyLiked
        ? current.likedBy.filter((id) => id !== user.uid)
        : [...current.likedBy, user.uid];

      tx.set(ref, { likes: newLikedBy.length, likedBy: newLikedBy }, { merge: true });
    });
  }, [user, docId]);

  const liked = user ? data.likedBy.includes(user.uid) : false;

  return { likes: data.likes, liked, toggleLike };
}
