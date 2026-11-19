import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * In development the browser only ever talks to this dev server. It proxies the
 * API to the backend, and sign-in to the AWS Emulator's Cognito, so no-one has to
 * install the emulator's throwaway certificate in their browser. In AWS the same
 * code calls CloudFront and real Cognito, from configuration.
 *
 * The `test` block is seam 3 (Testing Decisions): screens are rendered in a DOM
 * and acted on as a user would, against the mock generated from the contract. It
 * lives here rather than in its own file so that the tests see the same plugins,
 * and so that one command's worth of configuration is not split in two.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // The one import alias, which is also what `components.json` tells the shadcn
    // CLI to write into every component it adds.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    // The app calls the API at the relative path `/api`, so the document needs an
    // origin for that path to resolve against. It is deliberately an origin
    // nothing listens on, so a request that escapes the mock fails rather than
    // reaching a development server that happens to be running.
    environmentOptions: { jsdom: { url: "http://tuition.test/" } },
    // Node's `Request` refuses a relative URL, so under test the API's address is
    // the same path on the document's own origin, spelled out.
    env: { VITE_API_BASE_URL: "http://tuition.test/api" },
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // `expect`, `describe` and `it` are imported, so that a test file says where
    // everything in it comes from.
    globals: false,
    restoreMocks: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/cognito": {
        target: "https://localhost:9297",
        changeOrigin: true,
        // Development only: the emulator signs with a certificate it generates
        // fresh on every start, and this proxy runs on the developer's machine.
        secure: false,
        rewrite: (path) => path.replace(/^\/cognito/, ""),
      },
    },
  },
});
