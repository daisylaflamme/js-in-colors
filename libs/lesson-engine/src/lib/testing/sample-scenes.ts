import type { InteractScene, LibraryEntry, QuizScene, WatchScene } from '@jic/shared';

/** Sample scenes for unit tests and stories (not real lesson content). */
export const SAMPLE_WATCH: WatchScene = {
  id: 'meet',
  type: 'watch',
  bubble: 'This is a jar. It can hold one thing.',
  visual: { kind: 'jar', name: 'favorite', value: '7', concept: 'number' },
  code: 'let favorite = 7;',
  notes: [
    { term: 'let', text: 'means: make a new jar' },
    { term: 'favorite', text: 'is the name on the jar' },
  ],
};

export const SAMPLE_INTERACT: InteractScene = {
  id: 'fill',
  type: 'interact',
  prompt: 'Pick something for the jar:',
  visual: { kind: 'jar', name: 'favorite' },
  choices: [
    {
      id: 'seven',
      label: '7',
      concept: 'number',
      value: '7',
      bubble: 'My favorite is 7!',
      code: 'let favorite = 7;',
    },
    {
      id: 'emma',
      label: 'Emma',
      concept: 'string',
      value: 'Emma',
      bubble: 'My favorite is Emma!',
      code: 'let favorite = "Emma";',
    },
    {
      id: 'yes',
      label: 'yes!',
      concept: 'boolean',
      value: 'yes',
      bubble: 'My favorite is yes!',
      code: 'let favorite = true;',
    },
  ],
  notes: [{ term: 'let', text: 'means: make a new jar' }],
};

export const SAMPLE_QUIZ: QuizScene = {
  id: 'check',
  type: 'quiz',
  question: 'What is the name of this jar?',
  visual: { kind: 'jar', name: 'favorite', value: '7', concept: 'number' },
  options: [
    { id: 'favorite', label: 'favorite', correct: true, feedback: 'Yes! The name is on the tag.' },
    {
      id: 'seven',
      label: '7',
      concept: 'number',
      correct: false,
      feedback: 'Not quite. 7 is inside. Try another one!',
    },
  ],
};

export const SAMPLE_LIBRARY: LibraryEntry = {
  title: 'All about jars',
  sections: [{ heading: 'What is a jar?', text: 'A jar keeps one thing. It has a name.' }],
  examples: [
    { concept: 'number', label: 'Numbers', value: '7' },
    { concept: 'string', label: 'Words', value: 'Emma' },
  ],
  words: [{ term: 'name', meaning: 'the label' }],
};
