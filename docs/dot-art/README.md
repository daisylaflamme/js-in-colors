# Dot artwork

Dot, the guide character, in four poses: `dot-happy.svg`, `dot-thinking.svg`, `dot-cheering.svg` and `dot-curious.svg`. Made with Lovable for this project from a written brief (simple flat SVG, viewBox 120×130, part groups `antenna`, `body`, `arms`, `freckles`, `eyes`, `mouth`, and only the course's palette colors).

**License:** CC BY-NC 4.0, like the other artwork in this repository ([ADR 0006](../adr/0006-licensing.md), [LICENSE-CONTENT.md](../../LICENSE-CONTENT.md)).

**These files are the source.** The app does not load them directly. To change Dot:

1. Replace or edit the SVGs here (same file names, same rules).
2. Run `npm run dot-art`. It checks every file against the brief (elements, colors, part ids, viewBox) and regenerates `libs/visuals/src/lib/dot/dot-art.ts`, which the app renders and the certificate PNG draws.
3. Commit both. CI fails if the generated file doesn't match these SVGs.

Colors become theme tokens: the body is `--color-accent`, the outer outline is `--dot-outline` (pale in the dark theme so Dot stays visible), the eyes and mouth stay `--color-ink`, and freckles and antenna tips keep their concept colors.
