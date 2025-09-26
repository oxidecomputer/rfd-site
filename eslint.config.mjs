import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { includeIgnoreFile } from '@eslint/compat'
import eslint from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import playwright from 'eslint-plugin-playwright'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

const parentDir = path.dirname(fileURLToPath(import.meta.url))
const gitignorePath = path.resolve(parentDir, '.gitignore')

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  reactHooks.configs['recommended-latest'],
  {
    ...playwright.configs['flat/recommended'],
    files: ['test/e2e/**'],
    rules: {
      'playwright/no-standalone-expect': 'off',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      eqeqeq: 'error',
      'no-param-reassign': 'error',
      'no-return-assign': 'error',
    },
  },
  {
    ignores: ['types/**', '*.config.js', '*.config.mjs'],
  },
)
