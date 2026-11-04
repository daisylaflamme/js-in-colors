# Architecture decision records

Short records of decisions that shape the project. One decision per file, numbered, never rewritten: if a decision changes, add a new ADR that supersedes the old one.

| #                                                    | Decision                                              | Status   |
| ---------------------------------------------------- | ----------------------------------------------------- | -------- |
| [0001](0001-anonymous-first-local-first-progress.md) | Anonymous-first, local-first progress                 | Accepted |
| [0002](0002-state-management.md)                     | State management: signals, SignalStore, classic NgRx  | Accepted |
| [0003](0003-minimal-backend.md)                      | Minimal backend in version 1                          | Accepted |
| [0004](0004-fonts.md)                                | Fonts: Baloo 2 and Nunito, self-hosted                | Accepted |
| [0005](0005-themes.md)                               | Themes: light, dark, high contrast as token overrides | Accepted |
| [0006](0006-licensing.md)                            | Licensing: MIT for code, CC BY-NC 4.0 for content     | Accepted |
| [0007](0007-lessons-as-validated-yaml.md)            | Lessons as validated YAML, compiled at build time     | Accepted |
| [0008](0008-local-progress-and-settings.md)          | Local progress, the resume code, and global settings  | Accepted |

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
