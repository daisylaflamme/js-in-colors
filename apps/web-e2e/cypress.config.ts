const { nxE2EPreset } = require('@nx/cypress/plugins/cypress-preset');
const { defineConfig } = require('cypress');
module.exports = defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      "cypressDir": "src",
      "webServerCommands": {
        "default": process.env['CI'] ? 'npx nx run web:serve-static' : 'npx nx run web:serve',
        "production": "npx nx run web:serve-static"
      },
      "ciWebServerCommand": "npx nx run web:serve-static",
      "ciBaseUrl": "http://localhost:4200"
    }),
    baseUrl: 'http://localhost:4200',
  },
});
