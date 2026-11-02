import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Back (outlined) · scene dots + "Scene 3 of 5" · Next (yellow, the one primary action).
 * The dots are decorative; the text carries the meaning.
 */
@Component({
  selector: 'jic-scene-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jic-scene-nav' },
  template: `
    <button type="button" class="back" [disabled]="scene() <= 1" (click)="back.emit()">Back</button>
    <div class="progress">
      <span class="dots" aria-hidden="true">
        @for (d of dots(); track d) {
          <span class="dot" [class.done]="d < scene()" [class.current]="d === scene()"></span>
        }
      </span>
      <span class="label">Scene {{ scene() }} of {{ sceneCount() }}</span>
    </div>
    <button type="button" class="next" (click)="next.emit()">{{ nextLabel() }}</button>
  `,
  styleUrl: './scene-nav.scss',
})
export class SceneNavComponent {
  /** 1-based. */
  readonly scene = input.required<number>();
  readonly sceneCount = input.required<number>();
  readonly nextLabel = input('Next');

  readonly back = output<void>();
  readonly next = output<void>();

  protected readonly dots = computed(() => Array.from({ length: this.sceneCount() }, (_, i) => i + 1));
}
