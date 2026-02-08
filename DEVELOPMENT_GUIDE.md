# 🚀 AI Learning Companion - 개발 및 배포 가이드

## 📌 목차

1. [개발 환경 설정](#1-개발-환경-설정)
2. [프로젝트 초기화](#2-프로젝트-초기화)
3. [백엔드 개발](#3-백엔드-개발)
4. [프론트엔드 개발](#4-프론트엔드-개발)
5. [배포 및 운영](#5-배포-및-운영)
6. [비용 $0 운영 전략](#6-비용-0-운영-전략)

---

## 1. 개발 환경 설정

### 1.1 필수 도구 설치

```bash
# Node.js 설치 (LTS 버전 권장)
# https://nodejs.org 에서 다운로드

# Git 설치
# https://git-scm.com 에서 다운로드

# VS Code 설치 (권장 에디터)
# https://code.visualstudio.com 에서 다운로드

# Node.js 버전 확인
node --version  # v18 이상 권장
npm --version
```

### 1.2 계정 생성

**필수 계정 (모두 무료):**

1. **GitHub** (https://github.com)
   - 코드 저장소
   - CI/CD (GitHub Actions)

2. **Firebase** (https://firebase.google.com)
   - 인증, 데이터베이스, 호스팅
   - Google 계정으로 로그인

3. **Vercel** (https://vercel.com)
   - 프론트엔드 호스팅
   - GitHub 계정으로 연동

4. **Google AI Studio** (https://aistudio.google.com)
   - Gemini API 키 발급
   - 무료 티어: 1,500 요청/일

5. **Groq** (https://console.groq.com)
   - Llama 3 API 키 발급
   - 무료 티어: 14,400 요청/일

**선택 계정:**
- Figma (디자인): https://figma.com
- Sentry (에러 추적): https://sentry.io

---

## 2. 프로젝트 초기화

### 2.1 GitHub 리포지토리 생성

```bash
# 1. GitHub에서 새 리포지토리 생성
# - Repository name: ai-learning-companion
# - Public 선택
# - Add README 체크
# - Add .gitignore: Node 선택
# - License: MIT 선택

# 2. 로컬에 클론
git clone https://github.com/YOUR_USERNAME/ai-learning-companion.git
cd ai-learning-companion
```

### 2.2 프로젝트 구조 생성

```bash
mkdir -p frontend backend scripts content
```

최종 구조:
```
ai-learning-companion/
├── frontend/          # Next.js 앱
├── backend/           # Firebase Cloud Functions
├── scripts/           # 뉴스 수집 스크립트
├── content/           # 학문 원리 콘텐츠
├── .github/
│   └── workflows/     # GitHub Actions
└── README.md
```

---

## 3. 백엔드 개발

### 3.1 Firebase 프로젝트 설정

#### Step 1: Firebase Console에서 프로젝트 생성

1. https://console.firebase.google.com 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `ai-learning-companion`
4. Google Analytics: 활성화 (권장)
5. 프로젝트 생성 완료

#### Step 2: Firebase CLI 설치

```bash
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화
firebase init

# 선택 항목:
# - Firestore
# - Authentication
# - Hosting
# - Functions (선택)
```

#### Step 3: Firestore 보안 규칙 설정

`firestore.rules` 파일 생성:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 뉴스 컬렉션 (읽기만 가능)
    match /news/{newsId} {
      allow read: if true;
      allow write: if false; // 서버에서만 쓰기
    }

    // 학문 원리 컬렉션 (읽기만 가능)
    match /principles/{principleId} {
      allow read: if true;
      allow write: if false;
    }

    // 사용자 데이터 (본인만 읽기/쓰기)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 아이디어 캐시 (읽기만 가능)
    match /ideas/{ideaId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

배포:
```bash
firebase deploy --only firestore:rules
```

#### Step 4: Authentication 설정

Firebase Console에서:
1. Authentication > Sign-in method
2. Google 로그인 활성화
3. 이메일/비밀번호 로그인 활성화

### 3.2 뉴스 수집 스크립트 개발

#### 파일 구조

```
scripts/
├── collect_news.py
├── requirements.txt
└── config.yaml
```

#### `requirements.txt` 작성

```txt
feedparser==6.0.10
requests==2.31.0
beautifulsoup4==4.12.2
google-generativeai==0.3.1
firebase-admin==6.3.0
python-dotenv==1.0.0
```

#### `collect_news.py` 작성

```python
#!/usr/bin/env python3
"""
AI 뉴스 수집 및 요약 스크립트
매일 오전 6시에 실행됨 (GitHub Actions)
"""

import feedparser
import requests
from datetime import datetime, timedelta
import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# Firebase 초기화
cred = credentials.Certificate(os.getenv('FIREBASE_CREDENTIALS_PATH'))
firebase_admin.initialize_app(cred)
db = firestore.client()

# Gemini API 설정
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

# RSS 피드 소스
RSS_FEEDS = [
    'https://techcrunch.com/tag/artificial-intelligence/feed/',
    'https://venturebeat.com/category/ai/feed/',
    'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    'https://news.ycombinator.com/rss',
]

def fetch_news():
    """RSS 피드에서 뉴스 가져오기"""
    articles = []

    for feed_url in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries[:10]:  # 각 소스당 최대 10개
                # 24시간 이내 기사만
                published = datetime(*entry.published_parsed[:6])
                if datetime.now() - published > timedelta(days=1):
                    continue

                articles.append({
                    'title': entry.title,
                    'link': entry.link,
                    'published': published,
                    'source': feed.feed.title,
                    'summary': entry.get('summary', '')[:500]
                })
        except Exception as e:
            print(f"Error fetching {feed_url}: {e}")

    return articles

def filter_ai_news(articles):
    """AI 관련 뉴스 필터링"""
    ai_keywords = ['ai', 'artificial intelligence', 'machine learning', 'ml',
                   'deep learning', 'neural network', 'llm', 'gpt', 'chatgpt',
                   'claude', 'gemini', 'transformer']

    filtered = []
    for article in articles:
        text = (article['title'] + ' ' + article['summary']).lower()
        if any(keyword in text for keyword in ai_keywords):
            filtered.append(article)

    return filtered

def rank_news(articles):
    """뉴스 중요도 점수 계산 및 랭킹"""
    for article in articles:
        score = 0

        # 소스 신뢰도 (임시)
        trusted_sources = ['TechCrunch', 'MIT Technology Review', 'VentureBeat']
        if any(source in article['source'] for source in trusted_sources):
            score += 30

        # 신선도
        hours_old = (datetime.now() - article['published']).total_seconds() / 3600
        freshness_score = max(0, 20 - hours_old)
        score += freshness_score

        # 키워드 관련성 (간단한 카운트)
        high_priority_keywords = ['breakthrough', 'launch', 'release', 'new']
        text = article['title'].lower()
        score += sum(10 for kw in high_priority_keywords if kw in text)

        article['score'] = score

    # 점수 순 정렬
    articles.sort(key=lambda x: x['score'], reverse=True)
    return articles[:7]  # 상위 7개

def summarize_with_gemini(article):
    """Gemini로 기사 요약"""
    prompt = f"""
    다음 AI 뉴스를 2-3문장으로 간결하게 요약해주세요.
    핵심 내용만 포함하고, 전문 용어는 쉽게 풀어서 설명해주세요.

    제목: {article['title']}
    내용: {article['summary']}

    요약:
    """

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini API error: {e}")
        # Fallback: 원문 요약의 첫 2문장
        sentences = article['summary'].split('.')[:2]
        return '. '.join(sentences) + '.'

def categorize_news(article):
    """뉴스 카테고리 분류"""
    title_lower = article['title'].lower()

    if any(kw in title_lower for kw in ['research', 'study', 'paper']):
        return '연구'
    elif any(kw in title_lower for kw in ['product', 'launch', 'release']):
        return '제품'
    elif any(kw in title_lower for kw in ['funding', 'investment', 'acquisition']):
        return '비즈니스'
    elif any(kw in title_lower for kw in ['ethics', 'regulation', 'privacy']):
        return '윤리/규제'
    else:
        return '일반'

def save_to_firestore(articles):
    """Firestore에 뉴스 저장"""
    today = datetime.now().strftime('%Y-%m-%d')

    # 오늘 날짜 문서 생성
    news_ref = db.collection('daily_news').document(today)

    news_data = {
        'date': today,
        'articles': [],
        'created_at': firestore.SERVER_TIMESTAMP
    }

    for article in articles:
        news_data['articles'].append({
            'title': article['title'],
            'link': article['link'],
            'summary': article['ai_summary'],
            'source': article['source'],
            'category': article['category'],
            'published': article['published'].isoformat(),
            'score': article['score']
        })

    news_ref.set(news_data)
    print(f"Saved {len(articles)} articles to Firestore")

def main():
    print(f"Starting news collection: {datetime.now()}")

    # 1. 뉴스 수집
    articles = fetch_news()
    print(f"Fetched {len(articles)} articles")

    # 2. AI 관련 필터링
    ai_articles = filter_ai_news(articles)
    print(f"Filtered to {len(ai_articles)} AI articles")

    # 3. 랭킹
    top_articles = rank_news(ai_articles)
    print(f"Ranked top {len(top_articles)} articles")

    # 4. 요약 생성
    for article in top_articles:
        article['ai_summary'] = summarize_with_gemini(article)
        article['category'] = categorize_news(article)

    # 5. Firestore 저장
    save_to_firestore(top_articles)

    print("News collection completed!")

if __name__ == '__main__':
    main()
```

#### `.env` 파일 (로컬 테스트용)

```bash
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
```

**주의:** `.env` 파일은 절대 Git에 커밋하지 않기! `.gitignore`에 추가.

#### 로컬 테스트

```bash
cd scripts
pip install -r requirements.txt
python collect_news.py
```

### 3.3 GitHub Actions로 자동 실행 설정

`.github/workflows/collect-news.yml` 생성:

```yaml
name: Collect Daily AI News

on:
  schedule:
    # 매일 오전 6시 (KST 기준, UTC+9)
    # UTC로는 전날 21시
    - cron: '0 21 * * *'
  workflow_dispatch:  # 수동 실행 가능

jobs:
  collect-news:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          cd scripts
          pip install -r requirements.txt

      - name: Create Firebase credentials
        run: |
          echo '${{ secrets.FIREBASE_CREDENTIALS }}' > scripts/serviceAccountKey.json

      - name: Run news collection
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: |
          cd scripts
          python collect_news.py

      - name: Clean up
        run: |
          rm scripts/serviceAccountKey.json
```

#### GitHub Secrets 설정

GitHub 리포지토리에서:
1. Settings > Secrets and variables > Actions
2. New repository secret 클릭
3. 다음 시크릿 추가:
   - `GEMINI_API_KEY`: Gemini API 키
   - `FIREBASE_CREDENTIALS`: Firebase 서비스 계정 JSON (전체 내용)

Firebase 서비스 계정 키 받기:
1. Firebase Console > Project settings > Service accounts
2. "Generate new private key" 클릭
3. JSON 파일 다운로드
4. 파일 내용 전체를 `FIREBASE_CREDENTIALS`에 붙여넣기

### 3.4 학문 원리 콘텐츠 작성

`content/principles.json` 생성:

```json
[
  {
    "id": "physics-001",
    "title": "엔트로피 (Entropy)",
    "category": "물리학",
    "difficulty": "입문",
    "description": "엔트로피는 시스템의 무질서도를 나타내는 물리량입니다. 열역학 제2법칙에 따르면, 고립된 시스템의 엔트로피는 시간이 지날수록 증가하는 경향이 있습니다. 이는 자연 현상이 자발적으로 무질서한 방향으로 진행됨을 의미합니다.",
    "example": "방을 정리하지 않으면 자연스럽게 어질러지는 현상, 뜨거운 커피가 식으면서 주변 공기와 같은 온도가 되는 현상 등이 엔트로피 증가의 예입니다.",
    "related_concepts": ["열역학 제2법칙", "가역/비가역 과정", "통계역학"],
    "reading_time": 3
  },
  {
    "id": "philosophy-001",
    "title": "오컴의 면도날 (Occam's Razor)",
    "category": "철학",
    "difficulty": "입문",
    "description": "오컴의 면도날은 '경쟁하는 여러 가설이 있을 때, 가장 단순한 것을 선택해야 한다'는 원리입니다. 불필요한 가정을 추가하지 말고, 현상을 설명하는 데 필요한 최소한의 요소만 사용해야 한다는 사고 방식입니다.",
    "example": "컴퓨터가 갑자기 꺼졌을 때, '외계인이 전파를 쏘아서'보다는 '전원 케이블이 빠져서'가 더 단순하고 그럴듯한 설명입니다.",
    "related_concepts": ["과학적 방법론", "가설 검증", "논리적 사고"],
    "reading_time": 3
  }
  // ... 더 많은 원리 추가
]
```

Firestore에 업로드하는 스크립트 (`scripts/upload_principles.py`):

```python
import json
import firebase_admin
from firebase_admin import credentials, firestore

# Firebase 초기화
cred = credentials.Certificate('./serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# JSON 파일 읽기
with open('../content/principles.json', 'r', encoding='utf-8') as f:
    principles = json.load(f)

# Firestore에 업로드
for principle in principles:
    doc_ref = db.collection('principles').document(principle['id'])
    doc_ref.set(principle)
    print(f"Uploaded: {principle['title']}")

print(f"Total {len(principles)} principles uploaded!")
```

실행:
```bash
cd scripts
python upload_principles.py
```

---

## 4. 프론트엔드 개발

### 4.1 Next.js 프로젝트 초기화

```bash
cd frontend

# Next.js 앱 생성
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# 선택 사항:
# ✔ Would you like to use TypeScript? Yes
# ✔ Would you like to use ESLint? Yes
# ✔ Would you like to use Tailwind CSS? Yes
# ✔ Would you like to use `src/` directory? No
# ✔ Would you like to use App Router? Yes
# ✔ Would you like to customize the default import alias? No
```

### 4.2 필요한 패키지 설치

```bash
# Firebase
npm install firebase

# UI 라이브러리
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react

# 날짜 라이브러리
npm install date-fns

# 상태 관리 (간단한 앱이므로 React Context 사용)
# 추가 패키지 불필요
```

### 4.3 shadcn/ui 설정

```bash
npx shadcn-ui@latest init

# 선택사항:
# ✔ Would you like to use TypeScript? yes
# ✔ Which style would you like to use? Default
# ✔ Which color would you like to use as base color? Slate
# ✔ Where is your global CSS file? app/globals.css
# ✔ Would you like to use CSS variables for colors? yes
```

필요한 컴포넌트 설치:
```bash
npx shadcn-ui@latest add button card input label tabs avatar
```

### 4.4 Firebase 설정

`lib/firebase.ts` 생성:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
```

`.env.local` 생성 (Firebase 설정 값 입력):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Firebase Console에서 값 가져오기:
1. Project settings > General
2. Your apps > Web app (없으면 생성)
3. firebaseConfig 값 복사

### 4.5 홈 페이지 구현

`app/page.tsx`:

```typescript
import { Suspense } from 'react';
import NewsSection from '@/components/NewsSection';
import PrincipleSection from '@/components/PrincipleSection';
import IdeaSection from '@/components/IdeaSection';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            AI Learning Companion
          </h1>
          <p className="text-slate-600">
            매일 아침, 세상을 이해하는 새로운 렌즈를 얻으세요
          </p>
        </header>

        <div className="space-y-8">
          <Suspense fallback={<LoadingSkeleton />}>
            <NewsSection />
          </Suspense>

          <Suspense fallback={<LoadingSkeleton />}>
            <PrincipleSection />
          </Suspense>

          <Suspense fallback={<LoadingSkeleton />}>
            <IdeaSection />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-slate-200 rounded w-1/3"></div>
      <div className="h-32 bg-slate-200 rounded"></div>
    </div>
  );
}
```

### 4.6 뉴스 섹션 컴포넌트

`components/NewsSection.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

interface Article {
  title: string;
  summary: string;
  link: string;
  source: string;
  category: string;
  published: string;
}

export default function NewsSection() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const newsRef = collection(db, 'daily_news');
      const q = query(newsRef, orderBy('date', 'desc'), limit(1));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4 text-slate-900">
        📰 오늘의 AI 뉴스
      </h2>

      <div className="space-y-4">
        {articles.map((article, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                {article.category}
              </span>
              <span className="text-sm text-slate-500">
                {new Date(article.published).toLocaleDateString('ko-KR')}
              </span>
            </div>

            <h3 className="text-lg font-semibold mb-2 text-slate-900">
              {article.title}
            </h3>

            <p className="text-slate-600 mb-4 line-clamp-3">
              {article.summary}
            </p>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">{article.source}</span>
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                더 읽기
                <ExternalLink className="ml-1 w-4 h-4" />
              </a>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <Card className="p-6">
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
            <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </Card>
        </div>
      ))}
    </div>
  );
}
```

### 4.7 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

---

## 5. 배포 및 운영

### 5.1 Vercel 배포

#### Step 1: Vercel 계정 연동

```bash
# Vercel CLI 설치
npm install -g vercel

# Vercel 로그인
vercel login
```

#### Step 2: 프로젝트 배포

```bash
cd frontend

# 첫 배포
vercel

# 선택사항:
# Set up and deploy? Yes
# Which scope? (본인 계정 선택)
# Link to existing project? No
# Project name? ai-learning-companion
# In which directory is your code located? ./
# Want to override settings? No
```

#### Step 3: 환경 변수 설정

Vercel Dashboard에서:
1. Project > Settings > Environment Variables
2. Firebase 관련 환경 변수 모두 추가
3. Redeploy

또는 CLI로:
```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# 값 입력

# 모든 환경 변수 추가 후 재배포
vercel --prod
```

#### Step 4: 커스텀 도메인 (선택)

Vercel Dashboard:
1. Project > Settings > Domains
2. Add domain
3. DNS 설정 (Vercel 안내 따라 진행)

### 5.2 PWA 설정 (모바일 앱처럼 사용)

`next.config.js` 수정:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA 설정
  experimental: {
    webpackBuildWorker: true,
  },
};

module.exports = nextConfig;
```

`public/manifest.json` 생성:

```json
{
  "name": "AI Learning Companion",
  "short_name": "AI Learn",
  "description": "매일 AI 뉴스와 학문 원리를 학습하세요",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

`app/layout.tsx`에 메타데이터 추가:

```typescript
export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#3B82F6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AI Learning',
  },
};
```

### 5.3 모니터링 설정

#### Google Analytics 4

`app/layout.tsx`:

```typescript
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### Sentry 에러 추적

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

---

## 6. 비용 $0 운영 전략

### 6.1 무료 티어 한도 모니터링

#### Firebase 사용량 확인

Firebase Console:
1. Usage and billing > Details
2. Firestore 읽기/쓰기 확인
3. 80% 도달 시 알림 설정

#### LLM API 사용량 확인

Google AI Studio:
- API 사용량 대시보드 확인
- 일일 1,500 요청 제한 체크

Groq Console:
- 사용량 확인
- 일일 14,400 요청 제한 체크

### 6.2 비용 절감 테크닉

#### 1. 캐싱 전략

```typescript
// 뉴스 데이터 24시간 캐싱
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

function getCachedNews() {
  const cached = localStorage.getItem('cached_news');
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  return null;
}
```

#### 2. Firestore 읽기 최소화

```typescript
// 좋은 예: 한 번의 쿼리로 모든 데이터
const newsDoc = await getDoc(doc(db, 'daily_news', today));

// 나쁜 예: 여러 번 읽기
// articles.forEach(async (article) => {
//   await getDoc(...);  // 각각 읽기 카운트됨!
// });
```

#### 3. LLM API 로테이션

```python
# Gemini 한도 초과 시 Groq로 전환
try:
    summary = summarize_with_gemini(article)
except RateLimitError:
    summary = summarize_with_groq(article)
except:
    summary = fallback_summary(article)  # 규칙 기반
```

#### 4. 정적 콘텐츠는 JSON으로

학문 원리처럼 자주 바뀌지 않는 데이터는:
- Firestore 대신 JSON 파일로 저장 (읽기 비용 0)
- Next.js SSG로 빌드 타임에 포함

```typescript
// content/principles.json을 빌드 시 포함
import principles from '@/content/principles.json';
```

### 6.3 스케일업 전략 (사용자 증가 시)

#### 500 → 2,000 MAU

**예상 문제:**
- Firestore 읽기 초과 가능성

**대응:**
1. Supabase로 마이그레이션 (무료 티어가 더 넓음)
2. 또는 Redis 캐싱 추가 (Upstash 무료 티어)

#### 2,000 → 5,000 MAU

**예상 비용:** $5~$15/월

**수익화로 커버:**
- 프리미엄 구독 ($2.99/월)
- 5% 전환율 → 100명 × $2.99 = $299/월
- 충분히 비용 커버 가능!

---

## 🎯 체크리스트

### Week 1: 준비
- [ ] GitHub 리포지토리 생성
- [ ] Firebase 프로젝트 생성
- [ ] Gemini, Groq API 키 발급
- [ ] 학문 원리 30개 작성
- [ ] 디자인 와이어프레임

### Week 2-3: 백엔드
- [ ] 뉴스 수집 스크립트 작성
- [ ] GitHub Actions 설정
- [ ] Firestore 스키마 구현
- [ ] 테스트 (뉴스 수집 실행 확인)

### Week 4-5: 프론트엔드
- [ ] Next.js 프로젝트 초기화
- [ ] 홈 페이지 구현
- [ ] 뉴스/학습/아이디어 섹션 구현
- [ ] Firebase 연동
- [ ] 반응형 디자인

### Week 6: 배포 및 테스트
- [ ] Vercel 배포
- [ ] PWA 설정
- [ ] Google Analytics 설정
- [ ] 베타 테스터 모집
- [ ] 버그 수정

### Week 7: 런칭
- [ ] Product Hunt 제출
- [ ] SNS 홍보
- [ ] 피드백 수집 시작

---

## 📞 도움이 필요할 때

### 커뮤니티
- Next.js Discord: https://nextjs.org/discord
- Firebase Discord: https://discord.gg/firebase
- Reddit: r/webdev, r/nextjs

### 문서
- Next.js Docs: https://nextjs.org/docs
- Firebase Docs: https://firebase.google.com/docs
- Tailwind CSS: https://tailwindcss.com/docs

### 문제 해결
- Stack Overflow
- GitHub Issues (각 라이브러리)
- ChatGPT / Claude (코드 디버깅)

---

## 🚀 다음 단계

이 가이드를 따라 MVP를 완성했다면:

1. **사용자 피드백 수집**
   - 최소 20명 이상 베타 테스터
   - 설문조사 또는 인터뷰

2. **데이터 분석**
   - GA4에서 사용 패턴 확인
   - 어떤 기능이 가장 많이 사용되는지

3. **기능 개선**
   - 사용자 요청 기능 우선순위 정리
   - 2주 스프린트로 개발

4. **수익화 준비**
   - 프리미엄 기능 정의
   - Stripe 연동

5. **성장**
   - 콘텐츠 마케팅
   - 추천 프로그램
   - 커뮤니티 형성

---

**축하합니다! 이제 비용 $0로 AI Learning Companion 앱을 만들 준비가 되었습니다! 🎉**

궁금한 점이 있다면 언제든지 문의하세요.
