import type { Concept } from '@jic/shared';

/**
 * PLACEHOLDER lesson list for the walking skeleton (names from docs/mockups).
 * Real lessons will be YAML in content/lessons, loaded through data-access.
 * Progress here is fake: two lessons "finished" so the menu shows its states.
 */
export interface LessonSummary {
  readonly id: string;
  readonly title: string;
  readonly topic: string;
  readonly concept: Concept;
  readonly finished: boolean;
}

export const LESSONS: readonly LessonSummary[] = [
  { id: 'hello', title: 'Hello, JavaScript!', topic: 'Introduction', concept: 'array', finished: true },
  { id: 'output', title: 'Say it out loud', topic: 'Output', concept: 'string', finished: true },
  { id: 'variables', title: 'Variables', topic: 'Variables', concept: 'variable', finished: false },
  {
    id: 'data-types',
    title: 'Numbers, words, yes/no',
    topic: 'Data types',
    concept: 'number',
    finished: false,
  },
  { id: 'functions', title: 'Magic machines', topic: 'Functions', concept: 'function', finished: false },
  { id: 'conditions', title: 'Yes or no paths', topic: 'Conditions', concept: 'boolean', finished: false },
  { id: 'loops', title: 'Again and again', topic: 'Loops', concept: 'number', finished: false },
  { id: 'arrays', title: 'Lists of things', topic: 'Arrays', concept: 'array', finished: false },
  { id: 'objects', title: 'Things with details', topic: 'Objects', concept: 'object', finished: false },
  { id: 'dom', title: 'Page magic', topic: 'The DOM', concept: 'html', finished: false },
];

export const DEFAULT_LESSON_ID = 'variables';

export function findLesson(id: string | null | undefined): LessonSummary | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function lessonNumber(id: string): number {
  return LESSONS.findIndex((l) => l.id === id) + 1;
}
