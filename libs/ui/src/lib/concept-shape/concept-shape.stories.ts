import type { Meta, StoryObj } from '@storybook/angular';
import { CONCEPTS } from '@jic/shared';
import { ConceptShapeComponent } from './concept-shape';

const meta: Meta<ConceptShapeComponent> = {
  title: 'Design system/Concept shape',
  component: ConceptShapeComponent,
  argTypes: {
    concept: { control: 'select', options: CONCEPTS },
    size: { control: { type: 'range', min: 12, max: 96, step: 4 } },
    color: { control: 'text', description: 'Optional fill override (CSS color or var())' },
  },
  args: { concept: 'number', size: 48 },
};
export default meta;

type Story = StoryObj<ConceptShapeComponent>;

export const Playground: Story = {};

/** Every concept: color + shape + word. Never color alone. */
export const AllConcepts: Story = {
  render: (args) => ({
    props: { ...args, concepts: CONCEPTS },
    template: `
      <ul style="display:flex; flex-wrap:wrap; gap:var(--space-5); list-style:none; padding:0">
        @for (c of concepts; track c) {
          <li style="display:grid; justify-items:center; gap:var(--space-2); font-weight:800">
            <jic-concept-shape [concept]="c" [size]="size" />
            <span [style.color]="'var(--color-' + c + '-text)'">{{ c }}</span>
          </li>
        }
      </ul>
    `,
  }),
};
