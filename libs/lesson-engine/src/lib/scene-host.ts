import {
  ChangeDetectionStrategy,
  Component,
  type ComponentRef,
  effect,
  inject,
  input,
  inputBinding,
  output,
  outputBinding,
  untracked,
  ViewContainerRef,
  viewChild,
} from '@angular/core';
import type { Scene } from '@jic/shared';
import { EMPTY_SCENE_STATE, type SceneAction, type SceneState } from './scene-contract';
import { SCENE_TYPES } from './scene-registry';
import { FallbackSceneComponent } from './scenes/fallback-scene';

/**
 * Renders one scene from lesson data, choosing the component from the scene-type registry.
 * A new scene (different id) gets a fresh component, so animations and local state (like
 * "Peek at the code") start over. Inputs and the action output are bound with
 * inputBinding/outputBinding, so they stay live and typed.
 */
@Component({
  selector: 'jic-scene-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container #outlet />`,
  host: { class: 'jic-scene-host', '[attr.data-scene-type]': 'scene().type' },
  styles: `
    :host {
      display: grid;
      gap: var(--space-4);
    }
  `,
})
export class SceneHostComponent {
  readonly scene = input.required<Scene>();
  readonly state = input<SceneState>(EMPTY_SCENE_STATE);
  readonly action = output<SceneAction>();

  private readonly registry = new Map(
    (inject(SCENE_TYPES, { optional: true }) ?? []).map((e) => [e.type, e.component]),
  );
  private readonly outlet = viewChild.required('outlet', { read: ViewContainerRef });
  private ref: ComponentRef<unknown> | null = null;
  private renderedKey = '';

  constructor() {
    effect(() => {
      const scene = this.scene();
      const outlet = this.outlet();
      const key = `${scene.type}:${scene.id}`;
      if (key === this.renderedKey) return;
      this.renderedKey = key;
      untracked(() => {
        outlet.clear();
        const component = this.registry.get(scene.type) ?? FallbackSceneComponent;
        this.ref = outlet.createComponent(component, {
          bindings: [
            inputBinding('scene', this.scene),
            inputBinding('state', this.state),
            outputBinding<SceneAction>('action', (a) => this.action.emit(a)),
          ],
        });
      });
    });
  }

  /** The rendered scene component instance (tests and debugging). */
  get current(): unknown {
    return this.ref?.instance ?? null;
  }
}
