// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRouter } from "../src/router/index.js";

describe("Client-Side Router", () => {
  let container;
  let router;
  let testRoutes;
  let mockWin;
  let mockDoc;
  let unmountSpy;

  beforeEach(() => {
    mockDoc = document.implementation.createHTMLDocument("Router Test");
    container = mockDoc.createElement("div");
    container.id = "view-container";
    mockDoc.body.appendChild(container);

    unmountSpy = vi.fn();

    const homeView = {
      mount: vi.fn((el) => {
        el.innerHTML = "<h1>Home View</h1>";
      }),
      unmount: unmountSpy,
    };

    const teamView = {
      mount: vi.fn((el) => {
        el.innerHTML = "<h1>Team View</h1>";
      }),
      unmount: vi.fn(),
    };

    testRoutes = {
      "/": () => homeView,
      "/team": () => teamView,
    };

    mockWin = {
      location: { pathname: "/" },
      history: {
        pushState: vi.fn((_state, _title, url) => {
          mockWin.location.pathname = url;
        }),
        replaceState: vi.fn((_state, _title, url) => {
          mockWin.location.pathname = url;
        }),
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    router = createRouter({ win: mockWin, doc: mockDoc });
  });

  afterEach(() => {
    router.destroy();
  });

  it("mounts the initial route on init", () => {
    router.init(testRoutes, { container });

    expect(router.getCurrentPath()).toBe("/");
    expect(container.innerHTML).toContain("Home View");
  });

  it("navigates to a new route, updates history, and mounts new view", () => {
    router.init(testRoutes, { container });

    router.navigate("/team");

    expect(mockWin.history.pushState).toHaveBeenCalledWith({}, "", "/team");
    expect(router.getCurrentPath()).toBe("/team");
    expect(container.innerHTML).toContain("Team View");
  });

  it("invokes unmount on the previous view when transitioning routes", () => {
    router.init(testRoutes, { container });
    expect(unmountSpy).not.toHaveBeenCalled();

    router.navigate("/team");
    expect(unmountSpy).toHaveBeenCalledTimes(1);
  });

  it("renders 404 NotFoundView when navigating to an undefined route", () => {
    router.init(testRoutes, { container });

    router.navigate("/non-existent");
    expect(router.getCurrentPath()).toBe("/non-existent");
    expect(container.innerHTML).toContain("Page Not Found (404)");
  });

  it("intercepts internal anchor tag clicks via event delegation", () => {
    // Test with real DOM
    document.body.innerHTML = '<div id="container"></div><a id="test-link" href="/team">Team</a>';
    const testContainer = document.querySelector("#container");
    const testLink = document.querySelector("#test-link");

    const liveRouter = createRouter({ win: window, doc: document });
    liveRouter.init(testRoutes, { container: testContainer });

    expect(liveRouter.getCurrentPath()).toBe("/");

    testLink.click();

    expect(liveRouter.getCurrentPath()).toBe("/team");
    expect(testContainer.innerHTML).toContain("Team View");

    liveRouter.destroy();
  });
});
