import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

setupTestBed({ zoneless: true, errorOnUnknownElements: true, errorOnUnknownProperties: true });

// jsdom has no <dialog> behavior. This tiny stand-in is enough to test our state and focus logic;
// real modal behavior (top layer, inert page, Esc) is covered by the Cypress smoke test.
const proto = HTMLDialogElement.prototype as HTMLDialogElement & { __jicPolyfill?: true };
if (typeof proto.showModal !== 'function') {
  proto.__jicPolyfill = true;
  proto.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto.show = proto.showModal;
  proto.close = function (this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
  Object.defineProperty(proto, 'open', {
    configurable: true,
    get(this: HTMLDialogElement) {
      return this.hasAttribute('open');
    },
  });
}
