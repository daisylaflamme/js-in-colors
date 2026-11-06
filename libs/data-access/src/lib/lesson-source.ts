import { inject, Injectable, InjectionToken } from '@angular/core';
import type { Course, Lesson } from '@jic/shared';
import { COURSE, LESSON_LOADERS } from '../generated';

/**
 * Where lessons come from. Today: modules compiled from content/ at build time (one lazy chunk
 * per lesson). A real API, if one ever comes, gets its own ADR (0015). Stores only see this interface, so swapping
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

/**
 * Lessons already loaded, by id. The lesson route's resolver fills it before the page starts, so
 * the page's first render already has its lesson. On a prerendered page (ADR 0014) that render
 * then matches the HTML, instead of dropping the stage while the lesson file loads and drawing it
 * again. At most one entry per lesson in the course.
 */
@Injectable({ providedIn: 'root' })
export class LessonPreloader {
  private readonly source = inject(LESSON_SOURCE);
  private readonly loaded = new Map<string, Lesson>();

  /** Loads the lesson once; undefined for a lesson without content (coming soon or unknown). */
  async preload(id: string): Promise<Lesson | undefined> {
    const cached = this.loaded.get(id);
    if (cached) return cached;
    const loader = this.source.loaders[id];
    if (!loader) return undefined;
    const lesson = await loader();
    this.loaded.set(id, lesson);
    return lesson;
  }

  /** The lesson if it has been loaded already, at once. */
  get(id: string): Lesson | undefined {
    return this.loaded.get(id);
  }
}
