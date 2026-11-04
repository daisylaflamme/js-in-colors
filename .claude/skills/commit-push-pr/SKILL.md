---
name: commit-push-pr
description: Review, check, commit, push the current branch and open a pull request. Runs the code-reviewer subagent and the repo checks first and stops on blocking findings or failures.
argument-hint: '[base branch] [extra notes for the PR]'
disable-model-invocation: true
---

Ship the current branch as a pull request. Arguments: `$ARGUMENTS` (optional: the base branch first, then any notes for the PR body).

Stop and report at the first failure. Never use `--no-verify`, `--force`, or `git add -A` on files you haven't looked at.

## 1. Where are we

```bash
git status --short
git branch --show-current
git log --oneline -15
```

- If the current branch is `main`, stop and ask for a branch name. CLAUDE.md requires one feature per branch.
- **Base branch:** use the first argument if given. Otherwise, use the nearest branch this one is stacked on, if any (compare `git merge-base` with the other local `feat/*` / `chore/*` / `fix/*` branches). Otherwise use `main`. Say which base you picked and why.
- Look at every uncommitted file. Leave unrelated ones out and say so. Ask before including anything that looks like a secret, `.env`, or a generated file.

## 2. Review

Run the **code-reviewer** subagent on this branch against the base (committed and uncommitted changes). If it reports any `blocking` finding, stop: list the findings and ask whether to fix them. Don't push anything at that point. Carry the `should-fix` findings into the PR body.

## 3. Checks (CLAUDE.md: before finishing any task)

On Windows, prefix the Nx commands with `NX_DAEMON=false`.

```bash
npm run format:check
npx nx run-many -t lint test build
```

- When a story under `libs/` changed, also run `npx nx build-storybook ui`.
- Record the pass/fail result and the initial bundle size from the build output.
- If anything fails, stop and show the error.

## 4. Commit

- Group the uncommitted changes into small Conventional Commits (`feat(scope):`, `fix:`, `test:`, `docs:`, `chore:`). Stage files by name.
- If there is nothing new to commit, skip this step.
- End every commit message with:

```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

## 5. Push

```bash
git push -u origin <branch>
```

If the push is rejected, stop and report it. Never force-push.

## 6. Pull request

- **Title:** a Conventional-Commit style summary of the branch.
- **Body:**
  - **Summary:** what changed and why, in 2-5 bullets.
  - **Checks:** format, lint, unit tests (with the count), build (with the initial bundle size), and Storybook / e2e if they ran. Never claim a check you didn't run.
  - **Review notes:** the reviewer's `should-fix` findings, plus decisions the owner should know about.
  - **Stacked on:** the base branch, when it isn't `main`.
  - The notes from `$ARGUMENTS`, if any.
  - End with:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Create it with `gh pr create --base <base> --head <branch> --title ... --body-file <file in the scratchpad>`.

If `gh` isn't installed or isn't logged in, don't install it. Print the compare URL `https://github.com/<owner>/<repo>/compare/<base>...<branch>?expand=1` (taken from `git remote get-url origin`), show the title and body ready to paste, and suggest `! gh auth login` if they want this automated.

## 7. Report

Report the PR link (or the compare URL), the commits pushed, the check results, and anything you left out or stopped on.
