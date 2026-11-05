/**
 * Wait until the lesson's scene is on the page. The lesson page draws its header (the h1) from
 * the course before the lesson file has loaded, so "h1 is visible" is not enough: a Tab walk
 * started then can lose focus to <body> while the scene is added. Call this after every visit,
 * reload or Next before tabbing.
 */
export const waitForScene = (n: number) =>
  cy.get('jic-scene-nav .label').should('contain.text', `Scene ${n} of`);
