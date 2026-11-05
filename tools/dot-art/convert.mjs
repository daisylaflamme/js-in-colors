// node tools/dot-art/convert.mjs
// Reads docs/dot-art/dot-<pose>.svg, checks them against the art brief and writes
// libs/visuals/src/lib/dot/dot-art.ts. Run it after changing the artwork; commit both.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertPose, POSES, toModule } from './convert-lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const art = {};
for (const pose of POSES) {
  const file = join(root, 'docs', 'dot-art', `dot-${pose}.svg`);
  art[pose] = convertPose(readFileSync(file, 'utf8'), `dot-${pose}.svg`);
}
const out = join(root, 'libs', 'visuals', 'src', 'lib', 'dot', 'dot-art.ts');
writeFileSync(out, toModule(art));
console.log(`Dot art: ${POSES.length} poses checked and written to ${out}`);
