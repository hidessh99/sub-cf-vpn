import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
  {
    ignores: [
      "dist/**/*",
      "node_modules/**/*",
      "postcss.config.js",
      "tailwind.config.js",
      "nginx.conf",
      "Dockerfile"
    ]
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: await import("@typescript-eslint/parser"),
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": "off"
    }
  }
];
