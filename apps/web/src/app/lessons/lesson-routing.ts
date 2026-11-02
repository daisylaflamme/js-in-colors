import { inject } from '@angular/core';
import { type CanMatchFn, type ResolveFn, Router } from '@angular/router';
import { findLesson } from './lesson-catalog';

/** Only match /lesson/:lessonId for lessons that exist; anything else goes to the not-found page. */
export const lessonExistsGuard: CanMatchFn = (_route, segments) => {
  const id = segments[1]?.path;
  return findLesson(id) ? true : inject(Router).parseUrl('/not-found');
};

/** Page title for a lesson route, e.g. "Variables". The TitleStrategy adds the app name. */
export const lessonTitleResolver: ResolveFn<string> = (route) =>
  findLesson(route.paramMap.get('lessonId'))?.title ?? 'Lesson';
