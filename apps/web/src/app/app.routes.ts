import type { Route } from '@angular/router';
import { lessonExistsGuard, lessonTitleResolver } from './lessons/lesson-routing';

/** Route data `shell: 'full'`: the page draws its own header, so the shell shows no lesson menu. */
export interface ShellRouteData {
  readonly shell?: 'full';
}

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Your color path',
    data: { shell: 'full' } satisfies ShellRouteData,
    loadComponent: () => import('./home/home-page').then((m) => m.HomePage),
  },
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
