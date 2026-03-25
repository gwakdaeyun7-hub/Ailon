/**
 * Ailon Cloud Functions (v2)
 * 1) 댓글 답글 알림 — comments/{docId}/entries/{entryId} onCreate
 * 2) 좋아요 알림 — reactions/{docId} onUpdate (5분 디바운싱)
 *
 * 이중언어 지원 (users/{uid}.language), 딥링크 데이터 포함
 */

const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();
const db = admin.firestore();

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const LIKE_THROTTLE_MS = 5 * 60 * 1000; // 5분

// ─── 헬퍼 ───

/**
 * Expo Push API로 단일 알림 발송
 */
async function sendPush(token, title, body, data = {}, channelId = "social") {
  if (!token) return;
  try {
    const resp = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        sound: "default",
        title,
        body,
        channelId,
        data,
      }),
    });
    const result = await resp.json();
    if (result.data?.status === "error") {
      const detail = result.data.details?.error;
      if (
        detail === "DeviceNotRegistered" ||
        detail === "InvalidCredentials"
      ) {
        // 토큰 무효화
        const users = await db
          .collection("users")
          .where("expoPushToken", "==", token)
          .get();
        users.forEach((doc) =>
          doc.ref.update({ expoPushToken: null, fcmToken: null }),
        );
      }
    }
  } catch (err) {
    console.error("Push send error:", err);
  }
}

/**
 * 사용자의 토큰 + 언어 설정 확인
 * @returns {{ token: string, lang: string } | null}
 */
async function getUserInfo(uid, settingKey) {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) return null;

  const data = userDoc.data();
  const token = data.expoPushToken;
  if (!token) return null;

  const prefsDoc = await db
    .collection("users")
    .doc(uid)
    .collection("preferences")
    .doc("notifications")
    .get();

  // 설정 문서가 없으면 기본 ON
  if (prefsDoc.exists && prefsDoc.data()[settingKey] === false) return null;

  return {
    token,
    lang: data.language || "ko",
    lastLikeNotifiedAt: data.lastLikeNotifiedAt || null,
  };
}

// ─── 1. 댓글 답글 알림 ───
exports.onCommentReply = onDocumentCreated(
  "comments/{docId}/entries/{entryId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const entry = snap.data();
    if (!entry.parentId) return; // 답글이 아니면 무시

    // 부모 댓글 조회
    const parentRef = db
      .collection("comments")
      .doc(event.params.docId)
      .collection("entries")
      .doc(entry.parentId);
    const parentSnap = await parentRef.get();
    if (!parentSnap.exists) return;

    const parentAuthorUid = parentSnap.data().authorUid;
    if (!parentAuthorUid || parentAuthorUid === entry.authorUid) return;

    const userInfo = await getUserInfo(parentAuthorUid, "commentReplies");
    if (!userInfo) return;

    const rawName = entry.authorName || "Someone";
    const authorName = rawName.replace(/[^\p{L}\p{N}\s._-]/gu, "").slice(0, 50) || "Someone";
    const body =
      userInfo.lang === "ko"
        ? `${authorName}님이 댓글에 답글을 남겼습니다`
        : `${authorName} replied to your comment`;

    await sendPush(userInfo.token, "Ailon", body, {
      type: "comment_reply",
      tab: "index",
      articleId: event.params.docId,
    });
  },
);

// ─── 2. 좋아요 알림 (5분 디바운싱) ───
exports.onReactionUpdate = onDocumentUpdated(
  "reactions/{docId}",
  async (event) => {
    if (!event.data) return;

    const before = event.data.before.data();
    const after = event.data.after.data();

    const prevLikedBy = before.likedBy || [];
    const newLikedBy = after.likedBy || [];

    // 새로 추가된 UID 감지
    const addedUids = newLikedBy.filter((uid) => !prevLikedBy.includes(uid));
    if (addedUids.length === 0) return;

    const contentAuthorUid = after.contentAuthorUid;
    if (!contentAuthorUid) return;

    // 자기 자신 좋아요는 알림 안함
    const externalLikers = addedUids.filter(
      (uid) => uid !== contentAuthorUid,
    );
    if (externalLikers.length === 0) return;

    const userInfo = await getUserInfo(contentAuthorUid, "likes");
    if (!userInfo) return;

    // 5분 디바운싱: 마지막 좋아요 알림 이후 5분 내면 스킵
    const lastNotified = userInfo.lastLikeNotifiedAt;
    if (lastNotified) {
      const lastMs = lastNotified.toMillis ? lastNotified.toMillis() : 0;
      if (Date.now() - lastMs < LIKE_THROTTLE_MS) return;
    }

    // 타임스탬프 갱신 (디바운싱용)
    await db.collection("users").doc(contentAuthorUid).update({
      lastLikeNotifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const likeCount = newLikedBy.length;
    const body =
      userInfo.lang === "ko"
        ? likeCount > 1
          ? `${likeCount}명이 회원님의 글을 좋아합니다`
          : "누군가 회원님의 글을 좋아합니다"
        : likeCount > 1
          ? `${likeCount} people liked your post`
          : "Someone liked your post";

    await sendPush(userInfo.token, "Ailon", body, {
      type: "like",
      tab: "index",
      articleId: event.params.docId,
    });
  },
);
