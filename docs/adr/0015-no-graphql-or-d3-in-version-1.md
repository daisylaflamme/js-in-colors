# 0015. Version 1 without GraphQL or D3

- Status: Accepted
- Date: 2026-11-06
- Amends: [0003](0003-minimal-backend.md) (no GraphQL client or MSW in version 1)

## Context

The plan listed two pieces that were never needed:

- **GraphQL** (Apollo Angular, graphql-codegen, MSW mocks) was planned in ADR 0003 as the typed way to reach an API. The app never needed one:
  - lessons are YAML compiled into typed modules at build time (ADR 0007), one lazy chunk each, and prerendered (ADR 0014);
  - progress and settings stay on the device (ADR 0001, 0008);
  - Ask Dot's proxy streams plain HTTP (ADR 0012).
- **D3** was planned for the concept visuals. The eight visuals (jar, screen, Dot, machine, fork, list, card, page) turned out to be small, fixed SVG scenes. Angular templates with signals draw them directly: there are no scales, axes, layouts or data joins for D3 to help with.

Adding either now would mean code that solves no problem, plus bundle weight.

## Decision

- **No GraphQL, Apollo, codegen or MSW in version 1.** Lessons come through `LESSON_SOURCE` (compiled modules). If a real API arrives (for example the resume-code sync), its own ADR picks the protocol then. The `LessonSource` interface stays, so a different source never touches the stores or components.
- **No D3.** Visuals are SVG Angular components in `libs/visuals`: signal inputs, CSS animations behind the motion tokens, and tests for every label and state.
- The README stack lists what is really used.

## Consequences

- Less code and no extra dependencies. The initial bundle stays as measured in ADR 0014.
- The portfolio shows fewer libraries by name. It shows instead a typed content pipeline, a data-driven engine and hand-built accessible SVG, each with tests.
- If a later visual needs real data-driven drawing (for example a chart of progress), D3 modules can come back for that visual alone, loaded with `@defer`.
