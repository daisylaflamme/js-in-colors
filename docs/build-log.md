# Build log

What was built, what was decided, and what the checks said, one entry per working session.
Newest first. Material for the README's "How I built this with Claude Code" section.

## 2026-11-06 · Ask Dot live mode in the app (part 2 of 2)

Branch `feat/ask-dot-live-client`.

**Built**

- `LiveChatService` streams the server's SSE as an RxJS Observable in the same chunks as demo mode. Leaving the page aborts the request. A busy server (429), a server that's down, or no words within 12 s falls back to the demo answers and sets `resting`. A break mid-answer ends with Dot's oops.
- `provideChat(mode)`: demo by default. The `live` build configuration swaps one environment file, and `npm run start:live` proxies `/api` to the server. Only the lazy chat page reads the mode, so the initial bundle doesn't move (329.26 kB).
- The page shows a **Live** pill instead of **Demo mode**, the matching note in the safe chat rules, and "Dot is resting…" when live answers are unavailable.
- Browser tests for live mode fake the server with `cy.intercept` and run in their own CI step: the streamed answer and link, a 429 → resting, and no request for private or hurt questions. CI never calls an AI. Each spec skips itself in the other mode.
- The README section "How Ask Dot stays safe".

**Found along the way**

- jsdom has no global `ReadableStream`. The first live test "passed" a 2-chunk answer that turned out to be the fallback, catching its own setup error. That's the same trap as the canned eval, this time in a unit test; the spec now imports Node's stream.
- Per the Streams spec, `controller.error()` discards queued chunks, so a test of "breaks mid-answer" has to deliver its words on one read and fail on the next.

**Checked end to end with nothing faked:** the live app → `apps/api` → Groq answered "What is an array?" with a 3-sentence answer and the "Lists of things" lesson link.

## 2026-11-06 · Ask Dot live: the first real eval

Branch `fix/ask-dot-live-eval` (ADR 0013).

**Found by running `npm run chat:eval` against real Groq**

- The owner's first run "failed" and Nx showed only that. With the table visible, it said 24 of 30 passed. **But every answer was a canned demo answer.** `llama-3.1-8b-instant`, listed on Groq's public model page, wasn't available to the free account (`404 model_not_found`). The fallback protected the child, but it also hid the broken provider, and the eval counted canned answers as passes. That was a flaw in my eval.
- With `openai/gpt-oss-20b` (thinking set to low, and kept out of the stream): 27 of 30.
  - Three prompt injections got a bare "I'm sorry, but I can't help with that."
  - Some answers had Markdown (`**true**`).
  - One "pass" was poor: "someone at school is mean to me" got a coding tip.

**Fixed**

- The pipeline reports a fallback with a content-free reason. The server logs it, the eval fails it, and the server checks at start-up that the model is available to the key.
- A caring reply before any AI, in the browser and on the server: hurt, bullied, scared or sad → "tell a grown-up you trust".
- Plain text: Markdown marks are stripped from every word. A bare refusal gets "Ask me about JavaScript instead!". The prompt asks for both too.
- `npm run chat:eval` runs Node directly, so the table always prints.

**Result:** 32 of 32 against real Groq on the final code (on-topic, hard, silly, off-topic, personal, unsafe, care, injection).

## 2026-11-05 · Ask Dot's server: live AI behind an adapter (part 1 of 2)

Branch `feat/ask-dot-live`.

**Decided** (with the owner, ADR 0012)

- Demo stays the default. Live AI is one optional adapter, Groq, chosen by an environment variable, with the key on the server only, falling back to canned answers, at no cost.
- Groq's free tier, data retention (none by default; 30-day abuse logs; Zero Data Retention self-serve) and models were checked on its own pages first. Its data page doesn't mention training, so the owner checks the terms.
- Model `llama-3.1-8b-instant`: production, fast, plain answers. `gpt-oss-20b` is a reasoning model and would spend tokens thinking.
- A plain HTTP streaming endpoint, not GraphQL. This amends ADR 0003.

**Built**

- `@jic/shared/chat`: the chunk contract, the input guard, matching and lesson links, the output word check with a short blocklist, and the kid system prompt. Browser and server now share one copy. It has its own entry point so it stays out of the initial bundle.
- `apps/api`: Hono on Node 24, run straight from TypeScript (type stripping plus the workspace alias resolver).
  - `POST /api/chat` streams SSE in the existing contract.
  - `ChatProvider` with `DemoProvider` and `GroqProvider` (fetch, no SDK).
  - The safety pipeline:
    1. clean the input;
    2. private details never reach a provider;
    3. per-client and global rate limits (salted hashes, in memory);
    4. word-by-word output checks that stop before a bad word;
    5. a 60-word cap;
    6. fallback to canned on an error or a slow first word;
    7. the lesson link.
  - Logs carry no content.
- 30 tricky kid questions. In CI they run through the pipeline against a fake model that misbehaves on purpose. `npx nx run api:eval` runs them against real Groq.
- Lint enforces that the server can only import the shared pure code (`type:server`).

**Found along the way**

- Hono was pinned to releases a few weeks old, not the days-old latest.
- npm 11 again rewrote unrelated lockfile entries. The lockfile was rebuilt from main plus only the two new packages.
- `npm run api` takes about 17 s on the first start, while Nx builds its graph for the new project. A smoke test that gave up after 30 s and called curl without a timeout looked like a hang. With timeouts it showed the server streaming correctly (0.86 s for a full answer), the private reply, 400 and 429, and content-free logs.
- Stopping Nx's serve leaves the Node server running on Windows; it has to be stopped separately.

## 2026-11-05 · The real Dot

Branch `feat/dot-art`.

**Decided** (with the owner)

- Dot's artwork was made with Lovable from a written brief: four poses (happy, thinking, cheering, curious), flat SVG, viewBox 120×130, named part groups, and only the course's palette colors. The owner delivered the files to `docs/dot-art/`. The art is CC BY-NC 4.0 like the rest.

**Reviewed before use**

- All four files were read in full (1.4 to 1.8 KB, no scripts, links or embedded data) and rendered at 200, 64 and 32 px on light and dark backgrounds.
- They follow the brief. Cheering's raised arms come within about 3 units of the edge (not 4), and curious tilts the whole figure; both are fine.
- One real problem: on the dark theme, the ink outline matched the background, so the antenna ball looked detached and the arms floated.

**Built**

- `npm run dot-art` (`tools/dot-art/`) checks every SVG against the brief and converts it to data in `libs/visuals/src/lib/dot/dot-art.ts`.
  - Data, not `[innerHTML]` (Angular strips SVG from it) or `<img>` (which can't follow theme tokens).
  - The colors become roles: body, a themed outer outline (`--dot-outline`, pale on dark, which fixes the floating antenna), a face that stays ink on the yellow, and concept colors.
  - It has `node:test` tests. CI runs them and fails if the generated file doesn't match the SVGs.
- `DotCharacterComponent` takes a `pose`. Dot blinks now and then and bounces once when cheering; Calm or reduced motion keeps it still. The ids became classes, since one page can show Dot twice.
- Poses in use:
  - The quiz cheers on the right answer.
  - Ask Dot thinks while answering.
  - The certificate cheers.
  - Everything else is happy. Curious is kept for later.
- The certificate PNG draws the same art data. The hand-copied canvas Dot is gone.
- Stories: a pose control, and every pose in all three themes at 8 rem and 32 px.

**Checks**

- Screenshots of Home, a quiz after the right answer, Ask Dot while thinking, the certificate and its PNG, in light, dark and high contrast.

## 2026-11-05 · Honest Lighthouse numbers, and no more font jumps

Branch `perf/fonts-and-home`.

**Found: the published numbers were wrong.** Profiling Home for a fix showed the same build scoring 90 to 99 on an idle machine, against the 73 to 78 published in #14. Lighthouse's CPU benchmark had been 445 to 644 during those runs (busy machine; the 4x slowdown assumes a fast idle one), so blocking time was overstated several times over. Two orphaned headless Chrome runs from a timed-out command made it worse.

**Built**

- `tools/lighthouse/measure.mjs` (`npm run lighthouse`): Lighthouse 13.6, mobile preset, median of 3 (or `LIGHTHOUSE_RUNS`) per page, with every run's CPU benchmark printed. A benchmark under 1,000 marks the result unreliable and exits 1.
- A CI job "Lighthouse" runs it with 5 runs on a clean runner. It writes the table to the job summary, uploads the JSON reports, and never blocks a merge.
- Metric-matched fallback fonts. `'Baloo 2 Fallback'` and `'Nunito Fallback'` resize Arial (or the metric-compatible Liberation Sans and Arimo) to the real fonts' widths and heights, measured in Chrome at each weight used. Text no longer moves when the web fonts arrive.

**Measured on CI** (benchmarks 1,583 to 2,542)

| Page        | Before (CI, 3 runs) | After: medians of four CI runs | CLS before → after | TBT           |
| ----------- | ------------------- | ------------------------------ | ------------------ | ------------- |
| Home        | 87                  | 99, 99, 99, 89                 | 0.233 → 0          | 106 to 133 ms |
| Lesson      | 96                  | 85, 99, 85, 86                 | 0.122 → 0.051      | 118 to 124 ms |
| Certificate | 100                 | 88, 99, 99, 99                 | 0.002 → 0          | 101 to 108 ms |
| Ask Dot     | 92                  | 91, 99, 98, 99                 | 0.002 → 0          | 105 to 138 ms |

- **The swing between about 99 and 85 to 91 is the simulation, cross-checked.** Each page loads a short chain of files (the app, the page, the fonts; a lesson adds the lesson itself). On localhost they all arrive before the first paint, so in some runs Lighthouse's simulation counts the whole chain as blocking the paint and replays it on slow 4G: 0.6 s becomes 2.4 to 3.2 s. The observed paint stays at about 0.15 s. It happens to every page; a lesson, with the longest chain, gets it most often. A first draft of this entry blamed only the lesson's extra file, until the last CI run flipped Home too. With applied (real) throttling, a lesson paints no later than Home.
- **The real limit is client-side rendering.** Applied slow-4G throttling (on the busy laptop, so the absolute numbers are only indicative) put first paint at 8 to 10 s on every page, because the HTML is an empty shell until the JavaScript has run. Prerendering at build time is the lever, and a decision for the owner.

**Not done, on purpose**

- The plan's "lighten Home's start-up" step. On clean hardware, Home's blocking time is 118 ms; the earlier 428 ms was the busy laptop. There was nothing real to fix.
- The remaining 0.051 of lesson CLS. It's under the 0.1 "good" line, and it's one box near the top that moves once as the fonts settle.

## 2026-11-05 · Lighthouse and the build story

Branch `docs/lighthouse-and-writeup`.

**Measured** (Lighthouse 13.6, mobile preset, production build served locally, median of 3 runs per page)

| Page        | Performance | Accessibility | Best practices | SEO | LCP    | TBT    | CLS   |
| ----------- | ----------- | ------------- | -------------- | --- | ------ | ------ | ----- |
| Home        | 78          | 100           | 100            | 100 | 0.66 s | 1.03 s | 0.001 |
| Lesson      | 73          | 100           | 100            | 100 | 0.67 s | 1.64 s | 0.051 |
| Certificate | 78          | 100           | 100            | 100 | 0.68 s | 1.02 s | 0.001 |
| Ask Dot     | 77          | 100           | 100            | 100 | 0.67 s | 1.08 s | 0     |

- **Performance misses the 95 target.** Everything but Total Blocking Time is good. Most of it is one long start-up task in the framework and app chunk (Angular boot plus the first render, about 650 ms under the 4x throttle), plus style and layout work.
- This machine's Lighthouse CPU benchmark was 445 to 644. The 4x slowdown assumes a fast desktop, so blocking time is overstated here. The numbers are recorded as measured anyway, not with a friendlier throttle.
- Open work: measure on a faster machine or in CI, and split the start-up task.

**Fixed**

- SEO was 91: there was no `robots.txt`, so the server answered with the app's HTML. `apps/web/public/robots.txt` now allows everything (nothing private lives on the server), and SEO is 100.

**Written**

- The README's "How I built this with Claude Code": the rulebook, plan mode and the owner's decisions, mockups as truth, small PRs, and where tools and judgment each caught problems.
- The README's accessibility table now covers every lesson, the certificate, Ask Dot and the privacy checks, with the current bundle size.

## 2026-11-05 · Ask Dot, in demo mode

Branch `feat/ask-dot`.

**Decided** (ADR 0011)

- The owner chose demo mode first: pre-written answers, no server, no key. The real AI proxy comes later behind the same `ChatService`.
- Answers stream as chunks (`{ text }`, then an optional `{ link }`), so the screen already handles word-by-word replies.
- A personal-info guard runs in `ChatStore`, before any provider. The chat lives in a store provided by the page, so leaving ends it.

**Built**

- `DemoChatService`: one original answer per course idea, each linking to its lesson, matched by keywords. Anything else gets a gentle redirect, the same one every time for the same question. Words arrive about 60 ms apart, or all at once with Calm motion.
- The chat page (mockup 09): the yellow header with Dot and the Demo mode pill, Dot and kid bubbles, typing dots, lesson links, the "Try asking" chips, the question box and Send, and the safe chat rules card.
- `ChatBubble`, `TypingDots` and `SafeRulesCard` in `libs/ui` with stories, plus six new icons.
- The Library's "Still curious? Ask Dot" is now a real link, and Back returns to the same lesson.

**Found and fixed along the way**

- If typing and Send landed in one change detection, the `[value]` binding saw `''` → `''` and left the question in the box. The page now clears the element too. The unit test caught it.
- At 320 px the question box shrank to a few letters beside Send. The row now wraps, so the box gets a whole line.
- The certificate PR (#12) had committed a test-download PNG: Cypress's `downloads/` folder was never ignored. It is now ignored, and the file is removed.
- The initial bundle grew by 9 kB: the demo answers and the guard had landed in `main`. The page is lazy, but `main` imports the `@jic/data-access` barrel (for `CourseStore`), and the chat modules were re-exported there. The chat now has its own entry point, `@jic/data-access/chat`, and lives only in the lazy chunk. The initial total is 327.8 kB, up 2.9 kB, which is the six new icons the shell carries. CLAUDE.md has the rule.
- Screenshots seemed to show the chat not scrolled to the newest answer. Measuring showed it was at the bottom; the screenshot had caught the smooth scroll halfway.

**Checks**

- Unit tests for the matcher (every topic), the redirect, the guard, streaming with fake timers, the calm path, the store, the components and the page.
- Cypress `ask-dot.cy.ts`:
  - Axe at 3 sizes in 3 themes, while typing and when done.
  - Keyboard only.
  - The redirect and the guard.
  - **No question in any request**, and nothing in localStorage.
  - A lesson link, a fresh chat after leaving, and Library → Ask Dot → Back.
- Screenshots at 320, 390, 820 and 1440 px, mid-stream, dark and high contrast.

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
