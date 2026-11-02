import { Directive, ElementRef, effect, inject, input, output, untracked } from '@angular/core';

/**
 * Turns a native <dialog> into a state-driven modal with the project's focus contract:
 *
 *  - `open` true  -> showModal(): the rest of the page becomes inert (focus is trapped),
 *                    focus moves to the first `[data-autofocus]` element (or the dialog).
 *  - Esc / backdrop click -> `dismissed` fires; the owner sets `open` to false.
 *  - `open` false -> close(), then focus returns to `returnFocusTo` (the trigger).
 *
 * The owner keeps the state, so Esc, the X button and the trigger all go through one path.
 */
@Directive({
  selector: 'dialog[jicModalDialog]',
  host: {
    '(keydown.escape)': 'onEscape($event)',
    '(cancel)': 'onCancel($event)',
    '(close)': 'onNativeClose()',
    '(click)': 'onClick($event)',
  },
})
export class ModalDialogDirective {
  readonly open = input.required<boolean>();
  /** Element to focus after closing. Pass the button that opened the dialog. */
  readonly returnFocusTo = input<HTMLElement | null>(null);
  /** Close when the backdrop (outside the dialog box) is clicked. */
  readonly closeOnBackdrop = input(true);

  readonly dismissed = output<void>();

  private readonly el: HTMLDialogElement = inject<ElementRef<HTMLDialogElement>>(ElementRef).nativeElement;

  constructor() {
    effect(() => {
      const open = this.open();
      untracked(() => (open ? this.show() : this.hide()));
    });
  }

  private show(): void {
    if (this.el.open) return;
    if (typeof this.el.showModal === 'function') {
      this.el.showModal();
    } else {
      this.el.setAttribute('open', ''); // very old browsers / jsdom
    }
    const target = this.el.querySelector<HTMLElement>('[data-autofocus]') ?? this.el;
    target.focus();
  }

  private hide(): void {
    if (!this.el.open && !this.el.hasAttribute('open')) return;
    if (typeof this.el.close === 'function') {
      this.el.close();
    } else {
      this.el.removeAttribute('open');
    }
    this.returnFocusTo()?.focus();
  }

  /**
   * Handle Esc ourselves (and stop the native cancel), so closing behaves the same in every
   * browser and with assistive tech that sends key events, not only native dialog cancel.
   */
  protected onEscape(event: Event): void {
    event.preventDefault();
    this.dismissed.emit();
  }

  protected onCancel(event: Event): void {
    // Keep the owner in charge of state: Esc asks to close; it does not close by itself.
    event.preventDefault();
    this.dismissed.emit();
  }

  protected onNativeClose(): void {
    // Some browsers close anyway (e.g. a second Esc). Tell the owner so state stays in sync.
    if (this.open()) {
      this.dismissed.emit();
    }
  }

  protected onClick(event: MouseEvent): void {
    // A click whose target is the <dialog> itself landed on the ::backdrop
    // (the dialog's content is wrapped, so inner clicks have other targets).
    if (this.closeOnBackdrop() && event.target === this.el) {
      this.dismissed.emit();
    }
  }
}
