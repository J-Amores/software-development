/**
 * Transactions Routes (/api/v1/transactions)
 * Fastify plugin providing commercial transaction queries.
 */

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} [opts={}]
 */
export async function transactionsRoutes(fastify, opts = {}) {
  const db = opts.db || fastify.db;

  function getRawDb() {
    if (!db) {
      throw new Error("Database adapter is not configured");
    }
    return typeof db.getDb === "function" ? db.getDb() : db;
  }

  function getTransactionsCollection() {
    return getRawDb().collection("transactions");
  }

  // GET /api/v1/transactions
  fastify.get(
    "/api/v1/transactions",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                txId: { type: "string" },
                user: { type: "string" },
                date: { type: "string" },
                amount: { type: "number" },
              },
              required: ["txId", "user", "date", "amount"],
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const collection = getTransactionsCollection();
      const limit = request.query.limit ?? 10;

      const transactions = await collection
        .find({})
        .sort({ date: -1 })
        .limit(limit)
        .project({ _id: 0 })
        .toArray();

      return transactions;
    },
  );
}

export default transactionsRoutes;
