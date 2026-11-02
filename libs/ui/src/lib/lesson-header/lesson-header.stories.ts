import type { Meta, StoryObj } from '@storybook/angular';
import { CONCEPTS } from '@jic/shared';
import { MenuButtonComponent } from '../menu-button/menu-button';
import { LessonHeaderComponent } from './lesson-header';

const meta: Meta<LessonHeaderComponent> = {
  title: 'Shell/Lesson header',
  component: LessonHeaderComponent,
  argTypes: {
    concept: { control: 'select', options: CONCEPTS, description: 'Colors the title and highlight' },
    lessonNumber: { control: { type: 'number', min: 1, max: 10 } },
    lessonCount: { control: { type: 'number', min: 1, max: 10 } },
    title: { control: 'text' },
    lead: { control: 'text' },
    leadHighlight: { control: 'text' },
    showLogo: { control: 'boolean', description: 'Small logo beside the hamburger (menu closed)' },
  },
  args: {
    lessonNumber: 3,
    lessonCount: 10,
    title: 'Variables',
    lead: 'A variable is a jar with a name on it.',
    leadHighlight: 'jar',
    concept: 'variable',
    showLogo: true,
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [MenuButtonComponent] },
    template: `
      <jic-lesson-header [lessonNumber]="lessonNumber" [lessonCount]="lessonCount" [title]="title"
        [lead]="lead" [leadHighlight]="leadHighlight" [concept]="concept" [showLogo]="showLogo">
        <button type="button" jic-menu-button jicHeaderStart [expanded]="false"></button>
      </jic-lesson-header>`,
  }),
};
export default meta;

type Story = StoryObj<LessonHeaderComponent>;

/** Menu closed: logo beside the hamburger (mockup 02). */
export const MenuClosed: Story = {};

/** Menu open on desktop: the logo lives in the menu instead (mockup 01). */
export const MenuOpen: Story = { args: { showLogo: false } };

export const OtherConcept: Story = {
  args: {
    title: 'Magic machines',
    concept: 'function',
    lead: 'A function is a helper with a job.',
    leadHighlight: 'helper',
    lessonNumber: 5,
  },
};
