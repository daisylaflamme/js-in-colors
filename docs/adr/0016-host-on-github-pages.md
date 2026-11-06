# 0016. Host the public site on GitHub Pages

- Status: Accepted
- Date: 2026-11-06

## Context

The app is a static site: every page is prerendered (ADR 0014), progress stays on the device (ADR 0001), and Ask Dot's public mode needs no server (ADR 0011). A portfolio needs a link anyone can open. The code already lives on GitHub, and CI runs there.

## Decision

- **GitHub Pages**, as a project site at `https://daisylaflamme.github.io/js-in-colors/`. It's free and needs no new account; the only setup is Settings → Pages → Source: GitHub Actions.
- **Deploy only what CI passed.** `.github/workflows/pages.yml` runs after the CI workflow succeeds on `main`, builds that exact commit, checks the output (every page present with the right base), and publishes it. It can also be run by hand.
- **The `/js-in-colors/` subpath** comes from the `github-pages` build configuration (`baseHref`). Every link in the app is a router link, so nothing else changes. Local builds, e2e and Lighthouse keep `/`.
- **Ask Dot is in demo mode** on the public site: no server, no AI, no key, no cost. Live mode stays a local option (ADR 0012).
- Unknown addresses get `404.html`, the prerendered Not found page (ADR 0014).

## Consequences

- Every merge to main that passes CI goes live within minutes.
- **Privacy:** the site sets no cookies and runs no analytics. GitHub, as the host, logs visitors' IP addresses for security, as any web host does. The README says so.
- GitHub Pages can't set HTTP headers, for example a Content-Security-Policy header, and redirects `/lesson/variables` to `/lesson/variables/` (one hop; the app ignores the slash).
- Moving to another static host (Cloudflare Pages, Netlify) later means a new deploy job and dropping `baseHref` for a root domain; the build output stays the same.
