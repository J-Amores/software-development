import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";

/**
 * In-memory mock database for composite Dashboard route testing.
 */
function createMockDashboardDb() {
  const members = [{ id: 1 }, { id: 2 }];
  const contacts = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const invoices = [
    { id: 1, amount: 100.0 },
    { id: 2, amount: 250.5 },
  ];
  const transactions = [
    { txId: "tx-1", user: "alice", date: "2022-01-01T00:00:00.000Z", amount: 50.0 },
    { txId: "tx-2", user: "bob", date: "2022-02-01T00:00:00.000Z", amount: 120.0 },
  ];
  const metrics = new Map([
    ["line", { metricKey: "line", data: [{ id: "revenue", data: [{ x: "Jan", y: 100 }] }] }],
    ["bar", { metricKey: "bar", data: [{ department: "Sales", value: 300 }] }],
    ["geography", { metricKey: "geography", data: [{ id: "USA", value: 800000 }] }],
  ]);

  return {
    getDb() {
      return {
        collection(name) {
          switch (name) {
            case "members":
              return {
                async countDocuments() {
                  return members.length;
                },
              };
            case "contacts":
              return {
                async countDocuments() {
                  return contacts.length;
                },
              };
            case "invoices":
              return {
                async countDocuments() {
                  return invoices.length;
                },
                find() {
                  return {
                    async toArray() {
                      return invoices;
                    },
                  };
                },
              };
            case "transactions":
              return {
                async countDocuments() {
                  return transactions.length;
                },
                find() {
                  let results = transactions.slice();
                  return {
                    sort() {
                      results.sort((a, b) => (a.date < b.date ? 1 : -1));
                      return this;
                    },
                    limit(n) {
                      results = results.slice(0, n);
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
            case "metrics":
              return {
                async findOne(query) {
                  return metrics.get(query.metricKey) || null;
                },
                find(query) {
                  const keys = query?.metricKey?.$in || ["line", "bar", "geography"];
                  return {
                    async toArray() {
                      return keys.map((k) => metrics.get(k)).filter(Boolean);
                    },
                  };
                },
              };
            default:
              throw new Error(`Unexpected collection in dashboard test: ${name}`);
          }
        },
      };
    },
  };
}

describe("Fastify Route: GET /api/v1/dashboard", () => {
  let app;
  let mockDb;

  beforeEach(async () => {
    mockDb = createMockDashboardDb();
    app = await createApp({ db: mockDb });
  });

  it("returns 200 with composite summary, recentTransactions, and charts", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/dashboard",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);

    // Summary validation
    expect(body.summary).toBeDefined();
    expect(body.summary.invoicedRevenue).toEqual({ total: 350.5, count: 2 });
    expect(body.summary.transactionVolume).toEqual({ total: 170.0, count: 2 });
    expect(body.summary.activeContacts).toBe(3);
    expect(body.summary.teamMembers).toBe(2);
    expect(body.summary.ratios).toBeDefined();

    // Recent transactions validation
    expect(Array.isArray(body.recentTransactions)).toBe(true);
    expect(body.recentTransactions).toHaveLength(2);
    expect(body.recentTransactions[0].txId).toBe("tx-2"); // latest first

    // Embedded charts validation
    expect(body.charts).toBeDefined();
    expect(body.charts.revenueLine).toBeDefined();
    expect(body.charts.salesBar).toBeDefined();
    expect(body.charts.geographyTraffic).toBeDefined();
  });
});
