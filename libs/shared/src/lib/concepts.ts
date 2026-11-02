/**
 * The JavaScript concepts the app teaches. Each has a color token, a shape and a kid word.
 * Source: docs/mockups/README.md ("Concept color, shape, word").
 * Color is never the only signal: UI always shows the shape and the word together.
 */
export const CONCEPTS = [
  'number',
  'string',
  'boolean',
  'object',
  'array',
  'function',
  'variable',
  'html',
] as const;

export type Concept = (typeof CONCEPTS)[number];

export type ConceptShape =
  'circle' | 'pill' | 'diamond' | 'rounded-square' | 'triangle' | 'hexagon' | 'capsule';

export interface ConceptInfo {
  readonly concept: Concept;
  /** The word kids see, e.g. "words" for strings. */
  readonly kidWord: string;
  /** The real JavaScript word, e.g. "String". */
  readonly jsWord: string;
  readonly shape: ConceptShape;
}

export const CONCEPT_INFO: Readonly<Record<Concept, ConceptInfo>> = {
  number: { concept: 'number', kidWord: 'numbers', jsWord: 'Number', shape: 'circle' },
  string: { concept: 'string', kidWord: 'words', jsWord: 'String', shape: 'pill' },
  boolean: { concept: 'boolean', kidWord: 'yes or no', jsWord: 'Boolean', shape: 'diamond' },
  object: { concept: 'object', kidWord: 'things', jsWord: 'Object', shape: 'rounded-square' },
  array: { concept: 'array', kidWord: 'lists', jsWord: 'Array', shape: 'triangle' },
  function: { concept: 'function', kidWord: 'helpers', jsWord: 'Function', shape: 'hexagon' },
  variable: { concept: 'variable', kidWord: 'jars', jsWord: 'Variable', shape: 'capsule' },
  html: { concept: 'html', kidWord: 'page magic', jsWord: 'DOM', shape: 'hexagon' },
};

export function isConcept(value: unknown): value is Concept {
  return typeof value === 'string' && (CONCEPTS as readonly string[]).includes(value);
}
