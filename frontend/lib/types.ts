/**
 * TypeScript 타입 정의
 */

export interface Article {
  title: string;
  description: string;
  link: string;
  published: string;
  source: string;
  summary: string;
  theme?: string;
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

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: any;
  lastLoginAt: any;
}

export interface LearningHistory {
  principleId: string;
  learnedAt: any;
  completed: boolean;
}

export interface Bookmark {
  type: 'news' | 'principle' | 'idea';
  itemId: string;
  createdAt: any;
}
