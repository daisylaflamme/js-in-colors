/**
 * Ask Dot in live mode (ADR 0012), against a live build:
 *   CYPRESS_chatMode=live npx nx e2e web-e2e --configuration=live --spec src/e2e/ask-dot-live.cy.ts
 * The Ask Dot server is faked with cy.intercept, so no AI is ever called (CI has no key).
 */
const describeLive = Cypress.env('chatMode') === 'live' ? describe : describe.skip;

const sse = (...chunks: object[]) =>
  [...chunks.map((c) => `data: ${JSON.stringify(c)}`), 'event: done\ndata: '].map((b) => `${b}\n\n`).join('');

const LINK = { lessonId: 'loops', label: 'See it in the Loops lesson', concept: 'number' };
const lastDot = () => cy.get('jic-chat-bubble[data-from="dot"]').last();
const answered = () => cy.get('[role="status"]', { timeout: 10000 }).should('contain.text', 'Dot says:');

describeLive('Ask Dot, live mode', () => {
  it('says Live, sends only the question, and shows the streamed answer with its lesson link', () => {
    cy.intercept('POST', '/api/chat', {
      statusCode: 200,
      headers: { 'content-type': 'text/event-stream' },
      body: sse({ text: 'Loops' }, { text: ' are like' }, { text: ' a toy train.' }, { link: LINK }),
    }).as('chat');
    cy.visit('/ask-dot');
    cy.get('.demo-pill').should('have.text', 'Live');
    cy.get('jic-safe-rules-card .note').should('contain.text', 'every word is checked');
    cy.get('#question').type('What is a loop?{enter}');
    cy.wait('@chat').its('request.body').should('deep.equal', { question: 'What is a loop?' });
    answered();
    lastDot().find('.text').should('have.text', 'Loops are like a toy train.');
    cy.get('.lesson-link').should('have.attr', 'href', '/lesson/loops');
    cy.get('.resting').should('not.exist');
    cy.checkPageA11y();
  });

  it('answers from the pre-written answers, and says Dot is resting, when the server is busy', () => {
    cy.intercept('POST', '/api/chat', {
      statusCode: 429,
      body: { error: 'resting', message: 'Dot is resting for a little while. Try again later!' },
    }).as('chat');
    cy.visit('/ask-dot');
    cy.contains('button.chip', 'What is a variable?').click();
    cy.wait('@chat');
    answered();
    lastDot().should('contain.text', 'A variable is like a jar with a name.');
    cy.get('.resting').should('contain.text', 'Dot is resting');
    cy.checkPageA11y();
  });

  it('never sends personal details or a hurt child’s words to the server', () => {
    let calls = 0;
    cy.intercept('POST', '/api/chat', (req) => {
      calls++;
      req.reply({
        statusCode: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: sse({ text: 'ok' }),
      });
    });
    cy.visit('/ask-dot');
    cy.get('#question').type('my name is Zyxwen{enter}');
    lastDot().should('contain.text', "Let's keep names and places private.");
    cy.get('#question').type('someone at school is mean to me{enter}');
    lastDot().should('contain.text', 'Please tell a grown-up you trust');
    cy.then(() => expect(calls).to.eq(0));
  });
});
