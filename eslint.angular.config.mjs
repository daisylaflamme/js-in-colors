import nx from '@nx/eslint-plugin';
import angular from 'angular-eslint';
import prettier from 'eslint-config-prettier';
import baseConfig from './eslint.config.mjs';

/** Shared config for every Angular project (apps/web and the Angular libs). */
export default [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'jic', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        // attribute selectors let presentational components sit on native <button>/<dialog>
        { type: ['element', 'attribute'], prefix: 'jic', style: 'kebab-case' },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/no-output-on-prefix': 'error',
    },
  },
  ...angular.configs.templateAccessibility.map((c) => ({ ...c, files: ['**/*.html'] })),
  {
    files: ['**/*.html'],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/button-has-type': 'error',
      // These attribute components render their own accessible content.
      '@angular-eslint/template/elements-content': [
        'error',
        { allowList: ['jic-menu-button', 'jic-code-peek-toggle', 'jic-replay-button', 'jic-setting-toggle'] },
      ],
      '@angular-eslint/template/no-positive-tabindex': 'error',
    },
  },
  prettier,
];
