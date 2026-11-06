import { isPlatformServer } from '@angular/common';
import { computed, inject, PLATFORM_ID } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  type,
  watchState,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { createResumeCode, type CourseLesson } from '@jic/shared';
import { parseProgress, PROGRESS_STORAGE } from './progress-storage';

export interface ProgressState {
  /** Shown on Home and in the menu. A key for the sync milestone; restores nothing yet (ADR 0008). */
  readonly resumeCode: string;
  readonly finishedIds: readonly string[];
  /** The last ready lesson the child opened. */
  readonly lastLessonId: string | null;
}

/** How a lesson looks on the color path. */
export type PathState = 'finished' | 'current' | 'todo' | 'soon';

export interface PathLesson extends CourseLesson {
  readonly state: PathState;
}

/**
 * Progress on this device, for a store that has `lessons`: loaded on init (or started fresh with
 * a new resume code) and saved after every change. Storage failures only mean "not remembered".
 */
export function withProgress() {
  return signalStoreFeature(
    { state: type<{ lessons: readonly CourseLesson[] }>() },
    withState<ProgressState>({ resumeCode: '', finishedIds: [], lastLessonId: null }),
    withComputed(({ lessons, finishedIds, lastLessonId }) => {
      const continueLesson = computed<CourseLesson | undefined>(() => {
        const all = lessons();
        const done = new Set(finishedIds());
        const open = (l: CourseLesson) => l.status === 'ready' && !done.has(l.id);
        const lastIndex = all.findIndex((l) => l.id === lastLessonId());
        if (lastIndex >= 0 && open(all[lastIndex])) return all[lastIndex];
        return all.slice(lastIndex + 1).find(open) ?? all.slice(0, lastIndex + 1).find(open);
      });
      return {
        continueLesson,
        /** Nothing opened and nothing finished yet: Home says "Start" instead of "Continue". */
        isNewVisitor: computed(() => finishedIds().length === 0 && lastLessonId() === null),
        finishedCount: computed(() => finishedIds().length),
        /** Every lesson in the course is finished, so the certificate is earned (ADR 0010). */
        certificateEarned: computed(() => {
          const done = new Set(finishedIds());
          return lessons().length > 0 && lessons().every((l) => done.has(l.id));
        }),
        pathLessons: computed<readonly PathLesson[]>(() => {
          const done = new Set(finishedIds());
          const current = continueLesson()?.id;
          return lessons().map((l) => ({
            ...l,
            state: done.has(l.id)
              ? 'finished'
              : l.id === current
                ? 'current'
                : l.status === 'soon'
                  ? 'soon'
                  : 'todo',
          }));
        }),
      };
    }),
    withMethods((store) => ({
      isFinished(id: string): boolean {
        return store.finishedIds().includes(id);
      },
      markFinished(id: string): void {
        if (store.finishedIds().includes(id)) return;
        patchState(store, (s) => ({ finishedIds: [...s.finishedIds, id] }));
      },
      /** Remember the lesson the child is in, so Home can offer to continue it. */
      markOpened(id: string): void {
        const lesson = store.lessons().find((l) => l.id === id);
        if (lesson?.status !== 'ready' || store.lastLessonId() === id) return;
        patchState(store, { lastLessonId: id });
      },
    })),
    withHooks({
      onInit(store) {
        // Prerendering (ADR 0014): no device, so no progress and no resume code. A code made here
        // would be baked into the HTML and shown to every visitor until the app starts.
        if (isPlatformServer(inject(PLATFORM_ID))) return;
        const storage = inject(PROGRESS_STORAGE);
        const saved = parseProgress(
          storage.read(),
          store.lessons().map((l) => l.id),
        );
        patchState(store, saved ?? { resumeCode: createResumeCode(), finishedIds: [], lastLessonId: null });
        // watchState runs now and synchronously after every patch, so a new code is saved at once.
        watchState(store, ({ resumeCode, finishedIds, lastLessonId }) =>
          storage.write({ resumeCode, finishedIds, lastLessonId }),
        );
      },
    }),
  );
}
