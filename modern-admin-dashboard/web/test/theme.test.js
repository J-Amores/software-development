// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createThemeManager, THEMES, THEME_STORAGE_KEY } from "../src/theme/index.js";

describe("ThemeManager", () => {
  let mockStorage;
  let doc;
  let win;

  beforeEach(() => {
    const store = new Map();
    mockStorage = {
      getItem: vi.fn((key) => store.get(key) || null),
      setItem: vi.fn((key, val) => store.set(key, String(val))),
      removeItem: vi.fn((key) => store.delete(key)),
      clear: vi.fn(() => store.clear()),
    };

    doc = document.implementation.createHTMLDocument("Test Document");
    win = {
      matchMedia: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
      }),
    };
  });

  it("defaults to dark theme when no preference or storage exists", () => {
    const manager = createThemeManager({
      storage: mockStorage,
      doc,
      win,
    });

    const active = manager.init();
    expect(active).toBe(THEMES.DARK);
    expect(doc.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("restores stored theme preference from localStorage", () => {
    mockStorage.getItem.mockReturnValueOnce("light");

    const manager = createThemeManager({
      storage: mockStorage,
      doc,
      win,
    });

    const active = manager.init();
    expect(active).toBe(THEMES.LIGHT);
    expect(doc.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("toggles between dark and light themes and updates storage and DOM", () => {
    const manager = createThemeManager({
      storage: mockStorage,
      doc,
      win,
    });

    manager.init();
    expect(manager.getTheme()).toBe("dark");

    const next = manager.toggle();
    expect(next).toBe("light");
    expect(doc.documentElement.getAttribute("data-theme")).toBe("light");
    expect(mockStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, "light");

    const after = manager.toggle();
    expect(after).toBe("dark");
    expect(doc.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("notifies subscribers when theme changes", () => {
    const manager = createThemeManager({
      storage: mockStorage,
      doc,
      win,
    });
    manager.init();

    const listener = vi.fn();
    const unsubscribe = manager.subscribe(listener);

    manager.toggle();
    expect(listener).toHaveBeenCalledWith("light");

    unsubscribe();
    manager.toggle();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
