import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";

/**
 * In-memory mock database collection for invoices route testing.
 */
function createMockInvoicesDb(initialInvoices = []) {
  const invoices = new Map(initialInvoices.map((inv) => [inv.id, { ...inv }]));

  return {
    getDb() {
      return {
        collection(name) {
          if (name !== "invoices") {
            throw new Error(`Unexpected collection in invoices test: ${name}`);
          }

          return {
            find(query = {}, _options = {}) {
              let results = Array.from(invoices.values());

              if (query.$or) {
                const searchRegexes = query.$or.map((cond) => {
                  const key = Object.keys(cond)[0];
                  return { key, regex: cond[key].$regex };
                });

                results = results.filter((doc) =>
                  searchRegexes.some(({ key, regex }) => {
                    const val = doc[key];
                    return typeof val === "string" && new RegExp(regex, "i").test(val);
                  }),
                );
              }

              return {
                sort(sortObj = {}) {
                  const [key, dir] = Object.entries(sortObj)[0] || ["id", 1];
                  results.sort((a, b) => {
                    if (a[key] < b[key]) return dir === -1 ? 1 : -1;
                    if (a[key] > b[key]) return dir === -1 ? -1 : 1;
                    return 0;
                  });
                  return this;
                },
                project() {
                  return this;
                },
                async toArray() {
                  return results.map((r) => {
                    const copy = { ...r };
                    delete copy._id;
                    return copy;
                  });
                },
              };
            },

            async deleteOne(filter) {
              const id = filter.id;
              const existed = invoices.has(id);
              invoices.delete(id);
              return { acknowledged: true, deletedCount: existed ? 1 : 0 };
            },
          };
        },
      };
    },
  };
}

const sampleInvoices = [
  {
    id: 1,
    name: "Jon Snow",
    email: "jonsnow@gmail.com",
    phone: "(665)121-5454",
    amount: 21.24,
    date: "2022-03-12T00:00:00.000Z",
  },
  {
    id: 2,
    name: "Cersei Lannister",
    email: "cerseilannister@gmail.com",
    phone: "(421)314-2288",
    amount: 1.24,
    date: "2021-06-15T00:00:00.000Z",
  },
  {
    id: 3,
    name: "Jaime Lannister",
    email: "jaimelannister@gmail.com",
    phone: "(422)982-6739",
    amount: 11.24,
    date: "2022-05-02T00:00:00.000Z",
  },
];

describe("Invoices API Routes (/api/v1/invoices)", () => {
  let app;
  let mockDb;

  beforeEach(async () => {
    mockDb = createMockInvoicesDb(sampleInvoices);
    app = await createApp({ db: mockDb });
  });

  describe("GET /api/v1/invoices", () => {
    it("returns 200 and all invoices without MongoDB internal _id", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/invoices",
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3);

      for (const item of data) {
        expect(item).not.toHaveProperty("_id");
        expect(typeof item.id).toBe("number");
        expect(typeof item.name).toBe("string");
        expect(typeof item.email).toBe("string");
        expect(typeof item.phone).toBe("string");
        expect(typeof item.amount).toBe("number");
        expect(typeof item.date).toBe("string");
      }
    });

    it("filters invoices by search query ?q= matching name or email", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/invoices?q=cersei",
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe("Cersei Lannister");
    });

    it("sorts invoices by amount descending", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/invoices?sort=amount&order=desc",
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveLength(3);
      expect(data[0].amount).toBe(21.24);
      expect(data[1].amount).toBe(11.24);
      expect(data[2].amount).toBe(1.24);
    });
  });

  describe("DELETE /api/v1/invoices/:id", () => {
    it("deletes an existing invoice by id returning 200 and removal confirmation", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/v1/invoices/2",
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toMatchObject({
        success: true,
        id: 2,
      });

      // Verify invoice 2 was removed from collection
      const getResponse = await app.inject({
        method: "GET",
        url: "/api/v1/invoices",
      });
      const remaining = JSON.parse(getResponse.body);
      expect(remaining.some((inv) => inv.id === 2)).toBe(false);
      expect(remaining.length).toBe(2);
    });

    it("returns 404 Not Found when deleting a nonexistent invoice", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/v1/invoices/999",
      });

      expect(response.statusCode).toBe(404);
      const error = JSON.parse(response.body);
      expect(error.message).toContain("999");
    });

    it("rejects non-numeric id with 400 Bad Request", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/v1/invoices/invalid-id",
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
