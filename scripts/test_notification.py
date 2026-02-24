"""테스트 알림 전송 스크립트"""
import os
import sys
import json
import urllib.request

# Windows 콘솔 인코딩 문제 방지
sys.stdout.reconfigure(encoding='utf-8')

import firebase_admin
from firebase_admin import credentials, firestore

# Firebase 초기화 (기존 파이프라인과 동일한 방식)
if not firebase_admin._apps:
    cred_json = os.getenv("FIREBASE_CREDENTIALS")
    if cred_json:
        cred = credentials.Certificate(json.loads(cred_json))
    else:
        cred_path = os.path.join(os.path.dirname(__file__), "..", "firebase-credentials.json")
        cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Firestore에서 expoPushToken이 있는 유저 조회
from google.cloud.firestore_v1.base_query import FieldFilter
users = db.collection("users").where(filter=FieldFilter("expoPushToken", "!=", "")).stream()
tokens = []
for u in users:
    data = u.to_dict()
    token = data.get("expoPushToken")
    if token:
        tokens.append(token)
        print(f"  token found: {u.id} -> {token}")

if not tokens:
    print("NO TOKEN FOUND. Open the app and allow notification permission.")
    sys.exit(1)

print(f"\nSending test notification to {len(tokens)} token(s)...")

messages = [
    {
        "to": token,
        "title": "Ailon Test",
        "body": "Notification is working!",
        "data": {"tab": "index"},
    }
    for token in tokens
]

req = urllib.request.Request(
    "https://exp.host/--/api/v2/push/send",
    data=json.dumps(messages).encode(),
    headers={"Content-Type": "application/json"},
)
resp = urllib.request.urlopen(req)
result = json.loads(resp.read())
print(f"\nResponse: {json.dumps(result, indent=2)}")
