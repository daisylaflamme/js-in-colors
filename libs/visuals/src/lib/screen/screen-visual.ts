import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * A little computer screen that shows output lines ("Say it out loud": console.log).
 * The lines are real text, so screen readers and text zoom work. Lines fade in one by one,
 * or appear at once with reduced or calm motion.
 */
@Component({
  selector: 'jic-screen-visual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure>
      <div class="monitor">
        <div class="bar" aria-hidden="true"><span></span><span></span><span></span></div>
        @for (key of animationKey(); track key) {
          <ol class="lines" aria-label="The screen shows">
            @for (line of lines(); track $index) {
              <li [style.--i]="$index">{{ line }}</li>
            } @empty {
              <li class="empty">(nothing yet)</li>
            }
          </ol>
        }
      </div>
      <div class="stand" aria-hidden="true"></div>
      @if (caption(); as c) {
        <figcaption>{{ c }}</figcaption>
      }
    </figure>
  `,
  styleUrl: './screen-visual.scss',
})
export class ScreenVisualComponent {
  readonly lines = input<readonly string[]>([]);
  readonly caption = input<string>();
  /** Change it to play the lines again ("Play again"). */
  readonly replayKey = input(0);

  protected readonly animationKey = computed(() => [`${this.lines().join('\n')}|${this.replayKey()}`]);
}
