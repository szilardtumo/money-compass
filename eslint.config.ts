import pluginJs from '@eslint/js';
import pluginNext from '@next/eslint-plugin-next';
import { defineConfig, globalIgnores } from 'eslint/config';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { createNodeResolver, importX } from 'eslint-plugin-import-x';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { version as reactVersion } from 'react';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // global
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      // 'detect' calls the removed context.getFilename() API in eslint-plugin-react, which breaks on ESLint 10
      react: { version: reactVersion },
    },
  },
  globalIgnores(['node_modules/*', '.next/*', '.yarn/*']),
  // js, ts
  pluginJs.configs.recommended,
  tseslint.configs.recommended,
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
  pluginReactHooks.configs.flat['recommended-latest'],
  pluginNext.configs.recommended,
  pluginNext.configs['core-web-vitals'],
  {
    rules: {
      'react/prop-types': 'off',
    },
  },
  // import
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver(), createNodeResolver()],
    },
    rules: {
      'import-x/no-duplicates': 'error',
      // Flags every `React.useState`-style call on the default React import
      'import-x/no-named-as-default-member': 'off',
      'import-x/order': [
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
