// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default defineConfig(
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    eslintConfigPrettier,
    eslintPluginPrettier,
    {
        ignores: ['**/node_modules/**', '**/.aws-sam/**'],
    },
    {
        // Type-aware rules need a TypeScript program
        files: ['**/*.ts'],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        // Plain JS/MJS here is Node tooling (config files), not Lambda source,
        // so it needs Node globals. TS files get theirs from @types/node.
        files: ['**/*.js', '**/*.mjs'],
        extends: [tseslint.configs.disableTypeChecked],
        languageOptions: {
            globals: globals.node,
        },
    },
    {
        // Root-level .js config files (.prettierrc.js) are CommonJS, not ESM
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
        },
    },
    {
        // Type-aware rule severities. Scoped to TypeScript: applying them
        // globally would re-enable typed linting on the JS/MJS tooling above,
        // which has no TypeScript program behind it.
        files: ['**/*.ts'],
        rules: {
            // Type-aware rules that catch real defects: unhandled promises,
            // thrown non-Errors that lose their stack trace in CloudWatch,
            // and "[object Object]" landing in logs.
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/only-throw-error': 'error',
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/no-base-to-string': 'error',
            '@typescript-eslint/no-unnecessary-type-assertion': 'error',
            '@typescript-eslint/require-await': 'error',
            '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

            // `any` leaking out of JSON.parse and response.json() boundaries:
            // cast at the boundary to the type the parse is known to produce.
            '@typescript-eslint/no-unsafe-assignment': 'error',
            '@typescript-eslint/no-unsafe-argument': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'error',
            '@typescript-eslint/no-unsafe-return': 'error',
            '@typescript-eslint/no-unsafe-call': 'error',
            '@typescript-eslint/no-unsafe-enum-comparison': 'error',
        },
    },
);
