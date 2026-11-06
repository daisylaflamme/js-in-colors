import { inject } from '@angular/core';
import { RenderMode, type ServerRoute } from '@angular/ssr';
import { LESSON_SOURCE } from '@jic/data-access';

/** Every course lesson (ready or coming soon), the same list lessonExistsGuard accepts. */
export function lessonPrerenderParams(): { lessonId: string }[] {
  return inject(LESSON_SOURCE).course.lessons.map((l) => ({ lessonId: l.id }));
}

/**
 * Every page is written as HTML at build time (ADR 0014): a static site, no server at runtime.
 * A new lesson in content/ is prerendered with no change here.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'lesson/:lessonId',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => lessonPrerenderParams(),
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
