import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import type { Concept } from '@jic/shared';
import { ConceptShapeComponent } from '../concept-shape/concept-shape';
import { IconComponent } from '../icon/icon';

let nextId = 0;

/**
 * Shown after the last scene. Its heading takes focus when it appears, so keyboard and
 * screen-reader users land on the news ("You finished Variables!") and the next steps.
 */
@Component({
  selector: 'jic-lesson-done-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConceptShapeComponent, IconComponent],
  template: `
    <section class="card" [attr.aria-labelledby]="headingId">
      <div class="badge" aria-hidden="true">
        <jic-concept-shape [concept]="concept()" [size]="56" />
      </div>
      <h2 #heading [id]="headingId" tabindex="-1">You finished {{ lessonTitle() }}!</h2>
      <p class="message">{{ message() }}</p>
      <div class="actions">
        @if (nextTitle(); as next) {
          <button type="button" class="next" (click)="nextLesson.emit()">
            Next lesson: {{ next }} <jic-icon name="arrow-right" />
          </button>
        }
        <button type="button" class="again" (click)="restart.emit()">
          <jic-icon name="retry" /> Start again
        </button>
        <button type="button" class="back" (click)="back.emit()">Back to the last scene</button>
      </div>
    </section>
  `,
  styleUrl: './lesson-done-card.scss',
})
export class LessonDoneCardComponent {
  readonly lessonTitle = input.required<string>();
  readonly concept = input<Concept>('intro');
  readonly message = input('Great job. You can try the next lesson or play this one again.');
  /** Title of the next ready lesson; no button when there is none. */
  readonly nextTitle = input<string>();

  readonly nextLesson = output<void>();
  readonly restart = output<void>();
  readonly back = output<void>();

  protected readonly headingId = `jic-done-title-${nextId++}`;
  private readonly heading = viewChild.required<ElementRef<HTMLHeadingElement>>('heading');

  constructor() {
    afterNextRender(() => this.heading().nativeElement.focus());
  }
}
