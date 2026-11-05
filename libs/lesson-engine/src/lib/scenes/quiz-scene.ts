import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { QuizOption, QuizScene, Visual } from '@jic/shared';
import {
  ChoiceButtonComponent,
  ChoiceRowComponent,
  QuizFeedbackComponent,
  type QuizFeedbackStatus,
  StageComponent,
} from '@jic/ui';
import { DotCharacterComponent, VisualComponent } from '@jic/visuals';
import { EMPTY_SCENE_STATE, type SceneAction, type SceneComponent, type SceneState } from '../scene-contract';

/**
 * One friendly question. Every answer gets kind feedback (in a polite live region), the child
 * can try again as often as they like, and Next never waits for the right answer: no failing.
 */
@Component({
  selector: 'jic-quiz-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StageComponent,
    DotCharacterComponent,
    VisualComponent,
    ChoiceRowComponent,
    ChoiceButtonComponent,
    QuizFeedbackComponent,
  ],
  template: `
    <jic-stage [bubble]="scene().question">
      <jic-dot-character jicStageCharacter [pose]="status() === 'correct' ? 'cheering' : 'happy'" />
      @if (artVisual(); as visual) {
        <jic-visual jicStageArt [visual]="visual" />
      }
    </jic-stage>
    <jic-choice-row label="Pick an answer:">
      @for (option of scene().options; track option.id) {
        <button
          type="button"
          jic-choice-button
          [concept]="option.concept"
          [pressed]="option.id === answered()?.id"
          (click)="action.emit({ kind: 'answer', id: option.id })"
        >
          {{ option.label }}
        </button>
      }
    </jic-choice-row>
    <jic-quiz-feedback [status]="status()" [text]="answered()?.feedback ?? ''" />
  `,
  styleUrl: './scene.scss',
})
export class QuizSceneComponent implements SceneComponent<QuizScene> {
  readonly scene = input.required<QuizScene>();
  readonly state = input<SceneState>(EMPTY_SCENE_STATE);
  readonly action = output<SceneAction>();

  /**
   * The picture, unless there is none or it is Dot (Dot is already the speaker). One computed
   * value keeps a single element as the @if block's root, which is what content projection
   * into the stage's art slot relies on.
   */
  readonly artVisual = computed<Visual | null>(() => {
    const visual = this.scene().visual;
    return visual && visual.kind !== 'dot' ? visual : null;
  });

  readonly answered = computed<QuizOption | null>(
    () => this.scene().options.find((o) => o.id === this.state().answeredOptionId) ?? null,
  );
  readonly status = computed<QuizFeedbackStatus | null>(() => {
    const a = this.answered();
    return a ? (a.correct ? 'correct' : 'try-again') : null;
  });
}
