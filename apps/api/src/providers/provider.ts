/**
 * Where an answer's words come from (ADR 0012). A provider only produces raw text; the pipeline
 * (pipeline.ts) does every safety check, so adding a provider is one adapter plus the same tests.
 */
export interface ChatProvider {
  readonly name: 'demo' | 'groq';
  /** Streams the answer as raw text pieces (tokens). Must stop when `signal` aborts. */
  stream(question: string, signal: AbortSignal): AsyncIterable<string>;
}
