import { matchAnswer, redirectFor } from '@jic/shared/chat';
import type { ChatProvider } from './provider';

const pause = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (ms <= 0 || signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => (clearTimeout(timer), resolve()), { once: true });
  });

/** The canned answers (the same as the browser's demo mode), streamed word by word. Free and offline. */
export class DemoProvider implements ChatProvider {
  readonly name = 'demo';
  private readonly wordDelayMs: number;

  constructor(wordDelayMs = 40) {
    this.wordDelayMs = wordDelayMs;
  }

  async *stream(question: string, signal: AbortSignal): AsyncIterable<string> {
    const text = matchAnswer(question)?.text ?? redirectFor(question);
    const words = text.split(' ');
    for (let i = 0; i < words.length && !signal.aborted; i++) {
      await pause(this.wordDelayMs, signal);
      yield i === 0 ? words[i] : ` ${words[i]}`;
    }
  }
}
