/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/libs/visuals',
  resolve: {
    tsconfigPaths: true,
  },
  // Test-only config: name the spec tsconfig so loading it outside Vitest (Nx graph) works too.
  plugins: [angular({ tsconfig: `${import.meta.dirname}/tsconfig.spec.json` })],
  css: { preprocessorOptions: { scss: { loadPaths: ['../../styles'] } } },
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  test: {
    name: 'visuals',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/libs/visuals',
      provider: 'v8' as const,
    },
  },
}));
