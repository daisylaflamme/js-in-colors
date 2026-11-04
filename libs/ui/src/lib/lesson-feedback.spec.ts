import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LessonDoneCardComponent } from './lesson-done/lesson-done-card';
import { QuizFeedbackComponent } from './quiz-feedback/quiz-feedback';
import { ReplayButtonComponent } from './replay-button/replay-button';

async function render<T>(type: new (...args: never[]) => T, inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(type);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('QuizFeedbackComponent', () => {
  it('is an empty polite live region until there is an answer', async () => {
    const { el } = await render(QuizFeedbackComponent);
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-live')).toBe('polite');
    expect(el.textContent?.trim()).toBe('');
  });

  it('shows the feedback with an icon that differs for right and try-again', async () => {
    const { fixture, el } = await render(QuizFeedbackComponent, { status: 'try-again', text: 'Not quite.' });
    expect(el.textContent?.trim()).toBe('Not quite.');
    expect(el.getAttribute('data-status')).toBe('try-again');
    const tryIcon = el.querySelector('jic-icon path')?.getAttribute('d');
    fixture.componentRef.setInput('status', 'correct');
    await fixture.whenStable();
    expect(el.querySelector('jic-icon path')?.getAttribute('d')).not.toBe(tryIcon);
  });
});

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReplayButtonComponent],
  template: `<button type="button" jic-replay-button></button>`,
})
class ReplayHost {}

describe('ReplayButtonComponent', () => {
  it('is a native button that says Play again', async () => {
    const { el } = await render(ReplayHost);
    const button = el.querySelector('button');
    expect(button?.type).toBe('button');
    expect(button?.textContent?.trim()).toBe('Play again');
  });
});

describe('LessonDoneCardComponent', () => {
  it('announces the lesson and moves focus to its heading', async () => {
    const { el } = await render(LessonDoneCardComponent, { lessonTitle: 'Variables', concept: 'variable' });
    const heading = el.querySelector('h2');
    expect(heading?.textContent).toBe('You finished Variables!');
    expect(document.activeElement).toBe(heading);
  });

  it('offers the next lesson only when there is one, and emits the actions', async () => {
    const { el: none } = await render(LessonDoneCardComponent, { lessonTitle: 'Variables' });
    expect(none.querySelector('button.next')).toBeNull();

    const { fixture, el } = await render(LessonDoneCardComponent, {
      lessonTitle: 'Hello',
      nextTitle: 'Say it out loud',
    });
    const spies = { nextLesson: vi.fn(), restart: vi.fn(), back: vi.fn() };
    fixture.componentInstance.nextLesson.subscribe(spies.nextLesson);
    fixture.componentInstance.restart.subscribe(spies.restart);
    fixture.componentInstance.back.subscribe(spies.back);
    expect(el.querySelector('button.next')?.textContent).toContain('Next lesson: Say it out loud');
    el.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.click());
    expect(spies.nextLesson).toHaveBeenCalledOnce();
    expect(spies.restart).toHaveBeenCalledOnce();
    expect(spies.back).toHaveBeenCalledOnce();
  });
});
