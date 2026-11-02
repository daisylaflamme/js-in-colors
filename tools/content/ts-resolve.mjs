// Lets plain Node (with built-in TypeScript type stripping) run the shared validator, whose
// relative imports have no file extension ("./concepts"), as Angular and Vitest expect.
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
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
