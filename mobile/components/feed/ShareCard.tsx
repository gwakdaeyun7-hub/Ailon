/**
 * 브랜디드 공유 카드 (캡처 전용 — 오프스크린 렌더)
 * react-native-view-shot으로 이미지 캡처 후 공유
 * 항상 라이트 테마, 고정 너비 360px
 */
import React from 'react';
import { View, Text, Image as RNImage } from 'react-native';
import type { Article } from '@/lib/types';
import type { Language } from '@/lib/translations';
import {
  SOURCE_COLORS, CATEGORY_COLORS,
  getSourceName, getCategoryName, formatDate,
  getLocalizedTitle, getLocalizedOneLine, getLocalizedSections,
  getLocalizedWhyImportant,
} from '@/lib/articleHelpers';
import { LightColors } from '@/lib/colors';
import { FontFamily } from '@/lib/theme';

const C = LightColors;
const CARD_WIDTH = 360;

interface ShareCardProps {
  article: Article;
  lang: Language;
  t: (key: string) => string;
}

export const ShareCard = React.forwardRef<View, ShareCardProps>(
  function ShareCard({ article, lang, t }, ref) {
    const title = getLocalizedTitle(article, lang);
    const oneLine = getLocalizedOneLine(article, lang);
    const sections = getLocalizedSections(article, lang);
    const whyImportant = getLocalizedWhyImportant(article, lang);
    const tags = (lang === 'en' && article.tags_en?.length) ? article.tags_en : article.tags;
    const sourceColor = SOURCE_COLORS[article.source_key || ''] || C.primary;
    const catColor = CATEGORY_COLORS[article.category || ''] || C.textSecondary;

    return (
      <View
        ref={ref}
        style={{
          width: CARD_WIDTH,
          backgroundColor: C.card,
          borderRadius: 16,
          overflow: 'hidden',
        }}
        collapsable={false}
      >
        {/* 썸네일 */}
        {article.image_url ? (
          <RNImage
            source={{ uri: article.image_url }}
            style={{ width: CARD_WIDTH, height: 190 }}
            resizeMode="cover"
          />
        ) : null}

        <View style={{ padding: 20 }}>
          {/* 소스 뱃지 + 날짜 + 카테고리 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <View style={{
              backgroundColor: sourceColor,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}>
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>
                {getSourceName(article.source_key || '', t)}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: C.textSecondary }}>
              {formatDate(article.published, lang, article.date_estimated)}
            </Text>
            {article.category ? (
              <Text style={{ fontSize: 11, color: catColor, fontWeight: '600' }}>
                {getCategoryName(article.category, t)}
              </Text>
            ) : null}
          </View>

          {/* 제목 */}
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: C.textPrimary,
            lineHeight: 26,
            fontFamily: FontFamily.serif,
            marginBottom: 14,
          }}>
            {title}
          </Text>

          {/* 한줄요약 */}
          {oneLine ? (
            <View style={{
              backgroundColor: C.primaryLight,
              borderRadius: 10,
              padding: 14,
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 14, color: C.primary, fontWeight: '600', lineHeight: 20 }}>
                {oneLine}
              </Text>
            </View>
          ) : null}

          {/* 핵심 포인트 (sections) */}
          {sections.length > 0 ? (
            <View style={{ marginBottom: 16 }}>
              {sections.map((section, i) => (
                <View key={i} style={{ marginTop: i === 0 ? 0 : 12, ...(i > 0 ? { borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 12 } : {}) }}>
                  {section.subtitle ? (
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.textPrimary, fontFamily: FontFamily.serif, marginBottom: 4 }}>
                      {section.subtitle}
                    </Text>
                  ) : null}
                  <Text style={{ fontSize: 13, color: C.textPrimary, lineHeight: 20 }}>
                    {section.content}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* 왜 중요한가 */}
          {whyImportant ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: C.textSecondary,
                marginBottom: 8,
                fontFamily: FontFamily.serif,
              }}>
                {t('modal.why_important')}
              </Text>
              <Text style={{ fontSize: 13, color: C.textPrimary, lineHeight: 20 }}>
                {whyImportant}
              </Text>
            </View>
          ) : null}

          {/* 태그 */}
          {tags && tags.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {tags.slice(0, 5).map((tag, i) => (
                <View key={i} style={{
                  backgroundColor: C.tagBg,
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}>
                  <Text style={{ fontSize: 11, color: C.tagText }}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* AILON 브랜딩 footer */}
          <View style={{
            borderTopWidth: 1,
            borderTopColor: C.border,
            paddingTop: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: C.primary, letterSpacing: 1 }}>
              AILON
            </Text>
            <Text style={{ fontSize: 11, color: C.textDim }}>
              {lang === 'en' ? 'AI News & Insights' : 'AI 뉴스 & 인사이트'}
            </Text>
          </View>
        </View>
      </View>
    );
  },
);
