import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { memoryProgressStorage } from '@jic/data-access';
import { App } from './app';
import { AppTitleStrategy } from './app-title.strategy';
import { appRoutes } from './app.routes';

describe('App shell', () => {
  async function setup(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(appRoutes, withComponentInputBinding()),
        { provide: TitleStrategy, useClass: AppTitleStrategy },
        memoryProgressStorage().provider,
      ],
    });
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('redirects / to the first ready lesson and renders it lazily', async () => {
    const { el } = await setup('/');
    expect(TestBed.inject(Router).url).toBe('/lesson/hello');
    expect(el.querySelector('main h1')?.textContent).toBe('Hello, JavaScript!');
  });

  it('builds the menu from the course: 10 lessons, 7 coming soon, none finished yet', async () => {
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
    expect(Array.from(links).filter((a) => a.textContent?.includes('Coming soon'))).toHaveLength(7);
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
