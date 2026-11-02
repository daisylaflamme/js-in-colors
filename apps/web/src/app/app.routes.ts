import type { Route } from '@angular/router';
import { DEFAULT_LESSON_ID } from './lessons/lesson-catalog';
import { lessonExistsGuard, lessonTitleResolver } from './lessons/lesson-routing';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: `lesson/${DEFAULT_LESSON_ID}` },
  {
    path: 'lesson/:lessonId',
    canMatch: [lessonExistsGuard],
    title: lessonTitleResolver,
    loadComponent: () => import('./lesson/lesson-page').then((m) => m.LessonPage),
  },
  {
    path: 'not-found',
    title: 'Page not found',
    loadComponent: () => import('./not-found/not-found-page').then((m) => m.NotFoundPage),
  },
  { path: '**', redirectTo: 'not-found' },
];
