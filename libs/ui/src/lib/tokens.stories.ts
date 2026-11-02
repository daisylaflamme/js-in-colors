import type { Meta, StoryObj } from '@storybook/angular';
import { CONCEPT_INFO, CONCEPTS } from '@jic/shared';
import { ConceptShapeComponent } from './concept-shape/concept-shape';

/**
 * The design tokens, modeled on docs/mockups/11-design-tokens.png.
 * Values come from styles/settings (a 1:1 copy of docs/mockups/design-tokens.css).
 * Switch the Theme toolbar to see the dark and high-contrast overrides.
 */
const meta: Meta = {
  title: 'Design system/Tokens',
  parameters: { layout: 'padded', controls: { disable: true } },
};
export default meta;

export const ConceptColors: StoryObj = {
  render: () => ({
    props: { concepts: CONCEPTS, info: CONCEPT_INFO, swatches: ['', '-text', '-tint'] },
    moduleMetadata: { imports: [ConceptShapeComponent] },
    styles: [
      `.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));gap:var(--space-4)}
       .card{display:grid;gap:var(--space-3);padding:var(--space-4);border-radius:var(--radius-chip);background:var(--color-bg-raised);box-shadow:var(--shadow-stage)}
       .head{display:flex;align-items:center;gap:var(--space-3)}
       h2{font-size:1.5rem} code{font-size:.8rem;color:var(--color-text-muted)}
       .sw{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-2)}
       .sw span{block-size:2.5rem;border-radius:var(--radius-nav-item);border:2px solid var(--color-border-soft)}
       p{font-size:var(--text-small);font-weight:700}`,
    ],
    template: `
      <h1 style="margin-block-end:var(--space-2)">Every idea has a color and a shape</h1>
      <p style="margin-block-end:var(--space-5)">Color is never the only clue: each one also has a shape and a word.</p>
      <div class="grid">
        @for (c of concepts; track c) {
          <section class="card" [attr.aria-label]="info[c].jsWord">
            <div class="head">
              <jic-concept-shape [concept]="c" [size]="40" />
              <div>
                <h2 [style.color]="'var(--color-' + c + '-text)'">{{ info[c].kidWord }}</h2>
                <code>--color-{{ c }}</code>
              </div>
            </div>
            <div class="sw">
              @for (s of swatches; track s) {
                <span [style.background]="'var(--color-' + c + s + ')'" [title]="'--color-' + c + s"></span>
              }
            </div>
            <p>Shape: {{ info[c].shape }}. Fill · text · tint.</p>
          </section>
        }
      </div>`,
  }),
};

export const TypeAndSpacing: StoryObj = {
  render: () => ({
    props: { spaces: [1, 2, 3, 4, 5, 6, 7] },
    template: `
      <div style="display:grid; gap:var(--space-5)">
        <p style="font-family:var(--font-display); font-size:var(--text-title-fluid); font-weight:800; line-height:1">Baloo 2 title</p>
        <p style="font-size:var(--text-lead-fluid); font-weight:800">Nunito lead: a variable is a jar with a name on it.</p>
        <p style="font-size:var(--text-body)">Nunito body, 18px. Body copy is never smaller than 16px.</p>
        <div style="display:grid; gap:var(--space-2)">
          @for (s of spaces; track s) {
            <div style="display:flex; align-items:center; gap:var(--space-3)">
              <code style="inline-size:6rem">--space-{{ s }}</code>
              <span [style.inline-size]="'var(--space-' + s + ')'" style="block-size:1rem; background:var(--color-number)"></span>
            </div>
          }
        </div>
      </div>`,
  }),
};
