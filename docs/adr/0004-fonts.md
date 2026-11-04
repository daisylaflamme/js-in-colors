# 0004. Fonts: Baloo 2 and Nunito, self-hosted

- Status: Accepted
- Date: 2026-11-02

## Context

The audience is young readers. We need a friendly display face for titles and big values, and a calm, very readable body face. The mockups (`docs/mockups/README.md`, `11-design-tokens.png`) were drawn with Baloo 2 and Nunito. Nunito + Atkinson Hyperlegible Next was also considered. The privacy rules forbid CDN fonts (no requests to third parties).

## Decision

- **Baloo 2** (weights 600, 700, 800) for headings, titles and large values. **Nunito** (500, 700, 800) for everything else. Code uses the system monospace stack.
- Both are SIL OFL 1.1 and are **bundled from `@fontsource`** (`@fontsource/baloo-2`, `@fontsource/nunito`, pinned to 5.3.0). Only the latin subset and only these weights are imported (`styles/fonts.scss`), so the build ships 6 woff2 files plus woff fallbacks.
- `font-display: swap`, with `system-ui` as the fallback in `--font-display` and `--font-body`.

## Consequences

- No requests to Google Fonts or any CDN. The fonts are cached with the app.
- Matches the mockups exactly, so screenshots and the real app agree.
- Nunito is rounded but less tuned for early readers than Atkinson Hyperlegible. If testing with children shows reading problems, revisit the body face in a new ADR (only `--font-body` and `styles/fonts.scss` change).
- Adding a weight or a script (for example latin-ext for translations) means one more `@use` line and a few kB.
