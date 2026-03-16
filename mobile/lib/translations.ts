/**
 * 다국어 번역 사전 (한국어 / 영어)
 */

export type Language = 'ko' | 'en';

const translations: Record<string, Record<Language, string>> = {
  // ─── 탭 이름 ───
  'tab.news': { ko: 'AI 트렌드', en: 'AI Trends' },
  'tab.snaps': { ko: '학문 스낵', en: 'Snacks' },
  'tab.tools': { ko: 'AI 도구', en: 'Tools' },
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
  'news.collapse': { ko: '접기', en: 'Collapse' },
  'news.no_news': { ko: '아직 뉴스가 없어요', en: 'No news yet' },
  'news.connection_error': { ko: '연결에 문제가 있어요', en: 'Connection error' },
  'news.retry': { ko: '다시 시도', en: 'Retry' },

  // ─── 카테고리 ───
  'cat.research': { ko: '연구', en: 'Research' },
  'cat.models_products': { ko: '모델/제품', en: 'Models & Products' },
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
  'modal.background': { ko: '배경', en: 'Background' },
  'modal.glossary': { ko: '용어 해설', en: 'Glossary' },
  'modal.tags': { ko: '키워드', en: 'Keywords' },
  'article.ai_summary': { ko: 'AI 요약', en: 'AI Summary' },
  'article.read_original': { ko: '원문 보기', en: 'Read Original' },

  // ─── 공유 메시지 ───
  'share.one_line_label': { ko: '💡 핵심 한줄', en: '💡 Key Takeaway' },
  'share.key_points_label': { ko: '📌 주요 포인트', en: '📌 Key Points' },
  'share.why_important_label': { ko: '⚡ 왜 중요해요?', en: '⚡ Why It Matters' },
  'share.footer': { ko: '— AILON AI 뉴스', en: '— AILON AI News' },

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
  'auth.tagline': { ko: 'AI 트렌드 / 학문 원리', en: 'AI Trends / Academic Principles' },
  'auth.discover': { ko: '매일 새로운 인사이트를 발견하세요', en: 'Discover new insights every day' },
  'auth.discover_desc': {
    ko: 'AI 뉴스와 다양한 학문의 핵심 원리를\n매일 새롭게 만나보세요',
    en: 'AI news and core principles from various fields,\ndelivered fresh every day',
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
  'profile.dark_mode': { ko: '다크 모드', en: 'Dark Mode' },
  'profile.theme': { ko: '테마', en: 'Theme' },
  'profile.error': { ko: '오류', en: 'Error' },
  'profile.legal': { ko: '법률 정보', en: 'Legal' },
  'profile.privacy_policy': { ko: '개인정보 처리방침', en: 'Privacy Policy' },
  'profile.terms_of_service': { ko: '이용약관', en: 'Terms of Service' },
  'profile.settings': { ko: '설정', en: 'Settings' },
  'profile.more': { ko: '기타', en: 'More' },

  // ─── 알림 설정 ───
  'notification.title': { ko: '알림', en: 'Notifications' },
  'notification.empty': { ko: '아직 받은 알림이 없어요', en: 'No notifications yet' },
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
  'saved.delete_confirm': { ko: '이 북마크를 삭제할까요?', en: 'Delete this bookmark?' },
  'saved.delete_cancel': { ko: '취소', en: 'Cancel' },
  'saved.delete_action': { ko: '삭제', en: 'Delete' },
  'saved.view_original': { ko: '원문 보기', en: 'View original' },
  'saved.type_news': { ko: '뉴스', en: 'News' },
  'saved.type_principle': { ko: '원리', en: 'Principles' },

  // ─── 스낵/원리 (snaps.tsx) ───
  'snaps.title': { ko: '학문 스낵', en: 'Snacks' },
  'snaps.tab_insight': { ko: '인사이트', en: 'Insight' },
  'snaps.tab_deepdive': { ko: '딥다이브', en: 'Deep Dive' },
  'snaps.foundation': { ko: '원리 발견', en: 'Discovery' },
  'snaps.application': { ko: 'AI의 난제', en: 'AI Challenge' },
  'snaps.integration': { ko: '현실 임팩트', en: 'Impact' },
  'snaps.next_application': { ko: '다음: AI의 난제 →', en: 'Next: AI Challenge →' },
  'snaps.next_integration': { ko: '다음: 현실 임팩트 →', en: 'Next: Impact →' },
  'snaps.complete': { ko: '완료!', en: 'Complete!' },
  'snaps.problem': { ko: 'AI의 난제', en: 'AI Challenge' },
  'snaps.original_problem': { ko: '원래 문제', en: 'Original Problem' },
  'snaps.bridge': { ko: '영감의 다리', en: 'The Bridge' },
  'snaps.core_intuition': { ko: '핵심 직관', en: 'Core Intuition' },
  'snaps.formula': { ko: '수식/공식', en: 'Formula' },
  'snaps.limits': { ko: '한계와 열린 질문', en: 'Limits & Open Questions' },
  'snaps.no_content': { ko: '아직 콘텐츠가 없어요', en: 'No content yet' },
  'snaps.no_content_desc': { ko: '새로운 학문 인사이트를 준비하고 있어요', en: 'New academic insights are being prepared' },
  'snaps.read_time': { ko: '읽기', en: 'read' },
  'principle.connection_error': { ko: '연결에 문제가 있어요', en: 'Connection error' },
  'principle.retry': { ko: '다시 시도', en: 'Retry' },

  // ─── 소스 이름 ───
  'source.aitimes': { ko: 'AI타임스', en: 'AI Times' },
  'source.zdnet_ai_editor': { ko: 'ZDNet AI 에디터', en: 'ZDNet AI Editor' },
  'source.yozm_ai': { ko: '요즘IT AI', en: 'Yozm IT AI' },

  // ─── 사이드 드로어 ───
  'drawer.title': { ko: 'AI News', en: 'AI News' },
  'drawer.desc': { ko: '22개 소스에서 최신 AI 뉴스를 수집합니다.', en: 'Aggregating the latest AI news from 22 sources.' },

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
  'comment.send': { ko: '댓글 전송', en: 'Send comment' },
  'comment.close': { ko: '댓글 닫기', en: 'Close comments' },
  'comment.delete': { ko: '삭제', en: 'Delete' },
  'comment.delete_confirm': { ko: '이 댓글을 삭제할까요?', en: 'Delete this comment?' },
  'comment.delete_cancel': { ko: '취소', en: 'Cancel' },
  'comment.hidden': { ko: '신고로 인해 숨겨진 댓글입니다', en: 'This comment has been hidden due to reports' },
  'comment.report': { ko: '신고', en: 'Report' },
  'comment.report_title': { ko: '댓글 신고', en: 'Report Comment' },
  'comment.report_confirm': { ko: '이 댓글을 신고하시겠습니까?', en: 'Report this comment?' },
  'comment.report_reason': { ko: '신고 사유를 선택해주세요', en: 'Select a reason' },
  'comment.report_abuse': { ko: '욕설/비방', en: 'Abuse / Harassment' },
  'comment.report_spam': { ko: '스팸/광고', en: 'Spam / Advertising' },
  'comment.report_misinfo': { ko: '허위정보', en: 'Misinformation' },
  'comment.report_other': { ko: '기타', en: 'Other' },
  'comment.report_cancel': { ko: '취소', en: 'Cancel' },
  'comment.report_submit': { ko: '신고하기', en: 'Submit Report' },
  'comment.report_success': { ko: '신고가 접수되었습니다', en: 'Report submitted' },
  'comment.report_already': { ko: '이미 신고한 댓글입니다', en: 'You have already reported this comment' },
  'comment.report_login': { ko: '로그인이 필요합니다', en: 'Please log in first' },

  // ─── 메뉴 ───
  'menu.open': { ko: '메뉴 열기', en: 'Open menu' },

  // ─── 리액션/피드백/북마크 ───
  'reaction.comment': { ko: '댓글', en: 'Comments' },
  'reaction.share': { ko: '공유', en: 'Share' },
  'feedback.like': { ko: '좋아요', en: 'Like' },
  'feedback.dislike': { ko: '별로예요', en: 'Not great' },
  'bookmark.remove': { ko: '북마크 제거', en: 'Remove bookmark' },
  'bookmark.add': { ko: '북마크 추가', en: 'Add bookmark' },
  'news.articles_suffix': { ko: '개', en: '' },

  // ─── 브리핑 ───
  'briefing.title': { ko: '오늘의 브리핑', en: "Today's Briefing" },
  'briefing.listen': { ko: '듣기', en: 'Listen' },
  'briefing.stop': { ko: '중지', en: 'Stop' },
  'briefing.stories': { ko: '개 스토리', en: ' stories' },
  'briefing.no_data': { ko: '브리핑 준비 중...', en: 'Preparing briefing...' },
  'briefing.highlights': { ko: '하이라이트', en: 'Highlights' },
  'briefing.topics': { ko: '주요 토픽', en: 'Key Topics' },
  'briefing.categories': { ko: '카테고리', en: 'Categories' },
  'briefing.readMore': { ko: '자세히 보기', en: 'Read More' },
  'briefing.collapse': { ko: '접기', en: 'Collapse' },
  'briefing.articles': { ko: '기사', en: 'Articles' },
  'briefing.hotTopics': { ko: '핫 토픽', en: 'Hot Topics' },
  'briefing.categoryDist': { ko: '카테고리 분포', en: 'Category Distribution' },
  'briefing.trend': { ko: '7일 추이', en: '7-Day Trend' },
  'briefing.briefingText': { ko: '브리핑', en: 'Briefing' },
  'briefing.infographic': { ko: 'Daily Infographic', en: 'Daily Infographic' },
  'briefing.domainDist': { ko: '토픽 도메인 분포', en: 'Topic Domain Distribution' },

  // ─── 도메인 라벨 ───
  'domain.NLP': { ko: '자연어처리', en: 'NLP' },
  'domain.Vision': { ko: '비전', en: 'Vision' },
  'domain.ML': { ko: '머신러닝', en: 'ML' },
  'domain.Robotics': { ko: '로보틱스', en: 'Robotics' },
  'domain.Multimodal': { ko: '멀티모달', en: 'Multimodal' },
  'domain.Infra': { ko: '인프라', en: 'Infra' },
  'domain.Business': { ko: '비즈니스', en: 'Business' },
  'domain.Regulation': { ko: '규제·안전', en: 'Regulation' },
  'domain.Audio': { ko: '오디오', en: 'Audio' },
  'domain.Others': { ko: '기타', en: 'Others' },


  // ─── 타임라인 ───
  'modal.timeline': { ko: '관련 타임라인', en: 'Related Timeline' },
  'timeline.past': { ko: '이전 기사', en: 'Past Articles' },
  'timeline.no_data': { ko: '타임라인 없음', en: 'No timeline' },

  // ─── 관련 기사 ───
  'modal.related': { ko: '관련 기사', en: 'Related Articles' },

  // ─── 용어 사전 DB ───
  'glossary.title': { ko: '용어 사전', en: 'Glossary' },
  'glossary.search': { ko: '용어 검색...', en: 'Search terms...' },
  'glossary.no_results': { ko: '검색 결과 없음', en: 'No results' },
  'glossary.articles': { ko: '관련 기사', en: 'Related Articles' },

  // ─── 맞춤 피드 ───
  'feed.personalized': { ko: '맞춤', en: 'For You' },
  'feed.all': { ko: '전체', en: 'All' },
  'feed.reason': { ko: '추천 이유', en: 'Why recommended' },
  'feed.interest_match': { ko: '관심사 일치', en: 'Matches your interests' },
  'feed.no_data': { ko: '맞춤 뉴스 준비 중', en: 'Personalizing...' },

  // ─── AI 스토리 타임라인 ───
  'story.title': { ko: 'AI 스토리', en: 'AI Stories' },
  'story.count': { ko: '개 스토리', en: ' stories' },
  'story.summary': { ko: '정리하면', en: 'In summary' },
  'story.no_data': { ko: '오늘의 스토리를 준비하고 있어요', en: 'Preparing today\'s stories' },

  // ─── Tools 탭 (Phase 2) ───
  'snaps.tab_tools': { ko: 'AI 도구', en: 'AI Tools' },
  'tools.title': { ko: 'AI 도구 & 팁', en: 'AI Tools & Tips' },
  'tools.section_tools': { ko: '오늘의 도구', en: "Today's Tools" },
  'tools.section_tips': { ko: '오늘의 팁', en: "Today's Tips" },
  'tools.no_content': { ko: '아직 도구 추천이 없어요', en: 'No tool recommendations yet' },
  'tools.no_content_desc': { ko: '새로운 AI 도구를 준비하고 있어요', en: 'New AI tool picks are being prepared' },
  'tools.try_it': { ko: '사용해보기', en: 'Try it' },
  'tools.beginner': { ko: '입문', en: 'Beginner' },
  'tools.intermediate': { ko: '중급', en: 'Intermediate' },
  'tools.advanced': { ko: '고급', en: 'Advanced' },
  'tools.cat_coding': { ko: '코딩', en: 'Coding' },
  'tools.cat_research': { ko: '리서치', en: 'Research' },
  'tools.cat_productivity': { ko: '생산성', en: 'Productivity' },
  'tools.cat_creative': { ko: '크리에이티브', en: 'Creative' },
  'tools.cat_writing': { ko: '글쓰기', en: 'Writing' },
  'tools.cat_other': { ko: '기타', en: 'Other' },
  'saved.type_tool': { ko: '도구', en: 'Tools' },
};

export default translations;
