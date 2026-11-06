import {
  type ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideStore } from '@ngrx/store';
import { provideSettings } from '@jic/data-access';
import { AppTitleStrategy } from './app-title.strategy';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Zoneless is the default in Angular 22; stated explicitly so the choice is visible.
    provideZonelessChangeDetection(),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    // Pages are prerendered at build time (ADR 0014): reuse that HTML, and replay taps made before start-up.
    provideClientHydration(withEventReplay()),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    // Classic NgRx for cross-cutting state (ADR 0002): today the global settings.
    provideStore(),
    provideSettings(),
  ],
};
