# 0014. Prerender every page at build time

- Status: Accepted
- Date: 2026-11-06

## Context

The app sent an empty `<jic-root>`. A child saw nothing until the JavaScript had downloaded and run. On a slow phone or connection that's the longest wait in the app, and it's also why Lighthouse's first paint swung from run to run: the paint waited for a chain of files (the app, then the page, then the lesson).

Every page's content is known at build time. Lessons are data from `content/` (ADR 0007), and the other pages are fixed text. The only per-child state is progress and settings, which stay on the device (ADR 0001, 0008).

## Decision

- **Static prerendering** with `@angular/ssr`: `outputMode: "static"` and `prerender: true` on the `web` build.
  - The build writes HTML for Home, every course lesson (`getPrerenderParams` lists them from the course, so a new lesson needs no change), the certificate, Ask Dot and Not found.
  - There's **no server at runtime**, so ADR 0003 stands and the output works on any static host.
- **Hydration** (`provideClientHydration(withEventReplay())`): Angular reuses the HTML instead of drawing the page again. A tap made before start-up is replayed.
- **No child data at build time.** The HTML holds lesson content only. Whatever depends on the device is settled in the browser:
  - **Layout.** The build has no screen, so it draws the desktop layout with the menu open (`ShellState.prerendering`). Until the app starts, `app.scss` (`[data-prerendered]`) hides that menu below `lg`, or when this device saved it closed. At start-up the browser picks the real layout.
  - **Settings.** A few lines of inline script in `index.html` read `jic.settings` and `jic.menuOpen` before the first paint, and set `data-text-size`, `data-motion` and `data-menu` on `<html>`. So a child with large text never sees the text jump. It only reads local storage and sends nothing; after start-up the settings store owns these attributes. `boot-script.spec.ts` keeps its keys and values in step with the store.
  - **Progress.** Home draws the no-progress version and updates in place: the button text and the path ticks change, not the layout. The certificate draws only its header until the browser has read progress, so a child who earned it never sees "not yet".
  - **Resume code.** The store makes no code while prerendering. Otherwise one random code would be baked into the HTML and shown to every visitor until start-up. The pill gives the code one width (17 characters, the longest a code can be), so the empty pill in the HTML takes the same space and Home's header doesn't rewrap when the code arrives.
  - **Measurements.** The concept chip row assumes it scrolls (a tab stop, as on a phone) until it has measured itself in the browser. The build can't measure, and hydration must not drop the tab stop before the first measurement, so there's never a moment when keyboard users can't reach a scrolling row.
- **The lesson is in hand before the page starts.** A route resolver (`lessonPreloadResolver`) loads the lesson file into `LessonPreloader`, and `LessonStore.load` takes it from there synchronously. Without this, the browser's first render had no lesson yet: hydration dropped the prerendered stage and drew it again when the file arrived. The stage blinked, and keyboard focus inside it was lost.
- **Taps during start-up are kept.** Event replay can deliver a tap before a page's first change detection. So "on a new lesson, close Tip and Library" runs only when the lesson id changes, not on the first run, which would close a Tip the child just opened.
- **Unknown addresses:** the `static` target copies the prerendered Not found page to `404.html`. Static hosts serve it for any missing file, and the app's `**` route draws Not found too, so hydration matches. `serve-static` now runs with `spa: false`, because serving Home's HTML for every address would hydrate the wrong page.

## Consequences

- The words and pictures of every page show before any JavaScript runs. Every page also has its real `<title>` in the HTML.
- **Measured** (CI Lighthouse, mobile, median of 5, before → after): Home 89 → 99 (largest paint 2.92 → 0.95 s), Ask Dot 91 → 100 (2.74 → 0.79 s), a lesson 99 → 99, CLS 0.039 or less. The five runs now agree, because the first paint no longer waits for the file chain.
- **The certificate drops 94 → 86**, on purpose. Its header paints at 0.8 s, but the certificate itself waits for progress (4.1 s in the simulation), because drawing "0 of 10" for a child who has earned it would be wrong. From Home's button, where the app is already running, the wait is one frame.
- **The initial JavaScript grows by about 36 kB raw (11 kB transferred), the hydration runtime.**
  - That takes it to 366 kB, over the 340 kB warning budget (the error budget, 400 kB, still holds).
  - The warning is raised to 380 kB on purpose, with this ADR as the reason. Without hydration, the prerendered HTML would be thrown away and drawn again, which is worse.
- Code must be **server-safe**:
  - reach browser APIs through `DOCUMENT` / `defaultView` with guards, or after render;
  - never use window state to choose what the first render shows, unless the HTML handles both cases, as the menu does.
  - A throw during prerendering fails `nx build web`, so CI catches it.
- `prerender.cy.ts` checks, against the production build:
  - the HTML of each page before JavaScript;
  - that hydration reuses the page (for a lesson, the stage itself) with no `NG05xx` errors;
  - the 404 page;
  - the boot script;
  - the menu at phone and desktop sizes.
- http-server (`serve-static`) redirects `/lesson/variables` to `/lesson/variables/`. Angular ignores the trailing slash, and the Lighthouse script asks for the folder URLs directly. A real host may do this differently, which is part of the hosting decision.
- Dev (`nx serve web`) renders on the server too, so hydration problems show up while working, not only in CI.
