import type { Meta, StoryObj } from '@storybook/angular';
import { ChatBubbleComponent } from './chat/chat-bubble';
import { SafeRulesCardComponent } from './chat/safe-rules-card';
import { TypingDotsComponent } from './chat/typing-dots';

const meta: Meta = { title: 'Chat/Ask Dot' };
export default meta;

export const DotBubble: StoryObj<ChatBubbleComponent> = {
  args: { from: 'dot', text: 'A loop is like a merry-go-round. It does the same thing again and again.' },
  argTypes: {
    from: { control: 'inline-radio', options: ['dot', 'kid'] },
    text: { control: 'text' },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [ChatBubbleComponent] },
    template: `<jic-chat-bubble [from]="from" [text]="text" />`,
  }),
};

export const KidBubble: StoryObj<ChatBubbleComponent> = {
  ...DotBubble,
  args: { from: 'kid', text: 'What is a loop?' },
};

export const TypingDots: StoryObj = {
  render: () => ({
    moduleMetadata: { imports: [TypingDotsComponent] },
    template: `<jic-typing-dots />`,
  }),
};

export const SafeRules: StoryObj<SafeRulesCardComponent> = {
  args: {
    note: "Demo mode shows pre-written answers. In the full version, Dot's replies stream in word by word.",
  },
  argTypes: { note: { control: 'text' } },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [SafeRulesCardComponent] },
    template: `<jic-safe-rules-card [note]="note" style="max-inline-size: 22rem" />`,
  }),
};
