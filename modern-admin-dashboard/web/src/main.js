import "./styles/main.css";
import { themeManager } from "./theme/index.js";
import "./components/app-shell.js";
import { router } from "./router/index.js";
import { routes } from "./routes.js";

// Initialize theme before application render
themeManager.init();

// Initialize router when app shell is ready
function initApp() {
  const shell = document.querySelector("app-shell");
  const container = shell?.getViewContainer() || document.querySelector("#view-container");

  router.init(routes, {
    container,
    getSidebar: () => shell?.getSidebar() || document.querySelector("app-sidebar"),
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

console.log("Modern Admin Dashboard web client initialized.");
