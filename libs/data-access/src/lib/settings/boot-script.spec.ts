import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SETTINGS_KEY } from './settings-storage';
import { TEXT_SIZES } from './settings.feature';

/**
 * index.html has a tiny inline script that applies saved settings before the first paint
 * (ADR 0014). It cannot import anything, so this test keeps its keys and values in step with
 * the settings store (here) and the shell's menu key (apps/web shell-state.ts).
 */
// __dirname, not import.meta.url: in this jsdom test environment the module URL is not a file URL.
const INDEX_HTML = join(__dirname, '../../../../../apps/web/src/index.html');
const html = readFileSync(INDEX_HTML, 'utf8');
const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';

function run(storage: Record<string, string>): HTMLElement {
  const root = document.createElement('html');
  const fakeDocument = { documentElement: root };
  const fakeStorage = { getItem: (k: string) => storage[k] ?? null };
  new Function('document', 'localStorage', script)(fakeDocument, fakeStorage);
  return root;
}

describe('the boot script in index.html', () => {
  it('reads the same storage keys as the app', () => {
    expect(script).toContain(`'${SETTINGS_KEY}'`);
    expect(script).toContain(`'jic.menuOpen'`);
  });

  it.each(TEXT_SIZES.filter((s) => s !== 'normal'))('applies text size %s', (size) => {
    const root = run({ [SETTINGS_KEY]: JSON.stringify({ calmMotion: false, textSize: size }) });
    expect(root.getAttribute('data-text-size')).toBe(size);
    expect(root.hasAttribute('data-motion')).toBe(false);
  });

  it('applies Calm motion and a saved closed menu', () => {
    const root = run({
      [SETTINGS_KEY]: JSON.stringify({ calmMotion: true, textSize: 'normal' }),
      'jic.menuOpen': 'false',
    });
    expect(root.getAttribute('data-motion')).toBe('calm');
    expect(root.hasAttribute('data-text-size')).toBe(false);
    expect(root.getAttribute('data-menu')).toBe('closed');
  });

  it('ignores broken or unknown values, and storage that throws', () => {
    expect(run({ [SETTINGS_KEY]: '{not json' }).attributes.length).toBe(0);
    expect(run({ [SETTINGS_KEY]: '{"textSize":"huge"}' }).attributes.length).toBe(0);
    expect(run({ [SETTINGS_KEY]: 'null' }).attributes.length).toBe(0);
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
    };
    const root = document.createElement('html');
    expect(() =>
      new Function('document', 'localStorage', script)({ documentElement: root }, throwing),
    ).not.toThrow();
  });
});
