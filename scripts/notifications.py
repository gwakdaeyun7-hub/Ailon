# -*- coding: utf-8 -*-
"""
뉴스 푸시 알림 발송 — Expo Push API
파이프라인 완료 후 호출되어 알림 설정 ON인 사용자에게 발송
"""

import requests
from agents.config import get_firestore_client

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def _collect_tokens(db) -> list[str]:
    """expoPushToken이 있고 newsAlerts가 OFF가 아닌 사용자 토큰 수집"""
    tokens = []
    users = db.collection("users").stream()

    for user_doc in users:
        data = user_doc.to_dict()
        token = data.get("expoPushToken")
        if not token:
            continue

        # preferences/notifications 문서 확인 (없으면 기본 ON)
        prefs_ref = db.collection("users").document(user_doc.id).collection("preferences").document("notifications")
        prefs = prefs_ref.get()
        if prefs.exists and prefs.to_dict().get("newsAlerts") is False:
            continue

        tokens.append(token)

    return tokens


def _send_batch(tokens: list[str], title: str, body: str) -> list[str]:
    """Expo Push API로 배치 발송. 실패 토큰 목록 반환."""
    failed_tokens = []

    # Expo는 한 번에 최대 100개씩 발송
    for i in range(0, len(tokens), 100):
        batch = tokens[i:i + 100]
        messages = [
            {
                "to": token,
                "sound": "default",
                "title": title,
                "body": body,
                "data": {"tab": "index"},
            }
            for token in batch
        ]

        try:
            resp = requests.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
            resp.raise_for_status()

            results = resp.json().get("data", [])
            for j, result in enumerate(results):
                if result.get("status") == "error":
                    detail = result.get("details", {})
                    if detail.get("error") in ("DeviceNotRegistered", "InvalidCredentials"):
                        failed_tokens.append(batch[j])
        except requests.RequestException as e:
            print(f"  [알림] 배치 발송 실패: {e}")

    return failed_tokens


def _cleanup_tokens(db, failed_tokens: list[str]):
    """실패한 토큰(등록 해제된 기기) 정리"""
    if not failed_tokens:
        return

    from google.cloud.firestore_v1.base_query import FieldFilter

    for token in failed_tokens:
        docs = db.collection("users").where(
            filter=FieldFilter("expoPushToken", "==", token)
        ).stream()
        for d in docs:
            d.reference.update({"expoPushToken": None})

    print(f"  [알림] 실패 토큰 {len(failed_tokens)}개 정리 완료")


def send_news_notification(article_count: int = 0):
    """뉴스 파이프라인 완료 후 푸시 알림 발송"""
    db = get_firestore_client()
    tokens = _collect_tokens(db)

    if not tokens:
        print("  [알림] 발송 대상 없음 (토큰 0개)")
        return

    title = "Ailon AI 트렌드"
    body = f"오늘의 AI 뉴스 {article_count}개가 도착했어요!" if article_count else "오늘의 AI 뉴스가 도착했어요!"

    print(f"  [알림] {len(tokens)}명에게 발송 중...")
    failed = _send_batch(tokens, title, body)
    _cleanup_tokens(db, failed)
    print(f"  [알림] 발송 완료: 성공 {len(tokens) - len(failed)}명, 실패 {len(failed)}명")
