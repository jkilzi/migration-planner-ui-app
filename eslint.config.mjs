import path from "node:path";

import js from "@eslint/js";
// eslint-disable-next-line rulesdir/disallow-fec-relative-imports
import fecConfigs from "@redhat-cloud-services/eslint-config-redhat-cloud-services";
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

// IMPORTANT:
// The only reason worth extending the Red Hat shared config is to be notified of API changes in their SDKs.
// We pull their custom rulesdir rules without the rest of its opinionated rule set to keep future
// rulesdir additions automatically applied while allowing us to maintain our own linting rules.

// Setup the rulesdir plugin
rulesdir.RULES_DIR = path.resolve(
  process.cwd(),
  "node_modules/@redhat-cloud-services/eslint-config-redhat-cloud-services/lib/rules",
);

/**
 * @typedef {Object} FecConfig
 * @property {import('eslint').Linter.RulesRecord} [rules]
 * @property {import('eslint').Linter.ParserOptions} [parserOptions]
 */

/**
 * Extracts rules that start with "rulesdir/" from the provided
 * Red Hat ESLint config object. This enables inheriting only
 * the custom "rulesdir" rules without adopting the entire rule set.
 *
 * @param {FecConfig} config - The Red Hat ESLint config object, expected to have a `rules` property.
 * @returns {import('eslint').Linter.RulesRecord} An object mapping "rulesdir/" rule names to their configs.
 */
const getFecConfigRulesdirRules = (config) => {
  return Object.entries(config.rules)
    .filter(([ruleName]) => ruleName.startsWith("rulesdir/"))
    .reduce((acc, [ruleName, ruleConfig]) => {
      acc[ruleName] = ruleConfig;
      return acc;
    }, /** @type {import('eslint').Linter.RulesRecord} */ ({}));
};

/**
 * @param {unknown} config
 * @returns {config is FecConfig}
 */
const isFecConfig = (config) => {
  return (
    config &&
    typeof config === "object" &&
    "rules" in config &&
    typeof config.rules === "object" &&
    Object.keys(config.rules).some((ruleName) =>
      ruleName.startsWith("rulesdir/"),
    ) &&
    "languageOptions" in config &&
    "globals" in config.languageOptions &&
    typeof config.languageOptions.globals === "object" &&
    Object.keys(config.languageOptions.globals).some(
      (globalName) => globalName === "CRC_APP_NAME",
    )
  );
};

const fecConfig = fecConfigs.find((c) =>
  Boolean(c.languageOptions?.globals?.CRC_APP_NAME),
);
// Validate the FEC config assuming the last entry in the list will be the one the package maintainers
// define to override another settings.
if (!isFecConfig(fecConfig)) {
  throw new Error(
    "eslint.config.mjs: Unxpected object shape exposed by '@redhat-cloud-services/eslint-config-redhat-cloud-services'. The package's structure may have changed.",
    { cause: fecConfig },
  );
}

/** @type {import('eslint').Linter.RulesRecord} */
const fecConfigRulesdirRules = getFecConfigRulesdirRules(fecConfig);

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
    reactRefresh.configs.vite,
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
};

/** @type {import('eslint').Linter.Config} */
const devConfig = {
  name: "devConfig",
  files: ["dev/**/*.{ts,tsx}"],
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
  devConfig,
  srcConfig,
  srcTestsConfig,
  eslintConfigPrettier,
);
