import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngrx/store';
import { provideSettings } from './settings.effects';
import {
  localSettingsStorage,
  parseSettings,
  SETTINGS_KEY,
  SETTINGS_STORAGE,
  type SettingsStorage,
} from './settings-storage';
import {
  initialSettings,
  nextTextSize,
  selectCalmMotion,
  selectTextSize,
  SettingsActions,
  settingsFeature,
  type SettingsState,
} from './settings.feature';

describe('settings reducer', () => {
  const reduce = settingsFeature.reducer;

  it('toggles calm motion and sets the text size', () => {
    let state = reduce(undefined, SettingsActions.calmMotionToggled());
    expect(state).toEqual({ calmMotion: true, textSize: 'normal' });
    state = reduce(state, SettingsActions.textSizeChanged({ textSize: 'larger' }));
    expect(state.textSize).toBe('larger');
    expect(reduce(state, SettingsActions.calmMotionToggled()).calmMotion).toBe(false);
  });

  it('replaces everything when settings are loaded', () => {
    const settings: SettingsState = { calmMotion: true, textSize: 'large' };
    expect(reduce(initialSettings, SettingsActions.loaded({ settings }))).toEqual(settings);
  });

  it('cycles the text size normal → large → larger → normal', () => {
    expect(nextTextSize('normal')).toBe('large');
    expect(nextTextSize('large')).toBe('larger');
    expect(nextTextSize('larger')).toBe('normal');
  });
});

describe('settings storage', () => {
  it('falls back to the defaults for missing or broken values', () => {
    expect(parseSettings(null)).toEqual(initialSettings);
    expect(parseSettings({ calmMotion: 'yes', textSize: 'huge' })).toEqual(initialSettings);
    expect(parseSettings({ calmMotion: true, textSize: 'larger' })).toEqual({
      calmMotion: true,
      textSize: 'larger',
    });
  });

  it('round-trips through localStorage and survives bad JSON or blocked storage', () => {
    localStorage.clear();
    const storage = localSettingsStorage(localStorage);
    storage.write({ calmMotion: true, textSize: 'large' });
    expect(storage.read()).toEqual({ calmMotion: true, textSize: 'large' });

    localStorage.setItem(SETTINGS_KEY, '{oops');
    expect(storage.read()).toEqual(initialSettings);

    const blocked = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('SecurityError');
      },
    } as unknown as Storage;
    expect(localSettingsStorage(blocked).read()).toEqual(initialSettings);
    expect(() => localSettingsStorage(blocked).write(initialSettings)).not.toThrow();
  });
});

describe('settings effects', () => {
  function setup(saved: SettingsState) {
    const written: SettingsState[] = [];
    const storage: SettingsStorage = { read: () => saved, write: (s) => written.push(s) };
    TestBed.configureTestingModule({
      providers: [provideStore(), provideSettings(), { provide: SETTINGS_STORAGE, useValue: storage }],
    });
    const store = TestBed.inject(Store);
    const root = TestBed.inject(DOCUMENT).documentElement;
    return { store, root, written };
  }

  afterEach(() => {
    document.documentElement.removeAttribute('data-motion');
    document.documentElement.removeAttribute('data-text-size');
  });

  it('loads saved settings on start and applies them to <html>', () => {
    const { store, root, written } = setup({ calmMotion: true, textSize: 'larger' });
    expect(store.selectSignal(selectCalmMotion)()).toBe(true);
    expect(store.selectSignal(selectTextSize)()).toBe('larger');
    expect(root.getAttribute('data-motion')).toBe('calm');
    expect(root.getAttribute('data-text-size')).toBe('larger');
    expect(written).toEqual([]); // loading does not write back
  });

  it('saves and applies each change', () => {
    const { store, root, written } = setup(initialSettings);
    expect(root.hasAttribute('data-motion')).toBe(false);
    expect(root.hasAttribute('data-text-size')).toBe(false);

    store.dispatch(SettingsActions.calmMotionToggled());
    store.dispatch(SettingsActions.textSizeChanged({ textSize: 'large' }));
    expect(root.getAttribute('data-motion')).toBe('calm');
    expect(root.getAttribute('data-text-size')).toBe('large');

    store.dispatch(SettingsActions.calmMotionToggled());
    store.dispatch(SettingsActions.textSizeChanged({ textSize: 'normal' }));
    expect(root.hasAttribute('data-motion')).toBe(false);
    expect(root.hasAttribute('data-text-size')).toBe(false);
    expect(written).toEqual([
      { calmMotion: true, textSize: 'normal' },
      { calmMotion: true, textSize: 'large' },
      { calmMotion: false, textSize: 'large' },
      { calmMotion: false, textSize: 'normal' },
    ]);
  });
});
