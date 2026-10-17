import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";

/**
 * In-memory mock database collection for contacts route testing.
 */
function createMockContactsDb(initialContacts = []) {
  const contacts = new Map(initialContacts.map((c) => [c.id, { ...c }]));
  const counters = new Map([["contacts", initialContacts.length]]);

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

          if (name !== "contacts") {
            throw new Error(`Unexpected collection in contacts test: ${name}`);
          }

          return {
            async insertOne(doc) {
              contacts.set(doc.id, { ...doc });
              return { acknowledged: true, insertedId: doc.id };
            },
            find(query = {}, _options = {}) {
              let results = Array.from(contacts.values());

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
          };
        },
      };
    },
  };
}

const sampleContacts = [
  {
    id: 1,
    name: "Jon Snow",
    email: "jonsnow@gmail.com",
    age: 35,
    phone: "(665)121-5454",
    address: "0912 Won Street, Alabama, SY 10001",
    city: "New York",
    zipCode: "10001",
    registrarId: 123512,
  },
  {
    id: 2,
    name: "Cersei Lannister",
    email: "cerseilannister@gmail.com",
    age: 42,
    phone: "(421)314-2288",
    address: "1234 Main Street, New York, NY 10001",
    city: "New York",
    zipCode: "13151",
    registrarId: 123512,
  },
  {
    id: 3,
    name: "Jaime Lannister",
    email: "jaimelannister@gmail.com",
    age: 45,
    phone: "(422)982-6739",
    address: "3333 Want Blvd, Estanza, NAY 42125",
    city: "Estanza",
    zipCode: "42125",
    registrarId: 413251,
  },
];

describe("Contacts API Routes (/api/v1/contacts)", () => {
  let app;
  let mockDb;

  beforeEach(async () => {
    mockDb = createMockContactsDb(sampleContacts);
    app = await createApp({ db: mockDb, logger: false });
  });

  describe("GET /api/v1/contacts", () => {
    it("returns 200 and all contacts without MongoDB internal _id", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/contacts",
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3);
      expect(data[0]._id).toBeUndefined();
      expect(data[0].id).toBe(1);
      expect(data[0].name).toBe("Jon Snow");
      expect(data[0].city).toBe("New York");
      expect(data[0].registrarId).toBe(123512);
    });

    it("filters contacts by search query ?q= matching name, email, address, or city", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/contacts?q=estanza",
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe("Jaime Lannister");
      expect(data[0].city).toBe("Estanza");
    });

    it("sorts contacts by column and order", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/contacts?sort=age&order=desc",
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data[0].name).toBe("Jaime Lannister"); // age 45
      expect(data[1].name).toBe("Cersei Lannister"); // age 42
      expect(data[2].name).toBe("Jon Snow"); // age 35
    });
  });

  describe("POST /api/v1/contacts", () => {
    it("provisions a new contact record with auto-incremented sequential ID", async () => {
      const newContact = {
        name: "Brienne of Tarth",
        email: "brienne@tarth.com",
        age: 32,
        phone: "(555) 777-8888",
        address: "Evenfall Hall, Tarth",
        city: "Tarth",
        zipCode: "99123",
        registrarId: 654321,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/contacts",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact),
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.id).toBe(4);
      expect(data.name).toBe("Brienne of Tarth");
      expect(data.email).toBe("brienne@tarth.com");
      expect(data.age).toBe(32);
      expect(data.phone).toBe("(555) 777-8888");
      expect(data.address).toBe("Evenfall Hall, Tarth");
      expect(data.city).toBe("Tarth");
      expect(data.zipCode).toBe("99123");
      expect(data.registrarId).toBe(654321);

      // Verify GET returns the new contact
      const getResponse = await app.inject({
        method: "GET",
        url: "/api/v1/contacts",
      });
      const all = JSON.parse(getResponse.body);
      expect(all).toHaveLength(4);
    });

    it("rejects invalid payloads missing required fields with 400 Bad Request", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/contacts",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Incomplete Contact",
          // email, phone, address missing
        }),
      });

      expect(response.statusCode).toBe(400);
      const error = JSON.parse(response.body);
      expect(error.message).toMatch(/required/i);
    });

    it("rejects malformed email address with 400 Bad Request", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/contacts",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Invalid Email",
          email: "not-an-email",
          age: 30,
          phone: "(555) 123-4567",
          address: "123 Street",
          city: "Metropolis",
          zipCode: "12345",
          registrarId: 111222,
        }),
      });

      expect(response.statusCode).toBe(400);
      const error = JSON.parse(response.body);
      expect(error.message).toMatch(/email/i);
    });
  });
});
