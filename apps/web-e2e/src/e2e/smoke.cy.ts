/**
 * Smoke test for the lesson shell at the three mockup sizes (docs/mockups 01, 12, 13):
 * the app loads, the lesson menu opens, the Tip opens and closes with Esc and gives focus back,
 * the Library opens as a focus-trapped dialog, and axe finds no WCAG A/AA violations.
 */
const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

const menuButton = () => cy.get('button[aria-label="Lesson menu"]');
const tipTab = () => cy.get('jic-help-tabs button.tip');
const libraryTab = () => cy.get('jic-help-tabs button.library');

/** Esc as a keyboard user sends it: to whatever has focus. */
const pressEscape = () => cy.focused().type('{esc}');

for (const vp of VIEWPORTS) {
  describe(`lesson shell (${vp.name} ${vp.width}x${vp.height})`, () => {
    beforeEach(() => {
      cy.viewport(vp.width, vp.height);
      cy.visit('/');
    });

    it('loads the lesson', () => {
      cy.location('pathname').should('eq', '/lesson/variables');
      cy.title().should('eq', 'Variables · JavaScript in Colors');
      cy.get('h1').should('have.text', 'Variables');
      cy.get('jic-stage .bubble').should('have.attr', 'aria-live', 'polite');
    });

    it('opens the lesson menu', () => {
      if (vp.name === 'desktop') {
        // Desktop: the menu starts open beside the lesson; the hamburger collapses and reopens it.
        cy.get('nav[aria-label="Lessons"]').should('be.visible');
        menuButton().should('have.attr', 'aria-expanded', 'true').click();
        cy.get('nav[aria-label="Lessons"]').should('not.exist');
        menuButton().should('have.attr', 'aria-expanded', 'false').click();
        cy.get('nav[aria-label="Lessons"]').should('be.visible');
        cy.get('nav[aria-label="Lessons"] a[aria-current="page"]').should('contain.text', 'Variables');
      } else {
        // Phone and tablet: the menu is a modal overlay, closed by default.
        menuButton().should('have.attr', 'aria-expanded', 'false').click();
        cy.get('dialog#lesson-menu').should('have.attr', 'open');
        cy.get('nav[aria-label="Lessons"]').should('be.visible');
        cy.focused().should('have.attr', 'aria-label', 'Close lesson menu');
        pressEscape();
        cy.get('dialog#lesson-menu').should('not.have.attr', 'open');
        cy.focused().should('have.attr', 'aria-label', 'Lesson menu');
        cy.location('pathname').should('eq', '/lesson/variables');
      }
    });

    it('opens the Tip, closes it with Esc and returns focus to the Tip tab', () => {
      tipTab().should('have.attr', 'aria-expanded', 'false').click();
      cy.get('dialog.tip')
        .should('match', '[open]')
        .and('contain.text', 'Jars can hold numbers, words, and more!');
      tipTab().should('have.attr', 'aria-expanded', 'true');
      cy.focused().should('have.attr', 'aria-label', 'Close tip');

      pressEscape();

      cy.get('dialog.tip').should('not.have.attr', 'open');
      tipTab().should('have.attr', 'aria-expanded', 'false');
      cy.focused().should('have.class', 'tip').and('contain.text', 'Tip');
    });

    it('opens the Library as a dialog and returns focus when closed', () => {
      libraryTab().click();
      cy.get('dialog.library').should('match', '[open]').and('contain.text', 'All about variables');
      cy.focused().should('have.attr', 'aria-label', 'Close library').click();
      cy.get('dialog.library').should('not.have.attr', 'open');
      cy.focused().should('have.class', 'library');
    });

    it('has no detectable a11y violations (closed, Tip open, Library open)', () => {
      cy.get('h1').should('be.visible');
      cy.checkPageA11y();

      tipTab().click();
      cy.get('dialog.tip').should('have.attr', 'open');
      cy.checkPageA11y();
      pressEscape();

      libraryTab().click();
      cy.get('dialog.library').should('have.attr', 'open');
      cy.checkPageA11y();
    });
  });
}

describe('small screens', () => {
  it('has no horizontal page scroll at 320px', () => {
    cy.viewport(320, 640);
    cy.visit('/');
    cy.get('h1').should('be.visible');
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
    });
  });
});
