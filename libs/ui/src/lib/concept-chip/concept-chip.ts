import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CONCEPT_INFO, type Concept } from '@jic/shared';
import { ConceptShapeComponent } from '../concept-shape/concept-shape';

/** Shape + word in a pill. Never color alone. */
@Component({
  selector: 'jic-concept-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConceptShapeComponent],
  host: { class: 'jic-concept-chip', '[style.--chip-text]': 'textColor()' },
  template: `<jic-concept-shape [concept]="concept()" [size]="18" /><span>{{ text() }}</span>`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      flex: none;
      min-block-size: 2.25rem;
      padding-inline: var(--space-3) var(--space-4);
      border: 2px solid var(--color-border-soft);
      border-radius: var(--radius-chip);
      background: var(--color-bg-raised);
      color: var(--chip-text);
      font-size: var(--text-small);
      font-weight: var(--font-weight-heavy);
      white-space: nowrap;
    }
  `,
})
export class ConceptChipComponent {
  readonly concept = input.required<Concept>();
  /** Defaults to the concept's kid word, e.g. "words". */
  readonly label = input<string>();
  protected readonly text = computed(() => this.label() ?? CONCEPT_INFO[this.concept()].kidWord);
  protected readonly textColor = computed(() => `var(--color-${this.concept()}-text)`);
}
