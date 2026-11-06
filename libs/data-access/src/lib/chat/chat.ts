import { inject, InjectionToken } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Store } from '@ngrx/store';
import type { ChatChunk } from '@jic/shared/chat';
import type { Observable } from 'rxjs';
import { selectCalmMotion } from '../settings/settings.feature';

// The contract and the safety checks live in @jic/shared/chat, so the server uses the same ones.
export {
  type ChatChunk,
  type ChatLink,
  checkWord,
  cleanQuestion,
  DEMO_ANSWERS,
  DEMO_REDIRECTS,
  type DemoAnswer,
  lessonLinkFor,
  looksPersonal,
  matchAnswer,
  normalize,
  PRIVATE_REPLY,
  QUESTION_MAX_LENGTH,
  redirectFor,
} from '@jic/shared/chat';

/**
 * Where Dot's answers come from (ADR 0011). Today: DemoChatService (pre-written answers). Later:
 * a server-side proxy (apps/api) that streams the same chunks. The browser never holds a key and
 * never talks to an AI provider directly. Nothing a provider receives is stored or logged.
 */
export abstract class ChatService {
  /** Streams the answer to one question, then completes. */
  abstract ask(question: string): Observable<ChatChunk>;
}

/** True when answers should appear at once instead of word by word (Calm motion or reduced motion). */
export const CHAT_INSTANT = new InjectionToken<() => boolean>('ChatInstant', {
  providedIn: 'root',
  factory: () => {
    const calm = inject(Store, { optional: true })?.selectSignal(selectCalmMotion);
    const reduce = inject(DOCUMENT).defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');
    return () => Boolean(calm?.() || reduce?.matches);
  },
});
