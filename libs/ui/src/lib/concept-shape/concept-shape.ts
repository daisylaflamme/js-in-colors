import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CONCEPT_INFO, type Concept } from '@jic/shared';

/**
 * The shape that belongs to a concept, filled with its color.
 * Decorative (aria-hidden): always render the concept's word next to it.
 */
@Component({
  selector: 'jic-concept-shape',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    class: 'jic-concept-shape',
    '[attr.data-shape]': 'shape()',
    '[style.--fill]': 'fill()',
  },
  template: `
    <svg [attr.viewBox]="viewBox()" [attr.width]="width()" [attr.height]="size()" focusable="false">
      @switch (shape()) {
        @case ('circle') {
          <circle cx="12" cy="12" r="10.5" />
        }
        @case ('pill') {
          <rect x="1" y="5" width="30" height="14" rx="7" />
        }
        @case ('diamond') {
          <path d="M12 1.5 22.5 12 12 22.5 1.5 12z" />
        }
        @case ('rounded-square') {
          <rect x="2" y="2" width="20" height="20" rx="4.5" />
        }
        @case ('triangle') {
          <path d="M12 2.5 22.5 21h-21z" />
        }
        @case ('hexagon') {
          <path d="M6.5 3h11l5.5 9-5.5 9h-11L1 12z" />
        }
        @case ('capsule') {
          <rect x="5" y="1" width="14" height="22" rx="6" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
    svg > * {
      fill: var(--fill);
      stroke: var(--shape-stroke);
      stroke-width: var(--shape-stroke-width);
    }
  `,
})
export class ConceptShapeComponent {
  readonly concept = input.required<Concept>();
  /** Height in px. Pills are drawn wider than tall. */
  readonly size = input(24);
  /** Override the fill (e.g. the on-fill color when the shape sits on a solid button). */
  readonly color = input<string>();

  protected readonly shape = computed(() => CONCEPT_INFO[this.concept()].shape);
  protected readonly fill = computed(() => this.color() ?? `var(--color-${this.concept()})`);
  private readonly wide = computed(() => this.shape() === 'pill');
  protected readonly viewBox = computed(() => (this.wide() ? '0 0 32 24' : '0 0 24 24'));
  protected readonly width = computed(() =>
    this.wide() ? Math.round((this.size() * 32) / 24) : this.size(),
  );
}
