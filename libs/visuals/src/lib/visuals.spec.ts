import { TestBed } from '@angular/core/testing';
import { JarVisualComponent } from './jar/jar-visual';
import { MachineVisualComponent } from './machine/machine-visual';
import { ScreenVisualComponent } from './screen/screen-visual';
import { VisualComponent } from './visual/visual';

async function render<T>(type: new (...args: never[]) => T, inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(type);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('JarVisualComponent', () => {
  it('shows the name and says in words what is inside', async () => {
    const { el } = await render(JarVisualComponent, { name: 'favorite', value: 'Emma', concept: 'string' });
    expect(el.querySelector('.tag-text')?.textContent).toBe('favorite');
    expect(el.querySelector('.value-text')?.textContent).toBe('Emma');
    expect(el.querySelector('figcaption')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'A jar named favorite . Inside: Emma',
    );
    expect(el.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws the value in its concept shape, and says when the jar is empty', async () => {
    const { el } = await render(JarVisualComponent, { name: 'box', value: 'yes', concept: 'boolean' });
    expect(el.querySelector('path.value-shape')).not.toBeNull(); // diamond

    const { el: empty } = await render(JarVisualComponent, { name: 'box' });
    expect(empty.querySelector('.value')).toBeNull();
    expect(empty.querySelector('figcaption')?.textContent).toContain('It is empty');
  });

  it('re-creates the value (restarting its animation) when replayKey changes', async () => {
    const { fixture, el } = await render(JarVisualComponent, { name: 'box', value: '7', concept: 'number' });
    const before = el.querySelector('.value');
    fixture.componentRef.setInput('replayKey', 1);
    await fixture.whenStable();
    expect(el.querySelector('.value')).not.toBe(before);
  });
});

describe('MachineVisualComponent', () => {
  const caption = (el: HTMLElement) =>
    el.querySelector('figcaption')?.textContent?.replace(/\s+/g, ' ').trim();

  it('shows the name, what goes in and what comes out, and says it in words', async () => {
    const { el } = await render(MachineVisualComponent, {
      name: 'double',
      input: '3',
      output: '6',
      concept: 'number',
    });
    expect(el.querySelector('.plate-text')?.textContent).toBe('double');
    expect(el.querySelector('.in .token-text')?.textContent).toBe('3');
    expect(el.querySelector('.out .token-text')?.textContent).toBe('6');
    expect(el.querySelectorAll('circle.token-shape')).toHaveLength(2); // numbers are circles
    expect(caption(el)).toBe('A machine called double. In: 3. Out: 6.');
    expect(el.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws words as pills, and waits empty with no input', async () => {
    const { el } = await render(MachineVisualComponent, {
      name: 'shout',
      input: 'hi',
      output: 'HI!',
      concept: 'string',
    });
    expect(el.querySelectorAll('rect.token-shape')).toHaveLength(2);

    const { el: idle } = await render(MachineVisualComponent, { name: 'double' });
    expect(idle.querySelector('.in')).toBeNull();
    expect(idle.querySelector('.out')).toBeNull();
    expect(caption(idle)).toBe('A machine called double');
  });

  it('re-creates the tokens (restarting their animation) when replayKey changes', async () => {
    const { fixture, el } = await render(MachineVisualComponent, { name: 'double', input: '3', output: '6' });
    const before = el.querySelector('.in');
    fixture.componentRef.setInput('replayKey', 1);
    await fixture.whenStable();
    expect(el.querySelector('.in')).not.toBe(before);
  });
});

describe('ScreenVisualComponent', () => {
  it('shows output lines as real text', async () => {
    const { el } = await render(ScreenVisualComponent, { lines: ['Hi!', '7'] });
    const items = Array.from(el.querySelectorAll('.lines li')).map((li) => li.textContent);
    expect(items).toEqual(['Hi!', '7']);
    expect(el.querySelector('.lines')?.getAttribute('aria-label')).toBe('The screen shows');
  });
});

describe('VisualComponent', () => {
  it.each([
    [{ kind: 'jar', name: 'box' }, 'jic-jar-visual'],
    [{ kind: 'screen', lines: ['Hi'] }, 'jic-screen-visual'],
    [{ kind: 'dot' }, 'jic-dot-character'],
    [{ kind: 'machine', name: 'double' }, 'jic-machine-visual'],
  ])('renders %o with %s', async (visual, selector) => {
    const { el } = await render(VisualComponent, { visual });
    expect(el.querySelector(selector)).not.toBeNull();
  });
});
