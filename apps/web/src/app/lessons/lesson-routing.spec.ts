import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  Router,
  type UrlSegment,
} from '@angular/router';
import { lessonExistsGuard, lessonTitleResolver } from './lesson-routing';

describe('lesson routing', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  const segments = (...paths: string[]) => paths.map((path) => ({ path }) as UrlSegment);
  const runGuard = (...paths: string[]) =>
    TestBed.runInInjectionContext(() => lessonExistsGuard({}, segments(...paths), {} as never));

  it('matches a lesson that exists', () => {
    expect(runGuard('lesson', 'variables')).toBe(true);
  });

  it('sends an unknown lesson to /not-found', () => {
    const result = runGuard('lesson', 'banana');
    expect(TestBed.inject(Router).serializeUrl(result as never)).toBe('/not-found');
  });

  it('resolves the lesson title for the page title', () => {
    const route = { paramMap: convertToParamMap({ lessonId: 'functions' }) } as ActivatedRouteSnapshot;
    const title = TestBed.runInInjectionContext(() => lessonTitleResolver(route, {} as never));
    expect(title).toBe('Magic machines');
  });
});
