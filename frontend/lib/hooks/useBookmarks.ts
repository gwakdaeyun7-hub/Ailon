/**
 * 북마크 관리 Hook
 * users/{userId}/bookmarks 서브컬렉션에서 북마크를 관리합니다.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import type { Bookmark } from '@/lib/types';

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setBookmarks([]);
      setBookmarkIds(new Set());
      return;
    }

    const fetchBookmarks = async () => {
      setLoading(true);
      try {
        const bookmarksRef = collection(db, 'users', user.uid, 'bookmarks');
        const q = query(bookmarksRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const items: Bookmark[] = [];
        const ids = new Set<string>();
        snapshot.forEach((doc) => {
          const data = doc.data() as Bookmark;
          items.push(data);
          ids.add(`${data.type}_${data.itemId}`);
        });

        setBookmarks(items);
        setBookmarkIds(ids);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user]);

  const isBookmarked = useCallback(
    (itemType: string, itemId: string): boolean => {
      return bookmarkIds.has(`${itemType}_${itemId}`);
    },
    [bookmarkIds]
  );

  const toggleBookmark = useCallback(
    async (itemType: 'news' | 'snap' | 'idea', itemId: string, itemData?: Record<string, any>) => {
      if (!user) return;

      const key = `${itemType}_${itemId}`;
      const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', key);

      if (bookmarkIds.has(key)) {
        await deleteDoc(bookmarkRef);
        setBookmarkIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        setBookmarks((prev) => prev.filter((b) => `${b.type}_${b.itemId}` !== key));
      } else {
        const bookmark: Bookmark = {
          type: itemType,
          itemId,
          createdAt: serverTimestamp(),
          ...itemData,
        };
        await setDoc(bookmarkRef, bookmark);
        setBookmarkIds((prev) => new Set(prev).add(key));
        setBookmarks((prev) => [bookmark, ...prev]);
      }
    },
    [user, bookmarkIds]
  );

  const getBookmarksByType = useCallback(
    (type: 'news' | 'snap' | 'idea'): Bookmark[] => {
      return bookmarks.filter((b) => b.type === type);
    },
    [bookmarks]
  );

  return { bookmarks, isBookmarked, toggleBookmark, getBookmarksByType, loading };
}
