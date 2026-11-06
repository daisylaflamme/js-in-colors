import { inject, Injectable, InjectionToken, type Provider, signal } from '@angular/core';
import { isConcept } from '@jic/shared';
import type { ChatChunk } from '@jic/shared/chat';
import { Observable, type Subscription } from 'rxjs';
import { type ChatMode, ChatService } from './chat';
import { DemoChatService } from './demo-chat.service';

/** Where the Ask Dot server listens. Same origin by default (a dev proxy or the host routes it). */
export const CHAT_API_URL = new InjectionToken<string>('ChatApiUrl', {
  providedIn: 'root',
  factory: () => '/api/chat',
});

/** The fetch used for live answers (tests replace it). */
export const CHAT_FETCH = new InjectionToken<typeof fetch>('ChatFetch', {
  providedIn: 'root',
  factory: () => (input, init) => fetch(input, init),
});

/** No first words from the server within this time: answer from the pre-written ones. */
export const LIVE_FIRST_CHUNK_MS = 12_000;

/**
 * Live mode (ADR 0012): streams answers from the Ask Dot server (apps/api) as server-sent events
 * and turns them into the same chunks as demo mode, as an RxJS stream. Unsubscribing (leaving the
 * page) aborts the request. If the server is busy (429), down, or silent before its first words,
 * Dot answers from the pre-written answers instead and `resting` says so. The question is sent
 * once and nothing is stored.
 */
@Injectable()
export class LiveChatService extends ChatService {
  readonly mode = 'live';
  private readonly restingState = signal(false);
  readonly resting = this.restingState.asReadonly();
  private readonly url = inject(CHAT_API_URL);
  private readonly doFetch = inject(CHAT_FETCH);
  private readonly demo = inject(DemoChatService);

  ask(question: string): Observable<ChatChunk> {
    return new Observable<ChatChunk>((subscriber) => {
      const controller = new AbortController();
      let started = false;
      let settled = false;
      let fallback: Subscription | undefined;

      const fallBack = () => {
        if (settled) return;
        settled = true;
        controller.abort();
        this.restingState.set(true);
        fallback = this.demo.ask(question).subscribe(subscriber);
      };
      const fail = () => {
        if (settled) return;
        settled = true;
        subscriber.error(new Error('The live answer stopped.'));
      };
      const timer = setTimeout(() => started || fallBack(), LIVE_FIRST_CHUNK_MS);

      void (async () => {
        try {
          const response = await this.doFetch(this.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question }),
            signal: controller.signal,
          });
          if (!response.ok || !response.body) return fallBack();
          for await (const chunk of chunksOf(response.body)) {
            if (settled) return;
            if (!started) {
              started = true;
              clearTimeout(timer);
              this.restingState.set(false);
            }
            subscriber.next(chunk);
          }
          if (settled) return;
          if (!started) return fallBack();
          settled = true;
          subscriber.complete();
        } catch {
          // Before any words: answer from the pre-written ones. Mid-answer: the store says oops.
          if (started) fail();
          else fallBack();
        } finally {
          clearTimeout(timer);
        }
      })();

      return () => {
        settled = true;
        clearTimeout(timer);
        controller.abort();
        fallback?.unsubscribe();
      };
    });
  }
}

/**
 * The chunks in a server-sent events body: each `data: {...}` block is one chunk, and
 * `event: done` ends the answer. Anything that isn't a valid chunk is skipped.
 */
export async function* chunksOf(body: ReadableStream<Uint8Array>): AsyncGenerator<ChatChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      let end: number;
      while ((end = buffer.search(/\r?\n\r?\n/)) >= 0) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end).replace(/^\r?\n\r?\n/, '');
        const lines = block.split(/\r?\n/);
        if (lines.some((l) => l.startsWith('event:') && l.slice(6).trim() === 'done')) return;
        const data = lines
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trim())
          .join('');
        const chunk = toChunk(data);
        if (chunk) yield chunk;
      }
      if (done) return;
    }
  } finally {
    reader.releaseLock();
  }
}

function toChunk(data: string): ChatChunk | undefined {
  try {
    const value = JSON.parse(data) as { text?: unknown; link?: unknown };
    if (typeof value.text === 'string') return { text: value.text };
    const link = value.link as { lessonId?: unknown; label?: unknown; concept?: unknown } | undefined;
    if (
      link &&
      typeof link.lessonId === 'string' &&
      typeof link.label === 'string' &&
      isConcept(link.concept)
    ) {
      return { link: { lessonId: link.lessonId, label: link.label, concept: link.concept } };
    }
  } catch {
    // not a chunk
  }
  return undefined;
}

/**
 * The chat for one page: demo (pre-written answers, the default) or live (the Ask Dot server).
 * Provide it on the chat page, next to ChatStore, so leaving the page ends everything.
 */
export function provideChat(mode: ChatMode): Provider[] {
  return [
    DemoChatService,
    LiveChatService,
    {
      provide: ChatService,
      useFactory: () => (mode === 'live' ? inject(LiveChatService) : inject(DemoChatService)),
    },
  ];
}
