"""
Feature flag 초기화 스크립트
Firestore app_config/social_features 문서를 생성/업데이트합니다.

Usage:
    python init_feature_flags.py
"""

from google.cloud.firestore_v1 import SERVER_TIMESTAMP

from agents.config import initialize_firebase, get_firestore_client


SOCIAL_FEATURES_DOC = "app_config/social_features"

SOCIAL_FEATURES_DATA = {
    "show_like_counts": False,
    "show_comments": False,
    "like_count_threshold": 5,
    "updated_at": SERVER_TIMESTAMP,
}


def init_social_features() -> None:
    """Firestore app_config/social_features 문서를 초기화합니다."""
    initialize_firebase()
    db = get_firestore_client()

    doc_ref = db.collection("app_config").document("social_features")
    doc = doc_ref.get()

    if doc.exists:
        print(f"[SKIP] {SOCIAL_FEATURES_DOC} already exists: {doc.to_dict()}")
        return

    doc_ref.set(SOCIAL_FEATURES_DATA)
    print(f"[OK] {SOCIAL_FEATURES_DOC} created: { {k: v for k, v in SOCIAL_FEATURES_DATA.items() if k != 'updated_at'} }")


if __name__ == "__main__":
    init_social_features()
