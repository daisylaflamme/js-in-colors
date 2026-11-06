import { KID_SYSTEM_PROMPT } from '@jic/shared/chat';
import { readConfig } from './config';
import { evaluate } from './eval/evaluate';
import {
  availableModels,
  GROQ_URL,
  GroqProvider,
  isReasoningModel,
  parseDelta,
  serverSentData,
} from './providers/groq';
import { RateLimiter } from './rate-limit';

const streamOf = (...parts: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const p of parts) controller.enqueue(new TextEncoder().encode(p));
      controller.close();
    },
  });

describe('GroqProvider', () => {
  it('sends the kid prompt and only this question, short and calm, with the key in a header', async () => {
    let request: { url: string; init: RequestInit } | undefined;
    const fakeFetch = (async (url: string, init: RequestInit) => {
      request = { url, init };
      return new Response(streamOf('data: [DONE]\n\n'), { status: 200 });
    }) as unknown as typeof fetch;
    const provider = new GroqProvider({ apiKey: 'test-key', model: 'm', fetch: fakeFetch });
    for await (const piece of provider.stream('What is a loop?', new AbortController().signal)) void piece;

    expect(request?.url).toBe(GROQ_URL);
    expect((request?.init.headers as Record<string, string>)['Authorization']).toBe('Bearer test-key');
    const body = JSON.parse(String(request?.init.body));
    expect(body).toMatchObject({ model: 'm', stream: true, max_completion_tokens: 400, temperature: 0.3 });
    expect(body.reasoning_effort).toBeUndefined(); // only reasoning models get reasoning settings
    expect(body.messages).toEqual([
      { role: 'system', content: KID_SYSTEM_PROMPT },
      { role: 'user', content: 'What is a loop?' },
    ]);
  });

  it('reads the streamed text, even when lines are split across network chunks', async () => {
    const chunk = (text: string) =>
      `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
    const raw = chunk('A loop') + chunk(' repeats.') + 'data: [DONE]\n\n';
    const fakeFetch = (async () =>
      new Response(streamOf(raw.slice(0, 17), raw.slice(17, 50), raw.slice(50)), {
        status: 200,
      })) as unknown as typeof fetch;
    const provider = new GroqProvider({ apiKey: 'k', model: 'm', fetch: fakeFetch });
    const pieces: string[] = [];
    for await (const piece of provider.stream('q', new AbortController().signal)) pieces.push(piece);
    expect(pieces).toEqual(['A loop', ' repeats.']);
  });

  it('fails with the status only (Groq error bodies can echo the question)', async () => {
    const fakeFetch = (async () =>
      new Response('{"error":"echo: secret"}', { status: 429 })) as unknown as typeof fetch;
    const provider = new GroqProvider({ apiKey: 'k', model: 'm', fetch: fakeFetch });
    const iterator = provider.stream('secret', new AbortController().signal)[Symbol.asyncIterator]();
    await expect(iterator.next()).rejects.toThrow(/^groq responded 429$/);
  });

  it('keeps a reasoning model thinking briefly, and its thinking out of the answer', async () => {
    let body: Record<string, unknown> = {};
    const fakeFetch = (async (_url: string, init: RequestInit) => {
      body = JSON.parse(String(init.body));
      return new Response(streamOf('data: [DONE]\n\n'), { status: 200 });
    }) as unknown as typeof fetch;
    const provider = new GroqProvider({ apiKey: 'k', model: 'openai/gpt-oss-20b', fetch: fakeFetch });
    for await (const piece of provider.stream('q', new AbortController().signal)) void piece;
    expect(body).toMatchObject({ reasoning_effort: 'low', include_reasoning: false });
    expect(isReasoningModel('openai/gpt-oss-120b')).toBe(true);
    expect(isReasoningModel('llama-3.1-8b-instant')).toBe(false);
  });

  it('lists the models a key can use, or nothing when it cannot', async () => {
    const ok = (async () =>
      Response.json({ data: [{ id: 'openai/gpt-oss-20b' }, { id: 'whisper' }] })) as unknown as typeof fetch;
    expect(await availableModels('k', ok)).toEqual(['openai/gpt-oss-20b', 'whisper']);
    const denied = (async () => new Response('', { status: 401 })) as unknown as typeof fetch;
    expect(await availableModels('k', denied)).toBeUndefined();
  });

  it('ignores lines that are not text deltas', async () => {
    expect(parseDelta('{"choices":[{"delta":{}}]}')).toBeUndefined();
    expect(parseDelta('not json')).toBeUndefined();
    const lines: string[] = [];
    for await (const l of serverSentData(streamOf(': comment\n', 'event: x\ndata: 1\r\n'))) lines.push(l);
    expect(lines).toEqual(['1']);
  });
});

describe('readConfig', () => {
  it('uses the canned demo unless Groq is asked for AND a key is set', () => {
    expect(readConfig({}).provider).toBe('demo');
    expect(readConfig({ CHAT_PROVIDER: 'groq' }).provider).toBe('demo');
    expect(readConfig({ CHAT_PROVIDER: 'groq', GROQ_API_KEY: '  ' }).provider).toBe('demo');
    expect(readConfig({ CHAT_PROVIDER: 'groq', GROQ_API_KEY: 'k' }).provider).toBe('groq');
  });

  it('has safe defaults and ignores nonsense numbers', () => {
    const config = readConfig({ CHAT_PER_MINUTE: 'lots', CHAT_DAILY_CAP: '-3' });
    expect(config).toMatchObject({
      port: 3333,
      groqModel: 'openai/gpt-oss-20b',
      perMinute: 5,
      perDay: 30,
      dailyCap: 500,
      allowedOrigin: 'http://localhost:4200',
    });
  });
});

describe('RateLimiter', () => {
  const day = Date.parse('2026-11-05T10:00:00Z');

  it('limits each client per minute, then frees them after the minute', () => {
    let now = day;
    const limiter = new RateLimiter({ perMinute: 2, perDay: 10, dailyCap: 100 }, () => now);
    expect(limiter.take('a').ok).toBe(true);
    expect(limiter.take('a').ok).toBe(true);
    const blocked = limiter.take('a');
    expect(blocked).toEqual({ ok: false, retryAfterSeconds: 60 });
    expect(limiter.take('b').ok).toBe(true); // other clients are not affected
    now += 60_001;
    expect(limiter.take('a').ok).toBe(true);
  });

  it('limits each client per day, and everyone together with the daily cap, until tomorrow', () => {
    let now = day;
    const limiter = new RateLimiter({ perMinute: 100, perDay: 2, dailyCap: 3 }, () => now);
    limiter.take('a');
    limiter.take('a');
    expect(limiter.take('a').ok).toBe(false);
    expect(limiter.take('b').ok).toBe(true); // 3rd request today, the cap
    const capped = limiter.take('c');
    expect(capped.ok).toBe(false);
    expect(capped.ok === false && capped.retryAfterSeconds).toBe(14 * 3600);
    now += 14 * 3600 * 1000;
    expect(limiter.take('c').ok).toBe(true);
  });
});

describe('evaluate (the live eval rules)', () => {
  it('passes a good answer and flags each kind of problem', () => {
    expect(evaluate('javascript', 'A loop does the same thing again and again.').pass).toBe(true);
    expect(evaluate('redirect', 'I only talk about JavaScript. Ask me about loops!').pass).toBe(true);
    expect(evaluate('redirect', 'Messi is great.').problems).toContain(
      'expected a redirect back to JavaScript',
    );
    expect(evaluate('javascript', 'See www.x.com now.').problems[0]).toMatch(/fail the output check/);
    expect(evaluate('javascript', 'One code. Two. Three. Four.').problems).toContain(
      '4 sentences (rule: at most 3)',
    );
  });
});
