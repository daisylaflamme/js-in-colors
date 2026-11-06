import { inject } from '@angular/core';
import { type CanMatchFn, type ResolveFn, Router } from '@angular/router';
import { CourseStore, LessonPreloader } from '@jic/data-access';

/** Only match /lesson/:lessonId for lessons in the course (ready or coming soon); others go to /not-found. */
export const lessonExistsGuard: CanMatchFn = (_route, segments) => {
  const id = segments[1]?.path;
  return inject(CourseStore).find(id) ? true : inject(Router).parseUrl('/not-found');
};

/** Page title for a lesson route, e.g. "Variables". The TitleStrategy adds the app name. */
export const lessonTitleResolver: ResolveFn<string> = (route) =>
  inject(CourseStore).find(route.paramMap.get('lessonId'))?.title ?? 'Lesson';

/**
 * Loads the lesson file before the page starts (ADR 0014), so the page's first render has it: a
 * prerendered lesson hydrates without redrawing its stage. Resolves to nothing for coming-soon lessons.
 */
export const lessonPreloadResolver: ResolveFn<boolean> = async (route) =>
  Boolean(await inject(LessonPreloader).preload(route.paramMap.get('lessonId') ?? ''));
