/* eslint-disable import/no-named-as-default-member */
import { fixupPluginRules } from '@eslint/compat';
import pluginJs from '@eslint/js';
import pluginNext from '@next/eslint-plugin-next';
import pluginImport from 'eslint-plugin-import';
import importRecommented from 'eslint-plugin-import/config/recommended.js';
import importTypescript from 'eslint-plugin-import/config/typescript.js';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginReact from 'eslint-plugin-react';
import pluginReactCompiler from 'eslint-plugin-react-compiler';
import pluginReactHooks from 'eslint-plugin-react-hooks';
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
  // js, ts
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
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
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  // react, next
  pluginJsxA11y.flatConfigs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  {
    plugins: {
      'react-hooks': pluginReactHooks,
    },
    rules: pluginReactHooks.configs.recommended.rules,
  },
  {
    files: ['**/*.{j,t}sx'],
    plugins: {
      'react-compiler': pluginReactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
  {
    plugins: {
      '@next/next': fixupPluginRules(pluginNext),
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
    },
  },
  {
    rules: {
      'react/prop-types': 'off',
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
      import: fixupPluginRules(pluginImport),
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
);
