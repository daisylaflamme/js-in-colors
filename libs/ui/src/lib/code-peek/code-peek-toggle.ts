import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon';

/** "Peek at the code": a native disclosure button for the code panel. */
@Component({
  selector: 'button[jic-code-peek-toggle]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: {
    type: 'button',
    class: 'jic-code-peek-toggle',
    '[attr.aria-expanded]': 'expanded()',
    '[attr.aria-controls]': 'controls()',
  },
  template: `<jic-icon name="eye" /><span>Peek at the code</span>`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-3);
      min-block-size: var(--size-control);
      padding-inline: var(--space-5);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-button);
      background: var(--color-bg-raised);
      color: var(--color-text);
      font: inherit;
      font-size: var(--text-body);
      font-weight: var(--font-weight-heavy);
      cursor: pointer;
    }
    :host([aria-expanded='true']) {
      background: var(--color-code-bg);
      color: var(--color-surface);
    }
    :host:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus);
      outline-offset: var(--focus-ring-offset);
    }
  `,
})
export class CodePeekToggleComponent {
  readonly expanded = input.required<boolean>();
  /** id of the code panel. */
  readonly controls = input<string>();
}
