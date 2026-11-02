import type { Meta, StoryObj } from '@storybook/angular';
import { CONCEPTS } from '@jic/shared';
import { ConceptChipComponent } from './concept-chip';
import { ConceptChipListComponent } from './concept-chip-list';

const meta: Meta<ConceptChipComponent> = {
  title: 'Design system/Concept chip',
  component: ConceptChipComponent,
  argTypes: {
    concept: { control: 'select', options: CONCEPTS },
    label: { control: 'text', description: "Defaults to the concept's kid word" },
  },
  args: { concept: 'string' },
};
export default meta;

type Story = StoryObj<ConceptChipComponent>;

export const Chip: Story = {};

export const CustomLabel: Story = { args: { concept: 'variable', label: 'jars (variables)' } };

/** "Jars can hold:" row. Scrolls sideways on phone (try the Phone viewport), wraps from 600px. */
export const ChipList: StoryObj<ConceptChipListComponent> = {
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [ConceptChipListComponent] },
    template: `<jic-concept-chip-list [label]="label" [concepts]="concepts" />`,
  }),
  args: {
    label: 'Jars can hold:',
    concepts: ['number', 'string', 'boolean', 'object', 'array', 'function'],
  },
  argTypes: {
    label: { control: 'text' },
    concepts: { control: 'check', options: CONCEPTS },
  },
};
