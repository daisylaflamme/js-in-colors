# 0005. Themes: light, dark and high contrast as token overrides

- Status: Accepted
- Date: 2026-11-02

## Context

The mockups define only a light theme. Children use the app on many screens, some at night, and some need more contrast. CLAUDE.md requires light, dark and high-contrast themes through tokens, never per-component CSS, and the rule "do not invent new colors".

## Decision

- **Three layers of tokens:** `_tokens.scss` is a 1:1 copy of `docs/mockups/design-tokens.css`; `_semantic.scss` maps them to roles (`--color-bg`, `--color-text`, `--color-border`, `--color-<concept>-on`, `--shape-stroke`, `--current-outline` …); `_themes.scss` overrides only those. Components use semantic and concept tokens and never know the theme.
- **Dark and high contrast are derived from the mockup palette only** (the palette and mixes of it, no new hues):
  - Dark: ink becomes the background, concept text becomes a pale mix of the fill and the ground, tints become a soft wash of the fill, shapes get a light outline.
  - High contrast: white surfaces, ink text and borders (concept text too, at 15:1), no tints, ink outlines on shapes and on the current lesson, thicker focus ring.
- **Selection:** `data-theme="light|dark|high-contrast"` wins; otherwise `prefers-contrast: more`, then `prefers-color-scheme: dark`. `forced-colors` keeps borders and focus rings visible. Any element can carry `data-theme` (so a region or a Storybook panel can show a theme); light is the base.
- **Text on fills (rule):** the orange (object) and teal (variable) fills reach only 3:1 with any text color (ink on orange 3.54:1, white on teal 3.91:1). Text on these fills must be **large and bold only** (at least 1.5rem / 24px, weight 700+). Anything smaller uses `--color-<concept>-text` on `--color-<concept>-tint`. White text is never used on orange or yellow (array).
- **Verification:** cypress-axe runs on the app in all three themes; Storybook has a Theme toolbar and a "Design system / Themes" side-by-side story.

## Consequences

- One component stylesheet serves all themes; a new theme is one mixin.
- Dark and high contrast were not designed by hand. They are reviewed from screenshots and may get a design pass later, still by token overrides.
- In the dark theme concept fills fall below 3:1 against the surface, so shapes always carry an outline there (`--shape-stroke`).
- The in-app theme picker (and "Calm motion", "Text size") come with the global settings milestone (classic NgRx, see ADR 0002). Until then the OS settings choose.
- Themes apply to the screen only (`@media screen`): printing always uses the light palette ([ADR 0010](0010-certificate.md)).
- `--color-html` (page magic) got its own crimson and a "window" shape in [ADR 0009](0009-page-magic-color-and-shape.md).
