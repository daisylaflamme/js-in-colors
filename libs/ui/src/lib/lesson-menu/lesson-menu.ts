import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Concept } from '@jic/shared';
import { AppLogoComponent } from '../app-logo/app-logo';
import { ConceptShapeComponent } from '../concept-shape/concept-shape';
import { IconComponent } from '../icon/icon';

export interface LessonMenuItem {
  readonly id: string;
  /** Kid-friendly name, e.g. "Variables" or "Say it out loud". */
  readonly title: string;
  /** The real JavaScript topic, e.g. "Output". */
  readonly subtitle: string;
  readonly concept: Concept;
  readonly link: string | readonly unknown[];
  readonly finished: boolean;
}

let nextId = 0;

/**
 * The left lesson menu: logo, color-path progress, the lessons, and the
 * "No account needed" card. Presentational: the shell decides where it lives
 * (inline at lg, inside an overlay below lg).
 */
@Component({
  selector: 'jic-lesson-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppLogoComponent, ConceptShapeComponent, IconComponent],
  templateUrl: './lesson-menu.html',
  styleUrl: './lesson-menu.scss',
  host: { class: 'jic-lesson-menu', '[class.compact]': 'compact()' },
})
export class LessonMenuComponent {
  readonly lessons = input.required<readonly LessonMenuItem[]>();
  readonly currentId = input<string>();
  readonly resumeCode = input<string>();
  /** Where the logo and "Your color path" link to (Home). No link when unset. */
  readonly homeLink = input<string>();
  /** Shows the X button (overlay mode). */
  readonly closable = input(false);
  /** Hides subtitles to fit the phone overlay (mockup 14). */
  readonly compact = input(false);

  readonly closeRequested = output<void>();
  /** Emits after a lesson link is activated, so an overlay can close itself. */
  readonly lessonChosen = output<string>();

  protected readonly progressLabelId = `jic-color-path-${nextId++}`;
  protected readonly finishedCount = computed(() => this.lessons().filter((l) => l.finished).length);
  protected readonly total = computed(() => this.lessons().length);
  protected readonly percent = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.finishedCount() / this.total()) * 100),
  );
}
