import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { initialSettings, memoryProgressStorage, provideSettings, SETTINGS_STORAGE } from '@jic/data-access';
import { App } from './app';
import { AppTitleStrategy } from './app-title.strategy';
import { appRoutes } from './app.routes';

describe('App shell', () => {
  async function setup(url: string, progress: unknown = null) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(appRoutes, withComponentInputBinding()),
        { provide: TitleStrategy, useClass: AppTitleStrategy },
        memoryProgressStorage(progress).provider,
        provideStore(),
        provideSettings(),
        { provide: SETTINGS_STORAGE, useValue: { read: () => initialSettings, write: () => undefined } },
      ],
    });
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('opens Home at / without the lesson menu', async () => {
    const { el } = await setup('/');
    expect(TestBed.inject(Router).url).toBe('/');
    expect(el.querySelector('main h1')?.textContent).toBe('Hi, explorer!');
    expect(el.querySelector('jic-lesson-menu, jic-overlay-panel')).toBeNull();
    expect(TestBed.inject(Title).getTitle()).toBe('Your color path · JavaScript in Colors');
  });

  it('shows saved progress and the resume code in the lesson menu, with links home', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    const saved = { v: 1, resumeCode: 'brave-otter-37', finishedIds: ['hello'], lastLessonId: 'output' };
    const { el } = await setup('/lesson/output', saved);
    vi.unstubAllGlobals();
    expect(el.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('1');
    expect(el.querySelector('jic-lesson-menu .code')?.textContent).toBe('brave-otter-37');
    expect(el.querySelector('jic-lesson-menu .home-link')?.getAttribute('href')).toBe('/');
    expect(el.querySelector('jic-lesson-menu jic-app-logo a')?.getAttribute('href')).toBe('/');
  });

  it('builds the menu from the course: 10 lessons, 1 coming soon, none finished yet', async () => {
    // Desktop layout, so the menu is drawn inline (jsdom has no matchMedia of its own).
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    const { el } = await setup('/lesson/variables');
    vi.unstubAllGlobals();
    const links = el.querySelectorAll('nav[aria-label="Lessons"] a');
    expect(links).toHaveLength(10);
    expect(Array.from(links).filter((a) => a.textContent?.includes('Coming soon'))).toHaveLength(1);
    expect(el.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('0');
  });

  it('sets the page title with the app name', async () => {
    await setup('/lesson/functions');
    expect(TestBed.inject(Title).getTitle()).toBe('Magic machines · JavaScript in Colors');
  });

  it('shows the not-found page for an unknown lesson', async () => {
    const { el } = await setup('/lesson/banana');
    expect(TestBed.inject(Router).url).toBe('/not-found');
    expect(el.querySelector('h1')?.textContent).toBe('We could not find that page');
  });

  it('has a skip link that moves focus to main', async () => {
    const { el } = await setup('/');
    document.body.appendChild(el);
    el.querySelector<HTMLAnchorElement>('.skip-link')?.click();
    expect(document.activeElement?.id).toBe('main');
  });
});
