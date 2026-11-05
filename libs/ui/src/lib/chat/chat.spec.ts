import { TestBed } from '@angular/core/testing';
import { ChatBubbleComponent } from './chat-bubble';
import { SAFE_CHAT_RULES, SafeRulesCardComponent } from './safe-rules-card';
import { TypingDotsComponent } from './typing-dots';

async function render<T>(type: new (...args: never[]) => T, inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(type);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('ChatBubbleComponent', () => {
  it('shows the text and says who is talking, in words', async () => {
    const el = await render(ChatBubbleComponent, { from: 'kid', text: 'What is a loop?' });
    expect(el.getAttribute('data-from')).toBe('kid');
    expect(el.querySelector('.text')?.textContent).toBe('What is a loop?');
    expect(el.querySelector('.u-visually-hidden')?.textContent?.trim()).toBe('You:');
    const dot = await render(ChatBubbleComponent, { from: 'dot', text: 'Hi!' });
    expect(dot.querySelector('.u-visually-hidden')?.textContent?.trim()).toBe('Dot:');
  });
});

describe('TypingDotsComponent', () => {
  it('says Dot is typing for screen readers', async () => {
    const el = await render(TypingDotsComponent);
    expect(el.querySelectorAll('.dot')).toHaveLength(3);
    expect(el.textContent?.trim()).toBe('Dot is typing');
  });
});

describe('SafeRulesCardComponent', () => {
  it('lists the four rules under a heading, with an optional note', async () => {
    const el = await render(SafeRulesCardComponent, { note: 'Demo mode.' });
    expect(el.querySelector('h2')?.textContent).toBe("Dot's safe chat rules");
    expect([...el.querySelectorAll('li')].map((li) => li.textContent?.trim())).toEqual(
      SAFE_CHAT_RULES.map((r) => r.text),
    );
    expect(el.querySelector('.note')?.textContent).toBe('Demo mode.');
    expect(el.querySelector('section')?.getAttribute('aria-labelledby')).toBe('safe-rules-title');
  });
});
