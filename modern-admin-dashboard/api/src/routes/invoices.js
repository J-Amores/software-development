/**
 * Invoices Routes (/api/v1/invoices)
 * Fastify plugin providing invoice querying and deletion.
 */

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} [opts={}]
 */
export async function invoicesRoutes(fastify, opts = {}) {
  const db = opts.db || fastify.db;

  function getRawDb() {
    if (!db) {
      throw new Error("Database adapter is not configured");
    }
    return typeof db.getDb === "function" ? db.getDb() : db;
  }

  function getInvoicesCollection() {
    return getRawDb().collection("invoices");
  }

  // GET /api/v1/invoices
  fastify.get(
    "/api/v1/invoices",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            q: { type: "string" },
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
                name: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                amount: { type: "number" },
                date: { type: "string" },
              },
              required: ["id", "name", "email", "phone", "amount", "date"],
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const collection = getInvoicesCollection();
      const { q, sort = "id", order = "asc" } = request.query;

      const filter = {};
      if (q) {
        filter.$or = [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ];
      }

      const sortDir = order === "desc" ? -1 : 1;
      const invoices = await collection
        .find(filter)
        .sort({ [sort]: sortDir })
        .project({ _id: 0 })
        .toArray();

      return invoices;
    },
  );

  // DELETE /api/v1/invoices/:id
  fastify.delete(
    "/api/v1/invoices/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              id: { type: "number" },
              message: { type: "string" },
            },
            required: ["success", "id"],
          },
        },
      },
    },
    async (request, reply) => {
      const collection = getInvoicesCollection();
      const id = Number(request.params.id);
      const result = await collection.deleteOne({ id });

      if (result.deletedCount === 0) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: `Invoice with ID ${id} not found`,
        });
      }

      return {
        success: true,
        id,
        message: `Invoice ${id} successfully removed`,
      };
    },
  );
}

export default invoicesRoutes;
