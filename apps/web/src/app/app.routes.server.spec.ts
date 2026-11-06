import { TestBed } from '@angular/core/testing';
import { LESSON_SOURCE } from '@jic/data-access';
import { RenderMode } from '@angular/ssr';
import { lessonPrerenderParams, serverRoutes } from './app.routes.server';

describe('server routes (prerender, ADR 0014)', () => {
  it('prerenders every course lesson, ready or coming soon', () => {
    const ids = TestBed.inject(LESSON_SOURCE).course.lessons.map((l) => l.id);
    const params = TestBed.runInInjectionContext(() => lessonPrerenderParams());

    expect(params.map((p) => p.lessonId)).toEqual(ids);
    expect(ids).toContain('variables');
  });

  it('prerenders every route: nothing is left to a server at runtime', () => {
    expect(serverRoutes.every((r) => r.renderMode === RenderMode.Prerender)).toBe(true);
    expect(serverRoutes.at(-1)?.path).toBe('**');
  });
});
