/**
 * AI 트렌드 뉴스 화면
 * 구조:
 *   1. 헤더: "A" 로고 + AI News + 검색 + 햄버거
 *   2. "오늘의 하이라이트" — 히어로 카드 (탭 → 상세 모달)
 *   3. 카테고리 탭 (모델/연구 | 제품/도구 | 산업/비즈니스)
 *   4. 뉴스 목록: 제목 + 날짜 + 좋아요/싫어요 수 (탭 → 상세 모달)
 *   5. 가로 스크롤 섹션: 공식 발표 / 한국 AI / GeekNews / 큐레이션
 *
 * 상세 모달: 요약 + 원문링크 + 좋아요/싫어요 + 공유 + 댓글
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Linking,
  StatusBar,
  Platform,
  Image,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Search, Menu, ChevronDown, ChevronRight,
  ThumbsUp, ThumbsDown, Clock, Calendar,
  ExternalLink, RefreshCw, Zap, X,
} from 'lucide-react-native';
import { useNews } from '@/hooks/useNews';
import { useDrawer } from '@/context/DrawerContext';
import { useReactions } from '@/hooks/useReactions';
import { ReactionBar } from '@/components/shared/ReactionBar';
import { NewsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import type { Article, NewsCategory, HorizontalArticle } from '@/lib/types';

// ─── 색상 / 상수 ───────────────────────────────────────────────────────────────
const PRIMARY = '#000000';
const PRIMARY_LIGHT = '#F3F4F6';
const BG = '#F9FAFB';
const CARD = '#FFFFFF';

const CATEGORY_COLORS: Record<string, string> = {
  model_research: '#F43F5E',
  product_tools: '#10B981',
  industry_business: '#F59E0B',
  core_tech: '#F43F5E',
  dev_tools: '#10B981',
  trend_insight: '#F59E0B',
  models_architecture: '#F43F5E',
  agentic_reality: '#F59E0B',
  opensource_code: '#10B981',
  physical_ai: '#F43F5E',
  policy_safety: '#F59E0B',
};

const CATEGORY_LABELS: Record<string, string> = {
  model_research: '모음/논문',
  product_tools: '개발/도구',
  industry_business: '트렌드',
  core_tech: '모음/논문',
  dev_tools: '개발/도구',
  trend_insight: '트렌드',
  models_architecture: '모음/논문',
  agentic_reality: '개발/도구',
  opensource_code: '개발/도구',
  physical_ai: '모음/논문',
  policy_safety: '트렌드',
};

const TABS = [
  { key: 'model_research', label: '모음/논문' },
  { key: 'product_tools', label: '개발/도구' },
  { key: 'industry_business', label: '트렌드' },
] as const;

const LEGACY: Record<string, NewsCategory> = {
  core_tech: 'model_research',
  dev_tools: 'product_tools',
  trend_insight: 'industry_business',
  models_architecture: 'model_research',
  agentic_reality: 'product_tools',
  opensource_code: 'product_tools',
  physical_ai: 'model_research',
  policy_safety: 'industry_business',
};

function normCat(cat?: string): NewsCategory {
  if (!cat) return 'model_research';
  if (cat === 'model_research' || cat === 'product_tools' || cat === 'industry_business') return cat;
  return (LEGACY[cat] as NewsCategory) ?? 'model_research';
}

function catColor(cat?: string) { return CATEGORY_COLORS[normCat(cat)] ?? PRIMARY; }
function catLabel(cat?: string) { return CATEGORY_LABELS[normCat(cat)] ?? '기타'; }
function displayTitle(a: Article) { return a.display_title || a.title; }

function formatDate(str?: string) {
  if (!str) return '';
  try {
    return new Date(str).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\. /g, '/').replace('.', '');
  } catch { return str.slice(5, 10); }
}

// 카테고리별 그라디언트 (이미지 없을 때)
const CAT_GRADIENTS: Record<string, [string, string]> = {
  model_research: ['#1E3A5F', '#0F1F3D'],
  product_tools: ['#064E3B', '#022C22'],
  industry_business: ['#78350F', '#3D1A05'],
  core_tech: ['#1E3A5F', '#0F1F3D'],
  dev_tools: ['#064E3B', '#022C22'],
  trend_insight: ['#78350F', '#3D1A05'],
};

// ─── 좋아요/싫어요 카운트 (읽기 전용) ──────────────────────────────────────────
function LikeCount({ itemId }: { itemId: string }) {
  const { likes, dislikes } = useReactions('news', itemId);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <ThumbsUp size={12} color="#9CA3AF" />
        <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>{likes}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <ThumbsDown size={12} color="#9CA3AF" />
        <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>{dislikes}</Text>
      </View>
    </View>
  );
}

// ─── 섹션 헤더 ────────────────────────────────────────────────────────────────
function SectionHeader({ title, color }: { title: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 12 }}>
      <View style={{ width: 6, height: 20, backgroundColor: '#000000', borderRadius: 2 }} />
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>{title}</Text>
    </View>
  );
}

// ─── 가로 스크롤 상세 모달 ────────────────────────────────────────────────────
function HorizontalDetailModal({
  article, visible, onClose,
}: { article: HorizontalArticle | null; visible: boolean; onClose: () => void }) {
  if (!article) return null;
  const color = article.brand_color ?? PRIMARY;
  const title = article.display_title || article.title;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: CARD }} edges={['top']}>
        {/* 헤더 */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
        }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color }}>{article.source}</Text>
          </View>
          <Pressable
            onPress={onClose}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
          {/* 제목 */}
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', lineHeight: 30, marginBottom: 16 }}>
            {title}
          </Text>

          {/* 요약/설명 */}
          {article.description ? (
            <Text style={{ fontSize: 15, color: '#374151', lineHeight: 25, marginBottom: 24 }}>
              {article.description}
            </Text>
          ) : null}

          {/* 원문 보기 버튼 (하단) */}
          {article.link ? (
            <Pressable
              onPress={() => Linking.openURL(article.link)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: pressed ? '#1F2937' : '#111827',
                borderRadius: 14, paddingVertical: 14, marginTop: 'auto' as any,
              })}
            >
              <ExternalLink size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>원문 보기</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── 가로 스크롤 카드 ─────────────────────────────────────────────────────────
function HorizontalCard({ article, onPress }: { article: HorizontalArticle; onPress: () => void }) {
  const color = article.brand_color ?? PRIMARY;
  const title = article.display_title || article.title;
  const grad = CAT_GRADIENTS[article.source] ?? ['#6B7280', '#374151'];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 240,
        borderRadius: 16,
        backgroundColor: CARD,
        marginRight: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        overflow: 'hidden',
        opacity: pressed ? 0.95 : 1,
      })}
    >
      {/* 이미지 상단 */}
      <View style={{ height: 128, backgroundColor: grad[0], overflow: 'hidden' }}>
        {article.image_url ? (
          <Image source={{ uri: article.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ width: '100%', height: '100%', backgroundColor: grad[1], opacity: 0.6 }} />
        )}
      </View>

      {/* 컨텐츠 */}
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#111827', lineHeight: 17, marginBottom: 8 }} numberOfLines={2}>
          {title}
        </Text>

        {/* 하단: 좋아요 + 날짜 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <ThumbsUp size={12} color="#9CA3AF" />
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>0</Text>
          </View>
          <Text style={{ fontSize: 9, color: '#D1D5DB' }}>{formatDate(article.published)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function HorizontalSection({
  title, articles, color = PRIMARY, showAll = false, onShowAll, limit = 5, onCardPress,
}: {
  title: string; articles: HorizontalArticle[]; color?: string; showAll?: boolean;
  onShowAll?: () => void; limit?: number; onCardPress?: (a: HorizontalArticle) => void;
}) {
  if (!articles || articles.length === 0) return null;
  const visible = showAll ? articles : articles.slice(0, limit);
  return (
    <View style={{ marginBottom: 20 }}>
      <SectionHeader title={title} color={color} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}>
        {visible.map((a, i) => (
          <HorizontalCard key={`${a.source}-${i}`} article={a} onPress={() => onCardPress?.(a)} />
        ))}
        {!showAll && articles.length > limit && onShowAll && (
          <Pressable onPress={onShowAll} style={{ width: 80, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ borderRadius: 20, borderWidth: 1.5, borderColor: color, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color, fontSize: 12, fontWeight: '700' }}>더보기</Text>
            </View>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

// ─── 뉴스 상세 모달 (바텀 시트 스타일) ───────────────────────────────────────────
function NewsDetailModal({
  article, visible, onClose,
}: { article: Article | null; visible: boolean; onClose: () => void }) {
  if (!article) return null;
  const itemId = article.link ?? article.title;
  const cc = catColor(article.category);
  const grad = CAT_GRADIENTS[normCat(article.category)] ?? ['#1E3A5F', '#0F1F3D'];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: CARD }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ── 이미지 헤더 (상단 240px) ── */}
          <View style={{ height: 240, backgroundColor: grad[0], overflow: 'hidden', position: 'relative' }}>
            {article.image_url ? (
              <>
                <Image source={{ uri: article.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
              </>
            ) : (
              <View style={{ width: '100%', height: '100%', backgroundColor: grad[1], opacity: 0.6 }} />
            )}

            {/* 닫기 버튼 (우상단) */}
            <Pressable
              onPress={onClose}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0,0,0,0.5)',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <X size={20} color="#FFFFFF" />
            </Pressable>

            {/* 제목 오버레이 (하단) */}
            <View style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingHorizontal: 16,
              paddingVertical: 16,
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF', lineHeight: 28 }}>
                {displayTitle(article)}
              </Text>
            </View>
          </View>

          {/* ── 본문 콘텐츠 ── */}
          <View style={{ padding: 20 }}>
            {/* 카테고리 + 날짜 */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              paddingBottom: 16, marginBottom: 16,
              borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
            }}>
              <View style={{ backgroundColor: `${cc}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: `${cc}30` }}>
                <Text style={{ color: cc, fontSize: 12, fontWeight: '700' }}>{catLabel(article.category)}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} color="#9CA3AF" />
                <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{formatDate(article.published)}</Text>
              </View>
              <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Clock size={12} color="#9CA3AF" />
                <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                  {article.reading_time && article.reading_time > 0 ? `${article.reading_time}분 읽기` : ''}
                </Text>
              </View>
            </View>

            {/* impact_comment */}
            {article.impact_comment ? (
              <View style={{ flexDirection: 'row', gap: 8, backgroundColor: PRIMARY_LIGHT, borderRadius: 12, padding: 12, marginBottom: 16 }}>
                <Zap size={14} color="#000000" style={{ marginTop: 2, flexShrink: 0 }} />
                <Text style={{ color: '#374151', fontSize: 14, flex: 1, lineHeight: 20, fontWeight: '500' }}>
                  {article.impact_comment}
                </Text>
              </View>
            ) : null}

            {/* 요약 */}
            {(article.summary || article.description) ? (
              <Text style={{ fontSize: 15, color: '#374151', lineHeight: 25, marginBottom: 20 }}>
                {article.summary ?? article.description}
              </Text>
            ) : null}

            {/* 출처 */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingBottom: 16, marginBottom: 16,
              borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cc }} />
              <Text style={{ fontSize: 13, color: '#6B7280' }}>{article.source}</Text>
            </View>

            {/* 원문 보기 버튼 */}
            {article.link ? (
              <Pressable
                onPress={() => Linking.openURL(article.link)}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  backgroundColor: pressed ? '#1F2937' : '#111827',
                  borderRadius: 14, paddingVertical: 14, marginBottom: 20,
                })}
              >
                <ExternalLink size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>원문 보기</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>

        {/* ── 하단 고정 바: 반응 ── */}
        <View style={{
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          backgroundColor: CARD,
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}>
          <ReactionBar
            itemType="news"
            itemId={itemId}
            shareText={`${displayTitle(article)}\n\n${article.link ?? ''}`}
            shareTitle={displayTitle(article)}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── 히어로 하이라이트 카드 (탭 → 상세 모달) ─────────────────────────────────
function HeroCard({ article, onPress }: { article: Article; onPress: () => void }) {
  const grad = CAT_GRADIENTS[normCat(article.category)] ?? ['#1E3A5F', '#0F1F3D'];
  const itemId = article.link ?? article.title;
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth - 32;
  const cardHeight = Math.round(cardWidth * 3 / 4);

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          borderRadius: 18,
          backgroundColor: CARD,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 4,
          opacity: pressed ? 0.95 : 1,
          overflow: 'hidden',
        })}
      >
        {/* 이미지 / 그라디언트 배경 */}
        <View style={{ backgroundColor: grad[0], height: cardHeight, padding: 16, justifyContent: 'flex-end' }}>
          {article.image_url ? (
            <>
              <Image source={{ uri: article.image_url }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} resizeMode="cover" />
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
            </>
          ) : (
            <>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: grad[1], opacity: 0.45 }} />
              <View style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.04)' }} />
              <View style={{ position: 'absolute', top: 20, right: 40, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            </>
          )}

          {/* HOT 배지 + 날짜 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: '#000000', fontSize: 11, fontWeight: '800' }}>⭐ HOT</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} color="rgba(255,255,255,0.7)" />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{formatDate(article.published)}</Text>
            </View>
          </View>

          {/* 제목 */}
          <Text style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '800', lineHeight: 29, marginBottom: 12 }}>
            {displayTitle(article)}
          </Text>

          {/* 하단: 소스 + 좋아요 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{article.source}</Text>
            <LikeCount itemId={itemId} />
            <View style={{ marginLeft: 'auto' }}>
              <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// ─── 뉴스 목록 아이템 (인라인 썸네일: 텍스트 + 썸네일 오른쪽) ────────────────────
function NewsListItem({
  article, isLast, onPress,
}: { article: Article; isLast: boolean; onPress: () => void }) {
  const cc = catColor(article.category);
  const itemId = article.link ?? article.title;
  const grad = CAT_GRADIENTS[normCat(article.category)] ?? ['#1E3A5F', '#0F1F3D'];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: pressed ? '#FAFAFA' : CARD,
        minHeight: 112,
      })}
    >
      {/* 카테고리 컬러 바 */}
      <View style={{ width: 2, height: '100%', backgroundColor: cc, flexShrink: 0 }} />

      {/* 텍스트 영역 */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 20, marginBottom: 8 }}
          numberOfLines={2}
        >
          {displayTitle(article)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{formatDate(article.published)}</Text>
          <LikeCount itemId={itemId} />
        </View>
      </View>

      {/* 썸네일 이미지 오른쪽 */}
      <View style={{
        width: 88,
        height: 88,
        borderRadius: 12,
        backgroundColor: grad[0],
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {article.image_url ? (
          <>
            <Image source={{ uri: article.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </>
        ) : (
          <View style={{
            width: '100%',
            height: '100%',
            backgroundColor: grad[1],
            opacity: 0.6,
          }} />
        )}
      </View>
    </Pressable>
  );
}

// 회사별 색상
const COMPANY_COLORS: Record<string, string> = {
  OpenAI: '#10B981',
  Anthropic: '#7C3AED',
  DeepMind: '#1D4ED8',
};

const COMPANY_TABS = [
  { key: 'OpenAI', label: 'OpenAI' },
  { key: 'Anthropic', label: 'Anthropic' },
  { key: 'DeepMind', label: 'DeepMind' },
] as const;

// ─── 공식 발표: 회사별 탭 + 가로 스크롤 ───────────────────────────────────────────────
function OfficialAnnouncementSection({
  officialGrouped, onCardPress,
}: { officialGrouped: Record<string, HorizontalArticle[]>; onCardPress: (a: HorizontalArticle) => void }) {
  if (!officialGrouped || Object.keys(officialGrouped).length === 0) return null;

  const [selectedCompany, setSelectedCompany] = React.useState('OpenAI');
  const articles = officialGrouped[selectedCompany] ?? [];

  return (
    <View style={{ marginBottom: 20 }}>
      <SectionHeader title="💫 공식 발표" />

      {/* 회사 탭 선택기 */}
      <View style={{
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: CARD,
        borderRadius: 12,
        padding: 6,
        flexDirection: 'row',
        gap: 6,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
      }}>
        {COMPANY_TABS.map(tab => {
          const isActive = selectedCompany === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setSelectedCompany(tab.key)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: isActive ? '#000000' : 'transparent',
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: isActive ? '#FFFFFF' : '#6B7280',
              }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 선택된 회사의 가로 스크롤 카드 */}
      {articles.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
        >
          {articles.map((a, i) => (
            <HorizontalCard key={`${selectedCompany}-${i}`} article={a} onPress={() => onCardPress(a)} />
          ))}
        </ScrollView>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 20, marginHorizontal: 16 }}>
          <Text style={{ color: '#D1D5DB', fontSize: 14 }}>이 회사의 공식 발표가 없어요</Text>
        </View>
      )}
    </View>
  );
}

// ─── 카테고리 탭 섹션 (슬라이딩 애니메이션) ──────────────────────────────────────
function CategoryTabsSection({
  tabs, selectedTab, onSelectTab,
}: { tabs: typeof TABS; selectedTab: NewsCategory; onSelectTab: (tab: NewsCategory) => void }) {
  const [tabWidths, setTabWidths] = React.useState<Record<string, number>>({});
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const selectedIndex = tabs.findIndex(t => t.key === selectedTab);
    let totalOffset = 8; // 시작 패딩
    for (let i = 0; i < selectedIndex; i++) {
      totalOffset += (tabWidths[tabs[i].key] || 80) + 6; // 탭 너비 + gap
    }
    Animated.timing(animValue, {
      toValue: totalOffset,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [selectedTab, tabWidths, tabs, animValue]);

  return (
    <View style={{
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: CARD,
      borderRadius: 14,
      paddingVertical: 8,
      paddingHorizontal: 8,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    }}>
      {/* 슬라이딩 배경 */}
      <View style={{ position: 'absolute', top: 8, left: 8, right: 8, height: 40, pointerEvents: 'none' }}>
        <Animated.View style={{
          position: 'absolute',
          height: '100%',
          backgroundColor: '#000000',
          borderRadius: 10,
          transform: [{ translateX: animValue }],
          width: tabWidths[selectedTab] || 80,
        }} />
      </View>

      {/* 탭 버튼들 */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {tabs.map(tab => {
          const isActive = selectedTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onSelectTab(tab.key)}
              onLayout={(e) => {
                if (tabWidths[tab.key] !== e.nativeEvent.layout.width) {
                  setTabWidths(prev => ({ ...prev, [tab.key]: e.nativeEvent.layout.width }));
                }
              }}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 10, zIndex: 1 }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: isActive ? '#FFFFFF' : '#6B7280',
              }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────
export default function NewsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [showAllMap, setShowAllMap] = useState<Record<string, boolean>>({});
  const [showAllHs, setShowAllHs] = useState<Record<string, boolean>>({});
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedHArticle, setSelectedHArticle] = useState<HorizontalArticle | null>(null);
  const [hDetailVisible, setHDetailVisible] = useState(false);

  const { newsCategory, setNewsCategory, openDrawer, setActiveTab } = useDrawer();

  useFocusEffect(useCallback(() => {
    setActiveTab('news');
  }, [setActiveTab]));

  const { newsData, loading, error, refresh } = useNews();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const openDetail = (article: Article) => {
    setSelectedArticle(article);
    setDetailVisible(true);
  };

  const closeDetail = () => setDetailVisible(false);
  const openHDetail = (article: HorizontalArticle) => { setSelectedHArticle(article); setHDetailVisible(true); };

  // 카테고리별 기사 분류 (is_main 기준으로 main/more 분리)
  const mainByCategory: Record<string, Article[]> = { model_research: [], product_tools: [], industry_business: [] };
  const moreByCategory: Record<string, Article[]> = { model_research: [], product_tools: [], industry_business: [] };
  const highlightTitle = newsData?.highlight?.title;
  (newsData?.articles ?? []).forEach(a => {
    if (a.title === highlightTitle) return;
    const k = normCat(a.category);
    if (a.is_main === false) {
      if (moreByCategory[k]) moreByCategory[k].push(a);
    } else {
      if (mainByCategory[k]) mainByCategory[k].push(a);
    }
  });

  const hs = newsData?.horizontal_sections ?? {};
  const mainArticles = mainByCategory[newsCategory] ?? [];
  const moreArticles = moreByCategory[newsCategory] ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── 헤더 ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: BG }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>A</Text>
        </View>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: '#111827' }}>AI News</Text>
        <Pressable style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
          <Search size={22} color="#374151" />
        </Pressable>
        <Pressable onPress={openDrawer} style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
          <Menu size={22} color="#374151" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6B7280" />}
      >
        {loading ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <NewsCardSkeleton /><NewsCardSkeleton /><NewsCardSkeleton />
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: PRIMARY_LIGHT, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <RefreshCw size={28} color={PRIMARY} />
            </View>
            <Text style={{ color: '#111827', fontWeight: '700', fontSize: 16, marginBottom: 8 }}>연결에 문제가 있어요</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>{error}</Text>
            <Pressable onPress={refresh} style={{ backgroundColor: PRIMARY, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* ── 1. 온몸의 하이라이트 ── */}
            {newsData?.highlight ? (
              <View style={{ marginBottom: 8 }}>
                <View style={{ paddingTop: 8, paddingBottom: 10 }}>
                  <SectionHeader title="온몸의 하이라이트" color="#60a5fa" />
                </View>
                <HeroCard article={newsData.highlight} onPress={() => openDetail(newsData.highlight!)} />
              </View>
            ) : null}

            {/* ── 2. 카테고리 탭 + 뉴스 목록 ── */}
            <CategoryTabsSection
              tabs={TABS}
              selectedTab={newsCategory}
              onSelectTab={setNewsCategory}
            />
            <View style={{
              marginHorizontal: 16,
              backgroundColor: CARD,
              borderRadius: 18,
              overflow: 'hidden',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
              marginBottom: 20,
            }}>
              {/* 탭 콘텐츠 */}

              {/* 뉴스 목록 */}
              {mainArticles.length === 0 && moreArticles.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ color: '#D1D5DB', fontSize: 14 }}>이 카테고리엔 아직 기사가 없어요</Text>
                </View>
              ) : (() => {
                const showMore = showAllMap[newsCategory] ?? false;
                return (
                  <>
                    {/* main 기사 (이미지 소스, 상단 5개) */}
                    {mainArticles.map((article, i) => (
                      <NewsListItem
                        key={`main-${article.title}-${i}`}
                        article={article}
                        isLast={i === mainArticles.length - 1 && !showMore && moreArticles.length === 0}
                        onPress={() => openDetail(article)}
                      />
                    ))}
                    {/* 더보기 버튼 (비이미지 more 기사가 있을 때) */}
                    {!showMore && moreArticles.length > 0 && (
                      <Pressable
                        onPress={() => setShowAllMap(prev => ({ ...prev, [newsCategory]: true }))}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}
                      >
                        <Text style={{ color: '#60a5fa', fontWeight: '700', fontSize: 14 }}>관련 뉴스 {moreArticles.length}개 더보기</Text>
                        <ChevronDown size={14} color="#60a5fa" />
                      </Pressable>
                    )}
                    {/* more 기사 (비이미지 소스, 더보기 시 노출) */}
                    {showMore && moreArticles.map((article, i) => (
                      <NewsListItem
                        key={`more-${article.title}-${i}`}
                        article={article}
                        isLast={i === moreArticles.length - 1}
                        onPress={() => openDetail(article)}
                      />
                    ))}
                  </>
                );
              })()}
            </View>

            {/* ── 3. 공식 발표 세로 + 가로 스크롤 섹션 ── */}
            <OfficialAnnouncementSection
              officialGrouped={
                (hs.official_announcements && !Array.isArray(hs.official_announcements))
                  ? hs.official_announcements as Record<string, HorizontalArticle[]>
                  : {}
              }
              onCardPress={openHDetail}
            />
            <HorizontalSection
              title="🇰🇷 한국 AI"
              articles={hs.korean_ai ?? []}
              color="#E53935"
              showAll={showAllHs['korean'] ?? false}
              onShowAll={() => setShowAllHs(prev => ({ ...prev, korean: true }))}
              onCardPress={openHDetail}
            />
            <HorizontalSection
              title="🟠 GeekNews"
              articles={hs.geeknews ?? []}
              color="#FF6B35"
              showAll={showAllHs['geeknews'] ?? false}
              onShowAll={() => setShowAllHs(prev => ({ ...prev, geeknews: true }))}
              onCardPress={openHDetail}
            />
            <HorizontalSection
              title="📚 큐레이션"
              articles={hs.curation ?? []}
              color="#0EA5E9"
              showAll={showAllHs['curation'] ?? false}
              onShowAll={() => setShowAllHs(prev => ({ ...prev, curation: true }))}
              onCardPress={openHDetail}
            />

            <View style={{ height: 20 }} />
          </>
        )}
      </ScrollView>

      {/* ── 뉴스 상세 모달 ── */}
      <NewsDetailModal article={selectedArticle} visible={detailVisible} onClose={closeDetail} />
      {/* ── 가로 스크롤 카드 상세 모달 ── */}
      <HorizontalDetailModal article={selectedHArticle} visible={hDetailVisible} onClose={() => setHDetailVisible(false)} />
    </SafeAreaView>
  );
}
