"""테스트 알림 전송 스크립트 — FCM 리치 알림 + Expo 폴백"""
import os
import sys
import json

# Windows 콘솔 인코딩 문제 방지
sys.stdout.reconfigure(encoding='utf-8')

import firebase_admin
from firebase_admin import credentials, firestore, messaging

# Firebase 초기화
if not firebase_admin._apps:
    cred_json = os.getenv("FIREBASE_CREDENTIALS")
    if cred_json:
        cred = credentials.Certificate(json.loads(cred_json))
    else:
        cred_path = os.path.join(os.path.dirname(__file__), "..", "firebase-credentials.json")
        cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Firestore에서 토큰이 있는 유저 조회
from google.cloud.firestore_v1.base_query import FieldFilter

print("=== Ailon Notification Test ===\n")

users = db.collection("users").stream()
targets = []
for u in users:
    data = u.to_dict()
    fcm = data.get("fcmToken")
    expo = data.get("expoPushToken")
    lang = data.get("language", "ko")
    if fcm or expo:
        targets.append({"uid": u.id, "fcm": fcm, "expo": expo, "lang": lang})
        print(f"  user: {u.id}")
        print(f"    fcm:  {fcm or '(none)'}")
        print(f"    expo: {expo or '(none)'}")
        print(f"    lang: {lang}")

if not targets:
    print("\nNO TOKENS FOUND. Open the app and allow notification permission.")
    sys.exit(1)

# FCM 테스트 (리치 알림 with 이미지)
fcm_targets = [t for t in targets if t.get("fcm")]
if fcm_targets:
    print(f"\n--- FCM: {len(fcm_targets)} target(s) ---")
    messages = []
    for t in fcm_targets:
        title = "Ailon Test: GPT-5 발표" if t["lang"] == "ko" else "Ailon Test: GPT-5 Announced"
        body = "외 42건의 AI 뉴스가 도착했어요" if t["lang"] == "ko" else "and 42 more AI news today"
        messages.append(messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
                image="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
            ),
            android=messaging.AndroidConfig(
                notification=messaging.AndroidNotification(
                    channel_id="news",
                    priority="high",
                ),
            ),
            data={"type": "news", "tab": "index"},
            token=t["fcm"],
        ))

    response = messaging.send_each(messages)
    for i, r in enumerate(response.responses):
        status = "OK" if r.success else f"FAIL: {r.exception}"
        print(f"  [{fcm_targets[i]['uid']}] {status}")

# Expo 폴백 테스트
import urllib.request
expo_targets = [t for t in targets if not t.get("fcm") and t.get("expo")]
if expo_targets:
    print(f"\n--- Expo fallback: {len(expo_targets)} target(s) ---")
    messages = []
    for t in expo_targets:
        title = "Ailon Test" if t["lang"] == "ko" else "Ailon Test"
        body = "알림 테스트입니다" if t["lang"] == "ko" else "Notification test"
        messages.append({
            "to": t["expo"],
            "title": title,
            "body": body,
            "channelId": "news",
            "data": {"type": "news", "tab": "index"},
        })

    req = urllib.request.Request(
        "https://exp.host/--/api/v2/push/send",
        data=json.dumps(messages).encode(),
        headers={"Content-Type": "application/json"},
    )
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read())
    print(f"  Response: {json.dumps(result, indent=2)}")

print("\nDone!")
