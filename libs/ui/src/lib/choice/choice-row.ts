import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let nextId = 0;

/**
 * "Pick something for the jar:" + the choice buttons (default slot) + an end slot
 * (`[jicChoiceRowEnd]`, e.g. "Peek at the code"). Wraps on narrow screens.
 */
@Component({
  selector: 'jic-choice-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jic-choice-row' },
  template: `
    <div class="group" role="group" [attr.aria-labelledby]="labelId">
      <span class="label" [id]="labelId">{{ label() }}</span>
      <div class="choices"><ng-content /></div>
    </div>
    <div class="end"><ng-content select="[jicChoiceRowEnd]" /></div>
  `,
  styleUrl: './choice-row.scss',
})
export class ChoiceRowComponent {
  readonly label = input.required<string>();
  protected readonly labelId = `jic-choice-row-${nextId++}`;
}
