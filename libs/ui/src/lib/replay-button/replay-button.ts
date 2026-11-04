import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../icon/icon';

/** "Play again" for watch scenes. Use on a native button: <button type="button" jic-replay-button>. */
@Component({
  selector: 'button[jic-replay-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { type: 'button', class: 'jic-replay-button' },
  template: `<jic-icon name="retry" /><span>Play again</span>`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      min-block-size: var(--size-touch);
      padding-inline: var(--space-4) var(--space-5);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-button);
      background: var(--color-bg-raised);
      color: var(--color-text);
      font: inherit;
      font-weight: var(--font-weight-heavy);
      cursor: pointer;
    }
    :host:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus);
      outline-offset: var(--focus-ring-offset);
    }
  `,
})
export class ReplayButtonComponent {}
