import type { CodeNote, CodeToken } from '@jic/ui';
import type { Concept } from '@jic/shared';

/**
 * PLACEHOLDER scene data so the skeleton matches mockups 01, 05, 06 and 07.
 * Not a real lesson: lessons will be YAML rendered by libs/lesson-engine.
 */
export interface DemoChoice {
  readonly id: string;
  readonly concept: Concept;
  /** On the button. */
  readonly label: string;
  /** In the jar. */
  readonly value: string;
  /** What Dot says. */
  readonly bubble: string;
  /** The value as JavaScript. */
  readonly code: string;
}

export const DEMO_SCENE = {
  lead: 'A variable is a jar with a name on it.',
  leadHighlight: 'jar',
  chipsLabel: 'Jars can hold:',
  chips: ['number', 'string', 'boolean', 'object', 'array', 'function'] as const satisfies readonly Concept[],
  jarName: 'favorite',
  choicesLabel: 'Pick something for the jar:',
  choices: [
    { id: 'seven', concept: 'number', label: '7', value: '7', bubble: 'My favorite is 7!', code: '7' },
    {
      id: 'emma',
      concept: 'string',
      label: 'Emma',
      value: 'Emma',
      bubble: 'My favorite is Emma!',
      code: '"Emma"',
    },
    {
      id: 'yes',
      concept: 'boolean',
      label: 'yes!',
      value: 'yes',
      bubble: 'My favorite is yes!',
      code: 'true',
    },
  ] as const satisfies readonly DemoChoice[],
  scene: 3,
  sceneCount: 5,
  tip: 'Jars can hold numbers, words, and more!',
} as const;

export function codeLine(choice: DemoChoice, name: string): CodeToken[] {
  return [
    { text: 'let', kind: 'keyword' },
    { text: ' ', kind: 'punctuation' },
    { text: name, kind: 'name' },
    { text: ' = ', kind: 'operator' },
    { text: choice.code, kind: 'value', concept: choice.concept },
    { text: ';', kind: 'punctuation' },
  ];
}

export function codeNotes(name: string): CodeNote[] {
  return [
    { term: 'let', kind: 'keyword', text: 'means: make a new jar' },
    { term: name, kind: 'name', text: 'is the name on the jar' },
    { term: '=', kind: 'operator', text: 'puts the value inside' },
  ];
}
