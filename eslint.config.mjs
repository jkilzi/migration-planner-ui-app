import { readFileSync } from "node:fs";
import path from "node:path";

import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import rulesdir from "eslint-plugin-rulesdir";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tsEslintPlugin from "typescript-eslint";

const require = (await import("node:module")).createRequire(import.meta.url);

// IMPORTANT:
// We pull the custom rulesdir rules from the Red Hat shared config without importing it directly.
// This avoids the @babel/core peer dependency that their config requires (via @babel/eslint-parser).
// By parsing the source file, we keep future rulesdir additions automatically applied while
// maintaining our own linting rules and avoiding unnecessary dependencies.

const FEC_PACKAGE_NAME =
  "@redhat-cloud-services/eslint-config-redhat-cloud-services";

// Setup the rulesdir plugin
rulesdir.RULES_DIR = path.resolve(
  process.cwd(),
  `node_modules/${FEC_PACKAGE_NAME}/lib/rules`,
);

/**
 * Extracts rulesdir rules by parsing the FEC config source file textually.
 * This avoids executing the config (which would require @babel/core).
 *
 * @returns {import('eslint').Linter.RulesRecord} An object mapping "rulesdir/" rule names to their severity.
 */
const extractFecRulesdirRules = () => {
  /** @type {import('eslint').Linter.RulesRecord} */
  const rules = {};

  try {
    // Resolve the package.json path to locate the package directory
    const fecPackageJsonPath = require.resolve(
      `${FEC_PACKAGE_NAME}/package.json`,
    );
    const fecPackageDir = path.dirname(fecPackageJsonPath);

    // Read package.json to get the main entry point
    const packageJson = JSON.parse(readFileSync(fecPackageJsonPath, "utf-8"));
    const mainFile = packageJson.main || "index.js";
    const configFilePath = path.join(fecPackageDir, mainFile);

    // Read the config file as text (without executing it)
    const configSource = readFileSync(configFilePath, "utf-8");

    // Extract rulesdir rules using regex
    // Matches patterns like: 'rulesdir/rule-name': 1 or 'rulesdir/rule-name': 2
    const rulesdirRegex = /['"]?(rulesdir\/[^'"]+)['"]?:\s*(\d+)/g;
    let match;

    while ((match = rulesdirRegex.exec(configSource)) !== null) {
      const ruleName = match[1];
      const severity = parseInt(match[2], 10);
      rules[ruleName] = severity;
    }

    if (Object.keys(rules).length === 0) {
      throw new Error("No rulesdir rules found in the config source.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to extract rulesdir rules from '${FEC_PACKAGE_NAME}'. ` +
        `The package's structure may have changed. ` +
        `Original error: ${message}`,
    );
  }

  return rules;
};

/** @type {import('eslint').Linter.RulesRecord} */
const fecConfigRulesdirRules = extractFecRulesdirRules();

/** @type {import('eslint').Linter.Config} */
const allFilesConfig = {
  name: "allFilesConfig",
  languageOptions: {
    sourceType: "commonjs",
    globals: {
      ...globals.node,
    },
  },
  plugins: {
    rulesdir,
    "simple-import-sort": simpleImportSort,
  },
  rules: {
    ...fecConfigRulesdirRules,
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "sort-imports": "off",
    "simple-import-sort/imports": "warn",
    "simple-import-sort/exports": "warn",
  },
};

/** @type {import('eslint').Linter.Config} */
const srcConfig = {
  name: "srcConfig",
  files: ["src/**/*.{ts,tsx}"],
  extends: [
    js.configs.recommended,
    tsEslintPlugin.configs.recommendedTypeChecked,
    reactPlugin.configs.flat["jsx-runtime"],
    reactHooksPlugin.configs.flat.recommended,
  ],
  languageOptions: {
    ecmaVersion: 2020,
    globals: {
      ...globals.browser,
      insights: "readonly",
      CRC_APP_NAME: "readonly",
    },
    parser: tsParser,
    parserOptions: {
      projectService: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "react/prop-types": "off",
  },
};

/** @type {import('eslint').Linter.Config} */
const srcTestsConfig = {
  name: "srcTestsConfig",
  ...srcConfig,
  files: ["src/**/*.test.{ts,tsx}"],
  languageOptions: {
    ...srcConfig.languageOptions,
    globals: {
      ...srcConfig.languageOptions.globals,
      ...globals.node,
      ...globals.vitest,
    },
  },
  rules: {
    ...srcConfig.rules,
    // In tests, methods are commonly passed to expect() (e.g. expect(obj.method).toHaveBeenCalled())
    // which is safe — the linter just can't tell that expect() won't invoke them with a wrong `this`.
    "@typescript-eslint/unbound-method": "off",
  },
};

/** @type {import('eslint').Linter.Config} */
const devNodeConfig = {
  name: "devNodeConfig",
  files: ["dev/vite.config.ts"],
  extends: [js.configs.recommended, tsEslintPlugin.configs.recommended],
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    globals: {
      ...globals.node,
    },
    parser: tsParser,
    parserOptions: {
      projectService: true,
    },
  },
};

/** @type {import('eslint').Linter.Config} */
const devConfig = {
  name: "devConfig",
  files: ["dev/src/**/*.{ts,tsx}"],
  extends: [
    js.configs.recommended,
    tsEslintPlugin.configs.recommended,
    reactHooksPlugin.configs.flat.recommended,
    reactRefresh.configs.vite,
  ],
  languageOptions: {
    ecmaVersion: 2020,
    globals: {
      ...globals.browser,
    },
  },
};

export default defineConfig(
  globalIgnores(["node_modules", "**/dist/**", "build-tools"]),
  tsEslintPlugin.configs.recommended,
  allFilesConfig,
  devNodeConfig,
  devConfig,
  srcConfig,
  srcTestsConfig,
  eslintConfigPrettier,
);
