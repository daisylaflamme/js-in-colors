You are helping me build "JavaScript in Colors", a public front-end portfolio project: a web app that teaches young kids JavaScript concepts through color, animation and tiny interactions. I am applying for front-end / UI engineer jobs, so frontend quality is what matters most. Read CLAUDE.md first; it holds the stack, conventions, accessibility and performance checklists, and hard privacy rules.

This folder contains CLAUDE.md and docs/mockups/ (official screens, spec and tokens). Do NOT write code yet. Use plan mode.

## Step 1: Plan only

Propose a concrete plan for the initial scaffold and wait for my approval. The plan must cover:

1. An Nx monorepo with: Angular app (apps/web), Cypress E2E (apps/web-e2e), and libs: ui, lesson-engine, data-access, visuals, shared. Do NOT create a backend, database or Python code. Use the current stable Angular and Nx versions, standalone components, signals, zoneless change detection if supported, strict TypeScript, and SCSS. Tell me the exact commands you will run and which versions they will install.
2. Tooling: ESLint, Prettier, a unit test runner, Storybook for libs/ui (with the a11y addon), Angular bundle budgets, and GitHub Actions CI (lint, unit tests, build, Storybook build, Cypress smoke test).
3. Design tokens: an SCSS settings layer with CSS custom properties, starting from docs/mockups/design-tokens.css (concept colors, spacing, a type scale, radii, elevation and motion). Include light, dark and high-contrast theme overrides, and self-hosted fonts.
4. A walking skeleton of the app shell, matching the official mockups in docs/mockups/ (read docs/mockups/README.md first and look at every PNG; they are the visual reference). The shell has: a light left lesson menu (logo, progress bar, shape icon + lesson name + subtitle, a check on finished lessons, a soft highlight on the current one, a "no account needed" footer with a resume code); a **hamburger button at the top-left of the main column that collapses and expands the left menu** (aria-expanded, remembered locally, closed by default on narrow screens); the lesson title and one sentence; a large center stage; one row of choices with a "Peek at the code" toggle; and Back, scene dots and a single big "Next" button. On the right edge, three small tabs: Tip (small popover card), Library (right-hand drawer) and Read to me. All closed by default. Placeholder content only, using the Variables lesson from the mockup. One lazy-loaded lesson route. Keyboard accessible, with focus trap, Esc to close and focus return for the Tip popover and Library drawer. Seed the SCSS tokens from docs/mockups/design-tokens.css. Build it **mobile-first** as described in CLAUDE.md: the phone and tablet PNGs in docs/mockups/ show the small-screen layouts (menu overlay, bottom tab bar, bottom-sheet Library).
5. A Storybook story for each shell component in libs/ui, with controls.
6. One Cypress smoke test, run at phone, tablet and desktop viewports: the app loads, the hamburger collapses and expands the menu, the Tip popover opens and closes with Esc and returns focus. Add `cypress-axe` and run an a11y check.
7. ADRs: docs/adr/0001-anonymous-first-local-first-progress.md (from the privacy rules in CLAUDE.md), docs/adr/0002-state-management.md (signals for local state, SignalStore for features, classic NgRx for cross-cutting), docs/adr/0003-minimal-backend.md (no database or Python in version 1; mock GraphQL via MSW; why).
8. A README skeleton: project goal, stack, how to run, an "Accessibility and performance" section (to fill with results later), and a placeholder "How I built this with Claude Code" section.
9. The list of commands to add to the Commands section of CLAUDE.md.

For each item list the files you expect to create. Flag any risk, version conflict or decision I should make. Keep the plan short and scannable.

## Step 2: After I approve

Implement in small steps. After each step: run lint, tests and build, and tell me the result in one or two sentences. Commit after each step using Conventional Commits. Run `git init` and make the first commit if this folder is not yet a git repository. Do not add GraphQL, MSW handlers, chat, a database, or real lessons yet: those come in later tasks.

## Rules for this task

- No personal data collection, no analytics, no third-party scripts or CDN fonts.
- Do not copy text or images from W3Schools or from any existing website.
- Ask me before installing anything not mentioned above.
