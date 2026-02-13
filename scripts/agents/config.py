"""
공통 설정 모듈 - LLM, Firebase 초기화 및 공유 상수
Phase 1: NEWS_CATEGORIES 추가
Phase 2: CrewAI LLM 지원 추가
"""

import os
import sys
import json
import firebase_admin
from firebase_admin import credentials, firestore
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

# ─── 뉴스 카테고리 정의 (Phase 1) ───
NEWS_CATEGORIES = {
    "models_architecture": "모델&아키텍처",
    "agentic_reality": "에이전틱리얼리티",
    "opensource_code": "오픈소스&코드",
    "physical_ai": "Physical AI",
    "policy_safety": "정책&안전",
}

# 카테고리별 키워드 (분류 보조용)
CATEGORY_KEYWORDS = {
    "models_architecture": [
        "llm", "slm", "gpt", "claude", "gemini", "llama", "mistral",
        "attention", "transformer", "architecture", "benchmark",
        "parameter", "training", "fine-tuning", "inference",
        "model", "foundation model", "multimodal", "vision language",
        "scaling", "moe", "mixture of experts", "quantization",
    ],
    "agentic_reality": [
        "agent", "agentic", "multi-agent", "autonomous", "workflow",
        "tool use", "function calling", "rag", "retrieval",
        "langchain", "langgraph", "crewai", "autogen",
        "reasoning", "planning", "chain of thought", "cot",
        "mcp", "model context protocol", "a2a",
    ],
    "opensource_code": [
        "open source", "github", "repository", "library",
        "framework", "cli", "api", "sdk", "package",
        "hugging face", "ollama", "vllm", "mlx",
        "release", "launch", "update", "version",
        "developer", "code", "programming",
    ],
    "physical_ai": [
        "robot", "robotics", "embodied", "physical",
        "edge ai", "embedded", "iot", "sensor",
        "autonomous driving", "self-driving", "drone",
        "manufacturing", "industrial", "hardware",
        "neuromorphic", "chip", "accelerator", "tpu", "npu",
    ],
    "policy_safety": [
        "regulation", "policy", "law", "legislation",
        "ethics", "ethical", "bias", "fairness",
        "safety", "alignment", "guardrail",
        "privacy", "security", "copyright",
        "governance", "compliance", "eu ai act",
        "deepfake", "misinformation", "responsible ai",
    ],
}

# 학문 분야 정의
DISCIPLINES = {
    "기초과학": {
        "mathematics": {
            "name": "수학",
            "focus": "알고리즘 기초, 선형대수, 확률/통계, 최적화 이론",
            "ai_connection": "AI의 수학적 기반 - 경사하강법, 확률 모델, 행렬 연산"
        },
        "physics": {
            "name": "물리학",
            "focus": "양자컴퓨팅, 열역학, 통계역학, 정보 이론",
            "ai_connection": "양자머신러닝, 물리 시뮬레이션, 에너지 효율적 계산"
        },
        "chemistry": {
            "name": "화학",
            "focus": "분자 구조, 화학 반응, 재료과학, 신약 개발",
            "ai_connection": "AI 신약 발견, 분자 생성 모델, 재료 설계"
        },
    },
    "생명과학": {
        "biology": {
            "name": "생물학",
            "focus": "유전학, 진화론, 생태계, 세포생물학",
            "ai_connection": "유전자 분석, 진화 알고리즘, 생태계 모델링"
        },
        "medicine_neuroscience": {
            "name": "의학/뇌과학",
            "focus": "뇌신경과학, 의료 진단, 인지 메커니즘",
            "ai_connection": "AI 의료 진단, 뇌 모방 신경망, Brain-Computer Interface"
        },
    },
    "공학": {
        "computer_science": {
            "name": "컴퓨터공학",
            "focus": "알고리즘, 자료구조, 분산시스템, 컴파일러",
            "ai_connection": "AI 시스템 아키텍처, 효율적 추론, 모델 최적화"
        },
        "electrical_engineering": {
            "name": "전기전자공학",
            "focus": "반도체, 신호처리, 회로설계, AI 칩",
            "ai_connection": "AI 전용 하드웨어, 엣지 컴퓨팅, 뉴로모픽 칩"
        },
    },
    "사회과학": {
        "economics": {
            "name": "경제학",
            "focus": "시장 이론, 게임 이론, 행동경제학, 거시경제",
            "ai_connection": "AI 경제 영향, 자동화와 고용, 알고리즘 거래"
        },
        "psychology_cognitive_science": {
            "name": "심리학/인지과학",
            "focus": "인지심리, 학습이론, 의사결정, HCI",
            "ai_connection": "인간-AI 상호작용, 인지 모델링, AI 편향"
        },
    },
    "인문학": {
        "philosophy_ethics": {
            "name": "철학/윤리학",
            "focus": "인식론, 존재론, AI 윤리, 의식 문제",
            "ai_connection": "AI 윤리, 의식/자아 문제, 설명가능한 AI"
        },
    },
}

# 모든 학문 분야 키 리스트 (순환용)
ALL_DISCIPLINE_KEYS = []
for super_cat, disciplines in DISCIPLINES.items():
    for key in disciplines:
        ALL_DISCIPLINE_KEYS.append(key)


def get_llm(temperature: float = 0.7, max_tokens: int = 2048):
    """LangChain Gemini LLM 인스턴스 생성"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[ERROR] GEMINI_API_KEY not found")
        sys.exit(1)

    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=temperature,
        max_output_tokens=max_tokens,
        google_api_key=api_key,
    )


def get_crewai_llm(temperature: float = 0.7, max_tokens: int = 4096):
    """CrewAI LLM 인스턴스 생성 (Gemini 2.5 Flash)"""
    try:
        from crewai import LLM
    except ImportError:
        print("[ERROR] crewai not installed. Run: pip install crewai>=0.80.0")
        sys.exit(1)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[ERROR] GEMINI_API_KEY not found")
        sys.exit(1)

    return LLM(
        model="gemini/gemini-2.5-flash",
        temperature=temperature,
        max_tokens=max_tokens,
        api_key=api_key,
    )


def get_adjacent_discipline_keys(center_key: str) -> list:
    """주어진 학문 분야 키의 전후 인접 키를 포함해 3개 반환 (순환)"""
    keys = ALL_DISCIPLINE_KEYS
    total = len(keys)
    try:
        idx = keys.index(center_key)
    except ValueError:
        idx = 0
    prev_idx = (idx - 1) % total
    next_idx = (idx + 1) % total
    return [keys[prev_idx], keys[idx], keys[next_idx]]


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


def get_today_discipline_key() -> str:
    """오늘 날짜 기반 학문 분야 키 반환 (10일 주기 순환)"""
    from datetime import datetime
    day_of_year = datetime.now().timetuple().tm_yday
    index = day_of_year % len(ALL_DISCIPLINE_KEYS)
    return ALL_DISCIPLINE_KEYS[index]


def get_discipline_info(key: str) -> dict:
    """학문 분야 키로 상세 정보 반환"""
    for super_cat, disciplines in DISCIPLINES.items():
        if key in disciplines:
            info = disciplines[key].copy()
            info["key"] = key
            info["superCategory"] = super_cat
            return info
    return {}
