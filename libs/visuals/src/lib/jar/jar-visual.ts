import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { type Concept, CONCEPT_INFO } from '@jic/shared';

/**
 * A jar with a name tag (a variable), optionally holding one value drawn as its concept's shape.
 * The value drops in whenever it changes or `replayKey` changes; with reduced or calm motion it
 * simply appears. The picture is decorative; the caption says the same in words.
 */
@Component({
  selector: 'jic-jar-visual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure>
      <svg viewBox="0 0 240 260" focusable="false" aria-hidden="true">
        <rect x="58" y="6" width="124" height="30" rx="8" class="lid ink" />
        <rect x="30" y="30" width="180" height="222" rx="40" class="glass ink" />
        @for (key of animationKey(); track key) {
          @if (value(); as v) {
            <g class="value" [style.--fill]="fill()" [style.--on]="onFill()">
              @switch (shape()) {
                @case ('circle') {
                  <circle cx="120" cy="140" r="52" class="value-shape" />
                }
                @case ('pill') {
                  <rect x="40" y="114" width="160" height="52" rx="26" class="value-shape" />
                }
                @case ('diamond') {
                  <path d="M120 74 186 140 120 206 54 140z" class="value-shape" />
                }
                @default {
                  <rect x="44" y="96" width="152" height="88" rx="18" class="value-shape" />
                }
              }
              <text x="120" y="141" class="value-text" [attr.font-size]="fontSize()">{{ v }}</text>
            </g>
          }
        }
        <g transform="rotate(8 190 70)">
          <rect x="140" y="52" width="104" height="34" rx="6" class="tag ink thin" />
          <text x="192" y="70" class="tag-text">{{ name() }}</text>
        </g>
      </svg>
      <figcaption>
        A jar named {{ name() }}
        @if (value(); as v) {
          <span class="u-visually-hidden">. Inside: {{ v }}</span>
        } @else {
          <span class="u-visually-hidden">. It is empty</span>
        }
      </figcaption>
    </figure>
  `,
  styleUrl: './jar-visual.scss',
})
export class JarVisualComponent {
  /** The name on the tag. */
  readonly name = input.required<string>();
  /** What is inside, if anything. */
  readonly value = input<string>();
  readonly concept = input<Concept>('number');
  /** Change it to play the drop-in animation again ("Play again"). */
  readonly replayKey = input(0);

  protected readonly shape = computed(() => CONCEPT_INFO[this.concept()].shape);
  protected readonly fill = computed(() => `var(--color-${this.concept()})`);
  protected readonly onFill = computed(() => `var(--color-${this.concept()}-on)`);
  /** Long words get smaller so they stay inside the shape. */
  protected readonly fontSize = computed(() => {
    const length = this.value()?.length ?? 0;
    return length <= 4 ? 44 : length <= 6 ? 36 : 28;
  });
  /** Re-creating the value element restarts its CSS animation. */
  protected readonly animationKey = computed(() => [`${this.value() ?? ''}|${this.replayKey()}`]);
}
