import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * PLACEHOLDER for Dot, the guide character (simple shapes only).
 * The real, original Dot artwork is a separate task.
 */
@Component({
  selector: 'jic-dot-character',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 120 130" focusable="false">
      <path d="M60 30 Q58 14 70 10" class="line" />
      <circle cx="72" cy="9" r="6" fill="var(--color-function)" class="line" />
      <circle cx="60" cy="78" r="46" fill="var(--color-accent)" class="line" />
      <circle cx="44" cy="72" r="9" fill="var(--color-surface)" class="line thin" />
      <circle cx="76" cy="72" r="9" fill="var(--color-surface)" class="line thin" />
      <circle cx="46" cy="73" r="4" fill="var(--color-ink)" />
      <circle cx="78" cy="73" r="4" fill="var(--color-ink)" />
      <path d="M46 94 Q60 104 74 94" class="line" />
      <circle cx="28" cy="60" r="4.5" fill="var(--color-number)" />
      <circle cx="94" cy="58" r="4" fill="var(--color-function)" />
      <circle cx="98" cy="88" r="4.5" fill="var(--color-boolean)" />
      <circle cx="22" cy="92" r="4" fill="var(--color-string)" />
    </svg>
  `,
  styles: `
    :host {
      display: block;
      inline-size: clamp(4.5rem, 18cqi, 9rem);
      flex: none;
    }
    .line {
      fill-opacity: 1;
      stroke: var(--color-ink);
      stroke-width: 5;
      stroke-linecap: round;
    }
    path.line {
      fill: none;
    }
    .thin {
      stroke-width: 3;
    }
  `,
})
export class DotCharacterComponent {}
