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

    async getTeamMembers(params = {}) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const searchParams = new URLSearchParams();
      if (params.q) searchParams.set("q", params.q);
      if (params.sort) searchParams.set("sort", params.sort);
      if (params.order) searchParams.set("order", params.order);
      if (params.access) searchParams.set("access", params.access);

      const qs = searchParams.toString();
      const url = `${cleanBase}/api/v1/team${qs ? `?${qs}` : ""}`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "GET",
          headers: { Accept: "application/json" },
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

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },

    async updateTeamMemberAccess(id, access) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const url = `${cleanBase}/api/v1/team/${id}`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ access }),
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

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
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
    teamMembers = [
      {
        id: 1,
        name: "Jon Snow",
        email: "jonsnow@gmail.com",
        age: 35,
        phone: "(665)121-5454",
        access: "admin",
      },
      {
        id: 2,
        name: "Cersei Lannister",
        email: "cerseilannister@gmail.com",
        age: 42,
        phone: "(421)314-2288",
        access: "manager",
      },
      {
        id: 3,
        name: "Jaime Lannister",
        email: "jaimelannister@gmail.com",
        age: 45,
        phone: "(422)982-6739",
        access: "user",
      },
    ],
    shouldThrow = false,
    errorMessage = "Network request failed",
    delayMs = 0,
  } = options;

  const membersStore =
    typeof teamMembers === "function" ? null : teamMembers.map((m) => ({ ...m }));

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

    async getTeamMembers(params = {}) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      const raw = typeof teamMembers === "function" ? teamMembers() : membersStore;
      let list = raw.map((m) => ({ ...m }));

      if (params.q) {
        const qLower = params.q.toLowerCase();
        list = list.filter(
          (m) => m.name.toLowerCase().includes(qLower) || m.email.toLowerCase().includes(qLower),
        );
      }
      if (params.access) {
        list = list.filter((m) => m.access === params.access.toLowerCase());
      }
      if (params.sort) {
        const key = params.sort;
        const dir = params.order === "desc" ? -1 : 1;
        list.sort((a, b) => {
          if (a[key] < b[key]) return -1 * dir;
          if (a[key] > b[key]) return 1 * dir;
          return 0;
        });
      }

      return list;
    },

    async updateTeamMemberAccess(id, access) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      const numId = Number(id);
      const member = membersStore.find((m) => m.id === numId);
      if (!member) {
        throw new Error(`Team Member with ID ${id} not found`);
      }

      member.access = access.toLowerCase();
      return { ...member };
    },
  };
}

// Singleton default client instance for production browser runtime
export const apiClient = createApiClient();
