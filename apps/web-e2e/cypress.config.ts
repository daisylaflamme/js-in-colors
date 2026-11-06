import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { ReadyLesson } from './src/support/lessons';

const CONTENT = join(__dirname, '../../content');

/**
 * Every ready lesson, read from content/ when Cypress starts, so specs can build one test per
 * lesson synchronously (Cypress.env('lessons')). A new lesson is walked without touching the spec.
 */
function readyLessons(): ReadyLesson[] {
  const read = (file: string) => parse(readFileSync(join(CONTENT, file), 'utf8'));
  const course = read('course.yaml') as { lessons: { id: string; status: string }[] };
  return course.lessons
    .filter((entry) => entry.status === 'ready')
    .map((entry) => {
      const lesson = read(`lessons/${entry.id}.yaml`) as {
        title: string;
        scenes: { type: string; options?: { label: string; correct: boolean; feedback: string }[] }[];
      };
      return {
        id: entry.id,
        title: lesson.title,
        scenes: lesson.scenes.map((scene) => {
          const right = scene.options?.find((option) => option.correct);
          return right
            ? { type: scene.type, answer: right.label, feedback: right.feedback }
            : { type: scene.type };
        }),
      };
    });
}

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: {
        default: process.env['CI'] ? 'npx nx run web:serve-static' : 'npx nx run web:serve',
        production: 'npx nx run web:serve-static',
        // Ask Dot live mode (ADR 0012); the specs fake the server with cy.intercept.
        live: 'npx nx run web:serve:live',
      },
      ciWebServerCommand: 'npx nx run web:serve-static',
      ciBaseUrl: 'http://localhost:4200',
    }),
    baseUrl: 'http://localhost:4200',
    setupNodeEvents(on, config) {
      config.env['lessons'] = readyLessons();
      // prerender.cy.ts runs only against the prerendered production build (serve-static): what CI
      // and --configuration=production serve. Set CYPRESS_prerendered=true when running Cypress by hand.
      config.env['prerendered'] ??=
        Boolean(process.env['CI']) || process.env['NX_TASK_TARGET_CONFIGURATION'] === 'production';
      // Print axe violations in the terminal (CI logs), not only in the browser console.
      on('task', {
        table(rows: unknown[]) {
          console.table(rows);
          return null;
        },
      });
      return config;
    },
  },
});
