// Lighthouse, measured the same way every time (mobile preset, median of 3 runs per page).
//
//   npx nx run web:serve-static --port=4300     # in another terminal: the production build
//   npm run lighthouse                          # or: node tools/lighthouse/measure.mjs [baseUrl]
//
// Lighthouse simulates a mid-range phone by slowing the CPU 4x. That assumes a fast, idle machine:
// on a busy one the blocking time is overstated (README numbers from 2026-11-05 #14 were taken that
// way and were wrong). So every run's CPU benchmark is printed, and a run below MIN_BENCHMARK marks
// the result unreliable. Close other heavy apps (and Cypress) and run again.
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LIGHTHOUSE = 'lighthouse@13.6.0';
const RUNS = 3;
const MIN_BENCHMARK = 1000;
const PAGES = [
  ['Home', '/'],
  ['Lesson', '/lesson/variables'],
  ['Certificate', '/certificate'],
  ['Ask Dot', '/ask-dot'],
];
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

const base = (process.argv[2] ?? 'http://localhost:4300').replace(/\/$/, '');
// LIGHTHOUSE_REPORTS=<dir> keeps every JSON report there (CI uploads them); otherwise a temp dir.
const keep = process.env.LIGHTHOUSE_REPORTS;
if (keep) mkdirSync(keep, { recursive: true });
const dir = keep ?? mkdtempSync(join(tmpdir(), 'jic-lighthouse-'));
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

function run(url, file) {
  // One quoted command string: npx is a .cmd on Windows, which needs a shell.
  const args = [
    '-y',
    LIGHTHOUSE,
    url,
    '--quiet',
    // CI containers need --no-sandbox; locally Chrome keeps its sandbox.
    `--chrome-flags=--headless=new${process.env.CI ? ' --no-sandbox' : ''}`,
    `--only-categories=${CATEGORIES.join(',')}`,
    '--output=json',
    `--output-path=${file}`,
  ];
  const command = ['npx', ...args.map((a) => `"${a}"`)].join(' ');
  const result = spawnSync(command, { stdio: 'inherit', shell: true });
  if (result.status !== 0) throw new Error(`Lighthouse failed on ${url}. Is the server running at ${base}?`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

const rows = [];
let unreliable = false;
try {
  for (const [name, path] of PAGES) {
    const reports = [];
    for (let i = 0; i < RUNS; i++) {
      process.stdout.write(`${name}: run ${i + 1} of ${RUNS}\n`);
      reports.push(run(base + path, join(dir, `${name.toLowerCase().replace(/ /g, '-')}-${i + 1}.json`)));
    }
    const score = (id) => median(reports.map((r) => Math.round(r.categories[id].score * 100)));
    const metric = (id) => median(reports.map((r) => r.audits[id].numericValue));
    const benchmarks = reports.map((r) => Math.round(r.environment.benchmarkIndex));
    if (benchmarks.some((b) => b < MIN_BENCHMARK)) unreliable = true;
    rows.push({
      page: name,
      performance: score('performance'),
      accessibility: score('accessibility'),
      'best practices': score('best-practices'),
      seo: score('seo'),
      'LCP s': (metric('largest-contentful-paint') / 1000).toFixed(2),
      'TBT ms': Math.round(metric('total-blocking-time')),
      CLS: metric('cumulative-layout-shift').toFixed(3),
      benchmarks: benchmarks.join(' / '),
    });
  }
} finally {
  if (!keep) rmSync(dir, { recursive: true, force: true });
}

const title = `Lighthouse ${LIGHTHOUSE.split('@')[1]}, mobile preset, median of ${RUNS} runs, ${base}`;
console.log(`\n${title}`);
console.table(rows);

// In GitHub Actions, also write the table to the job summary.
if (process.env.GITHUB_STEP_SUMMARY) {
  const columns = Object.keys(rows[0]);
  const table = [
    `| ${columns.join(' | ')} |`,
    `| ${columns.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${columns.map((c) => r[c]).join(' | ')} |`),
  ].join('\n');
  const note = unreliable ? `\n\n**Unreliable:** a CPU benchmark was under ${MIN_BENCHMARK}.` : '';
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### ${title}\n\n${table}${note}\n`);
}
if (unreliable) {
  console.warn(
    `\nUNRELIABLE: a CPU benchmark was under ${MIN_BENCHMARK}, so the machine was busy and blocking ` +
      'time is overstated. Close other heavy apps and run again before recording these numbers.',
  );
  process.exitCode = 1;
}
