# -*- coding: utf-8 -*-
"""
뉴스 푸시 알림 발송 — Firebase Cloud Messaging + Expo Push 폴백
파이프라인 완료 후 호출: 하이라이트 기사 1개의 제목+썸네일을 리치 알림으로 발송
"""

import hashlib
import random
import requests
from firebase_admin import messaging
from agents.config import get_firestore_client

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def _article_id(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest() if url else ""


def _collect_users(db) -> list[dict]:
    """알림 대상 사용자 수집 (token + notificationsEnabled 마스터 토글 + newsAlerts 확인)"""
    users = []
    for user_doc in db.collection("users").select(
        ["fcmToken", "expoPushToken", "language", "notificationsEnabled"]
    ).stream():
        data = user_doc.to_dict()

        # 마스터 토글: notificationsEnabled가 명시적으로 False이면 스킵
        if data.get("notificationsEnabled") is False:
            continue

        fcm_token = data.get("fcmToken")
        expo_token = data.get("expoPushToken")
        if not fcm_token and not expo_token:
            continue

        # preferences/notifications 확인 (없으면 기본 ON)
        prefs_ref = (
            db.collection("users")
            .document(user_doc.id)
            .collection("preferences")
            .document("notifications")
        )
        prefs = prefs_ref.get()
        if prefs.exists and prefs.to_dict().get("newsAlerts") is False:
            continue

        users.append({
            "uid": user_doc.id,
            "fcm_token": fcm_token,
            "expo_token": expo_token,
            "language": data.get("language", "ko"),
        })

    return users


def _pick_highlight(news_result: dict | None) -> dict | None:
    """하이라이트에서 랜덤 1개 선택"""
    if not news_result:
        return None
    highlights = news_result.get("highlights", [])
    if not highlights:
        return None
    return random.choice(highlights)


def _build_content(highlight: dict | None, article_count: int, lang: str) -> tuple[str, str, str]:
    """(title, body, article_id) 빌드"""
    if highlight:
        title_field = "display_title" if lang == "ko" else "display_title_en"
        title = highlight.get(title_field) or highlight.get("display_title") or highlight.get("title", "")
        # one_line을 body로 사용 → 알림에서 제목 + 한줄요약 2줄 표시
        body_field = "one_line" if lang == "ko" else "one_line_en"
        body = highlight.get(body_field) or highlight.get("one_line") or ""
        article_id = _article_id(highlight.get("link", ""))
        return title, body, article_id

    # 하이라이트 없는 폴백
    title = "Ailon AI 트렌드" if lang == "ko" else "Ailon AI Trends"
    return title, "", ""


def _send_fcm_batch(users: list[dict], highlight: dict | None, article_count: int) -> list[str]:
    """FCM으로 알림 발송. 실패 uid 반환."""
    failed_uids = []
    messages = []
    fcm_users = [u for u in users if u.get("fcm_token")]

    for user in fcm_users:
        lang = user.get("language", "ko")
        title, body, article_id = _build_content(highlight, article_count, lang)

        notification = messaging.Notification(
            title=title,
            body=body or None,
        )
        android = messaging.AndroidConfig(
            notification=messaging.AndroidNotification(
                channel_id="news",
                priority="high",
            ),
        )
        data = {"type": "news", "tab": "index"}
        if article_id:
            data["articleId"] = article_id

        messages.append(messaging.Message(
            notification=notification,
            android=android,
            data=data,
            token=user["fcm_token"],
        ))

    if not messages:
        return failed_uids

    # send_each (send_all deprecated)
    response = messaging.send_each(messages)
    for i, send_resp in enumerate(response.responses):
        if not send_resp.success:
            err = send_resp.exception
            if err and hasattr(err, "code"):
                if err.code in ("NOT_FOUND", "UNREGISTERED"):
                    failed_uids.append(fcm_users[i]["uid"])
            print(f"  [알림] FCM 실패: {err}")

    return failed_uids


def _send_expo_fallback(users: list[dict], highlight: dict | None, article_count: int) -> list[str]:
    """FCM 토큰 없는 사용자에게 Expo Push API 폴백 (이미지 미지원)"""
    expo_users = [u for u in users if not u.get("fcm_token") and u.get("expo_token")]
    if not expo_users:
        return []

    failed_tokens = []

    for i in range(0, len(expo_users), 100):
        batch = expo_users[i : i + 100]
        messages = []
        for user in batch:
            lang = user.get("language", "ko")
            title, body, article_id = _build_content(highlight, article_count, lang)
            msg = {
                "to": user["expo_token"],
                "sound": "default",
                "title": title,
                "body": body,
                "channelId": "news",
                "data": {"type": "news", "tab": "index"},
            }
            if article_id:
                msg["data"]["articleId"] = article_id
            messages.append(msg)

        try:
            resp = requests.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={"Accept": "application/json", "Content-Type": "application/json"},
                timeout=30,
            )
            resp.raise_for_status()
            results = resp.json().get("data", [])
            for j, result in enumerate(results):
                if result.get("status") == "error":
                    detail = result.get("details", {})
                    if detail.get("error") in ("DeviceNotRegistered", "InvalidCredentials"):
                        failed_tokens.append(batch[j]["uid"])
        except requests.RequestException as e:
            print(f"  [알림] Expo 배치 발송 실패: {e}")

    return failed_tokens


def _cleanup_failed(db, failed_uids: list[str]):
    """실패한 토큰 정리 (등록 해제된 기기)"""
    for uid in failed_uids:
        try:
            db.collection("users").document(uid).update({
                "fcmToken": None,
                "expoPushToken": None,
            })
        except Exception:
            pass
    if failed_uids:
        print(f"  [알림] 실패 토큰 {len(failed_uids)}개 정리 완료")


def send_news_notification(article_count: int = 0, news_result: dict | None = None):
    """뉴스 파이프라인 완료 후 리치 푸시 알림 발송

    하이라이트 기사 중 랜덤 1개의 제목을 알림 타이틀로,
    썸네일 이미지를 FCM 이미지로 포함하여 발송.
    """
    db = get_firestore_client()
    users = _collect_users(db)

    if not users:
        print("  [알림] 발송 대상 없음 (토큰 0개)")
        return

    highlight = _pick_highlight(news_result)
    if highlight:
        title_preview = highlight.get('display_title', '')[:60]
        body_preview = highlight.get('one_line', '')[:60]
        print(f"  [알림] 하이라이트 선택: {title_preview}")
        print(f"  [알림] 알림 본문(one_line): {body_preview}")
    else:
        print("  [알림] 하이라이트 없음 — 기본 알림 발송")

    fcm_count = sum(1 for u in users if u.get("fcm_token"))
    expo_count = len(users) - fcm_count
    print(f"  [알림] 대상 {len(users)}명 (FCM {fcm_count}, Expo {expo_count})")

    failed_uids = []
    if fcm_count:
        failed_uids.extend(_send_fcm_batch(users, highlight, article_count))

    expo_failed = _send_expo_fallback(users, highlight, article_count)
    failed_uids.extend(expo_failed)

    _cleanup_failed(db, failed_uids)

    total = len(users)
    failed = len(failed_uids)
    print(f"  [알림] 발송 완료: 성공 {total - failed}명, 실패 {failed}명")
