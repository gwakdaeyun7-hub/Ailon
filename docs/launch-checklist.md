# Pre-Launch Checklist

- [x] Firestore security rules reviewed + deployed (reports 컬렉션, article_views 비로그인 쓰기 허용)
- [x] Environment variables set in EAS secrets (8개)
- [ ] Pipeline running stable on GitHub Actions (check last 3 days)
- [x] Google Sign-In configured for production SHA-256 (Firebase Console에 등록 완료)
- [x] Splash screen / app icon assets finalized (character.png 픽셀아트)
- [x] Privacy Policy + Terms of Service (docs/, GitHub Pages: gwakdaeyun7-hub.github.io/Ailon/) — 영문 버전 포함 (CCPA, DMCA, Publisher Opt-Out)
- [x] Production AAB 빌드 성공 (C:\dev\ailon에서 빌드)
- [x] 댓글 신고/삭제 기능 (useReportComment, 3건 자동 숨김)
- [x] app.json: versionCode 1, android permissions, expo-dev-client 제거
- [x] Play Store listing 콘텐츠 준비 (play-store-listing.md: 설명, Data Safety, 콘텐츠 등급, 카테고리)
- [x] AI Summary 뱃지 + Read Original 버튼 (요약 모달)
- [x] 기본 언어 시스템 감지 (expo-localization, 영어 기본값)
- [ ] Play Store 스크린샷 촬영 (영문 UI)
- [ ] Play Store Console 등록 + 심사 제출
