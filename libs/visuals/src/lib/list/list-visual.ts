import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { type Concept, CONCEPT_INFO } from '@jic/shared';

/** Box width and the step from one box to the next, in SVG units. */
const BOX = 64;
const STEP = 72;
const MIDDLE = 170;

/**
 * An array as a row of numbered boxes between [ and ], with a name tag. Each item is drawn in
 * its concept's shape, with its spot number (0, 1, 2...) underneath. The pointed-at box gets a
 * thick outline and an arrow, so it never rests on color alone. Items pop in one by one; with
 * reduced or calm motion they are simply there. Decorative SVG with a caption in words.
 */
@Component({
  selector: 'jic-list-visual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-index]': 'index() ?? null' },
  template: `
    <figure>
      <svg viewBox="0 0 340 210" focusable="false" aria-hidden="true">
        <rect x="110" y="6" width="120" height="34" rx="6" class="tag" />
        <text x="170" y="23" class="tag-text">{{ name() }}</text>

        <path [attr.d]="leftBracket()" class="bracket" />
        <path [attr.d]="rightBracket()" class="bracket" />

        @for (key of animationKey(); track key) {
          @for (slot of slots(); track slot.i) {
            <g class="slot" [class.pointed]="slot.i === index()" [style.--i]="slot.i">
              <rect [attr.x]="slot.x" y="80" [attr.width]="box" height="76" rx="10" class="box" />
              <g
                [attr.transform]="'translate(' + slot.cx + ' 118)'"
                class="item"
                [style.--fill]="fill()"
                [style.--on]="onFill()"
              >
                @switch (shape()) {
                  @case ('circle') {
                    <circle r="25" class="item-shape" />
                  }
                  @case ('pill') {
                    <rect x="-29" y="-18" width="58" height="36" rx="18" class="item-shape" />
                  }
                  @case ('diamond') {
                    <path d="M0 -27 27 0 0 27 -27 0z" class="item-shape" />
                  }
                  @default {
                    <rect x="-24" y="-20" width="48" height="40" rx="8" class="item-shape" />
                  }
                }
                <text class="item-text" [attr.font-size]="fontSize(slot.item)">{{ slot.item }}</text>
              </g>
              <text [attr.x]="slot.cx" y="180" class="spot">{{ slot.i }}</text>
              @if (slot.i === index()) {
                <path [attr.d]="arrow(slot.cx)" class="arrow" />
              }
            </g>
          } @empty {
            <text [attr.x]="middle" y="118" class="empty">(empty)</text>
          }
        }
      </svg>
      <figcaption>
        {{ summary() }}<span class="u-visually-hidden">{{ pointing() }}</span>
      </figcaption>
    </figure>
  `,
  styleUrl: './list-visual.scss',
})
export class ListVisualComponent {
  /** The name tag, e.g. "fruits". */
  readonly name = input.required<string>();
  readonly items = input<readonly string[]>([]);
  readonly concept = input<Concept>('string');
  /** The spot being pointed at, e.g. 1 for fruits[1]. */
  readonly index = input<number>();
  /** Change it to play the pop-in again ("Play again"). */
  readonly replayKey = input(0);

  protected readonly box = BOX;
  protected readonly middle = MIDDLE;

  /** The row is centered, so short lists sit in the middle. */
  private readonly start = computed(() => MIDDLE - (this.items().length * STEP - (STEP - BOX)) / 2);
  protected readonly slots = computed(() =>
    this.items().map((item, i) => {
      const x = this.start() + i * STEP;
      return { i, item, x, cx: x + BOX / 2 };
    }),
  );
  protected readonly leftBracket = computed(() => {
    const x = Math.min(this.start(), MIDDLE - 30) - 14;
    return `M${x + 14} 72H${x}V164H${x + 14}`;
  });
  protected readonly rightBracket = computed(() => {
    const end = this.start() + this.items().length * STEP - (STEP - BOX);
    const x = Math.max(end, MIDDLE + 30) + 14;
    return `M${x - 14} 72H${x}V164H${x - 14}`;
  });

  protected readonly shape = computed(() => CONCEPT_INFO[this.concept()].shape);
  protected readonly fill = computed(() => `var(--color-${this.concept()})`);
  protected readonly onFill = computed(() => `var(--color-${this.concept()}-on)`);

  protected readonly summary = computed(() => {
    const items = this.items();
    return items.length
      ? `A list called ${this.name()}: ${items.join(', ')}.`
      : `A list called ${this.name()}. It is empty.`;
  });
  /** For screen readers: which spot is pointed at. */
  protected readonly pointing = computed(() => {
    const i = this.index();
    const item = i === undefined ? undefined : this.items()[i];
    return item === undefined ? '' : ` Pointing at spot ${i}: ${item}.`;
  });
  /** Re-creating the boxes restarts their CSS animations. */
  protected readonly animationKey = computed(() => [
    `${this.items().join('\n')}|${this.index() ?? ''}|${this.replayKey()}`,
  ]);

  /** A downward arrow above the box at x = cx. */
  protected arrow(cx: number): string {
    return `M${cx - 13} 50H${cx + 13}L${cx} 72z`;
  }

  /** Long items get smaller so they stay inside the shape. */
  protected fontSize(item: string): number {
    return item.length <= 3 ? 18 : item.length <= 4 ? 16 : 14;
  }
}
