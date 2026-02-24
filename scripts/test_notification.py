"""테스트 알림 전송 스크립트"""
import json
import urllib.request

import firebase_admin
from firebase_admin import credentials, firestore

# Firebase 초기화
if not firebase_admin._apps:
    cred = credentials.Certificate("service-account.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Firestore에서 expoPushToken이 있는 유저 조회
users = db.collection("users").where("expoPushToken", "!=", "").stream()
tokens = []
for u in users:
    data = u.to_dict()
    token = data.get("expoPushToken")
    if token:
        tokens.append(token)
        print(f"  토큰 발견: {u.id} → {token[:30]}...")

if not tokens:
    print("❌ 등록된 푸시 토큰이 없습니다. 앱을 열고 알림 권한을 허용했는지 확인하세요.")
    exit(1)

print(f"\n총 {len(tokens)}개 토큰에 테스트 알림 전송 중...")

messages = [
    {
        "to": token,
        "title": "🔔 Ailon 테스트 알림",
        "body": "알림이 정상 동작합니다!",
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
print(f"✅ 전송 완료: {json.dumps(result, indent=2)}")
