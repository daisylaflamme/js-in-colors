import { TestBed } from '@angular/core/testing';
import { LESSON_SOURCE, memoryProgressStorage, type LessonSource } from '@jic/data-access';
import { provideRouter } from '@angular/router';
import { LessonPage } from './lesson-page';

/** These tests use the real lessons compiled from content/ (Variables, Hello), unless given a source. */
describe('LessonPage', () => {
  async function setup(lessonId: string, source?: LessonSource) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        memoryProgressStorage().provider,
        ...(source ? [{ provide: LESSON_SOURCE, useValue: source }] : []),
      ],
    });
    const fixture = TestBed.createComponent(LessonPage);
    fixture.componentRef.setInput('lessonId', lessonId);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable(); // waits for the lazy lesson (a pending task in the store)
    const el = fixture.nativeElement as HTMLElement;
    const click = async (selector: string, text?: string) => {
      const target = Array.from(el.querySelectorAll<HTMLElement>(selector)).find(
        (b) => text === undefined || b.textContent?.includes(text),
      );
      if (!target) throw new Error(`No ${selector} ${text ?? ''}`);
      target.click();
      await fixture.whenStable();
    };
    const next = () => click('jic-scene-nav .next');
    return { fixture, el, click, next };
  }

  it('shows the lesson from data: title, lead, chips, first scene and scene count', async () => {
    const { el } = await setup('variables');
    expect(el.querySelector('h1')?.textContent).toBe('Variables');
    expect(el.querySelector('.lead')?.textContent).toContain('A variable is a');
    expect(el.querySelectorAll('jic-concept-chip')).toHaveLength(6);
    expect(el.querySelector('.bubble')?.textContent).toBe('This is a jar. A jar can hold one thing.');
    expect(el.querySelector('jic-scene-nav .label')?.textContent).toBe('Scene 1 of 5');
    expect(el.querySelector('[role="status"].u-visually-hidden')?.textContent).toBe('Scene 1 of 5');
  });

  it('walks the scenes: pick updates picture, bubble and code; quiz is kind; Finish shows the done card', async () => {
    const { el, click, next } = await setup('variables');
    await next();
    await next(); // scene 3: fill the jar
    expect(el.querySelector('jic-scene-host')?.getAttribute('data-scene-type')).toBe('interact');
    await click('button[jic-choice-button]', 'Emma');
    await click('button[jic-code-peek-toggle]');
    expect(el.querySelector('.bubble')?.textContent).toBe('My favorite is Emma!');
    expect(el.querySelector('jic-jar-visual .value-text')?.textContent).toBe('Emma');
    expect(el.querySelector('jic-code-panel code')?.textContent).toBe('let favorite = "Emma";');

    await next();
    await next(); // scene 5: quiz
    expect(el.querySelector('jic-scene-nav .next')?.textContent?.trim()).toBe('Finish');
    await click('button[jic-choice-button]', '7');
    expect(el.querySelector('jic-quiz-feedback')?.textContent).toContain('Not quite. 7 is inside the jar.');
    await click('button[jic-choice-button]', 'favorite');
    expect(el.querySelector('jic-quiz-feedback')?.textContent).toContain('Yes! favorite is the name');

    await next(); // Finish
    expect(el.querySelector('jic-lesson-done-card h2')?.textContent).toBe('You finished Variables!');
    expect(document.activeElement?.tagName).toBe('H2');
    expect(el.querySelector('jic-lesson-done-card button.next')?.textContent?.trim()).toBe(
      'Next lesson: Numbers, words, yes/no',
    );
  });

  it('remembers a pick when going Back and forth', async () => {
    const { el, click, next } = await setup('variables');
    await next();
    await next();
    await click('button[jic-choice-button]', 'yes!');
    await click('jic-scene-nav .back');
    await next();
    expect(el.querySelector('.bubble')?.textContent).toBe('My favorite is yes!');
  });

  it('offers the next ready lesson when one exists', async () => {
    const { el, next } = await setup('hello');
    for (let i = 0; i < 4; i++) await next();
    expect(el.querySelector('jic-lesson-done-card button.next')?.textContent).toContain(
      'Next lesson: Say it out loud',
    );
  });

  it('takes Tip and Library from the lesson data', async () => {
    const { el, click } = await setup('variables');
    expect(el.querySelector('dialog.tip')?.textContent).toContain('Jars can hold numbers, words, and more!');
    await click('jic-help-tabs button.library');
    expect(el.querySelector('jic-library-content h3')?.textContent).toBe('All about variables');
  });

  it('keeps a Tip opened while the lesson is still loading (regression)', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), memoryProgressStorage().provider] });
    const fixture = TestBed.createComponent(LessonPage);
    fixture.componentRef.setInput('lessonId', 'variables');
    fixture.detectChanges(); // first render; the lesson is still loading
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('jic-help-tabs button.tip')?.click();
    await fixture.whenStable(); // the lesson arrives
    expect(el.querySelector('dialog.tip')?.hasAttribute('open')).toBe(true);
  });

  it('shows an honest coming-soon scene for lessons without content yet', async () => {
    // Every real lesson is ready, so this one is made up.
    const { el } = await setup('later', {
      course: {
        lessons: [{ id: 'later', title: 'Page magic', topic: 'The DOM', concept: 'html', status: 'soon' }],
      },
      loaders: {},
    });
    expect(el.querySelector('h1')?.textContent).toBe('Page magic');
    expect(el.querySelector('.lead')?.textContent).toContain('coming soon');
    expect(el.querySelector('jic-scene-host')).toBeNull();
    expect(el.querySelector('jic-library-panel')?.textContent).toContain('Page magic is coming soon');
  });
});
