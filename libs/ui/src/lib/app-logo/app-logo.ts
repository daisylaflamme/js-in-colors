import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Three overlapping dots + "JavaScript in Colors". */
@Component({
  selector: 'jic-app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jic-app-logo', '[class.stacked]': 'stacked()' },
  template: `
    <svg class="mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle cx="13" cy="14" r="10" fill="var(--color-number)" />
      <circle cx="26" cy="13" r="10" fill="var(--color-function)" />
      <circle cx="19" cy="25" r="10" fill="var(--color-accent)" />
    </svg>
    <span class="name">JavaScript <span class="line">in Colors</span></span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-3);
      color: var(--color-text);
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: var(--font-weight-bold);
      line-height: 1.05;
    }
    .mark {
      flex: none;
      inline-size: 2.25rem;
      block-size: 2.25rem;
    }
    :host(.stacked) {
      font-size: 1.5rem;
    }
    :host(.stacked) .line {
      display: block;
    }
  `,
})
export class AppLogoComponent {
  /** Two lines ("JavaScript / in Colors"), as at the top of the lesson menu. */
  readonly stacked = input(false);
}
