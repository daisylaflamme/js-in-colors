# 0002. State management: signals, SignalStore, classic NgRx

- Status: Accepted
- Date: 2026-11-02

## Context

Angular now has signals as its core reactive primitive and runs without zone.js. NgRx offers two tools: `@ngrx/signals` (SignalStore), which is light and signal-native, and the classic Store with actions, reducers and effects, which is heavier but gives a global event log, DevTools time travel, and a clear place for side effects that span features.

Putting everything in one global store makes simple UI code ceremonious. Putting nothing in a store scatters shared state across services. We want a rule that is easy to apply.

## Decision

Pick the smallest tool that fits the **scope** of the state:

| Scope                                                    | Examples                                                                           | Tool                                                                                                          |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Local UI state (one component or one screen)             | menu open, Tip open, picked choice, "Peek at the code"                             | `signal` / `computed` in the component, or a small `@Injectable` of signals for one shell (e.g. `ShellState`) |
| Feature state (one domain, shared by a few components)   | lessons, scene progress, lesson completion                                         | `@ngrx/signals` SignalStore in `libs/data-access`                                                             |
| Cross-cutting state (the whole app, many features react) | global settings (theme, calm motion, text size, read-aloud), session (resume code) | Classic NgRx Store + Effects                                                                                  |

Rules that go with it:

- RxJS is only for real streams (media queries, chat token streaming, debounce, retry/backoff, autosave). Convert at the edges with `toSignal` / `toObservable`.
- `libs/ui` components are presentational: inputs and outputs only, no services and no stores.
- Persistence (IndexedDB/localStorage) lives in `libs/data-access`, behind the stores, never in components.

## Consequences

- The walking skeleton needs no store yet: everything it has is local UI state. NgRx is added with the first feature that needs it (lesson progress), not before.
- Contributors must decide which scope a piece of state has. When unsure, start local and promote it when a second consumer appears.
- Two NgRx styles live side by side. That is deliberate: SignalStore for most features, classic Store only where a global event log and effects pay for themselves.
