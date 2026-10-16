import { themeManager, THEMES } from "../theme/index.js";

/**
 * <app-topbar>
 * Light DOM Custom Element representing the administrative top navigation bar.
 */
export class AppTopbar extends HTMLElement {
  connectedCallback() {
    this.render();
    this.setupListeners();
  }

  disconnectedCallback() {
    this.unsubscribeTheme?.();
  }

  render() {
    const currentTheme = themeManager.getTheme();
    const isDark = currentTheme === THEMES.DARK;

    this.innerHTML = `
      <header class="topbar-container" role="banner">
        <div class="topbar-left">
          <div class="search-placeholder" aria-label="Search dashboard">
            <!-- Search bar or contextual breadcrumb hook -->
          </div>
        </div>
        <div class="topbar-right">
          <button 
            type="button" 
            class="topbar-btn theme-toggle-btn" 
            id="theme-toggle" 
            aria-label="Switch to ${isDark ? "light" : "dark"} theme" 
            title="Toggle color theme"
          >
            <span class="theme-icon" aria-hidden="true">${isDark ? "☀️" : "🌙"}</span>
          </button>

          <button type="button" class="topbar-btn" aria-label="Notifications">
            <span aria-hidden="true">🔔</span>
          </button>

          <button type="button" class="topbar-btn" aria-label="Settings">
            <span aria-hidden="true">⚙️</span>
          </button>

          <div class="operator-profile" role="region" aria-label="Operator information">
            <div class="operator-avatar" aria-hidden="true">OP</div>
            <div class="operator-info">
              <span class="operator-name">System Operator</span>
              <span class="operator-role">Administrator</span>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  setupListeners() {
    const toggleBtn = this.querySelector("#theme-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        themeManager.toggle();
      });
    }

    this.unsubscribeTheme = themeManager.subscribe((newTheme) => {
      const isDark = newTheme === THEMES.DARK;
      const btn = this.querySelector("#theme-toggle");
      const icon = this.querySelector(".theme-icon");
      if (btn && icon) {
        btn.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
        icon.textContent = isDark ? "☀️" : "🌙";
      }
    });
  }
}

if (!customElements.get("app-topbar")) {
  customElements.define("app-topbar", AppTopbar);
}
