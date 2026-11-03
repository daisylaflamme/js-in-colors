import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A pill button for a setting, as in the Home header (mockup 08): "Calm motion: off", "Text size: Normal".
 * Use on a native button: <button type="button" jic-setting-toggle label="Calm motion" ...>.
 *
 * - On/off settings pass `pressed`: the button gets aria-pressed, and the visible ": on/off"
 *   is hidden from screen readers (they hear "Calm motion, toggle button, pressed").
 * - Multi-step settings pass only `value`: it is part of the name ("Text size: Bigger").
 */
@Component({
  selector: 'button[jic-setting-toggle]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    type: 'button',
    class: 'jic-setting-toggle',
    '[attr.aria-pressed]': 'pressed() === null ? null : pressed()',
  },
  template: `
    <span>{{ label() }}</span>
    @if (pressed() !== null) {
      <span aria-hidden="true">: {{ pressed() ? 'on' : 'off' }}</span>
    } @else if (value()) {
      <span>: {{ value() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      min-block-size: var(--size-control);
      padding-inline: var(--space-5);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-button);
      background: var(--color-bg-raised);
      color: var(--color-text);
      font: inherit;
      font-weight: var(--font-weight-heavy);
      white-space: nowrap;
      cursor: pointer;
    }
    :host([aria-pressed='true']) {
      background: var(--color-accent);
      color: var(--color-accent-ink);
      box-shadow: var(--shadow-press);
    }
    :host:focus-visible {
      outline: var(--focus-ring-width) solid var(--color-focus);
      outline-offset: var(--focus-ring-offset);
    }
  `,
})
export class SettingToggleComponent {
  readonly label = input.required<string>();
  /** On/off setting: true/false. Leave null for a multi-step setting. */
  readonly pressed = input<boolean | null>(null);
  /** The current step of a multi-step setting, e.g. "Bigger". */
  readonly value = input<string>();
}
