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

export const HighlightedText = React.memo(function HighlightedText({ text, glossaryTerms, style }: Props) {
  const { lang } = useLanguage();
  const { colors } = useTheme();
  const [popover, setPopover] = useState<GlossaryTerm | null>(null);

  // Build segments with highlighted terms
  const segments = useMemo(() => {
    if (!glossaryTerms || glossaryTerms.length === 0 || !text) {
      return [{ text, term: null }];
    }

    // Sort by term length (longest first) to avoid partial matches
    const sorted = [...glossaryTerms].sort((a, b) => {
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
        let idx = lowerSeg.indexOf(lowerTerm);
        if (idx === -1) {
          newResult.push(seg);
          continue;
        }
        while (idx !== -1) {
          if (idx > lastIdx) {
            newResult.push({ text: seg.text.slice(lastIdx, idx), term: null });
          }
          newResult.push({ text: seg.text.slice(idx, idx + termText.length), term });
          lastIdx = idx + termText.length;
          idx = lowerSeg.indexOf(lowerTerm, lastIdx);
        }
        if (lastIdx < seg.text.length) {
          newResult.push({ text: seg.text.slice(lastIdx), term: null });
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
