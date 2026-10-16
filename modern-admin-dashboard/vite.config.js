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
    ],
  },
  lint: {
    ignorePatterns: [".agents/**", ".scratch/**", ".worktrees/**", "docs/**"],
  },
  test: {
    exclude: ["**/node_modules/**", "**/.worktrees/**"],
  },
});
