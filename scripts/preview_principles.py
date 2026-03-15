#!/usr/bin/env python3
"""
학문 스낵 콘텐츠 브라우저 미리보기 생성기
curated_principles/ 폴더의 모든 .md 파일을 읽어
모바일 앱과 동일한 스타일로 렌더링하는 HTML 파일 생성 후 브라우저에서 열기
"""

import json
import sys
import webbrowser
from pathlib import Path

SCRIPTS_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPTS_DIR))

from agents.principle_seeds import PRINCIPLE_SEEDS

CURATED_DIR = SCRIPTS_DIR / "curated_principles"
OUTPUT_HTML = SCRIPTS_DIR / "principle_preview.html"

DISCIPLINE_NAME_EN = {
    "제어공학": "Control Engineering",
    "전기/전자공학": "Electrical & Electronic Eng.",
    "정보/통신공학": "Information & Comms Eng.",
    "최적화공학": "Optimization Engineering",
    "로보틱스": "Robotics",
    "물리학": "Physics",
    "생물학": "Biology",
    "화학": "Chemistry",
    "신경과학": "Neuroscience",
    "수학": "Mathematics",
    "통계학": "Statistics",
    "의학/생명과학": "Medicine / Life Science",
}

SUPER_CATEGORY_EN = {
    "공학": "Engineering",
    "자연과학": "Natural Science",
    "형식과학": "Formal Science",
    "응용과학": "Applied Science",
}


def parse_md(filepath: Path) -> dict | None:
    text = filepath.read_text(encoding="utf-8")
    parts = text.split("---", 2)
    if len(parts) < 3:
        return None
    fm = parts[1].strip()
    rest = parts[2]

    meta = {}
    for line in fm.split("\n"):
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()

    if "---EN---" in rest:
        ko, en = rest.split("---EN---", 1)
    else:
        ko, en = rest, ""

    return {
        "content_ko": ko.strip(),
        "content_en": en.strip(),
        "difficulty": meta.get("difficulty", "intermediate"),
        "connectionType": meta.get("connectionType", ""),
        "keywords": [k.strip() for k in meta.get("keywords", "").split(",") if k.strip()],
        "keywords_en": [k.strip() for k in meta.get("keywords_en", "").split(",") if k.strip()],
    }


def build_data() -> list[dict]:
    seed_map = {s["id"]: s for s in PRINCIPLE_SEEDS}
    principles = []

    for md_file in sorted(CURATED_DIR.glob("*.md")):
        seed_id = md_file.stem
        seed = seed_map.get(seed_id)
        if not seed:
            continue
        parsed = parse_md(md_file)
        if not parsed:
            continue

        char_count = len(parsed["content_ko"])
        read_min = max(1, round(char_count / 500))

        principles.append({
            "id": seed_id,
            "title": seed.get("principle_name", seed_id),
            "title_en": seed.get("principle_name_en", ""),
            "discipline_name": seed.get("discipline_name", ""),
            "discipline_name_en": DISCIPLINE_NAME_EN.get(seed.get("discipline_name", ""), ""),
            "super_category": seed.get("super_category", ""),
            "super_category_en": SUPER_CATEGORY_EN.get(seed.get("super_category", ""), ""),
            "ai_connection": seed.get("ai_connection", ""),
            "ai_connection_en": seed.get("ai_connection_en", ""),
            "takeaway": seed.get("takeaway", ""),
            "takeaway_en": seed.get("takeaway_en", ""),
            "content_ko": parsed["content_ko"],
            "content_en": parsed["content_en"],
            "difficulty": parsed["difficulty"],
            "connectionType": parsed["connectionType"],
            "keywords": parsed["keywords"],
            "keywords_en": parsed["keywords_en"],
            "readTime": f"{read_min}분",
            "readTime_en": f"{read_min} min",
        })

    return principles


HTML_TEMPLATE = r'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AILON — 학문 스낵 미리보기</title>
<style>
/* ── Reset & Base ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #FAF9F6; --card: #FFFFFF; --text-primary: #1C1917;
  --text-secondary: #78716C; --text-dim: #A8A29E; --text-dark: #292524;
  --border: #E7E5E4; --primary: #0D7377; --primary-dark: #0A5C5F;
  --primary-light: #F0FDFA; --primary-border: #99F6E4;
  --surface: #F5F2EE; --tag-bg: #F5F2EE; --tag-text: #78716C;
  --core-tech: #0D7377; --core-tech-bg: #F0FDFA;
  --body-color: #44403C;
  --sidebar-bg: #F0EDE8;
  --cat-eng: #B45309; --cat-eng-bg: #FFFBEB;
  --cat-nat: #15803D; --cat-nat-bg: #F0FDF4;
  --cat-for: #0D7377; --cat-for-bg: #F0FDFA;
  --cat-app: #EA580C; --cat-app-bg: #FFF7ED;
  --diff-beg-c: #15803D; --diff-beg-bg: #F0FDF4;
  --diff-int-c: #B45309; --diff-int-bg: #FFFBEB;
  --diff-adv-c: #DC2626; --diff-adv-bg: #FEF2F2;
}

[data-theme="dark"] {
  --bg: #1A1816; --card: #231F1D; --text-primary: #E7E5E4;
  --text-secondary: #A8A29E; --text-dim: #78716C; --text-dark: #D6D3D1;
  --border: #302B28; --primary: #14B8A6; --primary-dark: #2DD4BF;
  --primary-light: #112525; --primary-border: #1A3B36;
  --surface: #211D1B; --tag-bg: #2A2624; --tag-text: #A8A29E;
  --core-tech: #2DD4BF; --core-tech-bg: #112525;
  --body-color: #D6D3D1;
  --sidebar-bg: #151311;
  --cat-eng: #FBBF24; --cat-eng-bg: #2D2513;
  --cat-nat: #4ADE80; --cat-nat-bg: #052E16;
  --cat-for: #2DD4BF; --cat-for-bg: #112525;
  --cat-app: #FB923C; --cat-app-bg: #431407;
  --diff-beg-c: #4ADE80; --diff-beg-bg: #052E16;
  --diff-int-c: #FBBF24; --diff-int-bg: #2D2513;
  --diff-adv-c: #FF5252; --diff-adv-bg: #3D1F1F;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg); color: var(--text-primary);
  display: flex; height: 100vh; overflow: hidden;
}

/* ── Sidebar ── */
.sidebar {
  width: 300px; min-width: 300px; height: 100vh;
  background: var(--sidebar-bg); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; overflow: hidden;
}
.sidebar-header {
  padding: 16px 20px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}
.sidebar-header h2 { font-size: 16px; font-weight: 700; }
.sidebar-controls { display: flex; gap: 6px; }
.sidebar-controls button {
  background: var(--surface); border: 1px solid var(--border);
  color: var(--text-secondary); border-radius: 8px;
  padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer;
}
.sidebar-controls button.active {
  background: var(--primary); color: #fff; border-color: var(--primary);
}
.sidebar-list {
  flex: 1; overflow-y: auto; padding: 8px 0;
}
.cat-section { margin-bottom: 4px; }
.cat-header {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px 6px; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.cat-icon {
  width: 22px; height: 22px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px;
}
.principle-item {
  padding: 8px 20px 8px 32px; cursor: pointer;
  border-left: 3px solid transparent; transition: all 0.15s;
}
.principle-item:hover { background: var(--surface); }
.principle-item.active {
  background: var(--primary-light); border-left-color: var(--primary);
}
.principle-item .p-title {
  font-size: 13px; font-weight: 600; color: var(--text-primary);
  margin-bottom: 2px;
}
.principle-item .p-meta {
  font-size: 11px; color: var(--text-dim);
}
.sidebar-footer {
  padding: 12px 20px; border-top: 1px solid var(--border);
  font-size: 11px; color: var(--text-dim); text-align: center;
}

/* ── Main ── */
.main {
  flex: 1; overflow-y: auto; display: flex; justify-content: center;
  padding: 20px 0;
}
.phone-frame {
  width: 400px; max-width: 100%; min-height: fit-content;
}

/* ── Principle Header ── */
.p-header {
  padding: 20px 20px 24px; border-bottom: 1px solid var(--border);
}
.badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.badge {
  font-size: 10px; font-weight: 700; border-radius: 16px;
  padding: 3px 8px; display: inline-flex; align-items: center; gap: 4px;
}
.hero-title {
  font-size: 26px; font-weight: 800; line-height: 34px;
  font-family: 'Georgia', 'Lora', serif; margin-bottom: 8px;
}
.keywords { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.kw-tag {
  background: var(--tag-bg); color: var(--tag-text);
  font-size: 10px; font-weight: 600; border-radius: 14px; padding: 3px 8px;
}

/* ── Content Blocks (matches SnapsContentRenderer) ── */
.content { padding: 8px 20px 0; }

.block-heading {
  margin-top: 28px; margin-bottom: 12px;
  font-size: 17px; line-height: 26px; font-weight: 700;
  font-family: 'Georgia', 'Lora', serif; color: var(--text-primary);
}

.block-formula {
  background: var(--primary-light); border-radius: 8px;
  padding: 10px 16px; margin: 8px 0;
  font-size: 14px; line-height: 24px; font-weight: 500;
  font-family: 'Menlo', 'Consolas', monospace;
  color: var(--primary-dark); white-space: pre-wrap;
}

.block-definition {
  background: var(--surface); border-radius: 8px;
  padding: 8px 14px; margin: 3px 0; font-size: 14px; line-height: 22px;
}
.block-definition .def-term { font-weight: 700; color: var(--text-primary); }
.block-definition .def-sep { color: var(--text-dim); }
.block-definition .def-desc { color: var(--text-secondary); }

.block-steps {
  background: var(--surface); border-radius: 8px;
  padding: 10px 14px; margin: 8px 0;
}
.block-steps .step {
  display: flex; margin-bottom: 6px; font-size: 14px; line-height: 22px;
}
.block-steps .step:last-child { margin-bottom: 0; }
.block-steps .step-num {
  color: var(--text-dim); font-weight: 600; min-width: 24px; margin-right: 8px;
}
.block-steps .step-text { flex: 1; color: var(--text-secondary); }

.block-emphasis {
  font-size: 15px; line-height: 26px; font-weight: 600;
  color: var(--text-primary); margin-bottom: 16px;
}

.block-list-item {
  display: flex; padding-left: 8px; margin-bottom: 8px;
  font-size: 15px; line-height: 24px;
}
.block-list-item .bullet {
  color: var(--text-dim); margin-right: 8px; min-width: 12px;
}
.block-list-item .item-text {
  flex: 1; color: var(--text-secondary); letter-spacing: 0.2px;
}

.block-body {
  font-size: 15px; line-height: 26px; letter-spacing: 0.2px;
  color: var(--body-color); margin-bottom: 16px;
  white-space: pre-wrap;
}

.block-spacer { height: 8px; }

/* ── Takeaway ── */
.takeaway {
  background: var(--primary-light); border-radius: 12px;
  padding: 14px; margin: 16px 20px 20px;
}
.takeaway-label {
  font-size: 10px; font-weight: 700; color: var(--text-dim);
  letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 6px;
}
.takeaway-text {
  font-size: 13px; line-height: 20px; color: var(--text-primary);
  font-family: 'Georgia', 'Lora', serif; font-style: italic;
}

/* ── Bold inline ── */
.bold { font-weight: 700; color: var(--text-primary); }

/* ── Scrollbar ── */
.sidebar-list::-webkit-scrollbar, .main::-webkit-scrollbar { width: 6px; }
.sidebar-list::-webkit-scrollbar-thumb, .main::-webkit-scrollbar-thumb {
  background: var(--border); border-radius: 3px;
}

/* ── Responsive ── */
@media (max-width: 800px) {
  .sidebar { width: 240px; min-width: 240px; }
  .phone-frame { width: 100%; padding: 0 8px; }
}
</style>
</head>
<body>
<div class="sidebar">
  <div class="sidebar-header">
    <h2>학문 스낵</h2>
    <div class="sidebar-controls">
      <button id="btn-theme" onclick="toggleTheme()">Dark</button>
      <button id="btn-lang" onclick="toggleLang()">EN</button>
    </div>
  </div>
  <div class="sidebar-list" id="sidebar-list"></div>
  <div class="sidebar-footer" id="sidebar-footer"></div>
</div>
<div class="main" id="main-scroll">
  <div class="phone-frame" id="phone"></div>
</div>

<script>
const DATA = /* DATA_PLACEHOLDER */;

let currentIdx = 0;
let lang = 'ko';
let theme = 'light';

const CAT_ORDER = ['공학', '자연과학', '형식과학', '응용과학'];
const CAT_ICONS = { '공학': '🏛', '자연과학': '🧬', '형식과학': 'Σ', '응용과학': '⚛' };
const CAT_CSS = { '공학': 'eng', '자연과학': 'nat', '형식과학': 'for', '응용과학': 'app' };

const CONN_LABELS = {
  direct_inspiration: { ko: '직접 영감', en: 'Direct' },
  structural_analogy: { ko: '구조적 유사', en: 'Structural' },
  mathematical_foundation: { ko: '수학적 기반', en: 'Mathematical' },
  conceptual_borrowing: { ko: '개념 차용', en: 'Conceptual' },
};

const DIFF_LABELS = {
  beginner: { ko: '입문', en: 'Easy', css: 'beg' },
  intermediate: { ko: '중급', en: 'Medium', css: 'int' },
  advanced: { ko: '심화', en: 'Hard', css: 'adv' },
};

// ── Sidebar ──

function buildSidebar() {
  const grouped = {};
  DATA.forEach((p, i) => {
    const cat = p.super_category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ ...p, _idx: i });
  });

  let html = '';
  CAT_ORDER.forEach(cat => {
    if (!grouped[cat]) return;
    const cssKey = CAT_CSS[cat];
    const catName = lang === 'en' ? grouped[cat][0].super_category_en : cat;
    html += `<div class="cat-section">
      <div class="cat-header">
        <div class="cat-icon" style="background:var(--cat-${cssKey}-bg);color:var(--cat-${cssKey})">${CAT_ICONS[cat]}</div>
        <span style="color:var(--cat-${cssKey})">${catName} (${grouped[cat].length})</span>
      </div>`;
    grouped[cat].forEach(p => {
      const title = lang === 'en' && p.title_en ? p.title_en : p.title;
      const disc = lang === 'en' && p.discipline_name_en ? p.discipline_name_en : p.discipline_name;
      const diff = DIFF_LABELS[p.difficulty];
      const diffLabel = diff ? (lang === 'en' ? diff.en : diff.ko) : '';
      html += `<div class="principle-item${p._idx === currentIdx ? ' active' : ''}"
        onclick="selectPrinciple(${p._idx})">
        <div class="p-title">${title}</div>
        <div class="p-meta">${disc} · ${diffLabel} · ${p.readTime_en ? (lang === 'en' ? p.readTime_en : p.readTime) : p.readTime}</div>
      </div>`;
    });
    html += '</div>';
  });
  document.getElementById('sidebar-list').innerHTML = html;
  document.getElementById('sidebar-footer').textContent =
    `${DATA.length}${lang === 'en' ? ' principles' : '개 원리'}`;
}

// ── Content Parser (replicates SnapsContentRenderer) ──

const FORMULA_RE = [
  /[=<>].*[+\-*/^]/, /[+\-*/^].*[=<>]/,
  /\\(?:frac|sum|int|prod|sqrt|alpha|beta|gamma|delta|theta|sigma|lambda|mu|pi|omega)/i,
  /[αβγδεζηθικλμνξπρστυφχψω]/,
  /\be\^/, /\bd[A-Z]\s*=/,
  /\b(?:log|ln|exp|sin|cos|tan|lim|max|min|arg|det)\b/,
  /[Σ∏∫∀∃→∈≤≥≠≈]/,
  /[₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹ⁿₙ]/,
  /\bP\s*\(.*\)\s*[=<>]/, /\b[A-Z]\s*\(\s*\w+\s*\)\s*=/,
];

function isFormula(line) {
  if (line.length > 80) return false;
  const korean = (line.match(/[가-힣]/g) || []).length;
  if (korean > line.length * 0.25) return false;
  return FORMULA_RE.some(r => r.test(line));
}

function parseDef(line) {
  const m = line.match(/^(.{1,40})\s+[-–—]\s+(.+)$/);
  return m ? { term: m[1].trim(), desc: m[2].trim() } : null;
}

function parseContent(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const blocks = [];
  let inCode = false, codeBuf = [], firstSeen = false;

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      if (blocks.length && blocks[blocks.length-1].type !== 'spacer')
        blocks.push({ type: 'spacer' });
      continue;
    }
    if (t.startsWith('```')) {
      if (inCode) {
        if (codeBuf.length) blocks.push({ type: 'formula', text: codeBuf.join('\n') });
        codeBuf = []; inCode = false;
      } else { inCode = true; codeBuf = []; }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    const isFirst = !firstSeen;
    firstSeen = true;

    if (t.startsWith('## ')) { blocks.push({ type: 'heading', text: t.slice(3).trim() }); continue; }
    if (t.startsWith('# ') && !t.startsWith('## ')) { blocks.push({ type: 'heading', text: t.slice(2).trim() }); continue; }
    if (/^\*\*.+\*\*:?$/.test(t) || /^\*\*.+:\*\*$/.test(t)) {
      blocks.push({ type: 'heading', text: t.replace(/^\*\*/, '').replace(/:\*\*$/, '').replace(/\*\*:?$/, '') });
      continue;
    }
    const numM = t.match(/^(\d+)\.\s+(.+)$/);
    if (numM) {
      if (blocks.length && blocks[blocks.length-1].type === 'steps')
        blocks[blocks.length-1].items.push(numM[2]);
      else blocks.push({ type: 'steps', items: [numM[2]] });
      continue;
    }
    if (/^[-*]\s+/.test(t)) {
      blocks.push({ type: 'list_item', text: t.replace(/^[-*]\s+/, '') });
      continue;
    }
    if (isFormula(t)) {
      if (blocks.length && blocks[blocks.length-1].type === 'formula')
        blocks[blocks.length-1].text += '\n' + t;
      else blocks.push({ type: 'formula', text: t });
      continue;
    }
    if (!isFirst) {
      const def = parseDef(t);
      if (def) { blocks.push({ type: 'definition', ...def }); continue; }
    }
    if (t.endsWith('!') && t.length > 15) {
      blocks.push({ type: 'emphasis', text: t }); continue;
    }
    if (blocks.length && blocks[blocks.length-1].type === 'body')
      blocks[blocks.length-1].text += '\n' + t;
    else blocks.push({ type: 'body', text: t });
  }

  if (inCode && codeBuf.length) blocks.push({ type: 'formula', text: codeBuf.join('\n') });

  // Remove spacers between consecutive definitions
  const filtered = [];
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].type === 'spacer' &&
        i > 0 && blocks[i-1].type === 'definition' &&
        i+1 < blocks.length && blocks[i+1].type === 'definition') continue;
    filtered.push(blocks[i]);
  }
  return filtered;
}

function boldify(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '<span class="bold">$1</span>');
}

function renderBlocks(blocks) {
  return blocks.map(b => {
    switch (b.type) {
      case 'heading': return `<div class="block-heading">${esc(b.text)}</div>`;
      case 'formula': return `<div class="block-formula">${esc(b.text)}</div>`;
      case 'definition': return `<div class="block-definition"><span class="def-term">${esc(b.term)}</span><span class="def-sep"> — </span><span class="def-desc">${esc(b.desc)}</span></div>`;
      case 'steps': return `<div class="block-steps">${b.items.map((it, i) =>
        `<div class="step"><span class="step-num">${i+1}.</span><span class="step-text">${boldify(esc(it))}</span></div>`
      ).join('')}</div>`;
      case 'emphasis': return `<div class="block-emphasis">${boldify(esc(b.text))}</div>`;
      case 'list_item': return `<div class="block-list-item"><span class="bullet">•</span><span class="item-text">${boldify(esc(b.text))}</span></div>`;
      case 'body': return `<div class="block-body">${boldify(esc(b.text))}</div>`;
      case 'spacer': return `<div class="block-spacer"></div>`;
      default: return '';
    }
  }).join('');
}

function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Render Principle ──

function renderPrinciple(p) {
  const cat = p.super_category;
  const cssKey = CAT_CSS[cat];
  const disc = lang === 'en' && p.discipline_name_en ? p.discipline_name_en : p.discipline_name;
  const title = lang === 'en' && p.title_en ? p.title_en : p.title;
  const conn = p.connectionType ? CONN_LABELS[p.connectionType] : null;
  const diff = p.difficulty ? DIFF_LABELS[p.difficulty] : null;
  const kws = lang === 'en' && p.keywords_en.length ? p.keywords_en : p.keywords;
  const content = lang === 'en' && p.content_en ? p.content_en : p.content_ko;
  const takeaway = lang === 'en' && p.takeaway_en ? p.takeaway_en : p.takeaway;
  const readTime = lang === 'en' ? p.readTime_en : p.readTime;

  let html = `<div class="p-header"><div class="badges">`;
  html += `<span class="badge" style="background:var(--cat-${cssKey}-bg);color:var(--cat-${cssKey})">${CAT_ICONS[cat]} ${disc}</span>`;
  if (conn) html += `<span class="badge" style="background:var(--core-tech-bg);color:var(--core-tech)">${lang==='en'?conn.en:conn.ko}</span>`;
  if (diff) html += `<span class="badge" style="background:var(--diff-${diff.css}-bg);color:var(--diff-${diff.css}-c)">${lang==='en'?diff.en:diff.ko}</span>`;
  if (readTime) html += `<span class="badge" style="background:var(--surface);color:var(--text-dim)">⏱ ${readTime}</span>`;
  html += `</div>`;
  html += `<div class="hero-title">${esc(title)}</div>`;
  if (kws.length) {
    html += `<div class="keywords">${kws.map(k => `<span class="kw-tag">${esc(k)}</span>`).join('')}</div>`;
  }
  html += `</div>`;

  const blocks = parseContent(content);
  html += `<div class="content">${renderBlocks(blocks)}</div>`;

  if (takeaway) {
    html += `<div class="takeaway"><div class="takeaway-label">TAKEAWAY</div><div class="takeaway-text">${esc(takeaway)}</div></div>`;
  }

  return html;
}

// ── Actions ──

function selectPrinciple(idx) {
  currentIdx = idx;
  render();
  document.getElementById('main-scroll').scrollTop = 0;
}

function toggleTheme() {
  theme = theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('btn-theme').textContent = theme === 'light' ? 'Dark' : 'Light';
}

function toggleLang() {
  lang = lang === 'ko' ? 'en' : 'ko';
  document.getElementById('btn-lang').textContent = lang === 'ko' ? 'EN' : 'KO';
  render();
}

function render() {
  buildSidebar();
  document.getElementById('phone').innerHTML = renderPrinciple(DATA[currentIdx]);
}

// ── Init ──
render();
</script>
</body>
</html>'''


def main():
    principles = build_data()
    if not principles:
        print("No curated principle files found in", CURATED_DIR)
        sys.exit(1)

    html = HTML_TEMPLATE.replace("/* DATA_PLACEHOLDER */", json.dumps(principles, ensure_ascii=False))
    OUTPUT_HTML.write_text(html, encoding="utf-8")
    print(f"Generated: {OUTPUT_HTML} ({len(principles)} principles)")
    webbrowser.open(OUTPUT_HTML.as_uri())


if __name__ == "__main__":
    main()
