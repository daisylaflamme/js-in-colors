/**
 * Prerendered pages (ADR 0014): the build writes real HTML for every page, the browser shows it
 * before any JavaScript runs, and Angular then hydrates it (reuses it) without errors.
 * Runs against the prerendered production build (serve-static) only: the dev server renders each
 * request on demand and has no 404 page. See `prerendered` in cypress.config.ts.
 */
const prerendered = [true, 'true'].includes(Cypress.env('prerendered'));
const describePrerendered = prerendered ? describe : describe.skip;

/**
 * Pages, a few words each one's HTML must already contain, and the element that must survive
 * start-up (the same node: hydrated, not drawn again).
 */
const PAGES = [
  { path: '/', title: 'Your color path', words: 'Hi, explorer!', keep: 'main' },
  // The stage too: the lesson file must be in hand before the page's first render.
  { path: '/lesson/variables', title: 'Variables', words: 'This is a jar.', keep: 'jic-scene-host' },
  { path: '/certificate', title: 'Your certificate', words: 'Your color path', keep: 'main' },
  { path: '/ask-dot', title: 'Ask Dot', words: 'Ask Dot', keep: 'main' },
] as const;

/** Angular reports hydration problems as NG05xx errors (NG0500 to NG0507). */
const HYDRATION_ERROR = /NG05\d\d/;

type MarkedWindow = Cypress.AUTWindow & {
  __prerendered?: Element | null;
  __textSizeAtParse?: string | null;
};

/**
 * Visit a page and, as soon as the HTML is parsed (before the app's scripts run), remember the
 * `keep` element and the text size on <html>. Console errors and warnings are spied on throughout.
 */
function visitPrerendered(path: string, storage: Record<string, string> = {}, keep = 'main'): void {
  cy.visit(path, {
    failOnStatusCode: false,
    onBeforeLoad(win: MarkedWindow) {
      for (const [key, value] of Object.entries(storage)) win.localStorage.setItem(key, value);
      cy.spy(win.console, 'error').as('consoleError');
      cy.spy(win.console, 'warn').as('consoleWarn');
      win.document.addEventListener('readystatechange', () => {
        if (win.document.readyState !== 'interactive') return;
        win.__prerendered = win.document.querySelector(keep);
        win.__textSizeAtParse = win.document.documentElement.getAttribute('data-text-size');
      });
    },
  });
  // The app has started: the prerender-only attribute is gone.
  cy.get('jic-root').should('not.have.attr', 'data-prerendered');
}

function expectNoHydrationErrors(): void {
  for (const alias of ['@consoleError', '@consoleWarn']) {
    cy.get(alias).then((spy) => {
      const calls = (spy as unknown as sinon.SinonSpy).getCalls();
      const messages = calls.map((c) => c.args.map(String).join(' '));
      expect(
        messages.filter((m) => HYDRATION_ERROR.test(m)),
        'hydration errors',
      ).to.deep.equal([]);
    });
  }
}

describePrerendered('Prerendered pages', () => {
  for (const page of PAGES) {
    it(`${page.path} is real HTML before any JavaScript runs`, () => {
      cy.request(page.path).then(({ body }) => {
        const html = String(body);
        expect(html).to.contain(`<title>${page.title} · JavaScript in Colors</title>`);
        expect(html).to.contain(page.words);
        expect(html).to.contain('ng-server-context="ssg"');
      });
    });

    it(`${page.path} is hydrated, not drawn again, with no hydration errors`, () => {
      visitPrerendered(page.path, {}, page.keep);
      // The page has started once the router's first navigation is done: it drops the trailing slash
      // that http-server's folder redirect added (the lesson's resolver and chunk come before that).
      cy.location('pathname').should('eq', page.path);
      cy.window().then((win: MarkedWindow) => {
        expect(win.__prerendered, `the prerendered ${page.keep}`).to.be.instanceOf(win.HTMLElement);
        // The same element is still in the page: Angular reused the HTML instead of replacing it.
        expect(win.document.querySelector(page.keep)).to.equal(win.__prerendered);
      });
      cy.title().should('eq', `${page.title} · JavaScript in Colors`);
      expectNoHydrationErrors();
    });
  }

  it('an unknown address gets the Not found page, with a 404 status', () => {
    cy.request({ url: '/no-such-page', failOnStatusCode: false }).then(({ status, body }) => {
      expect(status).to.equal(404);
      expect(String(body)).to.contain('We could not find that page');
    });
    visitPrerendered('/no-such-page');
    cy.contains('h1', 'We could not find that page').should('be.visible');
    expectNoHydrationErrors();
  });

  it('applies a saved text size before the app starts, so nothing jumps', () => {
    visitPrerendered('/lesson/variables', {
      'jic.settings': JSON.stringify({ calmMotion: false, textSize: 'larger' }),
    });
    cy.window().its('__textSizeAtParse').should('eq', 'larger');
    cy.get('html').should('have.attr', 'data-text-size', 'larger');
    expectNoHydrationErrors();
  });

  it('on a phone, the prerendered desktop menu stays hidden and the app swaps in the overlay', () => {
    cy.viewport(390, 844);
    visitPrerendered('/lesson/variables');
    cy.get('jic-lesson-menu.menu').should('not.exist');
    cy.get('button[aria-controls="lesson-menu"]').should('have.attr', 'aria-expanded', 'false');
    expectNoHydrationErrors();
  });

  it('on a desktop, the menu is in the HTML already and stays after start-up', () => {
    cy.viewport(1440, 900);
    cy.request('/lesson/variables').its('body').should('contain', '<jic-lesson-menu');
    visitPrerendered('/lesson/variables');
    cy.get('jic-lesson-menu.menu').should('be.visible');
    expectNoHydrationErrors();
  });

  describe('a child who acts while the page is still starting', () => {
    // Hold back the lazy chunks (the lesson page and its lesson), so the prerendered page is on
    // screen but not started when the child acts.
    beforeEach(() => {
      cy.viewport(1440, 900);
      cy.intercept({ url: /\/chunk-[A-Za-z0-9_-]+\.js$/ }, (req) => {
        req.on('response', (res) => {
          res.setDelay(700);
        });
      });
    });

    /** A real Enter key through Chrome DevTools: it activates a button as a keyboard does. */
    const realEnter = () =>
      cy.then(() =>
        Cypress.automation('remote:debugger:protocol', {
          command: 'Input.dispatchKeyEvent',
          params: { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' },
        }).then(() =>
          Cypress.automation('remote:debugger:protocol', {
            command: 'Input.dispatchKeyEvent',
            params: { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 },
          }),
        ),
      );

    it('a tap on Tip is kept, and the Tip opens', () => {
      visitPrerendered('/lesson/variables');
      cy.get('jic-help-tabs button.tip').click();
      cy.get('dialog.tip', { timeout: 8000 }).should('match', '[open]');
      expectNoHydrationErrors();
    });

    it('a real Enter on Next is kept, and the lesson moves to scene 2', () => {
      visitPrerendered('/lesson/variables');
      cy.get('jic-scene-nav .next').focus();
      realEnter();
      cy.get('jic-scene-nav .label', { timeout: 8000 }).should('have.text', 'Scene 2 of 5');
      expectNoHydrationErrors();
    });
  });
});
