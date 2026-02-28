/**
 * Daily Briefing Card — 뉴스 피드 상단 히어로 카드
 * TTS 기능 (expo-speech optional)
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Newspaper, Volume2, VolumeX } from 'lucide-react-native';
let Speech: typeof import('expo-speech') | null = null;
try { Speech = require('expo-speech'); } catch {}
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useBriefing } from '@/hooks/useBriefing';

export const DailyBriefingCard = React.memo(function DailyBriefingCard() {
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const { briefing, loading } = useBriefing();
  const [speaking, setSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const text = briefing
    ? (lang === 'en' ? briefing.briefing_en : briefing.briefing_ko)
    : '';

  const handleTTS = useCallback(() => {
    if (!Speech || !text) return;
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
    } else {
      Speech.speak(text, {
        language: lang === 'en' ? 'en-US' : 'ko-KR',
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
      });
      setSpeaking(true);
    }
  }, [speaking, text, lang]);

  if (loading || !briefing) return null;

  const preview = text.length > 120 ? text.slice(0, 120) + '...' : text;

  return (
    <View style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 8 }}>
      <View style={{
        backgroundColor: colors.highlightBg,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{
            width: 32, height: 32, borderRadius: 8,
            backgroundColor: colors.primary + '18',
            alignItems: 'center', justifyContent: 'center', marginRight: 10,
          }}>
            <Newspaper size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
              {t('briefing.title')}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              {briefing.story_count}{t('briefing.stories')}
            </Text>
          </View>
          {text ? (
            <Pressable
              onPress={handleTTS}
              accessibilityLabel={speaking ? t('briefing.stop') : t('briefing.listen')}
              accessibilityRole="button"
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: speaking ? colors.primary + '20' : colors.surface,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {speaking
                ? <VolumeX size={16} color={colors.primary} />
                : <Volume2 size={16} color={colors.textSecondary} />
              }
            </Pressable>
          ) : null}
        </View>

        {/* Body */}
        <Pressable onPress={() => setExpanded(!expanded)}>
          <Text style={{
            fontSize: 14, color: colors.textPrimary, lineHeight: 22,
          }}>
            {expanded ? text : preview}
          </Text>
          {text.length > 120 && (
            <Text style={{ fontSize: 12, color: colors.primary, marginTop: 6, fontWeight: '600' }}>
              {expanded ? t('modal.close') : t('news.show_more')}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
});
