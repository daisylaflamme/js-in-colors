import { InjectionToken } from '@angular/core';
import type { Course, Lesson } from '@jic/shared';
import { COURSE, LESSON_LOADERS } from '../generated';

/**
 * Where lessons come from. Today: modules compiled from content/ at build time (one lazy chunk
 * per lesson). Later: the GraphQL API (ADR 0003). Stores only see this interface, so swapping
 * the source never touches them; tests provide a fake.
 */
export interface LessonSource {
  readonly course: Course;
  readonly loaders: Readonly<Record<string, () => Promise<Lesson>>>;
}

export const LESSON_SOURCE = new InjectionToken<LessonSource>('LessonSource', {
  providedIn: 'root',
  factory: () => ({ course: COURSE, loaders: LESSON_LOADERS }),
});
