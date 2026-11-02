import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModalDialogDirective } from '../dialog/modal-dialog.directive';
import { IconComponent } from '../icon/icon';

let nextId = 0;

/**
 * The Tip: a small card with one sentence.
 * Phone: above the bottom tab bar (mockup 16). sm and up: left of the right-edge tabs (mockup 03).
 * Modal <dialog>: traps focus, Esc closes, focus returns to the Tip tab.
 */
@Component({
  selector: 'jic-tip-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalDialogDirective, IconComponent],
  template: `
    <dialog
      jicModalDialog
      class="tip"
      [id]="dialogId()"
      [open]="open()"
      [returnFocusTo]="returnFocusTo()"
      [attr.aria-labelledby]="titleId"
      (dismissed)="closed.emit()"
    >
      <div class="box">
        <div class="head">
          <span class="badge"><jic-icon name="tip" /></span>
          <h2 class="title" [id]="titleId">Tip</h2>
          <button type="button" class="close" aria-label="Close tip" data-autofocus (click)="closed.emit()">
            <jic-icon name="close" />
          </button>
        </div>
        <div class="body"><ng-content /></div>
      </div>
    </dialog>
  `,
  styleUrl: './tip-card.scss',
})
export class TipCardComponent {
  readonly open = input.required<boolean>();
  readonly returnFocusTo = input<HTMLElement | null>(null);
  readonly dialogId = input('jic-tip');
  readonly closed = output<void>();

  protected readonly titleId = `jic-tip-title-${nextId++}`;
}
