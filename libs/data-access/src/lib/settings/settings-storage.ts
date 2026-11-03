import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';
import { initialSettings, type SettingsState, TEXT_SIZES, type TextSize } from './settings.feature';

export const SETTINGS_KEY = 'jic.settings';

/** Reads and writes settings. Both methods must never throw (storage can be blocked). */
export interface SettingsStorage {
  read(): SettingsState;
  write(settings: SettingsState): void;
}

export const SETTINGS_STORAGE = new InjectionToken<SettingsStorage>('SettingsStorage', {
  providedIn: 'root',
  factory: () => localSettingsStorage(inject(DOCUMENT).defaultView?.localStorage),
});

/** Anything readable becomes valid settings; unknown or broken values fall back to the defaults. */
export function parseSettings(data: unknown): SettingsState {
  if (typeof data !== 'object' || data === null) return initialSettings;
  const { calmMotion, textSize } = data as Partial<Record<keyof SettingsState, unknown>>;
  return {
    calmMotion: typeof calmMotion === 'boolean' ? calmMotion : initialSettings.calmMotion,
    textSize: TEXT_SIZES.includes(textSize as TextSize) ? (textSize as TextSize) : initialSettings.textSize,
  };
}

export function localSettingsStorage(storage: Storage | undefined): SettingsStorage {
  return {
    read() {
      try {
        const raw = storage?.getItem(SETTINGS_KEY);
        return parseSettings(raw ? JSON.parse(raw) : null);
      } catch {
        return initialSettings;
      }
    },
    write(settings) {
      try {
        storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch {
        /* blocked or full: the setting lasts for this visit only */
      }
    },
  };
}
