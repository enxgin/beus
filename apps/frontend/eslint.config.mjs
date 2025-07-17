import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // ESLint 9 ile uyumsuz olan kuralları devre dışı bırak
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
      "@typescript-eslint/no-var-requires": "off",
    },
  },
  {
    ignores: [
      "src/lib/prisma-client/**/*",
      "src/lib/prismadb.ts",
      "node_modules/**/*",
      ".next/**/*"
    ],
  },
];

export default eslintConfig;
