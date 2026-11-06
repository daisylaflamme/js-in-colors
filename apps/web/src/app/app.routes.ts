import type { Route } from '@angular/router';
import { lessonExistsGuard, lessonPreloadResolver, lessonTitleResolver } from './lessons/lesson-routing';

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
    resolve: { lessonPreloaded: lessonPreloadResolver },
    loadComponent: () => import('./lesson/lesson-page').then((m) => m.LessonPage),
  },
  {
    path: 'certificate',
    title: 'Your certificate',
    data: { shell: 'full' } satisfies ShellRouteData,
    loadComponent: () => import('./certificate/certificate-page').then((m) => m.CertificatePage),
  },
  {
    path: 'ask-dot',
    title: 'Ask Dot',
    data: { shell: 'full' } satisfies ShellRouteData,
    loadComponent: () => import('./ask-dot/ask-dot-page').then((m) => m.AskDotPage),
  },
  {
    path: 'not-found',
    title: 'Page not found',
    loadComponent: () => import('./not-found/not-found-page').then((m) => m.NotFoundPage),
  },
  { path: '**', redirectTo: 'not-found' },
];
