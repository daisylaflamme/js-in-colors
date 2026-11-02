import type { Concept } from './concepts';

export type CodeTokenKind = 'keyword' | 'name' | 'operator' | 'value' | 'punctuation';

export interface CodeTokenData {
  readonly text: string;
  readonly kind: CodeTokenKind;
  /** For values: which concept the value is, so it can be colored like it. */
  readonly concept?: Concept;
}

const KEYWORDS = new Set([
  'let',
  'const',
  'var',
  'function',
  'return',
  'if',
  'else',
  'for',
  'while',
  'new',
  'typeof',
]);
const OPERATORS = new Set([
  '=',
  '==',
  '===',
  '!=',
  '!==',
  '+',
  '-',
  '*',
  '/',
  '<',
  '>',
  '<=',
  '>=',
  '&&',
  '||',
  '!',
]);

/**
 * Splits one short line of beginner JavaScript into colored tokens for the "Peek at the code" panel.
 * It is a highlighter for lessons, not a parser: anything it does not know becomes punctuation.
 */
export function tokenizeJs(code: string): CodeTokenData[] {
  const tokens: CodeTokenData[] = [];
  const re =
    /\s+|"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|\d+(?:\.\d+)?|[A-Za-z_$][\w$]*|===|!==|==|!=|<=|>=|&&|\|\||[=+\-*/<>!]|./g;
  for (const match of code.matchAll(re)) {
    const text = match[0];
    tokens.push(classify(text));
  }
  // Merge neighbouring punctuation/whitespace so the DOM stays small.
  return tokens.reduce<CodeTokenData[]>((out, t) => {
    const prev = out[out.length - 1];
    if (prev && prev.kind === 'punctuation' && t.kind === 'punctuation') {
      out[out.length - 1] = { text: prev.text + t.text, kind: 'punctuation' };
    } else {
      out.push(t);
    }
    return out;
  }, []);
}

function classify(text: string): CodeTokenData {
  if (/^\s+$/.test(text)) return { text, kind: 'punctuation' };
  if (/^["']/.test(text)) return { text, kind: 'value', concept: 'string' };
  if (/^\d/.test(text)) return { text, kind: 'value', concept: 'number' };
  if (text === 'true' || text === 'false') return { text, kind: 'value', concept: 'boolean' };
  if (KEYWORDS.has(text)) return { text, kind: 'keyword' };
  if (OPERATORS.has(text)) return { text, kind: 'operator' };
  if (/^[A-Za-z_$]/.test(text)) return { text, kind: 'name' };
  return { text, kind: 'punctuation' };
}
