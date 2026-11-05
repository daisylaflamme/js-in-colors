/**
 * Every ready lesson, start to finish, with the keyboard only and an axe check on every scene.
 * The list comes from content/ (see cypress.config.ts), so a new lesson is covered as soon as
 * course.yaml marks it ready. lesson-variables.cy.ts stays as the deep walkthrough of one lesson.
 */
import { readyLessons, type ReadyLesson } from '../support/lessons';
import { pressEnter, tabTo } from '../support/keyboard';

function pressNext(): void {
  cy.get('#main').focus();
  tabTo('jic-scene-nav .next');
  pressEnter();
}

function walk(lesson: ReadyLesson): void {
  const count = lesson.scenes.length;
  cy.visit(`/lesson/${lesson.id}`);
  cy.get('h1').should('have.text', lesson.title);

  lesson.scenes.forEach((scene, i) => {
    // Also the wait that keeps Tab walks safe (see support/lesson.ts).
    cy.get('jic-scene-nav .label').should('have.text', `Scene ${i + 1} of ${count}`);
    cy.checkPageA11y();
    if (scene.answer && scene.feedback) {
      cy.get('#main').focus();
      tabTo('button[jic-choice-button]', scene.answer);
      pressEnter();
      cy.get('jic-quiz-feedback').should('contain.text', scene.feedback);
      cy.checkPageA11y();
    }
    pressNext();
  });

  cy.focused().should('match', 'jic-lesson-done-card h2').and('have.text', `You finished ${lesson.title}!`);
  cy.checkPageA11y();
}

describe('every ready lesson with the keyboard', () => {
  for (const lesson of readyLessons()) {
    for (const [name, width, height] of [
      ['phone', 390, 844],
      ['desktop', 1440, 900],
    ] as const) {
      it(`${lesson.title}: all ${lesson.scenes.length} scenes at ${name} size`, () => {
        cy.viewport(width, height);
        walk(lesson);
      });
    }
  }
});
