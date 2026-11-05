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
  // Not a JavaScript type: the course opener ("Hello, JavaScript!"). Accent yellow + star.
  'intro',
] as const;

export type Concept = (typeof CONCEPTS)[number];

export type ConceptShape =
  'circle' | 'pill' | 'diamond' | 'rounded-square' | 'triangle' | 'hexagon' | 'capsule' | 'star' | 'window';

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
  html: { concept: 'html', kidWord: 'page magic', jsWord: 'DOM', shape: 'window' },
  intro: { concept: 'intro', kidWord: 'start here', jsWord: 'JavaScript', shape: 'star' },
};

export function isConcept(value: unknown): value is Concept {
  return typeof value === 'string' && (CONCEPTS as readonly string[]).includes(value);
}

/**
 * Each shape as SVG path data, in a 24 x 24 box (the pill is 32 x 24). One source for the
 * on-screen shapes (ConceptShapeComponent) and anything drawn on a canvas (the certificate PNG),
 * so they never drift apart.
 */
export const SHAPE_PATHS: Readonly<Record<ConceptShape, string>> = {
  circle: 'M12 1.5a10.5 10.5 0 1 0 0 21a10.5 10.5 0 1 0 0-21z',
  pill: 'M8 5h16a7 7 0 0 1 0 14H8a7 7 0 0 1 0-14z',
  diamond: 'M12 1.5 22.5 12 12 22.5 1.5 12z',
  'rounded-square':
    'M6.5 2h11a4.5 4.5 0 0 1 4.5 4.5v11a4.5 4.5 0 0 1-4.5 4.5h-11A4.5 4.5 0 0 1 2 17.5v-11A4.5 4.5 0 0 1 6.5 2z',
  triangle: 'M12 2.5 22.5 21h-21z',
  hexagon: 'M6.5 3h11l5.5 9-5.5 9h-11L1 12z',
  capsule: 'M11 1h2a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6V7a6 6 0 0 1 6-6z',
  star: 'M12 1.8l3.1 6.4 7 .9-5.1 4.9 1.3 7L12 17.6 5.7 21l1.3-7-5.1-4.9 7-.9z',
  window: 'M4.5 3h15a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z',
};

/** The window's page (filled with the background), drawn on top of SHAPE_PATHS.window. */
export const WINDOW_PAGE_PATH = 'M5 9h14v9H5z';

/** Shapes drawn wider than tall (a 32 x 24 box). */
export const WIDE_SHAPES: readonly ConceptShape[] = ['pill'];
