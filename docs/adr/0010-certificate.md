# 0010. The certificate: earned, made on the device

- Status: Accepted
- Date: 2026-11-05

## Context

The color path ends in a star: the certificate (mockup 10). A child types a name, sees it on a "Certificate of Discovery" and can save or print it. Two hard rules apply (CLAUDE.md, ADR 0001): no personal data is collected, and the certificate name is typed and rendered on the device, never sent to or stored on a server. Lessons have no locks ("No rush, no locks"), so the certificate needed its own rule. The owner chose both points below.

## Decision

- **Earned at 10 of 10.** `/certificate` is always reachable (from the star and from Home), but it is only filled in once every lesson in the course is finished (`CourseStore.certificateEarned`). Before that it says how many are done and offers to continue. The lessons stay unlocked; the certificate means something because it says "finishing all 10 lessons".
- **The name lives in memory only.** It is a signal on the page, gone on reload. It is not saved to localStorage or anywhere else, not even on the device: a shared family computer should not keep a child's name. The input has `autocomplete="off"` so the browser does not remember it either.
- **Download is a PNG made in the browser.** The certificate is drawn on a canvas (`drawCertificate`), turned into a Blob and saved through an object URL. No PDF library and no request. The PNG redraws the layout instead of rasterizing the HTML, because an SVG or HTML snapshot drawn into an image cannot use the page's web fonts; a canvas can once `document.fonts.load()` has finished. Shapes come from `SHAPE_PATHS` (`libs/shared`), the same data the on-screen shapes use. The PNG always uses the light "paper" palette, read from the raw tokens that no theme overrides.
- **Print uses CSS.** A print stylesheet shows only the certificate on one landscape page. Themes now apply to `screen` only (`_themes.scss`), so anything printed gets the light palette; "Save as PDF" in the print dialog covers PDF.

## Consequences

- The on-screen certificate (HTML) and the PNG (canvas) are two drawings of one design. They share the text constants, the concept list and the shape paths; layout changes must be made in both. The PNG is checked by eye in review and by a unit test of what it writes.
- Dot is drawn twice (the placeholder component and the canvas) until the real Dot artwork replaces both.
- A child who reloads the page types the name again. That is the price of storing nothing.
- Cypress checks that the name never appears in any request or in localStorage, and that a real PNG lands in the downloads folder.
