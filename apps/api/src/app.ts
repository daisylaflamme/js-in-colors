import { cleanQuestion } from '@jic/shared/chat';
import { type Context, Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import type { ApiConfig } from './config';
import { answer } from './pipeline';
import type { ChatProvider } from './providers/provider';
import type { RateLimiter } from './rate-limit';

export const RESTING_MESSAGE = 'Dot is resting for a little while. Try again later!';

export interface AppDeps {
  readonly config: Pick<ApiConfig, 'allowedOrigin'>;
  readonly provider: ChatProvider;
  readonly limiter: RateLimiter;
  /** The caller's address, only ever used (hashed) for rate limits. */
  readonly clientAddress: (c: Context) => string;
  /** One line per request: method, path, status, time, provider. Never a question or an answer. */
  readonly log?: (line: string) => void;
  readonly firstWordTimeoutMs?: number;
}

/**
 * The Ask Dot API (ADR 0012).
 * - POST /api/chat { question } streams Server-Sent Events: `data: {"text":…}` chunks, maybe a
 *   `data: {"link":…}`, then `event: done`. Too many requests: 429 with a kind message.
 * - GET /api/health says which provider answers.
 */
export function createApp(deps: AppDeps): Hono {
  const { provider, limiter, clientAddress } = deps;
  const log = deps.log ?? ((line: string) => console.log(line));
  const app = new Hono();

  app.use(
    '/api/*',
    cors({
      origin: deps.config.allowedOrigin,
      allowMethods: ['GET', 'POST'],
      allowHeaders: ['Content-Type'],
    }),
  );
  app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    log(`${c.req.method} ${c.req.path} ${c.res.status} ${Date.now() - start}ms ${provider.name}`);
  });

  app.get('/api/health', (c) => c.json({ ok: true, provider: provider.name }));

  app.post('/api/chat', async (c) => {
    let question: unknown;
    try {
      question = ((await c.req.json()) as { question?: unknown } | null)?.question;
    } catch {
      question = undefined;
    }
    if (typeof question !== 'string' || !cleanQuestion(question)) {
      return c.json({ error: 'bad-request', message: 'Send { "question": "…" }.' }, 400);
    }

    const limit = limiter.take(clientAddress(c));
    if (!limit.ok) {
      c.header('Retry-After', String(limit.retryAfterSeconds));
      return c.json({ error: 'resting', message: RESTING_MESSAGE }, 429);
    }

    return streamSSE(
      c,
      async (stream) => {
        const controller = new AbortController();
        stream.onAbort(() => controller.abort());
        const options = {
          signal: controller.signal,
          firstWordTimeoutMs: deps.firstWordTimeoutMs,
          onFallback: (reason: string) => log(`fallback to canned answers: ${reason}`),
        };
        for await (const chunk of answer(question, provider, options)) {
          await stream.writeSSE({ data: JSON.stringify(chunk) });
        }
        await stream.writeSSE({ event: 'done', data: '' });
      },
      // Never log the error itself: it could contain the question. End the stream cleanly.
      async (_error, stream) => {
        await stream.writeSSE({ event: 'done', data: '' });
      },
    );
  });

  return app;
}
