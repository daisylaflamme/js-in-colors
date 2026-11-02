import type { Meta, StoryObj } from '@storybook/angular';
import { CONCEPTS } from '@jic/shared';
import { CodePeekToggleComponent } from '../code-peek/code-peek-toggle';
import { ChoiceButtonComponent } from './choice-button';
import { ChoiceRowComponent } from './choice-row';

type ButtonArgs = { concept: (typeof CONCEPTS)[number]; pressed: boolean; label: string };

const meta: Meta<ButtonArgs> = {
  title: 'Shell/Choices',
  component: ChoiceButtonComponent,
  argTypes: {
    concept: { control: 'select', options: CONCEPTS },
    pressed: { control: 'boolean', description: 'Selected (aria-pressed)' },
    label: { control: 'text' },
  },
  args: { concept: 'number', pressed: false, label: '7' },
  render: (args) => ({
    props: args,
    template: `<button type="button" jic-choice-button [concept]="concept" [pressed]="pressed">{{ label }}</button>`,
  }),
};
export default meta;

export const Button: StoryObj<ButtonArgs> = {};
export const Selected: StoryObj<ButtonArgs> = { args: { pressed: true } };

/** Every concept, selected and not. Selected text on object and array fills is ink (contrast). */
export const AllConcepts: StoryObj<ButtonArgs> = {
  render: () => ({
    props: { concepts: CONCEPTS },
    template: `
      <div style="display:grid; gap:12px">
        @for (c of concepts; track c) {
          <div style="display:flex; gap:12px">
            <button type="button" jic-choice-button [concept]="c">{{ c }}</button>
            <button type="button" jic-choice-button [concept]="c" [pressed]="true">{{ c }}</button>
          </div>
        }
      </div>`,
  }),
};

type RowArgs = { label: string; picked: string };

/** The full row with "Peek at the code" at the end (mockups 01, 05, 06). Click a choice to pick it. */
export const Row: StoryObj<RowArgs> = {
  args: { label: 'Pick something for the jar:', picked: 'seven' },
  argTypes: {
    label: { control: 'text' },
    picked: { control: 'inline-radio', options: ['seven', 'emma', 'yes'] },
  },
  render: (args) => ({
    props: { ...args, peek: false },
    moduleMetadata: { imports: [ChoiceRowComponent, CodePeekToggleComponent] },
    template: `
      <jic-choice-row [label]="label">
        <button type="button" jic-choice-button concept="number" [pressed]="picked === 'seven'" (click)="picked = 'seven'">7</button>
        <button type="button" jic-choice-button concept="string" [pressed]="picked === 'emma'" (click)="picked = 'emma'">Emma</button>
        <button type="button" jic-choice-button concept="boolean" [pressed]="picked === 'yes'" (click)="picked = 'yes'">yes!</button>
        <button type="button" jic-code-peek-toggle jicChoiceRowEnd [expanded]="peek" (click)="peek = !peek"></button>
      </jic-choice-row>`,
  }),
};
