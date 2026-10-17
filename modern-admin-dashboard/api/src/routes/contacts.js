import { getNextSequence } from "../db/counters.js";

/**
 * Contacts Management Routes (/api/v1/contacts)
 * Fastify plugin providing contacts querying and record creation.
 */

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} [opts={}]
 */
export async function contactsRoutes(fastify, opts = {}) {
  const db = opts.db || fastify.db;

  function getRawDb() {
    if (!db) {
      throw new Error("Database adapter is not configured");
    }
    return typeof db.getDb === "function" ? db.getDb() : db;
  }

  function getContactsCollection() {
    return getRawDb().collection("contacts");
  }

  // GET /api/v1/contacts
  fastify.get(
    "/api/v1/contacts",
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
                age: { type: "number" },
                phone: { type: "string" },
                address: { type: "string" },
                city: { type: "string" },
                zipCode: { type: "string" },
                registrarId: { type: "number" },
              },
              required: [
                "id",
                "name",
                "email",
                "age",
                "phone",
                "address",
                "city",
                "zipCode",
                "registrarId",
              ],
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const collection = getContactsCollection();
      const { q, sort = "id", order = "asc" } = request.query;

      const filter = {};
      if (q) {
        filter.$or = [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { address: { $regex: q, $options: "i" } },
          { city: { $regex: q, $options: "i" } },
        ];
      }

      const sortDir = order === "desc" ? -1 : 1;
      const contacts = await collection
        .find(filter)
        .sort({ [sort]: sortDir })
        .project({ _id: 0 })
        .toArray();

      return contacts;
    },
  );

  // POST /api/v1/contacts
  fastify.post(
    "/api/v1/contacts",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1 },
            email: { type: "string", minLength: 3, pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$" },
            age: { type: "number", minimum: 1, maximum: 120 },
            phone: { type: "string", minLength: 1 },
            address: { type: "string", minLength: 1 },
            city: { type: "string", minLength: 1 },
            zipCode: { type: "string", minLength: 1 },
            registrarId: { type: "number" },
          },
          required: ["name", "email", "age", "phone", "address", "city", "zipCode", "registrarId"],
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
              address: { type: "string" },
              city: { type: "string" },
              zipCode: { type: "string" },
              registrarId: { type: "number" },
            },
            required: [
              "id",
              "name",
              "email",
              "age",
              "phone",
              "address",
              "city",
              "zipCode",
              "registrarId",
            ],
          },
        },
      },
    },
    async (request, reply) => {
      const rawDb = getRawDb();
      const id = await getNextSequence(rawDb, "contacts");
      const doc = {
        id,
        name: request.body.name,
        email: request.body.email,
        age: Number(request.body.age),
        phone: request.body.phone,
        address: request.body.address,
        city: request.body.city,
        zipCode: request.body.zipCode,
        registrarId: Number(request.body.registrarId),
      };

      await rawDb.collection("contacts").insertOne(doc);
      return reply.status(201).send(doc);
    },
  );
}

export default contactsRoutes;
