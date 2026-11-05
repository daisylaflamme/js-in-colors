import { inject, InjectionToken } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Store } from '@ngrx/store';
import type { Concept } from '@jic/shared';
import type { Observable } from 'rxjs';
import { selectCalmMotion } from '../settings/settings.feature';

/** A link from an answer to the lesson that shows the idea. */
export interface ChatLink {
  readonly lessonId: string;
  /** e.g. "See it in the Loops lesson" */
  readonly label: string;
  /** Drawn as its shape next to the link. */
  readonly concept: Concept;
}

/** One piece of a streamed answer: some words, or a lesson link (sent last). */
export type ChatChunk = { readonly text: string } | { readonly link: ChatLink };

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

export const PRIVATE_REPLY = "Let's keep names and places private. Ask me about JavaScript instead!";

/**
 * Personal details a child might type. Checked before any provider sees the question, so the
 * future proxy never receives them either. Kept simple on purpose: it catches the common cases,
 * and the safe chat rules ask children not to type them at all.
 */
const PERSONAL_INFO: readonly RegExp[] = [
  /[^\s@]+@[^\s@]+\.[^\s@]+/, // an email
  /(?:\d[\s().-]*){7,}/, // a phone-like run of digits
  /\bmy name is\b/i,
  /\bi am called\b/i,
  /\bi live\b/i,
  /\bmy (?:home )?address\b/i,
  /\bmy school\b/i,
  /\bmy (?:phone|number|email)\b/i,
];

export function looksPersonal(question: string): boolean {
  return PERSONAL_INFO.some((pattern) => pattern.test(question));
}
