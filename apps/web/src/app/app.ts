import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core';
import { type ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { LessonMenuComponent, type LessonMenuItem, OverlayPanelComponent } from '@jic/ui';
import { CourseStore } from '@jic/data-access';
import type { ShellRouteData } from './app.routes';
import { ShellState } from './shell/shell-state';

const deepest = (route: ActivatedRouteSnapshot): ActivatedRouteSnapshot =>
  route.firstChild ? deepest(route.firstChild) : route;

/**
 * The app shell (smart). Owns layout and where the lesson menu lives:
 * inline beside the page on desktop, a modal overlay below lg, and none on full pages (Home).
 * The page itself is routed into <main>.
 */
@Component({
  selector: 'jic-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, LessonMenuComponent, OverlayPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '[class.menu-inline]': 'menuInline()',
    // Only in the prerendered HTML (ADR 0014): removed when the app starts in the browser.
    '[attr.data-prerendered]': 'shell.prerendering ? "" : null',
  },
})
export class App {
  protected readonly shell = inject(ShellState);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  protected readonly course = inject(CourseStore);

  /** The menu, from content/course.yaml, with progress saved on this device. */
  protected readonly menuItems = computed<readonly LessonMenuItem[]>(() => {
    const finished = this.course.finishedIds();
    return this.course.lessons().map((l) => ({
      id: l.id,
      title: l.title,
      subtitle: l.status === 'ready' ? l.topic : `${l.topic} · Coming soon`,
      concept: l.concept,
      link: ['/lesson', l.id],
      finished: finished.includes(l.id),
    }));
  });

  private readonly navigation = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => ({
        url: e.urlAfterRedirects,
        data: deepest(this.router.routerState.snapshot.root).data as ShellRouteData,
      })),
    ),
    { initialValue: { url: this.router.url, data: {} as ShellRouteData } },
  );

  protected readonly currentLessonId = computed(
    () => /^\/lesson\/([^/?#]+)/.exec(this.navigation().url)?.[1],
  );
  /** Pages such as Home draw their own header and have no lesson menu. */
  protected readonly fullPage = computed(() => this.navigation().data.shell === 'full');
  protected readonly menuInline = computed(() => this.shell.menuInline() && !this.fullPage());
  protected readonly compactMenu = computed(() => this.shell.layout() === 'phone');

  constructor() {
    // Any navigation (a lesson link, the logo, "Your color path") closes the overlay menu.
    effect(() => {
      this.navigation();
      untracked(() => this.shell.closeOverlayMenu());
    });
  }

  /** With <base href="/">, a bare #main link would leave the page. Move focus instead. */
  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.document.getElementById('main')?.focus();
  }
}
