import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, map, of, startWith } from 'rxjs';

/** Mirrors $breakpoints in styles/settings/_breakpoints.scss. */
export const BREAKPOINTS = { sm: 600, md: 900, lg: 1200 } as const;
export type Layout = 'phone' | 'tablet' | 'desktop';

const MENU_KEY = 'jic.menuOpen';

/**
 * Local UI state of the app shell (signals, not a store):
 *  - layout: phone (< sm), tablet (sm..lg), desktop (>= lg), from matchMedia
 *  - the lesson menu: inline and open by default on desktop (the choice is remembered),
 *    an overlay that starts closed below lg (mockups 12, 14)
 */
@Injectable({ providedIn: 'root' })
export class ShellState {
  private readonly window = inject(DOCUMENT).defaultView;

  private readonly isSm = this.mediaSignal(`(min-width: ${BREAKPOINTS.sm}px)`);
  private readonly isLg = this.mediaSignal(`(min-width: ${BREAKPOINTS.lg}px)`);

  readonly layout = computed<Layout>(() => (this.isLg() ? 'desktop' : this.isSm() ? 'tablet' : 'phone'));
  readonly isDesktop = computed(() => this.layout() === 'desktop');

  private readonly desktopMenuOpen = signal(this.readStoredMenuChoice() ?? true);
  private readonly overlayOpen = signal(false);

  /** Whether the lesson menu is visible right now (inline or as an overlay). */
  readonly menuOpen = computed(() => (this.isDesktop() ? this.desktopMenuOpen() : this.overlayOpen()));
  /** The menu is drawn inline (desktop, open) rather than as an overlay. */
  readonly menuInline = computed(() => this.isDesktop() && this.desktopMenuOpen());
  readonly overlayMenuOpen = computed(() => !this.isDesktop() && this.overlayOpen());

  /** Button that opened the overlay, for returning focus. */
  readonly menuTrigger = signal<HTMLElement | null>(null);

  constructor() {
    // Never carry an open overlay into the desktop layout.
    effect(() => {
      if (this.isDesktop()) this.overlayOpen.set(false);
    });
  }

  toggleMenu(trigger: EventTarget | null = null): void {
    if (this.isDesktop()) {
      const next = !this.desktopMenuOpen();
      this.desktopMenuOpen.set(next);
      this.storeMenuChoice(next);
    } else {
      this.menuTrigger.set(trigger instanceof HTMLElement ? trigger : null);
      this.overlayOpen.update((open) => !open);
    }
  }

  closeOverlayMenu(): void {
    this.overlayOpen.set(false);
  }

  private mediaSignal(query: string) {
    const mql = this.window?.matchMedia?.(query);
    const changes$ = mql
      ? fromEvent<MediaQueryListEvent>(mql, 'change').pipe(
          map((e) => e.matches),
          startWith(mql.matches),
        )
      : of(false);
    return toSignal(changes$, { requireSync: true });
  }

  // localStorage can throw (private mode, blocked storage). The menu choice is a nicety: ignore failures.
  private readStoredMenuChoice(): boolean | null {
    try {
      const v = this.window?.localStorage.getItem(MENU_KEY);
      return v === null || v === undefined ? null : v === 'true';
    } catch {
      return null;
    }
  }

  private storeMenuChoice(open: boolean): void {
    try {
      this.window?.localStorage.setItem(MENU_KEY, String(open));
    } catch {
      /* ignore */
    }
  }
}
