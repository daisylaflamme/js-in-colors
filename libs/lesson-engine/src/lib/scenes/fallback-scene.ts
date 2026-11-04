import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Scene } from '@jic/shared';
import { StageComponent } from '@jic/ui';
import { DotCharacterComponent } from '@jic/visuals';
import { EMPTY_SCENE_STATE, type SceneAction, type SceneComponent, type SceneState } from '../scene-contract';

/** Shown when no component is registered for a scene type. Kind, never a crash. */
@Component({
  selector: 'jic-fallback-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StageComponent, DotCharacterComponent],
  template: `
    <jic-stage bubble="This part of the lesson is not ready yet. Press Next to go on!">
      <jic-dot-character jicStageCharacter />
    </jic-stage>
  `,
  styleUrl: './scene.scss',
})
export class FallbackSceneComponent implements SceneComponent {
  readonly scene = input.required<Scene>();
  readonly state = input<SceneState>(EMPTY_SCENE_STATE);
  readonly action = output<SceneAction>();
}
