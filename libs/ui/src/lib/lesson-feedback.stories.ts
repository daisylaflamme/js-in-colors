import type { Meta, StoryObj } from '@storybook/angular';
import { CONCEPTS } from '@jic/shared';
import { LessonDoneCardComponent } from './lesson-done/lesson-done-card';
import { QuizFeedbackComponent } from './quiz-feedback/quiz-feedback';
import { ReplayButtonComponent } from './replay-button/replay-button';

const meta: Meta = { title: 'Lesson/Feedback and actions' };
export default meta;

export const QuizFeedback: StoryObj<QuizFeedbackComponent> = {
  args: { status: 'correct', text: 'Yes! The name is on the tag.' },
  argTypes: {
    status: { control: 'inline-radio', options: [null, 'correct', 'try-again'] },
    text: { control: 'text' },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [QuizFeedbackComponent] },
    template: `<jic-quiz-feedback [status]="status" [text]="text" />`,
  }),
};

export const QuizTryAgain: StoryObj<QuizFeedbackComponent> = {
  ...QuizFeedback,
  args: { status: 'try-again', text: 'Not quite. 7 is inside the jar. Try another one!' },
};

export const ReplayButton: StoryObj = {
  render: () => ({
    moduleMetadata: { imports: [ReplayButtonComponent] },
    template: `<button type="button" jic-replay-button></button>`,
  }),
};

export const LessonDone: StoryObj<LessonDoneCardComponent> = {
  args: { lessonTitle: 'Hello, JavaScript!', concept: 'intro', nextTitle: 'Say it out loud' },
  argTypes: {
    lessonTitle: { control: 'text' },
    concept: { control: 'select', options: CONCEPTS },
    nextTitle: { control: 'text', description: 'Empty: no next-lesson button' },
    message: { control: 'text' },
    nextLesson: { action: 'nextLesson' },
    restart: { action: 'restart' },
    back: { action: 'back' },
  },
};

export const LessonDoneLast: StoryObj<LessonDoneCardComponent> = {
  ...LessonDone,
  args: { lessonTitle: 'Variables', concept: 'variable', nextTitle: undefined },
};
