import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { CourseLesson } from '@jic/shared';
import { LESSON_SOURCE } from './lesson-source';

interface CourseState {
  readonly lessons: readonly CourseLesson[];
  /** Finished in this visit. In memory only: persistence is a later milestone (ADR 0001). */
  readonly finishedIds: readonly string[];
}

/**
 * Feature state for the whole course: the lesson list (menu, routing) and what is finished.
 * Root-provided because the menu and every lesson page share it.
 */
export const CourseStore = signalStore(
  { providedIn: 'root' },
  withState<CourseState>(() => ({ lessons: inject(LESSON_SOURCE).course.lessons, finishedIds: [] })),
  withComputed(({ lessons, finishedIds }) => ({
    readyLessons: computed(() => lessons().filter((l) => l.status === 'ready')),
    firstReadyId: computed(() => lessons().find((l) => l.status === 'ready')?.id),
    finishedCount: computed(() => finishedIds().length),
  })),
  withMethods((store) => ({
    find(id: string | null | undefined): CourseLesson | undefined {
      return store.lessons().find((l) => l.id === id);
    },
    /** 1-based position in the course, or 0 if unknown. */
    position(id: string): number {
      return store.lessons().findIndex((l) => l.id === id) + 1;
    },
    isFinished(id: string): boolean {
      return store.finishedIds().includes(id);
    },
    /** The next lesson that is ready, after `id`. */
    nextReadyAfter(id: string): CourseLesson | undefined {
      const lessons = store.lessons();
      const from = lessons.findIndex((l) => l.id === id);
      return lessons.slice(from + 1).find((l) => l.status === 'ready');
    },
    markFinished(id: string): void {
      if (store.finishedIds().includes(id)) return;
      patchState(store, (s) => ({ finishedIds: [...s.finishedIds, id] }));
    },
  })),
);

export type CourseStore = InstanceType<typeof CourseStore>;
