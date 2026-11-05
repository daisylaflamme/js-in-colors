import { TestBed } from '@angular/core/testing';
import { ForkVisualComponent } from './fork/fork-visual';
import { JarVisualComponent } from './jar/jar-visual';
import { ListVisualComponent } from './list/list-visual';
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

describe('ForkVisualComponent', () => {
  const caption = (el: HTMLElement) =>
    el.querySelector('figcaption')?.textContent?.replace(/\s+/g, ' ').trim();
  const fork = { question: 'sunny?', yes: 'park', no: 'books' };

  it('shows the question and where each path goes, and says it in words', async () => {
    const { el } = await render(ForkVisualComponent, { ...fork, take: 'yes' });
    expect(el.querySelector('.sign-text')?.textContent).toBe('sunny?');
    expect(Array.from(el.querySelectorAll('.label')).map((t) => t.textContent)).toEqual(['park', 'books']);
    expect(Array.from(el.querySelectorAll('.end-word')).map((t) => t.textContent)).toEqual(['true', 'false']);
    expect(caption(el)).toBe('A fork: sunny? Yes goes to park. No goes to books. This time: yes, to park.');
    expect(el.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('marks the taken path by line style too, not only by color', async () => {
    const { el } = await render(ForkVisualComponent, { ...fork, take: 'no' });
    const roads = el.querySelectorAll('.road:not(.trunk)');
    expect(roads[0].classList).toContain('skipped'); // yes path: dashed
    expect(roads[1].classList).toContain('taken'); // no path: bold
    expect(el.querySelector('.marker')?.classList).toContain('go-no');
  });

  it('has no marker and no taken path while still deciding', async () => {
    const { el } = await render(ForkVisualComponent, fork);
    expect(el.querySelector('.marker')).toBeNull();
    expect(el.querySelector('.taken, .skipped')).toBeNull();
    expect(caption(el)).toBe('A fork: sunny? Yes goes to park. No goes to books.');
  });

  it('re-creates the marker (restarting its walk) when replayKey changes', async () => {
    const { fixture, el } = await render(ForkVisualComponent, { ...fork, take: 'yes' });
    const before = el.querySelector('.marker');
    fixture.componentRef.setInput('replayKey', 1);
    await fixture.whenStable();
    expect(el.querySelector('.marker')).not.toBe(before);
  });
});

describe('ListVisualComponent', () => {
  const caption = (el: HTMLElement) =>
    el.querySelector('figcaption')?.textContent?.replace(/\s+/g, ' ').trim();
  const texts = (el: HTMLElement, selector: string) =>
    Array.from(el.querySelectorAll(selector)).map((t) => t.textContent);
  const fruits = { name: 'fruits', items: ['apple', 'pear', 'plum'], concept: 'string' };

  it('shows the name, each item and its spot number, and says it in words', async () => {
    const { el } = await render(ListVisualComponent, fruits);
    expect(el.querySelector('.tag-text')?.textContent).toBe('fruits');
    expect(texts(el, '.item-text')).toEqual(['apple', 'pear', 'plum']);
    expect(texts(el, '.spot')).toEqual(['0', '1', '2']);
    expect(el.querySelectorAll('rect.item-shape')).toHaveLength(3); // words are pills
    expect(caption(el)).toBe('A list called fruits: apple, pear, plum.');
    expect(el.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('points at a spot with a thick outline and an arrow, and says which', async () => {
    const { el } = await render(ListVisualComponent, { ...fruits, index: 1 });
    const slots = el.querySelectorAll('.slot');
    expect(slots[1].classList).toContain('pointed');
    expect(slots[1].querySelector('.arrow')).not.toBeNull();
    expect(el.querySelectorAll('.arrow')).toHaveLength(1);
    expect(caption(el)).toBe('A list called fruits: apple, pear, plum. Pointing at spot 1: pear.');
  });

  it('shows an empty list as brackets with nothing inside', async () => {
    const { el } = await render(ListVisualComponent, { name: 'box', items: [] });
    expect(el.querySelector('.slot')).toBeNull();
    expect(el.querySelector('.empty')?.textContent).toBe('(empty)');
    expect(el.querySelectorAll('.bracket')).toHaveLength(2);
    expect(caption(el)).toBe('A list called box. It is empty.');
  });

  it('re-creates the boxes (restarting the pop-in) when replayKey changes', async () => {
    const { fixture, el } = await render(ListVisualComponent, fruits);
    const before = el.querySelector('.slot');
    fixture.componentRef.setInput('replayKey', 1);
    await fixture.whenStable();
    expect(el.querySelector('.slot')).not.toBe(before);
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
    [{ kind: 'fork', question: 'sunny?', yes: 'park', no: 'books' }, 'jic-fork-visual'],
    [{ kind: 'list', name: 'fruits', items: [] }, 'jic-list-visual'],
  ])('renders %o with %s', async (visual, selector) => {
    const { el } = await render(VisualComponent, { visual });
    expect(el.querySelector(selector)).not.toBeNull();
  });
});
