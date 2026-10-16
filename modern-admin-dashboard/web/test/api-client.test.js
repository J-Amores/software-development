// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { createApiClient, createFakeApiClient } from "../src/api/index.js";

describe("Frontend API Client Adapter Seam", () => {
  describe("createApiClient", () => {
    it("fetches /api/v1/health and returns parsed JSON on 200 OK", async () => {
      const mockResponseData = {
        status: "ok",
        environment: "development",
        timestamp: "2026-10-16T09:00:00.000Z",
        database: {
          status: "connected",
          latencyMs: 8,
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockResponseData),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.getHealth();

      expect(mockFetch).toHaveBeenCalledWith("http://api.local:8080/api/v1/health", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      expect(result).toEqual(mockResponseData);
    });

    it("parses and returns 503 degraded health response payload", async () => {
      const degradedResponseData = {
        status: "degraded",
        environment: "production",
        timestamp: "2026-10-16T09:00:00.000Z",
        database: {
          status: "disconnected",
          error: "Connection timeout",
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: vi.fn().mockResolvedValue(degradedResponseData),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.getHealth();
      expect(result).toEqual(degradedResponseData);
    });

    it("throws descriptive error when network fetch fails", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      await expect(client.getHealth()).rejects.toThrow(/failed to reach api/i);
    });

    it("throws descriptive error on unexpected HTTP error codes", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: vi.fn().mockResolvedValue({ error: "Fatal crash" }),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      await expect(client.getHealth()).rejects.toThrow(/api error: 500/i);
    });
  });

  describe("createFakeApiClient", () => {
    it("returns mock health data in memory without network calls", async () => {
      const fakeClient = createFakeApiClient({
        healthResponse: {
          status: "ok",
          environment: "test",
          timestamp: "2026-10-16T09:00:00.000Z",
          database: {
            status: "connected",
            latencyMs: 2,
          },
        },
      });

      const result = await fakeClient.getHealth();
      expect(result.status).toBe("ok");
      expect(result.database.latencyMs).toBe(2);
    });

    it("simulates network errors when configured with shouldThrow", async () => {
      const fakeClient = createFakeApiClient({
        shouldThrow: true,
        errorMessage: "Simulated offline error",
      });

      await expect(fakeClient.getHealth()).rejects.toThrow("Simulated offline error");
    });
  });
});
