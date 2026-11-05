import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { PagePart, PageTag } from '@jic/shared';

/** Row layout, in SVG units. */
const ROW_TOP = 52;
const ROW_STEP = 56;
const ROW_HEIGHT = 46;
/** Where each part starts, right of its tag. */
const PART_X = 124;

/** What each part is called in words (caption and screen readers). */
const PART_WORDS: Record<PageTag, string> = { h1: 'a heading', p: 'words', button: 'a button' };
const FOUND_WORDS: Record<PageTag, string> = { h1: 'the heading', p: 'the words', button: 'the button' };

/**
 * A web page in a window (the DOM): the page magic shape, drawn large (ADR 0009). A red top bar,
 * then one row per part: its tag in code font, then the part as it looks on a page (a big heading,
 * some words, a red button). The part JavaScript found gets a thick outline and a pointer, so it
 * never rests on color alone. Rows fade in one by one; with reduced or calm motion they are simply
 * there.
 */
@Component({
  selector: 'jic-page-visual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-target]': 'target() ?? null' },
  template: `
    <figure>
      <svg [attr.viewBox]="'0 0 340 ' + height()" focusable="false" aria-hidden="true">
        <rect x="30" y="4" width="300" [attr.height]="frameHeight()" rx="18" class="body" />
        <rect x="30" y="4" width="300" height="36" rx="18" class="bar" />
        <rect x="30" y="22" width="300" height="18" class="bar" />
        <circle cx="54" cy="22" r="5" class="bar-dot" />
        <circle cx="72" cy="22" r="5" class="bar-dot" />
        <circle cx="90" cy="22" r="5" class="bar-dot" />
        <rect x="30" y="4" width="300" [attr.height]="frameHeight()" rx="18" class="frame" />

        @for (anim of animationKey(); track anim) {
          @for (row of rows(); track row.part.tag) {
            <g class="row" [class.found]="row.part.tag === target()" [style.--i]="row.i">
              <rect x="44" [attr.y]="row.y" width="272" [attr.height]="rowHeight" rx="10" class="row-box" />
              <text x="58" [attr.y]="row.cy" class="tag">{{ row.part.tag }}</text>
              @if (row.part.tag === 'button') {
                <rect
                  [attr.x]="partX"
                  [attr.y]="row.cy - 17"
                  [attr.width]="row.width"
                  height="34"
                  rx="17"
                  class="button"
                />
              }
              <!-- Keep on one line: a wrapped <text> gets spaces around its words. -->
              <text [attr.x]="row.x" [attr.y]="row.cy" [class]="row.cls">{{ row.part.text }}</text>
              @if (row.part.tag === target()) {
                <path [attr.d]="pointer(row.cy)" class="pointer" />
              }
            </g>
          }
        }
      </svg>
      <figcaption>
        {{ summary() }}<span class="u-visually-hidden">{{ found() }}</span>
      </figcaption>
    </figure>
  `,
  styleUrl: './page-visual.scss',
})
export class PageVisualComponent {
  readonly parts = input<readonly PagePart[]>([]);
  /** The part JavaScript found, e.g. "h1" for document.querySelector("h1"). */
  readonly target = input<PageTag>();
  /** Change it to play the rows again ("Play again"). */
  readonly replayKey = input(0);

  protected readonly rowHeight = ROW_HEIGHT;
  protected readonly partX = PART_X;
  protected readonly rows = computed(() =>
    this.parts().map((part, i) => {
      const y = ROW_TOP + i * ROW_STEP;
      const width = buttonWidth(part.text);
      const isButton = part.tag === 'button';
      return {
        i,
        part,
        y,
        cy: y + ROW_HEIGHT / 2,
        width,
        // A button's words are centered on it; a heading and words start at the left.
        x: isButton ? PART_X + width / 2 : PART_X,
        cls: `part-text is-${part.tag}`,
      };
    }),
  );
  /** The window grows with its parts; the picture with the window. */
  protected readonly frameHeight = computed(() => 44 + this.parts().length * ROW_STEP);
  protected readonly height = computed(() => 4 + this.frameHeight() + 4);

  protected readonly summary = computed(() => {
    const parts = this.parts().map((p) => `${PART_WORDS[p.tag]} "${p.text}"`);
    const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0];
    return list ? `A page with ${list}.` : 'An empty page.';
  });
  /** For screen readers: which part JavaScript found. */
  protected readonly found = computed(() => {
    const target = this.target();
    return target && this.parts().some((p) => p.tag === target) ? ` Found ${FOUND_WORDS[target]}.` : '';
  });
  /** Re-creating the rows restarts their CSS animations. */
  protected readonly animationKey = computed(() => [
    `${this.parts()
      .map((p) => `${p.tag}=${p.text}`)
      .join('|')}|${this.target() ?? ''}|${this.replayKey()}`,
  ]);

  /** A right-pointing triangle beside the row centered at cy. */
  protected pointer(cy: number): string {
    return `M8 ${cy - 12}L26 ${cy}L8 ${cy + 12}z`;
  }
}

/** A button as wide as its words (at most 12 characters, so it stays inside the window). */
function buttonWidth(text: string): number {
  return Math.max(80, text.length * 10 + 32);
}
