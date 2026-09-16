const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  // Must come after the Expo config so formatting rules lose to Prettier.
  prettierConfig,
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'scripts/**', 'expo-env.d.ts'],
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      // Domain enums are a const object plus a type of the same name, which is
      // the standard way to model a string union TypeScript can also narrow.
      '@typescript-eslint/no-redeclare': 'off',
    },
  },
];
