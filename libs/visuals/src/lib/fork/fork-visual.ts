import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ForkPath } from '@jic/shared';

/**
 * A condition as a fork in the road. The signpost asks a yes-or-no question; the yes (true)
 * path goes left and the no (false) path goes right. The taken path is solid and bold, the
 * other dashed and muted, so the difference never rests on color alone. A marker travels down
 * the taken path; with reduced or calm motion it is simply at the end. Decorative SVG with a
 * caption in words.
 */
@Component({
  selector: 'jic-fork-visual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-take]': 'take() ?? null' },
  template: `
    <figure>
      <svg viewBox="0 0 320 250" focusable="false" aria-hidden="true">
        <path d="M160 246V156" class="road trunk" />
        <path
          d="M160 160C160 120 70 128 70 86"
          class="road"
          [class.taken]="take() === 'yes'"
          [class.skipped]="take() === 'no'"
        />
        <path
          d="M160 160C160 120 250 128 250 86"
          class="road"
          [class.taken]="take() === 'no'"
          [class.skipped]="take() === 'yes'"
        />

        <g class="end" [class.taken]="take() === 'yes'" [class.skipped]="take() === 'no'">
          <path d="M70 34 98 62 70 90 42 62z" class="end-shape" />
          <text x="70" y="62" class="end-word">true</text>
          <text x="70" y="16" class="label">{{ yes() }}</text>
        </g>
        <g class="end" [class.taken]="take() === 'no'" [class.skipped]="take() === 'yes'">
          <path d="M250 34 278 62 250 90 222 62z" class="end-shape" />
          <text x="250" y="62" class="end-word">false</text>
          <text x="250" y="16" class="label">{{ no() }}</text>
        </g>

        <path d="M160 246V200" class="post" />
        <rect x="88" y="176" width="144" height="38" rx="8" class="sign" />
        <text x="160" y="195" class="sign-text">{{ question() }}</text>

        @for (key of animationKey(); track key) {
          @if (take(); as t) {
            <circle
              r="11"
              class="marker"
              [class.go-yes]="t === 'yes'"
              [class.go-no]="t === 'no'"
              [attr.cx]="t === 'yes' ? 92 : 228"
              [attr.cy]="104"
            />
          }
        }
      </svg>
      <figcaption>
        A fork: {{ question() }}<span class="u-visually-hidden">{{ details() }}</span>
      </figcaption>
    </figure>
  `,
  styleUrl: './fork-visual.scss',
})
export class ForkVisualComponent {
  /** The condition on the signpost, e.g. "sunny?". */
  readonly question = input.required<string>();
  /** Where the yes (true) path leads. */
  readonly yes = input.required<string>();
  /** Where the no (false) path leads. */
  readonly no = input.required<string>();
  /** The path taken; none means still deciding. */
  readonly take = input<ForkPath>();
  /** Change it to play the walk again ("Play again"). */
  readonly replayKey = input(0);

  /** The picture in words, for screen readers. */
  protected readonly details = computed(() => {
    const ways = ` Yes goes to ${this.yes()}. No goes to ${this.no()}.`;
    const take = this.take();
    return take ? `${ways} This time: ${take}, to ${take === 'yes' ? this.yes() : this.no()}.` : ways;
  });
  /** Re-creating the marker restarts its CSS animation. */
  protected readonly animationKey = computed(() => [`${this.take() ?? ''}|${this.replayKey()}`]);
}
