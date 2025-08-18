import js from "@eslint/js";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default [
    // Ignore generated or binary artifacts
    {
        ignores: ["logs/**", "uploads/**", "backups/**", "db/**/*.db"],
    },
    // Start from ESLint recommended
    js.configs.recommended,
    // Disable formatting rules that conflict with Prettier
    prettierConfig,
    // Project rules
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.node,
            },
        },
        rules: {
            // Code quality rules only - no formatting
            "no-redeclare": "error",
            "no-unused-vars": "warn",
            "no-duplicate-imports": "error",
            // Enforce error on using variables not defined/imported
            "no-undef": "error",
        },
    },
    // Jest test files: provide Jest globals
    {
        files: ["tests/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
    },
];
