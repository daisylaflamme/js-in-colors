import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon';

/**
 * The 52px hamburger that toggles the lesson menu. Sits top-left of the main column
 * so it never moves. Use on a native button: <button jic-menu-button [expanded]="..." controls="lesson-menu">.
 */
@Component({
  selector: 'button[jic-menu-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: {
    type: 'button',
    class: 'jic-menu-button',
    'aria-label': 'Lesson menu',
    '[attr.aria-expanded]': 'expanded()',
    '[attr.aria-controls]': 'controls()',
  },
  template: `<jic-icon name="menu" />`,
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      flex: none;
      inline-size: 3.25rem;
      block-size: 3.25rem;
      padding: 0;
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-nav-item);
      background: var(--color-bg-raised);
      color: var(--color-text);
      cursor: pointer;
    }
    :host:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus);
      outline-offset: var(--focus-ring-offset);
    }
  `,
})
export class MenuButtonComponent {
  readonly expanded = input.required<boolean>();
  /** id of the menu this button shows and hides. */
  readonly controls = input<string>();
}
