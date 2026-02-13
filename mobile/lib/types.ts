/**
 * TypeScript 타입 정의 - frontend/lib/types.ts 기반 + React Native 확장
 */

// ---------------------------------------------------------------------------
// News Category (3 신규 카테고리 + 5 레거시 카테고리 모두 지원)
// ---------------------------------------------------------------------------

export type NewsCategoryNew = 'core_tech' | 'dev_tools' | 'trend_insight';
export type NewsCategoryLegacy =
  | 'models_architecture'
  | 'agentic_reality'
  | 'opensource_code'
  | 'physical_ai'
  | 'policy_safety';
export type NewsCategory = NewsCategoryNew | NewsCategoryLegacy;

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  // 신규 3 카테고리
  core_tech: 'Core Tech',
  dev_tools: 'Dev & Tools',
  trend_insight: 'Trend & Insight',
  // 레거시 5 카테고리 (Firestore 하위호환)
  models_architecture: '모델&아키텍처',
  agentic_reality: '에이전틱리얼리티',
  opensource_code: '오픈소스&코드',
  physical_ai: 'Physical AI',
  policy_safety: '정책&안전',
};

export const NEWS_CATEGORY_COLORS: Record<string, string> = {
  core_tech: '#3b82f6',
  dev_tools: '#22c55e',
  trend_insight: '#a855f7',
  models_architecture: '#3b82f6',
  agentic_reality: '#a855f7',
  opensource_code: '#22c55e',
  physical_ai: '#f59e0b',
  policy_safety: '#ef4444',
};

// ---------------------------------------------------------------------------
// Article & Daily News
// ---------------------------------------------------------------------------

export interface Article {
  title: string;
  description: string;
  link: string;
  published: string;
  source: string;
  source_type?: string;
  summary?: string;
  impact_comment?: string;  // 신규: 1줄 임팩트 코멘트
  theme?: string;
  category?: NewsCategory;
  category_name?: string;
  type?: 'short' | 'long';
  howToGuide?: string;
  importance_score?: number;
  social_score?: number;
}

export interface DailyNews {
  date: string;
  articles: Article[];
  count: number;
  daily_overview?: string;
  highlight?: Article;
  themes?: string[];
  categories?: Record<string, Article[]>;
  agent_metadata?: {
    collected_count: number;
    analyzed_count: number;
    curated_count: number;
    final_count: number;
    run_timestamp: string;
  };
  updated_at: any;
}

// ---------------------------------------------------------------------------
// Principle & Daily Principles
// ---------------------------------------------------------------------------

export interface LearnMoreLink {
  type: 'wikipedia' | 'youtube' | 'article';
  title: string;
  url: string;
}

export interface Principle {
  id?: string;
  category: string;
  superCategory?: string;
  title: string;
  hook?: string;
  description: string;
  explanation: string;
  everydayAnalogy?: string;
  realWorldExample: string;
  applicationIdeas: string[];
  aiRelevance?: string;
  crossDisciplineLinks?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  learn_more_links?: LearnMoreLink[];
  friendlyExplanation?: string;
  simpleSummary?: string;
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
  principles: Principle[];
  disciplines?: any[];
  today_principle: Principle;
  count: number;
  updated_at: any;
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
  updated_at: any;
}

// ---------------------------------------------------------------------------
// User Profile & Auth
// ---------------------------------------------------------------------------

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: any;
  lastLoginAt: any;
}

export interface Bookmark {
  type: 'news' | 'principle' | 'snap' | 'idea';
  itemId: string;
  createdAt: any;
}

export interface UserFeedback {
  id?: string;
  userId: string;
  itemType: 'news' | 'snap' | 'idea';
  itemId: string;
  reaction: 'like' | 'dislike';
  createdAt: any;
}
