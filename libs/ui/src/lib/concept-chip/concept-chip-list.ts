import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { Concept } from '@jic/shared';
import { ConceptChipComponent } from './concept-chip';

let nextId = 0;

/**
 * "Jars can hold:" followed by concept chips.
 * Phone: one row that scrolls sideways (no visible scrollbar). sm and up: wraps.
 *
 * While the row actually scrolls, it becomes focusable (tabindex 0) so keyboard users can
 * scroll it with the arrow keys (WCAG 2.1.1, axe "scrollable-region-focusable"). When it wraps,
 * there is nothing to scroll and no extra tab stop.
 */
@Component({
  selector: 'jic-concept-chip-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConceptChipComponent],
  template: `
    <span class="label" [id]="labelId">{{ label() }}</span>
    <ul #list class="chips" [attr.aria-labelledby]="labelId" [attr.tabindex]="scrollable() ? 0 : null">
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
  /**
   * Until measured, the row is assumed to scroll (as on a phone): a moment's extra tab stop on a wide
   * screen is harmless, a scrolling row keyboard users can't reach is not. The prerendered HTML
   * (ADR 0014) can't measure at all, and hydration must not drop the tab stop before the first
   * measurement.
   */
  protected readonly scrollable = signal(true);
  private readonly list = viewChild<ElementRef<HTMLUListElement>>('list');

  constructor() {
    // A ResizeObserver reports once after first layout and again on every resize,
    // so no render hook is needed. (Absent on the server and in very old browsers: stay a tab stop.)
    if (typeof ResizeObserver === 'undefined') return;
    const host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const observer = new ResizeObserver(() => {
      const el = this.list()?.nativeElement;
      if (el) this.scrollable.set(el.scrollWidth > el.clientWidth + 1);
    });
    observer.observe(host);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
