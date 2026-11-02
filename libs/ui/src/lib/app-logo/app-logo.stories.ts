import type { Meta, StoryObj } from '@storybook/angular';
import { AppLogoComponent } from './app-logo';

const meta: Meta<AppLogoComponent> = {
  title: 'Shell/App logo',
  component: AppLogoComponent,
  argTypes: { stacked: { control: 'boolean', description: 'Two lines, as at the top of the menu' } },
  args: { stacked: false },
};
export default meta;

export const Inline: StoryObj<AppLogoComponent> = {};
export const Stacked: StoryObj<AppLogoComponent> = { args: { stacked: true } };
