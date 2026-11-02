import type { Meta, StoryObj } from '@storybook/angular';
import { LessonMenuComponent } from '../lesson-menu/lesson-menu';
import { LibraryPanelComponent } from '../library-panel/library-panel';
import { OverlayPanelComponent } from '../overlay-panel/overlay-panel';
import { TipCardComponent } from '../tip-card/tip-card';

/**
 * The three modal dialogs share one focus contract (ModalDialogDirective):
 * focus moves in, the page behind is inert, Esc or the backdrop closes, focus returns to the opener.
 * Try it with the keyboard: Tab to the button, Enter, then Esc.
 */
const meta: Meta = {
  title: 'Shell/Dialogs',
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Args = { text: string };

export const Tip: StoryObj<Args> = {
  args: { text: 'Jars can hold numbers, words, and more!' },
  argTypes: { text: { control: 'text' } },
  render: (args) => ({
    props: { ...args, open: false },
    moduleMetadata: { imports: [TipCardComponent] },
    template: `
      <div style="padding:24px">
        <button #opener type="button" (click)="open = true">Open the tip</button>
        <jic-tip-card [open]="open" [returnFocusTo]="opener" (closed)="open = false"><p>{{ text }}</p></jic-tip-card>
      </div>`,
  }),
};

export const Library: StoryObj<Args> = {
  args: { text: 'A variable is a jar. You write a name on the jar. Then you put something inside.' },
  argTypes: { text: { control: 'text' } },
  render: (args) => ({
    props: { ...args, open: false },
    moduleMetadata: { imports: [LibraryPanelComponent] },
    template: `
      <div style="padding:24px">
        <button #opener type="button" (click)="open = true">Open the library</button>
        <jic-library-panel [open]="open" [returnFocusTo]="opener" (closed)="open = false">
          <h3>All about variables</h3>
          <p>{{ text }}</p>
          <button jicLibraryFooter type="button">Still curious? Ask Dot</button>
        </jic-library-panel>
      </div>`,
  }),
};

/** The lesson menu as an overlay (phone and tablet, mockup 14). */
export const MenuOverlay: StoryObj = {
  render: () => ({
    props: {
      open: false,
      lessons: [
        {
          id: 'hello',
          title: 'Hello, JavaScript!',
          subtitle: 'Introduction',
          concept: 'array',
          link: '/',
          finished: true,
        },
        {
          id: 'variables',
          title: 'Variables',
          subtitle: 'Variables',
          concept: 'variable',
          link: '/',
          finished: false,
        },
      ],
    },
    moduleMetadata: { imports: [OverlayPanelComponent, LessonMenuComponent] },
    template: `
      <div style="padding:24px">
        <button #opener type="button" (click)="open = true">Open the menu</button>
        <jic-overlay-panel label="Lesson menu" [open]="open" [returnFocusTo]="opener" (closed)="open = false">
          <jic-lesson-menu [lessons]="lessons" currentId="variables" [closable]="true" [compact]="true"
            (closeRequested)="open = false" />
        </jic-overlay-panel>
      </div>`,
  }),
  globals: { viewport: { value: 'phone' } },
};
