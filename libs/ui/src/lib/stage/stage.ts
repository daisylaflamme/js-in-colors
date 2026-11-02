import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The big white card where a scene happens.
 * Slots: `[jicStageCharacter]` (Dot), `[jicStageArt]` (the interactive picture).
 * The speech bubble is a polite live region, so screen readers hear changes.
 *
 * Layout follows the space the stage actually has (container query), not the
 * viewport: stacked when narrow, character beside the art when wide.
 */
@Component({
  selector: 'jic-stage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'jic-stage' },
  template: `
    <div class="inner">
      <div class="speaker">
        <ng-content select="[jicStageCharacter]" />
        <p class="bubble" aria-live="polite">{{ bubble() }}</p>
      </div>
      <div class="art">
        <ng-content select="[jicStageArt]" />
      </div>
    </div>
  `,
  styleUrl: './stage.scss',
})
export class StageComponent {
  /** What Dot says. Changing it is announced. */
  readonly bubble = input('');
}
