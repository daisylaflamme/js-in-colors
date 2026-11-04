import { TestBed } from '@angular/core/testing';
import type { Course, Lesson } from '@jic/shared';
import { CourseStore } from './course.store';
import { LESSON_SOURCE, type LessonSource } from './lesson-source';
import { LessonStore } from './lesson.store';
import { memoryProgressStorage } from './testing/memory-progress-storage';

const lesson: Lesson = {
  id: 'jars',
  title: 'Jars',
  topic: 'Variables',
  lead: 'A jar.',
  concept: 'variable',
  tip: 'Jars hold things.',
  library: { title: 'Jars', sections: [{ heading: 'Jars', text: 'A jar.' }] },
  scenes: [
    { id: 'watch', type: 'watch', bubble: 'Look.', visual: { kind: 'jar', name: 'box' } },
    {
      id: 'pick',
      type: 'interact',
      prompt: 'Pick:',
      visual: { kind: 'jar', name: 'box' },
      choices: [
        { id: 'seven', label: '7', concept: 'number', value: '7', bubble: '7!', code: 'let box = 7;' },
        { id: 'hi', label: 'Hi', concept: 'string', value: 'Hi', bubble: 'Hi!', code: 'let box = "Hi";' },
      ],
    },
    {
      id: 'quiz',
      type: 'quiz',
      question: 'Name?',
      options: [
        { id: 'box', label: 'box', correct: true, feedback: 'Yes!' },
        { id: 'seven', label: '7', correct: false, feedback: 'Not quite.' },
      ],
    },
    { id: 'bye', type: 'watch', bubble: 'Bye.', visual: { kind: 'dot' } },
  ],
};

const course: Course = {
  lessons: [
    { id: 'hello', title: 'Hello', topic: 'Intro', concept: 'intro', status: 'soon' },
    { id: 'jars', title: 'Jars', topic: 'Variables', concept: 'variable', status: 'ready' },
    { id: 'loops', title: 'Loops', topic: 'Loops', concept: 'number', status: 'soon' },
    { id: 'lists', title: 'Lists', topic: 'Arrays', concept: 'array', status: 'ready' },
  ],
};

function setup() {
  const source: LessonSource = { course, loaders: { jars: async () => lesson } };
  TestBed.configureTestingModule({
    providers: [{ provide: LESSON_SOURCE, useValue: source }, memoryProgressStorage().provider, LessonStore],
  });
  return { store: TestBed.inject(LessonStore), courseStore: TestBed.inject(CourseStore) };
}

describe('CourseStore', () => {
  it('lists the course and finds ready lessons', () => {
    const { courseStore } = setup();
    expect(courseStore.lessons()).toHaveLength(4);
    expect(courseStore.readyLessons().map((l) => l.id)).toEqual(['jars', 'lists']);
    expect(courseStore.firstReadyId()).toBe('jars');
    expect(courseStore.position('loops')).toBe(3);
    expect(courseStore.nextReadyAfter('jars')?.id).toBe('lists');
    expect(courseStore.nextReadyAfter('lists')).toBeUndefined();
  });

  it('marks lessons finished once', () => {
    const { courseStore } = setup();
    courseStore.markFinished('jars');
    courseStore.markFinished('jars');
    expect(courseStore.finishedIds()).toEqual(['jars']);
    expect(courseStore.isFinished('jars')).toBe(true);
    expect(courseStore.finishedCount()).toBe(1);
  });
});

describe('LessonStore', () => {
  it('loads a lesson and starts at scene 1', async () => {
    const { store } = setup();
    expect(store.status()).toBe('idle');
    const loading = store.load('jars');
    expect(store.status()).toBe('loading');
    await loading;
    expect(store.status()).toBe('ready');
    expect(store.sceneNumber()).toBe(1);
    expect(store.sceneCount()).toBe(4);
    expect(store.scene()?.id).toBe('watch');
    expect(store.isFirst()).toBe(true);
  });

  it('reports a lesson that does not exist', async () => {
    const { store } = setup();
    await store.load('nope');
    expect(store.status()).toBe('missing');
    expect(store.scene()).toBeNull();
  });

  it('keeps Next and Back within bounds', async () => {
    const { store } = setup();
    await store.load('jars');
    store.back();
    expect(store.sceneNumber()).toBe(1);
    store.next();
    store.next();
    store.next();
    expect(store.sceneNumber()).toBe(4);
    expect(store.isLast()).toBe(true);
  });

  it('pre-picks the first choice and remembers picks per scene across Back', async () => {
    const { store } = setup();
    await store.load('jars');
    expect(store.pickedChoice()).toBeNull(); // not an interact scene
    store.next();
    expect(store.pickedChoice()?.id).toBe('seven');
    store.pick('hi');
    store.pick('banana'); // ignored
    expect(store.pickedChoice()?.id).toBe('hi');
    store.back();
    store.next();
    expect(store.pickedChoice()?.id).toBe('hi');
  });

  it('records quiz answers, right or wrong, and allows retries', async () => {
    const { store } = setup();
    await store.load('jars');
    store.next();
    store.next();
    expect(store.answeredOption()).toBeNull();
    store.answer('seven');
    expect(store.answeredOption()?.correct).toBe(false);
    store.answer('box');
    expect(store.answeredOption()?.correct).toBe(true);
  });

  it('finishes on Next from the last scene and tells the course', async () => {
    const { store, courseStore } = setup();
    await store.load('jars');
    for (let i = 0; i < 4; i++) store.next();
    expect(store.done()).toBe(true);
    expect(courseStore.isFinished('jars')).toBe(true);
    store.next(); // no-op once done
    expect(store.done()).toBe(true);
    store.back(); // back to the last scene
    expect(store.done()).toBe(false);
    expect(store.sceneNumber()).toBe(4);
  });

  it('restarts from scene 1 with fresh picks', async () => {
    const { store } = setup();
    await store.load('jars');
    store.next();
    store.pick('hi');
    store.restart();
    expect(store.sceneNumber()).toBe(1);
    expect(store.picks()).toEqual({});
  });
});
