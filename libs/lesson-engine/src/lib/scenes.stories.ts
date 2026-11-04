import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import type { Scene } from '@jic/shared';
import { LibraryContentComponent } from './library-content';
import type { SceneAction, SceneState } from './scene-contract';
import { SceneHostComponent } from './scene-host';
import { provideDefaultSceneTypes } from './scene-registry';
import { SAMPLE_INTERACT, SAMPLE_LIBRARY, SAMPLE_QUIZ, SAMPLE_WATCH } from './testing/sample-scenes';

/**
 * Scene types rendered by the SceneHost from data (sample data, not real lessons).
 * The story keeps the scene state, like the app's LessonStore does: click choices and answers.
 */
const meta: Meta<{ scene: Scene }> = {
  title: 'Lesson engine/Scenes',
  decorators: [applicationConfig({ providers: [provideDefaultSceneTypes()] })],
  argTypes: { scene: { control: 'object', description: 'Scene data (as in content/lessons/*.yaml)' } },
  render: (args) => ({
    props: {
      ...args,
      state: { pickedChoiceId: null, answeredOptionId: null } as SceneState,
      onAction(this: { state: SceneState }, a: SceneAction) {
        this.state =
          a.kind === 'pick'
            ? { ...this.state, pickedChoiceId: a.id }
            : { ...this.state, answeredOptionId: a.id };
      },
    },
    moduleMetadata: { imports: [SceneHostComponent] },
    template: `<jic-scene-host [scene]="scene" [state]="state" (action)="onAction($event)" />`,
  }),
};
export default meta;

type Story = StoryObj<{ scene: Scene }>;

export const Watch: Story = { args: { scene: SAMPLE_WATCH } };
export const Interact: Story = { args: { scene: SAMPLE_INTERACT } };
export const Quiz: Story = { args: { scene: SAMPLE_QUIZ } };
export const ScreenInteract: Story = {
  args: {
    scene: {
      id: 'say',
      type: 'interact',
      prompt: 'Pick a word for the screen:',
      visual: { kind: 'screen', lines: [] },
      choices: [
        {
          id: 'hi',
          label: 'Hi!',
          concept: 'string',
          value: 'Hi!',
          bubble: 'The screen says Hi!',
          code: 'console.log("Hi!");',
        },
        {
          id: 'cat',
          label: 'cat',
          concept: 'string',
          value: 'cat',
          bubble: 'The screen says cat.',
          code: 'console.log("cat");',
        },
      ],
    },
  },
};

export const Library: StoryObj<LibraryContentComponent> = {
  args: { entry: SAMPLE_LIBRARY, concept: 'variable', canRead: true, reading: false },
  argTypes: {
    entry: { control: 'object' },
    canRead: { control: 'boolean' },
    reading: { control: 'boolean' },
    readAloud: { action: 'readAloud' },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [LibraryContentComponent] },
    template: `<jic-library-content [entry]="entry" [concept]="concept" [canRead]="canRead" [reading]="reading" (readAloud)="readAloud($event)" />`,
  }),
};
