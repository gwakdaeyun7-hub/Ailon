/**
 * LaTeX → Unicode display converter for math formulas.
 * No external dependencies. Handles Greek letters, sub/superscripts,
 * fractions, operators, special sets, and common LaTeX commands.
 */

// --- Brace matching helper ---------------------------------------------------

function findMatchingBrace(s: string, openPos: number): number {
  let depth = 0;
  for (let i = openPos; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1; // unmatched
}

/** Extract content of first brace group after pos, return [content, endIndex] */
function extractBraceGroup(s: string, pos: number): [string, number] | null {
  // skip whitespace
  let i = pos;
  while (i < s.length && s[i] === ' ') i++;
  if (i >= s.length || s[i] !== '{') return null;
  const close = findMatchingBrace(s, i);
  if (close === -1) return null;
  return [s.slice(i + 1, close), close];
}

// --- Unicode mappings --------------------------------------------------------

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
  'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
  'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ',
  'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
  'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
  'T': 'ᵀ', 'H': 'ᴴ',
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
  'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
  'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
  'v': 'ᵥ', 'x': 'ₓ',
};

const GREEK_LOWER: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε',
  varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'θ',
  iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν',
  xi: 'ξ', omicron: 'ο', pi: 'π', rho: 'ρ', sigma: 'σ',
  tau: 'τ', upsilon: 'υ', phi: 'φ', varphi: 'φ', chi: 'χ',
  psi: 'ψ', omega: 'ω',
};

const GREEK_UPPER: Record<string, string> = {
  Alpha: 'Α', Beta: 'Β', Gamma: 'Γ', Delta: 'Δ', Epsilon: 'Ε',
  Zeta: 'Ζ', Eta: 'Η', Theta: 'Θ', Iota: 'Ι', Kappa: 'Κ',
  Lambda: 'Λ', Mu: 'Μ', Nu: 'Ν', Xi: 'Ξ', Omicron: 'Ο',
  Pi: 'Π', Rho: 'Ρ', Sigma: 'Σ', Tau: 'Τ', Upsilon: 'Υ',
  Phi: 'Φ', Chi: 'Χ', Psi: 'Ψ', Omega: 'Ω',
};

const MATH_SYMBOLS: Record<string, string> = {
  // Big operators
  sum: 'Σ', prod: 'Π', int: '∫', iint: '∬', iiint: '∭', oint: '∮',
  coprod: '∐', bigcup: '⋃', bigcap: '⋂', bigoplus: '⨁', bigotimes: '⨂',
  // Calculus / diff
  nabla: '∇', partial: '∂',
  // Relations
  leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠',
  approx: '≈', equiv: '≡', sim: '∼', simeq: '≃',
  ll: '≪', gg: '≫', subset: '⊂', supset: '⊃',
  subseteq: '⊆', supseteq: '⊇', in: '∈', notin: '∉', ni: '∋',
  // Arrows
  rightarrow: '→', to: '→', leftarrow: '←', leftrightarrow: '↔',
  Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔',
  mapsto: '↦', uparrow: '↑', downarrow: '↓',
  // Logic
  forall: '∀', exists: '∃', neg: '¬', land: '∧', lor: '∨',
  // Arithmetic
  times: '×', cdot: '·', div: '÷', pm: '±', mp: '∓', circ: '∘',
  // Dots
  ldots: '…', cdots: '⋯', dots: '…', vdots: '⋮', ddots: '⋱',
  // Misc
  infty: '∞', emptyset: '∅', varnothing: '∅',
  angle: '∠', triangle: '△', star: '⋆', dagger: '†',
  ell: 'ℓ', hbar: 'ℏ', Re: 'ℜ', Im: 'ℑ', wp: '℘',
  prime: '′',
  // Delimiters
  langle: '⟨', rangle: '⟩', lceil: '⌈', rceil: '⌉',
  lfloor: '⌊', rfloor: '⌋',
};

const BLACKBOARD: Record<string, string> = {
  R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ',
  E: '𝔼', P: 'ℙ', F: '𝔽', H: 'ℍ',
};

const FUNCTION_NAMES = [
  'log', 'ln', 'exp', 'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
  'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
  'lim', 'sup', 'inf', 'max', 'min', 'arg', 'det', 'dim', 'ker',
  'deg', 'gcd', 'hom', 'Pr', 'var', 'Var', 'Cov',
];

// --- Conversion helpers ------------------------------------------------------

function toSuperscript(s: string): string {
  let allMapped = true;
  let result = '';
  for (const ch of s) {
    if (SUPERSCRIPT_MAP[ch]) {
      result += SUPERSCRIPT_MAP[ch];
    } else {
      allMapped = false;
      break;
    }
  }
  if (allMapped) return result;
  return '^(' + s + ')';
}

function toSubscript(s: string): string {
  let allMapped = true;
  let result = '';
  for (const ch of s) {
    if (SUBSCRIPT_MAP[ch]) {
      result += SUBSCRIPT_MAP[ch];
    } else {
      allMapped = false;
      break;
    }
  }
  if (allMapped) return result;
  return '_(' + s + ')';
}

/** Check if a string is "simple" (no nested commands, just alphanumeric/symbols) */
function isSimple(s: string): boolean {
  return !/[\\{}]/.test(s);
}

// --- Main converter ----------------------------------------------------------

export function latexToDisplay(latex: string): string {
  if (!latex) return '';

  let s = latex;

  // Strip display math delimiters
  s = s.replace(/^\$\$\s*/, '').replace(/\s*\$\$$/, '');
  s = s.replace(/^\$\s*/, '').replace(/\s*\$$/, '');
  s = s.replace(/^\\\[\s*/, '').replace(/\s*\\\]$/, '');

  // \left( \right) → ( )
  s = s.replace(/\\left\s*([(\[{|.])/g, '$1');
  s = s.replace(/\\right\s*([)\]}|.])/g, '$1');
  s = s.replace(/\\left\s*\\([{|])/g, (_m, d) => d === '{' ? '{' : d);
  s = s.replace(/\\right\s*\\([}|])/g, (_m, d) => d === '}' ? '}' : d);

  // \text{...}, \mathrm{...}, \textbf{...}, \mathbf{...}, \mathit{...}, \operatorname{...}
  s = processCommand(s, 'text', (content) => content);
  s = processCommand(s, 'mathrm', (content) => content);
  s = processCommand(s, 'textbf', (content) => content);
  s = processCommand(s, 'mathbf', (content) => content);
  s = processCommand(s, 'mathit', (content) => content);
  s = processCommand(s, 'operatorname', (content) => content);
  s = processCommand(s, 'boldsymbol', (content) => content);
  s = processCommand(s, 'mathcal', (content) => content);
  s = processCommand(s, 'textit', (content) => content);

  // \mathbb{X} → blackboard bold
  s = processCommand(s, 'mathbb', (content) => {
    let result = '';
    for (const ch of content) {
      result += BLACKBOARD[ch] || ch;
    }
    return result;
  });

  // \sqrt[n]{x} → ⁿ√x  (must come before \sqrt{x})
  s = s.replace(/\\sqrt\s*\[([^\]]*)\]\s*\{/g, (match, n, offset) => {
    const braceStart = s.indexOf('{', offset + match.length - 1);
    // Can't do brace matching inside replace; handle with processCommand below
    return `__NTHROOT_${n}__` + '{';
  });
  // Process the nth root markers
  const nthRootRegex = /__NTHROOT_([^_]+)__\{/;
  let nthMatch;
  while ((nthMatch = nthRootRegex.exec(s)) !== null) {
    const n = nthMatch[1];
    const braceOpen = nthMatch.index + nthMatch[0].length - 1;
    const braceClose = findMatchingBrace(s, braceOpen);
    if (braceClose === -1) break;
    const content = s.slice(braceOpen + 1, braceClose);
    const nSup = toSuperscript(n);
    s = s.slice(0, nthMatch.index) + nSup + '√(' + content + ')' + s.slice(braceClose + 1);
  }

  // \sqrt{x} → √x or √(x)
  s = processCommand(s, 'sqrt', (content) => {
    if (content.length <= 2 && isSimple(content)) return '√' + content;
    return '√(' + content + ')';
  });

  // \frac{a}{b} → a/b or (a)/(b)
  s = processFractions(s);

  // \overset{top}{base}, \underset{bot}{base}
  s = processTwoArgCommand(s, 'overset', (top, base) => base + toSuperscript(top));
  s = processTwoArgCommand(s, 'underset', (bot, base) => base + toSubscript(bot));
  s = processTwoArgCommand(s, 'stackrel', (top, base) => base + toSuperscript(top));

  // \binom{n}{k} → C(n,k)
  s = processTwoArgCommand(s, 'binom', (n, k) => `C(${n},${k})`);

  // Greek letters (must come before generic \command stripping)
  for (const [name, symbol] of Object.entries(GREEK_LOWER)) {
    s = s.replace(new RegExp('\\\\' + name + '(?![a-zA-Z])', 'g'), symbol);
  }
  for (const [name, symbol] of Object.entries(GREEK_UPPER)) {
    s = s.replace(new RegExp('\\\\' + name + '(?![a-zA-Z])', 'g'), symbol);
  }

  // Math symbols
  for (const [name, symbol] of Object.entries(MATH_SYMBOLS)) {
    s = s.replace(new RegExp('\\\\' + name + '(?![a-zA-Z])', 'g'), symbol);
  }

  // Named functions: \log → log, etc.
  for (const fn of FUNCTION_NAMES) {
    s = s.replace(new RegExp('\\\\' + fn + '(?![a-zA-Z])', 'g'), fn);
  }

  // LaTeX spacing
  s = s.replace(/\\quad\b/g, '  ');
  s = s.replace(/\\qquad\b/g, '    ');
  s = s.replace(/\\[,;]\s*/g, ' ');
  s = s.replace(/\\!\s*/g, '');
  s = s.replace(/\\[ ]/g, ' ');
  s = s.replace(/\\ /g, ' ');

  // Line break
  s = s.replace(/\\\\/g, '\n');

  // Hat and bar accents: \hat{x} → x̂, \bar{x} → x̄, \tilde{x} → x̃, \vec{x} → x⃗, \dot{x} → ẋ
  s = processCommand(s, 'hat', (c) => c + '\u0302');
  s = processCommand(s, 'bar', (c) => c + '\u0304');
  s = processCommand(s, 'overline', (c) => c + '\u0304');
  s = processCommand(s, 'tilde', (c) => c + '\u0303');
  s = processCommand(s, 'widetilde', (c) => c + '\u0303');
  s = processCommand(s, 'vec', (c) => c + '\u20D7');
  s = processCommand(s, 'dot', (c) => c + '\u0307');
  s = processCommand(s, 'ddot', (c) => c + '\u0308');

  // Superscripts and subscripts with braces: x^{...}, x_{...}
  s = processScripts(s);

  // --- Plaintext formula enhancements (for curated content without LaTeX markup) ---

  // P1: Bare Greek letters without backslash: theta → θ, alpha → α
  // Sorted longest-first to prevent partial matches (e.g., "epsilon" before "pi")
  const BARE_GREEK_SORTED = Object.entries(GREEK_LOWER)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [name, symbol] of BARE_GREEK_SORTED) {
    s = s.replace(new RegExp('(?<![a-zA-Z])' + name + '(?![a-zA-Z])', 'g'), symbol);
  }
  const BARE_GREEK_UPPER_SORTED = Object.entries(GREEK_UPPER)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [name, symbol] of BARE_GREEK_UPPER_SORTED) {
    s = s.replace(new RegExp('(?<![a-zA-Z])' + name + '(?![a-zA-Z])', 'g'), symbol);
  }

  // P2: Multi-char subscripts without braces: _ij → ᵢⱼ (must run before single-char)
  s = s.replace(/(?<=[a-zA-Z0-9)\]])_([a-zA-Z0-9]{2,})(?![a-zA-Z0-9_])/g,
    (_m, group) => toSubscript(group));

  // P3: Parenthesized superscripts: ^(-1) → ⁻¹, ^(2) → ² (existing only handles ^{...})
  s = s.replace(/\^\(([^)]{1,20})\)/g, (_m, inner) => {
    const sup = toSuperscript(inner);
    return sup.startsWith('^(') ? '^(' + inner + ')' : sup;
  });

  // Single-char superscripts/subscripts without braces: x^2, x_i
  s = s.replace(/\^([0-9a-zA-Z+\-])/g, (_m, ch) => {
    return SUPERSCRIPT_MAP[ch] || '^(' + ch + ')';
  });
  s = s.replace(/_([0-9a-zA-Z+\-])/g, (_m, ch) => {
    return SUBSCRIPT_MAP[ch] || '_(' + ch + ')';
  });

  // Strip remaining single-content braces: {x} → x (but not empty {})
  // Iterative to handle nested: {{x}} → {x} → x
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/\{([^{}]*)\}/g, '$1');
  }

  // Clean up any remaining backslash commands we didn't handle (strip the backslash)
  // But only single-word commands, not arbitrary text
  s = s.replace(/\\([a-zA-Z]+)/g, '$1');

  // Collapse multiple spaces
  s = s.replace(/ {2,}/g, ' ');

  return s.trim();
}

// --- Structural command processors -------------------------------------------

/** Process a \command{content} pattern, replacing with transform(content) */
function processCommand(s: string, cmd: string, transform: (content: string) => string): string {
  const pattern = '\\' + cmd + '{';
  let idx = s.indexOf(pattern);
  while (idx !== -1) {
    const braceOpen = idx + pattern.length - 1;
    const braceClose = findMatchingBrace(s, braceOpen);
    if (braceClose === -1) break;
    const content = s.slice(braceOpen + 1, braceClose);
    const replacement = transform(content);
    s = s.slice(0, idx) + replacement + s.slice(braceClose + 1);
    // Search again from after the replacement
    idx = s.indexOf(pattern, idx + replacement.length);
  }
  return s;
}

/** Process \command{arg1}{arg2} patterns */
function processTwoArgCommand(
  s: string,
  cmd: string,
  transform: (arg1: string, arg2: string) => string,
): string {
  const pattern = '\\' + cmd + '{';
  let idx = s.indexOf(pattern);
  while (idx !== -1) {
    const brace1Open = idx + pattern.length - 1;
    const brace1Close = findMatchingBrace(s, brace1Open);
    if (brace1Close === -1) break;
    const arg1 = s.slice(brace1Open + 1, brace1Close);

    const group2 = extractBraceGroup(s, brace1Close + 1);
    if (!group2) break;
    const [arg2, brace2Close] = group2;

    const replacement = transform(arg1, arg2);
    s = s.slice(0, idx) + replacement + s.slice(brace2Close + 1);
    idx = s.indexOf(pattern, idx + replacement.length);
  }
  return s;
}

/** Process \frac{num}{den} → num/den or (num)/(den) */
function processFractions(s: string): string {
  const pattern = '\\frac{';
  let idx = s.indexOf(pattern);
  while (idx !== -1) {
    const numOpen = idx + pattern.length - 1;
    const numClose = findMatchingBrace(s, numOpen);
    if (numClose === -1) break;
    const num = s.slice(numOpen + 1, numClose);

    const denGroup = extractBraceGroup(s, numClose + 1);
    if (!denGroup) break;
    const [den, denClose] = denGroup;

    // Recursively process nested fractions in num and den
    const numProcessed = processFractions(num);
    const denProcessed = processFractions(den);

    let result: string;
    const numSimple = isSimple(numProcessed) && numProcessed.length <= 3;
    const denSimple = isSimple(denProcessed) && denProcessed.length <= 3;

    if (numSimple && denSimple) {
      result = numProcessed + '/' + denProcessed;
    } else {
      const numPart = numSimple ? numProcessed : '(' + numProcessed + ')';
      const denPart = denSimple ? denProcessed : '(' + denProcessed + ')';
      result = numPart + ' / ' + denPart;
    }

    s = s.slice(0, idx) + result + s.slice(denClose + 1);
    idx = s.indexOf(pattern, idx + result.length);
  }
  return s;
}

/** Process x^{...} and x_{...} with brace matching */
function processScripts(s: string): string {
  // Process superscripts with braces
  let match;
  // Use a loop scanning for ^ followed by {
  let result = '';
  let i = 0;
  while (i < s.length) {
    if ((s[i] === '^' || s[i] === '_') && i + 1 < s.length && s[i + 1] === '{') {
      const isSup = s[i] === '^';
      const braceClose = findMatchingBrace(s, i + 1);
      if (braceClose === -1) {
        result += s[i];
        i++;
        continue;
      }
      const content = s.slice(i + 2, braceClose);
      // Recursively process content (might have nested scripts)
      const processed = processScripts(content);
      result += isSup ? toSuperscript(processed) : toSubscript(processed);
      i = braceClose + 1;
    } else {
      result += s[i];
      i++;
    }
  }
  return result;
}
