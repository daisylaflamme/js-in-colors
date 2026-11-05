import { TestBed } from '@angular/core/testing';
import { isResumeCode, type Course } from '@jic/shared';
import { browserLocalStorage } from '../browser-storage';
import { CourseStore } from '../course.store';
import { LESSON_SOURCE } from '../lesson-source';
import { memoryProgressStorage } from '../testing/memory-progress-storage';
import { localProgressStorage, parseProgress, PROGRESS_KEY } from './progress-storage';

const course: Course = {
  lessons: [
    { id: 'hello', title: 'Hello', topic: 'Intro', concept: 'intro', status: 'ready' },
    { id: 'output', title: 'Say it', topic: 'Output', concept: 'string', status: 'ready' },
    { id: 'jars', title: 'Jars', topic: 'Variables', concept: 'variable', status: 'ready' },
    { id: 'loops', title: 'Loops', topic: 'Loops', concept: 'number', status: 'soon' },
  ],
};
const ids = course.lessons.map((l) => l.id);
const saved = (finishedIds: string[], lastLessonId: string | null = null) => ({
  v: 1,
  resumeCode: 'brave-otter-37',
  finishedIds,
  lastLessonId,
});

function setup(initial: unknown = null) {
  const memory = memoryProgressStorage(initial);
  TestBed.configureTestingModule({
    providers: [{ provide: LESSON_SOURCE, useValue: { course, loaders: {} } }, memory.provider],
  });
  return { store: TestBed.inject(CourseStore), box: memory.box };
}

describe('parseProgress', () => {
  it('accepts saved progress', () => {
    expect(parseProgress(saved(['hello'], 'jars'), ids)).toEqual({
      resumeCode: 'brave-otter-37',
      finishedIds: ['hello'],
      lastLessonId: 'jars',
    });
  });

  it('starts fresh on missing, malformed or old data', () => {
    for (const bad of [
      null,
      'text',
      [],
      { ...saved([]), v: 2 },
      { ...saved([]), v: undefined },
      { ...saved([]), resumeCode: 'Bob' },
    ])
      expect(parseProgress(bad, ids)).toBeNull();
  });

  it('drops lessons that are no longer in the course, duplicates and junk', () => {
    expect(
      parseProgress({ ...saved(['hello', 'gone', 'hello']), finishedIds: ['hello', 'gone', 'hello', 3] }, ids)
        ?.finishedIds,
    ).toEqual(['hello']);
    expect(parseProgress(saved([], 'gone'), ids)?.lastLessonId).toBeNull();
    expect(parseProgress({ ...saved([]), finishedIds: 'hello' }, ids)?.finishedIds).toEqual([]);
  });
});

describe('localProgressStorage', () => {
  it('round-trips through localStorage with a version', () => {
    localStorage.clear();
    const storage = localProgressStorage(localStorage);
    storage.write({ resumeCode: 'blue-fox-42', finishedIds: ['hello'], lastLessonId: null });
    expect(JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '')).toEqual({
      v: 1,
      resumeCode: 'blue-fox-42',
      finishedIds: ['hello'],
      lastLessonId: null,
    });
    expect(parseProgress(storage.read(), ids)?.finishedIds).toEqual(['hello']);
  });

  it('never throws when storage is blocked or holds bad JSON', () => {
    const blocked = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    } as unknown as Storage;
    const storage = localProgressStorage(blocked);
    expect(storage.read()).toBeNull();
    expect(() =>
      storage.write({ resumeCode: 'blue-fox-42', finishedIds: [], lastLessonId: null }),
    ).not.toThrow();

    localStorage.setItem(PROGRESS_KEY, '{not json');
    expect(localProgressStorage(localStorage).read()).toBeNull();
    expect(localProgressStorage(undefined).read()).toBeNull();
  });
});

describe('CourseStore progress', () => {
  it('starts a new visitor with a fresh code and saves it at once', () => {
    const { store, box } = setup();
    expect(isResumeCode(store.resumeCode())).toBe(true);
    expect(store.isNewVisitor()).toBe(true);
    expect(store.continueLesson()?.id).toBe('hello');
    expect(box.saved).toEqual({ v: 1, resumeCode: store.resumeCode(), finishedIds: [], lastLessonId: null });
  });

  it('restores saved progress and keeps the code', () => {
    const { store } = setup(saved(['hello', 'output'], 'output'));
    expect(store.resumeCode()).toBe('brave-otter-37');
    expect(store.finishedCount()).toBe(2);
    expect(store.isNewVisitor()).toBe(false);
  });

  it('saves after every change', () => {
    const { store, box } = setup(saved([]));
    store.markOpened('hello');
    store.markFinished('hello');
    store.markOpened('output');
    expect(box.saved).toEqual(saved(['hello'], 'output'));
  });

  it('only remembers ready lessons as opened', () => {
    const { store } = setup(saved([], 'hello'));
    store.markOpened('loops');
    store.markOpened('nope');
    expect(store.lastLessonId()).toBe('hello');
  });

  describe('continueLesson', () => {
    const cases: [string, string[], string | null, string | undefined][] = [
      ['new visitor: the first ready lesson', [], null, 'hello'],
      ['the last lesson opened, if not finished', ['hello'], 'jars', 'jars'],
      ['after a finished lesson: the next unfinished one', ['hello', 'output'], 'output', 'jars'],
      ['skips finished lessons ahead and wraps to the start', ['output', 'jars'], 'jars', 'hello'],
      ['everything ready is finished: none', ['hello', 'output', 'jars'], 'jars', undefined],
    ];
    for (const [name, finished, last, expected] of cases)
      it(name, () => {
        const { store } = setup(saved(finished, last));
        expect(store.continueLesson()?.id).toBe(expected);
      });
  });

  it('earns the certificate only when every lesson is finished, coming-soon ones too', () => {
    expect(setup(saved(['hello', 'output', 'jars'])).store.certificateEarned()).toBe(false);
    TestBed.resetTestingModule();
    expect(setup(saved(['hello', 'output', 'jars', 'loops'])).store.certificateEarned()).toBe(true);
  });

  it('gives each lesson a state on the color path', () => {
    const { store } = setup(saved(['hello'], 'hello'));
    expect(store.pathLessons().map((l) => `${l.id}:${l.state}`)).toEqual([
      'hello:finished',
      'output:current',
      'jars:todo',
      'loops:soon',
    ]);
  });
});

describe('browserLocalStorage', () => {
  it('returns undefined instead of throwing when the browser blocks storage', () => {
    const blocked = Object.defineProperty({}, 'localStorage', {
      get() {
        throw new DOMException('Storage is blocked', 'SecurityError');
      },
    }) as Window;
    expect(browserLocalStorage(blocked)).toBeUndefined();
    expect(browserLocalStorage(null)).toBeUndefined();
    expect(browserLocalStorage(window)).toBe(window.localStorage);
  });
});
