# JavaScript in Colors

A web app that introduces young children (roughly ages 6-12) to JavaScript **conceptually**, through color, animation, short reading, and tiny interactions. Almost no coding. Each JavaScript concept has its own color, shape, and character.

This is a public **front-end portfolio project**. Its job is to show modern Angular, a real design system, accessibility, animation, testing, and effective use of Claude Code. Frontend quality, tests, docs, and decision records matter as much as features. The backend is deliberately minimal.

## Stack

Angular (standalone, signals, zoneless where supported) · NgRx (`@ngrx/signals` SignalStore for feature state; classic Store + Effects for cross-cutting state) · RxJS · Storybook · Cypress (E2E and component tests) · SCSS with CSS custom-property design tokens · Nx monorepo · TypeScript everywhere.

Backend (kept small, version 1): `apps/api`, one tiny Hono server for the Ask Dot chat proxy (plain HTTP streaming, ADR 0012). No GraphQL, Apollo or MSW in version 1, and no D3 (ADR 0015): lessons are compiled YAML, visuals are hand-built SVG components. **No database, no Python, no real auth in version 1.** Postgres and a real API are optional later milestones. See `docs/adr/0003-minimal-backend.md`.

## Repo layout

```
apps/web            Angular app
apps/api            Ask Dot chat proxy (Hono, Node 24 runs the TypeScript directly; demo by default, Groq optional)
apps/web-e2e        Cypress E2E
libs/ui             Design system components (every one documented in Storybook)
libs/lesson-engine  Renders lessons from data (scene types: watch, interact, quiz)
libs/data-access    SignalStores, lesson source, local persistence, Ask Dot chat services
libs/visuals        SVG concept visuals (Angular components, no D3)
libs/shared         Lesson types, content validator, chat contract and safety, shared utilities
content/lessons     Lesson files (YAML), original text only
docs/adr            Architecture decision records
docs/mockups        Official mockups (PNG), UI spec, and design-tokens.css
```

## Angular conventions

- Standalone components only. No NgModules.
- Signals first: `signal`, `computed`, `effect`, signal inputs/outputs, `model()`, `inject()`.
- New control flow (`@if`, `@for`, `@switch`) and `@defer` for heavy visuals. `ChangeDetectionStrategy.OnPush`. Zoneless if the installed Angular version supports it.
- Lazy-loaded routes. Functional guards, resolvers, and interceptors.
- TypeScript `strict`. No `any`; use `unknown` and narrow.
- RxJS only for real streams (chat token streaming, debounce, retry/backoff such as a "waking up" retry, autosave). Convert at the edges with `toSignal` / `toObservable`. Always unsubscribe via `takeUntilDestroyed` or the async boundary.
- State rule: local UI state in signals; feature state (lessons, progress) in a SignalStore; classic NgRx Store + Effects only for cross-cutting state (global settings, session). Do not put everything in a store.
- Smart/dumb split: `libs/ui` components are presentational (inputs/outputs only, no services). Feature components own data.

## Mockups (visual source of truth)

- `docs/mockups/` holds the official screens (PNG), `README.md` (layout, states, interactions) and `design-tokens.css`. Read the README and look at the images before building or changing any UI. Match them; if something must differ, say why and update the docs.
- The main screen is the lesson screen: light left menu collapsible by a hamburger (top-left of the main column), right-edge Tip / Library / Read to me tabs, a stage, one row of choices with "Peek at the code", and Back / scene dots / Next.
- Phone and tablet versions of the lesson screen are in the mockups too. Build mobile-first.
- Seed `styles/settings` from `docs/mockups/design-tokens.css`; do not invent new colors.

## Responsive, mobile-first

- Write base styles for the smallest screen (360px wide), then add `min-width` media queries or container queries for larger screens. No `max-width` overrides.
- Breakpoint tokens (one place, `styles/settings`): sm 600px, md 900px, lg 1200px. Values are in `docs/mockups/design-tokens.css`.
- Lesson screen by size (see `docs/mockups/README.md` and the phone and tablet PNGs):
  - Phone (base): menu is an overlay opened by the hamburger. Tip, Library and Read to me are a bottom tab bar. Library opens as a bottom sheet, Tip as a card above the bar. Dot sits above the jar. Back and Next are pinned above the tab bar. Concept chips scroll sideways.
  - Tablet (md): menu closed by default, opened by the hamburger. Tabs on the right edge. Stage stacks Dot above the jar.
  - Desktop (lg): menu open by default. Tabs on the right edge. Dot beside the jar.
- Use fluid units (`rem`, `%`, `clamp()`). No fixed pixel widths on containers.
- Touch first: 44px minimum targets, no hover-only interactions, no horizontal page scroll at 320px, works at 200% text size, portrait and landscape, and respects safe areas (`env(safe-area-inset-*)`).
- Test: the Cypress smoke test runs at phone (390x844), tablet (820x1180) and desktop (1440x900) viewports. Storybook has viewport presets for all three.

## Styling and design system

- Design tokens live in `styles/settings` as CSS custom properties (colors, spacing, type, radii, elevation, motion). Never hard-code colors or spacing in components.
- Each JS concept has a color token (`--color-number`, `--color-string`, `--color-boolean`, `--color-object`, `--color-array`, `--color-function`, `--color-html`). Color is **never** the only signal: always pair it with an icon or shape (colorblind-safe).
- Support light, dark, and high-contrast themes through token overrides, not per-component CSS.
- SCSS in ITCSS-lite layers: settings, tools, generic, elements, utilities. Components own their styles via Angular encapsulation. BEM only for shared UI.
- Self-host fonts (a friendly rounded display face plus a readable body face). No CDN fonts.

## Accessibility checklist (required for every UI feature)

- Keyboard: every interaction works with keyboard alone; visible focus ring; logical tab order.
- Modals and drawers (Tip, Library): focus trap, `Esc` to close, focus returns to the trigger, correct ARIA roles and labels.
- Screen readers: meaningful names, live regions for lesson feedback, no information conveyed by color or motion alone.
- `prefers-reduced-motion`: every animation has a calm or static alternative.
- Touch targets at least 44px. Text contrast WCAG AA or better. Support text scaling to 200%.
- Read-aloud support for Tip and Library text (Web Speech API, optional per user).
- Every feature gets an automated a11y check (Storybook a11y addon and/or `cypress-axe`).

## Performance checklist

- Set Angular bundle budgets and fail the build when they are exceeded.
- Every page is prerendered (ADR 0014): content shows before JavaScript runs.
- Lazy-load routes, and give each lesson its own chunk. Use `@defer` for anything heavy that is not needed for the first paint.
- Use `NgOptimizedImage`, SVG for artwork, and avoid layout shift. Target Lighthouse performance and accessibility scores of 95+ and record results in the README.

## Kids' privacy and safety (hard rules)

1. **Anonymous-first.** No login is required to learn. Progress is stored locally (IndexedDB/localStorage). Optional server sync under a random resume code (for example `blue-fox-42`) is a later milestone. See `docs/adr/0001-anonymous-first-local-first-progress.md`.
2. Collect **no personal data**: no names, emails, or precise location. The certificate name is typed in the browser and rendered client-side. It is **never** sent to or stored on a server.
3. No analytics or tracking scripts. No third-party embeds or CDN assets.
4. **Chat content is never persisted or logged.** Keep conversations in memory only.
5. The AI chat is only reached through a server-side proxy, never from the browser, and keys are never exposed to the client. In demo mode the chat returns canned, kid-safe answers. The client talks to a `ChatService` interface so providers can be swapped. The system prompt enforces short, simple, JavaScript-only, kid-friendly answers with gentle redirects. Rate limit and cap spending.
6. Secrets only in environment variables. Maintain `.env.example`. Never commit real keys.

## Content rules

- Lessons are data (YAML) rendered by `lesson-engine`; adding a lesson should not require new code unless it needs a new visual.
- Use the W3Schools JS tutorial **topic order** as a curriculum skeleton only. Write all text originally, in very short, simple sentences for young children. Do not copy their wording.
- Characters and artwork must be original or properly licensed. Do not imitate existing copyrighted characters.
- Each lesson has 4-6 short scenes, a one-sentence Tip, and a longer Library entry (with read-aloud support).
- Scope: a polished 8 to 10 lessons beats an unfinished 40.

## Workflow

- Use plan mode for anything larger than a small fix: propose the plan, then wait for approval.
- Small, focused commits using Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`). One feature per branch.
- Every new `libs/ui` component gets a Storybook story (with controls and an a11y check). Every user-facing feature gets a Cypress test. Logic gets unit tests.
- Before finishing a task, run lint, unit tests, and a build, and report the results.
- Record significant decisions as short ADRs in `docs/adr/`.
- Keep this file current: when you add a command or convention, update it.
- Review and ship: the `code-reviewer` subagent (`.claude/agents/code-reviewer.md`) reviews a branch against these rules, read-only. `/commit-push-pr [base] [notes]` (`.claude/skills/commit-push-pr/`) runs the reviewer and the checks, commits, pushes, and opens a PR against the stacked base branch. It stops on blocking findings or failed checks.

## Commands

Node 24 (`.nvmrc`). Versions are pinned exactly in `package.json` (Nx 24.0.3, Angular 22.2, Storybook 10.6.5, Cypress 15.21.1: cypress-axe does not support Cypress 16 yet).

```bash
# Setup and run
npm ci                                  # install (exact versions from package-lock.json)
npm start                               # serve web: http://localhost:4200 (same as: npx nx serve web)
npx nx run web:serve-static             # serve the prerendered production build (+ 404.html) on :4200

# Before finishing any task
npx nx run-many -t lint test build      # lint + unit tests + build, all projects
npm run format:check                    # Prettier check (npm run format writes)
npx nx affected -t lint test build      # only what changed vs main

# Lesson content (content/, see content/README.md and ADR 0007)
npx nx run content:validate             # check every lesson; errors print as file:line:col, exit 1
npx nx run content:build                # validate + write libs/data-access/src/generated (gitignored; serve/build/test run it for you)

# Unit tests (Vitest)
npx nx test <project>                   # web, ui, shared, lesson-engine, data-access, visuals (shared also validates content/)
npx nx test ui --watch                  # watch mode while working on components

# Lint and build
npx nx lint <project>
npx nx build web                        # production build, every page prerendered (ADR 0014); budgets: initial warn 380 kB / error 400 kB
npx nx run web:static                   # the deployable static site: the build plus 404.html (the Not found page)
npx nx build web --configuration=github-pages   # the same for GitHub Pages (base /js-in-colors/); .github/workflows/pages.yml deploys it after CI passes on main (ADR 0016)

# End-to-end (Cypress + cypress-axe; starts the app itself)
npx nx e2e web-e2e                      # smoke (3 sizes, 3 themes) + Home/progress/settings + every ready lesson with the keyboard and axe per scene + the deep Variables walkthrough + reduced motion
npx nx e2e web-e2e --spec src/e2e/lesson-variables.cy.ts   # one spec
npx nx e2e web-e2e --configuration=production   # against the prerendered production build (what CI runs; also runs prerender.cy.ts)

# Storybook (libs/ui)
npx nx storybook ui                     # http://localhost:4400 (ui + visuals + lesson-engine stories; Theme toolbar)
npx nx build-storybook ui               # static build in dist/storybook/ui (never runs in parallel: shares .angular/cache)

# Performance (Lighthouse 13.6, mobile, median of runs; CI job "Lighthouse" uses 5 and is the number to quote)
npm run dot-art                         # after changing docs/dot-art/*.svg: check the art, regenerate dot-art.ts
npx nx run web:serve-static --port=4300 # then, in another terminal:
npm run lighthouse                      # 3 runs per page; prints every CPU benchmark and fails if one is under 1000 (busy machine)

# Workspace
npx nx graph                            # project graph and module boundaries
npx nx show project <project>           # every target a project has
```

# Ask Dot API (apps/api, ADR 0012). Settings: copy apps/api/.env.example to apps/api/.env (git-ignored)
npm run api                             # http://localhost:3333 (demo answers unless CHAT_PROVIDER=groq and GROQ_API_KEY are set)
npm run chat:eval                       # tricky kid questions against the real provider (needs the key; not in CI)
npm run start:live                      # the web app in live mode: Ask Dot asks /api/chat (proxied to :3333)
CYPRESS_chatMode=live npx nx e2e web-e2e --configuration=live --spec src/e2e/ask-dot-live.cy.ts   # live-mode e2e (server faked)
# (with CI=true, nx e2e always starts the CI web server, the demo build: CI starts web:serve:live itself, see ci.yml)

### Prerendering (ADR 0014)

- Every page is prerendered at build time (`outputMode: "static"`, `app.routes.server.ts`), then hydrated in the browser. No server at runtime. A new lesson in `content/` is prerendered with no change; a new route is covered by the `**` entry.
- Code must be server-safe: browser APIs only through `DOCUMENT` / `defaultView` with guards, or after render. A throw while prerendering fails `nx build web`.
- The HTML holds no child's data. What depends on the device is settled in the browser: `ShellState.prerendering` draws the desktop layout and `app.scss` (`[data-prerendered]`) hides its menu below lg; the certificate waits for progress (`progressRead`); Home updates in place.
- Nothing random or device-specific in the first render on the server (the resume code is made in the browser only), and no layout guesses that hide content from keyboard users (the chip row assumes it scrolls).
- A page's first render in the browser must match the HTML: load what it needs before the route activates (a resolver, like `lessonPreloadResolver` + `LessonPreloader`), not in an effect after, or hydration throws the prerendered part away and draws it again.
- Event replay can deliver a tap before a page's first change detection: an effect that resets UI state "on change" must skip its first run (see `LessonPage`'s lesson-id effect).
- The inline script in `apps/web/src/index.html` is the one exception to "settings only through the effects": it applies saved text size, Calm motion and a closed menu before the first paint. Keep it tiny; `boot-script.spec.ts` (data-access) keeps its keys in step.
- E2E: `prerender.cy.ts` checks each page's HTML before JavaScript and that hydration reuses its `keep` element (a lesson's stage) with no `NG05xx` errors. A new full page belongs in its list. It runs only against the prerendered build (`prerendered` in `cypress.config.ts`; by hand: `--env prerendered=true`).

### Public site (ADR 0016)

- GitHub Pages at https://daisylaflamme.github.io/js-in-colors/, deployed by `pages.yml` only after CI passes on main. Ask Dot is demo there.
- The site lives under `/js-in-colors/`: always link with `routerLink` (never a hard-coded `href="/..."`), and reference assets relative to the base.

### Ask Dot server (ADR 0012)

- `apps/api` (tag `type:server`) may import `@jic/shared` only. It runs as TypeScript on Node 24 (type stripping, `tools/content/ts-resolve.mjs` for aliases), so use erasable syntax only (`erasableSyntaxOnly` in its tsconfig): no enums, no parameter properties, `import type` for types. `build` is a type check.
- Every answer goes through `pipeline.ts`: input guards (personal details get the private reply, a child who sounds hurt or sad gets the caring reply; neither reaches a provider), provider, word-by-word output check, length cap, fallback to canned, lesson link. A new provider is one `ChatProvider` adapter and must pass the same tests (`pipeline.spec.ts`, with the tricky questions).
- A canned fallback must never pass as the AI answering: the pipeline reports it (`onFallback`, a content-free reason), the server logs it and the live eval fails it. The server warns at start-up if `GROQ_MODEL` is not available to the key (ADR 0013).
- Never log a question, an answer or a provider error message (it can echo the question). Log lines are method, path, status, time and provider; a test checks it.
- The web app is demo unless built with the `live` configuration (it swaps `apps/web/src/environments/chat-mode.ts`). The page provides `provideChat(CHAT_MODE)`; `LiveChatService` falls back to the demo answers and sets `resting` when the server is busy or down. Only the lazy chat page reads the mode.
- Keys only in `apps/api/.env` or the host's environment. Never in code, tests, commits or chat.

Windows note: the Nx daemon can crash after a successful run (libuv `UV_HANDLE_CLOSING`, exit 127). If that happens, run with `NX_DAEMON=false`. CI (Linux) is not affected.

### Lessons and the engine (ADR 0007)

- Lessons are data: add or edit YAML in `content/`, then `npx nx run content:validate`. No code for a new lesson unless it needs a new visual or scene type.
- E2E coverage is automatic: `cypress.config.ts` reads the ready lessons from `content/` at startup, and `lessons.cy.ts` walks each one with the keyboard (axe per scene, the correct quiz answer). No spec change for a new lesson.
- Scene types: `watch`, `interact`, `quiz`. A new type = one component implementing `SceneComponent` (`libs/lesson-engine`) + a `provideSceneTypes()` entry + the type in `libs/shared/src/lib/lesson.ts` + a validator rule and test.
- Visuals: `jar`, `screen`, `dot`, `machine`, `fork`, `list`, `card`, `page` in `libs/visuals`; add the kind to the `Visual` type, the validator, `VisualComponent` and the interact merge in `interact-scene.ts` (how a picked choice changes the picture). Machine scenes give each choice a `result` (what comes out); screen scenes may give a choice `lines` (1 to 4, e.g. a loop's output; default is its `value`); fork scenes give each choice a `path` (`yes` or `no`); list scenes give each choice an `index` (point at a spot) and/or `items` (the list after a change); card scenes give each choice a `key` (read a detail) and/or `props` (the card after a change); page scenes give each choice a `target` (the part found: `h1`, `p` or `button`) and/or `parts` (the page after a change). The validator allows each only in its own scene kind, and keeps SVG labels short enough to fit (fork labels 12 characters, list items 6, list and card names 10, card keys 8, card values 6, page parts 12). In SVG visuals, draw anything that sits straight on the stage with `--color-text` (it follows the theme); `--color-ink` is only for text on a white shape. `--color-<concept>-text` pairs with `--color-bg` or the concept's tint, never with white: the dark theme turns it pale. Never wrap an SVG `<text>` across lines (Prettier will if the line is long): the line breaks become spaces in its text.
- Smart/dumb: `LessonPage` (apps/web) owns the stores; scene components only get `scene` + `state` and emit `action`.
- Dot (`DotCharacterComponent`, `pose`: happy, thinking, cheering, curious) is drawn from `libs/visuals/src/lib/dot/dot-art.ts`, generated from `docs/dot-art/*.svg` by `npm run dot-art` (it checks the art against the brief; CI checks the generated file is current). Never edit `dot-art.ts` by hand. The outer outline is `--dot-outline` (pale on dark).
- Concepts: the eight JS concepts plus `intro` (accent + outlined star, course opener only). Each has its own color and shape; page magic (`html`) is crimson + window (ADR 0009).

### Home, progress and settings (ADR 0008)

- `/` is Home (the color path). Route data `{ shell: 'full' }` hides the lesson menu. The logo and "Your color path" link home (`homeLink` input on `AppLogo`, `LessonMenu`, `LessonHeader`).
- Progress: `CourseStore` + `withProgress()` (SignalStore): `markFinished` / `markOpened`, `continueLesson`, `pathLessons`. Saved after every change.
- Settings: classic NgRx (`settingsFeature`, `SettingsActions`, functional effects, `provideSettings()`). Components read with `store.selectSignal(...)` and dispatch; the effects own storage and the `<html>` attributes.
- localStorage keys: `jic.progress` (versioned by `PROGRESS_VERSION`), `jic.settings`, `jic.menuOpen`. Never touch storage in components: go through `PROGRESS_STORAGE` / `SETTINGS_STORAGE` (tests: `memoryProgressStorage()`), and get the object with `browserLocalStorage()`, because even reading `window.localStorage` can throw.
- The resume code is a local key only. There is no restore box until the sync milestone, which needs a new ADR.
- E2E: Cypress does not follow links on a simulated Enter, so Tab to the link and use `followFocusedLink()` (`support/keyboard.ts`). `checkPageA11y` waits for chip rows to settle first.

### Certificate (ADR 0010)

- `/certificate` (`apps/web/src/app/certificate/`): earned when every lesson is finished (`CourseStore.certificateEarned`); before that it shows progress and Continue. The star on the color path links here (`goalLink`), and Home's main button becomes "Get your certificate".
- The name is a signal on the page only: never stored (not even localStorage) and never sent. Tests check both.
- Download: `CertificateExport` draws `drawCertificate()` on a canvas and saves a PNG through an object URL. The PNG and the HTML sheet are two drawings of one design: change both. Concept shapes come from `SHAPE_PATHS` (`libs/shared`), shared with `ConceptShapeComponent`.
- Print: a print stylesheet on the page. Themes apply to `screen` only, so paper is always light.

### Ask Dot chat (ADR 0011)

- `/ask-dot?from=<lessonId>` (`apps/web/src/app/ask-dot/`); the Library's "Still curious? Ask Dot" links here, and "Back to the lesson" returns to `from`.
- Import chat code from `@jic/data-access/chat`, not the main barrel. Components talk to `ChatService` (`libs/data-access/src/lib/chat/`): `ask(question)` streams `{ text }` chunks, then an optional `{ link }`. Demo mode is `DemoChatService` (`provideDemoChat()`); the future proxy must stream the same chunks.
- `ChatStore` is provided by the page (leaving ends the chat). It runs the personal-info guard (`looksPersonal`) before any provider, and never touches storage or logs.
- A new demo answer: add it to `DEMO_ANSWERS` (keywords, text with 12 words or fewer per sentence, lesson link) and a matching case in `chat.spec.ts`.
- The message list is a `role="log"` with `aria-live="off"`; finished answers are announced once by the status region.

### Conventions added during the scaffold

- Design tokens: `styles/settings/_tokens.scss` is a 1:1 copy of `docs/mockups/design-tokens.css`; components use the semantic tokens in `styles/settings/_semantic.scss`. Themes override tokens in `_themes.scss` only.
- Component SCSS starts with `@use 'tools' as *;` for `mq-up()`, `focus-ring`, `visually-hidden-until()` and friends. Media queries are `mq-up()` only (min-width).
- Motion: wrap animations in `@include motion-ok` and use `var(--motion-*)` durations (Calm motion zeroes them). Looping (`infinite`) animations also set `animation-play-state: var(--motion-loop)`, which Calm and reduced motion set to `paused`. Never select on `:root`/`html` inside component styles: emulated encapsulation makes it never match.
- Breakpoints: phone is the base, tablet layout starts at `sm` (600px; the 820px tablet mockup falls here), desktop at `lg` (1200px, menu inline and open by default).
- Text on fills (ADR 0005): on the orange (object) and teal (variable) fills, text must be large and bold only (at least 1.5rem, weight 700+), using `--color-<concept>-on`. Anything smaller uses `--color-<concept>-text` on `--color-<concept>-tint`. Never white on orange or yellow.
- Themes (ADR 0005): light/dark/high contrast are token overrides in `styles/settings/_themes.scss`. Any element may carry `data-theme`. New UI must pass axe in all three themes (the smoke spec checks them).
- Fonts (ADR 0004): Baloo 2 for display, Nunito for body, bundled from `@fontsource`; add weights in `styles/fonts.scss` only. Each family has a metric-matched fallback (`'Baloo 2 Fallback'`, `'Nunito Fallback'`: Arial, Liberation Sans or Arimo resized with `size-adjust` and ascent/descent overrides), so nothing shifts when the web font arrives. A new weight or font needs its fallback re-measured (see the comment in `styles/fonts.scss`).
- Lighthouse on a developer machine is only trustworthy when every run's CPU benchmark is 1000 or more; quote the CI job's numbers. Run local measurements in the background: a killed run leaves headless Chrome behind and skews the next one.
- Licenses (ADR 0006): code is MIT (`LICENSE`); lesson text, Dot and other artwork, and `docs/mockups/` are CC BY-NC 4.0 (`LICENSE-CONTENT.md`).
- Modals use native `<dialog>` with `ModalDialogDirective` (`libs/ui`): owner holds `open`, Esc/backdrop emit `dismissed`, focus returns to `returnFocusTo`. Mark the first control with `data-autofocus`.
- Presentational components can sit on native elements via attribute selectors (`button[jic-choice-button]`); always write `type="button"` at the usage site.
- Nx tags: `type:app | feature | ui | data-access | util | e2e`, enforced by `@nx/enforce-module-boundaries`.
- Code only a lazy route uses gets its own entry point (a path alias like `@jic/data-access/chat`), not the lib's main barrel: modules reached through a barrel that `main` imports end up in the initial bundle even with `"sideEffects": false`. Check the initial total after adding one.
- Every lib has a private `package.json` with `"sideEffects": false`, so code only lazy routes use stays out of the initial bundle (without it, the whole `@jic/ui` barrel shipped in `main`). A new lib needs one too, and its `vite.config.mts` names `tsconfig.spec.json` for analogjs.
- Stories are only typechecked by `npx nx build-storybook ui`: run it when you touch a story.
