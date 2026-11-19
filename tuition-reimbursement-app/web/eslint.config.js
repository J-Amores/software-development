// What the typecheck cannot see. `tsc --noEmit` already proves the types; this
// catches the things that compile and are still wrong, and the duplication that
// the slice-02 review had to find by eye.
//
// The rule that earns its place here is sonarjs/no-duplicate-string. The Eligible
// Cost field lost its red edge (commit f335630) because a Tailwind class string
// was written out per screen instead of shared, and nothing said what a required
// field looks like. A literal repeated three times is now an error.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";

export default tseslint.config(
  // Generated from contract/openapi.yaml, and never hand-edited (ADR 0004), so
  // there is nothing for a linter to tell us about it. Build output likewise.
  {
    ignores: [
      "src/api/generated/**",
      "src/components/ui/**",
      "dist/**",
      "public/mockServiceWorker.js",
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  // eslint-plugin-react-hooks 7 still ships its configs in eslintrc shape
  // (`plugins` as an array), which flat config rejects, so the plugin is
  // registered here and its recommended rules are taken from it by name.
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs["recommended-latest"].rules,
  },
  sonarjs.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Three copies of a string is where drift starts. Two is a judgement call
      // the reviewer can make; three is a shared constant waiting to be named.
      "sonarjs/no-duplicate-string": ["error", { threshold: 3 }],
      // A fixture takes the request whether or not it reads it, so a leading
      // underscore is how this codebase says "required by the signature".
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Tailwind only builds the classes it can read in the source (ADR 0010),
      // so class names stay literal: this rule would push them into templates.
      "sonarjs/no-nested-template-literals": "off",
    },
  },
  {
    // Tests say the same thing on purpose: a behavior's name, a field's label.
    files: ["src/test/**", "src/mocks/**", "**/*.test.{ts,tsx}"],
    rules: {
      "sonarjs/no-duplicate-string": "off",
    },
  },
);
