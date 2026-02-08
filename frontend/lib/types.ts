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
}

export interface DailyNews {
  date: string;
  articles: Article[];
  count: number;
  updated_at: any;
}

export interface Principle {
  id: string;
  category: 'physics' | 'chemistry' | 'biology' | 'philosophy' | 'economics' | 'psychology';
  title: string;
  description: string;
  explanation: string;
  realWorldExample: string;
  applicationIdeas: string[];
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
