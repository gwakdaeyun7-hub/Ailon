/**
 * 댓글 신고 Hook — Firestore reports 컬렉션 + 댓글 reportCount 증가
 * 같은 댓글에 3건 이상 신고 시 자동 숨김 (CommentSheet에서 reportCount >= 3 체크)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export type ReportReason =
  | 'abuse'        // 욕설/비방
  | 'spam'         // 스팸/광고
  | 'misinformation' // 허위정보
  | 'other';       // 기타

interface UseReportCommentReturn {
  reportComment: (params: {
    commentId: string;
    docId: string;
    authorUid: string;
    commentText: string;
    reason: ReportReason;
  }) => Promise<'done' | 'already_reported' | 'no_user'>;
  checkAlreadyReported: (commentId: string) => Promise<boolean>;
  reportedIds: Set<string>;
}

export function useReportComment(): UseReportCommentReturn {
  const { user } = useAuth();
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  // 현재 유저가 이미 신고한 댓글 목록을 로컬에서 관리
  const checkAlreadyReported = useCallback(
    async (commentId: string): Promise<boolean> => {
      if (!user) return false;
      if (reportedIds.has(commentId)) return true;

      const q = query(
        collection(db, 'reports'),
        where('reporterUid', '==', user.uid),
        where('commentId', '==', commentId),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setReportedIds((prev) => new Set(prev).add(commentId));
        return true;
      }
      return false;
    },
    [user, reportedIds],
  );

  const reportComment = useCallback(
    async (params: {
      commentId: string;
      docId: string;
      authorUid: string;
      commentText: string;
      reason: ReportReason;
    }): Promise<'done' | 'already_reported' | 'no_user'> => {
      if (!user) return 'no_user';

      // 중복 신고 체크
      const alreadyReported = await checkAlreadyReported(params.commentId);
      if (alreadyReported) return 'already_reported';

      // 1) reports 컬렉션에 신고 문서 생성
      await addDoc(collection(db, 'reports'), {
        commentId: params.commentId,
        docId: params.docId,
        reporterUid: user.uid,
        authorUid: params.authorUid,
        reason: params.reason,
        commentText: params.commentText,
        createdAt: serverTimestamp(),
        status: 'pending',
      });

      // 2) 해당 댓글의 reportCount를 트랜잭션으로 증가
      const entryRef = doc(db, 'comments', params.docId, 'entries', params.commentId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(entryRef);
        const currentCount = snap.exists() ? (snap.data().reportCount ?? 0) : 0;
        tx.update(entryRef, { reportCount: currentCount + 1 });
      });

      // 로컬 캐시 업데이트
      setReportedIds((prev) => new Set(prev).add(params.commentId));

      return 'done';
    },
    [user, checkAlreadyReported],
  );

  return { reportComment, checkAlreadyReported, reportedIds };
}
