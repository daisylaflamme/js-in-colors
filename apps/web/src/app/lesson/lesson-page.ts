import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CONCEPT_INFO } from '@jic/shared';
import {
  ChoiceButtonComponent,
  ChoiceRowComponent,
  CodePanelComponent,
  CodePeekToggleComponent,
  ConceptChipListComponent,
  ConceptShapeComponent,
  HelpTabsComponent,
  IconComponent,
  LessonHeaderComponent,
  LibraryPanelComponent,
  MenuButtonComponent,
  SceneNavComponent,
  StageComponent,
  TipCardComponent,
} from '@jic/ui';
import { DEFAULT_LESSON_ID, findLesson, LESSONS, lessonNumber } from '../lessons/lesson-catalog';
import { ShellState } from '../shell/shell-state';
import { SpeechService } from '../shell/speech.service';
import { DotCharacterComponent, JarVisualComponent } from '@jic/visuals';
import { codeLine, codeNotes, DEMO_SCENE, type DemoChoice } from './demo-scene';

/**
 * The lesson screen (smart component). Lazy-loaded by /lesson/:lessonId.
 * Owns the scene's local UI state in signals: picked choice, peek, tip, library.
 * Content is PLACEHOLDER (see demo-scene.ts) until the lesson engine exists.
 */
@Component({
  selector: 'jic-lesson-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ChoiceButtonComponent,
    ChoiceRowComponent,
    CodePanelComponent,
    CodePeekToggleComponent,
    ConceptChipListComponent,
    ConceptShapeComponent,
    DotCharacterComponent,
    HelpTabsComponent,
    IconComponent,
    JarVisualComponent,
    LessonHeaderComponent,
    LibraryPanelComponent,
    MenuButtonComponent,
    SceneNavComponent,
    StageComponent,
    TipCardComponent,
  ],
  templateUrl: './lesson-page.html',
  styleUrl: './lesson-page.scss',
})
export class LessonPage {
  protected readonly shell = inject(ShellState);
  protected readonly speech = inject(SpeechService);

  /** From the route (withComponentInputBinding). */
  readonly lessonId = input(DEFAULT_LESSON_ID);

  protected readonly lesson = computed(() => findLesson(this.lessonId()) ?? LESSONS[2]);
  protected readonly number = computed(() => lessonNumber(this.lesson().id));
  protected readonly lessonCount = LESSONS.length;
  protected readonly scene = DEMO_SCENE;
  protected readonly conceptInfo = CONCEPT_INFO;
  /** Only the Variables lesson has placeholder scene content so far. */
  protected readonly isDemo = computed(() => this.lesson().id === DEFAULT_LESSON_ID);
  protected readonly comingSoon = {
    lead: 'This lesson is coming soon.',
    bubble: 'I am still getting this lesson ready!',
    tip: 'Try the Variables lesson while this one is being made.',
  } as const;

  // Scene state (local UI state: signals, not a store)
  protected readonly pickedId = signal<string>(DEMO_SCENE.choices[0].id);
  protected readonly picked = computed<DemoChoice>(
    () => DEMO_SCENE.choices.find((c) => c.id === this.pickedId()) ?? DEMO_SCENE.choices[0],
  );
  protected readonly code = computed(() => codeLine(this.picked(), DEMO_SCENE.jarName));
  protected readonly notes = codeNotes(DEMO_SCENE.jarName);
  protected readonly peekOpen = signal(false);
  protected readonly sceneNumber = signal<number>(DEMO_SCENE.scene);

  // Tip and Library are mutually exclusive; each remembers the tab that opened it.
  protected readonly tipOpen = signal(false);
  protected readonly libraryOpen = signal(false);
  protected readonly tipTrigger = signal<HTMLElement | null>(null);
  protected readonly libraryTrigger = signal<HTMLElement | null>(null);

  /** Show the small logo beside the hamburger unless the full menu (with its logo) is inline. */
  protected readonly showHeaderLogo = computed(() => !this.shell.menuInline());

  protected toggleTip(trigger: HTMLElement): void {
    this.tipTrigger.set(trigger);
    this.libraryOpen.set(false);
    this.tipOpen.update((open) => !open);
  }

  protected toggleLibrary(trigger: HTMLElement): void {
    this.libraryTrigger.set(trigger);
    this.tipOpen.set(false);
    this.libraryOpen.update((open) => !open);
  }

  protected readScene(): void {
    const l = this.lesson();
    const text = this.isDemo()
      ? `${l.title}. ${DEMO_SCENE.lead} ${this.picked().bubble}`
      : `${l.title}. ${this.comingSoon.lead}`;
    this.speech.toggle(text);
  }

  protected readLibrary(text: string): void {
    this.speech.toggle(text);
  }

  protected back(): void {
    this.sceneNumber.update((n) => Math.max(1, n - 1));
  }

  protected next(): void {
    this.sceneNumber.update((n) => Math.min(DEMO_SCENE.sceneCount, n + 1));
  }
}
