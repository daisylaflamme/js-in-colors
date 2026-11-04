import type { Meta, StoryObj } from '@storybook/angular';
import { ChoiceButtonComponent } from './choice/choice-button';
import { ConceptShapeComponent } from './concept-shape/concept-shape';

/**
 * RULE: text on the orange (object) and teal (variable) fills must be LARGE and BOLD only
 * (at least 1.5rem / 24px, weight 700+), because those fills reach only 3:1 with any text color.
 * Anything smaller uses the concept's -text token on its -tint background (or on white).
 *
 * Measured (WCAG 2.x):
 *   ink on --color-object (#c25a00)       3.54:1  large text only (min 3:1)
 *   white on --color-variable (#0e8f94)   3.91:1  large text only (min 3:1)
 *   --color-object-text on its tint       5.2:1   any size (min 4.5:1)
 *   --color-variable-text on its tint     5.2:1   any size (min 4.5:1)
 *
 * The failing combination (small text on these fills) is described, not rendered,
 * so this page itself stays free of contrast violations.
 */
const meta: Meta = {
  title: 'Design system/Text on fills',
  parameters: { controls: { disable: true } },
};
export default meta;

export const OrangeAndTeal: StoryObj = {
  render: () => ({
    moduleMetadata: { imports: [ChoiceButtonComponent, ConceptShapeComponent] },
    styles: [
      `.rules{display:grid;gap:var(--space-5);max-inline-size:48rem}
       .rule{display:grid;gap:var(--space-3);padding:var(--space-4);border-radius:var(--radius-chip);background:var(--color-bg-raised)}
       .rule h2{font-size:1.25rem}
       .row{display:flex;flex-wrap:wrap;gap:var(--space-3);align-items:center}
       .small-tint{display:inline-flex;gap:var(--space-2);align-items:center;padding:var(--space-1) var(--space-3);border-radius:var(--radius-chip);font-size:var(--text-small);font-weight:700}
       .no{padding:var(--space-3) var(--space-4);border:var(--border-width) dashed var(--color-border);border-radius:var(--radius-chip)}`,
    ],
    template: `
      <div class="rules">
        <section class="rule">
          <h2>Yes: large, bold text on the fill (24px, 800)</h2>
          <div class="row">
            <button type="button" jic-choice-button concept="object" [pressed]="true">a cat</button>
            <button type="button" jic-choice-button concept="variable" [pressed]="true">jar</button>
          </div>
        </section>
        <section class="rule">
          <h2>Yes: smaller text uses the -text token on the tint</h2>
          <div class="row">
            <span class="small-tint" style="background:var(--color-object-tint);color:var(--color-object-text)">
              <jic-concept-shape concept="object" [size]="16" /> things: a cat with a name
            </span>
            <span class="small-tint" style="background:var(--color-variable-tint);color:var(--color-variable-text)">
              <jic-concept-shape concept="variable" [size]="16" /> jars: favorite
            </span>
          </div>
        </section>
        <section class="rule">
          <h2>No: small or regular text on the orange or teal fill</h2>
          <p class="no">Not rendered on purpose. Ink on orange is 3.54:1 and white on teal is 3.91:1:
            fine for large bold text (3:1), too low for normal text (4.5:1).</p>
        </section>
      </div>`,
  }),
};
