import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseStore } from '@jic/data-access';
import {
  CHAT_INSTANT,
  ChatService,
  ChatStore,
  provideChat,
  QUESTION_MAX_LENGTH,
} from '@jic/data-access/chat';
import { CHAT_MODE } from '../../environments/chat-mode';
import type { Concept } from '@jic/shared';
import {
  AppLogoComponent,
  ChatBubbleComponent,
  ConceptShapeComponent,
  IconComponent,
  SafeRulesCardComponent,
  TypingDotsComponent,
} from '@jic/ui';
import { DotCharacterComponent } from '@jic/visuals';

export const SUGGESTIONS: readonly { readonly text: string; readonly concept: Concept }[] = [
  { text: 'What is a variable?', concept: 'variable' },
  { text: 'What is a function?', concept: 'function' },
  { text: 'What does true mean?', concept: 'boolean' },
];

export const DEMO_NOTE =
  "Demo mode shows pre-written answers. In the full version, Dot's replies stream in word by word.";

export const LIVE_NOTE =
  'Live mode: an AI writes the answers, and every word is checked before you see it. Nothing is saved.';

export const RESTING_NOTE = 'Dot is resting, so these are quick pre-written answers.';

/**
 * Ask Dot (mockup 09, ADR 0011). The chat lives in a ChatStore provided here, so leaving the
 * page ends the conversation: nothing is saved. Demo mode answers come from DemoChatService.
 * `?from=<lessonId>` makes "Back to the lesson" return to that lesson.
 */
@Component({
  selector: 'jic-ask-dot-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    AppLogoComponent,
    ChatBubbleComponent,
    ConceptShapeComponent,
    DotCharacterComponent,
    IconComponent,
    SafeRulesCardComponent,
    TypingDotsComponent,
  ],
  // Demo unless this is a live build (npm run start:live, ADR 0012).
  providers: [ChatStore, provideChat(CHAT_MODE)],
  templateUrl: './ask-dot-page.html',
  styleUrl: './ask-dot-page.scss',
})
export class AskDotPage {
  /** The lesson the child came from (query param). */
  readonly from = input<string>();

  protected readonly store = inject(ChatStore);
  private readonly course = inject(CourseStore);
  private readonly instant = inject(CHAT_INSTANT);

  protected readonly suggestions = SUGGESTIONS;
  protected readonly chat = inject(ChatService);
  protected readonly live = this.chat.mode === 'live';
  protected readonly note = this.live ? LIVE_NOTE : DEMO_NOTE;
  protected readonly restingNote = RESTING_NOTE;
  protected readonly maxLength = QUESTION_MAX_LENGTH;
  protected readonly draft = signal('');

  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  protected readonly back = computed(() => {
    const lesson = this.course.find(this.from());
    return lesson?.status === 'ready'
      ? { link: ['/lesson', lesson.id], label: 'Back to the lesson' }
      : { link: ['/'], label: 'Back to your color path' };
  });

  constructor() {
    // Keep the newest message in view as answers grow.
    afterRenderEffect(() => {
      this.store.messages();
      this.store.status();
      const el = this.list().nativeElement;
      el.scrollTo?.({ top: el.scrollHeight, behavior: this.instant() ? 'auto' : 'smooth' });
    });
  }

  protected onInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) this.draft.set(event.target.value);
  }

  protected send(event: Event): void {
    event.preventDefault();
    this.ask(this.draft());
  }

  protected ask(question: string): void {
    if (!question.trim() || this.store.busy()) return;
    this.store.ask(question);
    this.draft.set('');
    // Clear the box itself too: if typing and Send land in one change detection, the [value]
    // binding sees '' -> '' and would not touch the DOM.
    const field = this.field().nativeElement;
    field.value = '';
    // Focus stays in the box, ready for the next question (Send is disabled while Dot answers).
    field.focus();
  }
}
