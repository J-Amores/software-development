import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";

/**
 * In-memory mock database collection for team route testing.
 */
function createMockTeamDb(initialMembers = []) {
  const members = new Map(initialMembers.map((m) => [m.id, { ...m }]));

  return {
    getDb() {
      return {
        collection(name) {
          if (name !== "members") {
            throw new Error(`Unexpected collection in team test: ${name}`);
          }

          return {
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
});
