// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'app-example/*', '.expo/*'],
  },
  {
    // Plain Node scripts (not bundled into the app) may read env vars dynamically.
    files: ['scripts/**'],
    rules: { 'expo/no-dynamic-env-var': 'off' },
  },
]);
