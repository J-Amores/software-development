import { defineConfig } from "vite-plus";

export default defineConfig({
  defaultPackage: "./web",
  run: {
    cache: true,
  },
  fmt: {
    ignorePatterns: [
      ".agents/**",
      ".scratch/**",
      ".worktrees/**",
      "docs/**",
      "GLOSSARY.md",
      "AGENTS.md",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  lint: {
    ignorePatterns: [
      ".agents/**",
      ".scratch/**",
      ".worktrees/**",
      "docs/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  test: {
    exclude: ["**/node_modules/**", "**/.worktrees/**", "e2e/**"],
  },
});
