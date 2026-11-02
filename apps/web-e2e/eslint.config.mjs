import cypress from 'eslint-plugin-cypress/flat';
import prettier from 'eslint-config-prettier';
import baseConfig from '../../eslint.config.mjs';

export default [cypress.configs['recommended'], ...baseConfig, prettier];
