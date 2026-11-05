/**
 * Ask Dot (mockup 09, ADR 0011), demo mode: pre-written answers streamed word by word, in memory
 * only. Keyboard, axe in every theme, the personal-info guard, and no question ever on the network.
 */
import { followFocusedLink, pressEnter, tabTo } from '../support/keyboard';
import { waitForScene } from '../support/lesson';

const VIEWPORTS = [
  [390, 844],
  [820, 1180],
  [1440, 900],
] as const;

const lastDot = () => cy.get('jic-chat-bubble[data-from="dot"]').last();
/** The answer is done when the status announces it. */
const answered = () => cy.get('[role="status"]', { timeout: 10000 }).should('contain.text', 'Dot says:');

describe('Ask Dot', () => {
  for (const [w, h] of VIEWPORTS) {
    it(`answers a suggestion at ${w}px, with no a11y violations in any theme`, () => {
      cy.viewport(w, h);
      cy.visit('/ask-dot');
      cy.title().should('eq', 'Ask Dot · JavaScript in Colors');
      cy.get('h1').should('have.text', 'Ask Dot');
      cy.checkPageA11y();
      cy.contains('button.chip', 'What is a variable?').click();
      cy.get('jic-typing-dots').should('exist');
      cy.checkPageA11y(); // while Dot is typing
      answered();
      lastDot().should('contain.text', 'A variable is like a jar with a name.');
      cy.get('.lesson-link').should('contain.text', 'See it in the Variables lesson');
      for (const theme of ['dark', 'high-contrast'] as const) {
        cy.document().then((doc) => doc.documentElement.setAttribute('data-theme', theme));
        cy.checkPageA11y();
      }
      cy.document().then((doc) => {
        expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
      });
    });
  }

  it('works with the keyboard only: type, Enter, then a chip', () => {
    cy.visit('/ask-dot');
    cy.get('h1').should('be.visible');
    tabTo('#question');
    cy.focused().type('What is a loop?{enter}');
    cy.focused().should('have.id', 'question').and('have.value', '');
    answered();
    lastDot().should('contain.text', 'A loop is like a merry-go-round.');
    // The chips come before the box; Cypress cannot Shift+Tab, so restart the walk from the top.
    cy.get('a.back').focus();
    tabTo('button.chip', 'What does true mean?');
    pressEnter();
    cy.get('[role="status"]', { timeout: 10000 }).should('contain.text', 'true means yes');
  });

  it('redirects gently when the question is not about JavaScript', () => {
    cy.visit('/ask-dot');
    cy.get('#question').type('Do you like pizza?{enter}');
    answered();
    lastDot()
      .find('.text')
      .invoke('text')
      .should('match', /JavaScript|variable/);
    lastDot().find('.lesson-link').should('not.exist');
  });

  it('keeps names and places private, and never sends a question anywhere', () => {
    const requests: string[] = [];
    cy.visit('/ask-dot');
    cy.get('h1').should('be.visible');
    cy.intercept('**', (req) => {
      requests.push(`${req.url} ${JSON.stringify(req.body ?? '')}`);
    });
    cy.get('#question').type('my name is Zyxwen{enter}');
    lastDot().should('contain.text', "Let's keep names and places private.");
    cy.get('#question').type('What is an array?{enter}');
    answered();
    cy.window().then((win) => {
      const sent = requests.join('\n');
      expect(sent).not.to.contain('Zyxwen');
      expect(sent).not.to.contain('array');
      expect(requests.every((r) => r.startsWith(win.location.origin))).to.eq(true);
      expect(JSON.stringify({ ...win.localStorage })).not.to.contain('Zyxwen');
    });
  });

  it('opens the lesson from an answer, and starts fresh after leaving', () => {
    cy.visit('/ask-dot');
    cy.contains('button.chip', 'What is a function?').click();
    answered();
    cy.get('.lesson-link').should('have.attr', 'href', '/lesson/functions').click();
    cy.location('pathname').should('eq', '/lesson/functions');
    waitForScene(1);
    cy.go('back');
    cy.location('pathname').should('eq', '/ask-dot');
    cy.get('jic-chat-bubble').should('have.length', 1);
    cy.get('jic-chat-bubble').first().should('contain.text', 'Hi! I am Dot.');
  });

  it('is reached from the Library, and Back returns to the same lesson', () => {
    cy.viewport(1440, 900);
    cy.visit('/lesson/loops');
    waitForScene(1);
    cy.get('jic-help-tabs button.library').click();
    cy.get('dialog.library').should('match', '[open]');
    tabTo('a.ask-dot');
    followFocusedLink();
    cy.location('pathname').should('eq', '/ask-dot');
    cy.location('search').should('eq', '?from=loops');
    cy.get('a.back').should('contain.text', 'Back to the lesson').click();
    cy.location('pathname').should('eq', '/lesson/loops');
  });
});
