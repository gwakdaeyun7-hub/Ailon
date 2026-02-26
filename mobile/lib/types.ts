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
  score_novelty?: number;
  score_rigor?: number;
  score_buzz?: number;
  score_utility?: number;
  score_impact?: number;
  score_access?: number;
  score_market?: number;
  score_signal?: number;
  score_breadth?: number;
  category?: string;
  background?: string;
  background_en?: string;
  tags?: string[];
  glossary?: { term: string; desc: string }[];
  glossary_en?: { term: string; desc: string }[];
  ai_filtered?: boolean;
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
  total_count?: number;
  updated_at: Timestamp | string | null;
  // 레거시 호환 (기존 데이터 폴백)
  articles?: Article[];
  text_only_articles?: Article[];
  text_only_order?: string[];
}

// ---------------------------------------------------------------------------
// Principle & Daily Principles (New Structure: Foundation → Application → Integration)
// ---------------------------------------------------------------------------

export interface LearnMoreLink {
  type: 'wikipedia' | 'youtube' | 'article';
  title: string;
  url: string;
}

export interface DeepDive {
  history: string;              // 원리의 발견/발전 역사
  mechanism: string;            // 작동 원리 상세 설명
  formula?: string;             // 수식/공식 (해당시)
  visualExplanation?: string;   // 시각적 설명 텍스트
  relatedPrinciples: string[];  // 관련 원리들
  modernRelevance: string;      // 현대적 의미/응용
}

export interface PrincipleFoundation {
  principle: string;        // 기본 원리 설명
  keyIdea: string;          // 핵심 아이디어 한 줄
  everydayAnalogy: string;  // 일상 비유
  scientificContext?: string; // 학문에서의 중요성
  deepDive?: DeepDive;
}

export interface PrincipleApplication {
  applicationField: string;   // 응용 분야
  description: string;         // 응용 설명
  mechanism: string;           // 응용 메커니즘
  technicalTerms: string[];    // 관련 기술 용어
  bridgeRole?: string;         // 교량 역할
}

export interface PrincipleIntegration {
  problemSolved: string;       // 해결한 문제
  solution: string;            // 해결 방법
  targetField: string;         // 영향받은 학문
  realWorldExamples: string[]; // 실제 사례들
  impactField: string;         // 영향 분야
  whyItWorks: string;          // 왜 효과적인지
}

export interface PrincipleVerification {
  verified: boolean;
  confidence: number;
  factCheck: string;
}

export interface Principle {
  title: string;  // 융합 사례 이름
  category: string;
  superCategory: string;

  foundation: PrincipleFoundation;
  application: PrincipleApplication;
  integration: PrincipleIntegration;
  verification?: PrincipleVerification;
  learn_more_links?: LearnMoreLink[];
}

export interface DailyPrinciples {
  date: string;
  discipline_key: string;
  discipline_info: {
    name: string;
    focus: string;
    ai_connection: string;
    superCategory: string;
  };
  principle: Principle;  // 단일 원리 (3단계 구조)
  updated_at: Timestamp | string | null;
}

// ---------------------------------------------------------------------------
// Synergy Idea & Daily Synergy Ideas
// ---------------------------------------------------------------------------

export interface RoadmapPhase {
  phase: number;
  title: string;
  duration: string;
  tasks: string[];
  techStack: string[];
}

export interface TechnicalRoadmap {
  phases: RoadmapPhase[];
  totalDuration: string;
  techStack: string[];
}

export interface MarketFeasibility {
  tam: string;
  competitors: string[];
  differentiation: string;
  revenueModel: string;
  feasibilityScore: number;
}

export interface SynergyIdea {
  concept_name: string;
  problem_addressed?: string;
  description?: string;
  narrative?: string;
  key_innovation?: string;
  target_users?: string;
  implementation_sketch?: string;
  required_tech?: string[];
  feasibility_score?: number;
  novelty_score?: number;
  impact_score?: number;
  total_score?: number;
  challenges?: string[];
  improvements?: string[];
  tags?: string[];
  first_step?: string;
  implementation_plan?: {
    today: string;
    this_week: string;
    this_month: string;
  };
  news_source?: { title: string; link: string };
  principle_source?: { title: string; category: string; superCategory?: string };
  technical_roadmap?: TechnicalRoadmap;
  market_feasibility?: MarketFeasibility;
}

export interface DailySynergyIdeas {
  date: string;
  ideas: SynergyIdea[];
  count: number;
  source_news_count: number;
  source_discipline: string;
  source_principle: string;
  agent_metadata?: {
    problems_found: number;
    ideas_generated: number;
    ideas_evaluated: number;
    ideas_final: number;
    run_timestamp: string;
  };
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
  type: 'news' | 'principle' | 'snap' | 'idea';
  itemId: string;
  createdAt: Timestamp | string | null;
  metadata?: BookmarkMeta;
}

export interface UserFeedback {
  id?: string;
  userId: string;
  itemType: 'news' | 'snap' | 'idea';
  itemId: string;
  reaction: 'like' | 'dislike';
  createdAt: Timestamp | string | null;
}
