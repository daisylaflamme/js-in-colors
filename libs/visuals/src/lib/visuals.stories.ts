import type { Meta, StoryObj } from '@storybook/angular';
import { CONCEPTS } from '@jic/shared';
import { DotCharacterComponent } from './dot/dot-character';
import { ForkVisualComponent } from './fork/fork-visual';
import { JarVisualComponent } from './jar/jar-visual';
import { MachineVisualComponent } from './machine/machine-visual';
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

type MachineArgs = {
  name: string;
  input: string;
  output: string;
  concept: (typeof CONCEPTS)[number];
  replayKey: number;
};

export const Machine: StoryObj<MachineArgs> = {
  args: { name: 'double', input: '3', output: '6', concept: 'number', replayKey: 0 },
  argTypes: {
    name: { control: 'text', description: 'Name plate (the function name)' },
    input: { control: 'text', description: 'Goes in (empty = nothing)' },
    output: { control: 'text', description: 'Comes out (empty = nothing)' },
    concept: { control: 'select', options: CONCEPTS },
    replayKey: { control: { type: 'number', min: 0 }, description: 'Change to replay in and out' },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [MachineVisualComponent] },
    template: `<jic-machine-visual [name]="name" [input]="input || undefined" [output]="output || undefined" [concept]="concept" [replayKey]="replayKey" />`,
  }),
};

export const IdleMachine: StoryObj<MachineArgs> = {
  ...Machine,
  args: { ...Machine.args, input: '', output: '' },
};
export const MachineWithWords: StoryObj<MachineArgs> = {
  ...Machine,
  args: { ...Machine.args, name: 'shout', input: 'hi', output: 'HI!', concept: 'string' },
};

type ForkArgs = { question: string; yes: string; no: string; take: 'yes' | 'no' | ''; replayKey: number };

export const Fork: StoryObj<ForkArgs> = {
  args: { question: 'sunny?', yes: 'park', no: 'books', take: 'yes', replayKey: 0 },
  argTypes: {
    question: { control: 'text', description: 'The condition on the signpost (max 12 characters)' },
    yes: { control: 'text', description: 'Where the yes (true) path leads' },
    no: { control: 'text', description: 'Where the no (false) path leads' },
    take: {
      control: 'inline-radio',
      options: ['yes', 'no', ''],
      description: 'Path taken (empty = deciding)',
    },
    replayKey: { control: { type: 'number', min: 0 }, description: 'Change to replay the walk' },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [ForkVisualComponent] },
    template: `<jic-fork-visual [question]="question" [yes]="yes" [no]="no" [take]="take || undefined" [replayKey]="replayKey" />`,
  }),
};

export const ForkTakesNo: StoryObj<ForkArgs> = { ...Fork, args: { ...Fork.args, take: 'no' } };
export const ForkDeciding: StoryObj<ForkArgs> = {
  ...Fork,
  args: { ...Fork.args, question: 'age >= 7?', yes: 'big slide', no: 'small slide', take: '' },
};

export const Dot: StoryObj = {
  render: () => ({
    moduleMetadata: { imports: [DotCharacterComponent] },
    template: `<jic-dot-character style="inline-size:10rem" />`,
  }),
};
