# Architecture decision records

Short records of decisions that shape the project. One decision per file, numbered, never rewritten: if a decision changes, add a new ADR that supersedes the old one.

| #                                                    | Decision                                                             | Status   |
| ---------------------------------------------------- | -------------------------------------------------------------------- | -------- |
| [0001](0001-anonymous-first-local-first-progress.md) | Anonymous-first, local-first progress                                | Accepted |
| [0002](0002-state-management.md)                     | State management: signals, SignalStore, classic NgRx                 | Accepted |
| [0003](0003-minimal-backend.md)                      | Minimal backend in version 1                                         | Accepted |
| [0004](0004-fonts.md)                                | Fonts: Baloo 2 and Nunito, self-hosted                               | Accepted |
| [0005](0005-themes.md)                               | Themes: light, dark, high contrast as token overrides                | Accepted |
| [0006](0006-licensing.md)                            | Licensing: MIT for code, CC BY-NC 4.0 for content                    | Accepted |
| [0007](0007-lessons-as-validated-yaml.md)            | Lessons as validated YAML, compiled at build time                    | Accepted |
| [0008](0008-local-progress-and-settings.md)          | Local progress, the resume code, and global settings                 | Accepted |
| [0009](0009-page-magic-color-and-shape.md)           | Page magic gets its own color and shape                              | Accepted |
| [0010](0010-certificate.md)                          | The certificate: earned, made on the device                          | Accepted |
| [0011](0011-ask-dot-demo-mode.md)                    | Ask Dot: demo mode first, behind ChatService                         | Accepted |
| [0012](0012-ask-dot-live-mode.md)                    | Ask Dot live mode: Groq behind a ChatProvider, demo by default       | Accepted |
| [0013](0013-ask-dot-live-model-and-care.md)          | Ask Dot live: gpt-oss-20b, a caring reply, fallbacks that can't hide | Accepted |
| [0014](0014-prerender-every-page.md)                 | Prerender every page at build time                                   | Accepted |

## Template

```md
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context

What is the problem, and what forces are at play?

## Decision

What we will do.

## Consequences

What becomes easier, what becomes harder, and what we must watch.
```
