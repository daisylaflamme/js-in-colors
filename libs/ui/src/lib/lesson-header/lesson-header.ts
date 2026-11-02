import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Concept } from '@jic/shared';
import { AppLogoComponent } from '../app-logo/app-logo';

/**
 * Top bar (hamburger slot, logo, "Lesson 3 of 10") + the lesson title and one-sentence lead.
 * Project the hamburger with the `jicHeaderStart` attribute.
 */
@Component({
  selector: 'jic-lesson-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLogoComponent],
  templateUrl: './lesson-header.html',
  styleUrl: './lesson-header.scss',
  host: { class: 'jic-lesson-header', '[style.--concept-text]': 'conceptText()' },
})
export class LessonHeaderComponent {
  readonly lessonNumber = input.required<number>();
  readonly lessonCount = input.required<number>();
  readonly title = input.required<string>();
  readonly lead = input.required<string>();
  /** A word inside `lead` drawn in the concept color, e.g. "jar". */
  readonly leadHighlight = input<string>();
  readonly concept = input.required<Concept>();
  /** Show the small logo beside the hamburger (when the menu is closed). */
  readonly showLogo = input(true);

  protected readonly conceptText = computed(() => `var(--color-${this.concept()}-text)`);

  /** Splits the lead around the first match of the highlight word. */
  protected readonly leadParts = computed(() => {
    const lead = this.lead();
    const word = this.leadHighlight();
    const at = word ? lead.indexOf(word) : -1;
    if (!word || at < 0) return { before: lead, word: '', after: '' };
    return { before: lead.slice(0, at), word, after: lead.slice(at + word.length) };
  });
}
