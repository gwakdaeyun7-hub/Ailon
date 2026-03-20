/**
 * 이미지 캡처 공유 훅
 * react-native-view-shot으로 오프스크린 ShareCard를 캡처 → expo-sharing으로 공유
 * 실패 시 기존 텍스트 공유로 폴백
 */
import { useRef, useState, useCallback } from 'react';
import { Share, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export function useShareImage() {
  const shareCardRef = useRef<View>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const shareAsImage = useCallback(async (fallbackText: string) => {
    // 이미지 캡처 시도
    if (shareCardRef.current) {
      setIsCapturing(true);
      try {
        const uri = await captureRef(shareCardRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
        });
        setIsCapturing(false);
        return;
      } catch (err) {
        console.warn('Image capture failed, falling back to text:', err);
        setIsCapturing(false);
      }
    }

    // 텍스트 폴백
    try {
      await Share.share({ message: fallbackText });
    } catch (err) {
      console.warn('Share failed:', err);
    }
  }, []);

  return { shareCardRef, shareAsImage, isCapturing };
}
