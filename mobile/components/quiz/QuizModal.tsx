/**
 * Quiz Modal — 전체 화면 퀴즈 경험
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, ScrollView, Share } from 'react-native';
import { X, Check, XCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useQuiz } from '@/hooks/useQuiz';
import type { QuizQuestion } from '@/lib/types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22C55E',
  medium: '#F59E0B',
  hard: '#EF4444',
};

export function QuizModal({ visible, onClose }: Props) {
  const { lang, t } = useLanguage();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { quiz, answers, score, submitAnswer, reset } = useQuiz();
  const [currentQ, setCurrentQ] = useState(0);

  const questions = quiz?.questions ?? [];
  const total = questions.length;
  const allAnswered = Object.keys(answers).length >= total && total > 0;

  const handleSelect = useCallback((optIdx: number) => {
    if (answers[currentQ] !== undefined) return; // already answered
    submitAnswer(currentQ, optIdx);
  }, [currentQ, answers, submitAnswer]);

  const handleNext = useCallback(() => {
    if (currentQ < total - 1) {
      setCurrentQ(prev => prev + 1);
    }
  }, [currentQ, total]);

  const handleRetry = useCallback(() => {
    reset();
    setCurrentQ(0);
  }, [reset]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${t('quiz.title')}: ${score}/100${t('quiz.score')}\n— Ailon AI News`,
      });
    } catch {}
  }, [score, t]);

  const handleClose = useCallback(() => {
    handleRetry();
    onClose();
  }, [handleRetry, onClose]);

  if (!quiz || total === 0) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
        <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
          <Text style={{ color: colors.textSecondary, fontSize: 15 }}>{t('briefing.no_data')}</Text>
          <Pressable onPress={handleClose} style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 10 }}>
            <Text style={{ color: '#FFF', fontWeight: '700' }}>{t('quiz.close')}</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  const q: QuizQuestion = questions[currentQ];
  const qText = lang === 'en' ? q.question_en : q.question_ko;
  const options = lang === 'en' ? q.options_en : q.options_ko;
  const answered = answers[currentQ] !== undefined;
  const isCorrect = answered && answers[currentQ] === q.correct_index;
  const explanation = lang === 'en' ? q.explanation_en : q.explanation_ko;
  const diffLabel = t(`quiz.difficulty_${q.difficulty}`);
  const diffColor = DIFFICULTY_COLORS[q.difficulty] ?? colors.textSecondary;

  // Results screen
  if (allAnswered && currentQ >= total - 1 && answered) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
        <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>{t('quiz.results')}</Text>
            <Pressable onPress={handleClose} accessibilityLabel={t('quiz.close')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <View style={{
              width: 120, height: 120, borderRadius: 60,
              backgroundColor: colors.summaryIndigo + '20',
              alignItems: 'center', justifyContent: 'center', marginBottom: 24,
            }}>
              <Text style={{ fontSize: 36, fontWeight: '800', color: colors.summaryIndigo }}>{score}</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>/100</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, textAlign: 'center', marginBottom: 32 }}>
              {score >= 80 ? (lang === 'en' ? 'Excellent!' : '훌륭해요!') :
               score >= 60 ? (lang === 'en' ? 'Good job!' : '잘했어요!') :
               (lang === 'en' ? 'Keep learning!' : '다음엔 더 잘할 수 있어요!')}
            </Text>
            <Pressable onPress={handleRetry} style={{ backgroundColor: colors.summaryIndigo, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginBottom: 12, width: '100%', alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>{t('quiz.retry')}</Text>
            </Pressable>
            <Pressable onPress={handleShare} style={{ backgroundColor: colors.surface, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 15 }}>{t('quiz.share')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
            {t('quiz.question')} {currentQ + 1}{t('quiz.of')}{total}
          </Text>
          <Pressable onPress={handleClose} accessibilityLabel={t('quiz.close')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <X size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Progress bar */}
        <View style={{ height: 4, backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 2, marginBottom: 16 }}>
          <View style={{ height: 4, backgroundColor: colors.summaryIndigo, borderRadius: 2, width: `${((currentQ + 1) / total) * 100}%` }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {/* Difficulty badge */}
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <View style={{ backgroundColor: diffColor + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: diffColor }}>{diffLabel}</Text>
            </View>
          </View>

          {/* Question */}
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, lineHeight: 28, marginBottom: 24 }}>
            {qText}
          </Text>

          {/* Options */}
          {options.map((opt, idx) => {
            const selected = answers[currentQ] === idx;
            const correct = idx === q.correct_index;
            let optBg = colors.card;
            let optBorder = colors.border;
            let optTextColor = colors.textPrimary;

            if (answered) {
              if (correct) {
                optBg = '#22C55E18';
                optBorder = '#22C55E';
                optTextColor = '#16A34A';
              } else if (selected && !correct) {
                optBg = '#EF444418';
                optBorder = '#EF4444';
                optTextColor = '#DC2626';
              }
            } else if (selected) {
              optBg = colors.summaryIndigo + '18';
              optBorder = colors.summaryIndigo;
            }

            return (
              <Pressable
                key={idx}
                onPress={() => handleSelect(idx)}
                disabled={answered}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: optBg,
                  borderWidth: 1.5, borderColor: optBorder,
                  borderRadius: 12, padding: 14, marginBottom: 10,
                }}
              >
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: answered && correct ? '#22C55E' : colors.surface,
                  alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  {answered && correct ? (
                    <Check size={14} color="#FFF" />
                  ) : answered && selected && !correct ? (
                    <XCircle size={14} color="#EF4444" />
                  ) : (
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  )}
                </View>
                <Text style={{ flex: 1, fontSize: 15, color: optTextColor, lineHeight: 22 }}>{opt}</Text>
              </Pressable>
            );
          })}

          {/* Feedback */}
          {answered && (
            <View style={{
              backgroundColor: isCorrect ? '#22C55E10' : '#EF444410',
              borderRadius: 12, padding: 14, marginTop: 8, marginBottom: 16,
            }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: isCorrect ? '#16A34A' : '#DC2626', marginBottom: 4 }}>
                {isCorrect ? t('quiz.correct') : t('quiz.incorrect')}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 20 }}>{explanation}</Text>
            </View>
          )}

          {/* Next button */}
          {answered && currentQ < total - 1 && (
            <Pressable onPress={handleNext} style={{ backgroundColor: colors.summaryIndigo, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>{t('quiz.next')}</Text>
            </Pressable>
          )}

          {/* Show results when last question answered */}
          {answered && currentQ >= total - 1 && (
            <Pressable onPress={handleNext} style={{ backgroundColor: colors.summaryIndigo, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>{t('quiz.results')}</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
