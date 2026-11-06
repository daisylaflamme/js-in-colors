import { KID_SYSTEM_PROMPT } from '@jic/shared/chat';
import type { ChatProvider } from './provider';

export const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface GroqOptions {
  readonly apiKey: string;
  readonly model: string;
  /** Injected for tests; defaults to the global fetch. */
  readonly fetch?: typeof fetch;
}

/**
 * Groq's OpenAI-compatible chat API, streamed (ADR 0012). Sends the kid system prompt and only
 * this one question: no history, no names, nothing stored here. Short and calm by design
 * (max_tokens 120, temperature 0.3). The key stays on the server and is never logged.
 */
export class GroqProvider implements ChatProvider {
  readonly name = 'groq';
  private readonly options: GroqOptions;

  constructor(options: GroqOptions) {
    this.options = options;
  }

  async *stream(question: string, signal: AbortSignal): AsyncIterable<string> {
    const doFetch = this.options.fetch ?? fetch;
    const response = await doFetch(GROQ_URL, {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.options.model,
        stream: true,
        max_tokens: 120,
        temperature: 0.3,
        messages: [
          { role: 'system', content: KID_SYSTEM_PROMPT },
          { role: 'user', content: question },
        ],
      }),
    });
    // The status only: Groq's error body may echo the request, which must not be logged.
    if (!response.ok || !response.body) throw new Error(`groq responded ${response.status}`);

    for await (const data of serverSentData(response.body)) {
      if (data === '[DONE]') return;
      const delta = parseDelta(data);
      if (delta) yield delta;
    }
  }
}

/** The text of one streamed OpenAI-style chunk, or nothing. */
export function parseDelta(data: string): string | undefined {
  try {
    const json = JSON.parse(data) as { choices?: { delta?: { content?: unknown } }[] };
    const content = json.choices?.[0]?.delta?.content;
    return typeof content === 'string' && content ? content : undefined;
  } catch {
    return undefined;
  }
}

/** The `data:` payloads of a Server-Sent Events byte stream. */
export async function* serverSentData(body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const bytes of body) {
    buffer += decoder.decode(bytes, { stream: true });
    let end: number;
    while ((end = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, end).replace(/\r$/, '');
      buffer = buffer.slice(end + 1);
      if (line.startsWith('data:')) yield line.slice(5).trim();
    }
  }
}
