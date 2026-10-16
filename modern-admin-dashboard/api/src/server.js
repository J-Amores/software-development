import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { createDatabaseAdapter } from "./db.js";

/**
 * Creates a graceful termination signal handler that closes Fastify and disconnects
 * the database connection pool before exiting.
 *
 * @param {import('fastify').FastifyInstance} app
 * @param {{ disconnect(): Promise<void> }} [db]
 * @param {(code?: number) => void} [exitFn=process.exit]
 * @returns {(signal: string) => Promise<void>}
 */
export function createShutdownHandler(app, db, exitFn = process.exit) {
  let isShuttingDown = false;

  return async function shutdown(_signal) {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    // Flush pending requests and stop accepting new connections
    try {
      if (app && typeof app.close === "function") {
        await app.close();
      }
    } catch (error) {
      console.error("Error during HTTP server shutdown:", error);
    }

    // Cleanly close database connection pool
    try {
      if (db && typeof db.disconnect === "function") {
        await db.disconnect();
      }
    } catch (error) {
      console.error("Error during database adapter disconnect:", error);
    }

    exitFn(0);
  };
}

/**
 * Starts the HTTP server and database adapter.
 *
 * @param {Object} [options={}]
 * @param {number} [options.port]
 * @param {string} [options.host]
 * @param {string} [options.mongodbUri]
 * @param {boolean | object} [options.logger]
 * @returns {Promise<{ app: import('fastify').FastifyInstance, db: any, shutdown: Function }>}
 */
export async function startServer(options = {}) {
  const port = options.port ?? (process.env.PORT ? Number(process.env.PORT) : 8080);
  const host = options.host ?? (process.env.HOST || "0.0.0.0");
  const mongodbUri =
    options.mongodbUri ?? (process.env.MONGODB_URI || "mongodb://localhost:27017/admin_dashboard");

  const db =
    options.db ??
    (process.env.MOCK_DB === "true"
      ? {
          connect: async () => {},
          disconnect: async () => {},
          ping: async () => ({ ok: true, latencyMs: 3 }),
        }
      : createDatabaseAdapter({ uri: mongodbUri }));

  if (!options.db && process.env.MOCK_DB !== "true") {
    try {
      await db.connect();
      console.log(`Connected to database at ${mongodbUri}`);
    } catch (err) {
      console.warn(
        `Initial database connection failed: ${err.message}. Server will continue running.`,
      );
    }
  }

  const app = await createApp({
    db,
    logger: options.logger ?? true,
  });

  const shutdown = createShutdownHandler(app, db);
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  await app.listen({ port, host });
  console.log(`API server listening on http://${host}:${port}`);

  return { app, db, shutdown };
}

// Auto-run if executed directly
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer().catch((error) => {
    console.error("Fatal server startup error:", error);
    process.exit(1);
  });
}
