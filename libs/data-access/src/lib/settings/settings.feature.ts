import { createActionGroup, createFeature, createReducer, emptyProps, on, props } from '@ngrx/store';

export const TEXT_SIZES = ['normal', 'large', 'larger'] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

/** App-wide settings (ADR 0002: cross-cutting state lives in the classic Store). */
export interface SettingsState {
  /** In-app "Calm motion". Adds calm on top of the device's reduced-motion setting, never removes it. */
  readonly calmMotion: boolean;
  readonly textSize: TextSize;
}

export const initialSettings: SettingsState = { calmMotion: false, textSize: 'normal' };

export const SettingsActions = createActionGroup({
  source: 'Settings',
  events: {
    /** Saved settings were read on start (or defaults, if there were none). */
    Loaded: props<{ settings: SettingsState }>(),
    'Calm Motion Toggled': emptyProps(),
    'Text Size Changed': props<{ textSize: TextSize }>(),
  },
});

/** The next step of the Text size button: normal → large → larger → normal. */
export function nextTextSize(size: TextSize): TextSize {
  return TEXT_SIZES[(TEXT_SIZES.indexOf(size) + 1) % TEXT_SIZES.length];
}

export const settingsFeature = createFeature({
  name: 'settings',
  reducer: createReducer(
    initialSettings,
    on(SettingsActions.loaded, (_state, { settings }) => settings),
    on(SettingsActions.calmMotionToggled, (state) => ({ ...state, calmMotion: !state.calmMotion })),
    on(SettingsActions.textSizeChanged, (state, { textSize }) => ({ ...state, textSize })),
  ),
});

export const { selectSettingsState, selectCalmMotion, selectTextSize } = settingsFeature;
