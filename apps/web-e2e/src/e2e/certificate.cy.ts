/**
 * The certificate (mockup 10, ADR 0010): earned at 10 of 10, the name typed on the device, saved
 * as a PNG made in the browser, and printed. The name must never leave the device.
 */
import { pressEnter, tabTo } from '../support/keyboard';

const ALL = [
  'hello',
  'output',
  'variables',
  'data-types',
  'functions',
  'conditions',
  'loops',
  'arrays',
  'objects',
  'dom',
];

const VIEWPORTS = [
  [390, 844],
  [820, 1180],
  [1440, 900],
] as const;

/** A name nobody would type by accident, so finding it in a request means it leaked. */
const NAME = 'Zyxwen';

function visitWithProgress(finishedIds: string[]): void {
  cy.visit('/certificate', {
    onBeforeLoad(win) {
      win.localStorage.setItem(
        'jic.progress',
        JSON.stringify({ v: 1, resumeCode: 'brave-otter-37', finishedIds, lastLessonId: null }),
      );
    },
  });
}

describe('certificate', () => {
  it('is not filled in before every lesson is finished, and offers to continue', () => {
    visitWithProgress(['hello', 'output']);
    cy.title().should('eq', 'Your certificate · JavaScript in Colors');
    cy.get('h1').should('have.text', 'Your certificate');
    cy.get('.lead').should('contain.text', 'You finished 2 of 10 lessons');
    cy.get('a.continue').should('have.attr', 'href', '/lesson/variables');
    cy.get('#certificate-name').should('not.exist');
    cy.checkPageA11y();
  });

  for (const [w, h] of VIEWPORTS) {
    it(`shows the certificate at ${w}px, with no a11y violations in any theme`, () => {
      cy.viewport(w, h);
      visitWithProgress(ALL);
      cy.get('#certificate-name').type(NAME);
      cy.get('.sheet p.name').invoke('text').invoke('trim').should('eq', NAME);
      cy.checkPageA11y();
      for (const theme of ['dark', 'high-contrast'] as const) {
        cy.document().then((doc) => doc.documentElement.setAttribute('data-theme', theme));
        cy.checkPageA11y();
      }
      cy.document().then((doc) => {
        expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
      });
    });
  }

  it('saves a PNG made on the device, and never sends the name anywhere', () => {
    const requests: string[] = [];
    cy.intercept('**', (req) => {
      requests.push(`${req.url} ${typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? '')}`);
    });
    visitWithProgress(ALL);
    cy.get('#certificate-name').type(NAME);
    cy.get('button.download').click();
    // About 0.3 s on a desktop; the margin is for slow CI machines.
    cy.get('[role="status"]', { timeout: 10000 }).should('have.text', 'Your certificate was saved.');
    const file = `${Cypress.config('downloadsFolder')}/javascript-in-colors-certificate.png`;
    cy.readFile(file, 'binary', { timeout: 10000 }).should((png: string) => {
      expect(png.slice(1, 4)).to.eq('PNG');
      expect(png.length).to.be.greaterThan(20000);
    });
    cy.window().then((win) => {
      expect(JSON.stringify({ ...win.localStorage })).not.to.contain(NAME);
      expect(requests.join('\n')).not.to.contain(NAME);
    });
  });

  it('works with the keyboard: type a name, then Print', () => {
    visitWithProgress(ALL);
    cy.window().then((win) => cy.stub(win, 'print').as('print'));
    cy.get('.sheet').should('be.visible');
    tabTo('#certificate-name');
    cy.focused().type(NAME);
    tabTo('button.print');
    pressEnter();
    cy.get('@print').should('have.been.calledOnce');
    cy.get('[role="status"]').should('have.text', 'Print opened.');
  });

  it('is reached from the star at the end of the color path', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'jic.progress',
          JSON.stringify({ v: 1, resumeCode: 'brave-otter-37', finishedIds: ALL, lastLessonId: 'dom' }),
        );
      },
    });
    cy.get('a.continue').should('contain.text', 'Get your certificate').click();
    cy.location('pathname').should('eq', '/certificate');
    cy.get('#certificate-name').should('be.visible');
  });
});
