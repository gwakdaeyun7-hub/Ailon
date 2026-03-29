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
  huggingface_blog: "Hugging Face", geeknews: "GeekNews",
  the_decoder: "The Decoder", marktechpost: "MarkTechPost",
  arstechnica_ai: "Ars Technica AI", the_rundown_ai: "The Rundown AI",
};

const SOURCE_NAMES_I18N = {
  aitimes: { ko: "AI\uD0C0\uC784\uC2A4", en: "AI Times" },
  zdnet_ai_editor: { ko: "ZDNet AI \uC5D0\uB514\uD130", en: "ZDNet AI Editor" },
  yozm_ai: { ko: "\uC694\uC998IT AI", en: "Yozm IT AI" },
};

function getSourceName(key, lang) {
  if (SOURCE_NAMES_I18N[key]) return SOURCE_NAMES_I18N[key][lang] || SOURCE_NAMES_I18N[key].en;
  return SOURCE_NAMES[key] || key;
}

const CATEGORY_COLORS = {
  research: "#7C3AED", models_products: "#0891B2", industry_business: "#D97706",
};

const CATEGORY_NAMES = {
  ko: { research: "\uC5F0\uAD6C", models_products: "\uBAA8\uB378/\uC81C\uD488", industry_business: "\uC0B0\uC5C5/\uBE44\uC988\uB2C8\uC2A4" },
  en: { research: "Research", models_products: "Models & Products", industry_business: "Industry & Business" },
};

const LABELS = {
  ko: { whyImportant: "\uC65C \uC911\uC694\uD574\uC694?", openApp: "AILON \uC571\uC5D0\uC11C \uBCF4\uAE30", readOriginal: "\uC6D0\uBB38 \uBCF4\uAE30", footer: "AI Insight Linked On Network", notFound: "\uAE30\uC0AC\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4", glossary: "\uC6A9\uC5B4 \uD574\uC124" },
  en: { whyImportant: "Why It Matters", openApp: "Open in AILON", readOriginal: "Read Original", footer: "AI Insight Linked On Network", notFound: "Article not found", glossary: "Glossary" },
};

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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

function formatDate(str, lang, dateEstimated) {
  if (!str) return "";
  try {
    let formatted = "";
    const m = str.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
    if (m) {
      formatted = lang === "en"
        ? `${EN_MONTHS[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)}, ${m[1]}`
        : `${m[1]}/${m[2]}/${m[3]}`;
    } else {
      const d = new Date(str);
      if (isNaN(d.getTime())) return "";
      formatted = lang === "en"
        ? `${EN_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
        : `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    }
    return dateEstimated ? `~${formatted}` : formatted;
  } catch { return ""; }
}

function detectLang(req) {
  if (req.query.lang === "ko" || req.query.lang === "en") return req.query.lang;
  const accept = req.headers["accept-language"] || "";
  if (accept.toLowerCase().includes("ko")) return "ko";
  return "en";
}

function getBackground(a, lang) {
  if (lang === "en" && a.background_en) return a.background_en;
  return a.background || "";
}

function getGlossary(a, lang) {
  if (lang === "en" && a.glossary_en && a.glossary_en.length) return a.glossary_en;
  return a.glossary || [];
}

function calcReadMin(oneLine, sections, whyImportant) {
  const text = [oneLine, ...sections.map((s) => s.content), whyImportant].join("");
  return Math.max(1, Math.round(text.length / 500));
}

function buildArticleHTML(article, articleId, lang) {
  const l = LABELS[lang] || LABELS.en;
  const catNames = CATEGORY_NAMES[lang] || CATEGORY_NAMES.en;
  const title = getTitle(article, lang);
  const oneLine = getOneLine(article, lang);
  const sections = getSections(article, lang);
  const whyImportant = getWhyImportant(article, lang);
  const background = getBackground(article, lang);
  const tags = (lang === "en" && article.tags_en && article.tags_en.length) ? article.tags_en : (article.tags || []);
  const glossary = getGlossary(article, lang);
  const sourceColor = SOURCE_COLORS[article.source_key || article.source || ""] || "#000000";
  const sourceName = getSourceName(article.source_key || article.source || "", lang);
  const catColor = CATEGORY_COLORS[article.category || ""] || "#666";
  const catName = catNames[article.category || ""] || "";
  const date = formatDate(article.published, lang, article.date_estimated);
  const readMin = calcReadMin(oneLine, sections, whyImportant);
  const imgUrl = article.image_url || "";
  const ogImg = imgUrl || `https://${HOSTING_DOMAIN}/og-default.png`;
  const pageUrl = `https://${HOSTING_DOMAIN}/article/${articleId}`;

  const sectionsHTML = sections.map((s, i) => `
    <div style="margin-top:${i === 0 ? 0 : 32}px">
      ${s.subtitle ? `<div class="section-subtitle">${esc(s.subtitle)}</div>` : ""}
      <div class="section-content">${esc(s.content)}</div>
    </div>`).join("");

  const tagsHTML = tags.map((t) =>
    `<span class="tag">#${esc(t)}</span>`
  ).join("");

  const glossaryHTML = glossary.length ? `
    <div class="glossary">
      <details>
        <summary class="glossary-toggle">${esc(l.glossary)}<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
        <div class="glossary-list">
          ${glossary.map((g, i) => `
            <div class="glossary-item" style="${i < glossary.length - 1 ? "margin-bottom:10px" : ""}">
              <div class="glossary-term">${esc(g.term)}</div>
              <div class="glossary-desc">${esc(g.desc)}</div>
            </div>`).join("")}
        </div>
      </details>
    </div>` : "";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
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
<link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;700;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{color-scheme:light only}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F5F5F4;color:#000;min-height:100vh}
.header{max-width:480px;margin:0 auto;background:#fff;border-bottom:1px solid #E7E5E4;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
.logo{display:flex;align-items:center;gap:8px;font-size:18px;font-weight:800;color:#000;letter-spacing:1.5px}
.logo img{width:28px;height:28px;border-radius:6px}
.header-btn{background:transparent;border:1.5px solid #000;color:#000;font-weight:700;font-size:12px;padding:8px 16px;border-radius:8px;text-decoration:none}
.card{max-width:480px;margin:0 auto;background:#fff}
.thumb{width:100%;height:200px;object-fit:cover;display:block}
.body{padding:20px}
.meta{display:flex;align-items:center;flex-wrap:wrap;gap:6px}
.source-badge{padding:4px 8px;font-size:11px;font-weight:700;border-radius:8px}
.date{font-size:11px;color:#000;margin-left:auto}
.read-time{display:inline-flex;align-items:center;gap:3px;font-size:11px;color:#000}
.read-time svg{vertical-align:middle}
.divider{height:1px;background:#E7E5E4;margin-top:24px}
h1{font-family:'Lora',serif;font-size:22px;font-weight:900;line-height:32px;letter-spacing:-0.3px;margin-top:8px;color:#000}
.one-line{margin-top:16px}
.one-line p{font-size:16px;font-weight:600;color:#000;line-height:26px}
.background-text{font-size:14px;font-weight:400;line-height:23px;letter-spacing:0.2px;color:#000;margin-top:20px}
.sections{margin-top:24px}
.section-subtitle{font-family:'Lora',serif;font-size:18px;font-weight:700;line-height:26px;letter-spacing:-0.2px;color:#000;margin-bottom:10px}
.section-content{font-size:15px;font-weight:400;line-height:24px;color:#000}
.why{margin-top:24px}
.why-label{font-family:'Lora',serif;font-size:16px;font-weight:700;line-height:26px;color:#000;margin-bottom:8px}
.why-text{font-size:15px;font-weight:400;line-height:26px;letter-spacing:0.2px;color:#000}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:24px}
.tag{display:inline-block;background:#F5F2EE;border-radius:14px;padding:3px 8px;font-size:10px;font-weight:600;color:#000}
.glossary{margin-top:24px}
.glossary-toggle{font-size:11px;font-weight:600;letter-spacing:1.5px;color:#000;text-transform:uppercase;cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between}
.glossary-toggle::-webkit-details-marker{display:none}
.glossary-toggle svg{transition:transform 0.2s}
details[open] .glossary-toggle svg{transform:rotate(180deg)}
.glossary-list{padding-top:10px;padding-left:12px}
.glossary-term{font-size:12px;font-weight:600;color:#000;margin-bottom:1px}
.glossary-desc{font-size:11px;color:#000;line-height:17px}
.original-btn{display:flex;align-items:center;justify-content:center;gap:8px;background:#F5F2EE;border:none;border-radius:14px;padding:13px 20px;margin:32px 0 8px;text-decoration:none;min-height:44px}
.original-btn span{font-size:15px;font-weight:700;color:#000}
.original-btn svg{flex-shrink:0}
.footer{border-top:1px solid #E7E5E4;padding:16px 20px;text-align:center}
.footer-brand{font-size:13px;font-weight:700;color:#000;letter-spacing:0.5px}
.footer-sub{font-size:11px;color:#999;margin-top:2px}
</style>
</head>
<body>
<div class="header">
  <span class="logo"><img src="/ailon_logo.png" alt="AILON">AILON</span>
  <a class="header-btn" href="ailon://article/${esc(articleId)}?lang=${lang}">${esc(l.openApp)}</a>
</div>
<div class="card">
  ${imgUrl ? `<img class="thumb" src="${esc(imgUrl)}" alt="${esc(title)}" onerror="this.style.display='none'">` : ""}
  <div class="body">
    <div class="meta">
      ${sourceName ? `<span class="source-badge" style="background:${esc(sourceColor)}18;color:${esc(sourceColor)}">${esc(sourceName)}</span>` : ""}
      <span class="read-time"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${readMin}${lang === "ko" ? "\uBD84" : " min"}</span>
      ${date ? `<span class="date">${esc(date)}</span>` : ""}
    </div>
    <h1>${esc(title)}</h1>
    ${oneLine ? `<div class="one-line"><p>${esc(oneLine)}</p></div>` : ""}
    ${background ? `<div class="background-text">${esc(background)}</div>` : ""}
    ${oneLine ? `<div class="divider"></div>` : ""}
    ${sections.length ? `<div class="sections">${sectionsHTML}</div>` : ""}
    ${whyImportant ? `<div class="divider"></div><div class="why"><div class="why-label">${esc(l.whyImportant)}</div><div class="why-text">${esc(whyImportant)}</div></div>` : ""}
    ${tags.length ? `<div class="tags">${tagsHTML}</div>` : ""}
    ${glossaryHTML}
    ${article.link ? `<a class="original-btn" href="${esc(article.link)}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg><span>${esc(l.readOriginal)}</span></a>` : ""}
  </div>
  <div class="footer">
    <div class="footer-brand">AILON</div>
    <div class="footer-sub">${esc(l.footer)}</div>
  </div>
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
.logo{font-size:28px;font-weight:800;color:#000;letter-spacing:2px;margin-bottom:24px}
h1{font-size:18px;font-weight:700;margin-bottom:12px}
p{font-size:14px;color:#666;margin-bottom:24px;line-height:1.5}
.btn{display:inline-block;background:transparent;color:#000;font-weight:700;font-size:14px;padding:12px 28px;border:2px solid #000;text-decoration:none}
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
      res.set("Cache-Control", "public, s-maxage=3600, max-age=300");
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
