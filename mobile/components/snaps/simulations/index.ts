/**
 * Simulation registry — maps simulation IDs to HTML generator functions.
 *
 * To add a new simulation:
 * 1. Create a new file (e.g., gradient-descent.ts) exporting a function
 *    (isDark: boolean, lang: string) => string
 * 2. Import and register it here.
 */

// --- Optimization ---
import { getSASimulationHTML } from './sa';
import { getGDSimulationHTML } from './gd';
import { getConvexSimulationHTML } from './convex';
import { getBayesOptSimulationHTML } from './bayesopt';

// --- Control Engineering ---
import { getDPSimulationHTML } from './dp';
import { getKalmanSimulationHTML } from './kalman';
import { getPIDSimulationHTML } from './pid';
import { getCyberneticsSimulationHTML } from './cybernetics';

// --- Electrical Engineering ---
import { getFourierSimulationHTML } from './fourier';

// --- Information Theory ---
import { getEntropySimulationHTML } from './entropy';
import { getKLSimulationHTML } from './kl';

// --- Physics ---
import { getBoltzmannSimulationHTML } from './boltzmann';
import { getDiffusionSimulationHTML } from './diffusion';
import { getHopfieldSimulationHTML } from './hopfield';

// --- Biology ---
import { getEvolutionSimulationHTML } from './evolution';
import { getHebbianSimulationHTML } from './hebbian';
import { getSwarmSimulationHTML } from './swarm';

// --- Neuroscience ---
import { getVisualCortexSimulationHTML } from './visualcortex';
import { getDopamineSimulationHTML } from './dopamine';

// --- Mathematics ---
import { getLinalgSimulationHTML } from './linalg';
import { getUATSimulationHTML } from './uat';
import { getCurseSimulationHTML } from './curse';

// --- Statistics ---
import { getBayesianSimulationHTML } from './bayesian';
import { getBiasVarSimulationHTML } from './biasvar';
import { getMLESimulationHTML } from './mle';

/** Each value is a function: (isDark, lang) => fullHTMLString */
export const SIMULATIONS: Record<string, (isDark: boolean, lang: string) => string> = {
  // Optimization
  sa: getSASimulationHTML,
  gd: getGDSimulationHTML,
  convex: getConvexSimulationHTML,
  bayesopt: getBayesOptSimulationHTML,

  // Control Engineering
  dp: getDPSimulationHTML,
  kalman: getKalmanSimulationHTML,
  pid: getPIDSimulationHTML,
  cybernetics: getCyberneticsSimulationHTML,

  // Electrical Engineering
  fourier: getFourierSimulationHTML,

  // Information Theory
  entropy: getEntropySimulationHTML,
  kl: getKLSimulationHTML,

  // Physics
  boltzmann: getBoltzmannSimulationHTML,
  diffusion: getDiffusionSimulationHTML,
  hopfield: getHopfieldSimulationHTML,

  // Biology
  evolution: getEvolutionSimulationHTML,
  hebbian: getHebbianSimulationHTML,
  swarm: getSwarmSimulationHTML,

  // Neuroscience
  visualcortex: getVisualCortexSimulationHTML,
  dopamine: getDopamineSimulationHTML,

  // Mathematics
  linalg: getLinalgSimulationHTML,
  uat: getUATSimulationHTML,
  curse: getCurseSimulationHTML,

  // Statistics
  bayesian: getBayesianSimulationHTML,
  biasvar: getBiasVarSimulationHTML,
  mle: getMLESimulationHTML,
};
