import { InjectionToken, type Provider, type Type } from '@angular/core';
import type { SceneComponent } from './scene-contract';
import { InteractSceneComponent } from './scenes/interact-scene';
import { QuizSceneComponent } from './scenes/quiz-scene';
import { WatchSceneComponent } from './scenes/watch-scene';

export interface SceneTypeEntry {
  /** Matches `Scene['type']` in the lesson data. */
  readonly type: string;
  readonly component: Type<SceneComponent>;
}

/** All registered scene types (multi provider). Read by SceneHost. */
export const SCENE_TYPES = new InjectionToken<readonly SceneTypeEntry[]>('SceneTypes');

/**
 * Registers scene types. A later registration of the same `type` wins, so an app can override one.
 *
 *   providers: [provideSceneTypes({ type: 'sort', component: SortSceneComponent })]
 */
export function provideSceneTypes(...entries: SceneTypeEntry[]): Provider[] {
  return entries.map((entry) => ({ provide: SCENE_TYPES, useValue: entry, multi: true }));
}

/** The built-in scene types: watch, interact, quiz. */
export function provideDefaultSceneTypes(): Provider[] {
  return provideSceneTypes(
    { type: 'watch', component: WatchSceneComponent as Type<SceneComponent> },
    { type: 'interact', component: InteractSceneComponent as Type<SceneComponent> },
    { type: 'quiz', component: QuizSceneComponent as Type<SceneComponent> },
  );
}
