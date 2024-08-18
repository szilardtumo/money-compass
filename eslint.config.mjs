/* eslint-disable import/no-named-as-default-member */
import { fixupPluginRules } from '@eslint/compat';
import eslint from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import cypressPlugin from 'eslint-plugin-cypress/flat';
import importPlugin from 'eslint-plugin-import';
import importRecommented from 'eslint-plugin-import/config/recommended.js';
import importTypescript from 'eslint-plugin-import/config/typescript.js';
import jestDomPlugin from 'eslint-plugin-jest-dom';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // global
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    ignores: ['node_modules/*', '.next/*', 'src/lib/types/database.types.ts'],
  },
  // js, ts, next
  eslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': fixupPluginRules(hooksPlugin),
      '@next/next': fixupPluginRules(nextPlugin),
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...hooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'react/prop-types': 'off',
      'no-console': 'warn',
    },
  },
  // import
  {
    languageOptions: {
      // import plugin does not use ecmaVersion and sourceType from languageOptions object
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      import: fixupPluginRules(importPlugin),
    },
    settings: {
      'import/parsers': {
        espree: ['.js', '.jsx', '.cjs', '.mjs'],
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        node: true,
        typescript: true,
      },
    },
    rules: {
      ...importRecommented.rules,
      ...importTypescript.rules,
      'import/no-duplicates': 'error',
      'import/prefer-default-export': 'off',
      'import/order': [
        'error',
        {
          pathGroups: [
            {
              pattern: '@/**',
              group: 'external',
              position: 'after',
            },
          ],
          groups: [
            ['external', 'builtin'],
            ['internal', 'index', 'sibling', 'parent', 'object'],
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always',
        },
      ],
    },
  },
  // unit tests
  {
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    plugins: {
      'testing-library': fixupPluginRules(testingLibraryPlugin),
      'jest-dom': jestDomPlugin,
    },
    rules: {
      ...testingLibraryPlugin.configs['flat/react'].rules,
      ...jestDomPlugin.configs['flat/recommended'].rules,
    },
  },
  // cypress tests
  {
    files: ['cypress/**/*'],
    ...cypressPlugin.configs.recommended,
  },
);
