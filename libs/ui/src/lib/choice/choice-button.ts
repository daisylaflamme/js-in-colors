import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Concept } from '@jic/shared';
import { ConceptShapeComponent } from '../concept-shape/concept-shape';

/**
 * One choice: a native toggle button with the concept's shape and a word.
 * Selected = solid concept fill, ink border, press shadow, aria-pressed="true".
 * Unselected = tint background with a colored border.
 * Without a concept (e.g. a quiz answer that is not a value) it is neutral: no shape, plain colors.
 *
 *   <button jic-choice-button concept="string" [pressed]="picked() === 'emma'" (click)="pick('emma')">Emma</button>
 */
@Component({
  selector: 'button[jic-choice-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConceptShapeComponent],
  host: {
    type: 'button',
    class: 'jic-choice-button',
    '[attr.aria-pressed]': 'pressed()',
    '[style.--c-fill]': 'token("")',
    '[style.--c-text]': 'token("-text")',
    '[style.--c-tint]': 'token("-tint")',
    '[style.--c-on]': 'token("-on")',
  },
  template: `
    @if (concept(); as c) {
      <jic-concept-shape [concept]="c" [size]="22" [color]="pressed() ? 'var(--c-on)' : undefined" />
    }
    <span class="label"><ng-content /></span>
  `,
  styleUrl: './choice-button.scss',
})
export class ChoiceButtonComponent {
  readonly concept = input<Concept>();
  readonly pressed = input(false);

  protected readonly token = (suffix: string) => this.tokens()[suffix];
  private readonly tokens = computed<Record<string, string>>(() => {
    const c = this.concept();
    if (!c) {
      return {
        '': 'var(--color-text)',
        '-text': 'var(--color-text)',
        '-tint': 'var(--color-bg-raised)',
        '-on': 'var(--color-bg-raised)',
      };
    }
    return {
      '': `var(--color-${c})`,
      '-text': `var(--color-${c}-text)`,
      '-tint': `var(--color-${c}-tint)`,
      '-on': `var(--color-${c}-on)`,
    };
  });
}
