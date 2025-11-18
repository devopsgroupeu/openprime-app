import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Global ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/build/**",
      "**/dist/**",
      "**/.git/**",
      "**/coverage/**",
      "package-lock.json",
    ],
  },

  // JavaScript/JSX files (browser environment)
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    ignores: ["**/*.config.js", "**/*.config.mjs"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },

  // React-specific config
  {
    files: ["src/**/*.{js,jsx}"],
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
        process: "readonly", // Webpack provides process.env at build time
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // Allow JSX without React import (React 17+)
      "react/react-in-jsx-scope": "off",
      // Allow unescaped entities
      "react/no-unescaped-entities": "warn",
      // Allow unused vars that start with _
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  // Test files - add Jest globals
  {
    files: ["**/*.test.{js,jsx}", "**/__tests__/**/*.{js,jsx}", "**/setupTests.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly",
      },
    },
  },

  // E2E test files - Playwright Core with custom runner
  {
    files: ["e2e/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      // Allow unused catch variables
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: ".*",
        },
      ],
    },
  },

  // Node.js config files (CommonJS)
  {
    files: ["*.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: "commonjs",
    },
    rules: {
      "no-undef": "off",
    },
  },

  // JSON files
  {
    files: ["**/*.json"],
    ignores: ["package-lock.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },

  // Markdown files
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/gfm",
    extends: ["markdown/recommended"],
    rules: {
      // Warn instead of error for multiple H1
      "markdown/no-multiple-h1": "warn",
      // Warn for missing code block language
      "markdown/fenced-code-language": "warn",
    },
  },

  // CSS files
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
    rules: {
      // Allow Tailwind directives
      "css/no-invalid-at-rules": "off",
      // Warn for non-baseline features instead of error
      "css/use-baseline": "warn",
    },
  },
]);
