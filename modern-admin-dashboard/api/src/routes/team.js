import { getNextSequence } from "../db/counters.js";

/**
 * Team Management Routes (/api/v1/team)
 * Fastify plugin providing team member querying, provisioning, and access-level updates.
 */

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} [opts={}]
 */
export async function teamRoutes(fastify, opts = {}) {
  const db = opts.db || fastify.db;

  function getRawDb() {
    if (!db) {
      throw new Error("Database adapter is not configured");
    }
    return typeof db.getDb === "function" ? db.getDb() : db;
  }

  function getMembersCollection() {
    return getRawDb().collection("members");
  }

  // GET /api/v1/team
  fastify.get(
    "/api/v1/team",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            q: { type: "string" },
            sort: { type: "string" },
            order: { type: "string", enum: ["asc", "desc"] },
            access: { type: "string", enum: ["admin", "manager", "user"] },
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
                age: { type: "number" },
                phone: { type: "string" },
                access: { type: "string" },
              },
              required: ["id", "name", "email", "age", "phone", "access"],
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const collection = getMembersCollection();
      const { q, sort = "id", order = "asc", access } = request.query;

      const filter = {};
      if (q) {
        filter.$or = [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ];
      }
      if (access) {
        filter.access = access.toLowerCase();
      }

      const sortDir = order === "desc" ? -1 : 1;
      const members = await collection
        .find(filter)
        .sort({ [sort]: sortDir })
        .project({ _id: 0 })
        .toArray();

      return members;
    },
  );

  // PATCH /api/v1/team/:id
  fastify.patch(
    "/api/v1/team/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            access: { type: "string", enum: ["admin", "manager", "user"] },
            name: { type: "string" },
            email: { type: "string" },
            age: { type: "number" },
            phone: { type: "string" },
          },
          required: ["access"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "number" },
              name: { type: "string" },
              email: { type: "string" },
              age: { type: "number" },
              phone: { type: "string" },
              access: { type: "string" },
            },
            required: ["id", "name", "email", "age", "phone", "access"],
          },
        },
      },
    },
    async (request, reply) => {
      const collection = getMembersCollection();
      const id = Number(request.params.id);
      const updateData = {};

      if (request.body.access) {
        updateData.access = request.body.access.toLowerCase();
      }
      if (request.body.name) updateData.name = request.body.name;
      if (request.body.email) updateData.email = request.body.email;
      if (request.body.age !== undefined) updateData.age = request.body.age;
      if (request.body.phone) updateData.phone = request.body.phone;

      const updated = await collection.findOneAndUpdate(
        { id },
        { $set: updateData },
        { projection: { _id: 0 }, returnDocument: "after" },
      );

      if (!updated) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: `Team Member with ID ${id} not found`,
        });
      }

      return updated;
    },
  );

  // POST /api/v1/team
  fastify.post(
    "/api/v1/team",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1 },
            email: { type: "string", minLength: 3, pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$" },
            phone: { type: "string", minLength: 1 },
            age: { type: "number", minimum: 1, maximum: 120 },
            access: { type: "string", enum: ["admin", "manager", "user"] },
          },
          required: ["name", "email", "phone", "age", "access"],
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "number" },
              name: { type: "string" },
              email: { type: "string" },
              age: { type: "number" },
              phone: { type: "string" },
              access: { type: "string" },
            },
            required: ["id", "name", "email", "age", "phone", "access"],
          },
        },
      },
    },
    async (request, reply) => {
      const rawDb = getRawDb();
      const id = await getNextSequence(rawDb, "members");
      const doc = {
        id,
        name: request.body.name,
        email: request.body.email,
        age: Number(request.body.age),
        phone: request.body.phone,
        access: request.body.access.toLowerCase(),
      };

      await rawDb.collection("members").insertOne(doc);
      return reply.status(201).send(doc);
    },
  );

  // DELETE /api/v1/team/:id
  fastify.delete(
    "/api/v1/team/:id",
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
      const collection = getMembersCollection();
      const id = Number(request.params.id);
      const result = await collection.deleteOne({ id });

      if (result.deletedCount === 0) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: `Team Member with ID ${id} not found`,
        });
      }

      return {
        success: true,
        id,
        message: `Team Member ${id} successfully removed`,
      };
    },
  );
}

export default teamRoutes;
