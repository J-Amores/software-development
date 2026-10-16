import { describe, it, expect, vi } from "vitest";
import { createApp } from "../src/app.js";
import { createDatabaseAdapter } from "../src/db.js";
import { createShutdownHandler } from "../src/server.js";

describe("Backend API & Health Endpoints", () => {
  describe("GET /health (Liveness Probe)", () => {
    it("responds with 200 and liveness status", async () => {
      const app = await createApp();
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toMatch(/application\/json/);

      const payload = JSON.parse(response.body);
      expect(payload.status).toBe("ok");
      expect(typeof payload.timestamp).toBe("string");
      expect(new Date(payload.timestamp).toISOString()).toBe(payload.timestamp);
    });

    it("applies CORS headers to responses", async () => {
      const app = await createApp();
      const response = await app.inject({
        method: "GET",
        url: "/health",
        headers: {
          origin: "http://localhost:5173",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBeDefined();
    });

    it("executes in-memory without binding live network ports", async () => {
      const app = await createApp();
      expect(app.server.listening).toBe(false);

      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      expect(app.server.listening).toBe(false);
    });
  });

  describe("GET /api/v1/health (Tracer-Bullet Health Probe)", () => {
    it("responds with 200 and connected status when database is reachable", async () => {
      const mockDb = {
        ping: vi.fn().mockResolvedValue({ ok: true, latencyMs: 5 }),
      };

      const app = await createApp({ db: mockDb });
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/health",
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.body);
      expect(payload.status).toBe("ok");
      expect(payload.database).toEqual({
        status: "connected",
        latencyMs: 5,
      });
      expect(mockDb.ping).toHaveBeenCalledTimes(1);
    });

    it("responds with 503 degraded status when database ping fails", async () => {
      const mockDb = {
        ping: vi.fn().mockRejectedValue(new Error("Connection timeout")),
      };

      const app = await createApp({ db: mockDb });
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/health",
      });

      expect(response.statusCode).toBe(503);
      const payload = JSON.parse(response.body);
      expect(payload.status).toBe("degraded");
      expect(payload.database.status).toBe("disconnected");
      expect(payload.database.error).toBe("Connection timeout");
    });

    it("responds with disabled database status when no adapter is configured", async () => {
      const app = await createApp();
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/health",
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.body);
      expect(payload.status).toBe("ok");
      expect(payload.database).toEqual({
        status: "disabled",
      });
    });
  });

  describe("Database Adapter Seam (createDatabaseAdapter)", () => {
    it("reads connection URI from config or environment variable", () => {
      const adapterWithConfig = createDatabaseAdapter({
        uri: "mongodb://custom-host:27017/custom_db",
      });
      expect(adapterWithConfig.uri).toBe("mongodb://custom-host:27017/custom_db");

      const adapterWithString = createDatabaseAdapter("mongodb://string-host:27017/str_db");
      expect(adapterWithString.uri).toBe("mongodb://string-host:27017/str_db");
    });

    it("manages connection lifecycle with connect() and disconnect()", async () => {
      const mockClient = {
        connect: vi.fn().mockResolvedValue(true),
        close: vi.fn().mockResolvedValue(true),
        db: vi.fn().mockReturnValue({
          command: vi.fn().mockResolvedValue({ ok: 1 }),
        }),
      };

      const adapter = createDatabaseAdapter({
        uri: "mongodb://localhost:27017/test_db",
        client: mockClient,
      });

      expect(adapter.isConnected).toBe(false);

      await adapter.connect();
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      expect(adapter.isConnected).toBe(true);

      const pingResult = await adapter.ping();
      expect(pingResult.ok).toBe(true);
      expect(typeof pingResult.latencyMs).toBe("number");

      await adapter.disconnect();
      expect(mockClient.close).toHaveBeenCalledTimes(1);
      expect(adapter.isConnected).toBe(false);
    });

    it("throws error when ping() is called before connect()", async () => {
      const adapter = createDatabaseAdapter({
        uri: "mongodb://localhost:27017/test_db",
      });

      await expect(adapter.ping()).rejects.toThrow(/not connected/i);
    });
  });

  describe("Graceful Shutdown Hooks", () => {
    it("closes Fastify server and disconnects database on shutdown signal", async () => {
      const mockApp = {
        close: vi.fn().mockResolvedValue(true),
      };
      const mockDb = {
        disconnect: vi.fn().mockResolvedValue(true),
      };
      const mockExit = vi.fn();

      const shutdown = createShutdownHandler(mockApp, mockDb, mockExit);
      await shutdown("SIGTERM");

      expect(mockApp.close).toHaveBeenCalledTimes(1);
      expect(mockDb.disconnect).toHaveBeenCalledTimes(1);
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it("prevents duplicate execution when multiple signals are received", async () => {
      const mockApp = {
        close: vi.fn().mockResolvedValue(true),
      };
      const mockDb = {
        disconnect: vi.fn().mockResolvedValue(true),
      };
      const mockExit = vi.fn();

      const shutdown = createShutdownHandler(mockApp, mockDb, mockExit);
      await Promise.all([shutdown("SIGTERM"), shutdown("SIGINT")]);

      expect(mockApp.close).toHaveBeenCalledTimes(1);
      expect(mockDb.disconnect).toHaveBeenCalledTimes(1);
      expect(mockExit).toHaveBeenCalledTimes(1);
    });
  });
});
