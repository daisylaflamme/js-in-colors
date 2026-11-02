import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { type Concept, CONCEPT_INFO } from '@jic/shared';

/**
 * PLACEHOLDER jar for the Variables scene: a jar with a name tag holding one value,
 * drawn as its concept's shape. Real lesson visuals will live in libs/visuals.
 */
@Component({
  selector: 'jic-jar-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure>
      <svg viewBox="0 0 240 260" focusable="false" aria-hidden="true">
        <rect x="58" y="6" width="124" height="30" rx="8" fill="var(--color-accent)" class="ink" />
        <rect x="30" y="30" width="180" height="222" rx="40" fill="var(--color-variable-tint)" class="ink" />
        <g [style.--fill]="fill()" [style.--on]="onFill()">
          @switch (shape()) {
            @case ('circle') {
              <circle cx="120" cy="140" r="52" class="value" />
            }
            @case ('pill') {
              <rect x="40" y="114" width="160" height="52" rx="26" class="value" />
            }
            @case ('diamond') {
              <path d="M120 74 186 140 120 206 54 140z" class="value" />
            }
          }
          <text x="120" y="141" class="value-text">{{ value() }}</text>
        </g>
        <g transform="rotate(8 190 70)">
          <rect x="140" y="52" width="104" height="34" rx="6" fill="var(--color-surface)" class="ink thin" />
          <text x="192" y="70" class="tag">{{ name() }}</text>
        </g>
      </svg>
      <figcaption>A jar named {{ name() }}</figcaption>
    </figure>
  `,
  styles: `
    :host {
      display: block;
      inline-size: min(15rem, 70cqi);
    }
    figure {
      display: grid;
      justify-items: center;
      gap: var(--space-3);
      margin: 0;
    }
    svg {
      inline-size: 100%;
      overflow: visible;
    }
    .ink {
      stroke: var(--color-ink);
      stroke-width: 6;
    }
    .thin {
      stroke-width: 3;
    }
    .value {
      fill: var(--fill);
    }
    .value-text {
      fill: var(--on);
      font-family: var(--font-display);
      font-size: 44px;
      font-weight: 800;
      text-anchor: middle;
      dominant-baseline: central;
    }
    .tag {
      fill: var(--color-ink);
      font-family: var(--font-code);
      font-size: 18px;
      font-weight: 700;
      text-anchor: middle;
      dominant-baseline: central;
    }
    figcaption {
      color: var(--color-text-muted);
      font-weight: var(--font-weight-heavy);
    }
  `,
})
export class JarPlaceholderComponent {
  readonly name = input.required<string>();
  readonly value = input.required<string>();
  readonly concept = input.required<Concept>();

  protected readonly shape = computed(() => CONCEPT_INFO[this.concept()].shape);
  protected readonly fill = computed(() => `var(--color-${this.concept()})`);
  protected readonly onFill = computed(() => `var(--color-${this.concept()}-on)`);
}
