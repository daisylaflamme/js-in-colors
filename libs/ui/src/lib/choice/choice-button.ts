import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Concept } from '@jic/shared';
import { ConceptShapeComponent } from '../concept-shape/concept-shape';

/**
 * One choice: a native toggle button with the concept's shape and a word.
 * Selected = solid concept fill, ink border, press shadow, aria-pressed="true".
 * Unselected = tint background with a colored border.
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
    <jic-concept-shape [concept]="concept()" [size]="22" [color]="pressed() ? 'var(--c-on)' : undefined" />
    <span class="label"><ng-content /></span>
  `,
  styleUrl: './choice-button.scss',
})
export class ChoiceButtonComponent {
  readonly concept = input.required<Concept>();
  readonly pressed = input(false);

  protected readonly token = (suffix: string) => this.tokens()[suffix];
  private readonly tokens = computed<Record<string, string>>(() => {
    const c = this.concept();
    return {
      '': `var(--color-${c})`,
      '-text': `var(--color-${c}-text)`,
      '-tint': `var(--color-${c}-tint)`,
      '-on': `var(--color-${c}-on)`,
    };
  });
}
