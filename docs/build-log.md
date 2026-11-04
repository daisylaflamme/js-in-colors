# Build log

What was built, what was decided, and what the checks said, one entry per working session.
Newest first. Material for the README's "How I built this with Claude Code" section.

## 2026-11-04 · Lesson 4: Numbers, words, yes/no

Branch `feat/lesson-data-types`.

**Built**

- `content/lessons/data-types.yaml`, 5 scenes: a number in a jar, picking a kind (`7`, `"7"`, `true`), a yes-or-no jar, `typeof` on the screen, and a quiz on `"7"` with quotes. YAML only: the jar already draws each kind in its own shape and color.
- `lessons.cy.ts` walks **every ready lesson** with the keyboard at phone and desktop sizes, with axe on every scene and the right quiz answer. `cypress.config.ts` reads the list from `content/` at startup, so later lessons are covered with no spec change.

**Checks**

- Content valid: 4 lessons, 0 errors, 0 warnings. The new spec: 8 of 8 green.

## 2026-11-03 · Home color path, local progress, settings

Branch `feat/home-progress` (stacked on `feat/lesson-engine`).

**Built**

- Home at `/` (mockup 08):
  - The resume code with Copy, plus the Calm motion and Text size toggles.
  - A greeting from Dot and one big Start / Continue / Visit again link.
  - The color path, with checks, a dashed ring and Dot on the current lesson, ending in the certificate star.
  - The color legend.
  - Phone and tablet get one lesson per row; lg gets the zigzag, drawn with subgrid and CSS `hypot()` / `atan2()` lines.
- Progress in `CourseStore` (`withProgress()`): the resume code, finished lessons and the last lesson opened, saved to `jic.progress` and validated on load. Codes look like `blue-fox-42`, from two hand-checked word lists.
- Settings in classic NgRx Store + Effects: Calm motion and Text size (100 / 112.5 / 125%), saved to `jic.settings` and applied as attributes on `<html>`.
- New ui pieces: `ColorPath`, `ResumeCodePill`, `SettingToggle`. The logo and "Your color path" link home. ADR 0008.

**Decided** (with the owner)

- The resume code is a local key only: no restore box until the sync milestone.
- Settings use classic NgRx (installed `@ngrx/store` and `@ngrx/effects` 22.0.1).
- Calm motion only adds calm; it never overrides the device's reduced-motion setting.

**Found and fixed along the way**

- The whole `@jic/ui` barrel was in the initial bundle, lesson-only components included, because the libs weren't marked side-effect free. Adding a private `package.json` with `sideEffects: false` per lib took the initial bundle from 374 to 324 kB, which more than paid for classic NgRx (+27 kB).
- With storage blocked, reading `window.localStorage` itself throws. The storage token factories read it unguarded, so the app crashed on start. Found by the new blocked-storage e2e test.
- The color path overflowed 320px, because it reserved room for Dot beside every stop. Below lg, Dot now peeks over the corner of the current shape.
- A 1 ms infinite animation still flickers. Looping animations now pause with `--motion-loop` under Calm or reduced motion.
- Prettier's line breaks in two templates ran words together ("VariablesVariables" in a link name). There's now a hidden comma between title and topic.
- A TS 6 typed-array type error in the resume code generator. The shared lib's tests don't typecheck; the web build caught it.
- A story type error that only the Storybook build typechecks.
- An axe race: chip rows become focusable a frame after layout. `checkPageA11y` now waits for that.
- Cypress doesn't follow links on a simulated Enter, so specs Tab to the link and click the focused element (`followFocusedLink`).

**Checks**

- Lint (no warnings), 170 unit tests and the build: green. Initial bundle 324 kB raw, 88 kB gzipped.
- Storybook build: green.
- Cypress: 40 tests green against the production build, including Home at three sizes and three themes, persistence across reloads, broken and blocked storage, and the settings.

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
