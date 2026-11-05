const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  { rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
  {
    files: ['src/**/*.js', 'db/**/*.js', 'tests/**/*.js', 'tools/**/*.js', '*.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  { files: ['public/js/**/*.js'], languageOptions: { sourceType: 'script', globals: globals.browser } },
  { ignores: ['node_modules/', 'public/**/*.min.js'] },
];
