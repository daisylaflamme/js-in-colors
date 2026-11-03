import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  CourseStore,
  nextTextSize,
  selectCalmMotion,
  selectTextSize,
  SettingsActions,
  type TextSize,
} from '@jic/data-access';
import type { Concept, CourseLesson } from '@jic/shared';
import {
  AppLogoComponent,
  type ColorPathNode,
  ColorPathComponent,
  ConceptChipListComponent,
  type CopyState,
  IconComponent,
  ResumeCodePillComponent,
  SettingToggleComponent,
} from '@jic/ui';
import { DotCharacterComponent } from '@jic/visuals';

const TEXT_SIZE_WORDS: Record<TextSize, string> = { normal: 'Normal', large: 'Bigger', larger: 'Biggest' };

/** The concepts in "What the colors mean" (mockup 08): the seven with a settled color. */
const LEGEND: readonly Concept[] = ['number', 'string', 'boolean', 'object', 'array', 'function', 'variable'];

interface ContinueAction {
  readonly verb: 'Start' | 'Continue' | 'Visit again';
  readonly lesson: CourseLesson;
}

/**
 * Home: the color path (mockup 08). Smart: reads progress from the CourseStore and settings
 * from the classic Store, and does the clipboard work for the resume code pill.
 * Only mocked at desktop; smaller screens stack in one column (docs/mockups/README.md).
 */
@Component({
  selector: 'jic-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    AppLogoComponent,
    ColorPathComponent,
    ConceptChipListComponent,
    DotCharacterComponent,
    IconComponent,
    ResumeCodePillComponent,
    SettingToggleComponent,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  protected readonly course = inject(CourseStore);
  private readonly store = inject(Store);
  private readonly window = inject(DOCUMENT).defaultView;

  protected readonly legend = LEGEND;
  protected readonly calmMotion = this.store.selectSignal(selectCalmMotion);
  private readonly textSize = this.store.selectSignal(selectTextSize);
  protected readonly textSizeWord = computed(() => TEXT_SIZE_WORDS[this.textSize()]);
  protected readonly copyState = signal<CopyState>('idle');
  /** Announced after the Text size button changes (its new name is not always read out). */
  protected readonly settingsStatus = signal('');

  protected readonly continueAction = computed<ContinueAction | undefined>(() => {
    const next = this.course.continueLesson();
    if (next) return { verb: this.course.isNewVisitor() ? 'Start' : 'Continue', lesson: next };
    const first = this.course.readyLessons()[0];
    return first ? { verb: 'Visit again', lesson: first } : undefined;
  });

  /** Every ready lesson is finished. */
  protected readonly allDone = computed(
    () => !this.course.continueLesson() && this.course.finishedCount() > 0,
  );

  protected readonly lead = computed(() => {
    const n = this.course.finishedCount();
    if (this.course.isNewVisitor()) return 'Every idea in JavaScript has its own color. Let’s explore them!';
    if (this.allDone()) return 'You opened every jar so far. More lessons are coming soon!';
    if (n === 0) return 'Your first jar is waiting for you.';
    return `You opened ${n} ${n === 1 ? 'jar' : 'jars'} of knowledge. Ready for the next one?`;
  });

  protected readonly pathNodes = computed<readonly ColorPathNode[]>(() =>
    this.course.pathLessons().map((l) => ({
      id: l.id,
      title: l.title,
      topic: l.topic,
      concept: l.concept,
      link: ['/lesson', l.id],
      state: l.state,
    })),
  );

  protected toggleCalmMotion(): void {
    this.store.dispatch(SettingsActions.calmMotionToggled());
  }

  protected cycleTextSize(): void {
    const textSize = nextTextSize(this.textSize());
    this.store.dispatch(SettingsActions.textSizeChanged({ textSize }));
    this.settingsStatus.set(`Text size: ${TEXT_SIZE_WORDS[textSize]}`);
  }

  protected async copyResumeCode(): Promise<void> {
    try {
      const clipboard = this.window?.navigator.clipboard;
      if (!clipboard) throw new Error('No clipboard');
      await clipboard.writeText(this.course.resumeCode());
      this.copyState.set('copied');
    } catch {
      this.copyState.set('failed');
    }
  }
}
