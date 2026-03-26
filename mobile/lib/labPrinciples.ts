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
  // Optimization
  opt_simulated_annealing: 'sa',
  opt_gradient_descent: 'gd',
  opt_convex_optimization: 'convex',
  opt_bayesian_optimization: 'bayesopt',

  // Control Engineering
  ctrl_optimal_control: 'dp',
  ctrl_kalman_filter: 'kalman',
  ctrl_pid_control: 'pid',
  ctrl_cybernetics: 'cybernetics',
  ctrl_model_predictive_control: 'mpc',
  ctrl_lyapunov_stability: 'lyapunov',

  // Electrical Engineering
  ee_fourier_transform: 'fourier',
  ee_nyquist_sampling: 'nyquist',
  ee_quantization: 'quantize',

  // Information Theory
  info_shannon_entropy: 'entropy',
  info_kl_divergence: 'kl',
  info_channel_capacity: 'channel',

  // Physics
  phys_boltzmann_distribution: 'boltzmann',
  phys_diffusion_process: 'diffusion',
  phys_hopfield_network: 'hopfield',
  phys_renormalization_group: 'renorm',

  // Biology
  bio_natural_selection: 'evolution',
  bio_hebbian_learning: 'hebbian',
  bio_swarm_intelligence: 'swarm',

  // Neuroscience
  neuro_visual_cortex_cnn: 'visualcortex',
  neuro_dopamine_td: 'dopamine',
  neuro_attention_mechanism: 'attention',
  neuro_predictive_coding: 'predcoding',
  neuro_experience_replay: 'replay',

  // Chemistry
  chem_molecular_graph: 'molgraph',

  // Mathematics
  math_linear_algebra_nn: 'linalg',
  math_universal_approximation: 'uat',
  math_curse_dimensionality: 'curse',
  math_information_geometry: 'infogeo',
  math_graph_theory_gnn: 'gnn',
  math_manifold_hypothesis: 'manifold',

  // Information Theory (cont.)
  info_mutual_information: 'mutual',

  // Statistics
  stat_bayesian_inference: 'bayesian',
  stat_bias_variance_tradeoff: 'biasvar',
  stat_maximum_likelihood: 'mle',
  stat_bootstrapping: 'bootstrap',
  stat_markov_chain_monte_carlo: 'mcmc',

  // Robotics
  robo_subsumption: 'subsumption',
  robo_imitation_learning: 'imitation',

  // Medicine & Life Science
  med_epidemiology_network: 'epidemic',
  med_clinical_trial_design: 'clinical',
};

export function getSimId(seedId: string): string | undefined {
  return SEED_TO_SIM[seedId];
}
