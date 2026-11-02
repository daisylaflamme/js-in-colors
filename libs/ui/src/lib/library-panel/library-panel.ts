import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModalDialogDirective } from '../dialog/modal-dialog.directive';
import { IconComponent } from '../icon/icon';

let nextId = 0;

/**
 * The Library: the lesson's longer text.
 * Phone: bottom sheet (mockup 15). sm and up: 420px right drawer, full height (mockup 04).
 * Modal <dialog>: traps focus, Esc closes, focus returns to the Library tab.
 * Slots: default (the content), `[jicLibraryFooter]` (e.g. "Still curious? Ask Dot").
 */
@Component({
  selector: 'jic-library-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalDialogDirective, IconComponent],
  template: `
    <dialog
      jicModalDialog
      class="library"
      [id]="dialogId()"
      [open]="open()"
      [returnFocusTo]="returnFocusTo()"
      [attr.aria-labelledby]="titleId"
      (dismissed)="closed.emit()"
    >
      <div class="box">
        <span class="handle" aria-hidden="true"></span>
        <div class="head">
          <span class="badge"><jic-icon name="library" /></span>
          <h2 class="title" [id]="titleId">Library</h2>
          <button
            type="button"
            class="close"
            aria-label="Close library"
            data-autofocus
            (click)="closed.emit()"
          >
            <jic-icon name="close" />
          </button>
        </div>
        <div class="body"><ng-content /></div>
        <div class="foot"><ng-content select="[jicLibraryFooter]" /></div>
      </div>
    </dialog>
  `,
  styleUrl: './library-panel.scss',
})
export class LibraryPanelComponent {
  readonly open = input.required<boolean>();
  readonly returnFocusTo = input<HTMLElement | null>(null);
  readonly dialogId = input('jic-library');
  readonly closed = output<void>();

  protected readonly titleId = `jic-library-title-${nextId++}`;
}
