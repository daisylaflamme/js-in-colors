import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { WatchScene } from '@jic/shared';
import { CodePanelComponent, CodePeekToggleComponent, ReplayButtonComponent, StageComponent } from '@jic/ui';
import { DotCharacterComponent, VisualComponent } from '@jic/visuals';
import { EMPTY_SCENE_STATE, type SceneAction, type SceneComponent, type SceneState } from '../scene-contract';
import { codePanelData, codePanelId } from './code-peek';

/**
 * An animated explanation: Dot says one thing while the picture animates once.
 * "Play again" replays it. No autoplay loops and no timed text; with reduced or calm motion
 * the picture is shown in its final state.
 */
@Component({
  selector: 'jic-watch-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StageComponent,
    DotCharacterComponent,
    VisualComponent,
    ReplayButtonComponent,
    CodePeekToggleComponent,
    CodePanelComponent,
  ],
  template: `
    <jic-stage [bubble]="scene().bubble">
      <jic-dot-character jicStageCharacter />
      @if (scene().visual.kind !== 'dot') {
        <jic-visual jicStageArt [visual]="scene().visual" [replayKey]="replays()" />
      }
    </jic-stage>
    <div class="controls">
      <button type="button" jic-replay-button (click)="replay()"></button>
      @if (code()) {
        <div class="controls-end">
          <button
            type="button"
            jic-code-peek-toggle
            [controls]="panelId"
            [expanded]="peekOpen()"
            (click)="peekOpen.set(!peekOpen())"
          ></button>
        </div>
      }
    </div>
    @if (peekOpen() && code(); as c) {
      <jic-code-panel [id]="panelId" [code]="c.tokens" [notes]="c.notes" />
    }
  `,
  styleUrl: './scene.scss',
})
export class WatchSceneComponent implements SceneComponent<WatchScene> {
  readonly scene = input.required<WatchScene>();
  readonly state = input<SceneState>(EMPTY_SCENE_STATE);
  readonly action = output<SceneAction>();

  protected readonly replays = signal(0);
  protected readonly peekOpen = signal(false);
  protected readonly panelId = codePanelId();
  protected readonly code = computed(() => {
    const { code, notes } = this.scene();
    return code ? codePanelData(code, notes) : null;
  });
  /** Exposed for tests: the visual's final state is always what is rendered; motion only animates into it. */
  readonly finalVisual = computed(() => this.scene().visual);

  protected replay(): void {
    this.replays.update((n) => n + 1);
  }
}
