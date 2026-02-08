# 🚀 배포 체크리스트

배포 전에 이 체크리스트를 확인하세요.

## ✅ 파일 존재 확인

### 백엔드 & 자동화
- [x] `.github/workflows/collect-news.yml` - GitHub Actions 워크플로우
- [x] `backend/firestore.rules` - Firestore 보안 규칙
- [x] `scripts/collect_news.py` - 뉴스 수집 스크립트
- [x] `scripts/upload_principles.py` - 원리 업로드 스크립트
- [x] `scripts/requirements.txt` - Python 의존성
- [x] `scripts/.env.example` - 환경 변수 예시
- [x] `content/principles.json` - 30개 학문 원리

### 프론트엔드 핵심
- [x] `frontend/package.json` - 의존성 정의
- [x] `frontend/tsconfig.json` - TypeScript 설정
- [x] `frontend/tailwind.config.ts` - Tailwind 설정
- [x] `frontend/next.config.mjs` - Next.js 설정
- [x] `frontend/.env.example` - 환경 변수 예시

### 앱 구조
- [x] `frontend/app/layout.tsx` - 앱 레이아웃
- [x] `frontend/app/page.tsx` - 홈페이지
- [x] `frontend/app/globals.css` - 전역 스타일
- [x] `frontend/app/api/generate-idea/route.ts` - API 라우트

### 라이브러리
- [x] `frontend/lib/firebase.ts` - Firebase 초기화
- [x] `frontend/lib/types.ts` - TypeScript 타입
- [x] `frontend/lib/utils/cn.ts` - 유틸리티
- [x] `frontend/lib/hooks/useAuth.ts` - 인증 Hook
- [x] `frontend/lib/hooks/useNews.ts` - 뉴스 Hook
- [x] `frontend/lib/hooks/usePrinciples.ts` - 원리 Hook

### 컴포넌트
- [x] `frontend/components/Header.tsx` - 헤더
- [x] `frontend/components/NewsSection.tsx` - 뉴스 섹션
- [x] `frontend/components/PrincipleSection.tsx` - 원리 섹션
- [x] `frontend/components/IdeaSection.tsx` - 아이디어 섹션
- [x] `frontend/components/ui/button.tsx` - Button UI
- [x] `frontend/components/ui/card.tsx` - Card UI

### 문서
- [x] `README.md` - 프로젝트 소개
- [x] `SETUP_GUIDE.md` - 상세 설정 가이드
- [x] `QUICK_START.md` - 빠른 시작 가이드
- [x] `IMPLEMENTATION_SUMMARY.md` - 구현 요약
- [x] `.gitignore` - Git 제외 파일

## 📝 배포 전 체크리스트

### Firebase 설정
- [ ] Firebase 프로젝트 생성됨
- [ ] Firestore 데이터베이스 활성화됨 (프로덕션 모드)
- [ ] Authentication에서 Google 로그인 활성화됨
- [ ] Web 앱 등록하고 firebaseConfig 복사함
- [ ] Service Account JSON 키 다운로드함
- [ ] Firestore 보안 규칙 업데이트함 (`backend/firestore.rules` 사용)

### API 키
- [ ] Gemini API 키 발급받음 (https://aistudio.google.com/app/apikey)
- [ ] API 키를 안전하게 저장함

### 로컬 데이터 업로드
- [ ] `firebase-credentials.json` 파일을 프로젝트 루트에 저장함
- [ ] Python 의존성 설치함 (`pip install -r scripts/requirements.txt`)
- [ ] `scripts/.env` 파일 생성하고 GEMINI_API_KEY 설정함
- [ ] 학문 원리 업로드함 (`python scripts/upload_principles.py`)
- [ ] Firestore에서 30개 원리 확인함

### GitHub 설정
- [ ] GitHub에 새 리포지토리 생성함
- [ ] 코드를 GitHub에 푸시함
- [ ] GitHub Secrets 설정함:
  - [ ] `GEMINI_API_KEY` 추가
  - [ ] `FIREBASE_CREDENTIALS` 추가 (전체 JSON 내용)

### Vercel 설정
- [ ] Vercel 계정 생성함 (GitHub 연동)
- [ ] Vercel에서 새 프로젝트 생성함
- [ ] GitHub 리포지토리 연결함
- [ ] Root Directory를 `frontend`로 설정함 ⚠️ **중요!**
- [ ] 환경 변수 설정함:
  - [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
  - [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
  - [ ] `GEMINI_API_KEY`
- [ ] 배포 완료됨
- [ ] Vercel URL 확인함

### Firebase 추가 설정
- [ ] Firebase Console > Authentication > 승인된 도메인에 Vercel URL 추가함
  - 예: `your-app.vercel.app`

### 첫 뉴스 수집
- [ ] GitHub Actions 탭에서 "Collect AI News Daily" 워크플로우 찾음
- [ ] "Run workflow" 버튼 클릭하여 수동 실행함
- [ ] 워크플로우 실행 성공 확인함 (✅ 표시)
- [ ] Firestore에서 `daily_news` 컬렉션에 오늘 날짜 문서 확인함

## 🧪 배포 후 테스트

### 기본 기능
- [ ] Vercel URL로 앱 접속 가능
- [ ] 홈페이지가 정상적으로 로드됨
- [ ] 학문 원리 섹션에 오늘의 원리가 표시됨
- [ ] 뉴스 섹션에 뉴스가 표시됨 (GitHub Actions 실행 후)

### 인증
- [ ] "Google 로그인" 버튼 클릭 작동
- [ ] Google 로그인 팝업이 열림
- [ ] 로그인 후 사용자 이름/프로필 사진 표시됨
- [ ] 로그아웃 버튼 작동

### 아이디어 생성
- [ ] 로그인 전에는 아이디어 생성 버튼 비활성화됨
- [ ] 로그인 후 아이디어 생성 버튼 활성화됨
- [ ] "새로운 아이디어 생성" 버튼 클릭
- [ ] 로딩 인디케이터 표시됨
- [ ] 3-10초 후 아이디어가 표시됨
- [ ] 생성된 아이디어가 의미있고 구체적임

### 반응형
- [ ] 데스크톱 (1920px)에서 정상 표시
- [ ] 태블릿 (768px)에서 정상 표시
- [ ] 모바일 (375px)에서 정상 표시
- [ ] 가로/세로 모드 모두 확인

### 성능
- [ ] 페이지 로드 속도 < 3초
- [ ] API 응답 속도 < 5초
- [ ] 이미지 로딩 정상
- [ ] 스크롤 부드러움

## 🔄 자동화 확인

### 다음날 확인 사항
- [ ] GitHub Actions가 오전 6시(KST)에 자동 실행됨
- [ ] 워크플로우가 성공적으로 완료됨 (✅)
- [ ] Firestore에 새로운 날짜의 뉴스 추가됨
- [ ] 웹 앱에서 새 뉴스가 표시됨
- [ ] 학문 원리가 자동으로 다음 원리로 변경됨 (30일 주기)

## 📊 모니터링

### 일일 체크
- [ ] Firebase Console > Usage에서 Firestore 사용량 확인
- [ ] Firebase Console > Usage에서 Authentication 사용량 확인
- [ ] Vercel Dashboard > Analytics에서 트래픽 확인
- [ ] GitHub Actions > Actions 탭에서 실행 히스토리 확인

### 주간 체크
- [ ] Gemini API 사용량 확인 (무료 한도: 1,500 요청/일)
- [ ] Firebase 무료 한도 확인 (50,000 읽기/일)
- [ ] Vercel 대역폭 사용량 확인 (100GB/월)

## 🚨 문제 해결

### 뉴스가 표시되지 않음
1. GitHub Actions > Actions 탭 확인
2. 워크플로우 실패 시 로그 확인
3. Firebase Console > Firestore에서 `daily_news` 컬렉션 확인
4. 수동으로 워크플로우 실행해보기

### 로그인 실패
1. Firebase Console > Authentication > 승인된 도메인 확인
2. Vercel URL이 정확히 추가되었는지 확인
3. 브라우저 콘솔에서 에러 메시지 확인
4. 시크릿 모드에서 시도

### 아이디어 생성 실패
1. Vercel Dashboard > Settings > Environment Variables 확인
2. `GEMINI_API_KEY`가 올바른지 확인
3. Vercel > Functions > Logs에서 에러 확인
4. API 할당량 확인 (1,500 요청/일)

### GitHub Actions 실패
1. Actions 탭에서 실패한 워크플로우 클릭
2. 로그에서 에러 메시지 확인
3. Secrets 설정 재확인:
   - `GEMINI_API_KEY` 올바른지
   - `FIREBASE_CREDENTIALS` 완전한 JSON인지
4. `scripts/collect_news.py` 로컬에서 테스트

## ✅ 최종 확인

모든 항목을 체크했다면:

- ✅ **배포 완료!**
- ✅ **모든 기능 정상 작동!**
- ✅ **자동화 설정 완료!**

축하합니다! 🎉 AI Learning Companion이 성공적으로 배포되었습니다!

---

**다음 단계:**
- 앱 URL을 친구들과 공유하세요
- 매일 아침 새로운 지식을 학습하세요
- 피드백을 받아 기능을 개선하세요

**지원이 필요하면:**
- `SETUP_GUIDE.md` 참조
- GitHub Issues에 문의
- Firebase/Vercel 문서 참조
