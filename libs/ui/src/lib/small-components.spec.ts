import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CONCEPTS, CONCEPT_INFO } from '@jic/shared';
import { CodePanelComponent } from './code-peek/code-panel';
import { CodePeekToggleComponent } from './code-peek/code-peek-toggle';
import { ConceptChipComponent } from './concept-chip/concept-chip';
import { ConceptChipListComponent } from './concept-chip/concept-chip-list';
import { ConceptShapeComponent } from './concept-shape/concept-shape';
import { LessonHeaderComponent } from './lesson-header/lesson-header';
import { LibraryPanelComponent } from './library-panel/library-panel';
import { MenuButtonComponent } from './menu-button/menu-button';
import { StageComponent } from './stage/stage';
import { TipCardComponent } from './tip-card/tip-card';

async function render<T>(type: new (...args: never[]) => T, inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(type);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('ConceptShapeComponent', () => {
  it.each(CONCEPTS)('draws the %s shape, hidden from screen readers', async (concept) => {
    const { el } = await render(ConceptShapeComponent, { concept });
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('data-shape')).toBe(CONCEPT_INFO[concept].shape);
    expect(el.querySelector('svg > *')).not.toBeNull();
  });
});

describe('ConceptChipComponent', () => {
  it('shows the kid word by default and a custom label when given', async () => {
    const { el } = await render(ConceptChipComponent, { concept: 'boolean' });
    expect(el.textContent?.trim()).toBe('yes or no');

    const { el: custom } = await render(ConceptChipComponent, {
      concept: 'variable',
      label: 'jars (variables)',
    });
    expect(custom.textContent?.trim()).toBe('jars (variables)');
  });
});

describe('ConceptChipListComponent', () => {
  it('renders a list labelled by its label', async () => {
    const { el } = await render(ConceptChipListComponent, {
      label: 'Jars can hold:',
      concepts: ['number', 'string'],
    });
    const list = el.querySelector('ul');
    expect(el.querySelector(`#${list?.getAttribute('aria-labelledby')}`)?.textContent).toBe('Jars can hold:');
    expect(list?.querySelectorAll('li')).toHaveLength(2);
  });
});

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MenuButtonComponent, CodePeekToggleComponent],
  template: `
    <button type="button" jic-menu-button [expanded]="true" controls="menu"></button>
    <button type="button" jic-code-peek-toggle [expanded]="false" controls="code"></button>
  `,
})
class ButtonsHost {}

describe('MenuButton and CodePeekToggle', () => {
  it('are native buttons with names and disclosure state', async () => {
    const { el } = await render(ButtonsHost);
    const [menu, peek] = Array.from(el.querySelectorAll('button'));
    expect(menu.type).toBe('button');
    expect(menu.getAttribute('aria-label')).toBe('Lesson menu');
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(menu.getAttribute('aria-controls')).toBe('menu');
    expect(peek.textContent).toContain('Peek at the code');
    expect(peek.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('LessonHeaderComponent', () => {
  const base = { lessonNumber: 3, lessonCount: 10, title: 'Variables', concept: 'variable' };

  it('renders the h1, the count and the highlighted lead word', async () => {
    const { el } = await render(LessonHeaderComponent, {
      ...base,
      lead: 'A variable is a jar with a name on it.',
      leadHighlight: 'jar',
    });
    expect(el.querySelector('h1')?.textContent).toBe('Variables');
    expect(el.querySelector('.count')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Lesson 3 of 10');
    expect(el.querySelector('.highlight')?.textContent).toBe('jar');
    expect(el.querySelector('.lead')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'A variable is a jar with a name on it.',
    );
  });

  it('copes with a highlight that is not in the lead', async () => {
    const { el } = await render(LessonHeaderComponent, { ...base, lead: 'Hello.', leadHighlight: 'jar' });
    expect(el.querySelector('.highlight')).toBeNull();
    expect(el.querySelector('.lead')?.textContent?.trim()).toBe('Hello.');
  });
});

describe('StageComponent', () => {
  it('puts the speech bubble in a polite live region', async () => {
    const { el } = await render(StageComponent, { bubble: 'My favorite is 7!' });
    const bubble = el.querySelector('.bubble');
    expect(bubble?.getAttribute('aria-live')).toBe('polite');
    expect(bubble?.textContent).toBe('My favorite is 7!');
  });
});

describe('CodePanelComponent', () => {
  it('renders the code line and the plain-words notes', async () => {
    const { el } = await render(CodePanelComponent, {
      code: [
        { text: 'let', kind: 'keyword' },
        { text: ' ', kind: 'punctuation' },
        { text: 'favorite', kind: 'name' },
        { text: ' = ', kind: 'operator' },
        { text: '7', kind: 'value', concept: 'number' },
        { text: ';', kind: 'punctuation' },
      ],
      notes: [{ term: 'let', kind: 'keyword', text: 'means: make a new jar' }],
    });
    expect(el.querySelector('code')?.textContent).toBe('let favorite = 7;');
    expect(el.querySelector('.notes li')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'let means: make a new jar',
    );
  });
});

describe('TipCard and LibraryPanel', () => {
  it.each([
    [TipCardComponent, 'Tip', 'Close tip'],
    [LibraryPanelComponent, 'Library', 'Close library'],
  ] as const)(
    '%o is a dialog labelled by its heading with a named close button',
    async (type, title, closeName) => {
      const { fixture, el } = await render(type, { open: true });
      const dialog = el.querySelector('dialog');
      expect(dialog?.open).toBe(true);
      expect(el.querySelector(`#${dialog?.getAttribute('aria-labelledby')}`)?.textContent).toBe(title);

      const closed = vi.fn();
      fixture.componentInstance.closed.subscribe(closed);
      const close = el.querySelector<HTMLButtonElement>(`button[aria-label="${closeName}"]`);
      close?.click();
      expect(closed).toHaveBeenCalledOnce();
    },
  );
});
