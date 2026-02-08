# 🚀 AI Learning Companion - 빠른 시작 가이드

## 📋 체크리스트

배포 전 준비사항:

- [ ] Google/Firebase 계정
- [ ] GitHub 계정
- [ ] Vercel 계정

## ⚡ 5단계로 배포하기

### 1️⃣ Firebase 설정 (15분)

```
1. https://console.firebase.google.com/ 접속
2. 새 프로젝트 생성
3. Firestore 데이터베이스 생성 (프로덕션 모드)
4. Authentication > Google 로그인 활성화
5. 프로젝트 설정 > Web 앱 추가 → firebaseConfig 복사
6. 프로젝트 설정 > 서비스 계정 > 비공개 키 생성 → JSON 다운로드
```

### 2️⃣ API 키 발급 (5분)

```
1. https://aistudio.google.com/app/apikey 접속
2. "Create API Key" 클릭
3. API 키 복사 및 저장
```

### 3️⃣ 로컬에서 데이터 업로드 (10분)

```bash
# 1. Service Account JSON 파일을 프로젝트 루트에 저장
# 파일명: firebase-credentials.json

# 2. Python 환경 설정
cd scripts
pip install -r requirements.txt

# 3. 환경 변수 설정
# .env 파일 생성하고 다음 추가:
# GEMINI_API_KEY=your_key_here

# 4. 학문 원리 업로드
python upload_principles.py

# 5. 뉴스 수집 테스트 (선택사항)
python collect_news.py
```

### 4️⃣ GitHub에 코드 푸시 (5분)

```bash
# 프로젝트 루트에서
git init
git add .
git commit -m "Initial commit: AI Learning Companion"

# GitHub에서 새 리포지토리 생성 후:
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main

# GitHub Secrets 설정 (Settings > Secrets > Actions)
# - GEMINI_API_KEY: your_key
# - FIREBASE_CREDENTIALS: firebase-credentials.json의 전체 JSON 내용
```

### 5️⃣ Vercel 배포 (10분)

```
1. https://vercel.com/dashboard 접속
2. "Add New..." > "Project" 클릭
3. GitHub 리포지토리 선택
4. Root Directory: frontend 입력 ⚠️ 중요!
5. 환경 변수 추가:
   - NEXT_PUBLIC_FIREBASE_API_KEY
   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   - NEXT_PUBLIC_FIREBASE_PROJECT_ID
   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   - NEXT_PUBLIC_FIREBASE_APP_ID
   - GEMINI_API_KEY
6. "Deploy" 클릭

7. 배포 완료 후:
   - Firebase Console > Authentication > 승인된 도메인에 Vercel URL 추가
```

## ✅ 배포 확인

1. Vercel URL 접속
2. 학문 원리 섹션에 오늘의 원리 표시 확인
3. Google 로그인 테스트
4. 아이디어 생성 버튼 클릭하여 작동 확인

## 🤖 첫 뉴스 수집 실행

```
1. GitHub 리포지토리 > Actions 탭
2. "Collect AI News Daily" 워크플로우 선택
3. "Run workflow" 클릭
4. 완료 후 Vercel URL에서 뉴스 섹션 확인
```

## 🔧 로컬 개발

```bash
# Frontend 개발 서버
cd frontend
npm install
cp .env.example .env.local
# .env.local 파일 수정 (Firebase 설정 추가)
npm run dev
# → http://localhost:3000

# Python 스크립트 테스트
cd scripts
pip install -r requirements.txt
python collect_news.py
```

## 📚 주요 파일 위치

```
설정 가이드:    SETUP_GUIDE.md (상세)
구현 요약:      IMPLEMENTATION_SUMMARY.md
환경 변수:      frontend/.env.example
뉴스 수집:      scripts/collect_news.py
학문 원리:      content/principles.json
보안 규칙:      backend/firestore.rules
```

## 🆘 문제 해결

### 뉴스가 표시되지 않음
→ GitHub Actions 수동 실행 (Actions 탭)

### 로그인 안됨
→ Firebase 승인 도메인에 Vercel URL 추가 확인

### 아이디어 생성 실패
→ Vercel 환경 변수에 GEMINI_API_KEY 확인

### GitHub Actions 실패
→ FIREBASE_CREDENTIALS Secret이 완전한 JSON인지 확인

## 💡 팁

- **무료 유지**: 모든 서비스의 무료 티어 사용
- **모니터링**: Firebase Console에서 사용량 주기적 확인
- **백업**: Service Account JSON 파일 안전하게 보관
- **업데이트**: git pull 후 Vercel이 자동 재배포

## 📊 일일 운영

- **오전 6시**: GitHub Actions가 자동으로 뉴스 수집
- **언제든**: 사용자가 앱 접속하여 학습
- **매일**: 새로운 학문 원리 자동 표시 (30일 주기)

## 🎯 다음 단계

1. ✅ 배포 완료
2. 🔍 기능 테스트
3. 📱 모바일에서 확인
4. 🎨 커스터마이징 (색상, 텍스트)
5. 📈 사용자 피드백 수집

---

**문제가 있나요?**
→ `SETUP_GUIDE.md`의 트러블슈팅 섹션을 확인하세요!

**성공적으로 배포되었나요?**
→ 축하합니다! 🎉 매일 새로운 지식을 탐험하세요!
