import { createApp, RESTING_MESSAGE } from './app';
import { DemoProvider } from './providers/demo';
import { RateLimiter } from './rate-limit';

function setup(limits = { perMinute: 5, perDay: 30, dailyCap: 500 }) {
  const lines: string[] = [];
  const app = createApp({
    config: { allowedOrigin: 'http://localhost:4200' },
    provider: new DemoProvider(0),
    limiter: new RateLimiter(limits),
    clientAddress: () => '203.0.113.7',
    log: (line) => lines.push(line),
  });
  const ask = (question: unknown, origin = 'http://localhost:4200') =>
    app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify({ question }),
    });
  return { app, ask, lines };
}

/** The `data:` payloads and events of an SSE response body. */
async function events(response: Response) {
  const body = await response.text();
  return body
    .split('\n\n')
    .filter(Boolean)
    .map((block) => {
      const event = /^event: (.*)$/m.exec(block)?.[1];
      const data = /^data: ?(.*)$/m.exec(block)?.[1] ?? '';
      return event ? { event } : JSON.parse(data);
    });
}

describe('the Ask Dot API', () => {
  it('says which provider answers', async () => {
    const response = await setup().app.request('/api/health');
    expect(await response.json()).toEqual({ ok: true, provider: 'demo' });
  });

  it('streams an answer as server-sent events, then the lesson link, then done', async () => {
    const response = await setup().ask('What is a loop?');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const all = await events(response);
    expect(all[0]).toEqual({ text: 'A' });
    expect(all.at(-2)).toEqual({
      link: { lessonId: 'loops', label: 'See it in the Loops lesson', concept: 'number' },
    });
    expect(all.at(-1)).toEqual({ event: 'done' });
  });

  it('refuses a request without a question', async () => {
    const { ask } = setup();
    for (const bad of [undefined, '', '   ', 42]) expect((await ask(bad)).status).toBe(400);
  });

  it('says Dot is resting when the limit is reached', async () => {
    const { ask } = setup({ perMinute: 2, perDay: 30, dailyCap: 500 });
    await ask('one');
    await ask('two');
    const third = await ask('three');
    expect(third.status).toBe(429);
    expect(Number(third.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(await third.json()).toEqual({ error: 'resting', message: RESTING_MESSAGE });
  });

  it('only lets the web app call it from the browser (CORS)', async () => {
    const { ask } = setup();
    expect((await ask('hi')).headers.get('access-control-allow-origin')).toBe('http://localhost:4200');
    expect((await ask('hi', 'https://evil.example')).headers.get('access-control-allow-origin')).not.toBe(
      'https://evil.example',
    );
  });

  it('logs a fallback with its reason, still without the question', async () => {
    const lines: string[] = [];
    const app = createApp({
      config: { allowedOrigin: 'http://localhost:4200' },
      provider: {
        name: 'groq',
        // eslint-disable-next-line require-yield
        async *stream() {
          throw new Error('groq responded 404');
        },
      },
      limiter: new RateLimiter({ perMinute: 5, perDay: 30, dailyCap: 500 }),
      clientAddress: () => 'x',
      log: (line) => lines.push(line),
    });
    const response = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'My secret question about loops' }),
    });
    await response.text();
    expect(lines).toContain('fallback to canned answers: groq responded 404');
    expect(lines.join(' ')).not.toMatch(/secret/i);
  });

  it('logs one line per request and never the question or the answer', async () => {
    const { ask, lines } = setup();
    await events(await ask('My secret question about loops'));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^POST \/api\/chat 200 \d+ms demo$/);
    expect(lines.join(' ')).not.toMatch(/secret|loop/i);
  });
});
