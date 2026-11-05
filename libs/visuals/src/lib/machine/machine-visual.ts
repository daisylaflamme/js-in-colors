import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { type Concept, CONCEPT_INFO } from '@jic/shared';

/**
 * A function as a machine with a name plate: the input goes in on the left, the output comes
 * out on the right, each drawn in its concept's shape. Both play again when they change or
 * `replayKey` changes; with reduced or calm motion they are simply there. The picture is
 * decorative; the caption says the same in words.
 */
@Component({
  selector: 'jic-machine-visual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `
    <figure>
      <svg viewBox="0 0 340 220" focusable="false" aria-hidden="true">
        <!-- Inside <svg> so its elements are created in the SVG namespace. -->
        <ng-template #token let-value let-cls="cls">
          <g [class]="cls" [style.--fill]="fill()" [style.--on]="onFill()">
            @switch (shape()) {
              @case ('circle') {
                <circle r="30" class="token-shape" />
              }
              @case ('pill') {
                <rect x="-42" y="-21" width="84" height="42" rx="21" class="token-shape" />
              }
              @case ('diamond') {
                <path d="M0 -36 36 0 0 36 -36 0z" class="token-shape" />
              }
              @default {
                <rect x="-36" y="-27" width="72" height="54" rx="12" class="token-shape" />
              }
            }
            <text class="token-text" [attr.font-size]="fontSize(value)">{{ value }}</text>
          </g>
        </ng-template>
        <path d="M86 70 112 86v48l-26 16z" class="mouth ink" />
        <path d="M228 86h26v48h-26z" class="mouth ink" />
        <rect x="104" y="40" width="132" height="140" rx="22" class="body ink" />
        <path d="M170 56 190 67.5v23L170 102 150 90.5v-23z" class="badge ink thin" />
        <rect x="118" y="124" width="104" height="36" rx="8" class="plate ink thin" />
        <text x="170" y="142" class="plate-text">{{ name() }}</text>
        @for (key of animationKey(); track key) {
          @if (input(); as v) {
            <g transform="translate(46 110)">
              <ng-container *ngTemplateOutlet="token; context: { $implicit: v, cls: 'in' }" />
            </g>
          }
          @if (output(); as v) {
            <g transform="translate(294 110)">
              <ng-container *ngTemplateOutlet="token; context: { $implicit: v, cls: 'out' }" />
            </g>
          }
        }
      </svg>
      <figcaption>
        A machine called {{ name() }}<span class="u-visually-hidden">{{ inAndOut() }}</span>
      </figcaption>
    </figure>
  `,
  styleUrl: './machine-visual.scss',
})
export class MachineVisualComponent {
  /** The name plate (the function's name). */
  readonly name = input.required<string>();
  readonly input = input<string>();
  readonly output = input<string>();
  readonly concept = input<Concept>('number');
  /** Change it to play the in-and-out animation again ("Play again"). */
  readonly replayKey = input(0);

  protected readonly shape = computed(() => CONCEPT_INFO[this.concept()].shape);
  protected readonly fill = computed(() => `var(--color-${this.concept()})`);
  protected readonly onFill = computed(() => `var(--color-${this.concept()}-on)`);
  /** The picture in words, for screen readers: ". In: 3. Out: 6." */
  protected readonly inAndOut = computed(() => {
    const parts = [
      this.input() === undefined ? '' : `In: ${this.input()}.`,
      this.output() === undefined ? '' : `Out: ${this.output()}.`,
    ].filter(Boolean);
    return parts.length ? `. ${parts.join(' ')}` : '';
  });
  /** Re-creating the tokens restarts their CSS animations. */
  protected readonly animationKey = computed(() => [
    `${this.input() ?? ''}|${this.output() ?? ''}|${this.replayKey()}`,
  ]);

  /** Long values get smaller so they stay inside the shape. */
  protected fontSize(value: string): number {
    return value.length <= 2 ? 28 : value.length <= 4 ? 22 : 16;
  }
}
