import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { CourseLesson } from '@jic/shared';
import { LESSON_SOURCE } from './lesson-source';
import { withProgress } from './progress/with-progress';

interface CourseState {
  readonly lessons: readonly CourseLesson[];
}

/**
 * Feature state for the whole course: the lesson list (menu, routing, Home) and the child's
 * progress, saved on this device (withProgress, ADR 0008). Root-provided because the menu,
 * Home and every lesson page share it.
 */
export const CourseStore = signalStore(
  { providedIn: 'root' },
  withState<CourseState>(() => ({ lessons: inject(LESSON_SOURCE).course.lessons })),
  withComputed(({ lessons }) => ({
    readyLessons: computed(() => lessons().filter((l) => l.status === 'ready')),
    firstReadyId: computed(() => lessons().find((l) => l.status === 'ready')?.id),
  })),
  withMethods((store) => ({
    find(id: string | null | undefined): CourseLesson | undefined {
      return store.lessons().find((l) => l.id === id);
    },
    /** 1-based position in the course, or 0 if unknown. */
    position(id: string): number {
      return store.lessons().findIndex((l) => l.id === id) + 1;
    },
    /** The next lesson that is ready, after `id`. */
    nextReadyAfter(id: string): CourseLesson | undefined {
      const lessons = store.lessons();
      const from = lessons.findIndex((l) => l.id === id);
      return lessons.slice(from + 1).find((l) => l.status === 'ready');
    },
  })),
  withProgress(),
);

export type CourseStore = InstanceType<typeof CourseStore>;
