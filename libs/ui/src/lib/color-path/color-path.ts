import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Concept } from '@jic/shared';
import { ConceptShapeComponent } from '../concept-shape/concept-shape';
import { IconComponent } from '../icon/icon';

/** How a lesson looks on the path. */
export type ColorPathState = 'finished' | 'current' | 'todo' | 'soon';

export interface ColorPathNode {
  readonly id: string;
  readonly title: string;
  /** The real JavaScript word, e.g. "Variables". */
  readonly topic: string;
  readonly concept: Concept;
  readonly link: string | readonly unknown[];
  readonly state: ColorPathState;
}

/**
 * The home "color path" (mockup 08): every lesson as its concept shape, in order, ending in
 * the certificate star. Phone and tablet: one lesson per row, joined by a line. lg: the zigzag.
 * The line between two lessons is solid once the first is finished, dotted before.
 *
 * Content marked `jicPathGuide` (Dot) is drawn beside the current lesson.
 * Every lesson is a link (no locks); the star is not, until the certificate exists.
 */
@Component({
  selector: 'jic-color-path',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ConceptShapeComponent, IconComponent],
  templateUrl: './color-path.html',
  styleUrl: './color-path.scss',
  host: { class: 'jic-color-path', '[style.--stops]': 'nodes().length + 1' },
})
export class ColorPathComponent {
  readonly nodes = input.required<readonly ColorPathNode[]>();
  readonly label = input('Your color path');
  readonly goalTitle = input('Your certificate!');
  readonly goalNote = input<string>();

  /** Solid when the walk to the next stop has been made (this lesson finished). */
  protected readonly walked = computed(() => this.nodes().map((n) => n.state === 'finished'));
}
