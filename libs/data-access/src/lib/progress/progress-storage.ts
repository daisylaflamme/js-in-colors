import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';
import { isResumeCode } from '@jic/shared';

/** What is saved on this device (ADR 0008). Never anything about the child. */
export interface SavedProgress {
  readonly resumeCode: string;
  readonly finishedIds: readonly string[];
  readonly lastLessonId: string | null;
}

/** Bump when the saved shape changes; older data is then ignored (a fresh start). */
export const PROGRESS_VERSION = 1;
export const PROGRESS_KEY = 'jic.progress';

/** Reads and writes progress. Storage can be missing or blocked: both methods must never throw. */
export interface ProgressStorage {
  read(): unknown;
  write(progress: SavedProgress): void;
}

export const PROGRESS_STORAGE = new InjectionToken<ProgressStorage>('ProgressStorage', {
  providedIn: 'root',
  factory: () => localProgressStorage(inject(DOCUMENT).defaultView?.localStorage),
});

/** localStorage, wrapped: private mode or strict settings can make every access throw. */
export function localProgressStorage(storage: Storage | undefined): ProgressStorage {
  return {
    read() {
      try {
        const raw = storage?.getItem(PROGRESS_KEY);
        return raw ? (JSON.parse(raw) as unknown) : null;
      } catch {
        return null;
      }
    },
    write(progress) {
      try {
        storage?.setItem(PROGRESS_KEY, JSON.stringify({ v: PROGRESS_VERSION, ...progress }));
      } catch {
        /* storage full or blocked: progress simply is not remembered */
      }
    },
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Turns whatever was in storage into progress we can trust, or null for a fresh start.
 * Lesson ids that are not in the course (renamed or removed lessons) are dropped.
 */
export function parseProgress(data: unknown, knownIds: readonly string[]): SavedProgress | null {
  if (!isRecord(data) || data['v'] !== PROGRESS_VERSION || !isResumeCode(data['resumeCode'])) return null;
  const known = new Set(knownIds);
  const finished = Array.isArray(data['finishedIds']) ? data['finishedIds'] : [];
  const finishedIds = [
    ...new Set(finished.filter((id): id is string => typeof id === 'string' && known.has(id))),
  ];
  const last = data['lastLessonId'];
  return {
    resumeCode: data['resumeCode'],
    finishedIds,
    lastLessonId: typeof last === 'string' && known.has(last) ? last : null,
  };
}
