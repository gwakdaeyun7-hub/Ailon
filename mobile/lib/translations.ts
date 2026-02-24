/**
 * 다국어 번역 사전 (한국어 / 영어)
 */

export type Language = 'ko' | 'en';

const translations: Record<string, Record<Language, string>> = {
  // ─── 탭 이름 ───
  'tab.news': { ko: 'AI 트렌드', en: 'AI Trends' },
  'tab.snaps': { ko: '학문 스낵', en: 'Snacks' },
  'tab.ideas': { ko: '시너지 랩', en: 'Synergy' },
  'tab.saved': { ko: '저장', en: 'Saved' },
  'tab.profile': { ko: '프로필', en: 'Profile' },

  // ─── 뉴스 피드 (index.tsx) ───
  'news.header': { ko: 'AI 트렌드', en: 'AI Trends' },
  'news.updated': { ko: '업데이트', en: 'updated' },
  'news.articles_count': { ko: '개 기사', en: ' articles' },
  'news.highlight_title': { ko: '오늘의 하이라이트', en: "Today's Highlights" },
  'news.category_title': { ko: '카테고리별 뉴스', en: 'News by Category' },
  'news.source_title': { ko: '소스별 뉴스', en: 'News by Source' },
  'news.source_subtitle': { ko: '한국 AI 미디어 소식', en: 'Korean AI Media' },
  'news.more': { ko: '개 더보기', en: ' more' },
  'news.show_more': { ko: '더보기', en: 'Show more' },
  'news.no_news': { ko: '아직 뉴스가 없어요', en: 'No news yet' },
  'news.connection_error': { ko: '연결에 문제가 있어요', en: 'Connection error' },
  'news.retry': { ko: '다시 시도', en: 'Retry' },

  // ─── 카테고리 ───
  'cat.model_research': { ko: '모델/연구', en: 'Models & Research' },
  'cat.product_tools': { ko: '제품/도구', en: 'Products & Tools' },
  'cat.industry_business': { ko: '산업/비즈니스', en: 'Industry & Business' },

  // ─── 요약 모달 ───
  'modal.one_line': { ko: '핵심 한줄', en: 'Key Takeaway' },
  'modal.key_points': { ko: '주요 포인트', en: 'Key Points' },
  'modal.why_important': { ko: '왜 중요해요?', en: 'Why It Matters' },
  'modal.no_summary': { ko: '아직 AI 요약이 준비되지 않았어요', en: 'AI summary not ready yet' },
  'modal.check_original': { ko: '원문을 직접 확인해보세요', en: 'Check the original article' },
  'modal.view_original': { ko: '원문 보기', en: 'View Original' },
  'modal.close': { ko: '닫기', en: 'Close' },
  'modal.like': { ko: '좋아요', en: 'Like' },
  'modal.unlike': { ko: '좋아요 취소', en: 'Unlike' },
  'modal.comment': { ko: '댓글', en: 'Comments' },
  'modal.share': { ko: '공유', en: 'Share' },

  // ─── 공유 메시지 ───
  'share.one_line_label': { ko: '💡 핵심 한줄', en: '💡 Key Takeaway' },
  'share.key_points_label': { ko: '📌 주요 포인트', en: '📌 Key Points' },
  'share.why_important_label': { ko: '⚡ 왜 중요해요?', en: '⚡ Why It Matters' },
  'share.footer': { ko: '— Ailon AI 뉴스', en: '— Ailon AI News' },

  // ─── 인증 ───
  'auth.login_required': { ko: '로그인이 필요해요', en: 'Login required' },
  'auth.login_required_toast': { ko: '로그인이 필요합니다', en: 'Please log in' },
  'auth.login_benefits': {
    ko: '로그인하면 북마크 저장, 좋아요, 댓글 등 더 많은 기능을 이용할 수 있어요',
    en: 'Log in to save bookmarks, like articles, and leave comments',
  },
  'auth.google_login': { ko: 'Google로 로그인', en: 'Sign in with Google' },
  'auth.google_start': { ko: 'Google로 시작하기', en: 'Continue with Google' },
  'auth.login_failed': { ko: '로그인에 실패했어요. 다시 시도해주세요.', en: 'Login failed. Please try again.' },
  'auth.tagline': { ko: 'AI 트렌드 / 학문 원리 / 융합 아이디어', en: 'AI Trends / Academic Principles / Synergy Ideas' },
  'auth.discover': { ko: '매일 새로운 인사이트를 발견하세요', en: 'Discover new insights every day' },
  'auth.discover_desc': {
    ko: 'AI 뉴스, 다양한 학문의 핵심 원리, 그리고\nAI와 학문이 만나는 융합 아이디어까지',
    en: 'AI news, core principles from various fields,\nand ideas where AI meets academia',
  },
  'auth.terms': {
    ko: '로그인하면 이용약관 및 개인정보처리방침에\n동의하는 것으로 간주됩니다.',
    en: 'By logging in, you agree to our\nTerms of Service and Privacy Policy.',
  },

  // ─── 프로필 ───
  'profile.title': { ko: '프로필', en: 'Profile' },
  'profile.user': { ko: '사용자', en: 'User' },
  'profile.activity': { ko: '활동 현황', en: 'Activity' },
  'profile.saved_bookmarks': { ko: '저장된 북마크', en: 'Saved bookmarks' },
  'profile.view': { ko: '보기', en: 'View' },
  'profile.signout': { ko: '로그아웃', en: 'Sign Out' },
  'profile.signout_confirm': { ko: '정말 로그아웃 하시겠어요?', en: 'Are you sure you want to sign out?' },
  'profile.signout_cancel': { ko: '취소', en: 'Cancel' },
  'profile.signing_out': { ko: '로그아웃 중...', en: 'Signing out...' },
  'profile.signout_error': { ko: '로그아웃 중 문제가 발생했어요.', en: 'An error occurred while signing out.' },
  'profile.language': { ko: '언어', en: 'Language' },
  'profile.error': { ko: '오류', en: 'Error' },

  // ─── 알림 설정 ───
  'notification.title': { ko: '알림 설정', en: 'Notifications' },
  'notification.news_alerts': { ko: '뉴스 알림', en: 'News Alerts' },
  'notification.comment_replies': { ko: '댓글 답글 알림', en: 'Comment Replies' },
  'notification.likes': { ko: '좋아요 알림', en: 'Like Notifications' },
  'notification.enable': { ko: '알림 활성화', en: 'Enable Notifications' },
  'notification.enable_desc': { ko: '푸시 알림을 받으려면 권한을 허용해주세요', en: 'Allow permissions to receive push notifications' },
  'notification.denied': { ko: '알림이 차단되어 있어요', en: 'Notifications are blocked' },
  'notification.open_settings': { ko: '설정에서 알림 켜기', en: 'Open Settings' },

  // ─── 저장 화면 ───
  'saved.title': { ko: '저장한 항목', en: 'Saved Items' },
  'saved.total': { ko: '개 저장됨', en: ' saved' },
  'saved.empty': { ko: '저장한 항목이 없어요', en: 'No saved items' },
  'saved.no_items_yet': { ko: '아직 저장한 항목이 없어요', en: 'No saved items yet' },
  'saved.bookmark_hint': { ko: '뉴스, 원리, 아이디어를 북마크해보세요', en: 'Bookmark news, principles, and ideas' },
  'saved.bookmark_login': { ko: '북마크 기능을 사용하려면 로그인해주세요', en: 'Please log in to use bookmarks' },
  'saved.delete': { ko: '북마크 삭제', en: 'Delete bookmark' },
  'saved.view_original': { ko: '원문 보기', en: 'View original' },
  'saved.type_news': { ko: '뉴스', en: 'News' },
  'saved.type_principle': { ko: '원리', en: 'Principles' },
  'saved.type_idea': { ko: '아이디어', en: 'Ideas' },

  // ─── 스낵/아이디어 ───
  'snaps.title': { ko: '학문 스낵', en: 'Snacks' },
  'ideas.title': { ko: '시너지 랩', en: 'Synergy' },
  'placeholder.preparing': { ko: '준비 중이에요', en: 'Coming soon' },
  'placeholder.preparing_desc': { ko: '새로운 콘텐츠를 준비하고 있어요', en: 'New content is being prepared' },

  // ─── 소스 이름 ───
  'source.aitimes': { ko: 'AI타임스', en: 'AI Times' },
  'source.zdnet_ai_editor': { ko: 'ZDNet AI 에디터', en: 'ZDNet AI Editor' },
  'source.yozm_ai': { ko: '요즘IT AI', en: 'Yozm IT AI' },

  // ─── 사이드 드로어 ───
  'drawer.title': { ko: 'AI News', en: 'AI News' },
  'drawer.desc': { ko: '14개 소스에서 최신 AI 뉴스를 수집합니다.', en: 'Aggregating the latest AI news from 14 sources.' },

  // ─── 댓글 ───
  'comment.title': { ko: '댓글', en: 'Comments' },
  'comment.first': { ko: '첫 댓글을 남겨보세요', en: 'Be the first to comment' },
  'comment.curious': { ko: '여러분의 생각이 궁금해요', en: 'Share your thoughts' },
  'comment.reply': { ko: '답글', en: 'Reply' },
  'comment.reply_to': { ko: '에게 답글', en: 'replying to' },
  'comment.placeholder': { ko: '댓글을 입력하세요...', en: 'Write a comment...' },
  'comment.reply_placeholder': { ko: '에게 답글...', en: 'replying to...' },
  'comment.login_required': { ko: '댓글을 작성하려면 로그인이 필요해요', en: 'Log in to leave a comment' },
  'comment.login': { ko: '로그인하기', en: 'Log in' },

  // ─── 메뉴 ───
  'menu.open': { ko: '메뉴 열기', en: 'Open menu' },
};

export default translations;
