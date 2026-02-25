import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  FieldValue,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { ItemType } from '@/hooks/useReactions';

interface CommentData {
  text: string;
  authorName: string;
  authorUid: string;
  createdAt: FieldValue;
  parentId?: string;
}

function makeSafeId(itemType: ItemType, itemId: string): string {
  return `${itemType}_${encodeURIComponent(itemId).slice(0, 200)}`;
}

export interface Comment {
  id: string;
  text: string;
  authorName: string;
  authorUid: string;
  createdAt: number;
  parentId?: string;
}

interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  addComment: (text: string, parentId?: string) => Promise<void>;
}

export function useComments(itemType: ItemType, itemId: string): UseCommentsReturn {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const docId = makeSafeId(itemType, itemId);

  useEffect(() => {
    if (!itemId) return;
    const ref = collection(db, 'comments', docId, 'entries');
    const q = query(ref, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setComments(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            text: data.text ?? '',
            authorName: data.authorName ?? '익명',
            authorUid: data.authorUid ?? '',
            createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
            parentId: data.parentId ?? undefined,
          };
        })
      );
      setLoading(false);
    }, (error) => {
      console.error('Comments snapshot error:', error);
      setLoading(false);
    });
    return unsub;
  }, [docId, itemId]);

  const addComment = useCallback(
    async (text: string, parentId?: string) => {
      if (!user || !text.trim()) return;
      const ref = collection(db, 'comments', docId, 'entries');
      const data: CommentData = {
        text: text.trim(),
        authorName: user.displayName ?? user.email ?? '익명',
        authorUid: user.uid,
        createdAt: serverTimestamp(),
        ...(parentId ? { parentId } : {}),
      };
      await addDoc(ref, data);
    },
    [user, docId]
  );

  return { comments, loading, addComment };
}
