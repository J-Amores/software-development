import "./app-topbar.js";
import "./app-sidebar.js";

/**
 * <app-shell>
 * Light DOM Custom Element coordinating the administrative layout grid.
 */
export class AppShell extends HTMLElement {
  connectedCallback() {
    this.render();
    this.startClock();
    this.setupBackdrop();
  }

  disconnectedCallback() {
    if (this._clockTimer) {
      clearInterval(this._clockTimer);
      this._clockTimer = null;
    }
  }

  setupBackdrop() {
    const backdrop = this.querySelector("#sidebar-backdrop");
    if (!backdrop) return;
    backdrop.addEventListener("click", () => {
      const sidebar = this.querySelector("app-sidebar");
      if (sidebar) {
        sidebar.classList.remove("drawer-open");
      }
      backdrop.classList.remove("active");
    });
  }

  startClock() {
    const clockEl = this.querySelector("#footer-live-clock");
    if (!clockEl) return;
    const update = () => {
      try {
        const d = new Date();
        clockEl.textContent = `UTC ${d.toISOString().slice(11, 19)}`;
      } catch {
        // Fallback
      }
    };
    update();
    this._clockTimer = setInterval(update, 1000);
  }

  render() {
    this.innerHTML = `
      <div class="app-layout">
        <div id="sidebar-backdrop" class="sidebar-backdrop" aria-hidden="true"></div>
        <app-sidebar></app-sidebar>
        <div class="app-main">
          <app-topbar></app-topbar>
          <main class="app-content" id="view-container" role="main" aria-label="Main Content">
            <!-- Active view mounts here -->
          </main>
          <footer class="app-global-footer" role="contentinfo" aria-label="Global system status">
            <div class="footer-left">
              <span class="footer-status-pill">
                <span class="pulse-indicator-dot live-dot" style="background: var(--color-secondary);"></span>
                <span id="footer-system-status">System Operational</span>
              </span>
            </div>
            <div class="footer-right font-mono tabular-nums" style="font-size: 0.7rem;">
              <span id="footer-live-clock" style="color: var(--color-secondary);">UTC --:--:--</span>
            </div>
          </footer>
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
