/**
 * The Variables lesson, end to end, with the keyboard only (real key events via cy.press),
 * and an axe check on every scene. Runs at phone and desktop sizes, and once with
 * prefers-reduced-motion emulated in the browser.
 *
 * Keyboard helpers (real Tab presses, simulated Enter/Space) are in support/keyboard.ts.
 * After each scene change the walk starts again from the top of <main> (where the
 * "Skip to main content" link puts focus) and Tabs forward to the next target.
 */
import { emulateReducedMotion, pressEnter, pressSpace, tabTo } from '../support/keyboard';

function fromTopOfLesson(): void {
  cy.get('#main').focus();
}

function pressNext(): void {
  fromTopOfLesson();
  tabTo('jic-scene-nav .next');
  pressEnter();
}

function expectScene(n: number): void {
  cy.get('jic-scene-nav .label').should('have.text', `Scene ${n} of 5`);
  cy.get('[role="status"].u-visually-hidden').should('have.text', `Scene ${n} of 5`);
}

function walkThroughVariables(): void {
  cy.visit('/lesson/variables');
  cy.get('h1').should('have.text', 'Variables');

  // 1. watch: the jar
  expectScene(1);
  cy.get('.bubble').should('have.text', 'This is a jar. A jar can hold one thing.');
  cy.checkPageA11y();
  fromTopOfLesson();
  tabTo('button[jic-replay-button]');
  pressSpace(); // "Play again" works from the keyboard too
  pressNext();

  // 2. watch: the name, with a peek at the code
  expectScene(2);
  fromTopOfLesson();
  tabTo('button[jic-code-peek-toggle]');
  pressEnter();
  cy.focused().should('have.attr', 'aria-expanded', 'true');
  cy.get('jic-code-panel code').should('have.text', 'let favorite;');
  cy.checkPageA11y();
  pressNext();

  // 3. interact: fill the jar; picture, bubble and code change together
  expectScene(3);
  cy.get('button[jic-choice-button]').first().should('have.attr', 'aria-pressed', 'true'); // pre-picked
  fromTopOfLesson();
  tabTo('button[jic-choice-button]', 'Emma');
  pressEnter();
  cy.focused().should('have.attr', 'aria-pressed', 'true');
  cy.get('.bubble').should('have.text', 'My favorite is Emma!');
  cy.get('jic-jar-visual .value-text').should('have.text', 'Emma');
  tabTo('button[jic-code-peek-toggle]');
  pressEnter();
  cy.get('jic-code-panel code').should('have.text', 'let favorite = "Emma";');
  cy.checkPageA11y();
  pressNext();

  // 4. interact: swap the value, same name
  expectScene(4);
  fromTopOfLesson();
  tabTo('button[jic-choice-button]', 'cat');
  pressSpace();
  cy.get('.bubble').should('contain.text', 'Now favorite holds cat');
  cy.get('jic-jar-visual .tag-text').should('have.text', 'favorite');
  cy.checkPageA11y();
  pressNext();

  // 5. quiz: a wrong answer gets kind feedback, then the right one
  expectScene(5);
  cy.get('jic-scene-nav .next').should('contain.text', 'Finish');
  fromTopOfLesson();
  tabTo('button[jic-choice-button]', '7');
  pressEnter();
  cy.get('jic-quiz-feedback').should('contain.text', 'Not quite. 7 is inside the jar.');
  cy.checkPageA11y();
  fromTopOfLesson(); // "favorite" comes before "7", so start the walk again
  tabTo('button[jic-choice-button]', 'favorite');
  pressEnter();
  cy.get('jic-quiz-feedback').should('contain.text', 'Yes! favorite is the name');
  cy.checkPageA11y();
  pressNext();

  // Done: the card takes focus and is announced
  cy.focused().should('match', 'jic-lesson-done-card h2').and('have.text', 'You finished Variables!');
  cy.checkPageA11y();
}

describe('Variables lesson with the keyboard', () => {
  for (const [name, width, height] of [
    ['phone', 390, 844],
    ['desktop', 1440, 900],
  ] as const) {
    it(`goes through all 5 scenes at ${name} size`, () => {
      cy.viewport(width, height);
      walkThroughVariables();
    });
  }

  it('marks the lesson finished in the menu', () => {
    cy.viewport(1440, 900);
    walkThroughVariables();
    cy.get('[role="progressbar"]').should('have.attr', 'aria-valuenow', '1');
    cy.contains('nav[aria-label="Lessons"] a', 'Variables').should('contain.text', '(finished)');
  });
});

describe('reduced motion', () => {
  const emulate = emulateReducedMotion;

  afterEach(() => cy.then(() => emulate('no-preference')));

  it('animates the jar normally (control)', () => {
    cy.viewport(1440, 900);
    cy.then(() => emulate('no-preference'));
    cy.visit('/lesson/variables');
    expectScene(1); // the h1 comes before the lesson file loads; the scene label comes after
    pressNext();
    expectScene(2); // wait for each scene before tabbing, or focus can land on a node being swapped out
    pressNext();
    expectScene(3);
    fromTopOfLesson();
    tabTo('button[jic-choice-button]', 'Emma');
    pressEnter();
    cy.document().its('getAnimations').should('be.a', 'function');
    cy.document().then((doc) => expect(doc.getAnimations().length).to.be.greaterThan(0));
  });

  it('runs no animations with prefers-reduced-motion, and still works', () => {
    cy.viewport(1440, 900);
    cy.then(() => emulate('reduce'));
    cy.visit('/lesson/variables');
    expectScene(1);
    pressNext();
    expectScene(2);
    pressNext();
    expectScene(3);
    fromTopOfLesson();
    tabTo('button[jic-choice-button]', 'Emma');
    pressEnter();
    cy.get('jic-jar-visual .value-text').should('have.text', 'Emma'); // the final state, right away
    cy.document().then((doc) => expect(doc.getAnimations()).to.have.length(0));
    cy.checkPageA11y();
  });
});
