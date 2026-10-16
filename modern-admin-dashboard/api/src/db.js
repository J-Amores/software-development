import { MongoClient } from "mongodb";

/**
 * Creates a database adapter encapsulating MongoDB connection lifecycle,
 * connection pooling, and ping health verification.
 *
 * @param {string | { uri?: string, client?: any, options?: Record<string, any> }} [config={}]
 * @returns {{
 *   readonly uri: string,
 *   readonly isConnected: boolean,
 *   getClient(): MongoClient | null,
 *   connect(): Promise<MongoClient>,
 *   disconnect(): Promise<void>,
 *   ping(): Promise<{ ok: boolean, latencyMs: number }>
 * }}
 */
export function createDatabaseAdapter(config = {}) {
  const uri =
    typeof config === "string"
      ? config
      : config?.uri || process.env.MONGODB_URI || "mongodb://localhost:27017/admin_dashboard";

  const options = (typeof config === "object" && config?.options) || {};
  let client = (typeof config === "object" && config?.client) || null;
  let isConnected = false;

  return {
    get uri() {
      return uri;
    },
    get isConnected() {
      return isConnected;
    },
    getClient() {
      return client;
    },
    async connect() {
      if (isConnected && client) {
        return client;
      }

      if (!client) {
        client = new MongoClient(uri, {
          maxPoolSize: 10,
          minPoolSize: 2,
          serverSelectionTimeoutMS: 5000,
          ...options,
        });
      }

      await client.connect();
      isConnected = true;
      return client;
    },
    async disconnect() {
      if (client) {
        await client.close();
        isConnected = false;
        client = null;
      }
    },
    async ping() {
      if (!client || !isConnected) {
        throw new Error("Database adapter is not connected");
      }

      const start = Date.now();
      await client.db().command({ ping: 1 });
      const latencyMs = Date.now() - start;

      return {
        ok: true,
        latencyMs,
      };
    },
  };
}
