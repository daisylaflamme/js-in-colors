/**
 * Home (the color path, mockup 08), progress saved on this device, and the global settings.
 * Progress and settings live in localStorage (ADR 0008); Cypress clears it between tests.
 */
import { emulateReducedMotion, followFocusedLink, pressEnter, tabTo } from '../support/keyboard';

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

const CODE = /^[a-z]{2,8}-[a-z]{3,7}-[1-9][0-9]$/;

const continueLink = () => cy.get('a.continue');
const resumeCode = () => cy.get('jic-resume-code-pill code');
const calmToggle = () => cy.contains('button[jic-setting-toggle]', 'Calm motion');
const textSizeToggle = () => cy.contains('button[jic-setting-toggle]', 'Text size');

/** Visit with progress already saved, as if the child had been here before. */
function visitWithProgress(path: string, finishedIds: string[], lastLessonId: string | null): void {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem(
        'jic.progress',
        JSON.stringify({ v: 1, resumeCode: 'brave-otter-37', finishedIds, lastLessonId }),
      );
    },
  });
}

const runningAnimations = (doc: Document) => doc.getAnimations().filter((a) => a.playState === 'running');

for (const vp of VIEWPORTS) {
  describe(`home (${vp.name} ${vp.width}x${vp.height})`, () => {
    beforeEach(() => cy.viewport(vp.width, vp.height));

    it('greets a new visitor, offers Start, and has no a11y violations', () => {
      cy.visit('/');
      cy.title().should('eq', 'Your color path · JavaScript in Colors');
      cy.get('h1').should('have.text', 'Hi, explorer!');
      continueLink()
        .should('contain.text', 'Start: Hello, JavaScript!')
        .and('have.attr', 'href', '/lesson/hello');
      cy.get('nav[aria-label="Lessons"]').should('not.exist'); // Home has no lesson menu
      cy.get('jic-color-path li').should('have.length', 11);
      cy.get('jic-color-path [aria-current="step"]').should('contain.text', 'Hello, JavaScript!');
      cy.checkPageA11y();
    });

    it('shows saved progress on the path', () => {
      visitWithProgress('/', ['hello', 'output'], 'output');
      cy.get('h1').should('have.text', 'Welcome back, explorer!');
      continueLink().should('contain.text', 'Continue: Variables');
      cy.get('jic-color-path [data-state="finished"]').should('have.length', 2);
      cy.get('jic-color-path [data-state="current"]')
        .should('contain.text', 'You are here')
        .and('contain.text', 'Variables');
      cy.get('jic-color-path [data-state="current"] jic-dot-character').should('be.visible');
      cy.checkPageA11y();
    });
  });
}

describe('home themes', () => {
  for (const theme of ['dark', 'high-contrast'] as const) {
    it(`has no detectable a11y violations in the ${theme} theme (phone and desktop)`, () => {
      for (const [w, h] of [
        [390, 844],
        [1440, 900],
      ] as const) {
        cy.viewport(w, h);
        visitWithProgress('/', ['hello'], 'output');
        cy.document().then((doc) => doc.documentElement.setAttribute('data-theme', theme));
        cy.get('h1').should('be.visible');
        cy.checkPageA11y();
      }
    });
  }
});

describe('progress on this device', () => {
  it('makes a resume code on the first visit and keeps it', () => {
    cy.viewport(1440, 900);
    cy.visit('/');
    resumeCode()
      .invoke('text')
      .should('match', CODE)
      .then((code) => {
        cy.reload();
        resumeCode().should('have.text', code);
        cy.window().then((win) =>
          expect(JSON.parse(win.localStorage.getItem('jic.progress') ?? '{}').resumeCode).to.eq(code),
        );
        cy.visit('/lesson/variables');
        cy.get('jic-lesson-menu .code').should('have.text', code);
      });
  });

  it('finishes a lesson with the keyboard and shows it on the path after a reload', () => {
    cy.viewport(390, 844);
    cy.visit('/');
    cy.get('h1').should('be.visible');
    cy.get('#main').focus();
    tabTo('a.continue');
    followFocusedLink();
    cy.location('pathname').should('eq', '/lesson/hello');

    for (let scene = 1; scene <= 4; scene++) {
      cy.get('#main').focus();
      tabTo('jic-scene-nav .next');
      pressEnter();
    }
    cy.focused().should('match', 'jic-lesson-done-card h2');

    cy.reload(); // progress survives a reload
    cy.get('h1').should('have.text', 'Hello, JavaScript!'); // wait for the lesson before tabbing
    cy.get('#main').focus();
    tabTo('jic-lesson-header a', 'JavaScript in Colors'); // the logo links home
    followFocusedLink();
    cy.location('pathname').should('eq', '/');
    cy.get('h1').should('have.text', 'Welcome back, explorer!');
    cy.get('jic-color-path [data-state="finished"]')
      .should('have.length', 1)
      .and('contain.text', 'Hello, JavaScript!');
    continueLink().should('contain.text', 'Continue: Say it out loud');
  });

  it('copies the resume code and says so', () => {
    cy.viewport(1440, 900);
    visitWithProgress('/', [], null);
    cy.window().then((win) => cy.stub(win.navigator.clipboard, 'writeText').as('writeText').resolves());
    cy.get('jic-resume-code-pill button').should('have.attr', 'aria-label', 'Copy resume code').click();
    cy.get('@writeText').should('have.been.calledOnceWith', 'brave-otter-37');
    cy.get('jic-resume-code-pill [role="status"]').should('have.text', 'Copied!');
  });

  it('starts fresh when saved progress is broken', () => {
    cy.visit('/', { onBeforeLoad: (win) => win.localStorage.setItem('jic.progress', '{oops') });
    cy.get('h1').should('have.text', 'Hi, explorer!');
    resumeCode().invoke('text').should('match', CODE);
  });

  it('still works when the browser blocks storage', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        Object.defineProperty(win, 'localStorage', {
          get() {
            throw new DOMException('Storage is blocked', 'SecurityError');
          },
        });
      },
    });
    cy.get('h1').should('have.text', 'Hi, explorer!');
    resumeCode().invoke('text').should('match', CODE);
    calmToggle().click().should('have.attr', 'aria-pressed', 'true');
    continueLink().click();
    cy.get('h1').should('have.text', 'Hello, JavaScript!');
  });
});

describe('settings', () => {
  afterEach(() => cy.then(() => emulateReducedMotion('no-preference')));

  it('Calm motion and Text size apply at once and are remembered', () => {
    cy.viewport(1440, 900);
    cy.visit('/');
    calmToggle().should('have.attr', 'aria-pressed', 'false').click();
    calmToggle().should('have.attr', 'aria-pressed', 'true');
    cy.get('html').should('have.attr', 'data-motion', 'calm');

    textSizeToggle().should('contain.text', 'Text size: Normal').click();
    textSizeToggle().should('contain.text', 'Text size: Bigger').click();
    textSizeToggle().should('contain.text', 'Text size: Biggest');
    cy.get('html').should('have.attr', 'data-text-size', 'larger').and('have.css', 'font-size', '20px');
    cy.get('.settings-status').should('have.text', 'Text size: Biggest');
    cy.checkPageA11y();

    cy.reload();
    calmToggle().should('have.attr', 'aria-pressed', 'true');
    cy.get('html').should('have.attr', 'data-motion', 'calm').and('have.css', 'font-size', '20px');
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
    });

    textSizeToggle().click(); // back to Normal
    cy.get('html').should('not.have.attr', 'data-text-size');
  });

  it('the path ring breathes normally (control)', () => {
    cy.viewport(1440, 900);
    cy.then(() => emulateReducedMotion('no-preference'));
    cy.visit('/');
    cy.get('jic-color-path [data-state="current"]').should('be.visible');
    cy.document().should((doc) => expect(runningAnimations(doc).length).to.be.greaterThan(0));
  });

  it('with Calm motion on, nothing keeps moving: Home and a lesson', () => {
    cy.viewport(1440, 900);
    cy.then(() => emulateReducedMotion('no-preference')); // the toggle alone must be enough
    cy.visit('/');
    calmToggle().click();
    cy.document().should((doc) => expect(runningAnimations(doc)).to.have.length(0));

    continueLink().click();
    cy.get('h1').should('have.text', 'Hello, JavaScript!');
    cy.get('#main').focus();
    tabTo('jic-scene-nav .next');
    pressEnter();
    cy.document().should((doc) => expect(runningAnimations(doc)).to.have.length(0));
  });
});
