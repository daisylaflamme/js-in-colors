# Build log

What was built, what was decided, and what the checks said, one entry per working session.
Newest first. Material for the README's "How I built this with Claude Code" section.

## 2026-11-05 · The certificate

Branch `feat/certificate`.

**Decided** (ADR 0010)

- The owner chose: the certificate is **earned at 10 of 10** (lessons stay unlocked), and Download saves a **PNG** made in the browser. Print covers PDF through the print dialog.
- The name is kept in memory only: not on a server, and not in localStorage either.
- Themes now apply to the screen only, so printing always uses the light palette.

**Built**

- `/certificate`. Before it's earned, it shows "You finished 6 of 10 lessons" and a Continue button. Once earned, it follows mockup 10:
  - The name box, with the note that it never leaves the device.
  - Download and Print.
  - The sheet: the 8 concept shapes, the title, the name in magenta on the accent line, the reason, Dot, the date and the star seal.
- `drawCertificate()` redraws the same design on a canvas for the PNG. `SHAPE_PATHS` in `libs/shared` is now the one source for the concept shapes, used by `ConceptShapeComponent` and the canvas.
- The color path's star links to the certificate. Home's main button becomes "Get your certificate" once all ten are done.

**Found and fixed along the way**

- In one long screenshot run, Download took 4.4 s and a 4-second test assertion failed. Timing it alone showed 0.3 s (fonts 63 ms, PNG encoding about 0.3 to 0.6 s cold), so the slowness was the busy test machine, not the app. The E2E check now allows 10 s, the same margin as the file wait.
- A dark screen theme would also have printed a dark certificate. Rather than special-case the page, the theme overrides are now `@media screen` only.

**Checks**

- Unit tests for the drawing (a recording fake canvas), the page (both states, the typed name, Download, Print, and that the name is never stored), `certificateEarned`, the star link and Home.
- Cypress `certificate.cy.ts`:
  - Axe at 3 sizes in 3 themes.
  - A real PNG lands in the downloads folder.
  - The name appears in no request and not in localStorage.
  - Keyboard → Print.
  - Home → certificate.
- Screenshots at 320, 390, 820 and 1440 px, dark, high contrast, a long name, the not-yet state, print media, and the downloaded PNG itself.

## 2026-11-05 · Lesson 10: Page magic (the DOM), its own color and shape

Branch `feat/lesson-dom`.

**Decided**

- Page magic had borrowed the yes-or-no purple and the helpers' hexagon since the mockups. The owner chose crimson (`#c62828`, the only unused hue) and a **window** shape: a rounded frame with a thick top bar. Contrast was measured before choosing (white on it 5.6:1, its text token 7.5:1 on white). This replaces the slate options proposed on 2026-11-02 (ADR 0009).
- Home's "What the colors mean" now lists page magic too. It was left out only while the color was undecided.

**Built**

- A `page` visual: the window shape drawn large, with one row per part (`h1`, `p`, `button`).
  - Each row shows its tag in code font, then the part as it looks on a page: a big heading, some words, a red button.
  - The part JavaScript found gets a thick outline **and** a pointer.
- Choices in page scenes carry a `target` (the part found) and/or `parts` (the page after a change), checked like the card's `key` and `props`.
- `content/lessons/dom.yaml`, 5 scenes:
  1. Meet the page.
  2. querySelector finds the heading.
  3. New words with textContent.
  4. Pick which part says Hi.
  5. A quiz on what the heading says.
- With every lesson ready there is no "coming soon" lesson left. The coming-soon unit test now uses a made-up course, and Home says "You finished the whole course!" once all ten are done.

**Found and fixed along the way**

- Prettier wrapped the button's `<text>` again (the CLAUDE.md rule from lesson 9). All three parts now share one short `<text>` line with a precomputed x and class, and a unit test checks the exact words.
- The window's page was a hole at first, so the dotted color-path line showed through it on Home. It is now filled with the background.

**Checks**

- Content valid: 10 lessons, 0 warnings. Lint, unit tests, build, Prettier and the Storybook build: green.
- Screenshots at 390, 820 and 1440 px and in the dark and high-contrast themes; no horizontal overflow at 320 px.

## 2026-11-05 · Lesson 9: Things with details (objects)

Branch `feat/lesson-objects`.

**Built**

- A new `card` visual: a rounded-square card (the object shape) with an orange border and a name tag on top. It has one row per detail: the key in code font, then the value in its concept's shape.
  - The detail being read gets a thick outline **and** a pointer.
  - Orange is only used for lines, never behind small text (ADR 0005).
  - Rows fade in one by one. With Calm or reduced motion they're simply there.
- Choices in card scenes carry a `key` (read a detail) and/or `props` (the card after a change). The validator checks that the key is on the card the choice shows, that keys are unique, and that names, keys and values fit.
- `content/lessons/objects.yaml`, 5 scenes:
  1. Meet the cat.
  2. The dot reads a detail.
  3. Ask the cat.
  4. Change a detail.
  5. A quiz on `dog.age`.

**Found and fixed along the way**

- In the dark theme the keys were pale on white rows: the theme turns `--color-object-text` pale for dark backgrounds, but `--color-surface` stays white. The rows now use `--color-bg`, so text and background change together. That rule is now in CLAUDE.md.
- The values came out as `" Tom "`. Prettier had wrapped a long `<text>` element across lines, and the line breaks became spaces (the same bug class as the header in lesson 7). The font size is now worked out per row, so the line is short enough to stay unwrapped, and a unit test checks the exact text.
- The validator caught a two-sentence Tip.

**Checks**

- Content valid: 9 lessons, 0 warnings. Lint, unit tests, build and the Storybook build: green.
- Screenshots at 390, 820 and 1440 px and in the dark and high-contrast themes; no horizontal overflow at 320 px.

## 2026-11-05 · Lesson 8: Lists of things (arrays)

Branch `feat/lesson-arrays`.

**Built**

- A new `list` visual: a row of up to 4 boxes between amber `[` `]` brackets, with a name tag above.
  - Each item is drawn in its concept's shape, with its spot number (`0`, `1`, `2`…) underneath.
  - The pointed-at box gets a thick outline **and** an arrow, so it isn't marked by color alone.
  - Items pop in one by one and the arrow drops in. With Calm or reduced motion they're simply there.
  - The caption says the list and the pointed spot in words.
- Choices in list scenes carry an `index` (point at a spot) and/or `items` (the list after a change, e.g. a `push`). At least one is required, and the validator checks the index points inside the list that choice shows.
- `content/lessons/arrays.yaml`, 5 scenes:
  1. Meet `fruits`.
  2. Counting starts at 0.
  3. Pick a spot.
  4. Add a fruit with `push`.
  5. A quiz on `pets[1]`.

**Found along the way**

- The first screenshots showed 5-letter items at 12px and the name tag drifting left of the centered row. The boxes are now a little wider (items get 14px or more) and the tag is centered over the row.

**Checks**

- Content valid: 8 lessons, 0 warnings. Lint, unit tests, build and the Storybook build: green.
- Screenshots at 390, 820 and 1440 px and in the dark and high-contrast themes; no horizontal overflow at 320 px with 4 items.

## 2026-11-05 · Lesson 7: Yes or no paths (conditions)

Branch `feat/lesson-conditions`.

**Built**

- A new `fork` visual: a road that splits at a signpost holding the condition (`sunny?`). The yes (`true`) path goes left and the no (`false`) path goes right, each ending in a boolean diamond and a label.
  - The taken path is bold and in the boolean color; the other is thin, dashed and muted, so the difference never rests on color alone.
  - A marker walks down the taken path. With Calm or reduced motion it's simply at the end.
  - The caption says it all in words.
- Choices in fork scenes carry a `path` (`yes` or `no`), because the value alone can't say which way to go (age 5 → no, 9 → yes). The validator keeps fork labels to 12 characters so they fit.
- `content/lessons/conditions.yaml`, 5 scenes:
  1. A fork in the road.
  2. Is it sunny? (`true` / `false`)
  3. The `else` path.
  4. How old is Dot? (`age >= 7`)
  5. A quiz on `if (false)`.

**Found and fixed along the way**

- Lesson leads showed a stray space before punctuation when the highlighted word ended the sentence ("picks a path ."). The line breaks around the highlight in `LessonHeader`'s template rendered as spaces, and the unit test collapsed whitespace, so it never noticed. The template is now one line under `prettier-ignore` (Prettier re-wrapped it), and a new test checks the exact text.
- In the dark theme, the first draft of the fork was nearly invisible: it drew roads and labels with `--color-ink`, which stays dark. Anything drawn straight on the stage now uses `--color-text`; this is noted in CLAUDE.md.

**Checks**

- Content valid: 7 lessons, 0 warnings. Lint, unit tests, build and the Storybook build: green.
- Screenshots at 390, 820 and 1440 px and in all three themes; no horizontal overflow at 320 px.

## 2026-11-05 · Lesson 6: Again and again (loops)

Branch `feat/lesson-loops`.

**Built**

- `content/lessons/loops.yaml`, 5 scenes:
  1. The long way (three `console.log` lines).
  2. The same thing as one `for` loop.
  3. Pick how many jumps.
  4. Count up with `i`.
  5. A quiz on how many times `i < 4` runs.
- Choices may now carry `lines` (1 to 4) in screen scenes, so a picked choice can fill the screen with a loop's output. The screen already fades lines in one by one, so it needed no new visual. The validator allows `lines` only in screen scenes, the same way `result` is limited to machine scenes.
- Loops ships before Conditions, which needs a new visual; Conditions is next.

**Checks**

- Content valid: 6 lessons, 0 warnings. Lint, unit tests and build: green.
- `lessons.cy.ts` walked the new lesson with no spec change. Together with `smoke.cy.ts`: 31 of 31.

## 2026-11-04 · Lesson 5: Magic machines (functions)

Branch `feat/lesson-functions`.

**Built**

- A new `machine` visual: a function as a machine with a name plate and a hexagon badge (the function shape). The input goes in on the left and the output comes out on the right, each in its concept's shape and color. It slides in and pops out; with Calm or reduced motion both are simply there. The caption says it in words: "A machine called double. In: 3. Out: 6."
- Added through the documented extension points: the `Visual` type, the validator (plus `result` on choices, allowed only in machine scenes), `VisualComponent`, and the interact merge. Stories and unit tests included.
- `content/lessons/functions.yaml`, 5 scenes: meet `double`, feed it numbers, see how it's built (`function` / `return`), a `shout` machine for words, and a quiz on `return`.

**Found and fixed along the way**

- A `<ng-template>` placed outside `<svg>` makes Angular create its shapes in the HTML namespace (NG8001 "'circle' is not a known element"). It has to sit inside the `<svg>`.
- On Windows PowerShell 5.1, `Get-Content | Set-Content -Encoding utf8` re-encodes files (BOM, and `·` turned into `Â·`). Edit files with the editor tools, not PowerShell pipes.

**Checks**

- Content valid: 5 lessons, 0 warnings. Lint, unit tests, build (16 tasks) and the Storybook build: green.
- `lessons.cy.ts` walked the new lesson with no spec change: 10 of 10. The smoke theme checks now cover the machine in dark and high contrast: 19 of 19. No horizontal overflow from 320 to 1440 px.

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
