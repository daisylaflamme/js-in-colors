import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CONCEPT_INFO, SHAPE_PATHS, WIDE_SHAPES, WINDOW_PAGE_PATH, type Concept } from '@jic/shared';

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
      <path [attr.d]="path()" [class.outlined]="shape() === 'star'" />
      @if (shape() === 'window') {
        <!-- The window's page is filled, so lines behind the shape never show through. -->
        <path [attr.d]="windowPage" class="window-page" />
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
    svg > .window-page {
      fill: var(--color-bg);
    }
    /* The yellow star is too light on white (1.5:1): always outlined, like the mockup's certificate star. */
    svg > .outlined {
      stroke: var(--color-border);
      stroke-width: 1.5;
      stroke-linejoin: round;
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
  protected readonly path = computed(() => SHAPE_PATHS[this.shape()]);
  protected readonly windowPage = WINDOW_PAGE_PATH;
  private readonly wide = computed(() => WIDE_SHAPES.includes(this.shape()));
  protected readonly viewBox = computed(() => (this.wide() ? '0 0 32 24' : '0 0 24 24'));
  protected readonly width = computed(() =>
    this.wide() ? Math.round((this.size() * 32) / 24) : this.size(),
  );
}
