# 0001. Zero-Framework Web Standards with Vite+ Toolchain

- **Status**: accepted
- **Date**: 2026-10-16

## Context

The legacy dashboard was built with React 18, Material UI, and Create React App, resulting in heavy client-side runtime dependencies, deep framework lock-in, and frequent churn across UI library major versions. We need a long-term maintainable, lightweight administrative dashboard deployed to Cloudflare Pages that loads instantly, preserves standard browser ergonomics, and avoids recurring framework migrations.

## Decision

We will build the frontend using standard web technologies with zero client-side UI runtime frameworks:
- **Runtime**: Standard HTML5, native ES Modules, Light DOM Custom Elements (`<app-shell>`, `<app-sidebar>`, `<app-topbar>` without Shadow DOM to allow natural CSS cascade), and native CSS Custom Properties for theme tokens.
- **Routing**: A deep, vanilla HTML5 History API router module (`init`, `navigate`) paired with a Cloudflare Pages `public/_redirects` SPA rewrite rule (`/* /index.html 200`).
- **Tooling**: Vite+ (`vite-plus` / `vp` CLI) as the unified monorepo task runner and build engine via a root `defineConfig`, orchestrating native ESM dev serving (`vp dev`), Rolldown production static builds (`vp build`), Oxlint/Oxfmt code quality enforcement (`vp check`), and Vitest test execution (`vp test`).

## Consequences

- **Zero Runtime Framework Overhead**: No React, Vue, or component framework bundle overhead shipped to the client; faster initial page loads and zero hydration penalties.
- **No Shadow DOM Pitfalls**: By using Light DOM Custom Elements, global design tokens in CSS Custom Properties cascade seamlessly across all app shell components and view templates.
- **Tooling Consolidation**: Vite+ unifies bundling, linting, formatting, and unit testing under a single configuration file without complex multi-tool config sprawl.
- **Manual State and Lifecycle Management**: View rendering and cleanup must be explicitly managed via standard DOM APIs and our view lifecycle seam (`mount(container)`, `unmount()`).
