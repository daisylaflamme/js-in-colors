/**
 * Keyboard helpers for specs. Focus moves with real Tab key presses (cy.press). Cypress 15's
 * cy.press does not trigger a button's or link's default action for Enter/Space, so activation
 * uses type('{enter}') / type(' ') on the focused element, which simulates the key with no
 * pointer events. Cypress has no Shift+Tab: walks restart from a known focus point instead.
 */
const { TAB } = Cypress.Keyboard.Keys;

/** Activate the focused control the way a keyboard user does. */
export const pressEnter = () => cy.focused().type('{enter}');
export const pressSpace = () => cy.focused().type(' ');

/** Press Tab until the focused element matches (optionally containing `text`). */
export function tabTo(selector: string, text?: string, max = 40): void {
  const step = (left: number): void => {
    cy.press(TAB);
    cy.focused({ log: false }).then(($el) => {
      const found = $el.length > 0 && $el.is(selector) && (text === undefined || $el.text().includes(text));
      if (found) return;
      if (left <= 0) throw new Error(`Could not Tab to ${selector}${text ? ` "${text}"` : ''}`);
      step(left - 1);
    });
  };
  step(max);
}

/** Emulate prefers-reduced-motion in Chrome (CDP). Reset to 'no-preference' after the test. */
export const emulateReducedMotion = (value: 'reduce' | 'no-preference') =>
  Cypress.automation('remote:debugger:protocol', {
    command: 'Emulation.setEmulatedMedia',
    params: { features: [{ name: 'prefers-reduced-motion', value }] },
  });

/**
 * Follow the focused link. Cypress does not simulate Enter on links either (only on buttons
 * and forms), and browsers always follow a focused <a href> on Enter natively, so after a real
 * Tab to the link this clicks the focused element. It must be a real link.
 */
export const followFocusedLink = () => cy.focused().should('match', 'a[href]').click();
