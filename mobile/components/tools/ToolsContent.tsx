/**
 * Tools Content — AI 도구 탭 콘텐츠 (도구 카드 + 팁 섹션)
 * daily_tools/{date} 기반
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import {
  Wand2, Wrench, ExternalLink, Lightbulb,
  Code2, Search, Zap, Palette, PenTool, MoreHorizontal,
} from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Bookmark } from 'lucide-react-native';
import { cardShadow, FontFamily } from '@/lib/theme';
import type { ToolItem, TipItem, DailyTools } from '@/lib/types';

// Category icon + color mapping
const CATEGORY_CONFIG: Record<string, {
  icon: React.ComponentType<{ size: number; color: string }>;
  lightColor: string; darkColor: string;
  lightBg: string; darkBg: string;
}> = {
  coding:       { icon: Code2,          lightColor: '#0D7377', darkColor: '#14B8A6', lightBg: '#F0FDFA', darkBg: '#112525' },
  research:     { icon: Search,         lightColor: '#7C3AED', darkColor: '#A78BFA', lightBg: '#F5F3FF', darkBg: '#1E1533' },
  productivity: { icon: Zap,            lightColor: '#B45309', darkColor: '#FBBF24', lightBg: '#FFFBEB', darkBg: '#2D2513' },
  creative:     { icon: Palette,        lightColor: '#EA580C', darkColor: '#FB923C', lightBg: '#FFF7ED', darkBg: '#431407' },
  writing:      { icon: PenTool,        lightColor: '#15803D', darkColor: '#4ADE80', lightBg: '#F0FDF4', darkBg: '#052E16' },
  other:        { icon: MoreHorizontal, lightColor: '#6B7280', darkColor: '#9CA3AF', lightBg: '#F9FAFB', darkBg: '#1F2937' },
};

const DIFFICULTY_CONFIG: Record<string, { lightBg: string; lightColor: string; darkBg: string; darkColor: string }> = {
  beginner:     { lightBg: '#F0FDF4', lightColor: '#15803D', darkBg: '#052E16', darkColor: '#4ADE80' },
  intermediate: { lightBg: '#FFFBEB', lightColor: '#B45309', darkBg: '#2D2513', darkColor: '#FBBF24' },
  advanced:     { lightBg: '#FEF2F2', lightColor: '#DC2626', darkBg: '#3D1F1F', darkColor: '#FF5252' },
};

function ToolCard({ tool }: { tool: ToolItem }) {
  const { t, lang } = useLanguage();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { bookmarks, toggleBookmark } = useBookmarks(user?.uid ?? null);

  const catCfg = CATEGORY_CONFIG[tool.category] || CATEGORY_CONFIG.other;
  const diffCfg = DIFFICULTY_CONFIG[tool.difficulty] || DIFFICULTY_CONFIG.beginner;
  const accent = isDark ? catCfg.darkColor : catCfg.lightColor;
  const CatIcon = catCfg.icon;

  const name = lang === 'en' ? (tool.name_en || tool.name) : tool.name;
  const desc = lang === 'en' ? tool.description_en : tool.description_ko;
  const why = lang === 'en' ? tool.why_useful_en : tool.why_useful_ko;
  const diffLabel = t(`tools.${tool.difficulty}`);
  const catLabel = t(`tools.cat_${tool.category}`);

  const isBookmarked = bookmarks.some(b => b.type === 'tool' && b.itemId === tool.id);

  const handleBookmark = useCallback(() => {
    if (!user) return;
    toggleBookmark('tool', tool.id, {
      title: tool.name,
      subtitle: tool.description_ko,
      category: tool.category,
      link: tool.url,
    });
  }, [user, tool, toggleBookmark]);

  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: 14, marginBottom: 14,
      borderWidth: 1, borderColor: colors.border,
      overflow: 'hidden', ...cardShadow,
    }}>
      {/* Header: icon + name + badges */}
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <View style={{
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: isDark ? catCfg.darkBg : catCfg.lightBg,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <CatIcon size={16} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, fontFamily: FontFamily.serif }}>
              {name}
            </Text>
          </View>
          {/* Bookmark */}
          <Pressable onPress={handleBookmark} hitSlop={8} accessibilityLabel={lang === 'en' ? 'Bookmark tool' : '도구 북마크'}>
            <Bookmark size={18} color={isBookmarked ? colors.bookmarkActiveColor : colors.textDim}
              fill={isBookmarked ? colors.bookmarkActiveColor : 'none'} />
          </Pressable>
        </View>

        {/* Badges */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
          <View style={{
            backgroundColor: isDark ? catCfg.darkBg : catCfg.lightBg,
            borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2,
          }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: accent }}>{catLabel}</Text>
          </View>
          <View style={{
            backgroundColor: isDark ? diffCfg.darkBg : diffCfg.lightBg,
            borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2,
          }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? diffCfg.darkColor : diffCfg.lightColor }}>
              {diffLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text style={{
        fontSize: 12, lineHeight: 19, color: colors.textSecondary,
        paddingHorizontal: 16, marginBottom: 10,
      }}>
        {desc}
      </Text>

      {/* Why useful */}
      {why ? (
        <View style={{
          marginHorizontal: 16, marginBottom: 12,
          backgroundColor: accent + '0D', borderRadius: 8,
          paddingHorizontal: 10, paddingVertical: 6,
        }}>
          <Text style={{ fontSize: 11, lineHeight: 17, color: accent, fontWeight: '600' }}>
            {why}
          </Text>
        </View>
      ) : null}

      {/* Try it button */}
      {tool.url ? (
        <Pressable
          onPress={() => Linking.openURL(tool.url)}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            marginHorizontal: 16, marginBottom: 14,
            backgroundColor: accent, borderRadius: 10,
            paddingVertical: 10, opacity: pressed ? 0.8 : 1,
          })}
          accessibilityRole="link"
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
            {t('tools.try_it')}
          </Text>
          <ExternalLink size={14} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}

function TipCard({ tip }: { tip: TipItem }) {
  const { lang } = useLanguage();
  const { colors, isDark } = useTheme();

  const title = lang === 'en' ? (tip.title_en || tip.title_ko) : tip.title_ko;
  const body = lang === 'en' ? (tip.body_en || tip.body_ko) : tip.body_ko;

  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: 14, marginBottom: 14,
      borderWidth: 1, borderColor: colors.border,
      overflow: 'hidden', ...cardShadow,
    }}>
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <View style={{
            width: 28, height: 28, borderRadius: 8,
            backgroundColor: isDark ? '#2D2513' : '#FFFBEB',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Lightbulb size={14} color={isDark ? '#FBBF24' : '#B45309'} />
          </View>
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.textPrimary, fontFamily: FontFamily.serif }}>
            {title}
          </Text>
        </View>
        <Text style={{ fontSize: 12, lineHeight: 19, color: colors.textSecondary }}>
          {body}
        </Text>
        {tip.tool_name ? (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8,
          }}>
            <Wrench size={10} color={colors.textDim} />
            <Text style={{ fontSize: 10, color: colors.textDim, fontWeight: '600' }}>{tip.tool_name}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// Skeleton for loading state
function ToolsSkeleton() {
  const { colors } = useTheme();
  const Block = ({ width, height, rounded }: { width: number | `${number}%`; height: number; rounded?: number }) => (
    <View style={{ width, height, backgroundColor: colors.surface, borderRadius: rounded ?? 8 }} />
  );

  return (
    <View>
      {[0, 1, 2].map(i => (
        <View key={i} style={{
          backgroundColor: colors.card, borderRadius: 14, marginBottom: 14,
          borderWidth: 1, borderColor: colors.border, padding: 16,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Block width={32} height={32} rounded={10} />
            <Block width={120} height={16} />
          </View>
          <Block width="100%" height={14} />
          <View style={{ height: 6 }} />
          <Block width="75%" height={14} />
          <View style={{ height: 12 }} />
          <Block width="100%" height={36} rounded={10} />
        </View>
      ))}
    </View>
  );
}

interface ToolsContentProps {
  toolsData: DailyTools | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function ToolsContent({ toolsData, loading, error, onRefresh }: ToolsContentProps) {
  const { t, lang } = useLanguage();
  const { colors } = useTheme();

  if (loading) return <ToolsSkeleton />;

  if (error) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 16 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.errorBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Wand2 size={30} color={colors.errorColor} />
        </View>
        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 17, marginBottom: 6, textAlign: 'center' }}>
          {lang === 'en' ? 'Connection error' : '연결에 문제가 있어요'}
        </Text>
        <Pressable onPress={onRefresh} style={({ pressed }) => ({
          backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 12,
          borderRadius: 12, opacity: pressed ? 0.8 : 1, marginTop: 12,
        })}>
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>
            {lang === 'en' ? 'Retry' : '다시 시도'}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!toolsData || !toolsData.tools || toolsData.tools.length === 0) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Wand2 size={30} color={colors.primary} />
        </View>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
          {t('tools.no_content')}
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
          {t('tools.no_content_desc')}
        </Text>
      </View>
    );
  }

  const tools = toolsData.tools;
  const tips = toolsData.tips || [];

  return (
    <>
      {/* Tools Section */}
      <Text style={{
        fontSize: 11, fontWeight: '700', color: colors.textDim,
        letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12,
      }}>
        {t('tools.section_tools')} ({tools.length})
      </Text>
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}

      {/* Tips Section */}
      {tips.length > 0 && (
        <>
          <Text style={{
            fontSize: 11, fontWeight: '700', color: colors.textDim,
            letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 8, marginBottom: 12,
          }}>
            {t('tools.section_tips')} ({tips.length})
          </Text>
          {tips.map((tip) => (
            <TipCard key={tip.id} tip={tip} />
          ))}
        </>
      )}
    </>
  );
}
