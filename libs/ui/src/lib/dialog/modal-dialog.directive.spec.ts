import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ModalDialogDirective } from './modal-dialog.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalDialogDirective],
  template: `
    <button id="trigger" type="button">Open</button>
    <dialog
      jicModalDialog
      [open]="open()"
      [returnFocusTo]="trigger"
      (dismissed)="dismissals = dismissals + 1"
    >
      <div class="box">
        <p>Hello</p>
        <button id="close" type="button" data-autofocus>Close</button>
      </div>
    </dialog>
  `,
})
class HostComponent {
  readonly open = signal(false);
  dismissals = 0;
  get trigger(): HTMLElement | null {
    return document.getElementById('trigger');
  }
}

describe('ModalDialogDirective', () => {
  async function setup() {
    const fixture = TestBed.createComponent(HostComponent);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const dialog: HTMLDialogElement = fixture.nativeElement.querySelector('dialog');
    const setOpen = async (value: boolean) => {
      host.open.set(value);
      await fixture.whenStable();
    };
    return { fixture, host, dialog, setOpen };
  }

  it('opens as a modal and focuses the [data-autofocus] element', async () => {
    const { dialog, setOpen } = await setup();
    const showModal = vi.spyOn(dialog, 'showModal');

    await setOpen(true);

    expect(showModal).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
    expect(document.activeElement?.id).toBe('close');
  });

  it('closes and returns focus to the trigger', async () => {
    const { dialog, setOpen } = await setup();
    await setOpen(true);

    await setOpen(false);

    expect(dialog.open).toBe(false);
    expect(document.activeElement?.id).toBe('trigger');
  });

  it('turns an Escape key press inside the dialog into one dismiss request', async () => {
    const { dialog, host, setOpen } = await setup();
    await setOpen(true);

    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    dialog.querySelector('#close')?.dispatchEvent(esc);

    expect(esc.defaultPrevented).toBe(true); // so the native cancel does not fire a second dismiss
    expect(host.dismissals).toBe(1);
  });

  it('turns the native cancel into a dismiss request without closing by itself', async () => {
    const { dialog, host, setOpen } = await setup();
    await setOpen(true);

    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(host.dismissals).toBe(1);
    expect(dialog.open).toBe(true); // the owner decides
  });

  it('dismisses on a backdrop click but not on a click inside', async () => {
    const { dialog, host, setOpen } = await setup();
    await setOpen(true);

    dialog.querySelector('p')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(host.dismissals).toBe(0);

    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(host.dismissals).toBe(1);
  });

  it('reports a native close that the owner did not ask for', async () => {
    const { dialog, host, setOpen } = await setup();
    await setOpen(true);

    dialog.close();

    expect(host.dismissals).toBe(1);
  });
});
