import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { applicationConfig, type Decorator, type Preview } from '@storybook/angular';

/** Same breakpoints the app is built and tested at (CLAUDE.md, docs/mockups). */
const viewports = {
  phone: { name: 'Phone 390×844', styles: { width: '390px', height: '844px' }, type: 'mobile' },
  tablet: { name: 'Tablet 820×1180', styles: { width: '820px', height: '1180px' }, type: 'tablet' },
  desktop: { name: 'Desktop 1440×900', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
} as const;

/** Applies the theme toolbar choice the same way the app does: a data-theme attribute on <html>. */
const withTheme: Decorator = (story, context) => {
  const theme = context.globals['theme'] as string | undefined;
  const root = document.documentElement;
  if (theme && theme !== 'system') {
    root.setAttribute('data-theme', theme);
  } else {
    root.removeAttribute('data-theme');
  }
  return story();
};

const preview: Preview = {
  decorators: [
    applicationConfig({ providers: [provideZonelessChangeDetection(), provideRouter([])] }),
    withTheme,
  ],
  globalTypes: {
    theme: {
      description: 'Color theme (token overrides)',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'system', title: 'System' },
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'high-contrast', title: 'High contrast' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  parameters: {
    layout: 'padded',
    viewport: { options: viewports },
    backgrounds: { disabled: true }, // the theme tokens own the background
    controls: { expanded: true },
    a11y: {
      // Fail the story's a11y check on violations, not just warn.
      test: 'error',
    },
  },
};

export default preview;
