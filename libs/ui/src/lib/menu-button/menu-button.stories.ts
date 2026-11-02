import type { Meta, StoryObj } from '@storybook/angular';
import { MenuButtonComponent } from './menu-button';

type Args = { expanded: boolean; controls: string };

const meta: Meta<Args> = {
  title: 'Shell/Menu button',
  component: MenuButtonComponent,
  argTypes: {
    expanded: { control: 'boolean', description: 'Reflected as aria-expanded' },
    controls: { control: 'text', description: 'id of the menu (aria-controls)' },
  },
  args: { expanded: false, controls: 'lesson-menu' },
  render: (args) => ({
    props: args,
    template: `<button type="button" jic-menu-button [expanded]="expanded" [controls]="controls"></button>
      <nav id="lesson-menu" aria-label="Lessons" [hidden]="!expanded">(menu)</nav>`,
  }),
};
export default meta;

export const Closed: StoryObj<Args> = {};
export const Open: StoryObj<Args> = { args: { expanded: true } };
