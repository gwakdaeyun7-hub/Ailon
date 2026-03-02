/**
 * TypeScript 타입 정의 - frontend/lib/types.ts 기반 + React Native 확장
 */

import type { Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Article & Daily News (소스별 플랫 구조)
// ---------------------------------------------------------------------------

export interface Article {
  title: string;
  display_title?: string;   // 한국어 제목 (없으면 title 사용)
  description?: string;
  summary?: string;          // 한국어 요약 (레거시 폴백)
  one_line?: string;          // 핵심 한줄 요약
  key_points?: string[];      // 주요 포인트 (3-5개)
  why_important?: string;     // 왜 중요한지
  display_title_en?: string;  // 영어 제목
  one_line_en?: string;       // 영어 한줄 요약
  key_points_en?: string[];   // 영어 주요 포인트
  why_important_en?: string;  // 영어 중요성
  link: string;
  published: string;
  source: string;
  source_key?: string;
  image_url?: string;
  score?: number;
  rank?: number;
  category?: string;
  background?: string;
  background_en?: string;
  tags?: string[];
  glossary?: { term: string; desc: string }[];
  glossary_en?: { term: string; desc: string }[];
  ai_filtered?: boolean;
  dedup_of?: string;      // 중복 원본 기사 link
  // AI 기능 확장 필드
  entities?: ArticleEntity[];
  topic_cluster_id?: string;
  related_ids?: string[];
  timeline_ids?: string[];
  article_id?: string;
}

export interface ArticleEntity {
  name: string;
  type: string;
}

export interface DailyNews {
  date: string;
  // 새 구조 (3-Section)
  highlights?: Article[];
  categorized_articles?: Record<string, Article[]>;
  category_order?: string[];
  source_articles?: Record<string, Article[]>;
  source_order?: string[];
  filtered_articles?: Article[];
  deduped_articles?: Record<string, Article[]>;
  total_count?: number;
  updated_at: Timestamp | string | null;
  // 레거시 호환 (기존 데이터 폴백)
  articles?: Article[];
  text_only_articles?: Article[];
  text_only_order?: string[];
}

// ---------------------------------------------------------------------------
// Principle & Daily Principles (Snack Structure: 인사이트 3섹션 + 딥다이브)
// ---------------------------------------------------------------------------

export interface PrincipleFoundation {
  headline: string;        // 호기심 유발 타이틀 (15~20자)
  headline_en?: string;
  body: string;            // 학문 원리를 일상 언어로 설명 (80~120자)
  body_en?: string;
  analogy: string;         // 일상 비유 한 줄 (30~50자)
  analogy_en?: string;
}

export interface PrincipleApplication {
  headline: string;        // AI 연결 타이틀 (15~20자)
  headline_en?: string;
  body: string;            // AI 적용 설명 (80~120자)
  body_en?: string;
  mechanism: string;       // 핵심 메커니즘 한 줄 (30~50자)
  mechanism_en?: string;
}

export interface PrincipleIntegration {
  headline: string;        // 실제 활용 타이틀 (15~20자)
  headline_en?: string;
  body: string;            // 실제 세계 활용 설명 (80~120자)
  body_en?: string;
  impact: string;          // 임팩트 한 줄 (30~50자)
  impact_en?: string;
}

export interface DeepDive {
  history: string;         // 발견/발전 역사 (150~200자)
  history_en?: string;
  mechanism: string;       // 상세 메커니즘 (150~200자)
  mechanism_en?: string;
  formula?: string;        // 핵심 수식/알고리즘 (해당시)
  formula_en?: string;
  modern: string;          // 현대적 의의 + 최신 연구 동향 (150~200자)
  modern_en?: string;
}

export interface PrincipleVerification {
  verified: boolean;
  confidence: number;
  factCheck: string;
}

export interface Principle {
  title: string;
  title_en?: string;
  connectionType?: 'direct_inspiration' | 'structural_analogy' | 'mathematical_foundation';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  keywords?: string[];
  keywords_en?: string[];
  readTime?: string;       // '1분' | '2분'
  category: string;
  superCategory: string;

  foundation: PrincipleFoundation;
  application: PrincipleApplication;
  integration: PrincipleIntegration;
  deepDive?: DeepDive;
  verification?: PrincipleVerification;
}

export interface DailyPrinciples {
  date: string;
  discipline_key: string;
  discipline_info: {
    name: string;
    name_en?: string;
    focus: string;
    focus_en?: string;
    ai_connection: string;
    ai_connection_en?: string;
    superCategory: string;
  };
  principle: Principle;  // 단일 원리 (3단계 구조)
  updated_at: Timestamp | string | null;
}

// ---------------------------------------------------------------------------
// User Profile & Auth
// ---------------------------------------------------------------------------

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp | string | null;
  lastLoginAt: Timestamp | string | null;
}

export interface BookmarkMeta {
  title: string;
  subtitle?: string;
  category?: string;
  link?: string;
}

export interface Bookmark {
  type: 'news' | 'principle' | 'snap';
  itemId: string;
  createdAt: Timestamp | string | null;
  metadata?: BookmarkMeta;
}

export interface UserFeedback {
  id?: string;
  userId: string;
  itemType: 'news' | 'snap';
  itemId: string;
  reaction: 'like' | 'dislike';
  createdAt: Timestamp | string | null;
}

// ---------------------------------------------------------------------------
// AI Features: Briefing, Quiz, Glossary, Timeline
// ---------------------------------------------------------------------------

export interface DailyBriefing {
  date: string;
  briefing_ko: string;
  briefing_en: string;
  story_count: number;
  article_ids: string[];
  updated_at: Timestamp | string | null;
}

export interface QuizQuestion {
  question_ko: string;
  question_en: string;
  options_ko: string[];
  options_en: string[];
  correct_index: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation_ko: string;
  explanation_en: string;
  source_article_id?: string;
}

export interface DailyQuiz {
  date: string;
  questions: QuizQuestion[];
  updated_at: Timestamp | string | null;
}

export interface GlossaryTerm {
  term_ko: string;
  term_en: string;
  desc_ko: string;
  desc_en: string;
  article_ids: string[];
  updated_at?: Timestamp | string | null;
}

export interface TimelineNode {
  article_id: string;
  title: string;
  date: string;
  source: string;
}
