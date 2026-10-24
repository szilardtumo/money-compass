import pluginJs from '@eslint/js';
import pluginNext from '@next/eslint-plugin-next';
import { defineConfig, globalIgnores } from 'eslint/config';
import pluginImport from 'eslint-plugin-import';
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
  globalIgnores(['node_modules/*', '.next/*', '.yarn/*', 'src/lib/types/database.types.ts']),
  // js, ts
  pluginJs.configs.recommended,
  // eslint-disable-next-line import/no-named-as-default-member
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
  {
    plugins: {
      import: pluginImport,
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
      ...pluginImport.flatConfigs.recommended.rules,
      ...pluginImport.flatConfigs.typescript.rules,
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
