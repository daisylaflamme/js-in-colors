import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: {
        default: process.env['CI'] ? 'npx nx run web:serve-static' : 'npx nx run web:serve',
        production: 'npx nx run web:serve-static',
      },
      ciWebServerCommand: 'npx nx run web:serve-static',
      ciBaseUrl: 'http://localhost:4200',
    }),
    baseUrl: 'http://localhost:4200',
    setupNodeEvents(on) {
      // Print axe violations in the terminal (CI logs), not only in the browser console.
      on('task', {
        table(rows: unknown[]) {
          console.table(rows);
          return null;
        },
      });
    },
  },
});
