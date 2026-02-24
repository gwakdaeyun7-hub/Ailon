/**
 * Ailon Cloud Functions
 * 1) 댓글 답글 알림 (comments/{docId}/entries/{entryId} onCreate)
 * 2) 좋아요 알림 (reactions/{docId} onUpdate)
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();
const db = admin.firestore();

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Expo Push API로 단일 알림 발송
 */
async function sendPush(token, title, body, data = {}) {
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
        data,
      }),
    });
    const result = await resp.json();
    if (result.data?.status === "error") {
      const detail = result.data.details?.error;
      if (detail === "DeviceNotRegistered" || detail === "InvalidCredentials") {
        // 토큰 무효화
        const users = await db
          .collection("users")
          .where("expoPushToken", "==", token)
          .get();
        users.forEach((doc) => doc.ref.update({ expoPushToken: null }));
      }
    }
  } catch (err) {
    console.error("Push send error:", err);
  }
}

/**
 * 사용자의 토큰과 알림 설정 확인
 */
async function getUserTokenIfAllowed(uid, settingKey) {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) return null;

  const token = userDoc.data().expoPushToken;
  if (!token) return null;

  const prefsDoc = await db
    .collection("users")
    .doc(uid)
    .collection("preferences")
    .doc("notifications")
    .get();

  // 설정 문서가 없으면 기본 ON
  if (prefsDoc.exists && prefsDoc.data()[settingKey] === false) return null;

  return token;
}

// ─── 1. 댓글 답글 알림 ───
exports.onCommentReply = functions.firestore
  .document("comments/{docId}/entries/{entryId}")
  .onCreate(async (snap, context) => {
    const entry = snap.data();
    if (!entry.parentId) return; // 답글이 아니면 무시

    // 부모 댓글 조회
    const parentRef = db
      .collection("comments")
      .doc(context.params.docId)
      .collection("entries")
      .doc(entry.parentId);
    const parentSnap = await parentRef.get();
    if (!parentSnap.exists) return;

    const parentAuthorUid = parentSnap.data().authorUid;
    if (!parentAuthorUid || parentAuthorUid === entry.authorUid) return; // 자기 자신에게는 발송 안함

    const token = await getUserTokenIfAllowed(parentAuthorUid, "commentReplies");
    if (!token) return;

    const authorName = entry.authorName || "누군가";
    await sendPush(
      token,
      "Ailon",
      `${authorName}님이 댓글에 답글을 남겼습니다`,
      { tab: "index" },
    );
  });

// ─── 2. 좋아요 알림 ───
exports.onReactionUpdate = functions.firestore
  .document("reactions/{docId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    const prevLikedBy = before.likedBy || [];
    const newLikedBy = after.likedBy || [];

    // 새로 추가된 UID 감지
    const addedUids = newLikedBy.filter((uid) => !prevLikedBy.includes(uid));
    if (addedUids.length === 0) return;

    const contentAuthorUid = after.contentAuthorUid;
    if (!contentAuthorUid) return;

    // 자기 자신 좋아요는 알림 안함
    const externalLikers = addedUids.filter((uid) => uid !== contentAuthorUid);
    if (externalLikers.length === 0) return;

    const token = await getUserTokenIfAllowed(contentAuthorUid, "likes");
    if (!token) return;

    await sendPush(
      token,
      "Ailon",
      "누군가 회원님의 글을 좋아합니다",
      { tab: "index" },
    );
  });
