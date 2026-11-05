import type { Concept } from './concepts';

/**
 * Lesson content types. Lessons are authored as YAML in content/lessons/, validated at build time
 * (validate-lesson.ts) and compiled to JSON. See docs/adr/0007.
 *
 * This file must stay "erasable" TypeScript (no enums, namespaces or parameter properties):
 * the content build runs it directly with Node's type stripping.
 */

export interface CodeNoteData {
  /** The code word being explained, e.g. "let". */
  readonly term: string;
  /** Plain words, e.g. "means: make a new jar". */
  readonly text: string;
}

/** Pictures a scene can show. Each kind is a component in libs/visuals. */
export type Visual =
  | JarVisualData
  | ScreenVisualData
  | DotVisualData
  | MachineVisualData
  | ForkVisualData
  | ListVisualData
  | CardVisualData;

/** One named detail of an object, e.g. name: "Tom". */
export interface CardProp {
  /** At most 8 characters. */
  readonly key: string;
  /** At most 6 characters. */
  readonly value: string;
  readonly concept: Concept;
}

/** An object as a card: one thing with named details. */
export interface CardVisualData {
  readonly kind: 'card';
  /** The variable name on the tag, e.g. "cat" (at most 10 characters). */
  readonly name: string;
  /** 1 to 3 details. */
  readonly props: readonly CardProp[];
  /** The detail being read, e.g. "name" for cat.name. */
  readonly key?: string;
}

/** An array as a row of numbered boxes: many things in order, under one name. */
export interface ListVisualData {
  readonly kind: 'list';
  /** The name tag, e.g. "fruits" (at most 10 characters). */
  readonly name: string;
  /** 0 to 4 items, each at most 6 characters. */
  readonly items: readonly string[];
  /** Colors and shapes the items. Required when there are items. */
  readonly concept?: Concept;
  /** The spot being pointed at, e.g. 1 for fruits[1]. */
  readonly index?: number;
}

/** Which way a fork goes: the `if` path ("yes", true) or the `else` path ("no", false). */
export type ForkPath = 'yes' | 'no';

/** A condition as a fork in the road: a yes-or-no question picks the path. */
export interface ForkVisualData {
  readonly kind: 'fork';
  /** The condition on the signpost, e.g. "sunny?" (at most 12 characters). */
  readonly question: string;
  /** Where the yes (true) path leads (at most 12 characters). */
  readonly yes: string;
  /** Where the no (false) path leads (at most 12 characters). */
  readonly no: string;
  /** The path taken; none means still deciding. */
  readonly take?: ForkPath;
}

export interface JarVisualData {
  readonly kind: 'jar';
  /** The name tag on the jar. */
  readonly name: string;
  /** What is inside, if anything. */
  readonly value?: string;
  readonly concept?: Concept;
}

export interface ScreenVisualData {
  readonly kind: 'screen';
  /** Lines shown on the little screen. */
  readonly lines: readonly string[];
}

export interface DotVisualData {
  readonly kind: 'dot';
}

/** A function as a machine: something goes in, something comes out. */
export interface MachineVisualData {
  readonly kind: 'machine';
  /** The name plate (the function's name). */
  readonly name: string;
  /** What goes in, if anything. */
  readonly input?: string;
  /** What comes out, if anything. */
  readonly output?: string;
  /** Colors and shapes both input and output. */
  readonly concept?: Concept;
}

interface SceneBase {
  /** Unique within the lesson. */
  readonly id: string;
}

/** An animated explanation. Nothing to do but watch (and replay). */
export interface WatchScene extends SceneBase {
  readonly type: 'watch';
  readonly bubble: string;
  readonly visual: Visual;
  /** One line of real JavaScript, shown with "Peek at the code". */
  readonly code?: string;
  readonly notes?: readonly CodeNoteData[];
}

export interface Choice {
  readonly id: string;
  /** On the button. */
  readonly label: string;
  readonly concept: Concept;
  /** What the picture shows (e.g. inside the jar, or on the screen). */
  readonly value: string;
  /** What Dot says. */
  readonly bubble: string;
  /** The line of JavaScript for this choice. */
  readonly code: string;
  /** Machine scenes only: what comes out when `value` goes in. */
  readonly result?: string;
  /** Screen scenes only: the lines shown when picked, e.g. a loop's output (default: `value`). */
  readonly lines?: readonly string[];
  /** Fork scenes only: which path this choice takes. */
  readonly path?: ForkPath;
  /** List scenes only: the spot to point at. */
  readonly index?: number;
  /** List scenes only: the list after this choice (e.g. after a push). */
  readonly items?: readonly string[];
  /** Card scenes only: the detail to read. */
  readonly key?: string;
  /** Card scenes only: the details after this choice (e.g. after cat.age = 4). */
  readonly props?: readonly CardProp[];
}

/** Pick a choice: the picture, the bubble and the code line update together. */
export interface InteractScene extends SceneBase {
  readonly type: 'interact';
  /** e.g. "Pick something for the jar:" */
  readonly prompt: string;
  readonly visual: Visual;
  /** 2 to 4. The first one is picked when the scene opens. */
  readonly choices: readonly Choice[];
  readonly notes?: readonly CodeNoteData[];
}

export interface QuizOption {
  readonly id: string;
  readonly label: string;
  readonly concept?: Concept;
  readonly correct: boolean;
  /** Kind feedback for this option, right or wrong. */
  readonly feedback: string;
}

/** One friendly question. Kind feedback, retries allowed, no failing. */
export interface QuizScene extends SceneBase {
  readonly type: 'quiz';
  readonly question: string;
  readonly visual?: Visual;
  readonly options: readonly QuizOption[];
}

export type Scene = WatchScene | InteractScene | QuizScene;
export type SceneType = Scene['type'];
export const SCENE_TYPES: readonly SceneType[] = ['watch', 'interact', 'quiz'];

export interface LibraryEntry {
  readonly title: string;
  readonly sections: readonly { readonly heading: string; readonly text: string }[];
  readonly examples?: readonly {
    readonly concept: Concept;
    readonly label: string;
    readonly value: string;
  }[];
  readonly words?: readonly { readonly term: string; readonly meaning: string }[];
}

export interface Lesson {
  readonly id: string;
  readonly title: string;
  /** The real JavaScript topic, e.g. "Variables". */
  readonly topic: string;
  /** One sentence under the title. */
  readonly lead: string;
  /** A word in the lead drawn in the concept color. */
  readonly leadHighlight?: string;
  readonly concept: Concept;
  /** Optional row of concept chips under the lead, e.g. "Jars can hold:" numbers, words, ... */
  readonly chips?: { readonly label: string; readonly concepts: readonly Concept[] };
  /** One sentence. */
  readonly tip: string;
  readonly library: LibraryEntry;
  /** 4 to 6 scenes. */
  readonly scenes: readonly Scene[];
}

export type LessonStatus = 'ready' | 'soon';

export interface CourseLesson {
  readonly id: string;
  readonly title: string;
  readonly topic: string;
  readonly concept: Concept;
  readonly status: LessonStatus;
}

/** content/course.yaml: every lesson in menu order. */
export interface Course {
  readonly lessons: readonly CourseLesson[];
}

export const MIN_SCENES = 4;
export const MAX_SCENES = 6;
