import { computed, inject, PendingTasks } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { Choice, InteractScene, Lesson, QuizOption, QuizScene, Scene } from '@jic/shared';
import { CourseStore } from './course.store';
import { LESSON_SOURCE, LessonPreloader } from './lesson-source';

export type LessonLoadStatus = 'idle' | 'loading' | 'ready' | 'missing';

interface LessonState {
  readonly status: LessonLoadStatus;
  readonly lesson: Lesson | null;
  /** 0-based. */
  readonly sceneIndex: number;
  /** Choice picked per interact scene (scene id -> choice id). Kept when moving Back. */
  readonly picks: Readonly<Record<string, string>>;
  /** Quiz option answered per quiz scene (scene id -> option id). */
  readonly answers: Readonly<Record<string, string>>;
  /** Next was pressed on the last scene. */
  readonly done: boolean;
}

const initialState: LessonState = {
  status: 'idle',
  lesson: null,
  sceneIndex: 0,
  picks: {},
  answers: {},
  done: false,
};

/**
 * Feature state for the lesson being played. Provided per lesson route, so leaving the page
 * drops it. No server and no persistence yet.
 */
export const LessonStore = signalStore(
  withState(initialState),
  withComputed(({ lesson, sceneIndex, picks, answers }) => {
    const scene = computed<Scene | null>(() => lesson()?.scenes[sceneIndex()] ?? null);
    return {
      scene,
      sceneNumber: computed(() => sceneIndex() + 1),
      sceneCount: computed(() => lesson()?.scenes.length ?? 0),
      isFirst: computed(() => sceneIndex() === 0),
      isLast: computed(() => {
        const l = lesson();
        return !!l && sceneIndex() === l.scenes.length - 1;
      }),
      /** On an interact scene: the picked choice, or the first one (it is pre-picked). */
      pickedChoice: computed<Choice | null>(() => {
        const s = scene();
        if (s?.type !== 'interact') return null;
        return pickedIn(s, picks()[s.id]);
      }),
      /** On a quiz scene: the last option answered, if any. */
      answeredOption: computed<QuizOption | null>(() => {
        const s = scene();
        if (s?.type !== 'quiz') return null;
        return answeredIn(s, answers()[s.id]);
      }),
    };
  }),
  withMethods(
    (
      store,
      course = inject(CourseStore),
      source = inject(LESSON_SOURCE),
      tasks = inject(PendingTasks),
      preloader = inject(LessonPreloader),
    ) => ({
      async load(id: string): Promise<void> {
        if (store.lesson()?.id === id && store.status() === 'ready') return;
        // Already loaded (the route resolver): ready at once, with no 'loading' render in between.
        const preloaded = preloader.get(id);
        if (preloaded) {
          patchState(store, { ...initialState, status: 'ready', lesson: preloaded });
          return;
        }
        const loader = source.loaders[id];
        if (!loader) {
          patchState(store, { ...initialState, status: 'missing' });
          return;
        }
        patchState(store, { ...initialState, status: 'loading' });
        // A pending task: the app is not 'stable' until the lesson is in (tests, SSR, hydration).
        await tasks.run(async () => {
          const lesson = await loader();
          patchState(store, { ...initialState, status: 'ready', lesson });
        });
      },
      next(): void {
        if (store.done() || !store.lesson()) return;
        if (store.isLast()) {
          patchState(store, { done: true });
          const id = store.lesson()?.id;
          if (id) course.markFinished(id);
        } else {
          patchState(store, (s) => ({ sceneIndex: s.sceneIndex + 1 }));
        }
      },
      back(): void {
        if (store.done()) {
          patchState(store, { done: false }); // back from the "done" card to the last scene
        } else if (!store.isFirst()) {
          patchState(store, (s) => ({ sceneIndex: s.sceneIndex - 1 }));
        }
      },
      pick(choiceId: string): void {
        const s = store.scene();
        if (s?.type !== 'interact' || !s.choices.some((c) => c.id === choiceId)) return;
        patchState(store, (st) => ({ picks: { ...st.picks, [s.id]: choiceId } }));
      },
      answer(optionId: string): void {
        const s = store.scene();
        if (s?.type !== 'quiz' || !s.options.some((o) => o.id === optionId)) return;
        patchState(store, (st) => ({ answers: { ...st.answers, [s.id]: optionId } }));
      },
      restart(): void {
        patchState(store, { sceneIndex: 0, picks: {}, answers: {}, done: false });
      },
    }),
  ),
);

export type LessonStore = InstanceType<typeof LessonStore>;

function pickedIn(scene: InteractScene, id: string | undefined): Choice | null {
  return scene.choices.find((c) => c.id === id) ?? scene.choices[0] ?? null;
}

function answeredIn(scene: QuizScene, id: string | undefined): QuizOption | null {
  return scene.options.find((o) => o.id === id) ?? null;
}
