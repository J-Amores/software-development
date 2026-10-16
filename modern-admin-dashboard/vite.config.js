import { defineConfig } from "vite-plus";

export default defineConfig({
  defaultPackage: "./web",
  run: {
    cache: true,
  },
  fmt: {
    ignorePatterns: [".agents/**", ".scratch/**", "docs/**", "GLOSSARY.md", "AGENTS.md"],
  },
  lint: {
    ignorePatterns: [".agents/**", ".scratch/**", "docs/**"],
  },
});
