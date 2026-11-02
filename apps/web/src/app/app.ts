import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { LessonMenuComponent, type LessonMenuItem, OverlayPanelComponent } from '@jic/ui';
import { LESSONS } from './lessons/lesson-catalog';
import { ShellState } from './shell/shell-state';

/**
 * The app shell (smart). Owns layout and where the lesson menu lives:
 * inline beside the page on desktop, a modal overlay below lg.
 * The page itself is routed into <main>.
 */
@Component({
  selector: 'jic-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, LessonMenuComponent, OverlayPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: { '[class.menu-inline]': 'shell.menuInline()' },
})
export class App {
  protected readonly shell = inject(ShellState);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  protected readonly resumeCode = 'blue-fox-42'; // PLACEHOLDER until the resume-code milestone

  protected readonly menuItems: readonly LessonMenuItem[] = LESSONS.map((l) => ({
    id: l.id,
    title: l.title,
    subtitle: l.topic,
    concept: l.concept,
    link: ['/lesson', l.id],
    finished: l.finished,
  }));

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly currentLessonId = computed(() => /^\/lesson\/([^/?#]+)/.exec(this.url())?.[1]);
  protected readonly compactMenu = computed(() => this.shell.layout() === 'phone');

  /** With <base href="/">, a bare #main link would leave the page. Move focus instead. */
  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.document.getElementById('main')?.focus();
  }
}
