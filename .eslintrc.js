module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module',
  },
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: {},
    },
  },
  ignorePatterns: ['node_modules/*', 'src/lib/types/database.types.ts'],
  extends: [
    'airbnb',
    'next/core-web-vitals',
    'prettier',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:testing-library/react',
    'plugin:jest-dom/recommended',
  ],
  rules: {
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
    'import/no-duplicates': 'error',
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
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['cypress.config.js'],
      },
    ],
    'import/prefer-default-export': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/require-default-props': 'off',
    'no-nested-ternary': 'off',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['./tsconfig.json', 'cypress/tsconfig.json'],
      },
      extends: ['airbnb-typescript', 'prettier', 'plugin:import/typescript'],
      rules: {
        '@typescript-eslint/no-throw-literal': 'off',
      },
    },
  ],
};
