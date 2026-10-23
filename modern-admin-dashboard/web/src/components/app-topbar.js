import { themeManager, THEMES } from "../theme/index.js";
import { apiClient } from "../api/index.js";

/**
 * 11 Application Routes metadata for ⌘K Quick Search command palette.
 */
const APP_ROUTES = [
  {
    path: "/",
    title: "Dashboard",
    category: "Overview",
    icon: "dashboard",
    keywords: "home overview kpi metrics",
  },
  {
    path: "/team",
    title: "Manage Team",
    category: "Data Management",
    icon: "group",
    keywords: "users members access roles",
  },
  {
    path: "/contacts",
    title: "Contacts Information",
    category: "Data Management",
    icon: "contacts",
    keywords: "clients addresses emails phones",
  },
  {
    path: "/invoices",
    title: "Invoices Balances",
    category: "Data Management",
    icon: "receipt_long",
    keywords: "billing ledger financial payments",
  },
  {
    path: "/form",
    title: "Profile Form",
    category: "Pages",
    icon: "person",
    keywords: "create user provision resource account",
  },
  {
    path: "/calendar",
    title: "Calendar",
    category: "Pages",
    icon: "calendar_today",
    keywords: "schedule events milestones deadlines",
  },
  {
    path: "/faq",
    title: "FAQ Page",
    category: "Pages",
    icon: "help",
    keywords: "questions help answers documentation",
  },
  {
    path: "/bar",
    title: "Bar Chart",
    category: "Charts & Analytics",
    icon: "bar_chart",
    keywords: "sales quantity analytics comparison",
  },
  {
    path: "/pie",
    title: "Pie Chart",
    category: "Charts & Analytics",
    icon: "pie_chart",
    keywords: "distribution expenditures breakdown",
  },
  {
    path: "/line",
    title: "Line Chart",
    category: "Charts & Analytics",
    icon: "show_chart",
    keywords: "revenue trends telemetry longitudinal",
  },
  {
    path: "/geography",
    title: "Geography Chart",
    category: "Charts & Analytics",
    icon: "public",
    keywords: "map global traffic edge nodes",
  },
];

/**
 * <app-topbar>
 * Light DOM Custom Element representing the executive sticky glassmorphic navigation header.
 */
export class AppTopbar extends HTMLElement {
  connectedCallback() {
    this.render();
    this.setupListeners();
    this.checkHealthStatus();
  }

  disconnectedCallback() {
    this.unsubscribeTheme?.();
    if (this._keyListener) {
      window.removeEventListener("keydown", this._keyListener);
    }
  }

  render() {
    const currentTheme = themeManager.getTheme();
    const isDark = currentTheme === THEMES.DARK;

    this.innerHTML = `
      <header class="topbar-container glassmorphic-header" role="banner" style="position: sticky; top: 0; z-index: 30; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 1.5rem; background: var(--bg-surface-lowest); border-bottom: 1px solid var(--border-subtle); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
        <!-- Left: Mobile Menu Toggle, Workspace Selector & Quick Search with ⌘K palette hook -->
        <div class="topbar-left" style="display: flex; align-items: center; gap: 0.75rem; position: relative; max-width: 440px; flex: 1;">
          <button 
            type="button" 
            class="topbar-mobile-toggle" 
            id="mobile-sidebar-toggle" 
            aria-label="Toggle navigation drawer"
          >
            <span class="material-symbols-outlined" style="font-size: 20px;">menu</span>
          </button>

          <div class="topbar-workspace font-mono text-xs px-2.5 py-1 rounded bg-surface border border-subtle" id="topbar-workspace-selector" title="Active Workspace" style="display: inline-flex; align-items: center; gap: 0.35rem; flex-shrink: 0;">
            <span class="font-bold" style="color: var(--text-primary);">ADMIN OPS</span>
            <span class="text-muted">/</span>
            <span class="font-semibold" style="color: var(--color-primary); font-size: 10px;">Production</span>
          </div>

          <div class="search-input-wrapper" style="position: relative; width: 100%;">
            <span class="material-symbols-outlined" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); font-size: 18px; color: var(--text-muted); pointer-events: none;">search</span>
            <input 
              type="text" 
              id="global-search-input" 
              class="topbar-search-input font-sans text-xs" 
              placeholder="Search telemetry, TX hash, node ID... (⌘K)" 
              aria-label="Search dashboard and navigate routes"
              autocomplete="off"
              style="width: 100%; height: 36px; padding: 0 2.5rem 0 2.25rem; background: var(--bg-surface-low); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); color: var(--text-primary); font-size: 0.8125rem; outline: none; transition: border-color var(--transition-fast);"
            />
            <span class="search-shortcut-badge font-mono" style="position: absolute; right: 0.6rem; top: 50%; transform: translateY(-50%); padding: 0.15rem 0.4rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); font-size: 10px; color: var(--text-muted); pointer-events: none;">⌘K</span>
            <div id="search-palette-dropdown" class="search-palette-dropdown custom-scroll" style="display: none; position: absolute; top: calc(100% + 6px); left: 0; right: 0; max-height: 320px; overflow-y: auto; background: var(--bg-surface-low); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); z-index: 50; padding: 0.35rem 0;"></div>
          </div>
        </div>

        <!-- Center: Primary Context Links -->
        <nav class="topbar-center-nav" aria-label="Quick context links" style="display: flex; align-items: center; gap: 1.5rem; font-size: 0.8125rem; font-weight: 500;">
          <a href="/" class="topbar-nav-link active" data-path="/" style="color: var(--color-primary); padding-bottom: 2px; border-bottom: 2px solid var(--color-primary);">Overview</a>
          <a href="/line" class="topbar-nav-link" data-path="/line" style="color: var(--text-secondary); transition: color var(--transition-fast);">Telemetry</a>
          <a href="/geography" class="topbar-nav-link" data-path="/geography" style="color: var(--text-secondary); transition: color var(--transition-fast);">Nodes</a>
          <a href="/invoices" class="topbar-nav-link" data-path="/invoices" style="color: var(--text-secondary); transition: color var(--transition-fast);">Audit Logs</a>
        </nav>

        <!-- Right: Telemetry pill, Actions, Operator profile -->
        <div class="topbar-right" style="display: flex; align-items: center; gap: 0.85rem;">
          <div class="topbar-health-pill font-mono tabular-nums" id="topbar-health-pill" style="display: flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.65rem; border-radius: var(--radius-full); background: var(--bg-surface); border: 1px solid var(--border-subtle); font-size: 0.7rem; color: var(--color-secondary);">
            <span class="pulse-indicator" style="color: var(--color-secondary);"><span class="pulse-indicator-dot live-dot"></span></span>
            <span id="topbar-health-text">API: Live</span>
          </div>

          <!-- Utility Icons -->
          <div style="display: flex; align-items: center; gap: 0.35rem; padding-right: 0.5rem; border-right: 1px solid var(--border-subtle);">
            <button 
              type="button" 
              class="topbar-btn theme-toggle-btn" 
              id="theme-toggle" 
              aria-label="Switch to ${isDark ? "light" : "dark"} theme" 
              title="Toggle color theme"
              style="width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast);"
            >
              <span class="material-symbols-outlined theme-icon" aria-hidden="true" style="font-size: 18px;">${isDark ? "light_mode" : "dark_mode"}</span>
            </button>

            <button type="button" class="topbar-btn" id="notifications-btn" aria-label="Notifications" title="Operational alerts" style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast);">
              <span class="material-symbols-outlined" style="font-size: 18px;">notifications</span>
              <span style="position: absolute; top: 6px; right: 6px; width: 6px; height: 6px; border-radius: var(--radius-full); background: var(--color-secondary);"></span>
            </button>

            <button type="button" class="topbar-btn" id="settings-btn" aria-label="Settings" title="Workspace settings" style="width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast);">
              <span class="material-symbols-outlined" style="font-size: 18px;">settings</span>
            </button>
          </div>

          <!-- Primary CTA Action -->
          <button type="button" id="topbar-create-btn" class="topbar-create-btn" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.85rem; border-radius: var(--radius-lg); background: var(--color-primary-action); color: #ffffff; font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: background-color var(--transition-fast);">
            <span class="material-symbols-outlined" style="font-size: 16px;">add</span>
            <span>Create Resource</span>
          </button>

          <!-- System Operator Avatar Profile -->
          <div class="operator-profile" role="region" aria-label="Operator information" style="display: flex; align-items: center; gap: 0.5rem; padding-left: 0.25rem;">
            <div class="operator-avatar font-mono font-bold" aria-hidden="true" style="width: 32px; height: 32px; border-radius: var(--radius-lg); background: var(--bg-surface-high); border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center; color: var(--color-primary); font-size: 0.75rem;">OP</div>
            <div class="operator-info" style="display: flex; flex-direction: column; text-align: left;">
              <span class="operator-name font-sans font-semibold text-xs" style="color: var(--text-primary); line-height: 1.2;">System Operator</span>
              <span class="operator-role font-mono text-[10px]" style="color: var(--color-secondary);">Administrator</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Operational Settings Native Dialog -->
      <dialog id="settings-dialog" class="settings-dialog bento-card" style="padding: 1.5rem; border-radius: var(--radius-xl); background: var(--bg-surface-low); color: var(--text-primary); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-lg); max-width: 440px; width: 90%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-hairline);">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="material-symbols-outlined" style="color: var(--color-primary); font-size: 20px;">tune</span>
            <h2 class="font-sans font-bold text-base" style="margin: 0;">Workspace Preferences</h2>
          </div>
          <button type="button" id="close-settings-dialog" style="cursor: pointer; color: var(--text-muted);"><span class="material-symbols-outlined" style="font-size: 18px;">close</span></button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.8125rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="text-secondary">Environment:</span>
            <span class="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-subtle">ADMIN OPS v2.4 (Enterprise)</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="text-secondary">Color Theme:</span>
            <button type="button" id="dialog-theme-toggle" class="btn btn-secondary font-mono text-xs px-2.5 py-1 rounded border border-subtle">Toggle Theme</button>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="text-secondary">Cluster Nodes:</span>
            <span class="font-mono text-xs text-secondary" style="color: var(--color-secondary);">18 Active Nodes (18ms)</span>
          </div>
        </div>
      </dialog>
    `;
  }

  setupListeners() {
    // Mobile navigation drawer toggle (decoupled event)
    const mobileToggle = this.querySelector("#mobile-sidebar-toggle");
    if (mobileToggle) {
      mobileToggle.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("sidebar:toggle"));
      });
    }

    // Theme toggle button
    const toggleBtn = this.querySelector("#theme-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        themeManager.toggle();
      });
    }

    const dialogThemeToggle = this.querySelector("#dialog-theme-toggle");
    if (dialogThemeToggle) {
      dialogThemeToggle.addEventListener("click", () => {
        themeManager.toggle();
      });
    }

    // Subscribe to theme updates
    this.unsubscribeTheme = themeManager.subscribe((newTheme) => {
      const isDark = newTheme === THEMES.DARK;
      const btn = this.querySelector("#theme-toggle");
      const icon = this.querySelector(".theme-icon");
      if (btn && icon) {
        btn.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
        icon.textContent = isDark ? "light_mode" : "dark_mode";
      }
    });

    // Create Resource CTA navigates to /form
    const createBtn = this.querySelector("#topbar-create-btn");
    if (createBtn) {
      createBtn.addEventListener("click", () => {
        window.history.pushState({}, "", "/form");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
    }

    // Settings dialog toggle
    const settingsBtn = this.querySelector("#settings-btn");
    const settingsDialog = this.querySelector("#settings-dialog");
    const closeDialogBtn = this.querySelector("#close-settings-dialog");

    if (settingsBtn && settingsDialog) {
      settingsBtn.addEventListener("click", () => {
        if (typeof settingsDialog.showModal === "function") {
          settingsDialog.showModal();
        } else {
          settingsDialog.style.display = "block";
        }
      });
    }

    if (closeDialogBtn && settingsDialog) {
      closeDialogBtn.addEventListener("click", () => {
        if (typeof settingsDialog.close === "function") {
          settingsDialog.close();
        } else {
          settingsDialog.style.display = "none";
        }
      });
    }

    // Global ⌘K / Ctrl+K keyboard shortcut
    const searchInput = this.querySelector("#global-search-input");
    const dropdown = this.querySelector("#search-palette-dropdown");

    this._keyListener = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInput?.focus();
        this.renderSearchResults(searchInput?.value || "");
      } else if (e.key === "Escape" && dropdown) {
        dropdown.style.display = "none";
      }
    };
    window.addEventListener("keydown", this._keyListener);

    if (searchInput && dropdown) {
      searchInput.addEventListener("input", (e) => {
        this.renderSearchResults(e.target.value);
      });

      searchInput.addEventListener("focus", () => {
        this.renderSearchResults(searchInput.value);
      });

      // Dismiss dropdown on outside click
      document.addEventListener("click", (e) => {
        if (!this.contains(e.target)) {
          dropdown.style.display = "none";
        }
      });
    }
  }

  renderSearchResults(query = "") {
    const dropdown = this.querySelector("#search-palette-dropdown");
    if (!dropdown) return;

    const q = String(query).trim().toLowerCase();
    const filtered = APP_ROUTES.filter(
      (r) =>
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.keywords.toLowerCase().includes(q),
    );

    if (filtered.length === 0) {
      dropdown.innerHTML = `<div style="padding: 0.75rem; text-align: center; color: var(--text-muted); font-size: 0.75rem;">No matching routes found.</div>`;
      dropdown.style.display = "block";
      return;
    }

    dropdown.innerHTML = filtered
      .map(
        (r) => `
        <a href="${r.path}" class="search-route-item" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.85rem; color: var(--text-primary); text-decoration: none; font-size: 0.8125rem; transition: background var(--transition-fast);">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="material-symbols-outlined" style="font-size: 16px; color: var(--color-primary);">${r.icon}</span>
            <span class="font-sans font-medium">${r.title}</span>
          </div>
          <span class="font-mono text-[10px] text-muted">${r.category}</span>
        </a>
      `,
      )
      .join("");

    dropdown.querySelectorAll(".search-route-item").forEach((item) => {
      item.addEventListener("mouseenter", () => {
        item.style.background = "var(--bg-surface-high)";
      });
      item.addEventListener("mouseleave", () => {
        item.style.background = "transparent";
      });
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const href = item.getAttribute("href");
        dropdown.style.display = "none";
        if (href) {
          window.history.pushState({}, "", href);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      });
    });

    dropdown.style.display = "block";
  }

  async checkHealthStatus() {
    try {
      const health = await apiClient.getHealth();
      const healthText = this.querySelector("#topbar-health-text");
      if (healthText) {
        if (health.status === "ok") {
          const latency =
            health.database?.latencyMs != null ? `${health.database.latencyMs}ms` : "Live";
          healthText.textContent = `API: ${latency}`;
        } else {
          healthText.textContent = "API: Degraded";
        }
      }
    } catch {
      const healthText = this.querySelector("#topbar-health-text");
      if (healthText) {
        healthText.textContent = "API: Offline";
      }
    }
  }
}

if (!customElements.get("app-topbar")) {
  customElements.define("app-topbar", AppTopbar);
}
