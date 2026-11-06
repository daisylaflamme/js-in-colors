// Writes 404.html next to the prerendered pages (ADR 0014): the Not found page, for any URL the
// build did not write. Static hosts (and http-server in serve-static) serve 404.html for a missing
// file, and the app's '**' route draws Not found too, so hydration matches the HTML.
// Usage: node tools/prerender/fallback-page.mjs [browserOutputDir]
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'dist/apps/web/browser';
const source = join(dir, 'not-found', 'index.html');

if (!existsSync(source)) {
  console.error(`No prerendered Not found page at ${source}. Run the production build first.`);
  process.exit(1);
}
copyFileSync(source, join(dir, '404.html'));
console.log(`Wrote ${join(dir, '404.html')} (from the prerendered Not found page).`);
