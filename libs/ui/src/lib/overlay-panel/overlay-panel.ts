import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModalDialogDirective } from '../dialog/modal-dialog.directive';

/**
 * A modal panel that slides in from the left over a dimmed page. Hosts the lesson menu
 * below the lg breakpoint (mockup 14). Closes on Esc, a backdrop tap, or `open` = false
 * (the menu's own X button); focus returns to `returnFocusTo` (the hamburger).
 */
@Component({
  selector: 'jic-overlay-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalDialogDirective],
  template: `
    <dialog
      jicModalDialog
      class="panel"
      [id]="dialogId()"
      [open]="open()"
      [returnFocusTo]="returnFocusTo()"
      [attr.aria-label]="label()"
      (dismissed)="closed.emit()"
    >
      <div class="box"><ng-content /></div>
    </dialog>
  `,
  styles: `
    .panel {
      position: fixed;
      inset: 0 auto 0 0;
      inline-size: min(var(--size-menu-overlay), 88vw);
      max-inline-size: none;
      block-size: 100dvh;
      max-block-size: none;
      margin: 0;
      background: var(--color-bg-raised);
      color: var(--color-text);
      box-shadow: var(--shadow-popover);
    }
    .panel::backdrop {
      background: var(--color-scrim);
    }
    .box {
      block-size: 100%;
      padding-block-start: env(safe-area-inset-top);
      padding-inline-start: env(safe-area-inset-left);
    }
    @media (prefers-reduced-motion: no-preference) {
      :root:not([data-motion='calm']) .panel[open] {
        animation: panel-in var(--motion-base) var(--ease-out);
      }
    }
    @keyframes panel-in {
      from {
        transform: translateX(-100%);
      }
    }
  `,
})
export class OverlayPanelComponent {
  readonly open = input.required<boolean>();
  readonly returnFocusTo = input<HTMLElement | null>(null);
  readonly label = input.required<string>();
  readonly dialogId = input<string>();
  readonly closed = output<void>();
}
