# 0008. Local progress, the resume code, and global settings

- Status: Accepted
- Date: 2026-11-03
- Amends: [0001](0001-anonymous-first-local-first-progress.md) (storage), [0002](0002-state-management.md) (where the resume code lives)

## Context

Home (mockup 08) shows what a child has finished, a **Continue** button, a resume code, and the **Calm motion** and **Text size** settings. All of it must survive a reload, with no account and no server ([ADR 0001](0001-anonymous-first-local-first-progress.md), [ADR 0003](0003-minimal-backend.md)). Children's browsers are often locked down: storage can be blocked, full, or hold data from an older version of the app.

## Decision

**Progress** (`CourseStore` + `withProgress()`, an `@ngrx/signals` feature in `libs/data-access`):

- Saved under `jic.progress` as `{ v: 1, resumeCode, finishedIds, lastLessonId }`. Nothing else, and nothing about the child.
- **localStorage, not IndexedDB** (ADR 0001 named both). The data is a few hundred bytes, and reading it synchronously means the first frame already shows the right path and the right Continue button.
- Loaded once on start. `parseProgress()` trusts nothing: a wrong shape, an unknown version or a malformed code means a fresh start, and lesson ids no longer in the course are dropped. Saved after every change (`watchState`).
- **Continue** goes to the last lesson opened if it isn't finished. Otherwise it picks the next unfinished ready lesson after it, then wraps to the start. With every ready lesson finished, it becomes "Visit again".

**Resume code:** `adjective-animal-NN` (for example `blue-fox-42`), made from two short, hand-checked word lists and 10-99 with `crypto.getRandomValues` (about 92 000 codes).

- It's generated on the first visit, never chosen, and shown on Home and in the menu with a Copy button.
- **It restores nothing yet.** There is no "enter a code" box until the sync milestone, so the UI never promises something that doesn't work.
- It lives with progress (the SignalStore), not in a "session" slice of the classic Store as ADR 0002's table suggested. It is the key to the progress, and the two are saved together.

**Settings** (classic NgRx Store + Effects, as ADR 0002 says for cross-cutting state):

- `settingsFeature` (`createFeature`) holds `{ calmMotion, textSize: normal | large | larger }`.
- Functional effects:
  - Load `jic.settings` on `ROOT_EFFECTS_INIT`.
  - Save each change.
  - Apply the settings as `data-motion="calm"` and `data-text-size` on `<html>`.
- Styles do the rest: `styles/settings/_motion.scss` and `_text-size.scss`. The text sizes are 100, 112.5 and 125% of the browser's own size.
- Calm motion only adds calm. A device that asks for reduced motion always gets it, whatever the toggle says. Looping animations also pause (`--motion-loop`).

**Storage failures** never break the app: every read and write is wrapped, including reading the `localStorage` property itself (blocked cookies make it throw). Without storage, progress and settings last for the visit.

## Consequences

- Clearing site data clears progress and settings, and the next visit gets a new code. The menu says "Your progress saves on this device".
- Changing the saved shape means bumping `PROGRESS_VERSION`. Old data is then ignored, not migrated, which is acceptable for a handful of lessons. Add a migration if progress grows.
- Classic NgRx costs about 27 kB raw / 7 kB gzipped in the initial bundle. Settings must apply before first paint, so it can't be lazy. The same task marked the libs `sideEffects: false`, which more than paid for it (initial 374 → 324 kB).
- The sync milestone needs a new ADR: server storage keyed by the code, a way to enter a code, and rate limits.
