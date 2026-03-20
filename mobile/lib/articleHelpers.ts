import type { Article } from './types';
import type { Language } from './translations';

export const SOURCE_COLORS: Record<string, string> = {
  wired_ai: '#000000',
  the_verge_ai: '#E1127A',
  techcrunch_ai: '#0A9E01',
  mit_tech_review: '#D32F2F',
  venturebeat: '#77216F',
  deepmind_blog: '#1D4ED8',
  nvidia_blog: '#76B900',
  huggingface_blog: '#FFD21E',
  aitimes: '#E53935',
  geeknews: '#FF6B35',
  zdnet_ai_editor: '#D32F2F',
  yozm_ai: '#6366F1',
  the_decoder: '#1A1A2E',
  marktechpost: '#0D47A1',
  arstechnica_ai: '#FF4611',
  the_rundown_ai: '#6C5CE7',
};

const SOURCE_NAMES: Record<string, string> = {
  wired_ai: 'Wired AI',
  the_verge_ai: 'The Verge AI',
  techcrunch_ai: 'TechCrunch AI',
  mit_tech_review: 'MIT Tech Review',
  venturebeat: 'VentureBeat',
  deepmind_blog: 'Google DeepMind',
  nvidia_blog: 'NVIDIA AI',
  huggingface_blog: 'Hugging Face',
  geeknews: 'GeekNews',
  the_decoder: 'The Decoder',
  marktechpost: 'MarkTechPost',
  arstechnica_ai: 'Ars Technica AI',
  the_rundown_ai: 'The Rundown AI',
};

const TRANSLATABLE_SOURCES = ['aitimes', 'zdnet_ai_editor', 'yozm_ai'];

export const CATEGORY_COLORS: Record<string, string> = {
  research: '#7C3AED',
  models_products: '#0891B2',
  industry_business: '#D97706',
};

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getSourceName(key: string, t?: (k: string) => string): string {
  if (TRANSLATABLE_SOURCES.includes(key) && t) return t(`source.${key}`);
  return SOURCE_NAMES[key] || key;
}

export function getCategoryName(catKey: string, t: (key: string) => string) {
  return t(`cat.${catKey}`);
}

export function formatDate(str?: string, lang?: string, dateEstimated?: boolean): string {
  if (!str) return '';
  try {
    let formatted = '';
    const ymdMatch = str.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
    if (ymdMatch) {
      if (lang === 'en') {
        const mi = parseInt(ymdMatch[2], 10) - 1;
        formatted = `${EN_MONTHS[mi]} ${parseInt(ymdMatch[3], 10)}, ${ymdMatch[1]}`;
      } else {
        formatted = `${ymdMatch[1]}/${ymdMatch[2]}/${ymdMatch[3]}`;
      }
    } else {
      const d = new Date(str);
      if (isNaN(d.getTime())) return '';
      const y = d.getFullYear();
      const m = d.getMonth();
      const day = d.getDate();
      if (lang === 'en') {
        formatted = `${EN_MONTHS[m]} ${day}, ${y}`;
      } else {
        formatted = `${y}/${String(m + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
      }
    }
    return dateEstimated ? `~${formatted}` : formatted;
  } catch { return ''; }
}

export function getLocalizedTitle(a: Article, lang: Language) {
  if (lang === 'en' && a.display_title_en) return a.display_title_en;
  return a.display_title || a.title;
}

export function getLocalizedOneLine(a: Article, lang: Language) {
  if (lang === 'en' && a.one_line_en) return a.one_line_en;
  return a.one_line || '';
}

export function getLocalizedKeyPoints(a: Article, lang: Language): string[] {
  if (lang === 'en' && a.key_points_en && a.key_points_en.length > 0) return a.key_points_en;
  return a.key_points || [];
}

export function getLocalizedWhyImportant(a: Article, lang: Language) {
  if (lang === 'en' && a.why_important_en) return a.why_important_en;
  return a.why_important || '';
}

export function getLocalizedBackground(a: Article, lang: Language) {
  if (lang === 'en' && a.background_en) return a.background_en;
  return a.background || '';
}

export function getLocalizedGlossary(a: Article, lang: Language): { term: string; desc: string }[] {
  if (lang === 'en' && a.glossary_en && a.glossary_en.length > 0) return a.glossary_en;
  return a.glossary || [];
}
