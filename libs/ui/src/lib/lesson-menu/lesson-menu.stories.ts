import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { LessonMenuComponent, type LessonMenuItem } from './lesson-menu';

const lessons: LessonMenuItem[] = [
  ['hello', 'Hello, JavaScript!', 'Introduction', 'array', true],
  ['output', 'Say it out loud', 'Output', 'string', true],
  ['variables', 'Variables', 'Variables', 'variable', false],
  ['data-types', 'Numbers, words, yes/no', 'Data types', 'number', false],
  ['functions', 'Magic machines', 'Functions', 'function', false],
  ['conditions', 'Yes or no paths', 'Conditions', 'boolean', false],
  ['loops', 'Again and again', 'Loops', 'number', false],
  ['arrays', 'Lists of things', 'Arrays', 'array', false],
  ['objects', 'Things with details', 'Objects', 'object', false],
  ['dom', 'Page magic', 'The DOM', 'html', false],
].map(([id, title, subtitle, concept, finished]) => ({
  id: id as string,
  title: title as string,
  subtitle: subtitle as string,
  concept: concept as LessonMenuItem['concept'],
  link: `/lesson/${id}`,
  finished: finished as boolean,
}));

const meta: Meta<LessonMenuComponent> = {
  title: 'Shell/Lesson menu',
  component: LessonMenuComponent,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    currentId: { control: 'select', options: lessons.map((l) => l.id) },
    resumeCode: { control: 'text' },
    closable: { control: 'boolean', description: 'Overlay mode: show the X button' },
    compact: { control: 'boolean', description: 'Phone overlay: no subtitles' },
    closeRequested: { action: 'closeRequested' },
    lessonChosen: { action: 'lessonChosen' },
  },
  args: { lessons, currentId: 'variables', resumeCode: 'blue-fox-42', closable: false, compact: false },
  decorators: [
    componentWrapperDecorator((story) => `<div style="inline-size:280px; block-size:900px">${story}</div>`),
  ],
};
export default meta;

type Story = StoryObj<LessonMenuComponent>;

/** Desktop: inline beside the lesson (mockup 01). */
export const Desktop: Story = {};

/** Phone overlay content: X button, no subtitles (mockup 14). */
export const PhoneOverlay: Story = { ...Desktop, args: { closable: true, compact: true } };

export const NothingFinished: Story = {
  ...Desktop,
  args: { lessons: lessons.map((l) => ({ ...l, finished: false })), currentId: 'hello' },
};
