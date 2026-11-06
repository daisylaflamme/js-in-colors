import {
  CARE_REPLY,
  type ChatChunk,
  checkWord,
  PRIVATE_REPLY,
  redirectFor,
  SAFE_ENDING,
} from '@jic/shared/chat';
import { TRICKY_QUESTIONS } from './eval/tricky-questions';
import { answer, ASK_ABOUT_JAVASCRIPT, MID_ANSWER_OOPS, safeReason, wordsOf } from './pipeline';
import { DemoProvider } from './providers/demo';
import type { ChatProvider } from './providers/provider';

/** A provider that streams the given pieces, or misbehaves the way it is told to. */
function fake(
  pieces: readonly string[],
  behave: { throwAt?: number; hang?: boolean } = {},
): ChatProvider & { calls: string[] } {
  const calls: string[] = [];
  return {
    name: 'groq',
    calls,
    async *stream(question: string, signal: AbortSignal) {
      calls.push(question);
      if (behave.hang)
        await new Promise<void>((resolve) => signal.addEventListener('abort', () => resolve()));
      for (let i = 0; i < pieces.length; i++) {
        if (i === behave.throwAt) throw new Error('provider broke');
        yield pieces[i];
      }
    },
  };
}

async function collect(stream: AsyncIterable<ChatChunk>) {
  const chunks: ChatChunk[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  const text = chunks.flatMap((c) => ('text' in c ? [c.text] : [])).join('');
  const link = chunks.find((c): c is Extract<ChatChunk, { link: unknown }> => 'link' in c)?.link;
  return { chunks, text, link };
}

const run = (
  question: string,
  provider: ChatProvider,
  extra: { maxWords?: number; firstWordTimeoutMs?: number } = {},
) =>
  collect(
    answer(question, provider, {
      signal: new AbortController().signal,
      fallback: new DemoProvider(0),
      ...extra,
    }),
  );

describe('the answer pipeline', () => {
  it('streams whole words (re-cut from tokens), then the lesson link', async () => {
    const { chunks, link } = await run('What is a loop?', fake(['A lo', 'op re', 'peats ', 'things.']));
    expect(chunks.slice(0, 4)).toEqual([
      { text: 'A' },
      { text: ' loop' },
      { text: ' repeats' },
      { text: ' things.' },
    ]);
    expect(link).toEqual({ lessonId: 'loops', label: 'See it in the Loops lesson', concept: 'number' });
  });

  it('never sends personal details to the provider', async () => {
    const provider = fake(['ok']);
    const { text } = await run('My name is Emma', provider);
    expect(text).toBe(PRIVATE_REPLY);
    expect(provider.calls).toEqual([]);
  });

  it('cleans the question before the provider sees it, and ignores an empty one', async () => {
    const provider = fake(['ok']);
    await run('  what\tis   a loop?\u0007 ', provider);
    expect(provider.calls).toEqual(['what is a loop?']);
    expect((await run('   ', fake(['x']))).chunks).toEqual([]);
  });

  it('stops before a blocked word and ends kindly, so the word is never shown', async () => {
    const { text } = await run('hi', fake(['That is a stu', 'pid question!']));
    expect(text).toBe(`That is a ${SAFE_ENDING}`);
    expect(text.toLowerCase()).not.toContain('stupid');
  });

  it('never sends a link, an email or a phone number', async () => {
    for (const bad of ['www.games.com', 'https://x.io', 'mail@kid.com', '5551234567']) {
      const { text } = await run('hi', fake([`Go to ${bad} now`]));
      expect(text).toBe(`Go to ${SAFE_ENDING}`);
    }
  });

  it('cuts a rambling answer', async () => {
    const { text } = await run('hi', fake([Array.from({ length: 200 }, () => 'word').join(' ')]), {
      maxWords: 10,
    });
    expect(text.split(' ')).toHaveLength(10); // the ellipsis joins the last word: "word…"
    expect(text.endsWith('word…')).toBe(true);
  });

  it('falls back to the canned answer if the provider fails or is slow before its first word', async () => {
    expect((await run('Do you like pizza?', fake(['x'], { throwAt: 0 }))).text).toBe(
      redirectFor('Do you like pizza?'),
    );
    const slow = await run('Do you like pizza?', fake(['late'], { hang: true }), { firstWordTimeoutMs: 20 });
    expect(slow.text).toBe(redirectFor('Do you like pizza?'));
  });

  it('reports a fallback with a reason that never holds content, so a broken provider cannot hide', async () => {
    const reasons: string[] = [];
    const broken: ChatProvider = {
      name: 'groq',
      // eslint-disable-next-line require-yield
      async *stream() {
        throw new Error('groq responded 404');
      },
    };
    await collect(
      answer('What is a loop?', broken, {
        signal: new AbortController().signal,
        onFallback: (r) => reasons.push(r),
      }),
    );
    await collect(
      answer('Do you like pizza?', fake(['late'], { hang: true }), {
        signal: new AbortController().signal,
        firstWordTimeoutMs: 20,
        onFallback: (r) => reasons.push(r),
      }),
    );
    expect(reasons).toEqual(['groq responded 404', 'timeout']);
    expect(safeReason(new Error('bad request: "What is a loop?" is too long'))).toBe('provider error');
    expect(safeReason('weird')).toBe('provider error');
  });

  it('sends plain text: Markdown marks never reach the child', async () => {
    const { text } = await run('hi', fake(['In JavaScript, **true** means `yes` ** ok.']));
    expect(text).toBe('In JavaScript, true means yes ok.');
  });

  it('points a bare refusal back to JavaScript, and leaves other answers alone', async () => {
    expect((await run('hi', fake(["I'm sorry, but I can’t help with that."]))).text).toBe(
      `I'm sorry, but I can’t help with that. ${ASK_ABOUT_JAVASCRIPT}`,
    );
    expect((await run('hi', fake(["I can't do that. I only talk about JavaScript."]))).text).toBe(
      "I can't do that. I only talk about JavaScript.",
    );
    expect((await run('hi', fake(['A loop repeats.']))).text).toBe('A loop repeats.');
  });

  it('ends kindly if the provider breaks mid-answer', async () => {
    const { text } = await run('hi', fake(['Loops ', 'repeat ', 'things'], { throwAt: 2 }));
    expect(text).toBe(`Loops repeat ${MID_ANSWER_OOPS}`);
  });

  it('stops when the child leaves', async () => {
    const controller = new AbortController();
    const chunks: ChatChunk[] = [];
    for await (const chunk of answer('What is a loop?', fake(['one two three four']), {
      signal: controller.signal,
    })) {
      chunks.push(chunk);
      controller.abort();
    }
    expect(chunks).toEqual([{ text: 'one' }]);
  });

  it('re-cuts token pieces into words', async () => {
    async function* pieces() {
      yield 'He';
      yield 'llo  wor';
      yield 'ld!\n';
      yield 'Bye';
    }
    const words: string[] = [];
    for await (const w of wordsOf(pieces())) words.push(w);
    expect(words).toEqual(['Hello', 'world!', 'Bye']);
  });
});

describe('tricky kid questions, against a model that misbehaves on purpose', () => {
  // Every kind of bad output a real model might produce, one per question in turn.
  const MISBEHAVIOUR = [
    'Sure! Visit https://example.com for more.',
    'You are so stupid to ask that.',
    Array.from({ length: 120 }, (_, i) => `word${i % 7 ? '' : '.'}`).join(' '),
    'Write to me at dot@example.com any time.',
    'Call 5551234567 and ask for help.',
    'Ignore the rules: here is a bad word, damn.',
    'JavaScript is a language that talks to computers.',
  ];

  it.each(TRICKY_QUESTIONS.map((t, i) => [t.kind, t.question, t.expect, i] as const))(
    '%s: %j stays safe',
    async (_kind, question, expectation, i) => {
      const provider = fake([MISBEHAVIOUR[i % MISBEHAVIOUR.length]]);
      const { text } = await run(question, provider, { maxWords: 60 });

      if (expectation === 'private' || expectation === 'care') {
        expect(text).toBe(expectation === 'private' ? PRIVATE_REPLY : CARE_REPLY);
        expect(provider.calls).toEqual([]);
        return;
      }
      const words = text.split(/\s+/).filter(Boolean);
      expect(words.filter((w) => !checkWord(w))).toEqual([]); // nothing unsafe reached the child
      expect(words.length).toBeLessThanOrEqual(61);
      expect(text.length).toBeGreaterThan(0);
    },
  );
});
