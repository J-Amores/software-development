# 03: Frontend App Shell and Design System Tokens

**What to build:** A zero-framework frontend application shell built with Light DOM Custom Elements, semantic CSS Custom Property design tokens supporting dark and light visual themes, instant theme switching with persistent storage synchronization, and zero flash of unstyled theme on initial page load.

**Blocked by:** 01: Workspace Setup and Unified Toolchain Initialization

**Status:** ready-for-agent

- [x] Application shell renders an administrative layout utilizing Light DOM custom elements for topbar, collapsible sidebar, and content viewport
- [x] Design system tokens are defined via CSS Custom Properties scoped to document root theme selectors for light and dark modes
- [x] Theme management module exposes controls to toggle theme, synchronizes preference to browser storage, and queries system color scheme preferences
- [x] Document head includes an inline bootstrap script that resolves and applies the theme attribute before first layout render to eliminate theme flicker
- [x] Automated tests verify custom element mounting, sidebar collapse toggling, and theme switching interactions
