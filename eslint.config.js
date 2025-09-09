// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      // Add your custom rules here
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // For CommonJS files if you have any
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "script",
    },
  },
  {
    ignores: ["node_modules/", "dist/", "build/"],
  }
);
