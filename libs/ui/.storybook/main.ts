import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts', '../../visuals/src/**/*.stories.ts'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  // Kids' privacy rules apply to the docs site too: no telemetry, no crash reports.
  core: {
    disableTelemetry: true,
    enableCrashReports: false,
  },
};

export default config;
