import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon';

/**
 * Tip (yellow), Library (teal), Read to me (white).
 * Phone: a bottom tab bar of three equal buttons (mockup 13). sm and up: 88px tabs on the right edge.
 * Each open event carries the button, so the dialog can return focus to it.
 */
@Component({
  selector: 'jic-help-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'jic-help-tabs' },
  template: `
    <aside class="tabs" aria-label="Help">
      <button
        #tip
        type="button"
        class="tab tip"
        aria-haspopup="dialog"
        [attr.aria-expanded]="tipOpen()"
        [attr.aria-controls]="tipId()"
        (click)="tipToggle.emit(tip)"
      >
        <jic-icon name="tip" /><span>Tip</span>
      </button>
      <button
        #library
        type="button"
        class="tab library"
        aria-haspopup="dialog"
        [attr.aria-expanded]="libraryOpen()"
        [attr.aria-controls]="libraryId()"
        (click)="libraryToggle.emit(library)"
      >
        <jic-icon name="library" /><span>Library</span>
      </button>
      @if (readAloudAvailable()) {
        <button type="button" class="tab read" [attr.aria-pressed]="reading()" (click)="readAloud.emit()">
          <jic-icon name="speaker" /><span>Read to me</span>
        </button>
      }
    </aside>
  `,
  styleUrl: './help-tabs.scss',
})
export class HelpTabsComponent {
  readonly tipOpen = input(false);
  readonly libraryOpen = input(false);
  readonly tipId = input('jic-tip');
  readonly libraryId = input('jic-library');
  /** Hide "Read to me" when the browser has no speech synthesis. */
  readonly readAloudAvailable = input(true);
  readonly reading = input(false);

  readonly tipToggle = output<HTMLElement>();
  readonly libraryToggle = output<HTMLElement>();
  readonly readAloud = output<void>();
}
