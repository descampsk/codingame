module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  ignorePatterns: ["dist/**/*.js"],
  extends: [
    "airbnb-base",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  settings: {
    "import/resolver": {
      node: {
        extensions: [".ts"],
      },
    },
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "prettier", "import"],
  rules: {
    "no-plusplus": "off",
    "import/extensions": "off",
    "no-console": "off",
    "import/prefer-default-export": "off",
    "no-restricted-syntax": "off",
    "import/no-unresolved": "off",
    "no-shadow": "off",
    "import/no-mutable-exports": "off",
    radix: "off",
  },
};
