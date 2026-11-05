import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { type CardProp, CONCEPT_INFO } from '@jic/shared';

/** Row layout, in SVG units. */
const ROW_TOP = 50;
const ROW_STEP = 52;
const ROW_HEIGHT = 42;

/**
 * An object as a card: one thing with named details. A rounded-square card (the object shape)
 * with an orange border and a name tag; one white row per detail with its key and its value in
 * the value's concept shape. The detail being read gets a thick outline and a pointer, so it
 * never rests on color alone. Orange is only used for lines, never behind small text (ADR 0005).
 * Rows fade in one by one; with reduced or calm motion they are simply there.
 */
@Component({
  selector: 'jic-card-visual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-key]': 'key() ?? null' },
  template: `
    <figure>
      <svg [attr.viewBox]="'0 0 340 ' + height()" focusable="false" aria-hidden="true">
        <rect x="50" y="22" width="240" [attr.height]="cardHeight()" rx="26" class="card" />
        <rect x="115" y="4" width="110" height="34" rx="6" class="tag" />
        <text x="170" y="21" class="tag-text">{{ name() }}</text>

        @for (anim of animationKey(); track anim) {
          @for (row of rows(); track row.prop.key) {
            <g class="row" [class.read]="row.prop.key === key()" [style.--i]="row.i">
              <rect x="64" [attr.y]="row.y" width="212" [attr.height]="rowHeight" rx="10" class="row-box" />
              <text x="80" [attr.y]="row.cy" class="key">{{ row.prop.key }}:</text>
              <g
                [attr.transform]="'translate(232 ' + row.cy + ')'"
                [style.--fill]="'var(--color-' + row.prop.concept + ')'"
                [style.--on]="'var(--color-' + row.prop.concept + '-on)'"
              >
                @switch (row.shape) {
                  @case ('circle') {
                    <circle r="17" class="value-shape" />
                  }
                  @case ('pill') {
                    <rect x="-34" y="-16" width="68" height="32" rx="16" class="value-shape" />
                  }
                  @case ('diamond') {
                    <path d="M0 -19 30 0 0 19 -30 0z" class="value-shape" />
                  }
                  @default {
                    <rect x="-30" y="-16" width="60" height="32" rx="8" class="value-shape" />
                  }
                }
                <!-- Keep on one line: a wrapped <text> gets spaces around its value. -->
                <text class="value-text" [attr.font-size]="row.size">{{ row.prop.value }}</text>
              </g>
              @if (row.prop.key === key()) {
                <path [attr.d]="pointer(row.cy)" class="pointer" />
              }
            </g>
          }
        }
      </svg>
      <figcaption>
        {{ summary() }}<span class="u-visually-hidden">{{ reading() }}</span>
      </figcaption>
    </figure>
  `,
  styleUrl: './card-visual.scss',
})
export class CardVisualComponent {
  /** The variable name on the tag, e.g. "cat". */
  readonly name = input.required<string>();
  readonly props = input<readonly CardProp[]>([]);
  /** The detail being read, e.g. "name" for cat.name. */
  readonly key = input<string>();
  /** Change it to play the rows again ("Play again"). */
  readonly replayKey = input(0);

  protected readonly rowHeight = ROW_HEIGHT;
  protected readonly rows = computed(() =>
    this.props().map((prop, i) => {
      const y = ROW_TOP + i * ROW_STEP;
      return {
        i,
        prop,
        y,
        cy: y + ROW_HEIGHT / 2,
        shape: CONCEPT_INFO[prop.concept].shape,
        size: fontSize(prop.value),
      };
    }),
  );
  /** The card grows with its rows; the picture with the card. */
  protected readonly cardHeight = computed(() => 36 + this.props().length * ROW_STEP);
  protected readonly height = computed(() => 22 + this.cardHeight() + 6);

  protected readonly summary = computed(() => {
    const details = this.props().map((p) => `${p.key} is ${p.value}`);
    return `A thing called ${this.name()}: ${details.join(', ')}.`;
  });
  /** For screen readers: which detail is being read. */
  protected readonly reading = computed(() => {
    const prop = this.props().find((p) => p.key === this.key());
    return prop ? ` Reading ${this.name()}.${prop.key}: ${prop.value}.` : '';
  });
  /** Re-creating the rows restarts their CSS animations. */
  protected readonly animationKey = computed(() => [
    `${this.props()
      .map((p) => `${p.key}=${p.value}`)
      .join('|')}|${this.key() ?? ''}|${this.replayKey()}`,
  ]);

  /** A right-pointing triangle beside the row centered at cy. */
  protected pointer(cy: number): string {
    return `M30 ${cy - 12}L50 ${cy}L30 ${cy + 12}z`;
  }
}

/** Long values get smaller so they stay inside the shape. */
function fontSize(value: string): number {
  return value.length <= 3 ? 17 : value.length <= 4 ? 15 : 13;
}
