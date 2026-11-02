import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { App } from './app';
import { AppTitleStrategy } from './app-title.strategy';
import { appRoutes } from './app.routes';

describe('App shell', () => {
  async function setup(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(appRoutes, withComponentInputBinding()),
        { provide: TitleStrategy, useClass: AppTitleStrategy },
      ],
    });
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('redirects / to the default lesson and renders it lazily', async () => {
    const { el } = await setup('/');
    expect(TestBed.inject(Router).url).toBe('/lesson/variables');
    expect(el.querySelector('main h1')?.textContent).toBe('Variables');
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
