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

# 학문 분야 정의 (16개 — 기능 3 시너지 최적화)
DISCIPLINES = {
    "기초과학": {
        "mathematics": {
            "name": "수학",
            "focus": "위상수학, 그래프 이론, 조합론, 범주론",
            "ai_connection": "트랜스포머 어텐션의 그래프 구조, 위상학적 데이터 분석(TDA), 범주론으로 이해하는 AI 모듈 합성",
        },
        "physics": {
            "name": "물리학",
            "focus": "열역학, 통계역학, 양자역학, 복잡계 이론",
            "ai_connection": "에너지 효율적 계산, 양자머신러닝, 확산 모델의 물리적 기반",
        },
        "chemistry": {
            "name": "화학",
            "focus": "분자 구조, 촉매 반응, 단백질 폴딩, 재료과학",
            "ai_connection": "AI 신약 발견, 분자 생성 모델(AlphaFold), AI 기반 재료 설계",
        },
        "game_theory": {
            "name": "게임이론",
            "focus": "내쉬 균형, 협력 게임, 메커니즘 설계, 진화적 게임이론, 경매 이론",
            "ai_connection": "멀티에이전트 AI 전략 설계, RLHF 보상 구조 최적화, 데이터 경매 메커니즘, AI 협상 에이전트",
        },
    },
    "생명과학": {
        "biology": {
            "name": "생물학",
            "focus": "진화론, 군집 행동, 면역 체계, 유전자 회로",
            "ai_connection": "진화 알고리즘, 자기수복 AI 시스템, 군집 지능, 생체 모방 설계",
        },
        "neuroscience": {
            "name": "뇌과학",
            "focus": "신경회로, 시냅스 가소성, 인지 메커니즘, Brain-Computer Interface",
            "ai_connection": "뇌 모방 신경망, 뉴로모픽 AI, BCI 인터페이스, 연속 학습",
        },
        "medicine": {
            "name": "의학",
            "focus": "임상 의사결정, 진단 시스템, 정밀의료, 의료 데이터",
            "ai_connection": "AI 의료 진단, 임상 의사결정 지원, 의료 이미지 분석, 예측 의학",
        },
    },
    "공학": {
        "electrical_engineering": {
            "name": "전기전자공학",
            "focus": "NPU·HBM·AI 가속기, 신호처리, 엣지 디바이스, 저전력 설계",
            "ai_connection": "AI 전용 칩 아키텍처, 온디바이스 AI, 뉴로모픽 칩, 배터리 제약 추론",
        },
        "robotics": {
            "name": "로봇공학",
            "focus": "제어이론, 센서퓨전, 경로계획, 인간-로봇 상호작용",
            "ai_connection": "Physical AI, 구현체 지능, 자율시스템, 산업용 AI 로봇",
        },
        "information_theory": {
            "name": "정보이론",
            "focus": "엔트로피, 정보 압축, 채널 용량, 부호화 이론, 상호정보",
            "ai_connection": "LLM 학습 이론, 지식 압축·증류, 최소 기술 길이, 불확실성 정량화",
        },
        "control_theory": {
            "name": "제어이론",
            "focus": "피드백 제어, PID 제어기, 안정성 분석, 칼만 필터, 최적 제어",
            "ai_connection": "RLHF = 피드백 루프, 칼만 필터 → 트랜스포머 어텐션, 제어 이론 기반 AI 안전성 보장",
        },
    },
    "사회과학": {
        "economics": {
            "name": "경제학",
            "focus": "인센티브 설계, 시장 메커니즘, 행동경제학, 정보 비대칭",
            "ai_connection": "AI 에이전트 조율, 데이터 시장 설계, 알고리즘 거래, AI 노동 대체",
        },
        "psychology_cognitive_science": {
            "name": "심리학/인지과학",
            "focus": "인지 편향, 학습이론, 의사결정, HCI",
            "ai_connection": "인간-AI 상호작용, AI 편향 교정, 인지 부하 최적화 인터페이스",
        },
        "linguistics": {
            "name": "언어학",
            "focus": "화용론, 의미론, 담화분석, 형태론, 언어 보편성",
            "ai_connection": "LLM 언어 이해 개선, 다국어 AI, 프롬프트 이론, 언어 모호성 해소",
        },
    },
    "인문학": {
        "philosophy_ethics": {
            "name": "철학/윤리학",
            "focus": "인식론, 존재론, AI 윤리, 의식 문제, 가치 정렬",
            "ai_connection": "AI 윤리 프레임워크, 설명가능 AI, AI 의식·자아 문제, 가치 정렬",
        },
        "complex_systems": {
            "name": "복잡계 과학",
            "focus": "창발(emergence), 카오스 이론, 자기조직화, 네트워크 과학, 임계 현상",
            "ai_connection": "LLM 창발 능력 메커니즘, AI 집단 지성, 소셜 네트워크 전파 모델, 복잡계 기반 AI 설계",
        },
    },
}

# 모든 학문 분야 키 리스트 (순환용)
ALL_DISCIPLINE_KEYS = []
for super_cat, disciplines in DISCIPLINES.items():
    for key in disciplines:
        ALL_DISCIPLINE_KEYS.append(key)


def get_llm(temperature: float = 0.7, max_tokens: int = 2048):
    """LangChain Google Gemini LLM 인스턴스 생성 (gemini-2.5-flash)"""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("[ERROR] GOOGLE_API_KEY not found")
        sys.exit(1)

    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=temperature,
        max_tokens=max_tokens,
        google_api_key=api_key,
    )


def get_crewai_llm(temperature: float = 0.7, max_tokens: int = 4096):
    """CrewAI LLM 인스턴스 생성 (Google Gemini gemini-2.5-flash)"""
    try:
        from crewai import LLM
    except ImportError:
        print("[ERROR] crewai not installed. Run: pip install crewai>=0.80.0")
        sys.exit(1)

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("[ERROR] GOOGLE_API_KEY not found")
        sys.exit(1)

    return LLM(
        model="gemini-2.5-flash",
        temperature=temperature,
        max_tokens=max_tokens,
        api_key=api_key,
    )



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
