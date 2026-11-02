# 0007. Lessons as validated YAML, compiled at build time

- Status: Accepted
- Date: 2026-11-02

## Context

Lessons must be easy to write and review (short text for young children), and adding one should need no code (CLAUDE.md). There is no backend in version 1 ([ADR 0003](0003-minimal-backend.md)), and a broken lesson must never reach a child: a typo in a concept name or a quiz with two right answers should fail the build, not the lesson.

## Decision

- **Format:** YAML in `content/`. `course.yaml` lists every lesson in menu order with `status: ready | soon`. Each ready lesson is `content/lessons/<id>.yaml`. The authoring guide is `content/README.md`.
- **Types** live in `libs/shared` (`Lesson`, `Scene` = `watch | interact | quiz`, `Visual` = `jar | screen | dot`, `Course`), written in erasable TypeScript so plain Node can run them.
- **Validation:** a hand-written, path-aware validator in `libs/shared` (no schema library):
  - Errors: wrong or missing fields, unknown fields (typos), unknown concepts, 4-6 scenes, exactly one correct quiz answer, unique ids, file name = id, and the course must match the lesson files.
  - Warnings (kid readability): sentences over 12 words, a Tip with more than one sentence.
- **Build step:** `tools/content/build-content.ts` (Nx project `content`, targets `build` / `validate` / `lint`):
  - Parses the YAML with `yaml`, prints errors as `file:line:col`, and exits 1 on errors.
  - Writes typed modules to `libs/data-access/src/generated/` (gitignored): `COURSE` plus one lazy loader per lesson.
  - `web` build/serve/test and `data-access` test depend on it. A unit test also validates the real `content/` files.
- **Runtime:** `LESSON_SOURCE` (data-access) exposes the course and the loaders. `CourseStore` (root) and `LessonStore` (per lesson page) are NgRx SignalStores. `libs/lesson-engine` renders scenes through a registry: `SCENE_TYPES` and `provideSceneTypes()`, where a new scene type is one component implementing `SceneComponent`.

## Consequences

- Content errors are caught at build time with exact locations; authors never touch TypeScript.
- Each lesson is its own small lazy chunk (about 1 kB gzipped), so the app does not grow with the course.
- When the GraphQL API arrives, only `LESSON_SOURCE` changes; the stores, engine and components stay the same.
- The validator is code to maintain. Every new field or scene type needs a rule and a test, and the error messages must stay friendly.
- Generated files are not in git. Nx rebuilds them before serve, build and test, so a fresh clone needs no manual step.
