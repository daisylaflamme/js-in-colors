/// <reference types="cypress" />
import type { Result } from 'axe-core';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Runs axe (WCAG 2.x A + AA) on the page and fails with a readable list of violations. */
      checkPageA11y(context?: string): Chainable<void>;
    }
  }
}

function logViolations(violations: Result[]): void {
  cy.task(
    'table',
    violations.map(({ id, impact, description, nodes }) => ({
      id,
      impact,
      description,
      nodes: nodes.length,
      target: nodes[0]?.target.join(' '),
    })),
  );
}

/**
 * Concept chip rows become focusable (tabindex 0) only while they scroll, which a ResizeObserver
 * reports a frame after layout. Wait for that state so axe never sees the in-between frame.
 */
function chipRowsSettled(): void {
  cy.document({ log: false }).should((doc) => {
    doc.querySelectorAll('jic-concept-chip-list ul').forEach((ul) => {
      if (ul.scrollWidth > ul.clientWidth + 1)
        expect(ul.getAttribute('tabindex'), 'scrolling chip row is focusable').to.eq('0');
      else expect(ul.hasAttribute('tabindex'), 'wrapped chip row is not a tab stop').to.eq(false);
    });
  });
}

Cypress.Commands.add('checkPageA11y', (context?: string) => {
  chipRowsSettled();
  cy.injectAxe();
  cy.checkA11y(
    context,
    { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } },
    logViolations,
  );
});
