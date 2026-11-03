# 0001. Anonymous-first, local-first progress

- Status: Accepted (storage choice refined by [0008](0008-local-progress-and-settings.md))
- Date: 2026-11-02

## Context

The learners are young children, roughly 6 to 12 years old. Collecting personal data from children brings legal duties (for example COPPA in the US and GDPR-K in the EU) and, more importantly, risk to the children themselves. A login screen is also a barrier: a six-year-old should be able to open the app and start learning.

Kids still want their progress to be remembered, and a parent or teacher may want to move it to another device.

## Decision

- **No account is needed to learn.** There is no sign-up and no login in version 1.
- **Progress lives in the browser** (IndexedDB, with localStorage for small UI preferences such as "menu open"). Every storage access is wrapped so the app still works when storage is blocked (private mode, strict settings).
- **No personal data is collected**: no names, emails, ages, or precise location. The certificate name is typed in the browser and rendered on the device; it is never sent to or stored on a server.
- **No analytics, tracking scripts, third-party embeds, or CDN assets.** Fonts are self-hosted (bundled from `@fontsource`).
- **Later milestone (optional):** server sync under a random resume code such as `blue-fox-42`. The code is generated, not chosen, and is the only key. It maps to progress data only, never to a person.
- **Chat (later):** conversations are kept in memory only and are never persisted or logged (see CLAUDE.md, hard rules 4 and 5).

## Consequences

- Clearing browser data clears progress. The UI says so plainly ("Your progress saves on this device").
- No cross-device progress until the resume-code milestone, and even then only by code.
- Product analytics cannot guide decisions. We rely on usability testing, Lighthouse and accessibility audits instead.
- The backend stays tiny (see [0003](0003-minimal-backend.md)), which also keeps the attack surface small.
- Every new feature is reviewed against these rules. Anything that would send data off the device needs a new ADR.
