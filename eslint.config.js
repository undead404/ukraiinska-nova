import { builtinModules } from 'node:module';

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import vitest from 'eslint-plugin-vitest';
import tseslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  sonarjs.configs.recommended,
  eslintPluginUnicorn.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json', // <-- type-aware linting
      },
    },
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      'no-console': 'off',
      'no-process-exit': 'off',
      'unicorn/no-process-exit': 'off',
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Node.js builtins.
            [
              // eslint-disable-next-line sonarjs/no-nested-template-literals
              `^(${builtinModules.map((moduleName) => `node:${moduleName}`).join('|')})(/|$)`,
            ],
            // libs.
            [String.raw`^@?(\w|.)[^./]`],
            // Internal libs.
            [String.raw`^@\/(\w|.)[^./]`],
            // Same scope imports
            [
              String.raw`^@\/(\w|.)[^./]`, // Root-alias imports
              String.raw`^\.\.(?!/?$)`, // Parent imports. Put `..` last.
              String.raw`^\.\./?$`,
            ],
            // Other relative imports. Put same-folder imports and `.` last.
            [
              String.raw`^\./(?=.*/)(?!/?$)`,
              String.raw`^\.(?!/?$)`,
              String.raw`^\./?$`,
            ],
            // Style imports.
            [String.raw`^.+\.s?css$`],
            // Image imports.
            [String.raw`^.+\.svg|png|jpg$`],
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.test.ts'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['./*.config.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './config.tsconfig.json', // <-- type-aware linting
      },
    },
  },
  {
    ignores: ['node_modules/', 'dist/', '**/*.d.ts'],
  },
);
