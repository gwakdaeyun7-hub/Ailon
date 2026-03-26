/**
 * Lab 전체 학문원리 데이터 모듈
 *
 * - 45개 curated principle 메타데이터 + 콘텐츠 (KO/EN)
 * - Super category / discipline 그룹핑 헬퍼
 * - seed_id → simulation ID 매핑
 */

import rawData from './labPrinciplesData.json';

export interface LabPrinciple {
  id: string;
  principleName: string;
  principleNameEn: string;
  discipline: string;
  disciplineName: string;
  superCategory: string;
  difficulty: string;
  connectionType: string;
  keywords: string[];
  keywordsEn: string[];
  takeaway: string;
  takeawayEn: string;
  contentKo: string;
  contentEn: string;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export const allPrinciples: LabPrinciple[] = rawData as LabPrinciple[];

// ---------------------------------------------------------------------------
// Super category ordering & i18n
// ---------------------------------------------------------------------------

export const SUPER_CATEGORIES = ['공학', '자연과학', '형식과학', '응용과학'] as const;
export type SuperCategory = (typeof SUPER_CATEGORIES)[number];

const SUPER_CATEGORY_EN: Record<string, string> = {
  '공학': 'Engineering',
  '자연과학': 'Natural Science',
  '형식과학': 'Formal Science',
  '응용과학': 'Applied Science',
};

export function getSuperCategoryEn(ko: string): string {
  return SUPER_CATEGORY_EN[ko] || ko;
}

// ---------------------------------------------------------------------------
// Discipline i18n
// ---------------------------------------------------------------------------

const DISCIPLINE_EN: Record<string, string> = {
  control_engineering: 'Control Engineering',
  electrical_engineering: 'Electrical / Electronic Eng.',
  information_theory: 'Information / Communication',
  robotics: 'Robotics',
  physics: 'Physics',
  biology: 'Biology',
  chemistry: 'Chemistry',
  neuroscience: 'Neuroscience',
  mathematics: 'Mathematics',
  statistics: 'Statistics',
  medicine: 'Medicine & Life Science',
};

export function getDisciplineEn(key: string): string {
  return DISCIPLINE_EN[key] || key;
}

// ---------------------------------------------------------------------------
// Grouping helpers
// ---------------------------------------------------------------------------

/** Pre-grouped by super category for fast lookup */
const _byCategory: Record<string, LabPrinciple[]> = {};
for (const p of allPrinciples) {
  (_byCategory[p.superCategory] ??= []).push(p);
}

export function getPrinciplesByCategory(cat: string): LabPrinciple[] {
  return _byCategory[cat] || [];
}

// ---------------------------------------------------------------------------
// Simulation mapping (seed_id → sim registry key)
// ---------------------------------------------------------------------------

export const SEED_TO_SIM: Record<string, string> = {
  opt_simulated_annealing: 'sa',
  opt_gradient_descent: 'gd',
  bio_swarm_intelligence: 'swarm',
  stat_bayesian_inference: 'bayesian',
};

export function getSimId(seedId: string): string | undefined {
  return SEED_TO_SIM[seedId];
}
