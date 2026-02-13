# AI Learning Companion

매일 AI 뉴스와 학문 기본 원리를 학습하고, 이를 융합한 창의적 아이디어를 생성하는 웹 애플리케이션입니다.

## 주요 기능

1. **AI 뉴스 큐레이션**: 매일 아침 AI 관련 뉴스를 자동으로 수집하고 요약
2. **학문 기본 원리 학습**: 물리, 화학, 생물, 철학, 경제, 심리학의 핵심 원리를 매일 학습
3. **AI-학문 융합 아이디어**: AI 기술과 학문 원리를 결합한 창의적 아이디어 생성

## 기술 스택

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **AI**: Google Gemini API (뉴스 요약), Groq API (아이디어 생성)
- **Hosting**: Vercel
- **Automation**: GitHub Actions (매일 뉴스 수집)

## 프로젝트 구조

```
ailon/
├── .github/workflows/      # GitHub Actions 워크플로우
├── backend/                # Firebase 설정
├── content/                # 학문 원리 콘텐츠
├── scripts/                # Python 스크립트 (뉴스 수집)
└── frontend/               # Next.js 앱
```

## 시작하기

자세한 설정 가이드는 [SETUP_GUIDE.md](./SETUP_GUIDE.md)를 참조하세요.

### 1. 빠른 시작 (로컬 개발)

```bash
# 1. 의존성 설치
cd frontend
npm install

# 2. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 Firebase 설정 추가

# 3. 개발 서버 실행
npm run dev
```

### 2. 뉴스 수집 스크립트 실행

```bash
# Python 환경 설정
cd scripts
pip install -r requirements.txt

# 뉴스 수집 실행
python collect_news.py
```

## 배포

이 프로젝트는 Vercel에 배포하도록 설계되었습니다.

1. Vercel 계정에 GitHub 리포지토리 연결
2. 환경 변수 설정
3. 자동 배포

자세한 내용은 [SETUP_GUIDE.md](./SETUP_GUIDE.md)의 배포 섹션을 참조하세요.

## 비용

모든 서비스의 무료 티어를 사용하여 **$0/월**로 운영 가능합니다.

- Firebase: 무료 Spark 플랜
- Vercel: 무료 Hobby 플랜
- Gemini API: 무료 (1,500 요청/일)
- Groq API: 무료 (14,400 요청/일)
- GitHub Actions: 무료 (Public 리포지토리)

## 라이선스

MIT License
