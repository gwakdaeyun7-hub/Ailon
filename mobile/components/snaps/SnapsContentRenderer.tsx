/**
 * SnapsContentRenderer -- 학문스낵 자유 형식 마크다운 텍스트 렌더러
 *
 * 파이프라인이 생성한 자유 텍스트를 다음 규칙으로 파싱하여 스타일링:
 * 1. ## 섹션 제목
 * 2. 수식 라인 (monospace + teal 배경): ``` 블록 또는 단독 수식 패턴
 * 3. 용어 정의 ("term - definition" 패턴, beige 배경)
 * 4. 번호/불릿 리스트 항목 (1. 또는 - 접두사)
 * 5. 강조 문장 (! 느낌표로 끝나는 문장, 배경 없음)
 * 6. 일반 본문 텍스트
 *
 * 배경색 규칙:
 * - Teal (primaryLight): 수식 블록 (순수 수학 표현식)
 * - Beige (surface): 용어 정의 + 알고리즘 스텝 (번호 리스트)
 * - 그 외: 배경 없음
 *
 * 인라인 서식:
 * - **텍스트** → 굵은 글씨 (fontWeight 700)
 */

import React, { useMemo } from 'react';
import { View, Text, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { FontFamily } from '@/lib/theme';
import { latexToDisplay } from '@/lib/latexToDisplay';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BlockType =
  | 'heading'
  | 'formula'
  | 'definition'
  | 'emphasis'
  | 'list_item'
  | 'steps'
  | 'body'
  | 'spacer';

interface ContentBlock {
  type: BlockType;
  text: string;
  /** For definitions: the term part before " - " */
  term?: string;
  /** For definitions: the description part after " - " */
  desc?: string;
  /** For list items: '•' or '1.' etc. */
  prefix?: string;
  /** For steps: grouped numbered items */
  items?: string[];
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * 수식 라인 패턴 감지:
 * - = 기호를 포함하고 양쪽에 수학 기호가 있는 라인
 * - e^, log, sin, cos 등 수학 함수
 * - 그리스 문자 유니코드 포함
 * - LaTeX 명령어 (\frac, \sum 등) 포함
 * - dE, dT 등 미분 기호 패턴
 */
const FORMULA_PATTERNS = [
  /[=<>].*[+\-*/^]/, // 등호 + 연산자
  /[+\-*/^].*[=<>]/, // 연산자 + 등호
  /\\(?:frac|sum|int|prod|sqrt|alpha|beta|gamma|delta|theta|sigma|lambda|mu|pi|omega)/i, // LaTeX 명령
  /[αβγδεζηθικλμνξπρστυφχψω]/, // 그리스 문자
  /\be\^/, // e^x 패턴
  /\bd[A-Z]\s*=/, // dE = 패턴
  /\b(?:log|ln|exp|sin|cos|tan|lim|max|min|arg|det)\b/,
  /[Σ∏∫∀∃→∈≤≥≠≈]/, // 수학 특수기호
  /[₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹ⁿₙ]/, // 위/아래첨자 유니코드
  /\bP\s*\(.*\)\s*[=<>]/, // P(x) = ... 확률 표기
  /\b[A-Z]\s*\(\s*\w+\s*\)\s*=/, // F(x) = 함수 표기
];

function isFormulaLine(line: string): boolean {
  const trimmed = line.trim();
  // 너무 긴 라인은 수식이 아님 (일반 문장)
  if (trimmed.length > 80) return false;
  // 한글 비율이 25% 이상이면 수식이 아닌 일반 문장
  const koreanChars = (trimmed.match(/[가-힣]/g) || []).length;
  if (koreanChars > trimmed.length * 0.25) return false;

  return FORMULA_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * 용어 정의 패턴: "용어 - 설명" 또는 "용어: 설명"
 * - 용어 부분이 짧고 (1~40자) — 영문 괄호 포함 용어 대응
 * - 구분자가 " - " 또는 ":" 이며
 * - 설명 부분이 존재
 */
function parseDefinition(line: string): { term: string; desc: string } | null {
  // "용어 - 설명" 패턴
  const dashMatch = line.match(/^(.{1,40})\s+[-–—]\s+(.+)$/);
  if (dashMatch) {
    return { term: dashMatch[1].trim(), desc: dashMatch[2].trim() };
  }
  return null;
}

/**
 * 강조 문장: ! 느낌표로 끝나는 문장 (단, 짧은 감탄사 제외)
 */
function isEmphasisLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.endsWith('!') && trimmed.length > 15;
}

/**
 * 콘텐츠 문자열을 블록 배열로 파싱
 */
export function parseContent(content: string): ContentBlock[] {
  if (!content) return [];

  const lines = content.split('\n');
  const blocks: ContentBlock[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  // 이슈 1: 첫 번째 비공백 줄은 definition 매칭 건너뛰기 (리드/서브타이틀)
  let firstContentLineSeen = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 빈 줄은 spacer로
    if (!trimmed) {
      // 연속 빈 줄은 하나로 축소
      if (blocks.length > 0 && blocks[blocks.length - 1].type !== 'spacer') {
        blocks.push({ type: 'spacer', text: '' });
      }
      continue;
    }

    // 코드 블록 토글 (``` 기준)
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // 코드 블록 종료 -> 수식 블록으로 처리
        if (codeBuffer.length > 0) {
          blocks.push({
            type: 'formula',
            text: codeBuffer.join('\n'),
          });
        }
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const isFirstContentLine = !firstContentLineSeen;
    firstContentLineSeen = true;

    // ## 섹션 제목
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'heading', text: trimmed.slice(3).trim() });
      continue;
    }
    // # 대제목도 heading으로 처리 (본문 내에서는 ##과 동일 취급)
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      blocks.push({ type: 'heading', text: trimmed.slice(2).trim() });
      continue;
    }

    // 이슈 2: 줄 전체가 **텍스트:** 또는 **텍스트** 패턴이면 heading으로 처리
    if (/^\*\*.+\*\*:?$/.test(trimmed) || /^\*\*.+:\*\*$/.test(trimmed)) {
      const headingText = trimmed.replace(/^\*\*/, '').replace(/:\*\*$/, '').replace(/\*\*:?$/, '');
      blocks.push({ type: 'heading', text: headingText });
      continue;
    }

    // 번호 리스트 항목 (1. 2. 3. etc.) → steps 블록으로 그룹화
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      if (blocks.length > 0 && blocks[blocks.length - 1].type === 'steps') {
        blocks[blocks.length - 1].items!.push(numMatch[2]);
      } else {
        blocks.push({ type: 'steps', text: '', items: [numMatch[2]] });
      }
      continue;
    }

    // 불릿 리스트 항목 (- 또는 * 접두사)
    if (/^[-*]\s+/.test(trimmed)) {
      blocks.push({ type: 'list_item', text: trimmed.replace(/^[-*]\s+/, ''), prefix: '\u2022' });
      continue;
    }

    // 수식 라인 감지
    if (isFormulaLine(trimmed)) {
      // 연속 수식 라인이면 합침
      if (blocks.length > 0 && blocks[blocks.length - 1].type === 'formula') {
        blocks[blocks.length - 1].text += '\n' + trimmed;
        continue;
      }
      blocks.push({ type: 'formula', text: trimmed });
      continue;
    }

    // 용어 정의 패턴 — 첫 줄은 건너뛰기 (리드/서브타이틀)
    if (!isFirstContentLine) {
      const def = parseDefinition(trimmed);
      if (def) {
        blocks.push({ type: 'definition', text: trimmed, term: def.term, desc: def.desc });
        continue;
      }
    }

    // 강조 문장
    if (isEmphasisLine(trimmed)) {
      blocks.push({ type: 'emphasis', text: trimmed });
      continue;
    }

    // 기본: 본문 텍스트
    // 연속 본문 라인은 하나로 합침 (단, 줄바꿈 유지)
    if (blocks.length > 0 && blocks[blocks.length - 1].type === 'body') {
      blocks[blocks.length - 1].text += '\n' + trimmed;
    } else {
      blocks.push({ type: 'body', text: trimmed });
    }
  }

  // 코드 블록이 닫히지 않은 채 끝난 경우
  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push({ type: 'formula', text: codeBuffer.join('\n') });
  }

  // 이슈 3: definition 사이의 spacer 제거 (연속 정의 블록 그룹감 강화)
  const filtered: ContentBlock[] = [];
  for (let i = 0; i < blocks.length; i++) {
    if (
      blocks[i].type === 'spacer' &&
      i > 0 && blocks[i - 1].type === 'definition' &&
      i + 1 < blocks.length && blocks[i + 1].type === 'definition'
    ) {
      continue; // spacer 제거
    }
    filtered.push(blocks[i]);
  }

  return filtered;
}

// ---------------------------------------------------------------------------
// Inline formatting: **text** → bold
// ---------------------------------------------------------------------------

function renderBoldText(text: string, boldColor: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1
      ? <Text key={`b${i}`} style={{ fontWeight: '700', color: boldColor }}>{part}</Text>
      : <React.Fragment key={`t${i}`}>{part}</React.Fragment>
  );
}

// ---------------------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------------------

function HeadingBlock({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 28, marginBottom: 12 }}>
      <Text style={{
        fontSize: 17,
        lineHeight: 26,
        fontFamily: FontFamily.serif,
        fontWeight: '700',
        color: colors.textPrimary,
      }}>
        {text}
      </Text>
    </View>
  );
}

function FormulaBlock({ text }: { text: string }) {
  const { colors } = useTheme();
  const displayText = useMemo(() => {
    return text
      .split('\n')
      .map((line) => latexToDisplay(line))
      .join('\n');
  }, [text]);

  return (
    <View style={{
      backgroundColor: colors.primaryLight,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginVertical: 8,
    }}>
      <Text
        style={{
          fontSize: 14,
          lineHeight: 24,
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          fontWeight: '500',
          color: colors.primaryDark,
        }}
        selectable
        accessibilityRole="text"
        accessibilityLabel={`수식: ${displayText}`}
      >
        {displayText}
      </Text>
    </View>
  );
}

function DefinitionBlock({ term, desc }: { term: string; desc: string }) {
  const { colors } = useTheme();
  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginVertical: 3,
    }}>
      <Text style={{ fontSize: 14, lineHeight: 22 }}>
        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{term}</Text>
        <Text style={{ color: colors.textDim }}> — </Text>
        <Text style={{ color: colors.textSecondary }}>{desc}</Text>
      </Text>
    </View>
  );
}

function StepsBlock({ items }: { items: string[] }) {
  const { colors } = useTheme();
  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginVertical: 8,
    }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', marginBottom: i < items.length - 1 ? 6 : 0 }}>
          <Text style={{
            fontSize: 14,
            lineHeight: 22,
            color: colors.textDim,
            marginRight: 8,
            minWidth: 20,
            fontWeight: '600',
          }}>
            {i + 1}.
          </Text>
          <Text style={{
            flex: 1,
            fontSize: 14,
            lineHeight: 22,
            color: colors.textSecondary,
          }}>
            {renderBoldText(item, colors.textPrimary)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function EmphasisBlock({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <Text style={{
      fontSize: 15,
      lineHeight: 26,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 16,
    }}>
      {renderBoldText(text, colors.textPrimary)}
    </Text>
  );
}

function ListItemBlock({ text, prefix = '\u2022' }: { text: string; prefix?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{
      flexDirection: 'row',
      paddingLeft: 8,
      marginBottom: 8,
    }}>
      <Text style={{
        fontSize: 15,
        lineHeight: 24,
        color: colors.textDim,
        marginRight: 8,
        minWidth: prefix.length > 1 ? 24 : 12,
      }}>
        {prefix}
      </Text>
      <Text style={{
        flex: 1,
        fontSize: 15,
        lineHeight: 24,
        color: colors.textSecondary,
        letterSpacing: 0.2,
      }}>
        {renderBoldText(text, colors.textPrimary)}
      </Text>
    </View>
  );
}

function BodyBlock({ text }: { text: string }) {
  const { colors, isDark } = useTheme();
  const bodyColor = isDark ? colors.textDark : '#44403C';

  return (
    <Text style={{
      fontSize: 15,
      lineHeight: 26,
      color: bodyColor,
      letterSpacing: 0.2,
      marginBottom: 16,
    }}>
      {renderBoldText(text, colors.textPrimary)}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Main Renderer
// ---------------------------------------------------------------------------

interface SnapsContentRendererProps {
  /** 마크다운 형식 자유 텍스트 콘텐츠 */
  content: string;
}

export function SnapsContentRenderer({ content }: SnapsContentRendererProps) {
  const blocks = useMemo(() => parseContent(content), [content]);

  if (blocks.length === 0) return null;

  return (
    <View>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading':
            return <HeadingBlock key={idx} text={block.text} />;
          case 'formula':
            return <FormulaBlock key={idx} text={block.text} />;
          case 'definition':
            return (
              <DefinitionBlock
                key={idx}
                term={block.term || ''}
                desc={block.desc || ''}
              />
            );
          case 'steps':
            return <StepsBlock key={idx} items={block.items || []} />;
          case 'emphasis':
            return <EmphasisBlock key={idx} text={block.text} />;
          case 'list_item':
            return <ListItemBlock key={idx} text={block.text} prefix={block.prefix} />;
          case 'body':
            return <BodyBlock key={idx} text={block.text} />;
          case 'spacer':
            return <View key={idx} style={{ height: 8 }} />;
          default:
            return null;
        }
      })}
    </View>
  );
}

export default SnapsContentRenderer;
