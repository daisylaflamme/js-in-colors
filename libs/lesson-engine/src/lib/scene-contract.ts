import type { InputSignal, OutputEmitterRef } from '@angular/core';
import type { Scene } from '@jic/shared';

/** What the smart page knows about the current scene (from the LessonStore). */
export interface SceneState {
  /** Interact scenes: the picked choice (the first one is pre-picked). */
  readonly pickedChoiceId: string | null;
  /** Quiz scenes: the last option answered, if any. */
  readonly answeredOptionId: string | null;
}

export const EMPTY_SCENE_STATE: SceneState = { pickedChoiceId: null, answeredOptionId: null };

/** Everything a scene can ask the page to do. */
export type SceneAction =
  { readonly kind: 'pick'; readonly id: string } | { readonly kind: 'answer'; readonly id: string };

/**
 * The contract every scene-type component implements. The SceneHost creates scene components
 * dynamically and binds exactly these three members, so a new scene type is one component that
 * implements this interface plus one `provideSceneTypes()` entry. Scene components are
 * presentational: data in through `scene`/`state`, intent out through `action`.
 */
export interface SceneComponent<S extends Scene = Scene> {
  readonly scene: InputSignal<S>;
  readonly state: InputSignal<SceneState>;
  readonly action: OutputEmitterRef<SceneAction>;
}
