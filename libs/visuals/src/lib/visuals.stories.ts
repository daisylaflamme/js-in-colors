import type { Meta, StoryObj } from '@storybook/angular';
import { CONCEPTS } from '@jic/shared';
import { DotCharacterComponent } from './dot/dot-character';
import { JarVisualComponent } from './jar/jar-visual';
import { ScreenVisualComponent } from './screen/screen-visual';

/** Lesson pictures (libs/visuals). Animations respect reduced motion and the calm-motion setting. */
const meta: Meta = {
  title: 'Visuals',
  decorators: [
    (story) => {
      const s = story();
      return {
        ...s,
        template: `<div style="container-type:inline-size; max-inline-size:40rem">${s.template}</div>`,
      };
    },
  ],
};
export default meta;

type JarArgs = { name: string; value: string; concept: (typeof CONCEPTS)[number]; replayKey: number };

export const Jar: StoryObj<JarArgs> = {
  args: { name: 'favorite', value: '7', concept: 'number', replayKey: 0 },
  argTypes: {
    name: { control: 'text', description: 'Name tag' },
    value: { control: 'text', description: 'Inside (empty = empty jar)' },
    concept: { control: 'select', options: CONCEPTS },
    replayKey: { control: { type: 'number', min: 0 }, description: 'Change to replay the drop-in' },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [JarVisualComponent] },
    template: `<jic-jar-visual [name]="name" [value]="value || undefined" [concept]="concept" [replayKey]="replayKey" />`,
  }),
};

export const EmptyJar: StoryObj<JarArgs> = { ...Jar, args: { ...Jar.args, value: '' } };
export const JarWithWord: StoryObj<JarArgs> = {
  ...Jar,
  args: { ...Jar.args, value: 'Emma', concept: 'string' },
};
export const JarWithYes: StoryObj<JarArgs> = {
  ...Jar,
  args: { ...Jar.args, value: 'yes', concept: 'boolean' },
};

type ScreenArgs = { lines: string[]; caption: string; replayKey: number };

export const Screen: StoryObj<ScreenArgs> = {
  args: { lines: ['Hi!', 'I like cats.'], caption: 'The computer says:', replayKey: 0 },
  argTypes: {
    lines: { control: 'object' },
    caption: { control: 'text' },
    replayKey: { control: { type: 'number', min: 0 } },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [ScreenVisualComponent] },
    template: `<jic-screen-visual [lines]="lines" [caption]="caption" [replayKey]="replayKey" />`,
  }),
};

export const Dot: StoryObj = {
  render: () => ({
    moduleMetadata: { imports: [DotCharacterComponent] },
    template: `<jic-dot-character style="inline-size:10rem" />`,
  }),
};
