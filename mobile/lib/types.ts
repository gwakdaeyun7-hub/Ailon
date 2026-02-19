/**
 * TypeScript 타입 정의 - frontend/lib/types.ts 기반 + React Native 확장
 */

// ---------------------------------------------------------------------------
// News Category (3 최신 카테고리 + 레거시 하위 호환)
// ---------------------------------------------------------------------------

export type NewsCategoryLatest =
  | 'model_research'
  | 'product_tools'
  | 'industry_business';
export type NewsCategoryLegacy =
  | 'core_tech'
  | 'dev_tools'
  | 'trend_insight'
  | 'models_architecture'
  | 'agentic_reality'
  | 'opensource_code'
  | 'physical_ai'
  | 'policy_safety';
export type NewsCategory = NewsCategoryLatest | NewsCategoryLegacy;

export const NEWS_CATEGORY_LABELS: Record<string, string> = {
  // 최신 3 카테고리
  model_research: '모델/연구',
  product_tools: '제품/도구',
  industry_business: '산업/비즈니스',
  // 구 3 카테고리 (하위 호환)
  core_tech: '모델/연구',
  dev_tools: '제품/도구',
  trend_insight: '산업/비즈니스',
  // 레거시 5 카테고리
  models_architecture: '모델/연구',
  agentic_reality: '제품/도구',
  opensource_code: '제품/도구',
  physical_ai: '모델/연구',
  policy_safety: '산업/비즈니스',
};

export const NEWS_CATEGORY_COLORS: Record<string, string> = {
  model_research: '#F43F5E',
  product_tools: '#10B981',
  industry_business: '#F59E0B',
  // 하위 호환
  core_tech: '#F43F5E',
  dev_tools: '#10B981',
  trend_insight: '#F59E0B',
  models_architecture: '#F43F5E',
  agentic_reality: '#F59E0B',
  opensource_code: '#10B981',
  physical_ai: '#F43F5E',
  policy_safety: '#F59E0B',
};

// ---------------------------------------------------------------------------
// Article & Daily News
// ---------------------------------------------------------------------------

export interface Article {
  title: string;
  display_title?: string;   // SummarizerAgent 생성 독자 친화 제목 (없으면 title 사용)
  description: string;
  link: string;
  published: string;
  source: string;
  source_type?: string;
  summary?: string;
  impact_comment?: string;
  theme?: string;
  category?: NewsCategory;
  category_name?: string;
  type?: 'short' | 'long';
  howToGuide?: string;
  importance_score?: number;
  social_score?: number;
  image_url?: string;
  reading_time?: number;
  is_main?: boolean;  // true=이미지 소스(상단 표시), false=더보기 노출
}

// 가로 스크롤 섹션 아이템 (공식 발표 / 한국 AI / 큐레이션)
export interface HorizontalArticle {
  title: string;
  display_title?: string;  // 한국어 제목 (없으면 title 사용)
  description: string;
  link: string;
  published: string;
  source: string;
  source_type: string;
  section: string;
  brand_color?: string;
}

export interface DailyNews {
  date: string;
  articles: Article[];
  count: number;
  daily_overview?: string;
  highlight?: Article;
  themes?: string[];
  categories?: Record<string, Article[]>;
  horizontal_sections?: {
    official_announcements?: Record<string, HorizontalArticle[]>;  // 회사별 그룹: {OpenAI: [...], Anthropic: [...], ...}
    korean_ai?: HorizontalArticle[];
    geeknews?: HorizontalArticle[];
    curation?: HorizontalArticle[];
  };
  agent_metadata?: {
    collected_count: number;
    analyzed_count: number;
    ranked_count: number;
    final_count: number;
    run_timestamp: string;
  };
  updated_at: any;
}

// ---------------------------------------------------------------------------
// Principle & Daily Principles (New Structure: Foundation → Application → Integration)
// ---------------------------------------------------------------------------

export interface LearnMoreLink {
  type: 'wikipedia' | 'youtube' | 'article';
  title: string;
  url: string;
}

export interface PrincipleFoundation {
  principle: string;        // 기본 원리 설명
  keyIdea: string;          // 핵심 아이디어 한 줄
  everydayAnalogy: string;  // 일상 비유
  scientificContext?: string; // 학문에서의 중요성
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

export interface BookmarkMeta {
  title: string;
  subtitle?: string;
  category?: string;
  link?: string;
}

export interface Bookmark {
  type: 'news' | 'principle' | 'snap' | 'idea';
  itemId: string;
  createdAt: any;
  metadata?: BookmarkMeta;
}

export interface UserFeedback {
  id?: string;
  userId: string;
  itemType: 'news' | 'snap' | 'idea';
  itemId: string;
  reaction: 'like' | 'dislike';
  createdAt: any;
}
