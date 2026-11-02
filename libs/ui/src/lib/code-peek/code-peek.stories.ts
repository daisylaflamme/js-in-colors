import type { Meta, StoryObj } from '@storybook/angular';
import { CodePanelComponent, type CodeNote, type CodeToken } from './code-panel';
import { CodePeekToggleComponent } from './code-peek-toggle';

const code = (value: string, concept: CodeToken['concept']): CodeToken[] => [
  { text: 'let', kind: 'keyword' },
  { text: ' ', kind: 'punctuation' },
  { text: 'favorite', kind: 'name' },
  { text: ' = ', kind: 'operator' },
  { text: value, kind: 'value', concept },
  { text: ';', kind: 'punctuation' },
];

const notes: CodeNote[] = [
  { term: 'let', kind: 'keyword', text: 'means: make a new jar' },
  { term: 'favorite', kind: 'name', text: 'is the name on the jar' },
  { term: '=', kind: 'operator', text: 'puts the value inside' },
];

const meta: Meta<CodePanelComponent> = {
  title: 'Shell/Code peek',
  component: CodePanelComponent,
  argTypes: {
    code: { control: 'object' },
    notes: { control: 'object' },
  },
  args: { code: code('7', 'number'), notes },
};
export default meta;

type Story = StoryObj<CodePanelComponent>;

/** The dark panel (mockup 07). Always dark, in every theme. */
export const Panel: Story = {};
export const WordValue: Story = { args: { code: code('"Emma"', 'string') } };
export const YesNoValue: Story = { args: { code: code('true', 'boolean') } };

/** The toggle + panel together. */
export const Toggle: StoryObj<{ expanded: boolean }> = {
  args: { expanded: false },
  argTypes: { expanded: { control: 'boolean', description: 'aria-expanded' } },
  render: (args) => ({
    props: { ...args, code: code('7', 'number'), notes },
    moduleMetadata: { imports: [CodePeekToggleComponent] },
    template: `
      <div style="display:grid; gap:16px; justify-items:start">
        <button type="button" jic-code-peek-toggle controls="peek" [expanded]="expanded" (click)="expanded = !expanded"></button>
        @if (expanded) { <jic-code-panel id="peek" [code]="code" [notes]="notes" style="justify-self:stretch" /> }
      </div>`,
  }),
};
