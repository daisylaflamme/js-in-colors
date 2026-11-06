import { TestBed } from '@angular/core/testing';
import { sentences } from '@jic/shared';
import { firstValueFrom, Observable, toArray } from 'rxjs';
import { CHAT_INSTANT, type ChatChunk, ChatService, looksPersonal, PRIVATE_REPLY } from './chat';
import { ChatStore, DOT_GREETING, DOT_OOPS } from './chat.store';
import { DEMO_ANSWERS, DEMO_REDIRECTS } from '@jic/shared/chat';
import { matchAnswer, normalize, redirectFor } from '@jic/shared/chat';
import { DEMO_THINK_MS, DemoChatService, provideDemoChat } from './demo-chat.service';

describe('demo answers', () => {
  it('are short kid sentences (12 words or fewer), with unique ids', () => {
    for (const text of [...DEMO_ANSWERS.map((a) => a.text), ...DEMO_REDIRECTS]) {
      for (const s of sentences(text)) expect(s.split(/\s+/).length, s).toBeLessThanOrEqual(12);
    }
    expect(new Set(DEMO_ANSWERS.map((a) => a.id)).size).toBe(DEMO_ANSWERS.length);
  });

  it.each([
    ['What is a variable?', 'variable'],
    ['What is a function?', 'function'],
    ['What does true mean?', 'boolean'],
    ["What's a LOOP??", 'loop'],
    ['how do arrays work', 'array'],
    ['what is an object', 'object'],
    ['What is console.log', 'output'],
    ['what is the DOM', 'dom'],
    ['what is javascript', 'javascript'],
    ['hello!', 'hello'],
  ])('matches %j to the %s answer', (question, id) => {
    expect(matchAnswer(question)?.id).toBe(id);
  });

  it('gives a stable, gentle redirect when nothing fits', () => {
    expect(matchAnswer('Do you like pizza?')).toBeUndefined();
    expect(redirectFor('Do you like pizza?')).toBe(redirectFor('do you like PIZZA'));
    expect(DEMO_REDIRECTS).toContain(redirectFor('Do you like pizza?'));
  });

  it('normalizes punctuation but keeps console.log', () => {
    expect(normalize("What's   console.log?")).toBe('what s console.log');
  });
});

describe('looksPersonal', () => {
  it.each([
    'my name is Emma',
    'I live on Oak Street',
    'email me at kid@example.com',
    'call 555 123 4567',
    'my school is Hill Park',
  ])('catches %j', (q) => expect(looksPersonal(q)).toBe(true));

  it.each(['What is a loop?', 'what is 2 + 2', 'what does name mean in cat.name'])('lets %j through', (q) =>
    expect(looksPersonal(q)).toBe(false),
  );
});

describe('DemoChatService', () => {
  function service(instant: boolean) {
    TestBed.configureTestingModule({
      providers: [provideDemoChat(), { provide: CHAT_INSTANT, useValue: () => instant }],
    });
    return TestBed.inject(ChatService);
  }
  const collect = (o: Observable<ChatChunk>) => firstValueFrom(o.pipe(toArray()));

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('streams the answer word by word, then the lesson link', async () => {
    const chunks = collect(service(false).ask('What is a loop?'));
    await vi.runAllTimersAsync();
    const all = await chunks;
    const text = all.flatMap((c) => ('text' in c ? [c.text] : [])).join('');
    expect(text).toBe(DEMO_ANSWERS.find((a) => a.id === 'loop')?.text);
    expect(all.length).toBeGreaterThan(5);
    expect(all.at(-1)).toEqual({
      link: { lessonId: 'loops', label: 'See it in the Loops lesson', concept: 'number' },
    });
  });

  it('sends the whole answer at once with Calm motion', async () => {
    const chunks = collect(service(true).ask('Do you like pizza?'));
    await vi.advanceTimersByTimeAsync(DEMO_THINK_MS);
    expect(await chunks).toEqual([{ text: redirectFor('Do you like pizza?') }]);
  });

  it('is a DemoChatService', () => {
    expect(service(true)).toBeInstanceOf(DemoChatService);
  });
});

describe('ChatStore', () => {
  function setup(answer: (q: string) => Observable<ChatChunk>) {
    const ask = vi.fn(answer);
    TestBed.configureTestingModule({ providers: [ChatStore, { provide: ChatService, useValue: { ask } }] });
    return { store: TestBed.inject(ChatStore), ask };
  }
  const words = (...chunks: ChatChunk[]) =>
    new Observable<ChatChunk>((sub) => {
      chunks.forEach((c) => sub.next(c));
      sub.complete();
    });

  it('starts with Dot saying hi', () => {
    const { store } = setup(() => words());
    expect(store.messages()).toEqual([{ id: 0, from: 'dot', text: DOT_GREETING }]);
    expect(store.busy()).toBe(false);
  });

  it('adds the question, builds the answer from chunks, and announces it when done', () => {
    const link = { lessonId: 'loops', label: 'See it in the Loops lesson', concept: 'number' } as const;
    const { store } = setup(() => words({ text: 'A loop' }, { text: ' repeats.' }, { link }));
    store.ask('  What is a loop?  ');
    expect(store.messages().slice(1)).toEqual([
      { id: 1, from: 'kid', text: 'What is a loop?' },
      { id: 2, from: 'dot', text: 'A loop repeats.', link },
    ]);
    expect(store.status()).toBe('idle');
    expect(store.announcement()).toBe('Dot says: A loop repeats.');
  });

  it('ignores empty questions and questions while Dot is answering', () => {
    let finish: () => void = () => undefined;
    const { store, ask } = setup(
      () =>
        new Observable<ChatChunk>((sub) => {
          sub.next({ text: 'Hmm' });
          finish = () => sub.complete();
        }),
    );
    store.ask('   ');
    store.ask('first');
    expect(store.status()).toBe('streaming');
    store.ask('second');
    finish();
    expect(ask).toHaveBeenCalledTimes(1);
    expect(
      store
        .messages()
        .filter((m) => m.from === 'kid')
        .map((m) => m.text),
    ).toEqual(['first']);
  });

  it('never sends personal details to the chat service', () => {
    const { store, ask } = setup(() => words({ text: 'no' }));
    store.ask('my name is Emma');
    expect(ask).not.toHaveBeenCalled();
    expect(store.messages().at(-1)?.text).toBe(PRIVATE_REPLY);
    expect(store.busy()).toBe(false);
  });

  it('says oops when the service fails', () => {
    const { store } = setup(() => new Observable<ChatChunk>((sub) => sub.error(new Error('down'))));
    store.ask('What is a loop?');
    expect(store.messages().at(-1)?.text).toBe(DOT_OOPS);
    expect(store.busy()).toBe(false);
  });

  it('never touches localStorage', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { store } = setup(() => words({ text: 'ok' }));
    store.ask('What is a loop?');
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});
