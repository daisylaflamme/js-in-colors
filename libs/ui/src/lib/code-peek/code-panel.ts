import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Concept } from '@jic/shared';

export type CodeTokenKind = 'keyword' | 'name' | 'operator' | 'value' | 'punctuation';

export interface CodeToken {
  readonly text: string;
  readonly kind: CodeTokenKind;
  /** For values: which concept the value is (colors it like its concept). */
  readonly concept?: Concept;
}

export interface CodeNote {
  /** The code word being explained, e.g. "let". */
  readonly term: string;
  readonly kind: CodeTokenKind;
  /** Plain words, e.g. "means: make a new jar". */
  readonly text: string;
}

/**
 * The dark "Peek at the code" panel: one line of real JavaScript and a few plain-words lines.
 * It is a peek, not an exercise, so nothing here is editable.
 */
@Component({
  selector: 'jic-code-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jic-code-panel', role: 'region', 'aria-label': 'The code' },
  template: `
    <pre
      class="line"
    ><code>@for (t of code(); track $index) {<span [class]="'tok ' + t.kind" [style.--tok-concept]="valueColor(t.concept)">{{ t.text }}</span>}</code></pre>
    <ul class="notes">
      @for (n of notes(); track n.term) {
        <li>
          <span [class]="'tok ' + n.kind">{{ n.term }}</span> {{ n.text }}
        </li>
      }
    </ul>
  `,
  styleUrl: './code-panel.scss',
})
export class CodePanelComponent {
  readonly code = input.required<readonly CodeToken[]>();
  readonly notes = input<readonly CodeNote[]>([]);

  /** The panel is dark in every theme, so values use a pale version of their concept color. */
  protected valueColor(concept: Concept | undefined): string | null {
    return concept ? `color-mix(in srgb, var(--color-${concept}) 30%, var(--color-ground))` : null;
  }
}
