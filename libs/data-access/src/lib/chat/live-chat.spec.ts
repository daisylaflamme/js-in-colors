import { TestBed } from '@angular/core/testing';
import { ReadableStream } from 'node:stream/web';
import { firstValueFrom, toArray } from 'rxjs';
import type { ChatChunk } from '@jic/shared/chat';
import { redirectFor } from '@jic/shared/chat';
import { CHAT_INSTANT, ChatService } from './chat';
import { DEMO_THINK_MS, DemoChatService } from './demo-chat.service';
import {
  CHAT_API_URL,
  CHAT_FETCH,
  chunksOf,
  LIVE_FIRST_CHUNK_MS,
  LiveChatService,
  provideChat,
} from './live-chat.service';

const sse = (...blocks: string[]) => blocks.map((b) => `${b}\n\n`).join('');
const data = (chunk: ChatChunk) => `data: ${JSON.stringify(chunk)}`;

/** A body that arrives in the given pieces (to test lines split across network reads). */
function body(...pieces: string[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const p of pieces) controller.enqueue(new TextEncoder().encode(p));
      controller.close();
    },
  });
}

function setup(fakeFetch: typeof fetch) {
  TestBed.configureTestingModule({
    providers: [
      provideChat('live'),
      { provide: CHAT_FETCH, useValue: fakeFetch },
      { provide: CHAT_API_URL, useValue: '/api/chat' },
      { provide: CHAT_INSTANT, useValue: () => true },
    ],
  });
  return TestBed.inject(ChatService) as LiveChatService;
}

const collect = (chat: ChatService, question: string) => firstValueFrom(chat.ask(question).pipe(toArray()));
const textOf = (chunks: ChatChunk[]) => chunks.flatMap((c) => ('text' in c ? [c.text] : [])).join('');

describe('LiveChatService', () => {
  afterEach(() => vi.useRealTimers());

  it('sends the question once and streams the server-sent chunks, then the link', async () => {
    const link = { lessonId: 'loops', label: 'See it in the Loops lesson', concept: 'number' } as const;
    const raw = sse(
      data({ text: 'A loop' }),
      data({ text: ' repeats.' }),
      data({ link }),
      'event: done\ndata: ',
    );
    let request: { url: string; init: RequestInit } | undefined;
    const chat = setup((async (url: string, init: RequestInit) => {
      request = { url, init };
      return new Response(body(raw.slice(0, 9), raw.slice(9, 40), raw.slice(40)));
    }) as unknown as typeof fetch);

    const chunks = await collect(chat, 'What is a loop?');
    expect(chunks).toEqual([{ text: 'A loop' }, { text: ' repeats.' }, { link }]);
    expect(request?.url).toBe('/api/chat');
    expect(request?.init.method).toBe('POST');
    expect(JSON.parse(String(request?.init.body))).toEqual({ question: 'What is a loop?' });
    expect(chat.mode).toBe('live');
    expect(chat.resting()).toBe(false);
  });

  it('answers from the pre-written answers, and says Dot is resting, when the server is busy', async () => {
    vi.useFakeTimers();
    const chat = setup((async () =>
      Response.json({ error: 'resting' }, { status: 429 })) as unknown as typeof fetch);
    const answer = collect(chat, 'Do you like pizza?');
    await vi.advanceTimersByTimeAsync(DEMO_THINK_MS);
    expect(textOf(await answer)).toBe(redirectFor('Do you like pizza?'));
    expect(chat.resting()).toBe(true);
  });

  it('does the same when the server is down', async () => {
    vi.useFakeTimers();
    const chat = setup((async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch);
    const answer = collect(chat, 'Do you like pizza?');
    await vi.advanceTimersByTimeAsync(DEMO_THINK_MS);
    expect(textOf(await answer)).toBe(redirectFor('Do you like pizza?'));
    expect(chat.resting()).toBe(true);
  });

  it('does the same when the server says nothing in time, and stops waiting for it', async () => {
    vi.useFakeTimers();
    let aborted = false;
    const chat = setup(
      ((_url: string, init: RequestInit) =>
        new Promise<Response>((_, reject) =>
          init.signal?.addEventListener('abort', () => {
            aborted = true;
            reject(new DOMException('aborted', 'AbortError'));
          }),
        )) as unknown as typeof fetch,
    );
    const answer = collect(chat, 'Do you like pizza?');
    await vi.advanceTimersByTimeAsync(LIVE_FIRST_CHUNK_MS + DEMO_THINK_MS);
    expect(textOf(await answer)).toBe(redirectFor('Do you like pizza?'));
    expect(aborted).toBe(true);
  });

  it('ends with an error if the answer breaks after it started (the store says oops)', async () => {
    // First read: some words. Next read: the connection drops. (An error right after enqueue
    // would discard the queued words, per the Streams spec.)
    let reads = 0;
    const broken = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (reads++ === 0) controller.enqueue(new TextEncoder().encode(sse(data({ text: 'A loop' }))));
        else controller.error(new Error('connection lost'));
      },
    });
    const chat = setup((async () => new Response(broken)) as unknown as typeof fetch);
    const seen: ChatChunk[] = [];
    await expect(
      new Promise((resolve, reject) =>
        chat.ask('q').subscribe({ next: (c) => seen.push(c), error: reject, complete: resolve }),
      ),
    ).rejects.toThrow();
    expect(seen).toEqual([{ text: 'A loop' }]);
    expect(chat.resting()).toBe(false);
  });

  it('aborts the request when the child leaves', async () => {
    let signal: AbortSignal | undefined;
    const chat = setup(((_url: string, init: RequestInit) => {
      signal = init.signal ?? undefined;
      return new Promise<Response>(() => undefined);
    }) as unknown as typeof fetch);
    const subscription = chat.ask('q').subscribe();
    await Promise.resolve();
    subscription.unsubscribe();
    expect(signal?.aborted).toBe(true);
  });
});

describe('chunksOf', () => {
  it('skips anything that is not a valid chunk, and stops at done', async () => {
    const raw = sse(
      ': a comment',
      'data: not json',
      data({ text: 'ok' }),
      'data: {"link":{"lessonId":"x","label":"y","concept":"banana"}}',
      'event: done\ndata: ',
      data({ text: 'after done' }),
    );
    const chunks: ChatChunk[] = [];
    for await (const chunk of chunksOf(body(raw))) chunks.push(chunk);
    expect(chunks).toEqual([{ text: 'ok' }]);
  });
});

describe('provideChat', () => {
  it('gives the pre-written answers unless the build asks for live', () => {
    TestBed.configureTestingModule({
      providers: [provideChat('demo'), { provide: CHAT_INSTANT, useValue: () => true }],
    });
    const chat = TestBed.inject(ChatService);
    expect(chat).toBeInstanceOf(DemoChatService);
    expect(chat.mode).toBe('demo');
    expect(chat.resting()).toBe(false);
  });
});
