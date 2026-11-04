# 0006. Licensing: MIT for code, CC BY-NC 4.0 for content and artwork

- Status: Accepted
- Date: 2026-11-02

## Context

The repo is public and is a portfolio piece: people should be able to read, run and reuse the code. The lessons, the characters (Dot) and the illustrations are original creative work that should not be resold or used commercially without permission.

## Decision

- **Code: MIT** (`LICENSE`). Source code, templates, styles, configuration, tests and design-token values.
- **Content and artwork: CC BY-NC 4.0** (`LICENSE-CONTENT.md`). Lesson text and data (`content/`), learning copy shown in the app, Dot and other illustrations and the logo (including SVG drawn inside source files), and `docs/mockups/`.
- **Fonts:** SIL OFL 1.1 from their authors. Third-party packages keep their own licenses.
- Where a file mixes both (a component that draws Dot), the code is MIT and the drawing and text are CC BY-NC 4.0. `LICENSE-CONTENT.md` lists what counts as content.
- `package.json` says `MIT` because npm metadata describes the code.

## Consequences

- Anyone can learn from and reuse the code, including commercially.
- Reusing the lessons or Dot commercially needs permission from the author.
- Contributors must agree that their content contributions are CC BY-NC 4.0 and code contributions MIT (to be stated in a CONTRIBUTING file when outside contributions open).
- CC BY-NC is not an open-source license in the OSI sense; that is intended for the creative parts only.
