/**
 * Deep Client-Side Router Module
 * Exposes a 2-method interface: init(routes, options) and navigate(path, options).
 */

export class NotFoundView {
  constructor(path) {
    this.path = path;
    this.container = null;
    this.element = null;
  }

  mount(container) {
    this.container = container;
    this.element = document.createElement("section");
    this.element.className = "scene-view not-found-scene";
    this.element.innerHTML = `
      <header class="scene-header">
        <h1 class="scene-title">Page Not Found (404)</h1>
        <p class="scene-subtitle">The requested route <code>${this.path}</code> does not exist.</p>
      </header>
      <div class="scene-body">
        <div class="placeholder-card">
          <p><a href="/" class="return-home-link">← Return to Administrative Dashboard</a></p>
        </div>
      </div>
    `;
    this.container.innerHTML = "";
    this.container.appendChild(this.element);
  }

  unmount() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
    this.container = null;
    this.element = null;
  }
}

/**
 * Creates a router instance.
 *
 * @param {Object} [config={}]
 * @param {Window} [config.win=window]
 * @param {Document} [config.doc=document]
 * @returns {Router}
 */
export function createRouter(config = {}) {
  const win = config.win || (typeof window !== "undefined" ? window : null);
  const doc = config.doc || (typeof document !== "undefined" ? document : null);

  let routeTable = {};
  let targetContainer = null;
  let activeView = null;
  let currentPath = "/";
  let getSidebarElement = null;

  /**
   * Mounts the view for a given path into the container.
   *
   * @param {string} path
   */
  function renderRoute(path) {
    currentPath = path;

    // Unmount previous view
    if (activeView && typeof activeView.unmount === "function") {
      try {
        activeView.unmount();
      } catch (err) {
        console.error("Error unmounting previous view:", err);
      }
    }

    if (!targetContainer) {
      return;
    }

    // Resolve matching view factory or 404
    const viewFactory = routeTable[path];
    if (typeof viewFactory === "function") {
      activeView = viewFactory();
    } else {
      activeView = new NotFoundView(path);
    }

    // Mount new view
    if (activeView && typeof activeView.mount === "function") {
      activeView.mount(targetContainer);
    }

    // Synchronize sidebar active state
    try {
      const sidebar = getSidebarElement ? getSidebarElement() : doc?.querySelector("app-sidebar");
      if (sidebar && typeof sidebar.setActiveRoute === "function") {
        sidebar.setActiveRoute(path);
      }
    } catch {
      // Ignore sidebar update errors
    }
  }

  /**
   * Global click interception handler for internal anchor links.
   *
   * @param {MouseEvent} event
   */
  function handleLinkClick(event) {
    // Only handle primary button clicks without modifier keys
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    // Walk up the target tree to find an anchor tag
    const target = event.composedPath ? event.composedPath()[0] : event.target;
    const anchor = target?.closest ? target.closest("a") : null;

    if (!anchor) {
      return;
    }

    const href = anchor.getAttribute("href");
    const targetAttr = anchor.getAttribute("target");
    const download = anchor.getAttribute("download");

    // Skip external links, new tabs, downloads, or non-relative paths
    if (
      !href ||
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      targetAttr === "_blank" ||
      download !== null
    ) {
      return;
    }

    event.preventDefault();
    router.navigate(href);
  }

  /**
   * Browser popstate handler for back/forward navigation.
   */
  function handlePopState() {
    const path = win?.location?.pathname || "/";
    renderRoute(path);
  }

  const router = {
    /**
     * Initializes the router, attaches event listeners, and mounts initial route.
     *
     * @param {Record<string, () => any>} routes
     * @param {Object} [options={}]
     * @param {HTMLElement | (() => HTMLElement | null)} options.container
     * @param {() => any} [options.getSidebar]
     */
    init(routes, options = {}) {
      routeTable = routes || {};
      getSidebarElement = options.getSidebar || null;

      if (typeof options.container === "function") {
        targetContainer = options.container();
      } else {
        targetContainer = options.container || doc?.querySelector("#view-container");
      }

      // Attach event listeners
      win?.addEventListener?.("popstate", handlePopState);
      doc?.addEventListener?.("click", handleLinkClick);

      // Render initial path
      const initialPath = win?.location?.pathname || "/";
      renderRoute(initialPath);

      return router;
    },

    /**
     * Programmatic navigation.
     *
     * @param {string} path
     * @param {Object} [navOptions={}]
     * @param {boolean} [navOptions.replace=false]
     */
    navigate(path, navOptions = {}) {
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;

      if (win?.history) {
        if (navOptions.replace) {
          win.history.replaceState({}, "", normalizedPath);
        } else {
          win.history.pushState({}, "", normalizedPath);
        }
      }

      renderRoute(normalizedPath);
    },

    /**
     * Returns the currently active path.
     *
     * @returns {string}
     */
    getCurrentPath() {
      return currentPath;
    },

    /**
     * Returns the currently mounted view instance.
     *
     * @returns {any}
     */
    getCurrentView() {
      return activeView;
    },

    /**
     * Teardown event listeners (useful for testing).
     */
    destroy() {
      win?.removeEventListener?.("popstate", handlePopState);
      doc?.removeEventListener?.("click", handleLinkClick);
      if (activeView && typeof activeView.unmount === "function") {
        activeView.unmount();
      }
      activeView = null;
      targetContainer = null;
    },
  };

  return router;
}

export const router = createRouter();
