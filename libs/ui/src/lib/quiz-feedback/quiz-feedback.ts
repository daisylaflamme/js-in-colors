import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent, type IconName } from '../icon/icon';

export type QuizFeedbackStatus = 'correct' | 'try-again';

/**
 * Kind feedback after a quiz answer. Always rendered (empty until there is something to say)
 * because it is a polite live region: screen readers hear each new message.
 * Right and "try again" differ by icon, border style and the words of the feedback, never by color alone.
 * There is no "wrong": the child can simply try another answer.
 */
@Component({
  selector: 'jic-quiz-feedback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: {
    class: 'jic-quiz-feedback',
    role: 'status',
    'aria-live': 'polite',
    '[attr.data-status]': 'status()',
  },
  template: `
    @if (status()) {
      <div class="box">
        <jic-icon [name]="icon()" [size]="28" />
        <p>{{ text() }}</p>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .box {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-chip);
      background: var(--color-bg-raised);
      color: var(--color-text);
      font-size: var(--text-body);
      font-weight: var(--font-weight-bold);
    }
    :host([data-status='correct']) .box {
      border-color: var(--color-success);
      border-width: var(--border-width-heavy);
    }
    :host([data-status='correct']) jic-icon {
      color: var(--color-success);
    }
    :host([data-status='try-again']) .box {
      border-style: dashed;
    }
  `,
})
export class QuizFeedbackComponent {
  /** null = nothing answered yet (the live region stays in place, empty). */
  readonly status = input<QuizFeedbackStatus | null>(null);
  /** The option's kind feedback from the lesson. */
  readonly text = input('');

  protected readonly icon = computed<IconName>(() => (this.status() === 'correct' ? 'star' : 'retry'));
}
