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
          <span class="sidebar-brand">ADMIN OPS</span>
          <button 
            type="button" 
            class="sidebar-toggle-btn" 
            id="sidebar-toggle" 
            aria-label="${this.isCollapsed ? "Expand sidebar" : "Collapse sidebar"}" 
            aria-expanded="${String(!this.isCollapsed)}"
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <div class="sidebar-section">
            <span class="sidebar-section-title">Overview</span>
            <ul class="sidebar-menu">
              <li class="sidebar-item" data-route="/">
                <a href="/">
                  <span class="sidebar-icon" aria-hidden="true">🏠</span>
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
                  <span class="sidebar-icon" aria-hidden="true">👥</span>
                  <span class="sidebar-label">Manage Team</span>
                </a>
              </li>
              <li class="sidebar-item" data-route="/contacts">
                <a href="/contacts">
                  <span class="sidebar-icon" aria-hidden="true">📇</span>
                  <span class="sidebar-label">Contacts Information</span>
                </a>
              </li>
              <li class="sidebar-item" data-route="/invoices">
                <a href="/invoices">
                  <span class="sidebar-icon" aria-hidden="true">📄</span>
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
                  <span class="sidebar-icon" aria-hidden="true">👤</span>
                  <span class="sidebar-label">Profile Form</span>
                </a>
              </li>
              <li class="sidebar-item" data-route="/calendar">
                <a href="/calendar">
                  <span class="sidebar-icon" aria-hidden="true">📅</span>
                  <span class="sidebar-label">Calendar</span>
                </a>
              </li>
              <li class="sidebar-item" data-route="/faq">
                <a href="/faq">
                  <span class="sidebar-icon" aria-hidden="true">❓</span>
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
                  <span class="sidebar-icon" aria-hidden="true">📊</span>
                  <span class="sidebar-label">Bar Chart</span>
                </a>
              </li>
              <li class="sidebar-item" data-route="/pie">
                <a href="/pie">
                  <span class="sidebar-icon" aria-hidden="true">🥧</span>
                  <span class="sidebar-label">Pie Chart</span>
                </a>
              </li>
              <li class="sidebar-item" data-route="/line">
                <a href="/line">
                  <span class="sidebar-icon" aria-hidden="true">📈</span>
                  <span class="sidebar-label">Line Chart</span>
                </a>
              </li>
              <li class="sidebar-item" data-route="/geography">
                <a href="/geography">
                  <span class="sidebar-icon" aria-hidden="true">🗺️</span>
                  <span class="sidebar-label">Geography Chart</span>
                </a>
              </li>
            </ul>
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
