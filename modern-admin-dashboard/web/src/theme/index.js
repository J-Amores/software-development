/**
 * ThemeManager
 * Deep module encapsulating theme state, persistence, and OS preference detection.
 */

export const THEME_STORAGE_KEY = "admin-dashboard-theme";
export const THEMES = {
  DARK: "dark",
  LIGHT: "light",
};

/**
 * Creates a theme manager instance.
 *
 * @param {Object} [options={}]
 * @param {string} [options.storageKey=THEME_STORAGE_KEY]
 * @param {Storage} [options.storage=localStorage]
 * @param {Document} [options.doc=document]
 * @param {Window} [options.win=window]
 * @returns {ThemeManager}
 */
export function createThemeManager(options = {}) {
  const storageKey = options.storageKey || THEME_STORAGE_KEY;
  const storage =
    options.storage !== undefined
      ? options.storage
      : typeof localStorage !== "undefined"
        ? localStorage
        : null;
  const doc = options.doc || (typeof document !== "undefined" ? document : null);
  const win = options.win || (typeof window !== "undefined" ? window : null);

  const listeners = new Set();
  let currentTheme = THEMES.DARK;

  /**
   * Resolve initial theme from storage or system preferences.
   *
   * @returns {"dark" | "light"}
   */
  function resolveInitialTheme() {
    try {
      const stored = storage?.getItem(storageKey);
      if (stored === THEMES.DARK || stored === THEMES.LIGHT) {
        return stored;
      }
    } catch {
      // Fallback on storage read errors
    }

    try {
      if (win?.matchMedia && win.matchMedia("(prefers-color-scheme: light)").matches) {
        return THEMES.LIGHT;
      }
    } catch {
      // Fallback on media query errors
    }

    return THEMES.DARK;
  }

  /**
   * Applies the theme attribute to the document root and persists.
   *
   * @param {"dark" | "light"} theme
   */
  function applyTheme(theme) {
    currentTheme = theme;

    if (doc?.documentElement) {
      doc.documentElement.setAttribute("data-theme", theme);
    }

    try {
      storage?.setItem(storageKey, theme);
    } catch {
      // Ignore storage write errors (e.g., incognito limits)
    }

    listeners.forEach((listener) => {
      try {
        listener(theme);
      } catch (err) {
        console.error("Theme listener error:", err);
      }
    });
  }

  return {
    /**
     * Initializes theme on page load.
     *
     * @returns {"dark" | "light"}
     */
    init() {
      const initial = resolveInitialTheme();
      applyTheme(initial);

      // Listen for system preference changes if user hasn't explicitly set a stored preference
      try {
        const mediaQuery = win?.matchMedia?.("(prefers-color-scheme: light)");
        if (mediaQuery && typeof mediaQuery.addEventListener === "function") {
          mediaQuery.addEventListener("change", (e) => {
            const hasStoredPreference = storage?.getItem(storageKey);
            if (!hasStoredPreference) {
              applyTheme(e.matches ? THEMES.LIGHT : THEMES.DARK);
            }
          });
        }
      } catch {
        // Fallback for environments lacking matchMedia
      }

      return currentTheme;
    },

    /**
     * Get the active theme.
     *
     * @returns {"dark" | "light"}
     */
    getTheme() {
      if (doc?.documentElement?.getAttribute("data-theme")) {
        currentTheme = doc.documentElement.getAttribute("data-theme");
      }
      return currentTheme;
    },

    /**
     * Set a specific theme.
     *
     * @param {"dark" | "light"} theme
     */
    setTheme(theme) {
      const target = theme === THEMES.LIGHT ? THEMES.LIGHT : THEMES.DARK;
      applyTheme(target);
    },

    /**
     * Toggle between dark and light themes.
     *
     * @returns {"dark" | "light"}
     */
    toggle() {
      const next = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
      applyTheme(next);
      return next;
    },

    /**
     * Subscribe to theme change events.
     *
     * @param {(theme: "dark" | "light") => void} listener
     * @returns {() => void} Unsubscribe function
     */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const themeManager = createThemeManager();
