import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { ColorPathComponent, type ColorPathNode, type ColorPathState } from './color-path/color-path';
import { ConceptChipListComponent } from './concept-chip/concept-chip-list';
import { ResumeCodePillComponent } from './resume-code/resume-code-pill';
import { SettingToggleComponent } from './setting-toggle/setting-toggle';

/** Pieces of the Home screen (mockup 08). */
const meta: Meta = {
  title: 'Home/Color path and header',
  decorators: [applicationConfig({ providers: [provideRouter([])] })],
};
export default meta;

const lessons: Omit<ColorPathNode, 'state' | 'link'>[] = [
  { id: 'hello', title: 'Hello, JavaScript!', topic: 'Introduction', concept: 'intro' },
  { id: 'output', title: 'Say it out loud', topic: 'Output', concept: 'string' },
  { id: 'variables', title: 'Variables', topic: 'Variables', concept: 'variable' },
  { id: 'types', title: 'Numbers, words, yes/no', topic: 'Data types', concept: 'number' },
  { id: 'functions', title: 'Magic machines', topic: 'Functions', concept: 'function' },
  { id: 'conditions', title: 'Yes or no paths', topic: 'Conditions', concept: 'boolean' },
  { id: 'loops', title: 'Again and again', topic: 'Loops', concept: 'number' },
  { id: 'arrays', title: 'Lists of things', topic: 'Arrays', concept: 'array' },
  { id: 'objects', title: 'Things with details', topic: 'Objects', concept: 'object' },
  { id: 'dom', title: 'Page magic', topic: 'The DOM', concept: 'html' },
];

/** `finished` lessons are done; the next one is current; lessons after the third are coming soon. */
function path(finished: number): ColorPathNode[] {
  return lessons.map((l, i) => {
    const state: ColorPathState =
      i < finished ? 'finished' : i === finished ? 'current' : i > 2 ? 'soon' : 'todo';
    return { ...l, link: '/', state };
  });
}

type PathArgs = { finished: number };

export const ColorPath: StoryObj<PathArgs> = {
  args: { finished: 2 },
  argTypes: { finished: { control: { type: 'range', min: 0, max: 10 }, description: 'Lessons finished' } },
  render: ({ finished }) => ({
    props: { nodes: path(finished) },
    moduleMetadata: { imports: [ColorPathComponent] },
    template: `
      <jic-color-path [nodes]="nodes" goalNote="Finish all 10">
        <span jicPathGuide style="font-size: 2.5rem" aria-hidden="true">🙂</span>
      </jic-color-path>
    `,
  }),
};

export const ColorPathNewVisitor: StoryObj<PathArgs> = { ...ColorPath, args: { finished: 0 } };

type PillArgs = { code: string; copyState: 'idle' | 'copied' | 'failed'; copyRequested?: () => void };

export const ResumeCode: StoryObj<PillArgs> = {
  args: { code: 'blue-fox-42', copyState: 'idle' },
  argTypes: {
    code: { control: 'text' },
    copyState: { control: 'inline-radio', options: ['idle', 'copied', 'failed'] },
    copyRequested: { action: 'copyRequested' },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [ResumeCodePillComponent] },
    template: `<jic-resume-code-pill [code]="code" [copyState]="copyState" (copyRequested)="copyRequested()" />`,
  }),
};

type ToggleArgs = { calm: boolean; textSize: string };

export const SettingToggles: StoryObj<ToggleArgs> = {
  args: { calm: false, textSize: 'Normal' },
  argTypes: {
    calm: { control: 'boolean' },
    textSize: { control: 'inline-radio', options: ['Normal', 'Bigger', 'Biggest'] },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [SettingToggleComponent] },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px">
        <button type="button" jic-setting-toggle label="Calm motion" [pressed]="calm" (click)="calm = !calm"></button>
        <button type="button" jic-setting-toggle label="Text size" [value]="textSize"></button>
      </div>
    `,
  }),
};

export const ColorLegend: StoryObj = {
  render: () => ({
    moduleMetadata: { imports: [ConceptChipListComponent] },
    template: `
      <jic-concept-chip-list
        label="What the colors mean:"
        [concepts]="['number', 'string', 'boolean', 'object', 'array', 'function', 'variable']"
      />
    `,
  }),
};
