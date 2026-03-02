/**
 * HighlightedText — 용어 사전의 term을 자동 감지하여 밑줄 표시
 * 탭하면 해당 용어의 설명을 표시
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import type { GlossaryTerm } from '@/lib/types';

interface Props {
  text: string;
  glossaryTerms: GlossaryTerm[];
  style?: any;
}

/** 매칭 위치가 단어 경계인지 검사. 앞뒤가 영문자/숫자면 단어 내부 → false */
function isWordBoundary(text: string, start: number, len: number): boolean {
  if (start > 0) {
    const prev = text.charCodeAt(start - 1);
    if ((prev >= 65 && prev <= 90) || (prev >= 97 && prev <= 122) || (prev >= 48 && prev <= 57)) return false;
  }
  const end = start + len;
  if (end < text.length) {
    const next = text.charCodeAt(end);
    if ((next >= 65 && next <= 90) || (next >= 97 && next <= 122) || (next >= 48 && next <= 57)) return false;
  }
  return true;
}

/** 너무 당연한 용어는 하이라이트하지 않음 */
const COMMON_TERMS = new Set([
  // 영어
  'ai', 'artificial intelligence', 'machine learning', 'deep learning',
  'ml', 'dl', 'api', 'gpu', 'cpu', 'data', 'model', 'algorithm',
  'automation', 'cloud', 'software', 'hardware', 'tech', 'technology',
  'ai model', 'ai agent', 'open source', 'dataset',
  // 한국어
  '인공지능', '머신러닝', '딥러닝', '자동화', '검열', '데이터',
  'ai 기반', 'ai 모델', 'ai 에이전트', '오픈소스', '알고리즘',
  '클라우드', '소프트웨어', '하드웨어', '모델', '기술',
]);

export const HighlightedText = React.memo(function HighlightedText({ text, glossaryTerms, style }: Props) {
  const { lang } = useLanguage();
  const { colors } = useTheme();
  const [popover, setPopover] = useState<GlossaryTerm | null>(null);

  // Build segments with highlighted terms
  const segments = useMemo(() => {
    if (!glossaryTerms || glossaryTerms.length === 0 || !text) {
      return [{ text, term: null }];
    }

    // 불용어 필터: 너무 일반적인 용어 제외
    const filtered = glossaryTerms.filter(t => {
      const en = (t.term_en ?? '').toLowerCase();
      const ko = (t.term_ko ?? '').toLowerCase();
      return !COMMON_TERMS.has(en) && !COMMON_TERMS.has(ko);
    });

    // Sort by term length (longest first) to avoid partial matches
    const sorted = [...filtered].sort((a, b) => {
      const aLen = (lang === 'en' ? a.term_en : a.term_ko).length;
      const bLen = (lang === 'en' ? b.term_en : b.term_ko).length;
      return bLen - aLen;
    });

    type Segment = { text: string; term: GlossaryTerm | null };
    let result: Segment[] = [{ text, term: null }];

    for (const term of sorted) {
      const termText = lang === 'en' ? term.term_en : term.term_ko;
      if (!termText) continue;

      const newResult: Segment[] = [];
      for (const seg of result) {
        if (seg.term) {
          newResult.push(seg);
          continue;
        }
        const lowerSeg = seg.text.toLowerCase();
        const lowerTerm = termText.toLowerCase();
        let lastIdx = 0;

        // 첫 번째 유효한(단어 경계) 매칭만 찾기
        let idx = lowerSeg.indexOf(lowerTerm);
        while (idx !== -1) {
          if (isWordBoundary(lowerSeg, idx, lowerTerm.length)) {
            if (idx > lastIdx) {
              newResult.push({ text: seg.text.slice(lastIdx, idx), term: null });
            }
            newResult.push({ text: seg.text.slice(idx, idx + termText.length), term });
            lastIdx = idx + termText.length;
            break; // 첫 번째만 감지
          }
          idx = lowerSeg.indexOf(lowerTerm, idx + 1); // 경계 아니면 다음 위치 시도
        }

        if (lastIdx < seg.text.length) {
          newResult.push({ text: seg.text.slice(lastIdx), term: null });
        } else if (lastIdx === 0) {
          newResult.push(seg); // 매칭 없으면 원본 유지
        }
      }
      result = newResult;
    }
    return result;
  }, [text, glossaryTerms, lang]);

  const handleTermPress = useCallback((term: GlossaryTerm) => {
    setPopover(term);
  }, []);

  return (
    <>
      <Text style={style}>
        {segments.map((seg, idx) => {
          if (seg.term) {
            return (
              <Text
                key={idx}
                onPress={() => handleTermPress(seg.term!)}
                style={{
                  ...style,
                  textDecorationLine: 'underline',
                  textDecorationStyle: 'dotted',
                  color: colors.summaryIndigo,
                  fontWeight: '600',
                }}
              >
                {seg.text}
              </Text>
            );
          }
          return <Text key={idx}>{seg.text}</Text>;
        })}
      </Text>

      {/* Term Popover */}
      <Modal visible={!!popover} transparent animationType="fade" onRequestClose={() => setPopover(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 32 }} onPress={() => setPopover(null)}>
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, maxHeight: 300 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.summaryIndigo, marginBottom: 8 }}>
              {popover ? (lang === 'en' ? popover.term_en : popover.term_ko) : ''}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 22 }}>
              {popover ? (lang === 'en' ? popover.desc_en : popover.desc_ko) : ''}
            </Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
});
