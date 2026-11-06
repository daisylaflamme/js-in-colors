import {
  type ChatChunk,
  checkWord,
  cleanQuestion,
  lessonLinkFor,
  looksPersonal,
  CARE_REPLY,
  needsAGrownUp,
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
  /**
   * Told when the canned fallback answered instead of the provider, with a reason that never
   * contains the question or the answer ("timeout", or the provider's own "groq responded 404").
   * The server logs it; the live eval counts it as a failure, so a broken provider can't hide.
   */
  readonly onFallback?: (reason: string) => void;
}

export const MID_ANSWER_OOPS = 'Oops, Dot lost the thread. Try again!';
export const ASK_ABOUT_JAVASCRIPT = 'Ask me about JavaScript instead!';

/** A word without Markdown marks (** * _ `), which the chat shows as plain text. */
export function plain(word: string): string {
  return word.replace(/[*_`]/g, '');
}

/** "I can't help with that." with no way back to JavaScript. */
export function isBareRefusal(text: string): boolean {
  return /\b(?:can[’']?t|cannot|won[’']?t)\b/i.test(text) && !/javascript/i.test(text);
}

/**
 * Turns a question into a safe, streamed answer, whatever the provider (ADR 0012):
 * 1. Clean the input. Personal details get the private reply, and a child who sounds hurt or
 *    sad gets the caring reply (go to a trusted grown-up): neither ever reaches a provider.
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
  if (needsAGrownUp(question)) {
    yield { text: CARE_REPLY };
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
  let reason = 'timeout';
  try {
    first = await withTimeout(words.next(), options.firstWordTimeoutMs ?? 8000);
  } catch (error) {
    first = 'error';
    reason = safeReason(error);
  }
  if (first === 'timeout' || first === 'error') {
    options.onFallback?.(reason);
    primary.abort();
    void words.return(undefined);
    words = wordsOf((options.fallback ?? new DemoProvider(0)).stream(question, options.signal));
    first = await words.next();
  }

  let said = '';
  let cut = false;
  try {
    for (let next = first; !next.done; next = await words.next()) {
      if (options.signal.aborted) return;
      // Plain text only: a child would see Markdown's ** and ` as stray marks.
      const word = plain(next.value);
      if (!word) continue;
      if (!checkWord(word)) {
        yield out(SAFE_ENDING);
        cut = true;
        break;
      }
      if (sent >= maxWords) {
        yield { text: '…' };
        cut = true;
        break;
      }
      said += ` ${word}`;
      yield out(word);
    }
  } catch {
    if (options.signal.aborted) return;
    yield out(MID_ANSWER_OOPS);
    cut = true;
  } finally {
    void words.return(undefined);
  }
  // A bare refusal ("Sorry, I can't help with that.") still points the child back to JavaScript.
  if (!cut && isBareRefusal(said) && !options.signal.aborted) yield out(ASK_ABOUT_JAVASCRIPT);

  const link = lessonLinkFor(question);
  if (link && !options.signal.aborted) yield { link };
}

/**
 * A failure reason that is safe to log: only our own fixed messages ("groq responded 404"),
 * never a provider's free text, which could echo the question.
 */
export function safeReason(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  return /^[a-z]+ responded \d{3}$/.test(message) ? message : 'provider error';
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
