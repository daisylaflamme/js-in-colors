# JavaScript in Colors

A web app that introduces young children (about 6 to 12) to JavaScript **ideas** through color, shape, short reading and tiny interactions. There is almost no typing of code. Every concept has its own color, shape and word: numbers are blue circles, words are green pills, yes-or-no is a purple diamond, and a variable is a jar with a name on it.

It is also a front-end portfolio project: modern Angular, a real design system, accessibility, animation and tests, built with Claude Code.

![The lesson screen on desktop](docs/mockups/01-lesson-default.png)

> Status: all ten lessons (Hello, Say it out loud, Variables, Numbers, words, yes/no, Magic machines, Yes or no paths, Again and again, Lists of things, Things with details, and Page magic) run on a data-driven lesson engine. Home shows the color path with a Continue button, and progress, a resume code, Calm motion and Text size are saved on the device. Finishing all ten earns a certificate, saved as a PNG or printed, made entirely in the browser. Ask Dot answers JavaScript questions in demo mode (pre-written answers, no server); the real AI proxy comes later. Progress so far: [docs/build-log.md](docs/build-log.md).

## Stack

| Area              | Choice                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| App               | Angular 22 (standalone components, signals, zoneless, new control flow, lazy routes)                                                         |
| Monorepo          | Nx 24                                                                                                                                        |
| Styling           | SCSS, ITCSS-lite layers, CSS custom-property design tokens, light / dark / high-contrast themes                                              |
| Fonts             | Baloo 2 + Nunito, self-hosted (OFL)                                                                                                          |
| State             | Signals for local state; NgRx SignalStore for features; classic NgRx for cross-cutting state ([ADR 0002](docs/adr/0002-state-management.md)) |
| Data (planned)    | GraphQL (Apollo Angular + graphql-codegen), mocked with MSW ([ADR 0003](docs/adr/0003-minimal-backend.md))                                   |
| Visuals (planned) | D3 modules for SVG concept visuals                                                                                                           |
| Unit tests        | Vitest (Angular's `@angular/build:unit-test` for the app, AnalogJS for libs)                                                                 |
| Component docs    | Storybook 10 with the a11y addon                                                                                                             |
| E2E               | Cypress 15 + cypress-axe at three viewports                                                                                                  |
| CI                | GitHub Actions                                                                                                                               |

## Repo layout

```
apps/web            Angular app (shell, Home, lesson route)
apps/web-e2e        Cypress smoke + accessibility tests
libs/ui             Design-system components (each has a Storybook story)
libs/lesson-engine  Renders lessons from data (scene-type registry)
libs/data-access    Course and lesson SignalStores, saved progress, settings store (GraphQL later)
libs/visuals        Lesson pictures: jar, screen, Dot, machine, fork, list, card, page
libs/shared         Concepts, lesson types, content validator
content/            Lessons as YAML (see content/README.md)
tools/content       Content build: validate YAML, compile to typed modules
styles/             Design tokens and global SCSS layers
docs/mockups        The visual source of truth
docs/adr            Architecture decision records
```

## Run it

Requires Node 24 (see `.nvmrc`).

```bash
npm ci
npm start                      # http://localhost:4200
npx nx storybook ui            # http://localhost:4400
npx nx run-many -t lint test build
npx nx e2e web-e2e             # Cypress smoke + axe (starts the app for you)
```

The full command list is in [CLAUDE.md](CLAUDE.md#commands).

## Privacy by design

The learners are children, so the rules are strict ([ADR 0001](docs/adr/0001-anonymous-first-local-first-progress.md)):

- No account and no login. Progress stays in the browser, under a random resume code such as `blue-fox-42` that says nothing about the child ([ADR 0008](docs/adr/0008-local-progress-and-settings.md)).
- No personal data, no analytics, no tracking, no third-party scripts or CDN assets.
- The certificate name is typed and rendered on the device, never sent anywhere and never stored, not even in the browser ([ADR 0010](docs/adr/0010-certificate.md)).
- Ask Dot keeps the chat in memory only and catches names, emails and addresses before anything is sent. Demo mode makes no request at all; the real AI will only be reached through a server-side proxy ([ADR 0011](docs/adr/0011-ask-dot-demo-mode.md)).

## Accessibility and performance

Built to WCAG 2.2 AA. Every interaction works with the keyboard, color is never the only signal (each concept has a shape and a word), every animation has a calm alternative, touch targets are 44px or more, and the layout works from 320px wide and at 200% text size.

| Check                                                                                  | Result                                                                                                                                                           |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cypress-axe (WCAG 2.x A/AA), phone / tablet / desktop, Tip and Library open and closed | 0 violations                                                                                                                                                     |
| cypress-axe on every scene of every lesson, keyboard only, phone and desktop           | 0 violations                                                                                                                                                     |
| cypress-axe in the dark and high-contrast themes (lessons, Home, certificate, Ask Dot) | 0 violations                                                                                                                                                     |
| cypress-axe on Home, the certificate and Ask Dot, phone / tablet / desktop             | 0 violations                                                                                                                                                     |
| Blocked or broken browser storage (e2e)                                                | The app still works; progress lasts for the visit                                                                                                                |
| The certificate name and chat questions in network requests or storage (e2e)           | Never found                                                                                                                                                      |
| prefers-reduced-motion (emulated in the browser), or the Calm motion setting           | No animations run; final states shown at once                                                                                                                    |
| Storybook a11y addon                                                                   | Runs on every story (`test: 'error'`)                                                                                                                            |
| Lighthouse accessibility, best practices, SEO (mobile)                                 | 100 / 100 / 100 on Home, a lesson, the certificate and Ask Dot                                                                                                   |
| Lighthouse performance (mobile, CI)                                                    | 85 to 99 per run of the job (see below): usually 98 or 99, lower when the simulation counts the file chain; CLS 0.051 or less, Total Blocking Time 101 to 138 ms |
| Initial JS + CSS (production build)                                                    | 329 kB raw, 90 kB gzipped (every page and each lesson are lazy); the build fails at 400 kB                                                                       |

**About the Lighthouse numbers.** Lighthouse 13.6, mobile preset (simulated slow 4G and 4x CPU slowdown), production build, **median of 5 runs on a clean GitHub runner**. The CI job "Lighthouse" re-measures every pull request and writes the table to its summary; `npm run lighthouse` does the same locally (`tools/lighthouse/measure.mjs`). Three things to know:

- **An earlier version of this table was wrong.** It said 73 to 78, measured on a busy laptop (Lighthouse's CPU benchmark 445 to 644, where the 4x slowdown assumes a fast idle machine), which overstated blocking time several times over. The script now prints every run's benchmark and refuses to vouch for a run under 1,000.
- **Scores swing between about 99 and 85 to 91, from the simulation, not the app.** Each page loads a short chain of files (the app, the page, the fonts; a lesson adds the lesson itself). On localhost they all arrive before the first paint, so in some runs Lighthouse's simulation assumes the paint waited for the whole chain and replays it on slow 4G (0.6 s becomes 2.4 to 3.2 s). It happens to every page, and most often to a lesson, whose chain is longest. Across four CI runs: Home 89 to 99, a lesson 85 to 99, the certificate 88 to 99, Ask Dot 91 to 99. With real, applied throttling a lesson paints no later than Home.
- **The real limit is that this is a client-rendered app.** The HTML is an empty shell, so on a truly slow connection nothing appears until the JavaScript (90 kB gzipped) has arrived and run: applied slow-4G throttling on a busy laptop put first paint at 8 to 10 s on every page. Prerendering the pages at build time is the lever for that, and a decision still to make.

Fonts no longer move the page when they load: metric-matched fallbacks (Arial, Liberation Sans or Arimo resized to the real fonts' measurements) took layout shift from 0.233 to 0 on Home and from 0.122 to 0.051 on a lesson.

## How I built this with Claude Code

The whole app was built in four days (2026-11-02 to 11-05) with Claude Code doing the implementation and me making the product and design calls. The raw notes, entry by entry, are in [docs/build-log.md](docs/build-log.md). What made it work:

**A rulebook, not prompts.** [CLAUDE.md](CLAUDE.md) holds the stack, the Angular conventions, the accessibility checklist, the kids' privacy rules and every command. Claude Code reads it at the start of each session and adds to it when something new is learned, so a lesson learned once (for example "never wrap an SVG `<text>` across lines") stays learned.

**Plan first, then build.** Every feature started in plan mode: Claude Code read the code and the mockups and wrote a plan; I approved it or changed it before any file was touched. Questions that were really mine to answer came as explicit choices, and I made them: a new "intro" concept for the first lesson, a certificate earned only at 10 of 10 while lessons stay unlocked, crimson and a window shape for "page magic", and a demo-mode chat before any real AI. Each one is an ADR in [docs/adr](docs/adr) (11 so far).

**The mockups are the source of truth.** Every visual was checked against [docs/mockups](docs/mockups) from screenshots at 320, 390, 820 and 1440 px and in the dark and high-contrast themes, taken by a throwaway Cypress spec and deleted before the commit.

**Small, reviewable steps.** One feature per branch, Conventional Commits split by area, 13 pull requests, each green in CI (lint, about 285 unit tests, the build, Storybook, and the Cypress suite with axe at three screen sizes) before merging.

**Tools caught what eyes missed.** A few examples from the log:

- Every component animation was silently dead: the motion mixin selected `:root`, which Angular's style encapsulation never matches. The reduced-motion e2e test found it.
- With browser storage blocked, just reading `window.localStorage` throws, and the app crashed on start. Found by an e2e test written for exactly that case.
- The whole UI library shipped in the initial bundle. Marking the libraries side-effect free cut it from 374 to 324 kB. Later, the chat's answers leaked into it the same way; checking the initial total after each feature caught it.
- Prettier wrapped SVG text across lines, and the line breaks turned into spaces (`" Tom "`). Unit tests now check exact text.
- The content validator rejects any lesson sentence over 12 words, so the text stays readable for young children.

**And judgment caught what tools missed.** Some things only showed up by looking: the first "yes or no" fork was nearly invisible in the dark theme, and the chat's question box shrank to a few letters at 320 px. Some things needed measuring before fixing: a "slow" certificate download was 0.3 s once timed alone, a chat that "didn't scroll" was a screenshot taken mid-scroll, and the first Lighthouse numbers published here measured a busy laptop rather than the app (now corrected, and measured in CI). And some mistakes were Claude Code's and were owned in the open, like a test-download image committed by accident in one pull request and removed in the next. The Lighthouse section above follows the same rule: the numbers are reported as measured, including the one that misses its target and the earlier table that was wrong.

## License

- **Code:** [MIT](LICENSE).
- **Content and artwork** (lesson text, Dot and other illustrations, mockups): [CC BY-NC 4.0](LICENSE-CONTENT.md).
- **Fonts:** SIL Open Font License 1.1 (Baloo 2, Nunito).

See [ADR 0006](docs/adr/0006-licensing.md) for what falls under which license.
