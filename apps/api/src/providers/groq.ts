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
 * this one question: no history, no names, nothing stored here. Calm by design (temperature
 * 0.3); the pipeline caps the length. The key stays on the server and is never logged.
 *
 * gpt-oss models think before they answer: reasoning_effort "low" keeps that short, and
 * include_reasoning false keeps it out of the stream, so only the answer arrives. Their thinking
 * counts against the token budget, hence 400 tokens for an answer of about 30 words.
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
        max_completion_tokens: 400,
        temperature: 0.3,
        ...(isReasoningModel(this.options.model)
          ? { reasoning_effort: 'low', include_reasoning: false }
          : {}),
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

/** Groq's gpt-oss models reason before answering and take the reasoning settings. */
export function isReasoningModel(model: string): boolean {
  return model.startsWith('openai/gpt-oss');
}

/**
 * Asks Groq which models this key can use (no content is sent). Used at start-up to warn when
 * the configured model is not available, instead of silently answering from the canned demo.
 */
export async function availableModels(
  apiKey: string,
  doFetch: typeof fetch = fetch,
): Promise<string[] | undefined> {
  try {
    const response = await doFetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) return undefined;
    const body = (await response.json()) as { data?: { id?: unknown }[] };
    return (body.data ?? []).map((m) => m.id).filter((id): id is string => typeof id === 'string');
  } catch {
    return undefined;
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
