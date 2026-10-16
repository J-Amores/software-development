import "./app-topbar.js";
import "./app-sidebar.js";

/**
 * <app-shell>
 * Light DOM Custom Element coordinating the administrative layout grid.
 */
export class AppShell extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="app-layout">
        <app-sidebar></app-sidebar>
        <div class="app-main">
          <app-topbar></app-topbar>
          <main class="app-content" id="view-container" role="main" aria-label="Main Content">
            <!-- Active view mounts here -->
          </main>
        </div>
      </div>
    `;
  }

  /**
   * Returns the view container element where scenes mount.
   *
   * @returns {HTMLElement | null}
   */
  getViewContainer() {
    return this.querySelector("#view-container");
  }

  /**
   * Returns the sidebar element.
   *
   * @returns {import('./app-sidebar.js').AppSidebar | null}
   */
  getSidebar() {
    return this.querySelector("app-sidebar");
  }
}

if (!customElements.get("app-shell")) {
  customElements.define("app-shell", AppShell);
}
