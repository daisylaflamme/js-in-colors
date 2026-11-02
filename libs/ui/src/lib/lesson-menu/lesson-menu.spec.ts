import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LessonMenuComponent, type LessonMenuItem } from './lesson-menu';

const LESSONS: LessonMenuItem[] = [
  {
    id: 'hello',
    title: 'Hello, JavaScript!',
    subtitle: 'Introduction',
    concept: 'array',
    link: '/lesson/hello',
    finished: true,
  },
  {
    id: 'output',
    title: 'Say it out loud',
    subtitle: 'Output',
    concept: 'string',
    link: '/lesson/output',
    finished: true,
  },
  {
    id: 'variables',
    title: 'Variables',
    subtitle: 'Variables',
    concept: 'variable',
    link: '/lesson/variables',
    finished: false,
  },
  {
    id: 'types',
    title: 'Numbers, words, yes/no',
    subtitle: 'Data types',
    concept: 'number',
    link: '/lesson/types',
    finished: false,
  },
];

describe('LessonMenuComponent', () => {
  async function setup(
    inputs: Partial<Record<'currentId' | 'resumeCode' | 'closable' | 'compact', unknown>> = {},
  ) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LessonMenuComponent);
    fixture.componentRef.setInput('lessons', LESSONS);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('lists every lesson inside a labelled nav', async () => {
    const { el } = await setup();
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Lessons');
    expect(el.querySelectorAll('nav li')).toHaveLength(4);
  });

  it('marks the current lesson with aria-current and "You are here"', async () => {
    const { el } = await setup({ currentId: 'variables' });
    const current = el.querySelectorAll('a[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toContain('Variables');
    expect(current[0].textContent).toContain('You are here');
  });

  it('says "finished" in text, not only with a green check', async () => {
    const { el } = await setup();
    const links = el.querySelectorAll('nav a');
    expect(links[0].textContent).toContain('(finished)');
    expect(links[2].textContent).not.toContain('(finished)');
  });

  it('exposes progress as a progressbar', async () => {
    const { el } = await setup();
    const bar = el.querySelector('[role="progressbar"]');
    expect(bar?.getAttribute('aria-valuenow')).toBe('2');
    expect(bar?.getAttribute('aria-valuemax')).toBe('4');
    expect(bar?.getAttribute('aria-valuetext')).toBe('2 of 4 lessons finished');
  });

  it('only shows the close button when closable, and emits closeRequested', async () => {
    const { el: plain } = await setup();
    expect(plain.querySelector('button.close')).toBeNull();

    TestBed.resetTestingModule();
    const { fixture, el } = await setup({ closable: true });
    const spy = vi.fn();
    fixture.componentInstance.closeRequested.subscribe(spy);
    el.querySelector<HTMLButtonElement>('button.close')?.click();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('shows the resume code', async () => {
    const { el } = await setup({ resumeCode: 'blue-fox-42' });
    expect(el.querySelector('.code')?.textContent).toBe('blue-fox-42');
  });
});
