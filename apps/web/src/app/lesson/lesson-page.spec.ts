import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LessonPage } from './lesson-page';

describe('LessonPage', () => {
  async function setup(lessonId = 'variables') {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LessonPage);
    fixture.componentRef.setInput('lessonId', lessonId);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const choice = (label: string) =>
      Array.from(el.querySelectorAll<HTMLButtonElement>('button[jic-choice-button]')).find((b) =>
        b.textContent?.includes(label),
      );
    return { fixture, el, choice };
  }

  it('picking a choice changes the bubble, the jar and the code together', async () => {
    const { fixture, el, choice } = await setup();
    expect(el.querySelector('.bubble')?.textContent).toBe('My favorite is 7!');

    choice('Emma')?.click();
    el.querySelector<HTMLButtonElement>('button[jic-code-peek-toggle]')?.click();
    await fixture.whenStable();

    expect(choice('Emma')?.getAttribute('aria-pressed')).toBe('true');
    expect(choice('7')?.getAttribute('aria-pressed')).toBe('false');
    expect(el.querySelector('.bubble')?.textContent).toBe('My favorite is Emma!');
    expect(el.querySelector('jic-jar-visual .value-text')?.textContent).toBe('Emma');
    expect(el.querySelector('#code-peek code')?.textContent).toBe('let favorite = "Emma";');
  });

  it('choices name their kind for screen readers, not just by color', async () => {
    const { choice } = await setup();
    expect(choice('yes!')?.textContent).toContain('(yes or no)');
  });

  it('Peek at the code is a disclosure for the code panel', async () => {
    const { fixture, el } = await setup();
    const peek = el.querySelector<HTMLButtonElement>('button[jic-code-peek-toggle]');
    expect(peek?.getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector('#code-peek')).toBeNull();

    peek?.click();
    await fixture.whenStable();

    expect(peek?.getAttribute('aria-expanded')).toBe('true');
    expect(peek?.getAttribute('aria-controls')).toBe('code-peek');
    expect(el.querySelector('#code-peek')).not.toBeNull();
  });

  it('Tip and Library are mutually exclusive', async () => {
    const { fixture, el } = await setup();
    const tipTab = el.querySelector<HTMLButtonElement>('jic-help-tabs button.tip');
    const libraryTab = el.querySelector<HTMLButtonElement>('jic-help-tabs button.library');
    const isOpen = (selector: string) => el.querySelector<HTMLDialogElement>(selector)?.hasAttribute('open');

    tipTab?.click();
    await fixture.whenStable();
    expect(isOpen('dialog.tip')).toBe(true);

    libraryTab?.click();
    await fixture.whenStable();
    expect(isOpen('dialog.tip')).toBe(false);
    expect(isOpen('dialog.library')).toBe(true);
    expect(libraryTab?.getAttribute('aria-expanded')).toBe('true');
    expect(tipTab?.getAttribute('aria-expanded')).toBe('false');
  });

  it('Back and Next move between scenes within bounds', async () => {
    const { fixture, el } = await setup();
    const label = () => el.querySelector('jic-scene-nav .label')?.textContent;
    const next = el.querySelector<HTMLButtonElement>('jic-scene-nav .next');
    expect(label()).toBe('Scene 3 of 5');

    for (let i = 0; i < 4; i++) next?.click();
    await fixture.whenStable();

    expect(label()).toBe('Scene 5 of 5');
  });

  it('shows an honest coming-soon scene for lessons without content yet', async () => {
    const { el } = await setup('loops');
    expect(el.querySelector('h1')?.textContent).toBe('Again and again');
    expect(el.querySelector('.lead')?.textContent).toContain('coming soon');
    expect(el.querySelector('button[jic-choice-button]')).toBeNull();
    expect(el.querySelector('jic-library-panel')?.textContent).toContain('Again and again is coming soon');
  });
});
