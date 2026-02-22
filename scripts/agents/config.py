"""
공통 설정 모듈 - LLM, Firebase 초기화 및 공유 상수
뉴스 카테고리: model_research / product_tools / industry_business (3개)
가로 스크롤: official_announcements / korean_ai / curation (3개)
"""

import os
import json
import threading
import firebase_admin
from firebase_admin import credentials, firestore
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

# ─── 뉴스 카테고리 정의 ───
NEWS_CATEGORIES = {
    "model_research":    "모델/연구",
    "product_tools":     "제품/도구",
    "industry_business": "산업/비즈니스",
}

# 가로 스크롤 섹션 (공식 발표 / 한국 AI / 큐레이션)
HORIZONTAL_SECTIONS = {
    "official_announcements": "공식 발표",
    "korean_ai":              "한국 AI",
    "curation":               "큐레이션",
}


_llm_cache: dict[tuple, ChatGoogleGenerativeAI] = {}
_llm_cache_lock = threading.Lock()


def get_llm(temperature: float = 0.7, max_tokens: int = 2048, thinking: bool = True, json_mode: bool = False):
    """LangChain Google Gemini LLM (캐싱, thinking 토글, JSON 모드 지원)"""
    cache_key = (temperature, max_tokens, thinking, json_mode)
    with _llm_cache_lock:
        if cache_key in _llm_cache:
            return _llm_cache[cache_key]

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found. Set the environment variable before running.")

    kwargs = {
        "model": "gemini-2.5-flash",
        "temperature": temperature,
        "max_tokens": max_tokens,
        "google_api_key": api_key,
    }
    model_kwargs = {}
    if not thinking:
        model_kwargs["thinking"] = {"type": "disabled"}
    if json_mode:
        kwargs["response_mime_type"] = "application/json"
    if model_kwargs:
        kwargs["model_kwargs"] = model_kwargs

    llm = ChatGoogleGenerativeAI(**kwargs)
    with _llm_cache_lock:
        _llm_cache[cache_key] = llm
    return llm



def initialize_firebase():
    """Firebase 초기화"""
    try:
        firebase_admin.get_app()
        print("[OK] Firebase already initialized")
    except ValueError:
        cred_json = os.getenv("FIREBASE_CREDENTIALS")
        if cred_json:
            cred_dict = json.loads(cred_json)
            cred = credentials.Certificate(cred_dict)
        else:
            cred_path = os.path.join(
                os.path.dirname(__file__), "..", "..", "firebase-credentials.json"
            )
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
            else:
                raise ValueError("Firebase credentials not found. Set FIREBASE_CREDENTIALS env var or place firebase-credentials.json.")

        firebase_admin.initialize_app(cred)
        print("[OK] Firebase initialized")


def get_firestore_client():
    """Firestore 클라이언트 반환"""
    return firestore.client()


