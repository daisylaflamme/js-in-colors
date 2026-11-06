// Lets plain Node (with built-in TypeScript type stripping) run workspace TypeScript: the content
// build (tools/content) and the Ask Dot server (apps/api).
// - Relative imports without a file extension ("./concepts") get ".ts", as Angular and Vitest expect.
// - Workspace aliases (@jic/shared, @jic/shared/chat) resolve through tsconfig.base.json "paths".
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const paths = JSON.parse(readFileSync(join(root, 'tsconfig.base.json'), 'utf8')).compilerOptions.paths ?? {};

registerHooks({
  resolve(specifier, context, nextResolve) {
    const alias = paths[specifier];
    if (alias) return nextResolve(pathToFileURL(join(root, alias[0])).href, context);
    if (/^\.{1,2}\//.test(specifier) && !/\.[cm]?[jt]s$/.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {
        // fall through to the default resolution
      }
    }
    return nextResolve(specifier, context);
  },
});
