/**
 * URL 기반 기사 공유 훅 (단일 공유 진입점)
 * - shareArticleLink: 웹 공유 페이지 URL → OS 공유 시트
 * - shareTextFallback: article_id 없는 레거시 기사 → 원문 링크 텍스트 공유
 *
 * 메시지 포맷: 제목 → 한줄요약 → URL → 브랜딩 (사람이 읽는 순서)
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
      const body = oneLine ? `${title}\n${oneLine}` : title;
      const message = `${body}\n\n${url}\n\n${FOOTER}`;

      try {
        await Share.share(
          Platform.OS === 'ios'
            ? { message: `${body}\n\n${FOOTER}`, url }
            : { message },
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
