# AI Learning Companion - 설정 가이드

이 가이드는 AI Learning Companion 앱을 처음부터 배포하는 전체 과정을 안내합니다.

## 목차

1. [사전 준비](#사전-준비)
2. [Firebase 설정](#firebase-설정)
3. [API 키 발급](#api-키-발급)
4. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
5. [Vercel 배포](#vercel-배포)
6. [GitHub Actions 설정](#github-actions-설정)
7. [초기 데이터 업로드](#초기-데이터-업로드)
8. [테스트 및 확인](#테스트-및-확인)

---

## 사전 준비

다음 계정이 필요합니다 (모두 무료):

- [ ] Google 계정 (Firebase, Gemini API용)
- [ ] GitHub 계정
- [ ] Vercel 계정 (GitHub로 가입 가능)

---

## Firebase 설정

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `ai-learning-companion`)
4. Google Analytics 선택 (선택사항)
5. 프로젝트 생성 완료

### 2. Firestore 데이터베이스 생성

1. 좌측 메뉴에서 "Firestore Database" 클릭
2. "데이터베이스 만들기" 클릭
3. **프로덕션 모드**로 시작 (보안 규칙은 나중에 설정)
4. 위치 선택: `asia-northeast3 (Seoul)` 권장
5. "사용 설정" 클릭

### 3. Authentication 설정

1. 좌측 메뉴에서 "Authentication" 클릭
2. "시작하기" 클릭
3. "Google" 로그인 제공업체 선택
4. 사용 설정 토글 ON
5. 프로젝트 지원 이메일 선택
6. "저장" 클릭

### 4. 보안 규칙 업데이트

1. Firestore Database > 규칙 탭으로 이동
2. 이 프로젝트의 `backend/firestore.rules` 파일 내용을 복사
3. Firebase Console에 붙여넣기
4. "게시" 클릭

### 5. Firebase Web 앱 등록

1. 프로젝트 설정 (⚙️ 아이콘) 클릭
2. "앱 추가" 클릭
3. 웹 (</>) 아이콘 선택
4. 앱 닉네임 입력 (예: `Web App`)
5. Firebase Hosting 설정은 건너뛰기
6. **firebaseConfig 객체의 값들을 복사해두세요** (나중에 사용)

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 6. Service Account 키 생성 (서버용)

1. 프로젝트 설정 > 서비스 계정 탭
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드
4. **이 파일을 안전하게 보관하세요** (GitHub에 업로드하지 마세요!)

---

## API 키 발급

### 1. Google Gemini API 키

1. [Google AI Studio](https://aistudio.google.com/app/apikey)에 접속
2. "Create API Key" 클릭
3. 기존 GCP 프로젝트 선택 또는 새로 생성
4. API 키 복사 및 저장

**무료 할당량**: 1,500 요청/일

### 2. Groq API 키 (선택사항)

Groq은 현재 아이디어 생성에 사용되지 않지만, 향후 확장을 위해 발급할 수 있습니다.

1. [Groq Console](https://console.groq.com/)에 접속
2. 계정 생성 및 로그인
3. API Keys 메뉴에서 새 키 생성
4. API 키 복사 및 저장

---

## 로컬 개발 환경 설정

### 1. 저장소 클론 (또는 로컬 프로젝트 초기화)

```bash
cd ailon
```

### 2. Python 환경 설정 (뉴스 수집용)

```bash
cd scripts

# 가상환경 생성 (선택사항)
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt
```

### 3. Firebase Credentials 저장

다운로드한 Service Account JSON 파일을 다음 위치에 저장:

```
ailon/firebase-credentials.json
```

**중요**: 이 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

### 4. 환경 변수 설정 (Python 스크립트용)

`scripts/.env` 파일 생성:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. 학문 원리 데이터 업로드

```bash
cd scripts
python upload_principles.py
```

성공 메시지가 나타나면 Firestore에 30개의 원리가 업로드된 것입니다.

### 6. 뉴스 수집 테스트 (선택사항)

```bash
python collect_news.py
```

처음에는 뉴스가 수집되지 않을 수 있습니다. GitHub Actions에서 자동으로 수집됩니다.

### 7. Frontend 환경 설정

```bash
cd ../frontend

# 의존성 설치
npm install

# 환경 변수 파일 생성
cp .env.example .env.local
```

### 8. Frontend 환경 변수 설정

`frontend/.env.local` 파일 편집:

```bash
# Firebase Configuration (앞에서 복사한 값 사용)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# AI API Keys
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key (optional)
```

### 9. 로컬 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속하여 확인

---

## Vercel 배포

### 1. GitHub에 코드 푸시

```bash
# 프로젝트 루트에서
git init
git add .
git commit -m "Initial commit: AI Learning Companion MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-learning-companion.git
git push -u origin main
```

### 2. Vercel에 프로젝트 연결

1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. "Add New..." > "Project" 클릭
3. GitHub 리포지토리 선택
4. **Root Directory**: `frontend` 입력 (중요!)
5. Framework Preset: Next.js (자동 감지됨)

### 3. 환경 변수 설정

"Environment Variables" 섹션에서 다음 변수들을 추가:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
GEMINI_API_KEY=...
GROQ_API_KEY=... (optional)
```

### 4. 배포 실행

"Deploy" 클릭하여 배포 시작

배포가 완료되면 Vercel이 자동으로 URL을 생성합니다:
- 예: `https://ai-learning-companion.vercel.app`

### 5. Firebase 인증 도메인 추가

1. Firebase Console > Authentication > Settings 탭
2. "승인된 도메인" 섹션에 Vercel URL 추가
   - 예: `ai-learning-companion.vercel.app`

---

## GitHub Actions 설정

### 1. GitHub Secrets 설정

GitHub 리포지토리 페이지에서:

1. Settings > Secrets and variables > Actions 클릭
2. "New repository secret" 클릭
3. 다음 Secret 추가:

**GEMINI_API_KEY**
```
your_gemini_api_key
```

**FIREBASE_CREDENTIALS**
```
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "...",
  ...전체 JSON 내용...
}
```

Service Account JSON 파일의 **전체 내용**을 복사하여 붙여넣으세요.

### 2. GitHub Actions 워크플로우 확인

`.github/workflows/collect-news.yml` 파일이 이미 설정되어 있습니다.
이 워크플로우는:

- 매일 오전 6시 (KST) 자동 실행
- 수동으로도 실행 가능 (Actions 탭 > "Run workflow")

### 3. 첫 뉴스 수집 실행 (수동)

1. GitHub 리포지토리 > Actions 탭
2. "Collect AI News Daily" 워크플로우 선택
3. "Run workflow" > "Run workflow" 클릭
4. 실행 완료 대기 (약 2-3분)
5. 성공하면 ✅ 표시

---

## 테스트 및 확인

### 1. Firestore 데이터 확인

Firebase Console > Firestore Database에서:

- [ ] `principles` 컬렉션에 30개 문서 존재
- [ ] `daily_news` 컬렉션에 오늘 날짜 문서 존재
- [ ] `daily_news/{오늘 날짜}`의 `articles` 배열에 뉴스 데이터

### 2. 웹 앱 기능 테스트

배포된 Vercel URL에 접속하여:

- [ ] 페이지가 정상적으로 로드됨
- [ ] 뉴스 섹션에 뉴스 표시됨 (GitHub Actions 실행 후)
- [ ] 학문 원리 섹션에 오늘의 원리 표시됨
- [ ] Google 로그인 작동
- [ ] 로그인 후 아이디어 생성 버튼 클릭 시 아이디어 생성됨
- [ ] 모바일에서도 정상 작동 (반응형)

### 3. GitHub Actions 자동 실행 확인

다음날 오전 6시 이후:

- [ ] Actions 탭에서 자동 실행 확인
- [ ] Firestore에 새로운 날짜의 뉴스 추가됨

---

## 트러블슈팅

### 뉴스가 표시되지 않음

- GitHub Actions가 성공적으로 실행되었는지 확인
- Firestore에 `daily_news/{오늘 날짜}` 문서가 있는지 확인
- 오늘 뉴스가 없으면 어제 뉴스를 표시합니다

### 로그인이 작동하지 않음

- Firebase Console에서 Google 로그인 활성화 확인
- Vercel 도메인이 Firebase 승인 도메인에 추가되었는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 아이디어 생성이 실패함

- Gemini API 키가 올바르게 설정되었는지 확인
- API 할당량을 초과하지 않았는지 확인 (1,500 요청/일)
- Vercel 함수 로그에서 에러 확인

### GitHub Actions가 실패함

- GitHub Secrets이 올바르게 설정되었는지 확인
- `FIREBASE_CREDENTIALS`가 유효한 JSON인지 확인
- Actions 탭에서 에러 로그 확인

---

## 다음 단계

앱이 정상 작동하면:

1. **커스터마이징**: 색상, 로고, 텍스트 등을 수정
2. **기능 추가**: 북마크, 학습 기록, 검색 기능 등
3. **분석 추가**: Google Analytics나 Vercel Analytics 연동
4. **PWA 아이콘**: `public/icon-192.png`, `public/icon-512.png` 추가
5. **도메인 연결**: 커스텀 도메인을 Vercel에 연결

---

## 비용 모니터링

무료 티어로 운영하되, 사용량을 주기적으로 확인하세요:

- **Firebase**: [Firebase Console > Usage](https://console.firebase.google.com/) > Spark 플랜 사용량
- **Vercel**: [Vercel Dashboard](https://vercel.com/dashboard) > Usage 탭
- **Gemini API**: [Google Cloud Console](https://console.cloud.google.com/) > API & Services

---

## 지원

문제가 발생하면:

1. 이 가이드의 트러블슈팅 섹션 참조
2. 브라우저 개발자 도구 콘솔 확인
3. GitHub 리포지토리에 Issue 생성

---

**축하합니다! 🎉**

AI Learning Companion이 성공적으로 배포되었습니다. 매일 새로운 지식과 아이디어를 발견하세요!
