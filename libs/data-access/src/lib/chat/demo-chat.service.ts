import { inject, Injectable } from '@angular/core';
import { concatMap, concatWith, from, map, type Observable, of, timer } from 'rxjs';
import { CHAT_INSTANT, type ChatChunk, ChatService } from './chat';
import { type DemoAnswer, DEMO_ANSWERS, DEMO_REDIRECTS } from './demo-answers';

/** Pause before each word, like Dot typing. */
export const DEMO_WORD_DELAY_MS = 60;
/** Dot "thinks" for a moment before the first word. */
export const DEMO_THINK_MS = 500;

/** Lowercase words only, so "What's a LOOP?" matches "loop". */
export function normalize(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, ' ')
    .replace(/\.(?!\w)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The answer whose keywords appear most (whole words); ties go to the first in the list. */
export function matchAnswer(question: string): DemoAnswer | undefined {
  const words = ` ${normalize(question)} `;
  let best: DemoAnswer | undefined;
  let bestScore = 0;
  for (const answer of DEMO_ANSWERS) {
    const score = answer.keywords.filter((k) => words.includes(` ${k} `)).length;
    if (score > bestScore) {
      best = answer;
      bestScore = score;
    }
  }
  return best;
}

/** The same question always gets the same redirect (no randomness in tests or screenshots). */
export function redirectFor(question: string): string {
  let hash = 0;
  for (const ch of normalize(question)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return DEMO_REDIRECTS[hash % DEMO_REDIRECTS.length];
}

/**
 * Demo mode (ADR 0011): pre-written answers, streamed word by word like the real chat will be.
 * No network at all. With Calm motion or reduced motion the whole answer comes at once.
 */
@Injectable()
export class DemoChatService extends ChatService {
  private readonly instant = inject(CHAT_INSTANT);

  ask(question: string): Observable<ChatChunk> {
    const answer = matchAnswer(question);
    const text = answer?.text ?? redirectFor(question);
    const link: ChatChunk[] = answer?.lesson
      ? [
          {
            link: {
              lessonId: answer.lesson.id,
              label: `See it in the ${answer.lesson.name} lesson`,
              concept: answer.lesson.concept,
            },
          },
        ]
      : [];

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
