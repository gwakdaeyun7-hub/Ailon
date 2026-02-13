/**
 * TypeScript 타입 정의
 */

// ---------------------------------------------------------------------------
// News Category
// ---------------------------------------------------------------------------

export type NewsCategory =
  | 'models_architecture'
  | 'agentic_reality'
  | 'opensource_code'
  | 'physical_ai'
  | 'policy_safety';

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  models_architecture: '모델&아키텍처',
  agentic_reality: '에이전틱리얼리티',
  opensource_code: '오픈소스&코드',
  physical_ai: 'Physical AI',
  policy_safety: '정책&안전',
};

export const NEWS_CATEGORY_ICONS: Record<NewsCategory, string> = {
  models_architecture: 'Brain',
  agentic_reality: 'Bot',
  opensource_code: 'Code',
  physical_ai: 'Cpu',
  policy_safety: 'Shield',
};

// ---------------------------------------------------------------------------
// How-To Guide (embedded in Article)
// ---------------------------------------------------------------------------

export interface HowToGuide {
  title: string;
  steps: string[];
  codeSnippet?: string;
  promptExample?: string;
}

// ---------------------------------------------------------------------------
// Article & Daily News
// ---------------------------------------------------------------------------

export interface Article {
  title: string;
  description: string;
  link: string;
  published: string;
  source: string;
  summary: string;
  theme?: string;
  category?: NewsCategory;
  type?: 'short' | 'long';
  howToGuide?: HowToGuide;
  importance_score?: number;
}

export interface DailyNews {
  date: string;
  articles: Article[];
  count: number;
  daily_overview?: string;
  highlight?: Article;
  themes?: string[];
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

export interface Principle {
  id?: string;
  category:
    | 'physics'
    | 'chemistry'
    | 'biology'
    | 'philosophy'
    | 'economics'
    | 'psychology'
    | 'mathematics'
    | 'medicine_neuroscience'
    | 'computer_science'
    | 'electrical_engineering'
    | 'psychology_cognitive_science'
    | 'philosophy_ethics';
  superCategory?: '기초과학' | '생명과학' | '공학' | '사회과학' | '인문학';
  title: string;
  description: string;
  explanation: string;
  realWorldExample: string;
  applicationIdeas: string[];
  aiRelevance?: string;
  crossDisciplineLinks?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
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
  today_principle: Principle;
  count: number;
  updated_at: any;
}

// ---------------------------------------------------------------------------
// Academic Snap & Daily Academic Snaps
// ---------------------------------------------------------------------------

export interface LearnMoreLink {
  type: 'wikipedia' | 'youtube' | 'article';
  title: string;
  url: string;
}

export interface AcademicSnap {
  id?: string;
  discipline: string;
  superCategory: string;
  title: string;
  preview: string;
  content: string;
  aiImportance: string;
  dailyAnalogy: string;
  learnMoreLinks: LearnMoreLink[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface DailyAcademicSnaps {
  date: string;
  snaps: AcademicSnap[];
  count: number;
  updated_at: any;
}

// ---------------------------------------------------------------------------
// Fusion Idea & Daily Ideas
// ---------------------------------------------------------------------------

export interface FusionIdea {
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
  news_source?: {
    title: string;
    link: string;
  };
  principle_source?: {
    title: string;
    category: string;
    superCategory?: string;
  };
}

export interface DailyIdeas {
  date: string;
  ideas: FusionIdea[];
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

export interface SynergyIdea extends FusionIdea {
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
// User-Generated Idea
// ---------------------------------------------------------------------------

export interface GeneratedIdea {
  id?: string;
  userId: string;
  newsTitle: string;
  newsLink: string;
  principleTitle: string;
  principleCategory: string;
  idea: string;
  createdAt: any;
}

// ---------------------------------------------------------------------------
// User Profile, Preferences, Feedback, Learning History, Bookmark
// ---------------------------------------------------------------------------

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: any;
  lastLoginAt: any;
}

export interface UserPreferences {
  newsCategories: NewsCategory[];
  disciplines: string[];
  notificationsEnabled: boolean;
  onboardingCompleted: boolean;
}

export interface UserFeedback {
  id?: string;
  userId: string;
  itemType: 'news' | 'snap' | 'idea';
  itemId: string;
  reaction: 'like' | 'dislike';
  createdAt: any;
}

export interface LearningHistory {
  principleId: string;
  learnedAt: any;
  completed: boolean;
}

export interface Bookmark {
  type: 'news' | 'principle' | 'snap' | 'idea';
  itemId: string;
  createdAt: any;
}
