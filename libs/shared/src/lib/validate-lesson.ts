import { CONCEPTS, isConcept } from './concepts';
import type { Course, Lesson } from './lesson';
import { MAX_SCENES, MIN_SCENES } from './lesson';

/**
 * Validates lesson and course data (parsed from YAML) against the types in lesson.ts.
 * Returns path-aware issues so the content build can print `file:line:col` for each one.
 *
 * Errors break the build. Warnings are kid-readability hints (short sentences!).
 * Erasable TypeScript only: the content build runs this file with Node's type stripping.
 */

export type IssuePath = readonly (string | number)[];

export interface Issue {
  readonly level: 'error' | 'warning';
  readonly path: IssuePath;
  readonly message: string;
}

export interface ValidationResult<T> {
  /** Present only when there are no errors. */
  readonly value?: T;
  readonly issues: readonly Issue[];
}

/** Sentences longer than this many words get a readability warning. */
export const MAX_WORDS_PER_SENTENCE = 12;

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Obj = Record<string, unknown>;

class Checker {
  readonly issues: Issue[] = [];

  error(path: IssuePath, message: string): void {
    this.issues.push({ level: 'error', path, message });
  }

  warn(path: IssuePath, message: string): void {
    this.issues.push({ level: 'warning', path, message });
  }

  object(value: unknown, path: IssuePath): Obj | undefined {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) return value as Obj;
    this.error(path, `should be a mapping (key: value pairs), got ${describe(value)}.`);
    return undefined;
  }

  /** Reports keys the type does not know (usually a typo). */
  knownKeys(obj: Obj, path: IssuePath, keys: readonly string[]): void {
    for (const key of Object.keys(obj)) {
      if (!keys.includes(key)) {
        this.error([...path, key], `is not a known field here. Known fields: ${keys.join(', ')}.`);
      }
    }
  }

  string(
    obj: Obj,
    key: string,
    path: IssuePath,
    opts: { optional?: boolean; prose?: boolean } = {},
  ): string | undefined {
    const value = obj[key];
    const at = [...path, key];
    if (value === undefined || value === null) {
      if (!opts.optional) this.error(at, 'is required.');
      return undefined;
    }
    if (typeof value !== 'string' || value.trim() === '') {
      this.error(at, `should be non-empty text, got ${describe(value)}.`);
      return undefined;
    }
    if (opts.prose) this.readable(value, at);
    return value;
  }

  id(obj: Obj, key: string, path: IssuePath): string | undefined {
    const value = this.string(obj, key, path);
    if (value !== undefined && !ID.test(value)) {
      this.error([...path, key], `"${value}" should be lowercase words joined by dashes, like "my-jar".`);
    }
    return value;
  }

  boolean(obj: Obj, key: string, path: IssuePath): boolean | undefined {
    const value = obj[key];
    if (typeof value === 'boolean') return value;
    this.error(
      [...path, key],
      value === undefined
        ? 'is required (true or false).'
        : `should be true or false, got ${describe(value)}.`,
    );
    return undefined;
  }

  concept(obj: Obj, key: string, path: IssuePath, optional = false): void {
    const value = obj[key];
    if (value === undefined && optional) return;
    if (!isConcept(value)) {
      this.error([...path, key], `${describe(value)} is not a concept. Use one of: ${CONCEPTS.join(', ')}.`);
    }
  }

  array(
    obj: Obj,
    key: string,
    path: IssuePath,
    opts: { min?: number; max?: number; optional?: boolean } = {},
  ): unknown[] | undefined {
    const value = obj[key];
    const at = [...path, key];
    if (value === undefined && opts.optional) return undefined;
    if (!Array.isArray(value)) {
      this.error(
        at,
        value === undefined ? 'is required (a list).' : `should be a list, got ${describe(value)}.`,
      );
      return undefined;
    }
    const { min, max } = opts;
    if (min !== undefined && value.length < min)
      this.error(at, `needs at least ${min} items, has ${value.length}.`);
    if (max !== undefined && value.length > max)
      this.error(at, `can have at most ${max} items, has ${value.length}.`);
    return value;
  }

  uniqueIds(items: readonly unknown[], path: IssuePath): void {
    const seen = new Map<string, number>();
    items.forEach((item, i) => {
      const id = typeof item === 'object' && item !== null ? (item as Obj)['id'] : undefined;
      if (typeof id !== 'string') return;
      const first = seen.get(id);
      if (first !== undefined)
        this.error([...path, i, 'id'], `"${id}" is used twice (also at item ${first}).`);
      else seen.set(id, i);
    });
  }

  /** Kid readability: short sentences. */
  readable(text: string, path: IssuePath): void {
    for (const sentence of sentences(text)) {
      const words = sentence.split(/\s+/).filter(Boolean).length;
      if (words > MAX_WORDS_PER_SENTENCE) {
        this.warn(
          path,
          `has a ${words}-word sentence ("${truncate(sentence)}"). Aim for ${MAX_WORDS_PER_SENTENCE} words or fewer.`,
        );
      }
    }
  }
}

export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function describe(value: unknown): string {
  if (value === undefined) return 'nothing';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'a list';
  if (typeof value === 'object') return 'a mapping';
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
}

function truncate(text: string): string {
  return text.length > 40 ? `${text.slice(0, 37)}...` : text;
}

// ---------------------------------------------------------------------------

function checkVisual(c: Checker, value: unknown, path: IssuePath): void {
  const v = c.object(value, path);
  if (!v) return;
  switch (v['kind']) {
    case 'jar':
      c.knownKeys(v, path, ['kind', 'name', 'value', 'concept']);
      c.string(v, 'name', path);
      c.string(v, 'value', path, { optional: true });
      c.concept(v, 'concept', path, true);
      if (v['value'] !== undefined && v['concept'] === undefined) {
        c.error([...path, 'concept'], 'is required when the jar has a value (it colors the value).');
      }
      return;
    case 'screen': {
      c.knownKeys(v, path, ['kind', 'lines']);
      // May be empty: an interact scene fills the screen with the picked choice.
      const lines = c.array(v, 'lines', path, { max: 4 });
      lines?.forEach((line, i) => {
        if (typeof line !== 'string')
          c.error([...path, 'lines', i], `should be text, got ${describe(line)}.`);
      });
      return;
    }
    case 'dot':
      c.knownKeys(v, path, ['kind']);
      return;
    case 'machine':
      c.knownKeys(v, path, ['kind', 'name', 'input', 'output', 'concept']);
      c.string(v, 'name', path);
      c.string(v, 'input', path, { optional: true });
      c.string(v, 'output', path, { optional: true });
      c.concept(v, 'concept', path, true);
      if ((v['input'] !== undefined || v['output'] !== undefined) && v['concept'] === undefined) {
        c.error(
          [...path, 'concept'],
          'is required when the machine has an input or output (it colors them).',
        );
      }
      return;
    case 'fork':
      c.knownKeys(v, path, ['kind', 'question', 'yes', 'no', 'take']);
      for (const key of ['question', 'yes', 'no']) {
        const text = c.string(v, key, path);
        if (text !== undefined && text.length > FORK_LABEL_MAX) {
          c.error(
            [...path, key],
            `is ${text.length} characters; a fork label can have at most ${FORK_LABEL_MAX} so it fits the picture.`,
          );
        }
      }
      checkForkPath(c, v, 'take', path, true);
      return;
    case 'list': {
      c.knownKeys(v, path, ['kind', 'name', 'items', 'concept', 'index']);
      const name = c.string(v, 'name', path);
      if (name !== undefined && name.length > LIST_NAME_MAX) {
        c.error(
          [...path, 'name'],
          `is ${name.length} characters; a list name can have at most ${LIST_NAME_MAX} so it fits the tag.`,
        );
      }
      const items = checkListItems(c, v, path, false);
      c.concept(v, 'concept', path, true);
      if (items?.length && v['concept'] === undefined) {
        c.error([...path, 'concept'], 'is required when the list has items (it colors them).');
      }
      checkListIndex(c, v, path, items?.length);
      return;
    }
    case 'card': {
      c.knownKeys(v, path, ['kind', 'name', 'props', 'key']);
      const name = c.string(v, 'name', path);
      if (name !== undefined && name.length > CARD_NAME_MAX) {
        c.error(
          [...path, 'name'],
          `is ${name.length} characters; a card name can have at most ${CARD_NAME_MAX} so it fits the tag.`,
        );
      }
      checkCardKey(c, v, path, checkCardProps(c, v, path, false));
      return;
    }
    default:
      c.error(
        [...path, 'kind'],
        `${describe(v['kind'])} is not a visual. Use one of: jar, screen, dot, machine, fork, list, card.`,
      );
  }
}

/** Card names, keys and values must fit the SVG. */
const CARD_PROPS_MAX = 3;
const CARD_NAME_MAX = 10;
const CARD_KEY_MAX = 8;
const CARD_VALUE_MAX = 6;

/** 1 to 3 details ({ key, value, concept }). Returns their keys when the list is readable. */
function checkCardProps(c: Checker, obj: Obj, path: IssuePath, optional: boolean): string[] | undefined {
  const props = c.array(obj, 'props', path, { optional, min: 1, max: CARD_PROPS_MAX });
  if (!props) return undefined;
  const keys: string[] = [];
  props.forEach((p, i) => {
    const at = [...path, 'props', i];
    const prop = c.object(p, at);
    if (!prop) return;
    c.knownKeys(prop, at, ['key', 'value', 'concept']);
    const key = c.string(prop, 'key', at);
    if (key !== undefined) {
      if (key.length > CARD_KEY_MAX)
        c.error(
          [...at, 'key'],
          `is ${key.length} characters; a key can have at most ${CARD_KEY_MAX} so it fits.`,
        );
      if (keys.includes(key))
        c.error([...at, 'key'], `"${key}" is used twice: each detail needs its own key.`);
      keys.push(key);
    }
    const value = c.string(prop, 'value', at);
    if (value !== undefined && value.length > CARD_VALUE_MAX)
      c.error(
        [...at, 'value'],
        `is ${value.length} characters; a value can have at most ${CARD_VALUE_MAX} so it fits its shape.`,
      );
    c.concept(prop, 'concept', at);
  });
  return keys;
}

/** The keys of an already-checked props list (no new errors). */
function cardKeys(props: unknown): string[] | undefined {
  if (!Array.isArray(props)) return undefined;
  return props
    .map((p) => (typeof p === 'object' && p !== null ? (p as Obj)['key'] : undefined))
    .filter((k): k is string => typeof k === 'string');
}

/** An optional key that must name one of the card's details. */
function checkCardKey(c: Checker, obj: Obj, path: IssuePath, keys: string[] | undefined): void {
  const key = obj['key'];
  if (key === undefined) return;
  if (typeof key !== 'string') c.error([...path, 'key'], `should be a detail's key, got ${describe(key)}.`);
  else if (keys && !keys.includes(key))
    c.error([...path, 'key'], `"${key}" is not a detail on this card. Use one of: ${keys.join(', ')}.`);
}

/** List items and names must fit the boxes and the tag of the SVG. */
const LIST_ITEMS_MAX = 4;
const LIST_ITEM_LENGTH_MAX = 6;
const LIST_NAME_MAX = 10;

/** 0 to 4 short text items. Returns them when they are a list (even with problems inside). */
function checkListItems(c: Checker, obj: Obj, path: IssuePath, optional: boolean): unknown[] | undefined {
  const items = c.array(obj, 'items', path, { optional, max: LIST_ITEMS_MAX });
  items?.forEach((item, i) => {
    if (typeof item !== 'string' || item.trim() === '')
      c.error([...path, 'items', i], `should be non-empty text, got ${describe(item)}.`);
    else if (item.length > LIST_ITEM_LENGTH_MAX)
      c.error(
        [...path, 'items', i],
        `is ${item.length} characters; a list item can have at most ${LIST_ITEM_LENGTH_MAX} so it fits its box.`,
      );
  });
  return items;
}

/** An optional spot number that must point inside a list of `length` items. */
function checkListIndex(c: Checker, obj: Obj, path: IssuePath, length: number | undefined): void {
  const value = obj['index'];
  if (value === undefined) return;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    c.error([...path, 'index'], `should be a spot number (0, 1, 2...), got ${describe(value)}.`);
  } else if (length !== undefined && value >= length) {
    c.error(
      [...path, 'index'],
      `is ${value}, but the list has ${length} item(s): spots go from 0 to ${length - 1}.`,
    );
  }
}

/** Fork signpost and path labels must fit the SVG. */
const FORK_LABEL_MAX = 12;

/** "yes" or "no": which way a fork goes. */
function checkForkPath(c: Checker, obj: Obj, key: string, path: IssuePath, optional: boolean): void {
  const value = obj[key];
  if (value === undefined && optional) return;
  if (value !== 'yes' && value !== 'no') {
    c.error(
      [...path, key],
      value === undefined
        ? 'is required ("yes" or "no").'
        : `should be "yes" or "no", got ${describe(value)}.`,
    );
  }
}

function checkNotes(c: Checker, obj: Obj, path: IssuePath): void {
  const notes = c.array(obj, 'notes', path, { optional: true, max: 4 });
  notes?.forEach((n, i) => {
    const note = c.object(n, [...path, 'notes', i]);
    if (!note) return;
    c.knownKeys(note, [...path, 'notes', i], ['term', 'text']);
    c.string(note, 'term', [...path, 'notes', i]);
    c.string(note, 'text', [...path, 'notes', i], { prose: true });
  });
}

function checkScene(c: Checker, value: unknown, path: IssuePath): void {
  const s = c.object(value, path);
  if (!s) return;
  c.id(s, 'id', path);
  switch (s['type']) {
    case 'watch':
      c.knownKeys(s, path, ['id', 'type', 'bubble', 'visual', 'code', 'notes']);
      c.string(s, 'bubble', path, { prose: true });
      checkVisual(c, s['visual'], [...path, 'visual']);
      c.string(s, 'code', path, { optional: true });
      checkNotes(c, s, path);
      return;
    case 'interact': {
      c.knownKeys(s, path, ['id', 'type', 'prompt', 'visual', 'choices', 'notes']);
      c.string(s, 'prompt', path, { prose: true });
      checkVisual(c, s['visual'], [...path, 'visual']);
      const choices = c.array(s, 'choices', path, { min: 2, max: 4 });
      const visual = s['visual'];
      const kind = typeof visual === 'object' && visual !== null ? (visual as Obj)['kind'] : undefined;
      const isMachine = kind === 'machine';
      choices?.forEach((ch, i) => {
        const at = [...path, 'choices', i];
        const choice = c.object(ch, at);
        if (!choice) return;
        c.knownKeys(choice, at, [
          'id',
          'label',
          'concept',
          'value',
          'bubble',
          'code',
          'result',
          'lines',
          'path',
          'index',
          'items',
          'key',
          'props',
        ]);
        if (kind === 'card') {
          if (choice['key'] === undefined && choice['props'] === undefined)
            c.error(at, 'needs key (read a detail) or props (change the card), so the picture changes.');
          const shown =
            choice['props'] === undefined
              ? cardKeys((visual as Obj)['props'])
              : checkCardProps(c, choice, at, false);
          checkCardKey(c, choice, at, shown);
        } else {
          for (const key of ['key', 'props'])
            if (choice[key] !== undefined)
              c.error([...at, key], 'is only for card scenes (which detail, or the new card).');
        }
        if (kind === 'list') {
          if (choice['index'] === undefined && choice['items'] === undefined)
            c.error(at, 'needs index (point at a spot) or items (change the list), so the picture changes.');
          const shown = checkListItems(c, choice, at, true) ?? (visual as Obj)['items'];
          checkListIndex(c, choice, at, Array.isArray(shown) ? shown.length : undefined);
        } else {
          for (const key of ['index', 'items'])
            if (choice[key] !== undefined)
              c.error([...at, key], 'is only for list scenes (which spot, or the new list).');
        }
        if (kind === 'fork') checkForkPath(c, choice, 'path', at, false);
        else if (choice['path'] !== undefined)
          c.error([...at, 'path'], 'is only for fork scenes (which way the fork goes).');
        if (kind === 'screen') {
          const lines = c.array(choice, 'lines', at, { optional: true, min: 1, max: 4 });
          lines?.forEach((line, j) => {
            if (typeof line !== 'string')
              c.error([...at, 'lines', j], `should be text, got ${describe(line)}.`);
          });
        } else if (choice['lines'] !== undefined) {
          c.error([...at, 'lines'], 'is only for screen scenes (the lines on the screen).');
        }
        c.id(choice, 'id', at);
        c.string(choice, 'label', at);
        c.concept(choice, 'concept', at);
        c.string(choice, 'value', at);
        c.string(choice, 'bubble', at, { prose: true });
        c.string(choice, 'code', at);
        if (isMachine) c.string(choice, 'result', at);
        else if (choice['result'] !== undefined)
          c.error([...at, 'result'], 'is only for machine scenes (what comes out of the machine).');
      });
      if (choices) c.uniqueIds(choices, [...path, 'choices']);
      checkNotes(c, s, path);
      return;
    }
    case 'quiz': {
      c.knownKeys(s, path, ['id', 'type', 'question', 'visual', 'options']);
      c.string(s, 'question', path, { prose: true });
      if (s['visual'] !== undefined) checkVisual(c, s['visual'], [...path, 'visual']);
      const options = c.array(s, 'options', path, { min: 2, max: 4 });
      let correct = 0;
      options?.forEach((op, i) => {
        const at = [...path, 'options', i];
        const option = c.object(op, at);
        if (!option) return;
        c.knownKeys(option, at, ['id', 'label', 'concept', 'correct', 'feedback']);
        c.id(option, 'id', at);
        c.string(option, 'label', at);
        c.concept(option, 'concept', at, true);
        if (c.boolean(option, 'correct', at)) correct++;
        c.string(option, 'feedback', at, { prose: true });
      });
      if (options) {
        c.uniqueIds(options, [...path, 'options']);
        if (correct !== 1) {
          c.error([...path, 'options'], `needs exactly one option with "correct: true", has ${correct}.`);
        }
      }
      return;
    }
    default:
      c.error(
        [...path, 'type'],
        `${describe(s['type'])} is not a scene type. Use one of: watch, interact, quiz.`,
      );
  }
}

function checkLibrary(c: Checker, value: unknown, path: IssuePath): void {
  const lib = c.object(value, path);
  if (!lib) return;
  c.knownKeys(lib, path, ['title', 'sections', 'examples', 'words']);
  c.string(lib, 'title', path);
  c.array(lib, 'sections', path, { min: 1 })?.forEach((sec, i) => {
    const at = [...path, 'sections', i];
    const section = c.object(sec, at);
    if (!section) return;
    c.knownKeys(section, at, ['heading', 'text']);
    c.string(section, 'heading', at);
    c.string(section, 'text', at, { prose: true });
  });
  c.array(lib, 'examples', path, { optional: true })?.forEach((ex, i) => {
    const at = [...path, 'examples', i];
    const example = c.object(ex, at);
    if (!example) return;
    c.knownKeys(example, at, ['concept', 'label', 'value']);
    c.concept(example, 'concept', at);
    c.string(example, 'label', at);
    c.string(example, 'value', at);
  });
  c.array(lib, 'words', path, { optional: true })?.forEach((w, i) => {
    const at = [...path, 'words', i];
    const word = c.object(w, at);
    if (!word) return;
    c.knownKeys(word, at, ['term', 'meaning']);
    c.string(word, 'term', at);
    c.string(word, 'meaning', at);
  });
}

export function validateLesson(data: unknown, opts: { expectedId?: string } = {}): ValidationResult<Lesson> {
  const c = new Checker();
  const lesson = c.object(data, []);
  if (lesson) {
    c.knownKeys(
      lesson,
      [],
      ['id', 'title', 'topic', 'lead', 'leadHighlight', 'concept', 'chips', 'tip', 'library', 'scenes'],
    );
    const id = c.id(lesson, 'id', []);
    if (id && opts.expectedId && id !== opts.expectedId) {
      c.error(['id'], `"${id}" should match the file name ("${opts.expectedId}").`);
    }
    c.string(lesson, 'title', []);
    c.string(lesson, 'topic', []);
    const lead = c.string(lesson, 'lead', [], { prose: true });
    const highlight = c.string(lesson, 'leadHighlight', [], { optional: true });
    if (lead && highlight && !lead.includes(highlight)) {
      c.error(['leadHighlight'], `"${highlight}" does not appear in the lead.`);
    }
    c.concept(lesson, 'concept', []);
    if (lesson['chips'] !== undefined) {
      const chips = c.object(lesson['chips'], ['chips']);
      if (chips) {
        c.knownKeys(chips, ['chips'], ['label', 'concepts']);
        c.string(chips, 'label', ['chips']);
        c.array(chips, 'concepts', ['chips'], { min: 1, max: 8 })?.forEach((value, i) => {
          if (!isConcept(value)) {
            c.error(
              ['chips', 'concepts', i],
              `${describe(value)} is not a concept. Use one of: ${CONCEPTS.join(', ')}.`,
            );
          }
        });
      }
    }
    const tip = c.string(lesson, 'tip', [], { prose: true });
    if (tip && sentences(tip).length > 1) c.warn(['tip'], 'should be one sentence.');
    checkLibrary(c, lesson['library'], ['library']);
    const scenes = c.array(lesson, 'scenes', [], { min: MIN_SCENES, max: MAX_SCENES });
    scenes?.forEach((scene, i) => checkScene(c, scene, ['scenes', i]));
    if (scenes) c.uniqueIds(scenes, ['scenes']);
  }
  return result(c, data as Lesson);
}

export function validateCourse(data: unknown): ValidationResult<Course> {
  const c = new Checker();
  const course = c.object(data, []);
  if (course) {
    c.knownKeys(course, [], ['lessons']);
    const lessons = c.array(course, 'lessons', [], { min: 1 });
    lessons?.forEach((l, i) => {
      const at = ['lessons', i];
      const lesson = c.object(l, at);
      if (!lesson) return;
      c.knownKeys(lesson, at, ['id', 'title', 'topic', 'concept', 'status']);
      c.id(lesson, 'id', at);
      c.string(lesson, 'title', at);
      c.string(lesson, 'topic', at);
      c.concept(lesson, 'concept', at);
      if (lesson['status'] !== 'ready' && lesson['status'] !== 'soon') {
        c.error([...at, 'status'], `${describe(lesson['status'])} is not a status. Use "ready" or "soon".`);
      }
    });
    if (lessons) c.uniqueIds(lessons, ['lessons']);
  }
  return result(c, data as Course);
}

/**
 * Cross-file rules: every "ready" lesson in the course has a lesson file and the same
 * title, topic and concept; every lesson file is listed in the course.
 */
export function checkCourseAgainstLessons(course: Course, lessons: readonly Lesson[]): Issue[] {
  const issues: Issue[] = [];
  const byId = new Map(lessons.map((l) => [l.id, l]));
  course.lessons.forEach((entry, i) => {
    const lesson = byId.get(entry.id);
    if (entry.status === 'ready' && !lesson) {
      issues.push({
        level: 'error',
        path: ['lessons', i, 'status'],
        message: `"${entry.id}" is "ready" but content/lessons/${entry.id}.yaml does not exist.`,
      });
    }
    if (lesson) {
      for (const key of ['title', 'topic', 'concept'] as const) {
        if (lesson[key] !== entry[key]) {
          issues.push({
            level: 'error',
            path: ['lessons', i, key],
            message: `"${entry[key]}" differs from the lesson file ("${lesson[key]}").`,
          });
        }
      }
      if (entry.status !== 'ready') {
        issues.push({
          level: 'warning',
          path: ['lessons', i, 'status'],
          message: `"${entry.id}" has a lesson file but is marked "soon".`,
        });
      }
    }
  });
  const listed = new Set(course.lessons.map((l) => l.id));
  for (const lesson of lessons) {
    if (!listed.has(lesson.id)) {
      issues.push({
        level: 'error',
        path: ['lessons'],
        message: `content/lessons/${lesson.id}.yaml is not listed in course.yaml.`,
      });
    }
  }
  return issues;
}

function result<T>(c: Checker, value: T): ValidationResult<T> {
  const ok = !c.issues.some((i) => i.level === 'error');
  return ok ? { value, issues: c.issues } : { issues: c.issues };
}

/** "scenes[2].choices[1].concept" */
export function formatPath(path: IssuePath): string {
  return (
    path.reduce<string>(
      (out, part) => (typeof part === 'number' ? `${out}[${part}]` : out ? `${out}.${part}` : part),
      '',
    ) || '(file)'
  );
}
