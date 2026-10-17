import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";

/**
 * In-memory mock database collection for team route testing.
 */
function createMockTeamDb(initialMembers = []) {
  const members = new Map(initialMembers.map((m) => [m.id, { ...m }]));
  const counters = new Map([["members", initialMembers.length]]);

  return {
    getDb() {
      return {
        collection(name) {
          if (name === "counters") {
            return {
              async findOneAndUpdate(filter, update, _options = {}) {
                const id = filter._id;
                let current = counters.get(id) || 0;
                if (update.$inc) {
                  current += update.$inc.seq || 1;
                }
                counters.set(id, current);
                return { _id: id, seq: current };
              },
            };
          }

          if (name !== "members") {
            throw new Error(`Unexpected collection in team test: ${name}`);
          }

          return {
            async insertOne(doc) {
              members.set(doc.id, { ...doc });
              return { acknowledged: true, insertedId: doc.id };
            },
            find(query = {}, _options = {}) {
              let results = Array.from(members.values());

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

              if (query.access) {
                results = results.filter((doc) => doc.access === query.access);
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

            async findOneAndUpdate(filter, update, _options = {}) {
              const id = filter.id;
              const doc = members.get(id);
              if (!doc) {
                return null;
              }

              if (update.$set) {
                Object.assign(doc, update.$set);
              }

              const copy = { ...doc };
              delete copy._id;
              return copy;
            },

            async deleteOne(filter) {
              const id = filter.id;
              const existed = members.has(id);
              members.delete(id);
              return { acknowledged: true, deletedCount: existed ? 1 : 0 };
            },
          };
        },
      };
    },
  };
}

describe("Team API Routes (/api/v1/team)", () => {
  const seedMembers = [
    {
      id: 1,
      name: "Jon Snow",
      email: "jonsnow@gmail.com",
      age: 35,
      phone: "(665)121-5454",
      access: "admin",
    },
    {
      id: 2,
      name: "Cersei Lannister",
      email: "cerseilannister@gmail.com",
      age: 42,
      phone: "(421)314-2288",
      access: "manager",
    },
    {
      id: 3,
      name: "Jaime Lannister",
      email: "jaimelannister@gmail.com",
      age: 45,
      phone: "(422)982-6739",
      access: "user",
    },
  ];

  let mockDb;
  let app;

  beforeEach(async () => {
    mockDb = createMockTeamDb(seedMembers);
    app = await createApp({ db: mockDb });
  });

  describe("GET /api/v1/team", () => {
    it("returns 200 and all team members without MongoDB internal _id", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/team",
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveLength(3);
      expect(data[0]).toEqual({
        id: 1,
        name: "Jon Snow",
        email: "jonsnow@gmail.com",
        age: 35,
        phone: "(665)121-5454",
        access: "admin",
      });
      expect(data[0]._id).toBeUndefined();
    });

    it("filters team members by search query ?q= matching name or email", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/team?q=lannister",
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveLength(2);
      expect(data.map((m) => m.name)).toEqual(["Cersei Lannister", "Jaime Lannister"]);
    });

    it("sorts team members by column and order", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/team?sort=age&order=desc",
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data[0].name).toBe("Jaime Lannister"); // age 45
      expect(data[1].name).toBe("Cersei Lannister"); // age 42
      expect(data[2].name).toBe("Jon Snow"); // age 35
    });

    it("filters team members by access level", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/team?access=admin",
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe("Jon Snow");
    });
  });

  describe("PATCH /api/v1/team/:id", () => {
    it("updates access level and returns 200 with updated member document", async () => {
      const response = await app.inject({
        method: "PATCH",
        url: "/api/v1/team/3",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access: "manager" }),
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.id).toBe(3);
      expect(data.name).toBe("Jaime Lannister");
      expect(data.access).toBe("manager");

      // Verify subsequent GET reflects the updated access
      const getResponse = await app.inject({
        method: "GET",
        url: "/api/v1/team",
      });
      const all = JSON.parse(getResponse.body);
      const jaime = all.find((m) => m.id === 3);
      expect(jaime.access).toBe("manager");
    });

    it("rejects invalid access level values with 400 Bad Request via JSON Schema validation", async () => {
      const response = await app.inject({
        method: "PATCH",
        url: "/api/v1/team/1",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access: "superadmin" }),
      });

      expect(response.statusCode).toBe(400);
      const error = JSON.parse(response.body);
      expect(error.message).toMatch(/access/i);
    });

    it("returns 404 Not Found when updating a nonexistent team member id", async () => {
      const response = await app.inject({
        method: "PATCH",
        url: "/api/v1/team/999",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access: "user" }),
      });

      expect(response.statusCode).toBe(404);
      const error = JSON.parse(response.body);
      expect(error.message).toContain("999");
    });
  });

  describe("POST /api/v1/team", () => {
    it("provisions a new team member and increments sequential ID atomically", async () => {
      const newMember = {
        name: "Arya Stark",
        email: "arya@stark.com",
        age: 18,
        phone: "(555) 123-4567",
        access: "user",
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/team",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.id).toBe(4); // sequential after 1, 2, 3
      expect(data.name).toBe("Arya Stark");
      expect(data.email).toBe("arya@stark.com");
      expect(data.age).toBe(18);
      expect(data.phone).toBe("(555) 123-4567");
      expect(data.access).toBe("user");

      // Verify second creation increments sequence to 5
      const response2 = await app.inject({
        method: "POST",
        url: "/api/v1/team",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Sansa Stark",
          email: "sansa@stark.com",
          age: 20,
          phone: "(555) 987-6543",
          access: "admin",
        }),
      });

      expect(response2.statusCode).toBe(201);
      const data2 = JSON.parse(response2.body);
      expect(data2.id).toBe(5);

      // Verify GET returns all members including the newly provisioned ones
      const getResponse = await app.inject({
        method: "GET",
        url: "/api/v1/team",
      });
      const all = JSON.parse(getResponse.body);
      expect(all).toHaveLength(5);
    });

    it("rejects invalid payloads missing required fields with 400 Bad Request", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/team",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Bran Stark",
          // email missing
          age: 16,
          phone: "(555) 000-1111",
          access: "manager",
        }),
      });

      expect(response.statusCode).toBe(400);
      const error = JSON.parse(response.body);
      expect(error.message).toMatch(/email/i);
    });

    it("rejects invalid access level values with 400 Bad Request", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/team",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Robb Stark",
          email: "robb@stark.com",
          age: 21,
          phone: "(555) 222-3333",
          access: "king", // invalid role
        }),
      });

      expect(response.statusCode).toBe(400);
      const error = JSON.parse(response.body);
      expect(error.message).toMatch(/access/i);
    });
  });

  describe("DELETE /api/v1/team/:id", () => {
    it("deletes an existing team member by id returning 200 and removal confirmation", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/v1/team/2",
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toMatchObject({
        success: true,
        id: 2,
      });

      // Verify member 2 was removed from collection
      const getResponse = await app.inject({
        method: "GET",
        url: "/api/v1/team",
      });
      const members = JSON.parse(getResponse.body);
      expect(members.some((m) => m.id === 2)).toBe(false);
      expect(members.length).toBe(2);
    });

    it("returns 404 Not Found when deleting a nonexistent team member", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/v1/team/999",
      });

      expect(response.statusCode).toBe(404);
      const error = JSON.parse(response.body);
      expect(error.message).toContain("999");
    });

    it("rejects non-numeric id with 400 Bad Request", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/v1/team/not-a-number",
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
