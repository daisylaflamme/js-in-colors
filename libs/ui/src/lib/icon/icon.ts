import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Original, simple stroke icons used by the shell. Always decorative: pair with visible text or an aria-label. */
export type IconName =
  | 'menu'
  | 'close'
  | 'tip'
  | 'library'
  | 'speaker'
  | 'eye'
  | 'check'
  | 'play'
  | 'arrow-right'
  | 'retry'
  | 'star';

const PATHS: Record<IconName, string> = {
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  // light bulb: round top, short neck, two base lines
  tip: 'M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3zM9.5 19h5M10.5 21.5h3',
  // open book
  library: 'M3 5.5c3-1.3 6-1.3 9 .5 3-1.8 6-1.8 9-.5V19c-3-1.3-6-1.3-9 .5-3-1.8-6-1.8-9-.5zM12 6v13.5',
  // speaker with two waves
  speaker: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  play: 'M8 5.5v13l10.5-6.5z',
  'arrow-right': 'M4 12h15M13 6l6 6-6 6',
  // circular arrow
  retry: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v4.5H9',
  star: 'M12 2.8l2.8 5.8 6.4.8-4.7 4.4 1.2 6.3L12 17l-5.7 3.1 1.2-6.3-4.7-4.4 6.4-.8z',
};

@Component({
  selector: 'jic-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', class: 'jic-icon' },
  template: `
    <svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" focusable="false">
      <path [attr.d]="path()" [class.filled]="name() === 'play'" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
    path {
      fill: none;
      stroke: currentColor;
      stroke-width: 2.25;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    path.filled {
      fill: currentColor;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(24);
  protected readonly path = computed(() => PATHS[this.name()]);
}
