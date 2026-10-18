import { getNextSequence } from "../db/counters.js";

/**
 * Calendar Events Routes (/api/v1/events)
 * Fastify plugin providing event querying, provisioning, and deletion.
 */

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} [opts={}]
 */
export async function eventsRoutes(fastify, opts = {}) {
  const db = opts.db || fastify.db;

  function getRawDb() {
    if (!db) {
      throw new Error("Database adapter is not configured");
    }
    return typeof db.getDb === "function" ? db.getDb() : db;
  }

  function getEventsCollection() {
    return getRawDb().collection("events");
  }

  // GET /api/v1/events
  fastify.get(
    "/api/v1/events",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
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
                title: { type: "string" },
                start: { type: "string" },
                end: { type: "string" },
                allDay: { type: "boolean" },
              },
              required: ["id", "title", "start", "allDay"],
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const collection = getEventsCollection();
      const { sort = "start", order = "asc" } = request.query;
      const sortDir = order === "desc" ? -1 : 1;

      const events = await collection
        .find({})
        .sort({ [sort]: sortDir })
        .project({ _id: 0 })
        .toArray();

      return events;
    },
  );

  // POST /api/v1/events
  fastify.post(
    "/api/v1/events",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            title: { type: "string", minLength: 1 },
            start: { type: "string", minLength: 1 },
            end: { type: "string" },
            allDay: { type: "boolean" },
          },
          required: ["title", "start"],
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "number" },
              title: { type: "string" },
              start: { type: "string" },
              end: { type: "string" },
              allDay: { type: "boolean" },
            },
            required: ["id", "title", "start", "allDay"],
          },
        },
      },
    },
    async (request, reply) => {
      const rawDb = getRawDb();
      const id = await getNextSequence(rawDb, "events");

      const doc = {
        id,
        title: request.body.title,
        start: request.body.start,
        allDay: request.body.allDay !== undefined ? Boolean(request.body.allDay) : true,
      };

      if (request.body.end) {
        doc.end = request.body.end;
      }

      await rawDb.collection("events").insertOne(doc);
      return reply.status(201).send(doc);
    },
  );

  // DELETE /api/v1/events/:id
  fastify.delete(
    "/api/v1/events/:id",
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
      const collection = getEventsCollection();
      const id = Number(request.params.id);
      const result = await collection.deleteOne({ id });

      if (result.deletedCount === 0) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: `Calendar Event with ID ${id} not found`,
        });
      }

      return {
        success: true,
        id,
        message: `Calendar Event ${id} successfully removed`,
      };
    },
  );
}

export default eventsRoutes;
