/**
 * 북마크 관리 Hook - Firestore users/{uid}/bookmarks 서브컬렉션
 * frontend/lib/hooks/useBookmarks.ts와 동일한 쿼리 로직
 */

import { useEffect, useState } from 'react';
import { collection, doc, setDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Bookmark } from '@/lib/types';

export function useBookmarks(userId: string | null) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    const bookmarksRef = collection(db, 'users', userId, 'bookmarks');
    const unsubscribe = onSnapshot(bookmarksRef, (snapshot) => {
      const items: Bookmark[] = snapshot.docs.map((d) => d.data() as Bookmark);
      setBookmarks(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addBookmark = async (type: Bookmark['type'], itemId: string) => {
    if (!userId) return;
    const bookmarkRef = doc(db, 'users', userId, 'bookmarks', `${type}_${itemId}`);
    await setDoc(bookmarkRef, {
      type,
      itemId,
      createdAt: new Date().toISOString(),
    });
  };

  const removeBookmark = async (type: Bookmark['type'], itemId: string) => {
    if (!userId) return;
    const bookmarkRef = doc(db, 'users', userId, 'bookmarks', `${type}_${itemId}`);
    await deleteDoc(bookmarkRef);
  };

  const isBookmarked = (type: Bookmark['type'], itemId: string) => {
    return bookmarks.some((b) => b.type === type && b.itemId === itemId);
  };

  const toggleBookmark = async (type: Bookmark['type'], itemId: string) => {
    if (isBookmarked(type, itemId)) {
      await removeBookmark(type, itemId);
    } else {
      await addBookmark(type, itemId);
    }
  };

  return { bookmarks, loading, addBookmark, removeBookmark, isBookmarked, toggleBookmark };
}
