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
import { getMPCSimulationHTML } from './mpc';
import { getLyapunovSimulationHTML } from './lyapunov';

// --- Electrical Engineering ---
import { getFourierSimulationHTML } from './fourier';
import { getNyquistSimulationHTML } from './nyquist';
import { getQuantizeSimulationHTML } from './quantize';

// --- Information Theory ---
import { getEntropySimulationHTML } from './entropy';
import { getKLSimulationHTML } from './kl';
import { getChannelSimulationHTML } from './channel';

// --- Physics ---
import { getBoltzmannSimulationHTML } from './boltzmann';
import { getDiffusionSimulationHTML } from './diffusion';
import { getHopfieldSimulationHTML } from './hopfield';
import { getRenormSimulationHTML } from './renorm';

// --- Biology ---
import { getEvolutionSimulationHTML } from './evolution';
import { getHebbianSimulationHTML } from './hebbian';
import { getSwarmSimulationHTML } from './swarm';

// --- Neuroscience ---
import { getVisualCortexSimulationHTML } from './visualcortex';
import { getDopamineSimulationHTML } from './dopamine';
import { getAttentionSimulationHTML } from './attention';
import { getPredCodingSimulationHTML } from './predcoding';
import { getReplaySimulationHTML } from './replay';

// --- Chemistry ---
import { getMolGraphSimulationHTML } from './molgraph';

// --- Mathematics ---
import { getLinalgSimulationHTML } from './linalg';
import { getUATSimulationHTML } from './uat';
import { getCurseSimulationHTML } from './curse';
import { getInfoGeoSimulationHTML } from './infogeo';

// --- Statistics ---
import { getBayesianSimulationHTML } from './bayesian';
import { getBiasVarSimulationHTML } from './biasvar';
import { getMLESimulationHTML } from './mle';
import { getBootstrapSimulationHTML } from './bootstrap';
import { getMCMCSimulationHTML } from './mcmc';
import { getMutualInfoSimulationHTML } from './mutual';

// --- Robotics ---
import { getSubsumptionSimulationHTML } from './subsumption';
import { getImitationSimulationHTML } from './imitation';

// --- Machine Learning ---
import { getGNNSimulationHTML } from './gnn';
import { getManifoldSimulationHTML } from './manifold';

// --- Medicine & Life Science ---
import { getEpidemicSimulationHTML } from './epidemic';
import { getClinicalSimulationHTML } from './clinical';

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
  mpc: getMPCSimulationHTML,
  lyapunov: getLyapunovSimulationHTML,

  // Electrical Engineering
  fourier: getFourierSimulationHTML,
  nyquist: getNyquistSimulationHTML,
  quantize: getQuantizeSimulationHTML,

  // Information Theory
  entropy: getEntropySimulationHTML,
  kl: getKLSimulationHTML,
  channel: getChannelSimulationHTML,

  // Physics
  boltzmann: getBoltzmannSimulationHTML,
  diffusion: getDiffusionSimulationHTML,
  hopfield: getHopfieldSimulationHTML,
  renorm: getRenormSimulationHTML,

  // Biology
  evolution: getEvolutionSimulationHTML,
  hebbian: getHebbianSimulationHTML,
  swarm: getSwarmSimulationHTML,

  // Neuroscience
  visualcortex: getVisualCortexSimulationHTML,
  dopamine: getDopamineSimulationHTML,
  attention: getAttentionSimulationHTML,
  predcoding: getPredCodingSimulationHTML,
  replay: getReplaySimulationHTML,

  // Chemistry
  molgraph: getMolGraphSimulationHTML,

  // Mathematics
  linalg: getLinalgSimulationHTML,
  uat: getUATSimulationHTML,
  curse: getCurseSimulationHTML,
  infogeo: getInfoGeoSimulationHTML,

  // Statistics
  bayesian: getBayesianSimulationHTML,
  biasvar: getBiasVarSimulationHTML,
  mle: getMLESimulationHTML,
  bootstrap: getBootstrapSimulationHTML,
  mcmc: getMCMCSimulationHTML,
  mutual: getMutualInfoSimulationHTML,

  // Robotics
  subsumption: getSubsumptionSimulationHTML,
  imitation: getImitationSimulationHTML,

  // Machine Learning
  gnn: getGNNSimulationHTML,
  manifold: getManifoldSimulationHTML,

  // Medicine & Life Science
  epidemic: getEpidemicSimulationHTML,
  clinical: getClinicalSimulationHTML,
};
