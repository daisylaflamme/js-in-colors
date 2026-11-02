import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Concept } from '@jic/shared';
import { ConceptChipComponent } from './concept-chip';

let nextId = 0;

/**
 * "Jars can hold:" followed by concept chips.
 * Phone: one row that scrolls sideways (no visible scrollbar). sm and up: wraps.
 */
@Component({
  selector: 'jic-concept-chip-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConceptChipComponent],
  template: `
    <span class="label" [id]="labelId">{{ label() }}</span>
    <ul class="chips" [attr.aria-labelledby]="labelId">
      @for (c of concepts(); track c) {
        <li><jic-concept-chip [concept]="c" /></li>
      }
    </ul>
  `,
  styleUrl: './concept-chip-list.scss',
})
export class ConceptChipListComponent {
  readonly label = input.required<string>();
  readonly concepts = input.required<readonly Concept[]>();
  protected readonly labelId = `jic-chip-list-${nextId++}`;
}
