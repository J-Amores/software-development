import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";

/**
 * In-memory mock database collection for FAQs route testing.
 */
function createMockFaqsDb(initialFaqs = []) {
  const faqs = new Map(initialFaqs.map((f) => [f.id, { ...f }]));

  return {
    getDb() {
      return {
        collection(name) {
          if (name !== "faqs") {
            throw new Error(`Unexpected collection in faqs test: ${name}`);
          }

          return {
            find(query = {}, _options = {}) {
              let results = Array.from(faqs.values());

              if (query.category) {
                results = results.filter((doc) => doc.category === query.category);
              }

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

const sampleFaqs = [
  {
    id: 1,
    question: "How are administrative Access Levels assigned and audited across the organization?",
    answer:
      "Operators manage Team Member Access Levels (Admin, Manager, User) directly through the Manage Team directory.",
    category: "Access & Security",
  },
  {
    id: 2,
    question: "What is the standard settlement window for issued commercial Invoices?",
    answer:
      "Commercial invoices carry a standard net-30 settlement expectation from the date of formal issuance.",
    category: "Billing & Invoices",
  },
  {
    id: 3,
    question: "How are operational milestones and appointments scheduled on the Calendar?",
    answer:
      "Authorized operators can schedule new Calendar Events directly through the calendar grid or via the Add Event action.",
    category: "Planning & Schedules",
  },
  {
    id: 4,
    question: "What procedures govern external Contact record retention and data privacy?",
    answer:
      "External Contact profiles, registrar references, and address information are retained under organizational compliance mandates.",
    category: "Compliance & Contacts",
  },
];

describe("Fastify Route: GET /api/v1/faqs", () => {
  let app;
  let mockDb;

  beforeEach(async () => {
    mockDb = createMockFaqsDb(sampleFaqs);
    app = await createApp({ db: mockDb });
  });

  it("returns all curated FAQ entries ordered by id ascending by default", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/faqs",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveLength(4);
    expect(body[0].id).toBe(1);
    expect(body[0].question).toContain("Access Levels");
    expect(body[0].category).toBe("Access & Security");
    expect(body[0]._id).toBeUndefined();
  });

  it("supports custom sorting parameter (e.g. sort=question&order=desc)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/faqs?sort=question&order=desc",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveLength(4);
    expect(body[0].question.startsWith("What")).toBe(true);
  });

  it("filters FAQs by case-insensitive text search query matching question (?q=)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/faqs?q=invoices",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(2);
    expect(body[0].question).toContain("Invoices");
  });

  it("filters FAQs by case-insensitive text search query matching answer text", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/faqs?q=compliance%20mandates",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(4);
  });

  it("filters FAQs by category query parameter (?category=)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/faqs?category=Planning%20%26%20Schedules",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(3);
    expect(body[0].category).toBe("Planning & Schedules");
  });

  it("returns an empty array when search query yields no matches", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/faqs?q=nonexistentkeyword12345",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toEqual([]);
  });

  it("rejects invalid order parameter with 400 Bad Request", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/faqs?order=diagonal",
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toContain("order");
  });
});
