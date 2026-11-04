import type { Meta, StoryObj } from '@storybook/angular';
import { ChoiceButtonComponent } from './choice/choice-button';
import { ConceptChipListComponent } from './concept-chip/concept-chip-list';
import { CodePanelComponent, type CodeToken } from './code-peek/code-panel';
import { LessonHeaderComponent } from './lesson-header/lesson-header';
import { MenuButtonComponent } from './menu-button/menu-button';
import { SceneNavComponent } from './scene-nav/scene-nav';

/**
 * Light, dark and high contrast side by side. Themes are token overrides only
 * (styles/settings/_themes.scss), so the same components render in all three.
 * The Theme toolbar switches the whole canvas; this story shows all three at once.
 */
const meta: Meta = {
  title: 'Design system/Themes',
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  globals: { theme: 'light' },
};
export default meta;

const code: CodeToken[] = [
  { text: 'let', kind: 'keyword' },
  { text: ' ', kind: 'punctuation' },
  { text: 'favorite', kind: 'name' },
  { text: ' = ', kind: 'operator' },
  { text: '7', kind: 'value', concept: 'number' },
  { text: ';', kind: 'punctuation' },
];

export const SideBySide: StoryObj = {
  render: () => ({
    props: {
      themes: [
        { id: null, name: 'Light' },
        { id: 'dark', name: 'Dark' },
        { id: 'high-contrast', name: 'High contrast' },
      ],
      code,
    },
    moduleMetadata: {
      imports: [
        LessonHeaderComponent,
        MenuButtonComponent,
        ConceptChipListComponent,
        ChoiceButtonComponent,
        SceneNavComponent,
        CodePanelComponent,
      ],
    },
    styles: [
      `.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))}
       .panel{min-inline-size:0;display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-4);align-content:start;padding:var(--space-5)}
       .theme-name{font-family:var(--font-display);font-size:1rem;color:var(--color-text-muted)}
       .choices{display:flex;flex-wrap:wrap;gap:var(--space-3)}`,
    ],
    template: `
      <div class="grid">
        @for (t of themes; track t.name) {
          <section class="panel" [attr.data-theme]="t.id" [attr.aria-label]="t.name + ' theme'">
            <p class="theme-name">{{ t.name }}</p>
            <jic-lesson-header [lessonNumber]="3" [lessonCount]="10" title="Variables"
              lead="A variable is a jar with a name on it." leadHighlight="jar" concept="variable" [showLogo]="false">
              <button type="button" jic-menu-button jicHeaderStart [expanded]="false"></button>
            </jic-lesson-header>
            <jic-concept-chip-list label="Jars can hold:" [concepts]="['number', 'string', 'boolean', 'object', 'array', 'function']" />
            <div class="choices">
              <button type="button" jic-choice-button concept="number" [pressed]="true">7</button>
              <button type="button" jic-choice-button concept="string">Emma</button>
              <button type="button" jic-choice-button concept="object" [pressed]="true">cat</button>
              <button type="button" jic-choice-button concept="variable">jar</button>
            </div>
            <jic-code-panel [code]="code" />
            <jic-scene-nav [scene]="3" [sceneCount]="5" />
          </section>
        }
      </div>`,
  }),
};
