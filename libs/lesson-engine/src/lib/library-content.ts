import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { Concept, LibraryEntry } from '@jic/shared';
import { ConceptShapeComponent, IconComponent } from '@jic/ui';

/**
 * A lesson's Library entry (projected into the Library panel): title, short sections,
 * examples with concept shapes, and words to know. "Read this page to me" emits the page as text.
 */
@Component({
  selector: 'jic-library-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConceptShapeComponent, IconComponent],
  templateUrl: './library-content.html',
  styleUrl: './library-content.scss',
})
export class LibraryContentComponent {
  readonly entry = input.required<LibraryEntry>();
  readonly concept = input<Concept>('intro');
  /** Show the read-aloud button (only when speech is available). */
  readonly canRead = input(false);
  readonly reading = input(false);
  /** The text to read aloud. */
  readonly readAloud = output<string>();

  /** What "Read this page to me" says: the page in reading order, built from the data. */
  readonly spokenText = computed(() => {
    const { title, sections, examples = [], words = [] } = this.entry();
    const parts = [title, ...sections.flatMap((s) => [s.heading, s.text])];
    if (examples.length) parts.push(...examples.map((e) => `${e.label}: ${e.value}.`));
    if (words.length) parts.push('Words to know.', ...words.map((w) => `${w.term} means ${w.meaning}.`));
    return parts.map((p) => (/[.!?:]$/.test(p) ? p : `${p}.`)).join(' ');
  });

  protected read(): void {
    this.readAloud.emit(this.spokenText());
  }
}
