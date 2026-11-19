import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * In development the browser only ever talks to this dev server. It proxies the
 * API to the backend, and sign-in to the AWS Emulator's Cognito, so no-one has to
 * install the emulator's throwaway certificate in their browser. In AWS the same
 * code calls CloudFront and real Cognito, from configuration.
 */
export default defineConfig({
  plugins: [react()],
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
