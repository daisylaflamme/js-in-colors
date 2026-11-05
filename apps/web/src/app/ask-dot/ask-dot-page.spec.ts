import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { memoryProgressStorage } from '@jic/data-access';
import { type ChatChunk, ChatService, ChatStore, PRIVATE_REPLY } from '@jic/data-access/chat';
import { Subject } from 'rxjs';
import { AskDotPage } from './ask-dot-page';

/** A chat service the test drives by hand: each question gets its own stream. */
function fakeChat() {
  const asked: string[] = [];
  let current = new Subject<ChatChunk>();
  const service: ChatService = {
    ask: (q: string) => {
      asked.push(q);
      current = new Subject<ChatChunk>();
      return current;
    },
  };
  return { service, asked, stream: () => current };
}

async function setup(from?: string) {
  const chat = fakeChat();
  TestBed.configureTestingModule({ providers: [provideRouter([]), memoryProgressStorage().provider] });
  TestBed.overrideComponent(AskDotPage, {
    set: { providers: [ChatStore, { provide: ChatService, useValue: chat.service }] },
  });
  const fixture = TestBed.createComponent(AskDotPage);
  if (from) fixture.componentRef.setInput('from', from);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const text = (s: string) => el.querySelector(s)?.textContent?.replace(/\s+/g, ' ').trim();
  const bubbles = () =>
    [...el.querySelectorAll('jic-chat-bubble')].map((b) => ({
      from: b.getAttribute('data-from'),
      text: b.querySelector('.text')?.textContent,
    }));
  const typeAndSend = async (q: string) => {
    const input = el.querySelector<HTMLInputElement>('#question');
    if (!input) throw new Error('no input');
    input.value = q;
    input.dispatchEvent(new Event('input'));
    el.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  };
  return { fixture, el, text, bubbles, typeAndSend, chat };
}

describe('AskDotPage', () => {
  afterEach(() => document.body.replaceChildren());

  it('greets, shows demo mode and the safe chat rules', async () => {
    const { el, text, bubbles } = await setup();
    expect(text('h1')).toBe('Ask Dot');
    expect(text('.demo-pill')).toBe('Demo mode');
    expect(bubbles()).toEqual([{ from: 'dot', text: 'Hi! I am Dot. Ask me anything about JavaScript.' }]);
    expect(el.querySelector('jic-safe-rules-card h2')?.textContent).toBe("Dot's safe chat rules");
    expect(el.querySelector('label[for="question"]')?.textContent).toBe('Your question');
    expect(el.querySelector('[role="log"]')?.getAttribute('aria-live')).toBe('off');
  });

  it('goes back to the lesson it came from, or to the color path', async () => {
    const { el, text } = await setup('loops');
    expect(text('a.back')).toBe('Back to the lesson');
    expect(el.querySelector('a.back')?.getAttribute('href')).toBe('/lesson/loops');
    TestBed.resetTestingModule();
    const other = await setup('nope');
    expect(other.text('a.back')).toBe('Back to your color path');
    expect(other.el.querySelector('a.back')?.getAttribute('href')).toBe('/');
  });

  it('asks a typed question, shows typing, streams the answer and announces it when done', async () => {
    const { el, bubbles, typeAndSend, chat, fixture, text } = await setup();
    await typeAndSend('What is a loop?');
    expect(chat.asked).toEqual(['What is a loop?']);
    expect(el.querySelector('jic-typing-dots')).not.toBeNull();
    expect(el.querySelector<HTMLButtonElement>('button.send')?.disabled).toBe(true);
    expect(el.querySelector<HTMLInputElement>('#question')?.value).toBe('');
    expect(document.activeElement?.id).toBe('question');

    chat.stream().next({ text: 'A loop' });
    chat.stream().next({ text: ' repeats.' });
    await fixture.whenStable();
    expect(el.querySelector('jic-typing-dots')).toBeNull();
    expect(bubbles().at(-1)).toEqual({ from: 'dot', text: 'A loop repeats.' });
    expect(text('[role="status"]')).toBe('');

    chat
      .stream()
      .next({ link: { lessonId: 'loops', label: 'See it in the Loops lesson', concept: 'number' } });
    chat.stream().complete();
    await fixture.whenStable();
    expect(el.querySelector('.lesson-link')?.getAttribute('href')).toBe('/lesson/loops');
    expect(text('.lesson-link')).toBe('See it in the Loops lesson');
    expect(text('[role="status"]')).toBe('Dot says: A loop repeats.');
    expect(el.querySelector<HTMLButtonElement>('button.send')?.disabled).toBe(false);
  });

  it('asks a suggestion with one click', async () => {
    const { el, chat, fixture } = await setup();
    const chips = [...el.querySelectorAll<HTMLButtonElement>('button.chip')];
    expect(chips.map((c) => c.textContent?.trim())).toEqual([
      'What is a variable?',
      'What is a function?',
      'What does true mean?',
    ]);
    chips[1].click();
    await fixture.whenStable();
    expect(chat.asked).toEqual(['What is a function?']);
  });

  it('keeps personal details away from the chat service', async () => {
    const { bubbles, typeAndSend, chat } = await setup();
    await typeAndSend('my name is Emma');
    expect(chat.asked).toEqual([]);
    expect(bubbles().at(-1)).toEqual({ from: 'dot', text: PRIVATE_REPLY });
  });
});
