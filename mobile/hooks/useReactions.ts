/**
 * 좋아요/싫어요 Hook — Firestore reactions 컬렉션
 * dislikedBy 배열로 중복 방지 (toggleLike와 동일 정책)
 */

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

interface ReactionUpdate {
  likes: number;
  likedBy: string[];
  dislikes: number;
  dislikedBy: string[];
  contentAuthorUid?: string;
}

export type LikeResult = 'done' | 'already' | 'no_user';

interface UseReactionsReturn {
  likes: number;
  dislikes: number;
  liked: boolean;
  disliked: boolean;
  toggleLike: () => Promise<LikeResult>;
  toggleDislike: () => Promise<void>;
}

export function useReactions(itemType: ItemType, itemId: string, contentAuthorUid?: string): UseReactionsReturn {
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
    }, (error) => {
      console.error('Reactions snapshot error:', error);
    });
    return unsub;
  }, [docId, itemId]);

  const toggleLike = useCallback(async (): Promise<LikeResult> => {
    if (!user) return 'no_user';

    // 낙관적 업데이트: 즉시 UI 반영
    const prev = { ...data };
    const alreadyLiked = data.likedBy.includes(user.uid);
    setData({
      likes: alreadyLiked ? data.likes - 1 : data.likes + 1,
      likedBy: alreadyLiked ? data.likedBy.filter((id) => id !== user.uid) : [...data.likedBy, user.uid],
      dislikes: data.dislikedBy.includes(user.uid) ? data.dislikes - 1 : data.dislikes,
      dislikedBy: data.dislikedBy.filter((id) => id !== user.uid),
    });

    try {
      const ref = doc(db, 'reactions', docId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const cur: ReactionData = snap.exists()
          ? { likes: 0, likedBy: [], dislikes: 0, dislikedBy: [], ...(snap.data() as Partial<ReactionData>) }
          : { likes: 0, likedBy: [], dislikes: 0, dislikedBy: [] };

        const serverLiked = cur.likedBy.includes(user.uid);
        const newLikedBy = serverLiked
          ? cur.likedBy.filter((id) => id !== user.uid)
          : [...cur.likedBy, user.uid];
        const newDislikedBy = cur.dislikedBy.filter((id) => id !== user.uid);

        const update: ReactionUpdate = {
          likes: newLikedBy.length,
          likedBy: newLikedBy,
          dislikes: newDislikedBy.length,
          dislikedBy: newDislikedBy,
        };
        if (contentAuthorUid && !snap.exists()) update.contentAuthorUid = contentAuthorUid;

        tx.set(ref, update, { merge: true });
      });
    } catch {
      // 실패 시 롤백
      setData(prev);
    }
    return 'done';
  }, [user, docId, contentAuthorUid, data]);

  const toggleDislike = useCallback(async () => {
    if (!user) return;

    const prev = { ...data };
    const alreadyDisliked = data.dislikedBy.includes(user.uid);
    setData({
      likes: data.likedBy.includes(user.uid) ? data.likes - 1 : data.likes,
      likedBy: data.likedBy.filter((id) => id !== user.uid),
      dislikes: alreadyDisliked ? data.dislikes - 1 : data.dislikes + 1,
      dislikedBy: alreadyDisliked ? data.dislikedBy.filter((id) => id !== user.uid) : [...data.dislikedBy, user.uid],
    });

    try {
      const ref = doc(db, 'reactions', docId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const cur: ReactionData = snap.exists()
          ? { likes: 0, likedBy: [], dislikes: 0, dislikedBy: [], ...(snap.data() as Partial<ReactionData>) }
          : { likes: 0, likedBy: [], dislikes: 0, dislikedBy: [] };

        const serverDisliked = cur.dislikedBy.includes(user.uid);
        const newDislikedBy = serverDisliked
          ? cur.dislikedBy.filter((id) => id !== user.uid)
          : [...cur.dislikedBy, user.uid];
        const newLikedBy = cur.likedBy.filter((id) => id !== user.uid);

        tx.set(ref, {
          likes: newLikedBy.length,
          likedBy: newLikedBy,
          dislikes: newDislikedBy.length,
          dislikedBy: newDislikedBy,
        }, { merge: true });
      });
    } catch {
      setData(prev);
    }
  }, [user, docId, data]);

  const liked = user ? data.likedBy.includes(user.uid) : false;
  const disliked = user ? data.dislikedBy.includes(user.uid) : false;

  return { likes: data.likes, dislikes: data.dislikes, liked, disliked, toggleLike, toggleDislike };
}
