import { inject, Injectable, signal } from '@angular/core';
import { concatMap, concatWith, from, map, type Observable, of, timer } from 'rxjs';
import { CHAT_INSTANT, type ChatChunk, ChatService } from './chat';
import { lessonLinkFor, matchAnswer, redirectFor } from '@jic/shared/chat';

/** Pause before each word, like Dot typing. */
export const DEMO_WORD_DELAY_MS = 60;
/** Dot "thinks" for a moment before the first word. */
export const DEMO_THINK_MS = 500;

/**
 * Demo mode (ADR 0011): pre-written answers, streamed word by word like the real chat will be.
 * No network at all. With Calm motion or reduced motion the whole answer comes at once.
 */
@Injectable()
export class DemoChatService extends ChatService {
  readonly mode = 'demo';
  readonly resting = signal(false).asReadonly();
  private readonly instant = inject(CHAT_INSTANT);

  ask(question: string): Observable<ChatChunk> {
    const answer = matchAnswer(question);
    const text = answer?.text ?? redirectFor(question);
    const lesson = lessonLinkFor(question);
    const link: ChatChunk[] = lesson ? [{ link: lesson }] : [];

    if (this.instant()) {
      return timer(DEMO_THINK_MS).pipe(concatMap(() => from<ChatChunk[]>([{ text }, ...link])));
    }
    const words = text.split(' ').map((w, i) => (i === 0 ? w : ` ${w}`));
    return timer(DEMO_THINK_MS).pipe(
      concatMap(() => from(words)),
      concatMap((w) => timer(DEMO_WORD_DELAY_MS).pipe(map((): ChatChunk => ({ text: w })))),
      concatWith(of(...link)),
    );
  }
}

/** Demo mode: Dot answers from DEMO_ANSWERS. Swap this provider for the proxy later. */
export function provideDemoChat() {
  return { provide: ChatService, useClass: DemoChatService };
}
