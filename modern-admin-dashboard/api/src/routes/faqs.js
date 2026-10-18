/**
 * FAQ Routes (/api/v1/faqs)
 * Fastify plugin providing curated FAQ entry retrieval and search filtering.
 */

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} [opts={}]
 */
export async function faqsRoutes(fastify, opts = {}) {
  const db = opts.db || fastify.db;

  function getRawDb() {
    if (!db) {
      throw new Error("Database adapter is not configured");
    }
    return typeof db.getDb === "function" ? db.getDb() : db;
  }

  function getFaqsCollection() {
    return getRawDb().collection("faqs");
  }

  // GET /api/v1/faqs
  fastify.get(
    "/api/v1/faqs",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            q: { type: "string" },
            category: { type: "string" },
            sort: { type: "string" },
            order: { type: "string", enum: ["asc", "desc"] },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                question: { type: "string" },
                answer: { type: "string" },
                category: { type: "string" },
              },
              required: ["id", "question", "answer", "category"],
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const collection = getFaqsCollection();
      const { q, category, sort = "id", order = "asc" } = request.query;

      const filter = {};
      if (category) {
        filter.category = category;
      }
      if (q) {
        filter.$or = [
          { question: { $regex: q, $options: "i" } },
          { answer: { $regex: q, $options: "i" } },
          { category: { $regex: q, $options: "i" } },
        ];
      }

      const sortDir = order === "desc" ? -1 : 1;
      const faqs = await collection
        .find(filter)
        .sort({ [sort]: sortDir })
        .project({ _id: 0 })
        .toArray();

      return faqs;
    },
  );
}

export default faqsRoutes;
