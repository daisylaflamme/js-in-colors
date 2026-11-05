import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent, type IconName } from '../icon/icon';

interface Rule {
  readonly icon: IconName;
  readonly concept: string;
  readonly text: string;
}

/** The four rules in mockup 09, each with its own icon and tint (the words carry the meaning). */
export const SAFE_CHAT_RULES: readonly Rule[] = [
  { icon: 'chat', concept: 'variable', text: 'Dot only talks about JavaScript.' },
  { icon: 'lock', concept: 'array', text: 'Your chat is not saved. When you leave, it disappears.' },
  { icon: 'no', concept: 'function', text: 'Please do not type your name or where you live.' },
  { icon: 'person', concept: 'boolean', text: 'If something feels odd, tell a grown-up.' },
];

/** "Dot's safe chat rules" (mockup 09), with an optional note under them (e.g. about demo mode). */
@Component({
  selector: 'jic-safe-rules-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'jic-safe-rules-card' },
  template: `
    <section class="card" [attr.aria-labelledby]="headingId()">
      <h2 [id]="headingId()">Dot's safe chat rules</h2>
      <ul>
        @for (rule of rules; track rule.icon) {
          <li>
            <span
              class="icon"
              [style.--tint]="'var(--color-' + rule.concept + '-tint)'"
              [style.--ink]="'var(--color-' + rule.concept + '-text)'"
            >
              <jic-icon [name]="rule.icon" [size]="20" />
            </span>
            <span>{{ rule.text }}</span>
          </li>
        }
      </ul>
      @if (note(); as text) {
        <p class="note">{{ text }}</p>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .card {
      display: grid;
      gap: var(--space-4);
      padding: var(--space-5);
      border-radius: var(--radius-card);
      background: var(--color-bg-raised);
      box-shadow: var(--shadow-stage);
    }
    h2 {
      margin: 0;
      font-size: 1.5rem;
    }
    ul {
      display: grid;
      gap: var(--space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: var(--space-3);
      align-items: start;
      font-weight: var(--font-weight-bold);
    }
    .icon {
      display: inline-grid;
      place-items: center;
      inline-size: 2.25rem;
      block-size: 2.25rem;
      border-radius: 50%;
      background: var(--tint);
      color: var(--ink);
    }
    .note {
      margin: 0;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-button);
      background: var(--color-bg-sunken);
      color: var(--color-text-muted);
      font-size: 0.9375rem;
      font-weight: var(--font-weight-bold);
    }
  `,
})
export class SafeRulesCardComponent {
  readonly note = input<string>();
  readonly headingId = input('safe-rules-title');
  protected readonly rules = SAFE_CHAT_RULES;
}
