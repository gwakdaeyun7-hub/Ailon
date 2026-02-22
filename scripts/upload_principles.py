"""
학문 원리 데이터를 Firestore에 업로드하는 스크립트
초기 설정 시 한 번만 실행
"""

import os
import sys
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()


def initialize_firebase():
    """Firebase 초기화"""
    try:
        firebase_admin.get_app()
        print("✓ Firebase already initialized")
    except ValueError:
        cred_json = os.getenv('FIREBASE_CREDENTIALS')
        if cred_json:
            cred_dict = json.loads(cred_json)
            cred = credentials.Certificate(cred_dict)
        else:
            cred_path = os.path.join(os.path.dirname(__file__), '..', 'firebase-credentials.json')
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
            else:
                print("❌ Firebase credentials not found")
                sys.exit(1)

        firebase_admin.initialize_app(cred)
        print("✓ Firebase initialized")


def load_principles():
    """principles.json 파일 로드"""
    principles_path = os.path.join(os.path.dirname(__file__), '..', 'content', 'principles.json')

    if not os.path.exists(principles_path):
        print(f"❌ principles.json not found at {principles_path}")
        sys.exit(1)

    with open(principles_path, 'r', encoding='utf-8') as f:
        principles = json.load(f)

    print(f"✓ Loaded {len(principles)} principles from file")
    return principles


def upload_to_firestore(principles):
    """Firestore에 원리 데이터 업로드"""
    print("\n💾 Uploading principles to Firestore...")

    db = firestore.client()
    batch = db.batch()

    for principle in principles:
        doc_ref = db.collection('principles').document(principle['id'])
        batch.set(doc_ref, principle)
        print(f"  ✓ Queued: {principle['title']}")

    # 배치 커밋
    batch.commit()
    print(f"\n✓ Successfully uploaded {len(principles)} principles")


def verify_upload():
    """업로드 확인"""
    print("\n🔍 Verifying upload...")

    db = firestore.client()
    principles_ref = db.collection('principles')
    docs = principles_ref.stream()

    count = sum(1 for _ in docs)
    print(f"✓ Found {count} documents in Firestore")


def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("📚 Principles Upload Script")
    print("=" * 60)

    # Firebase 초기화
    initialize_firebase()

    # 원리 데이터 로드
    principles = load_principles()

    # Firestore에 업로드
    upload_to_firestore(principles)

    # 확인
    verify_upload()

    print("\n" + "=" * 60)
    print("✅ Upload completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
