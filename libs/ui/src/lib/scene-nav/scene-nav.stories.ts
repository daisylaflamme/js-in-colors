import type { Meta, StoryObj } from '@storybook/angular';
import { SceneNavComponent } from './scene-nav';

const meta: Meta<SceneNavComponent> = {
  title: 'Shell/Scene nav',
  component: SceneNavComponent,
  argTypes: {
    scene: { control: { type: 'range', min: 1, max: 6 } },
    sceneCount: { control: { type: 'range', min: 4, max: 6 } },
    nextLabel: { control: 'text' },
    back: { action: 'back' },
    next: { action: 'next' },
  },
  args: { scene: 3, sceneCount: 5, nextLabel: 'Next' },
};
export default meta;

type Story = StoryObj<SceneNavComponent>;

export const MiddleScene: Story = {};
/** Back is disabled on the first scene. */
export const FirstScene: Story = { args: { scene: 1 } };
export const LastScene: Story = { args: { scene: 5 } };
