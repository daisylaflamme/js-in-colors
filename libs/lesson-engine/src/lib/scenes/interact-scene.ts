import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CONCEPT_INFO, type Choice, type InteractScene, type Visual } from '@jic/shared';
import {
  ChoiceButtonComponent,
  ChoiceRowComponent,
  CodePanelComponent,
  CodePeekToggleComponent,
  StageComponent,
} from '@jic/ui';
import { DotCharacterComponent, VisualComponent } from '@jic/visuals';
import { EMPTY_SCENE_STATE, type SceneAction, type SceneComponent, type SceneState } from '../scene-contract';
import { codePanelData, codePanelId } from './code-peek';

/**
 * Pick a choice: the picture, Dot's bubble and the code line all change together.
 * The first choice is picked when the scene opens (Next is never blocked).
 */
@Component({
  selector: 'jic-interact-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StageComponent,
    DotCharacterComponent,
    VisualComponent,
    ChoiceRowComponent,
    ChoiceButtonComponent,
    CodePeekToggleComponent,
    CodePanelComponent,
  ],
  template: `
    <jic-stage [bubble]="picked().bubble">
      <jic-dot-character jicStageCharacter />
      <jic-visual jicStageArt [visual]="visual()" />
    </jic-stage>
    <jic-choice-row [label]="scene().prompt">
      @for (choice of scene().choices; track choice.id) {
        <button
          type="button"
          jic-choice-button
          [concept]="choice.concept"
          [pressed]="choice.id === picked().id"
          (click)="action.emit({ kind: 'pick', id: choice.id })"
        >
          {{ choice.label }}
          <span class="u-visually-hidden">({{ kidWord(choice) }})</span>
        </button>
      }
      <button
        type="button"
        jic-code-peek-toggle
        jicChoiceRowEnd
        [controls]="panelId"
        [expanded]="peekOpen()"
        (click)="peekOpen.set(!peekOpen())"
      ></button>
    </jic-choice-row>
    @if (peekOpen()) {
      <jic-code-panel [id]="panelId" [code]="code().tokens" [notes]="code().notes" />
    }
  `,
  styleUrl: './scene.scss',
})
export class InteractSceneComponent implements SceneComponent<InteractScene> {
  readonly scene = input.required<InteractScene>();
  readonly state = input<SceneState>(EMPTY_SCENE_STATE);
  readonly action = output<SceneAction>();

  readonly picked = computed<Choice>(() => {
    const { choices } = this.scene();
    return choices.find((c) => c.id === this.state().pickedChoiceId) ?? choices[0];
  });

  protected readonly peekOpen = signal(false);
  protected readonly panelId = codePanelId();
  readonly code = computed(() => codePanelData(this.picked().code, this.scene().notes));

  /** The scene's picture, showing the picked value. */
  readonly visual = computed<Visual>(() => {
    const visual = this.scene().visual;
    const choice = this.picked();
    switch (visual.kind) {
      case 'jar':
        return { ...visual, value: choice.value, concept: choice.concept };
      case 'screen':
        return { ...visual, lines: choice.lines ?? [choice.value] };
      case 'machine':
        return { ...visual, input: choice.value, output: choice.result, concept: choice.concept };
      case 'fork':
        return { ...visual, take: choice.path };
      default:
        return visual;
    }
  });

  protected kidWord(choice: Choice): string {
    return CONCEPT_INFO[choice.concept].kidWord;
  }
}
