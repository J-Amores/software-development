/**
 * API Client Adapter Module
 * Provides an injectable seam for making requests to the backend API.
 * Supports both network fetch adapter and in-memory fake client adapter for tests.
 */

/**
 * Creates a network-backed API client adapter.
 *
 * @param {Object} [options={}]
 * @param {string} [options.baseUrl] - Base API URL (e.g., http://localhost:8080)
 * @param {typeof fetch} [options.fetchFn] - Fetch implementation (defaults to global fetch)
 * @returns {{ getHealth(): Promise<any> }}
 */
export function createApiClient(options = {}) {
  const baseUrl =
    options.baseUrl ??
    (typeof window !== "undefined" && window.__API_BASE_URL__
      ? window.__API_BASE_URL__
      : "http://localhost:8080");

  const fetchFn =
    options.fetchFn ?? (typeof fetch !== "undefined" ? fetch.bind(globalThis) : undefined);

  return {
    async getHealth() {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const url = `${cleanBase}/api/v1/health`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      // 200 OK and 503 Service Unavailable (degraded health check) both carry structured health JSON payloads
      if (!response.ok && response.status !== 503) {
        throw new Error(`API error: ${response.status} ${response.statusText || ""}`.trim());
      }

      return data;
    },
  };
}

/**
 * Creates an in-memory fake API client for component and route tests.
 *
 * @param {Object} [options={}]
 * @param {any | (() => any)} [options.healthResponse] - Data or generator function returning health payload
 * @param {boolean} [options.shouldThrow=false] - Whether to simulate network rejection
 * @param {string} [options.errorMessage="Network request failed"] - Error message when rejecting
 * @param {number} [options.delayMs=0] - Optional latency delay simulation
 * @returns {{ getHealth(): Promise<any> }}
 */
export function createFakeApiClient(options = {}) {
  const {
    healthResponse = {
      status: "ok",
      environment: "test",
      timestamp: new Date().toISOString(),
      database: {
        status: "connected",
        latencyMs: 1,
      },
    },
    shouldThrow = false,
    errorMessage = "Network request failed",
    delayMs = 0,
  } = options;

  return {
    async getHealth() {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }
      return typeof healthResponse === "function" ? healthResponse() : healthResponse;
    },
  };
}

// Singleton default client instance for production browser runtime
export const apiClient = createApiClient();
