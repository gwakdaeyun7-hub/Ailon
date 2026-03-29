/**
 * URL 기반 기사 공유 훅 (단일 공유 진입점)
 * - shareArticleLink: 웹 공유 페이지 URL만 전송 → OG 프리뷰(썸네일+제목)만 표시
 * - shareTextFallback: article_id 없는 레거시 기사 → 원문 링크 텍스트 공유
 */
import { useCallback } from 'react';
import { Share, Platform } from 'react-native';

const SHARE_DOMAIN = 'ailon-46131.web.app';
const FOOTER = '— AILON';

export function useShareLink() {
  const shareArticleLink = useCallback(
    async (articleId: string, title: string, oneLine: string, lang?: string) => {
      const langParam = lang ? `?lang=${lang}` : '';
      const url = `https://${SHARE_DOMAIN}/article/${articleId}${langParam}`;

      try {
        await Share.share(
          Platform.OS === 'ios'
            ? { url }
            : { message: url },
        );
      } catch (err) {
        console.warn('Share failed:', err);
      }
    },
    [],
  );

  const shareTextFallback = useCallback(
    async (title: string, link: string) => {
      const message = link
        ? `${title}\n\n${link}\n\n${FOOTER}`
        : `${title}\n\n${FOOTER}`;
      try {
        await Share.share({ message });
      } catch (err) {
        console.warn('Share failed:', err);
      }
    },
    [],
  );

  return { shareArticleLink, shareTextFallback };
}
