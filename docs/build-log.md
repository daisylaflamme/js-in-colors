# Build log

What was built, what was decided, and what the checks said, one entry per working session.
Newest first. Material for the README's "How I built this with Claude Code" section.

## 2026-11-02 · Lesson engine and the first real lessons

Branch `feat/lesson-engine` (stacked on `chore/decisions-themes-licenses`).

**Built**

- `libs/shared`: lesson types (watch / interact / quiz scenes, jar / screen / dot visuals), a path-aware validator with kid-readability warnings, and `tokenizeJs` for the code peek.
- `content/`: `course.yaml` (10 lessons, 3 ready) and Hello, Say it out loud and Variables (4, 4 and 5 scenes), in original short sentences. `content:build` compiles them into typed lazy modules and prints `file:line:col` errors.
- `libs/data-access`: `CourseStore` and `LessonStore` (NgRx SignalStore), with lesson loading tracked as an Angular pending task.
- `libs/visuals`: jar, screen and Dot. `libs/ui`: quiz feedback, replay button, lesson-done card.
- `libs/lesson-engine`: `SceneHost` with a scene-type registry (`inputBinding` / `outputBinding`), the three scene types, a fallback, and Library content.
- The lesson page is driven by the stores and the engine. The menu comes from the course.

**Decided** (with the owner)

- Hello uses a new `intro` concept: accent yellow plus an outlined star. A yellow circle would differ from Numbers by color only.
- A hand-written validator (only `yaml` added, no zod).
- Next is never blocked: the first choice is pre-picked, and quizzes allow retries.
- Lessons get optional `chips` ("Jars can hold:") to match the mockups.
- The initial bundle warning moved to 340 kB, the third change. `@ngrx/signals` and the course now load with the shell (+2.6 kB gzipped). The 400 kB error budget is unchanged.

**Found and fixed along the way**

- Component animations never ran. The `motion-ok` mixin selected `:root`, which Angular's style encapsulation can never match. The new reduced-motion e2e check found it.
- The lesson-load effect tracked store signals and closed a Tip opened during loading. It now tracks only the lesson id (regression test added).
- A stale Storybook came from the Nx cache: `build-storybook` now lists `libs/visuals` and `libs/lesson-engine` as inputs. Likewise, `shared:test` lists `content/`.
- The validator caught a 13-word Tip and empty screen lines in the new lessons. The Tip was shortened; empty screen lines are now allowed, because interact scenes fill them.
- `cy.press` moves focus with Tab but does not activate buttons with Enter or Space, so the walkthrough uses `type()` for activation (no pointer events, checked).

**Checks**

- Lint, 125 unit tests, build and the Storybook build: green.
- Cypress: 26 tests green. That's the smoke suite at three sizes and three themes, plus the keyboard walkthrough of Variables with axe on every scene, at phone and desktop, and with reduced motion.

**Environment notes**

- On this Windows machine the Nx daemon sometimes crashes after a successful run (a libuv `UV_HANDLE_CLOSING` assertion, exit code 127). Local checks run with `NX_DAEMON=false`. CI (Linux) is not affected.
- A dev server orphaned by an interrupted run held port 4200. E2E ran against `web:serve-static --port=4300`.

## 2026-11-02 · Decisions: fonts, themes, licenses

Branch `chore/decisions-themes-licenses`.

- Kept Baloo 2 + Nunito (ADR 0004). Dark and high-contrast themes are kept as token overrides. `data-theme` can be put on any element, and Storybook has a side-by-side theme story (ADR 0005).
- Added the rule for orange and teal fills: text on them must be large and bold, otherwise use the `-text` token on a tint.
- MIT for code, CC BY-NC 4.0 for content and artwork, with `LICENSE` and `LICENSE-CONTENT.md` (ADR 0006).
- Proposed three slate options plus a window shape for `--color-html`. The owner's pick is still pending.
- Axe now also runs in the dark and high-contrast themes. High contrast marks the current lesson with an outline.

## 2026-11-02 · Scaffold

Branch `main`.

- An Nx 24.0.3 workspace set up by hand (the create-nx-workspace templates ignored their options), Angular 22.2 without zone.js, Vitest, Cypress 15.21.1 (cypress-axe does not support 16), and Storybook 10.6.5 with the a11y addon.
- Design tokens copied 1:1 from the mockups, a semantic layer, dark and high-contrast themes from the same palette, and self-hosted fonts.
- A mobile-first lesson shell matching the mockups at 390, 820 and 1440 px: the native `<dialog>` focus contract, a skip link, and the menu as an overlay below 1200 px.
- Found by tools: axe's `scrollable-region-focusable` on the phone chip row, and a parallel-build race on `.angular/cache`.
- CI on GitHub Actions; ADRs 0001-0003.
