// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { themeManager, THEMES } from "../src/theme/index.js";
import "../src/components/app-topbar.js";
import "../src/components/app-sidebar.js";
import "../src/components/app-shell.js";

describe("Frontend App Shell Components", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    themeManager.setTheme(THEMES.DARK);
  });

  describe("<app-topbar>", () => {
    it("renders operator profile and theme toggle button", () => {
      const topbar = document.createElement("app-topbar");
      document.body.appendChild(topbar);

      const toggleBtn = topbar.querySelector("#theme-toggle");
      expect(toggleBtn).not.toBeNull();

      const operatorName = topbar.querySelector(".operator-name");
      expect(operatorName?.textContent).toContain("System Operator");

      const operatorRole = topbar.querySelector(".operator-role");
      expect(operatorRole?.textContent).toContain("Administrator");
    });

    it("toggles theme when theme toggle button is clicked", () => {
      const topbar = document.createElement("app-topbar");
      document.body.appendChild(topbar);

      expect(themeManager.getTheme()).toBe(THEMES.DARK);

      const toggleBtn = topbar.querySelector("#theme-toggle");
      toggleBtn.click();

      expect(themeManager.getTheme()).toBe(THEMES.LIGHT);
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
      expect(toggleBtn.getAttribute("aria-label")).toContain("dark");
    });
  });

  describe("<app-sidebar>", () => {
    it("renders navigation sections and route links", () => {
      const sidebar = document.createElement("app-sidebar");
      document.body.appendChild(sidebar);

      const links = sidebar.querySelectorAll("a");
      const hrefs = Array.from(links).map((a) => a.getAttribute("href"));

      expect(hrefs).toContain("/");
      expect(hrefs).toContain("/team");
      expect(hrefs).toContain("/contacts");
      expect(hrefs).toContain("/invoices");
      expect(hrefs).toContain("/form");
      expect(hrefs).toContain("/calendar");
      expect(hrefs).toContain("/faq");
      expect(hrefs).toContain("/bar");
      expect(hrefs).toContain("/pie");
      expect(hrefs).toContain("/line");
      expect(hrefs).toContain("/geography");
    });

    it("toggles collapsed state and emits sidebar-toggle event", () => {
      const sidebar = document.createElement("app-sidebar");
      document.body.appendChild(sidebar);

      let eventFired = false;
      let isCollapsedState = false;

      sidebar.addEventListener("sidebar-toggle", (e) => {
        eventFired = true;
        isCollapsedState = e.detail.collapsed;
      });

      const container = sidebar.querySelector(".sidebar-container");
      expect(container.classList.contains("collapsed")).toBe(false);

      const toggleBtn = sidebar.querySelector("#sidebar-toggle");
      toggleBtn.click();

      expect(container.classList.contains("collapsed")).toBe(true);
      expect(eventFired).toBe(true);
      expect(isCollapsedState).toBe(true);

      toggleBtn.click();
      expect(container.classList.contains("collapsed")).toBe(false);
      expect(isCollapsedState).toBe(false);
    });
  });

  describe("<app-shell>", () => {
    it("coordinates sidebar, topbar, and view container in Light DOM", () => {
      const shell = document.createElement("app-shell");
      document.body.appendChild(shell);

      expect(shell.shadowRoot).toBeNull(); // Strictly no Shadow DOM
      expect(shell.querySelector("app-sidebar")).not.toBeNull();
      expect(shell.querySelector("app-topbar")).not.toBeNull();

      const viewContainer = shell.getViewContainer();
      expect(viewContainer).not.toBeNull();
      expect(viewContainer.id).toBe("view-container");
    });
  });
});
