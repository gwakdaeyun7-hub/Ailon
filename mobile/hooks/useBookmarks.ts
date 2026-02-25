/**
 * 북마크 관리 Hook - Firestore users/{uid}/bookmarks 서브컬렉션
 * metadata 파라미터 지원: 제목, 부제목, 카테고리, 링크 저장
 */

import { useEffect, useState, useCallback } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Bookmark, BookmarkMeta } from '@/lib/types';

/** URL 등 특수문자를 Firestore document ID로 안전하게 변환 */
function safeDocId(type: string, itemId: string): string {
  return `${type}_${itemId.replace(/[\/\.#$\[\]?&=:%+@]/g, '_')}`;
}

/** metadata에서 undefined/빈문자열 값을 제거하여 Firestore-safe 객체 반환 */
function cleanMetadata(metadata: BookmarkMeta | undefined): Record<string, string> | undefined {
  if (!metadata) return undefined;
  const cleaned = Object.fromEntries(
    Object.entries(metadata).filter(([, v]) => v !== undefined && v !== ''),
  );
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

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
    }, (error) => {
      console.error('Bookmarks snapshot error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addBookmark = useCallback(async (type: Bookmark['type'], itemId: string, metadata?: BookmarkMeta) => {
    if (!userId) return;
    try {
      const bookmarkRef = doc(db, 'users', userId, 'bookmarks', safeDocId(type, itemId));
      const cleanMeta = cleanMetadata(metadata);
      await setDoc(bookmarkRef, {
        type,
        itemId,
        createdAt: new Date().toISOString(),
        ...(cleanMeta ? { metadata: cleanMeta } : {}),
      });
    } catch (err) {
      console.error('Bookmark add error:', err);
    }
  }, [userId]);

  const removeBookmark = useCallback(async (type: Bookmark['type'], itemId: string) => {
    if (!userId) return;
    try {
      const bookmarkRef = doc(db, 'users', userId, 'bookmarks', safeDocId(type, itemId));
      await deleteDoc(bookmarkRef);
    } catch (err) {
      console.error('Bookmark remove error:', err);
    }
  }, [userId]);

  const isBookmarked = useCallback((type: Bookmark['type'], itemId: string): boolean => {
    return bookmarks.some((b) => b.type === type && b.itemId === itemId);
  }, [bookmarks]);

  const toggleBookmark = useCallback(async (type: Bookmark['type'], itemId: string, metadata?: BookmarkMeta) => {
    // bookmarks 배열을 직접 참조하여 현재 상태 확인 (isBookmarked 클로저 의존 제거)
    const alreadyBookmarked = bookmarks.some((b) => b.type === type && b.itemId === itemId);
    try {
      if (alreadyBookmarked) {
        await removeBookmark(type, itemId);
      } else {
        await addBookmark(type, itemId, metadata);
      }
    } catch (err) {
      console.error('Bookmark toggle error:', err);
    }
  }, [bookmarks, addBookmark, removeBookmark]);

  return { bookmarks, loading, addBookmark, removeBookmark, isBookmarked, toggleBookmark };
}
