import type { Meta, StoryObj } from '@storybook/angular';
import { HelpTabsComponent } from './help-tabs';

const meta: Meta<HelpTabsComponent> = {
  title: 'Shell/Help tabs',
  component: HelpTabsComponent,
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Phone: bottom tab bar. From 600px: tabs on the right edge.' } },
  },
  argTypes: {
    tipOpen: { control: 'boolean' },
    libraryOpen: { control: 'boolean' },
    readAloudAvailable: { control: 'boolean', description: 'False hides "Read to me"' },
    reading: { control: 'boolean' },
    tipToggle: { action: 'tipToggle' },
    libraryToggle: { action: 'libraryToggle' },
    readAloud: { action: 'readAloud' },
  },
  args: { tipOpen: false, libraryOpen: false, readAloudAvailable: true, reading: false },
};
export default meta;

type Story = StoryObj<HelpTabsComponent>;

/** Right-edge tabs (tablet and desktop). */
export const RightEdge: Story = { globals: { viewport: { value: 'desktop' } } };

/** Bottom tab bar (phone, mockup 13). */
export const PhoneTabBar: Story = { globals: { viewport: { value: 'phone' } } };

export const Reading: Story = { args: { reading: true } };

export const WithoutSpeech: Story = { args: { readAloudAvailable: false } };
