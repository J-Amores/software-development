/**
 * Health routes plugin for Fastify.
 * Exposes:
 * - GET /health: Low-overhead liveness probe for Cloud Run container orchestrator
 * - GET /api/v1/health: Tracer-bullet probe verifying roundtrip database connectivity
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {{ db?: { ping(): Promise<{ ok: boolean, latencyMs: number }> } }} options
 */
export async function healthRoutes(fastify, options = {}) {
  const db = options.db || fastify.db;

  fastify.get("/health", async (_request, reply) => {
    return reply.code(200).send({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  fastify.get("/api/v1/health", async (request, reply) => {
    const timestamp = new Date().toISOString();

    if (!db) {
      return reply.code(200).send({
        status: "ok",
        timestamp,
        database: {
          status: "disabled",
        },
      });
    }

    try {
      const pingResult = await db.ping();
      return reply.code(200).send({
        status: "ok",
        timestamp,
        database: {
          status: "connected",
          latencyMs: pingResult.latencyMs,
        },
      });
    } catch (error) {
      request.log?.error?.(error, "Database health ping failed");
      return reply.code(503).send({
        status: "degraded",
        timestamp,
        database: {
          status: "disconnected",
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  });
}
