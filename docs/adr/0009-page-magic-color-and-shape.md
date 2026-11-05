# 0009. Page magic gets its own color and shape

- Status: Accepted
- Date: 2026-11-05

## Context

Every concept has one color, one shape and one word, so a child can tell them apart without reading. Page magic (the DOM, concept `html`) broke that rule: the mockups drew it as a hexagon in the yes-or-no purple. The hexagon already belongs to helpers (functions), and purple to yes or no. The tokens file and ADR 0005 left this as an open design task. Lesson 10 is the first place the concept takes center stage, so it has to be settled now. Three slate options were proposed earlier (build log, 2026-11-02); the owner picked crimson instead, the one hue no other concept uses.

## Decision

- **Color:** crimson, the only hue the course did not use yet (number blue, string green, boolean purple, object orange, array yellow, function magenta, variable teal, accent yellow).
  - `--color-html: #c62828`: white text on it is 5.62:1; against the page ground 5.22:1.
  - `--color-html-text: #a51f1f`: 7.46:1 on white, 6.03:1 on the tint.
  - `--color-html-tint: #ffe0e0`: ink on it is 12.6:1.
  - `--color-html-on` stays white, so text on the fill passes AA at any size (unlike orange and teal, ADR 0005).
  - Dark and high contrast are derived by the existing `$concepts` loop in `_themes.scss`, with no new override.
- **Shape:** a **window**: a rounded frame with a thick top bar around an empty page, like a small browser window. The lesson's `page` picture is the same window, drawn large.
- `docs/mockups/design-tokens.css` and `styles/settings/_tokens.scss` change together (they stay a 1:1 copy).

## Consequences

- All eight JS concepts now have a unique color **and** a unique shape.
- Crimson sits near object orange (hue 28°) and function magenta (hue 325°), and red-green colorblind children may confuse it with the string green. That is acceptable only because color is never the only signal: the window shape and the words "page magic" always come with it.
- The PNG mockups predate this decision and still show the purple hexagon for page magic. The tokens and this ADR win over the images; there is no need to redraw them.
- Red can read as "wrong". The app never uses red for errors (quiz feedback is words and the jar, not a red state), so there is no clash. A future error color must not reuse `--color-html`.
