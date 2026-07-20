/**
 * Shared ESLint flat config base for Clube da Estampa.
 * Enforces TypeScript strictness aligned with CLAUDE.md.
 */
const tseslint = require('typescript-eslint')
const js = require('@eslint/js')

module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**', '**/.expo/**', '**/*.cjs'],
  },
)
