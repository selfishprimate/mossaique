import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Build scripts and config files run in Node, not the browser
    files: ['scripts/**/*.js', '*.config.js', 'seo-config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Netlify functions run in Node and use CommonJS
    files: ['netlify/functions/**/*.js'],
    languageOptions: {
      globals: globals.node,
      sourceType: 'commonjs',
    },
  },
])
