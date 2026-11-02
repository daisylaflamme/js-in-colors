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
export type Visual = JarVisualData | ScreenVisualData | DotVisualData;

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
