/**
 * <app-sidebar>
 * Light DOM Custom Element representing the collapsible administrative navigation sidebar.
 */
export class AppSidebar extends HTMLElement {
  constructor() {
    super();
    this.isCollapsed = false;
  }

  connectedCallback() {
    this.render();
    this.setupListeners();
    this._sidebarToggleHandler = () => {
      const isOpen = this.classList.toggle("drawer-open");
      const backdrop = document.querySelector("#sidebar-backdrop");
      if (backdrop) {
        backdrop.classList.toggle("active", isOpen);
      }
    };
    window.addEventListener("sidebar:toggle", this._sidebarToggleHandler);
  }

  disconnectedCallback() {
    if (this._sidebarToggleHandler) {
      window.removeEventListener("sidebar:toggle", this._sidebarToggleHandler);
      this._sidebarToggleHandler = null;
    }
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    const container = this.querySelector(".sidebar-container");
    if (container) {
      container.classList.toggle("collapsed", this.isCollapsed);
    }

    const toggleBtn = this.querySelector("#sidebar-toggle");
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-expanded", String(!this.isCollapsed));
      toggleBtn.setAttribute(
        "aria-label",
        this.isCollapsed ? "Expand sidebar" : "Collapse sidebar",
      );
    }

    this.dispatchEvent(
      new CustomEvent("sidebar-toggle", {
        detail: { collapsed: this.isCollapsed },
        bubbles: true,
      }),
    );
  }

  render() {
    this.innerHTML = `
      <aside class="sidebar-container ${this.isCollapsed ? "collapsed" : ""}" role="navigation" aria-label="Main Navigation">
        <div class="sidebar-header">
          <div class="sidebar-brand-wrapper">
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span class="pulse-indicator" style="color: var(--color-secondary);"><span class="pulse-indicator-dot live-dot"></span></span>
              <span class="sidebar-brand font-mono font-bold tracking-wider">ADMIN OPS</span>
            </div>
            <div class="sidebar-brand-subtitle font-mono text-muted">Enterprise Suite • v3.2</div>
          </div>
          <button 
            type="button" 
            class="sidebar-toggle-btn" 
            id="sidebar-toggle" 
            aria-label="${this.isCollapsed ? "Expand sidebar" : "Collapse sidebar"}" 
            aria-expanded="${String(!this.isCollapsed)}"
          >
            <span class="material-symbols-outlined" style="font-size: 18px;">menu</span>
          </button>
        </div>

        <nav class="sidebar-nav custom-scroll">
          <div class="sidebar-section">
            <span class="sidebar-section-title">Overview</span>
            <ul class="sidebar-menu">
              <li class="sidebar-item" data-route="/">
                <a href="/">
                  <span class="material-symbols-outlined sidebar-icon" aria-hidden="true">dashboard</span>
                  <span class="sidebar-label">Dashboard</span>
                </a>
              </li>
            </ul>
          </div>

          <div class="sidebar-section">
            <span class="sidebar-section-title">Data Management</span>
            <ul class="sidebar-menu">
              <li class="sidebar-item" data-route="/team">
                <a href="/team">
                  <span class="material-symbols-outlined sidebar-icon" aria-hidden="true">group</span>
                  <span class="sidebar-label">Manage Team</span>
                </a>
              </li>
              <li class="sidebar-item" data-route="/contacts">
                <a href="/contacts">
                  <span class="material-symbols-outlined sidebar-icon" aria-hidden="true">contacts</span>
                  <span class="sidebar-label">Contacts Information</span>
                </a>
              </li>
              <li class="sidebar-item" data-route="/invoices">
                <a href="/invoices">
                  <span class="material-symbols-outlined sidebar-icon" aria-hidden="true">receipt_long</span>
                  <span class="sidebar-label">Invoices Balances</span>
                </a>
              </li>
            </ul>
          </div>

          <div class="sidebar-section">
            <span class="sidebar-section-title">Pages</span>
            <ul class="sidebar-menu">
              <li class="sidebar-item" data-route="/form">
                <a href="/form">
                  <span class="material-symbols-outlined sidebar-icon" aria-hidden="true">person</span>
                  <span class="sidebar-label">Profile Form</span>
                </a>
              </li>
              <li class="sidebar-item" data-route="/calendar">
                <a href="/calendar">
                  <span class="material-symbols-outlined sidebar-icon" aria-hidden="true">calendar_today</span>
                  <span class="sidebar-label">Calendar</span>
                </a>
              </li>
              <li class="sidebar-item" data-route="/faq">
                <a href="/faq">
                  <span class="material-symbols-outlined sidebar-icon" aria-hidden="true">help_outline</span>
                  <span class="sidebar-label">FAQ Page</span>
                </a>
              </li>
            </ul>
          </div>

          <div class="sidebar-section">
            <span class="sidebar-section-title">Charts & Analytics</span>
            <ul class="sidebar-menu">
              <li class="sidebar-item" data-route="/bar">
                <a href="/bar">
                  <span class="material-symbols-outlined sidebar-icon" aria-hidden="true">bar_chart</span>
                  <span class="sidebar-label">Bar Chart</span>
                </a>
              </li>
              <li class="sidebar-item" data-route="/pie">
                <a href="/pie">
                  <span class="material-symbols-outlined sidebar-icon" aria-hidden="true">pie_chart</span>
                  <span class="sidebar-label">Pie Chart</span>
                </a>
              </li>
              <li class="sidebar-item" data-route="/line">
                <a href="/line">
                  <span class="material-symbols-outlined sidebar-icon" aria-hidden="true">show_chart</span>
                  <span class="sidebar-label">Line Chart</span>
                </a>
              </li>
              <li class="sidebar-item" data-route="/geography">
                <a href="/geography">
                  <span class="material-symbols-outlined sidebar-icon" aria-hidden="true">public</span>
                  <span class="sidebar-label">Geography Chart</span>
                </a>
              </li>
            </ul>
          </div>

          <div class="sidebar-footer">
            <a href="/form" class="sidebar-cta-btn specular-border">
              <span class="material-symbols-outlined" style="font-size: 16px; color: var(--color-secondary);">add_circle</span>
              <span class="sidebar-label">Deploy Node</span>
            </a>
            <div class="sidebar-footer-links">
              <a href="/faq" class="sidebar-footer-link" title="Documentation">
                <span class="material-symbols-outlined" style="font-size: 16px;">menu_book</span>
                <span class="sidebar-label">Docs</span>
              </a>
              <button type="button" class="sidebar-footer-link" id="sidebar-settings-btn" title="Settings">
                <span class="material-symbols-outlined" style="font-size: 16px;">settings</span>
                <span class="sidebar-label">Settings</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>
    `;
  }

  setupListeners() {
    const toggleBtn = this.querySelector("#sidebar-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => this.toggleCollapse());
    }

    const settingsBtn = this.querySelector("#sidebar-settings-btn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        const topbar = document.querySelector("app-topbar");
        const settingsDialog = topbar?.querySelector("#settings-dialog");
        if (settingsDialog && typeof settingsDialog.showModal === "function") {
          settingsDialog.showModal();
        }
      });
    }
  }

  /**
   * Updates the active menu item based on current pathname.
   *
   * @param {string} path
   */
  setActiveRoute(path) {
    const items = this.querySelectorAll(".sidebar-item");
    items.forEach((item) => {
      const route = item.getAttribute("data-route");
      if (route === path) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }
}

if (!customElements.get("app-sidebar")) {
  customElements.define("app-sidebar", AppSidebar);
}
