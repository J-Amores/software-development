/**
 * Metrics Routes (/api/v1/metrics)
 * Fastify plugin providing isolated visualization dataset retrieval.
 */

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} [opts={}]
 */
export async function metricsRoutes(fastify, opts = {}) {
  const db = opts.db || fastify.db;

  function getRawDb() {
    if (!db) {
      throw new Error("Database adapter is not configured");
    }
    return typeof db.getDb === "function" ? db.getDb() : db;
  }

  function getMetricsCollection() {
    return getRawDb().collection("metrics");
  }

  // GET /api/v1/metrics/:dataset
  fastify.get(
    "/api/v1/metrics/:dataset",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            dataset: {
              type: "string",
              enum: ["bar", "pie", "line", "geography"],
            },
          },
          required: ["dataset"],
        },
      },
    },
    async (request, reply) => {
      const { dataset } = request.params;
      const collection = getMetricsCollection();

      const metric = await collection.findOne({ metricKey: dataset });
      if (!metric) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: `Metric dataset '${dataset}' not found`,
        });
      }

      const { _id, ...cleanMetric } = metric;
      return cleanMetric;
    },
  );
}

export default metricsRoutes;
