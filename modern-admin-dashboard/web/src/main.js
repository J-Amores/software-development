import "./styles/main.css";
import { themeManager } from "./theme/index.js";
import "./components/app-shell.js";

// Initialize theme before application render
themeManager.init();

console.log("Modern Admin Dashboard web client initialized.");
