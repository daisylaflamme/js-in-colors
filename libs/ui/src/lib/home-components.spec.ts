import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppLogoComponent } from './app-logo/app-logo';
import { type ColorPathNode, ColorPathComponent } from './color-path/color-path';
import { type CopyState, ResumeCodePillComponent } from './resume-code/resume-code-pill';
import { SettingToggleComponent } from './setting-toggle/setting-toggle';

beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

async function render<T>(type: new (...args: never[]) => T, inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(type);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

const nodes: ColorPathNode[] = [
  {
    id: 'hello',
    title: 'Hello, JavaScript!',
    topic: 'Introduction',
    concept: 'intro',
    link: '/lesson/hello',
    state: 'finished',
  },
  {
    id: 'output',
    title: 'Say it out loud',
    topic: 'Output',
    concept: 'string',
    link: '/lesson/output',
    state: 'current',
  },
  {
    id: 'variables',
    title: 'Variables',
    topic: 'Variables',
    concept: 'variable',
    link: '/lesson/variables',
    state: 'todo',
  },
  {
    id: 'loops',
    title: 'Again and again',
    topic: 'Loops',
    concept: 'number',
    link: '/lesson/loops',
    state: 'soon',
  },
];

describe('ColorPathComponent', () => {
  @Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ColorPathComponent],
    template: `<jic-color-path [nodes]="nodes()" goalNote="Finish all 4"
      ><b jicPathGuide>Dot</b></jic-color-path
    >`,
  })
  class Host {
    readonly nodes = signal(nodes);
  }

  it('lists every lesson as a link, then the certificate star (not a link)', async () => {
    const { el } = await render(Host);
    const items = el.querySelectorAll('ol > li');
    expect(items).toHaveLength(5);
    expect(el.querySelectorAll('ol > li a')).toHaveLength(4);
    expect(items[4].querySelector('a')).toBeNull();
    expect(items[4].textContent).toContain('Your certificate!');
    expect(items[4].textContent).toContain('Finish all 4');
    expect(el.querySelector('ol')?.getAttribute('aria-label')).toBe('Your color path');
  });

  it('names each link with its state in words, not color', async () => {
    const { el } = await render(Host);
    const names = [...el.querySelectorAll('ol > li a')].map((a) =>
      a.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(names).toEqual([
      'Hello, JavaScript!, Introduction, finished',
      'Say it out loud, You are here',
      'Variables, Variables',
      'Again and again, Loops, coming soon',
    ]);
  });

  it('marks the current stop, shows Dot beside it and checks on finished stops', async () => {
    const { el } = await render(Host);
    const links = el.querySelectorAll('ol > li a');
    expect(links[1].getAttribute('aria-current')).toBe('step');
    expect(links[0].hasAttribute('aria-current')).toBe(false);
    expect(el.querySelector('[data-state="current"] [jicPathGuide]')?.textContent).toBe('Dot');
    expect(el.querySelectorAll('.check')).toHaveLength(1);
    expect(el.querySelector('[data-state="finished"]')?.classList).toContain('walked');
    expect(el.querySelector('[data-state="current"]')?.classList).not.toContain('walked');
  });
});

describe('ResumeCodePillComponent', () => {
  it('shows the code with a Copy button named for screen readers', async () => {
    const { el } = await render(ResumeCodePillComponent, { code: 'blue-fox-42' });
    expect(el.querySelector('code')?.textContent).toBe('blue-fox-42');
    expect(el.querySelector('button')?.getAttribute('aria-label')).toBe('Copy resume code');
    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe('');
  });

  it('asks the owner to copy and announces the result', async () => {
    const { fixture, el } = await render(ResumeCodePillComponent, { code: 'blue-fox-42' });
    let asked = 0;
    fixture.componentInstance.copyRequested.subscribe(() => asked++);
    el.querySelector('button')?.click();
    expect(asked).toBe(1);

    for (const [state, text] of [
      ['copied', 'Copied!'],
      ['failed', 'Copy did not work. Tap the code to select it.'],
    ] as [CopyState, string][]) {
      fixture.componentRef.setInput('copyState', state);
      await fixture.whenStable();
      expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe(text);
    }
  });
});

describe('SettingToggleComponent', () => {
  @Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SettingToggleComponent],
    template: `
      <button type="button" jic-setting-toggle label="Calm motion" [pressed]="calm()"></button>
      <button type="button" jic-setting-toggle label="Text size" value="Bigger"></button>
    `,
  })
  class Host {
    readonly calm = signal(false);
  }

  it('is a toggle button for on/off settings and names the step for multi-step ones', async () => {
    const { fixture, el } = await render(Host);
    const [calm, size] = el.querySelectorAll('button');
    expect(calm.getAttribute('aria-pressed')).toBe('false');
    expect(calm.textContent?.replace(/\s+/g, ' ').trim()).toBe('Calm motion: off');
    expect(calm.querySelector('[aria-hidden="true"]')?.textContent).toBe(': off');

    fixture.componentInstance.calm.set(true);
    await fixture.whenStable();
    expect(calm.getAttribute('aria-pressed')).toBe('true');
    expect(calm.textContent).toContain(': on');

    expect(size.hasAttribute('aria-pressed')).toBe(false);
    expect(size.textContent?.replace(/\s+/g, ' ').trim()).toBe('Text size: Bigger');
  });
});

describe('AppLogoComponent', () => {
  it('is plain text by default and a link home with `link`', async () => {
    const { el } = await render(AppLogoComponent);
    expect(el.querySelector('a')).toBeNull();

    const { el: linked } = await render(AppLogoComponent, { link: '/' });
    const a = linked.querySelector('a');
    expect(a?.getAttribute('href')).toBe('/');
    expect(a?.textContent?.replace(/\s+/g, ' ').trim()).toBe('JavaScript in Colors, home');
  });
});
