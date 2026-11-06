import {
  type ChatChunk,
  checkWord,
  cleanQuestion,
  lessonLinkFor,
  looksPersonal,
  PRIVATE_REPLY,
  SAFE_ENDING,
} from '@jic/shared/chat';
import { DemoProvider } from './providers/demo';
import type { ChatProvider } from './providers/provider';

export interface PipelineOptions {
  readonly signal: AbortSignal;
  /** No first word within this time: answer from the canned demo instead. */
  readonly firstWordTimeoutMs?: number;
  /** A longer answer is cut here (the prompt asks for about 30 words). */
  readonly maxWords?: number;
  /** Used when the provider fails or is slow before the first word. */
  readonly fallback?: ChatProvider;
}

export const MID_ANSWER_OOPS = 'Oops, Dot lost the thread. Try again!';

/**
 * Turns a question into a safe, streamed answer, whatever the provider (ADR 0012):
 * 1. Clean the input; personal details get the private reply and never reach a provider.
 * 2. Stream the provider's text, re-cut into whole words.
 * 3. Check each word before it is sent (no links, emails, numbers or blocked words); on a
 *    failure, stop and end with a kind redirect, so the word is never shown.
 * 4. Cap the length. Fall back to the canned answer if the provider fails before its first word.
 * 5. End with the lesson link when the question is about a course idea.
 * Nothing here is logged.
 */
export async function* answer(
  raw: string,
  provider: ChatProvider,
  options: PipelineOptions,
): AsyncGenerator<ChatChunk> {
  const question = cleanQuestion(raw);
  if (!question) return;
  if (looksPersonal(question)) {
    yield { text: PRIVATE_REPLY };
    return;
  }

  const maxWords = options.maxWords ?? 60;
  let sent = 0;
  const out = (word: string): ChatChunk => ({ text: sent++ === 0 ? word : ` ${word}` });

  // The provider gets its own signal: it stops when the child leaves, or when we give up on it.
  const primary = new AbortController();
  options.signal.addEventListener('abort', () => primary.abort(), { once: true });
  let words = wordsOf(provider.stream(question, primary.signal));
  let first: IteratorResult<string> | 'timeout' | 'error';
  try {
    first = await withTimeout(words.next(), options.firstWordTimeoutMs ?? 8000);
  } catch {
    first = 'error';
  }
  if (first === 'timeout' || first === 'error') {
    primary.abort();
    void words.return(undefined);
    words = wordsOf((options.fallback ?? new DemoProvider(0)).stream(question, options.signal));
    first = await words.next();
  }

  try {
    for (let next = first; !next.done; next = await words.next()) {
      if (options.signal.aborted) return;
      if (!checkWord(next.value)) {
        yield out(SAFE_ENDING);
        break;
      }
      if (sent >= maxWords) {
        yield { text: '…' };
        break;
      }
      yield out(next.value);
    }
  } catch {
    if (options.signal.aborted) return;
    yield out(MID_ANSWER_OOPS);
  } finally {
    void words.return(undefined);
  }

  const link = lessonLinkFor(question);
  if (link && !options.signal.aborted) yield { link };
}

/** Re-cuts streamed text pieces ("Hel", "lo wor", "ld") into whole words ("Hello", "world"). */
export async function* wordsOf(pieces: AsyncIterable<string>): AsyncGenerator<string> {
  let partial = '';
  for await (const piece of pieces) {
    partial += piece;
    const parts = partial.split(/\s+/);
    partial = parts.pop() ?? '';
    for (const word of parts) if (word) yield word;
  }
  if (partial) yield partial;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | 'timeout'> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<'timeout'>((resolve) => (timer = setTimeout(() => resolve('timeout'), ms)));
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
