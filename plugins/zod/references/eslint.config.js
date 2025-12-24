// ESLint 9+ flat config with Zod best practices
import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import zodX from "eslint-plugin-zod-x";

export default [
  eslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "zod-x": zodX,
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",

      // Zod-specific rules (eslint-plugin-zod-x)
      "zod-x/no-missing-error-messages": "warn",
      "zod-x/prefer-enum": "warn",
      "zod-x/require-strict": "error",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "*.config.js"],
  },
];

// Legacy .eslintrc.json example (ESLint 8 and below):
// {
//   "parser": "@typescript-eslint/parser",
//   "parserOptions": {
//     "ecmaVersion": "latest",
//     "sourceType": "module",
//     "project": "./tsconfig.json"
//   },
//   "plugins": ["@typescript-eslint", "zod-x"],
//   "extends": [
//     "eslint:recommended",
//     "plugin:@typescript-eslint/recommended"
//   ],
//   "rules": {
//     "zod-x/no-missing-error-messages": "warn",
//     "zod-x/prefer-enum": "warn",
//     "zod-x/require-strict": "error"
//   }
// }
