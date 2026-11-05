import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import {
  initialSettings,
  memoryProgressStorage,
  provideSettings,
  SETTINGS_STORAGE,
  type SettingsState,
} from '@jic/data-access';
import { HomePage } from './home-page';

const saved = (finishedIds: string[], lastLessonId: string | null) => ({
  v: 1,
  resumeCode: 'brave-otter-37',
  finishedIds,
  lastLessonId,
});

/** Uses the real course from content/ (hello, output, variables are ready). */
async function setup(progress: unknown = null, clipboard?: { writeText: (t: string) => Promise<void> }) {
  const written: SettingsState[] = [];
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      memoryProgressStorage(progress).provider,
      provideStore(),
      provideSettings(),
      {
        provide: SETTINGS_STORAGE,
        useValue: { read: () => initialSettings, write: (s: SettingsState) => written.push(s) },
      },
    ],
  });
  vi.stubGlobal('navigator', { ...navigator, clipboard });
  const fixture = TestBed.createComponent(HomePage);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const text = (selector: string) => el.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  return { fixture, el, text, written };
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('data-motion');
  document.documentElement.removeAttribute('data-text-size');
});

describe('HomePage', () => {
  it('greets a new visitor and offers to start with the first lesson', async () => {
    const { el, text } = await setup();
    expect(text('h1')).toBe('Hi, explorer!');
    expect(text('.continue')).toBe('Start: Hello, JavaScript!');
    expect(el.querySelector('.continue')?.getAttribute('href')).toBe('/lesson/hello');
    expect(el.querySelector('[aria-current="step"]')?.getAttribute('href')).toBe('/lesson/hello');
  });

  it('welcomes back with a count and continues where the child left off', async () => {
    const { el, text } = await setup(saved(['hello', 'output'], 'output'));
    expect(text('h1')).toBe('Welcome back, explorer!');
    expect(text('.lead')).toBe('You opened 2 jars of knowledge. Ready for the next one?');
    expect(text('.continue')).toBe('Continue: Variables');
    expect(el.querySelectorAll('[data-state="finished"]')).toHaveLength(2);
    expect(el.querySelector('[data-state="current"] a')?.getAttribute('href')).toBe('/lesson/variables');
    expect(el.querySelector('[data-state="current"] jic-dot-character')).not.toBeNull();
  });

  it('continues an unfinished lesson that was opened last', async () => {
    const { text } = await setup(saved(['hello'], 'variables'));
    expect(text('.lead')).toBe('You opened 1 jar of knowledge. Ready for the next one?');
    expect(text('.continue')).toBe('Continue: Variables');
  });

  it('offers a visit again when every ready lesson is finished', async () => {
    const { text } = await setup(
      saved(
        [
          'hello',
          'output',
          'variables',
          'data-types',
          'functions',
          'conditions',
          'loops',
          'arrays',
          'objects',
        ],
        'objects',
      ),
    );
    expect(text('.continue')).toBe('Visit again: Hello, JavaScript!');
    expect(text('.lead')).toBe('You opened every jar so far. More lessons are coming soon!');
  });

  it('shows the whole course on the path, then the certificate', async () => {
    const { el, text } = await setup();
    expect(el.querySelectorAll('jic-color-path li')).toHaveLength(11);
    expect(text('jic-color-path li:last-child')).toBe('Your certificate!, Finish all 10');
    expect(el.querySelectorAll('[data-state="soon"]')).toHaveLength(1);
  });

  it('copies the resume code and says so', async () => {
    const writeText = vi.fn(async () => undefined);
    const { fixture, el, text } = await setup(saved([], null), { writeText });
    expect(text('jic-resume-code-pill code')).toBe('brave-otter-37');
    el.querySelector<HTMLButtonElement>('jic-resume-code-pill button')?.click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith('brave-otter-37');
    expect(text('jic-resume-code-pill [role="status"]')).toBe('Copied!');
  });

  it('asks the child to select the code when copying is not possible', async () => {
    const { fixture, el, text } = await setup(saved([], null), undefined);
    el.querySelector<HTMLButtonElement>('jic-resume-code-pill button')?.click();
    await fixture.whenStable();
    expect(text('jic-resume-code-pill [role="status"]')).toBe(
      'Copy did not work. Tap the code to select it.',
    );
  });

  it('toggles Calm motion and steps through text sizes, saving each change', async () => {
    const { fixture, el, written, text } = await setup();
    const [calm, size] = el.querySelectorAll<HTMLButtonElement>('button[jic-setting-toggle]');
    expect(calm.getAttribute('aria-pressed')).toBe('false');
    expect(size.textContent?.replace(/\s+/g, ' ').trim()).toBe('Text size: Normal');

    calm.click();
    size.click();
    await fixture.whenStable();
    expect(calm.getAttribute('aria-pressed')).toBe('true');
    expect(size.textContent?.replace(/\s+/g, ' ').trim()).toBe('Text size: Bigger');
    expect(text('.settings-status')).toBe('Text size: Bigger');
    expect(document.documentElement.getAttribute('data-motion')).toBe('calm');
    expect(document.documentElement.getAttribute('data-text-size')).toBe('large');
    expect(written.at(-1)).toEqual({ calmMotion: true, textSize: 'large' });
  });
});
