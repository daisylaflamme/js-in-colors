import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CourseStore, LessonStore } from '@jic/data-access';
import {
  LibraryContentComponent,
  provideDefaultSceneTypes,
  type SceneAction,
  SceneHostComponent,
  type SceneState,
} from '@jic/lesson-engine';
import type { Scene } from '@jic/shared';
import {
  ConceptChipListComponent,
  HelpTabsComponent,
  LessonDoneCardComponent,
  LessonHeaderComponent,
  LibraryPanelComponent,
  MenuButtonComponent,
  SceneNavComponent,
  StageComponent,
  TipCardComponent,
} from '@jic/ui';
import { DotCharacterComponent } from '@jic/visuals';
import { ShellState } from '../shell/shell-state';
import { SpeechService } from '../shell/speech.service';

/**
 * The lesson screen (smart). Lazy-loaded by /lesson/:lessonId.
 * Lesson data and progress come from the LessonStore and CourseStore; the scene itself is drawn
 * by the lesson engine from data. Local UI state (Tip, Library) stays in signals here.
 */
@Component({
  selector: 'jic-lesson-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // One LessonStore per lesson page; the engine's scene types live in this lazy chunk.
  providers: [LessonStore, provideDefaultSceneTypes()],
  imports: [
    RouterLink,
    ConceptChipListComponent,
    DotCharacterComponent,
    HelpTabsComponent,
    LessonDoneCardComponent,
    LessonHeaderComponent,
    LibraryContentComponent,
    LibraryPanelComponent,
    MenuButtonComponent,
    SceneHostComponent,
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
  protected readonly store = inject(LessonStore);
  protected readonly course = inject(CourseStore);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  /** From the route (withComponentInputBinding). The guard guarantees it is in the course. */
  readonly lessonId = input.required<string>();

  /** The menu entry (always there), and whether the full lesson exists yet. */
  protected readonly entry = computed(() => this.course.find(this.lessonId()));
  protected readonly ready = computed(() => this.entry()?.status === 'ready');
  /** The loaded lesson, once it matches the route. */
  protected readonly lesson = computed(() => {
    const lesson = this.store.lesson();
    return lesson?.id === this.lessonId() ? lesson : null;
  });
  protected readonly number = computed(() => this.course.position(this.lessonId()));
  protected readonly lessonCount = computed(() => this.course.lessons().length);
  protected readonly nextLesson = computed(() => this.course.nextReadyAfter(this.lessonId()));

  protected readonly sceneState = computed<SceneState>(() => ({
    pickedChoiceId: this.store.pickedChoice()?.id ?? null,
    answeredOptionId: this.store.answeredOption()?.id ?? null,
  }));
  /** Polite announcement when the scene changes: "Scene 2 of 5". */
  protected readonly sceneStatus = computed(() =>
    this.lesson() && !this.store.done()
      ? `Scene ${this.store.sceneNumber()} of ${this.store.sceneCount()}`
      : '',
  );

  protected readonly comingSoon = {
    lead: 'This lesson is coming soon.',
    bubble: 'I am still getting this lesson ready!',
    tip: 'Try one of the ready lessons while this one is being made.',
  } as const;

  // Tip and Library are mutually exclusive; each remembers the tab that opened it.
  protected readonly tipOpen = signal(false);
  protected readonly libraryOpen = signal(false);
  protected readonly tipTrigger = signal<HTMLElement | null>(null);
  protected readonly libraryTrigger = signal<HTMLElement | null>(null);

  /** Show the small logo beside the hamburger unless the full menu (with its logo) is inline. */
  protected readonly showHeaderLogo = computed(() => !this.shell.menuInline());

  constructor() {
    // Load the lesson for the route; a new lesson closes Tip and Library.
    // Only the lesson id is tracked: load() reads store signals, and tracking those would re-run
    // this effect when the lesson arrives (and close a Tip the child just opened).
    // Only a *change* of lesson closes them: on a prerendered page (ADR 0014) a tap made while the
    // page was starting up is replayed before this effect first runs, and must stay open.
    let shownId: string | undefined;
    effect(() => {
      const id = this.lessonId();
      untracked(() => {
        if (shownId !== undefined && shownId !== id) {
          this.tipOpen.set(false);
          this.libraryOpen.set(false);
        }
        shownId = id;
        if (this.course.find(id)?.status !== 'ready') return;
        this.course.markOpened(id);
        void this.store.load(id);
      });
    });
  }

  protected onAction(action: SceneAction): void {
    if (action.kind === 'pick') this.store.pick(action.id);
    else this.store.answer(action.id);
  }

  protected next(): void {
    this.store.next(); // on the last scene this shows the "done" card, which takes focus itself
  }

  protected back(): void {
    this.store.back();
  }

  /** From the done card: back to the last scene, with focus on Next so the keyboard flow continues. */
  protected backFromDone(): void {
    this.store.back();
    this.focusAfterRender('jic-scene-nav .next');
  }

  protected restart(): void {
    this.store.restart();
    this.focusAfterRender('jic-scene-nav .next');
  }

  protected goToNextLesson(): void {
    const next = this.nextLesson();
    if (next) void this.router.navigate(['/lesson', next.id]);
  }

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

  /** "Read to me": the title, the lead and what Dot says in this scene. */
  protected readScene(): void {
    const lesson = this.lesson();
    const entry = this.entry();
    if (!lesson) {
      this.speech.toggle(`${entry?.title ?? ''}. ${this.comingSoon.lead}`);
      return;
    }
    const scene = this.store.scene();
    this.speech.toggle([lesson.title, lesson.lead, scene ? this.spoken(scene) : ''].join(' '));
  }

  protected readLibrary(text: string): void {
    this.speech.toggle(text);
  }

  private spoken(scene: Scene): string {
    switch (scene.type) {
      case 'watch':
        return scene.bubble;
      case 'interact':
        return this.store.pickedChoice()?.bubble ?? '';
      case 'quiz':
        return scene.question;
    }
  }

  private focusAfterRender(selector: string): void {
    afterNextRender(() => this.host.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }
}
