/**
 * Ailon Cloud Functions (v2)
 * 1) 댓글 답글 알림 — comments/{docId}/entries/{entryId} onCreate
 * 2) 좋아요 알림 — reactions/{docId} onUpdate (5분 디바운싱)
 * 3) 기사 웹 공유 페이지 — /article/{articleId} SSR
 * 4) 계정 삭제 — deleteUserData callable (모든 사용자 데이터 서버사이드 삭제)
 *
 * 이중언어 지원 (users/{uid}.language), 딥링크 데이터 포함
 * 알림: notificationsEnabled 마스터 토글 + preferences/notifications 개별 제어
 */

const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
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
 * - notificationsEnabled === false 이면 모든 알림 스킵 (마스터 토글)
 * - preferences/notifications 의 개별 설정으로 세부 제어
 * @returns {{ token: string, lang: string } | null}
 */
async function getUserInfo(uid, settingKey) {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) return null;

  const data = userDoc.data();

  // Master toggle: notificationsEnabled가 명시적으로 false면 스킵
  if (data.notificationsEnabled === false) return null;

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

// ─── 3. 기사 웹 공유 페이지 ───

const HOSTING_DOMAIN = "ailon-46131.web.app";

const SOURCE_COLORS = {
  wired_ai: "#000000", the_verge_ai: "#E1127A", techcrunch_ai: "#0A9E01",
  mit_tech_review: "#D32F2F", venturebeat: "#77216F", deepmind_blog: "#1D4ED8",
  nvidia_blog: "#76B900", huggingface_blog: "#FFD21E", aitimes: "#E53935",
  geeknews: "#FF6B35", zdnet_ai_editor: "#D32F2F", yozm_ai: "#6366F1",
  the_decoder: "#1A1A2E", marktechpost: "#0D47A1", arstechnica_ai: "#FF4611",
  the_rundown_ai: "#6C5CE7",
};

const SOURCE_NAMES = {
  wired_ai: "Wired AI", the_verge_ai: "The Verge AI", techcrunch_ai: "TechCrunch AI",
  mit_tech_review: "MIT Tech Review", venturebeat: "VentureBeat",
  deepmind_blog: "Google DeepMind", nvidia_blog: "NVIDIA AI",
  huggingface_blog: "Hugging Face", aitimes: "AI\uD0C0\uC784\uC2A4",
  geeknews: "GeekNews", zdnet_ai_editor: "ZDNet AI", yozm_ai: "\uC694\uC998IT",
  the_decoder: "The Decoder", marktechpost: "MarkTechPost",
  arstechnica_ai: "Ars Technica AI", the_rundown_ai: "The Rundown AI",
};

const CATEGORY_COLORS = {
  research: "#7C3AED", models_products: "#0891B2", industry_business: "#D97706",
};

const CATEGORY_NAMES = {
  ko: { research: "\uC5F0\uAD6C", models_products: "\uBAA8\uB378/\uC81C\uD488", industry_business: "\uC0B0\uC5C5/\uBE44\uC988\uB2C8\uC2A4" },
  en: { research: "Research", models_products: "Models & Products", industry_business: "Industry & Business" },
};

const LABELS = {
  ko: { whyImportant: "\uC65C \uC911\uC694\uD574\uC694?", openApp: "AILON \uC571\uC5D0\uC11C \uBCF4\uAE30", readOriginal: "\uC6D0\uBB38 \uBCF4\uAE30", footer: "AI \uB274\uC2A4 & \uC778\uC0AC\uC774\uD2B8", notFound: "\uAE30\uC0AC\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" },
  en: { whyImportant: "Why It Matters", openApp: "Open in AILON", readOriginal: "Read Original", footer: "AI News & Insights", notFound: "Article not found" },
};

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getTitle(a, lang) {
  if (lang === "en" && a.display_title_en) return a.display_title_en;
  return a.display_title || a.title || "";
}

function getOneLine(a, lang) {
  if (lang === "en" && a.one_line_en) return a.one_line_en;
  return a.one_line || "";
}

function getSections(a, lang) {
  if (lang === "en") {
    if (a.sections_en && a.sections_en.length) return a.sections_en;
    if (a.sections && a.sections.length) return a.sections;
    if (a.key_points_en && a.key_points_en.length) return a.key_points_en.map((p) => ({ subtitle: "", content: p }));
    if (a.key_points && a.key_points.length) return a.key_points.map((p) => ({ subtitle: "", content: p }));
    return [];
  }
  if (a.sections && a.sections.length) return a.sections;
  if (a.key_points && a.key_points.length) return a.key_points.map((p) => ({ subtitle: "", content: p }));
  return [];
}

function getWhyImportant(a, lang) {
  if (lang === "en" && a.why_important_en) return a.why_important_en;
  return a.why_important || "";
}

function formatDate(str, lang) {
  if (!str) return "";
  try {
    const m = str.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
    if (m) {
      if (lang === "en") return `${EN_MONTHS[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)}, ${m[1]}`;
      return `${m[1]}/${m[2]}/${m[3]}`;
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return "";
    if (lang === "en") return `${EN_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  } catch { return ""; }
}

function detectLang(req) {
  if (req.query.lang === "ko" || req.query.lang === "en") return req.query.lang;
  const accept = req.headers["accept-language"] || "";
  if (accept.toLowerCase().includes("ko")) return "ko";
  return "en";
}

function buildArticleHTML(article, articleId, lang) {
  const l = LABELS[lang] || LABELS.en;
  const catNames = CATEGORY_NAMES[lang] || CATEGORY_NAMES.en;
  const title = getTitle(article, lang);
  const oneLine = getOneLine(article, lang);
  const sections = getSections(article, lang);
  const whyImportant = getWhyImportant(article, lang);
  const tags = (lang === "en" && article.tags_en && article.tags_en.length) ? article.tags_en : (article.tags || []);
  const sourceColor = SOURCE_COLORS[article.source_key || ""] || "#5EEAD4";
  const sourceName = SOURCE_NAMES[article.source_key || ""] || article.source_key || "";
  const catColor = CATEGORY_COLORS[article.category || ""] || "#666";
  const catName = catNames[article.category || ""] || "";
  const date = formatDate(article.published, lang);
  const imgUrl = article.image_url || "";
  const ogImg = imgUrl || `https://${HOSTING_DOMAIN}/og-default.png`;
  const pageUrl = `https://${HOSTING_DOMAIN}/article/${articleId}`;

  const sectionsHTML = sections.map((s, i) => `
    <div style="margin-top:${i === 0 ? 0 : 16}px;${i > 0 ? "border-top:1px solid #E7E5E4;padding-top:16px;" : ""}">
      ${s.subtitle ? `<div style="font-family:'Lora',serif;font-size:14px;font-weight:700;margin-bottom:4px">${esc(s.subtitle)}</div>` : ""}
      <div style="font-size:14px;line-height:1.6;color:#000">${esc(s.content)}</div>
    </div>`).join("");

  const tagsHTML = tags.slice(0, 5).map((t) =>
    `<span style="display:inline-block;background:#F5F2EE;padding:4px 10px;font-size:11px;margin:0 6px 6px 0">${esc(t)}</span>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — AILON</title>
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(oneLine)}">
<meta property="og:image" content="${esc(ogImg)}">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:site_name" content="AILON">
<meta property="og:locale" content="${lang === "ko" ? "ko_KR" : "en_US"}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(oneLine)}">
<meta name="twitter:image" content="${esc(ogImg)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F5F5F4;color:#000;min-height:100vh}
.header{background:#fff;border-bottom:2px solid #000;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
.logo{font-size:18px;font-weight:800;color:#5EEAD4;letter-spacing:1.5px}
.header-btn{background:#5EEAD4;color:#000;font-weight:700;font-size:12px;padding:8px 16px;border:2px solid #000;text-decoration:none}
.card{max-width:480px;margin:16px auto;background:#fff;border:2px solid #000;overflow:hidden}
.thumb{width:100%;max-height:240px;object-fit:cover;display:block;border-bottom:2px solid #000}
.body{padding:20px}
.meta{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.badge{padding:3px 8px;font-size:11px;font-weight:700;color:#fff}
.date{font-size:11px;color:#666}
.cat{font-size:11px;font-weight:600}
h1{font-family:'Lora',serif;font-size:20px;font-weight:700;line-height:1.4;margin-bottom:16px}
.one-line{background:#F0FDFA;border:2px solid #99F6E4;padding:14px;margin-bottom:18px}
.one-line p{font-size:14px;font-weight:600;color:#0D9488;line-height:1.5}
.sections{margin-bottom:18px}
.why{margin-bottom:18px}
.why-label{font-family:'Lora',serif;font-size:13px;font-weight:700;color:#666;margin-bottom:8px}
.why-text{font-size:14px;line-height:1.6}
.tags{margin-bottom:18px}
.footer{border-top:2px solid #000;padding:16px 20px;display:flex;align-items:center;justify-content:space-between}
.footer-logo{font-size:14px;font-weight:800;color:#5EEAD4;letter-spacing:1px}
.footer-sub{font-size:11px;color:#999}
.cta{display:block;text-align:center;background:#5EEAD4;color:#000;font-weight:700;font-size:15px;padding:14px;border-top:2px solid #000;text-decoration:none}
.original{display:block;text-align:center;font-size:13px;color:#666;padding:12px;border-top:1px solid #E7E5E4;text-decoration:underline}
</style>
</head>
<body>
<div class="header">
  <span class="logo">AILON</span>
  <a class="header-btn" href="ailon://article/${esc(articleId)}">${esc(l.openApp)}</a>
</div>
<div class="card">
  ${imgUrl ? `<img class="thumb" src="${esc(imgUrl)}" alt="">` : ""}
  <div class="body">
    <div class="meta">
      ${sourceName ? `<span class="badge" style="background:${esc(sourceColor)}">${esc(sourceName)}</span>` : ""}
      ${date ? `<span class="date">${esc(date)}</span>` : ""}
      ${catName ? `<span class="cat" style="color:${esc(catColor)}">${esc(catName)}</span>` : ""}
    </div>
    <h1>${esc(title)}</h1>
    ${oneLine ? `<div class="one-line"><p>${esc(oneLine)}</p></div>` : ""}
    ${sections.length ? `<div class="sections">${sectionsHTML}</div>` : ""}
    ${whyImportant ? `<div class="why"><div class="why-label">${esc(l.whyImportant)}</div><div class="why-text">${esc(whyImportant)}</div></div>` : ""}
    ${tags.length ? `<div class="tags">${tagsHTML}</div>` : ""}
  </div>
  <div class="footer">
    <span class="footer-logo">AILON</span>
    <span class="footer-sub">${esc(l.footer)}</span>
  </div>
  ${article.link ? `<a class="original" href="${esc(article.link)}">${esc(l.readOriginal)}</a>` : ""}
  <a class="cta" href="ailon://article/${esc(articleId)}">${esc(l.openApp)}</a>
</div>
</body>
</html>`;
}

function build404HTML(lang) {
  const l = LABELS[lang] || LABELS.en;
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>AILON — ${esc(l.notFound)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.wrap{text-align:center;max-width:360px}
.logo{font-size:28px;font-weight:800;color:#5EEAD4;letter-spacing:2px;margin-bottom:24px}
h1{font-size:18px;font-weight:700;margin-bottom:12px}
p{font-size:14px;color:#666;margin-bottom:24px;line-height:1.5}
.btn{display:inline-block;background:#5EEAD4;color:#000;font-weight:700;font-size:14px;padding:12px 28px;border:2px solid #000;text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">AILON</div>
  <h1>${esc(l.notFound)}</h1>
  <a class="btn" href="ailon://">${esc(l.openApp)}</a>
</div>
</body>
</html>`;
}

exports.articlePage = onRequest(
  { region: "asia-northeast3" },
  async (req, res) => {
    const pathParts = req.path.split("/").filter(Boolean);
    // /article/{articleId}
    const articleId = pathParts[pathParts.length - 1];
    const lang = detectLang(req);

    if (!articleId || !/^[a-f0-9]{12}$/i.test(articleId)) {
      res.status(404).send(build404HTML(lang));
      return;
    }

    try {
      const doc = await db.collection("articles").doc(articleId).get();
      if (!doc.exists) {
        res.status(404).send(build404HTML(lang));
        return;
      }

      const html = buildArticleHTML(doc.data(), articleId, lang);
      res.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
      res.status(200).send(html);
    } catch (err) {
      console.error("articlePage error:", err);
      res.status(500).send(build404HTML(lang));
    }
  },
);

// ─── 4. 계정 삭제 ───

/**
 * 사용자의 모든 데이터를 서버사이드에서 삭제
 * - users/{uid} 문서 + 서브컬렉션 (bookmarks, learning_history, preferences)
 * - reactions 문서에서 likedBy/dislikedBy 배열에서 uid 제거
 * - comments 중 authorUid == uid 인 엔트리 삭제
 * - profile_photos/{uid} Storage 파일
 * - Firebase Auth 계정
 */
exports.deleteUserData = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const batch_size = 400; // Firestore batch limit is 500, leave margin
    const results = { deleted: [], errors: [] };

    try {
      // 1. Delete user subcollections (bookmarks, learning_history, preferences, read_history)
      const subcollections = ["bookmarks", "learning_history", "preferences", "read_history"];
      for (const sub of subcollections) {
        try {
          let deleted = 0;
          let snap = await db
            .collection("users").doc(uid)
            .collection(sub)
            .limit(batch_size)
            .get();

          while (!snap.empty) {
            const b = db.batch();
            snap.docs.forEach((doc) => b.delete(doc.ref));
            await b.commit();
            deleted += snap.size;

            if (snap.size < batch_size) break;
            snap = await db
              .collection("users").doc(uid)
              .collection(sub)
              .limit(batch_size)
              .get();
          }
          if (deleted > 0) {
            results.deleted.push(`users/${uid}/${sub}: ${deleted} docs`);
          }
        } catch (err) {
          results.errors.push(`${sub}: ${err.message}`);
        }
      }

      // 2. Delete users/{uid} document
      try {
        await db.collection("users").doc(uid).delete();
        results.deleted.push(`users/${uid}`);
      } catch (err) {
        results.errors.push(`users/${uid}: ${err.message}`);
      }

      // 3. Remove uid from reactions (likedBy/dislikedBy arrays)
      try {
        const likedReactions = await db
          .collection("reactions")
          .where("likedBy", "array-contains", uid)
          .get();
        for (const doc of likedReactions.docs) {
          const data = doc.data();
          const newLikedBy = data.likedBy.filter((id) => id !== uid);
          await doc.ref.update({
            likedBy: newLikedBy,
            likes: newLikedBy.length,
          });
        }
        results.deleted.push(`reactions likedBy: ${likedReactions.size} docs`);

        const dislikedReactions = await db
          .collection("reactions")
          .where("dislikedBy", "array-contains", uid)
          .get();
        for (const doc of dislikedReactions.docs) {
          const data = doc.data();
          const newDislikedBy = data.dislikedBy.filter((id) => id !== uid);
          await doc.ref.update({
            dislikedBy: newDislikedBy,
            dislikes: newDislikedBy.length,
          });
        }
        results.deleted.push(`reactions dislikedBy: ${dislikedReactions.size} docs`);
      } catch (err) {
        results.errors.push(`reactions: ${err.message}`);
      }

      // 4. Delete user's comments across all comment threads
      try {
        const commentThreads = await db.collectionGroup("entries")
          .where("authorUid", "==", uid)
          .get();
        const chunks = [];
        for (let i = 0; i < commentThreads.docs.length; i += batch_size) {
          chunks.push(commentThreads.docs.slice(i, i + batch_size));
        }
        for (const chunk of chunks) {
          const b = db.batch();
          chunk.forEach((doc) => b.delete(doc.ref));
          await b.commit();
        }
        results.deleted.push(`comments: ${commentThreads.size} entries`);
      } catch (err) {
        results.errors.push(`comments: ${err.message}`);
      }

      // 5. Delete user_feedback documents
      try {
        const feedbackSnap = await db
          .collection("user_feedback")
          .where("userId", "==", uid)
          .get();
        const batch = db.batch();
        feedbackSnap.docs.forEach((doc) => batch.delete(doc.ref));
        if (!feedbackSnap.empty) await batch.commit();
        results.deleted.push(`user_feedback: ${feedbackSnap.size} docs`);
      } catch (err) {
        results.errors.push(`user_feedback: ${err.message}`);
      }

      // 6. Delete reports by user
      try {
        const reportsSnap = await db
          .collection("reports")
          .where("reporterUid", "==", uid)
          .get();
        const batch = db.batch();
        reportsSnap.docs.forEach((doc) => batch.delete(doc.ref));
        if (!reportsSnap.empty) await batch.commit();
        results.deleted.push(`reports: ${reportsSnap.size} docs`);
      } catch (err) {
        results.errors.push(`reports: ${err.message}`);
      }

      // 7. Delete profile photo from Storage
      try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(`profile_photos/${uid}`);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          results.deleted.push(`profile_photos/${uid}`);
        }
      } catch (err) {
        results.errors.push(`storage: ${err.message}`);
      }

      // 8. Delete Firebase Auth account
      try {
        await admin.auth().deleteUser(uid);
        results.deleted.push("auth account");
      } catch (err) {
        results.errors.push(`auth: ${err.message}`);
      }

      console.log(`deleteUserData [${uid}]:`, JSON.stringify(results));
      return { success: true, results };
    } catch (err) {
      console.error(`deleteUserData [${uid}] fatal:`, err);
      throw new HttpsError("internal", "Failed to delete user data.");
    }
  },
);
