import { TestBed } from '@angular/core/testing';
import { JarVisualComponent } from './jar/jar-visual';
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
  ])('renders %o with %s', async (visual, selector) => {
    const { el } = await render(VisualComponent, { visual });
    expect(el.querySelector(selector)).not.toBeNull();
  });
});
