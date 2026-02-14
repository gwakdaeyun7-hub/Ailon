import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export type ItemType = 'news' | 'snap' | 'idea';

function makeSafeId(itemType: ItemType, itemId: string): string {
  return `${itemType}_${encodeURIComponent(itemId).slice(0, 200)}`;
}

interface ReactionData {
  likes: number;
  likedBy: string[];
  dislikes: number;
  dislikedBy: string[];
}

interface UseReactionsReturn {
  likes: number;
  dislikes: number;
  liked: boolean;
  disliked: boolean;
  toggleLike: () => Promise<void>;
  toggleDislike: () => Promise<void>;
}

export function useReactions(itemType: ItemType, itemId: string): UseReactionsReturn {
  const { user } = useAuth();
  const [data, setData] = useState<ReactionData>({ likes: 0, likedBy: [], dislikes: 0, dislikedBy: [] });

  const docId = makeSafeId(itemType, itemId);

  useEffect(() => {
    if (!itemId) return;
    const ref = doc(db, 'reactions', docId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data() as Partial<ReactionData>;
        setData({
          likes: d.likes ?? 0,
          likedBy: d.likedBy ?? [],
          dislikes: d.dislikes ?? 0,
          dislikedBy: d.dislikedBy ?? [],
        });
      } else {
        setData({ likes: 0, likedBy: [], dislikes: 0, dislikedBy: [] });
      }
    });
    return unsub;
  }, [docId]);

  const toggleLike = useCallback(async () => {
    if (!user) return;
    const ref = doc(db, 'reactions', docId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const cur: ReactionData = snap.exists()
        ? { likes: 0, likedBy: [], dislikes: 0, dislikedBy: [], ...(snap.data() as Partial<ReactionData>) }
        : { likes: 0, likedBy: [], dislikes: 0, dislikedBy: [] };

      const alreadyLiked = cur.likedBy.includes(user.uid);
      const newLikedBy = alreadyLiked
        ? cur.likedBy.filter((id) => id !== user.uid)
        : [...cur.likedBy, user.uid];
      // 좋아요 누르면 싫어요 자동 해제
      const newDislikedBy = cur.dislikedBy.filter((id) => id !== user.uid);

      tx.set(ref, {
        likes: newLikedBy.length,
        likedBy: newLikedBy,
        dislikes: newDislikedBy.length,
        dislikedBy: newDislikedBy,
      }, { merge: true });
    });
  }, [user, docId]);

  const toggleDislike = useCallback(async () => {
    if (!user) return;
    const ref = doc(db, 'reactions', docId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const cur: ReactionData = snap.exists()
        ? { likes: 0, likedBy: [], dislikes: 0, dislikedBy: [], ...(snap.data() as Partial<ReactionData>) }
        : { likes: 0, likedBy: [], dislikes: 0, dislikedBy: [] };

      const alreadyDisliked = cur.dislikedBy.includes(user.uid);
      const newDislikedBy = alreadyDisliked
        ? cur.dislikedBy.filter((id) => id !== user.uid)
        : [...cur.dislikedBy, user.uid];
      // 싫어요 누르면 좋아요 자동 해제
      const newLikedBy = cur.likedBy.filter((id) => id !== user.uid);

      tx.set(ref, {
        likes: newLikedBy.length,
        likedBy: newLikedBy,
        dislikes: newDislikedBy.length,
        dislikedBy: newDislikedBy,
      }, { merge: true });
    });
  }, [user, docId]);

  const liked = user ? data.likedBy.includes(user.uid) : false;
  const disliked = user ? data.dislikedBy.includes(user.uid) : false;

  return { likes: data.likes, dislikes: data.dislikes, liked, disliked, toggleLike, toggleDislike };
}
