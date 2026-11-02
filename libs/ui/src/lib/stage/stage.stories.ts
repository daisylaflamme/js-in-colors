import type { Meta, StoryObj } from '@storybook/angular';
import { ConceptShapeComponent } from '../concept-shape/concept-shape';
import { StageComponent } from './stage';

type Args = { bubble: string; width: string };

const meta: Meta<Args> = {
  title: 'Shell/Stage',
  component: StageComponent,
  argTypes: {
    bubble: { control: 'text', description: 'What the character says (polite live region)' },
    width: {
      control: 'inline-radio',
      options: ['24rem', '42rem', '64rem'],
      description: 'Container width: the stage stacks when narrow, sits side by side when wide',
    },
  },
  args: { bubble: 'My favorite is 7!', width: '64rem' },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [ConceptShapeComponent] },
    template: `
      <div [style.inline-size]="width" style="max-inline-size:100%">
        <jic-stage [bubble]="bubble">
          <span jicStageCharacter><jic-concept-shape concept="boolean" [size]="72" /></span>
          <span jicStageArt style="display:grid; justify-items:center; gap:8px; font-weight:800">
            <jic-concept-shape concept="number" [size]="140" />
            Art goes here
          </span>
        </jic-stage>
      </div>`,
  }),
};
export default meta;

type Story = StoryObj<Args>;

export const Wide: Story = {};
export const Narrow: Story = { args: { width: '24rem' } };
export const Silent: Story = { args: { bubble: '' } };
