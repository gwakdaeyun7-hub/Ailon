"""
공통 설정 모듈 - LLM, Firebase 초기화 및 공유 상수
뉴스 카테고리: model_research / product_tools / industry_business (3개)
가로 스크롤: official_announcements / korean_ai / curation (3개)
"""

import os
import sys
import json
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

# 카테고리별 키워드 (분류 보조용)
CATEGORY_KEYWORDS = {
    "model_research": [
        "llm", "slm", "gpt", "claude", "gemini", "llama", "mistral",
        "model", "paper", "research", "arxiv", "benchmark",
        "attention", "transformer", "architecture",
        "parameter", "training", "fine-tuning", "inference",
        "foundation model", "multimodal", "vision language",
        "scaling", "moe", "mixture of experts", "quantization",
        "diffusion", "weights", "dataset", "evaluation",
        "hugging face", "deepseek", "qwen",
    ],
    "product_tools": [
        "launch", "release", "product", "app", "tool", "framework",
        "sdk", "api", "github", "open source", "library",
        "plugin", "extension", "update", "version",
        "developer", "code", "cli", "platform",
        "langchain", "langgraph", "crewai", "autogen",
        "ollama", "vllm", "cursor", "copilot",
        "agent", "agentic", "rag", "retrieval",
        "mcp", "model context protocol",
    ],
    "industry_business": [
        "funding", "investment", "startup", "vc", "valuation",
        "acquisition", "partnership", "revenue", "enterprise",
        "regulation", "policy", "law", "legislation",
        "safety", "alignment", "ethics", "governance",
        "market", "competition", "strategy", "business",
        "microsoft", "google", "meta", "openai", "anthropic",
        "trend", "report", "analysis", "industry",
        "robot", "robotics", "autonomous driving",
    ],
}


_llm_cache: dict[tuple, ChatGoogleGenerativeAI] = {}


def get_llm(temperature: float = 0.7, max_tokens: int = 2048, thinking: bool = True):
    """LangChain Google Gemini LLM (캐싱, thinking 토글 지원)"""
    cache_key = (temperature, max_tokens, thinking)
    if cache_key in _llm_cache:
        return _llm_cache[cache_key]

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("[ERROR] GOOGLE_API_KEY not found")
        sys.exit(1)

    kwargs = {
        "model": "gemini-2.5-flash",
        "temperature": temperature,
        "max_tokens": max_tokens,
        "google_api_key": api_key,
    }
    if not thinking:
        kwargs["model_kwargs"] = {"thinking": {"type": "disabled"}}

    llm = ChatGoogleGenerativeAI(**kwargs)
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
                print("[ERROR] Firebase credentials not found")
                sys.exit(1)

        firebase_admin.initialize_app(cred)
        print("[OK] Firebase initialized")


def get_firestore_client():
    """Firestore 클라이언트 반환"""
    return firestore.client()


