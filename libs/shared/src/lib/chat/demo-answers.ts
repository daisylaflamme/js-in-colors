import type { Concept } from '../concepts';

/** A pre-written answer for demo mode (ADR 0011). Original text, short kid sentences. */
export interface DemoAnswer {
  readonly id: string;
  /** Words or phrases that pick this answer (lowercase, whole words). */
  readonly keywords: readonly string[];
  readonly text: string;
  /** The lesson that shows the idea, with the word used in "See it in the ... lesson". */
  readonly lesson?: { readonly id: string; readonly name: string; readonly concept: Concept };
}

export const DEMO_ANSWERS: readonly DemoAnswer[] = [
  {
    id: 'hello',
    keywords: ['hi', 'hello', 'hey'],
    text: 'Hi there! Ask me about jars, loops or magic machines.',
  },
  {
    id: 'javascript',
    keywords: ['javascript', 'js', 'coding', 'programming', 'program'],
    text: 'JavaScript is a language for talking to computers. It makes web pages do things!',
    lesson: { id: 'hello', name: 'Hello', concept: 'intro' },
  },
  {
    id: 'variable',
    keywords: ['variable', 'variables', 'jar', 'jars', 'let', 'const'],
    text: 'A variable is like a jar with a name. It holds one thing for later.',
    lesson: { id: 'variables', name: 'Variables', concept: 'variable' },
  },
  {
    id: 'boolean',
    keywords: ['true', 'false', 'boolean', 'yes or no'],
    text: 'true means yes, and false means no. JavaScript uses them to decide things.',
    lesson: { id: 'data-types', name: 'Numbers, words, yes/no', concept: 'boolean' },
  },
  {
    id: 'types',
    keywords: ['number', 'numbers', 'string', 'strings', 'word', 'words', 'text', 'quotes'],
    text: 'Numbers are for counting and math. Words go inside quotes, like "hi".',
    lesson: { id: 'data-types', name: 'Numbers, words, yes/no', concept: 'number' },
  },
  {
    id: 'output',
    keywords: ['console', 'console.log', 'log', 'print', 'output'],
    text: 'console.log makes JavaScript say something. You can see it on the screen.',
    lesson: { id: 'output', name: 'Say it out loud', concept: 'string' },
  },
  {
    id: 'function',
    keywords: ['function', 'functions', 'machine', 'machines', 'helper', 'return'],
    text: 'A function is like a magic machine. Something goes in, something new comes out!',
    lesson: { id: 'functions', name: 'Magic machines', concept: 'function' },
  },
  {
    id: 'condition',
    keywords: ['if', 'else', 'condition', 'conditions', 'decide', 'choose'],
    text: 'if lets JavaScript pick a path. If it is sunny, go to the park!',
    lesson: { id: 'conditions', name: 'Yes or no paths', concept: 'boolean' },
  },
  {
    id: 'loop',
    keywords: ['loop', 'loops', 'repeat', 'again', 'while'],
    text: 'A loop is like a merry-go-round. It does the same thing again and again, until it stops.',
    lesson: { id: 'loops', name: 'Loops', concept: 'number' },
  },
  {
    id: 'array',
    keywords: ['array', 'arrays', 'list', 'lists', 'push', 'index'],
    text: 'An array is a list of things in order. Each spot has a number, starting at 0.',
    lesson: { id: 'arrays', name: 'Lists of things', concept: 'array' },
  },
  {
    id: 'object',
    keywords: ['object', 'objects', 'detail', 'details', 'key', 'property'],
    text: 'An object is one thing with many details. A cat has a name and an age.',
    lesson: { id: 'objects', name: 'Things with details', concept: 'object' },
  },
  {
    id: 'dom',
    keywords: ['dom', 'page', 'web page', 'html', 'button', 'queryselector', 'textcontent'],
    text: 'JavaScript can find a part of the page and change it. That is page magic!',
    lesson: { id: 'dom', name: 'Page magic', concept: 'html' },
  },
];

/** When no answer fits: a gentle redirect back to JavaScript. */
export const DEMO_REDIRECTS: readonly string[] = [
  'Hmm, I only know about JavaScript. Try asking about loops!',
  'That is a fun question! But I only talk about JavaScript.',
  'I am not sure about that. Ask me what a variable is!',
];
