/**
 * URL 기반 기사 공유 훅
 * 웹 공유 페이지 URL을 생성하여 OS 공유 시트로 전달
 */
import { useCallback } from 'react';
import { Share, Platform } from 'react-native';

const SHARE_DOMAIN = 'ailon-46131.web.app';

export function useShareLink() {
  const shareArticleLink = useCallback(
    async (articleId: string, title: string, oneLine: string, lang?: string) => {
      const langParam = lang ? `?lang=${lang}` : '';
      const url = `https://${SHARE_DOMAIN}/article/${articleId}${langParam}`;
      const message = `${url}\n\n${title}\n${oneLine}`;

      try {
        await Share.share(
          Platform.OS === 'ios'
            ? { message: `${title}\n${oneLine}`, url }
            : { message },
        );
      } catch (err) {
        console.warn('Share failed:', err);
      }
    },
    [],
  );

  return { shareArticleLink };
}
