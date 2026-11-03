import { DOCUMENT } from '@angular/common';
import { type EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { Actions, createEffect, ofType, provideEffects, ROOT_EFFECTS_INIT } from '@ngrx/effects';
import { provideState, Store } from '@ngrx/store';
import { distinctUntilChanged, map, tap, withLatestFrom } from 'rxjs';
import { SETTINGS_STORAGE } from './settings-storage';
import { SettingsActions, selectSettingsState, settingsFeature } from './settings.feature';

/** On start: read saved settings once and put them in the store. */
export const loadSettings = createEffect(
  (actions$ = inject(Actions), storage = inject(SETTINGS_STORAGE)) =>
    actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      map(() => SettingsActions.loaded({ settings: storage.read() })),
    ),
  { functional: true },
);

/** After the child changes a setting: save it on this device. */
export const persistSettings = createEffect(
  (actions$ = inject(Actions), store = inject(Store), storage = inject(SETTINGS_STORAGE)) =>
    actions$.pipe(
      ofType(SettingsActions.calmMotionToggled, SettingsActions.textSizeChanged),
      withLatestFrom(store.select(selectSettingsState)),
      tap(([, settings]) => storage.write(settings)),
    ),
  { functional: true, dispatch: false },
);

/** Settings take effect through attributes on <html>, read by styles/settings (_motion, _text-size). */
export const applySettingsToDocument = createEffect(
  (store = inject(Store), document = inject(DOCUMENT)) =>
    store.select(selectSettingsState).pipe(
      distinctUntilChanged(),
      tap(({ calmMotion, textSize }) => {
        const root = document.documentElement;
        if (calmMotion) root.setAttribute('data-motion', 'calm');
        else root.removeAttribute('data-motion');
        if (textSize === 'normal') root.removeAttribute('data-text-size');
        else root.setAttribute('data-text-size', textSize);
      }),
    ),
  { functional: true, dispatch: false },
);

/** The settings slice of the root store and its effects. Needs provideStore() and provideEffects(). */
export function provideSettings(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideState(settingsFeature),
    provideEffects({ loadSettings, persistSettings, applySettingsToDocument }),
  ]);
}
