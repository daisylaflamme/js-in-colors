import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DOT_ART, type DotPart, type DotPose, type DotRole, type DotShape } from './dot-art';

/** Each colour role of the artwork as a theme token (see tools/dot-art/convert-lib.mjs). */
export function dotColor(role: DotRole | undefined): string | null {
  switch (role) {
    case undefined:
      return 'none';
    case 'accent':
      return 'var(--color-accent)';
    case 'outline':
      return 'var(--dot-outline)';
    case 'face':
      return 'var(--color-ink)';
    case 'white':
      return 'var(--color-surface)';
    default:
      return `var(--color-${role})`;
  }
}

/** Poses whose eyes are open (they blink); cheering's eyes are already closed in a smile. */
const BLINKING: readonly DotPose[] = ['happy', 'thinking', 'curious'];

/**
 * Dot, the guide (artwork in docs/dot-art/, made with Lovable for this project, CC BY-NC 4.0).
 * Drawn from data (dot-art.ts, generated), so its colours follow the theme: the outer outline is
 * --dot-outline (pale on dark), the face stays ink on the yellow body. Decorative: aria-hidden.
 * Blinks now and then, and bounces once when cheering; Calm or reduced motion keeps it still.
 */
@Component({
  selector: 'jic-dot-character',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[attr.data-pose]': 'pose()' },
  template: `
    <svg viewBox="0 0 120 130" focusable="false">
      <g class="figure" [class.blinks]="blinks()" [class.cheer]="pose() === 'cheering'">
        <g [attr.transform]="art().transform ?? null">
          @for (group of groups(); track $index) {
            <g [attr.class]="'part part-' + group.part">
              @for (s of group.shapes; track $index) {
                @switch (s.tag) {
                  @case ('circle') {
                    <circle
                      [attr.cx]="s.cx"
                      [attr.cy]="s.cy"
                      [attr.r]="s.r"
                      [style.fill]="color(s.fill)"
                      [style.stroke]="color(s.stroke)"
                      [attr.stroke-width]="s.strokeWidth ?? null"
                    />
                  }
                  @case ('ellipse') {
                    <ellipse
                      [attr.cx]="s.cx"
                      [attr.cy]="s.cy"
                      [attr.rx]="s.rx"
                      [attr.ry]="s.ry"
                      [style.fill]="color(s.fill)"
                      [style.stroke]="color(s.stroke)"
                      [attr.stroke-width]="s.strokeWidth ?? null"
                    />
                  }
                  @default {
                    <path
                      [attr.d]="s.d"
                      [style.fill]="color(s.fill)"
                      [style.stroke]="color(s.stroke)"
                      [attr.stroke-width]="s.strokeWidth ?? null"
                    />
                  }
                }
              }
            </g>
          }
        </g>
      </g>
    </svg>
  `,
  styleUrl: './dot-character.scss',
})
export class DotCharacterComponent {
  readonly pose = input<DotPose>('happy');

  protected readonly art = computed(() => DOT_ART[this.pose()]);
  protected readonly blinks = computed(() => BLINKING.includes(this.pose()));
  /** Consecutive shapes of one part, so a part (the eyes) can move as one. */
  protected readonly groups = computed(() => {
    const groups: { part: DotPart; shapes: DotShape[] }[] = [];
    for (const shape of this.art().shapes) {
      const last = groups.at(-1);
      if (last?.part === shape.part) last.shapes.push(shape);
      else groups.push({ part: shape.part, shapes: [shape] });
    }
    return groups;
  });
  protected readonly color = dotColor;
}
