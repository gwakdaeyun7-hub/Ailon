/**
 * Simulation registry — maps simulation IDs to HTML generator functions.
 *
 * To add a new simulation:
 * 1. Create a new file (e.g., gradient-descent.ts) exporting a function
 *    (isDark: boolean, lang: string) => string
 * 2. Import and register it here.
 */

import { getSASimulationHTML } from './sa';

/** Each value is a function: (isDark, lang) => fullHTMLString */
export const SIMULATIONS: Record<string, (isDark: boolean, lang: string) => string> = {
  sa: getSASimulationHTML,
};
