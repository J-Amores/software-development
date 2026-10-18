import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";

/**
 * In-memory mock database collection for Transactions route testing.
 */
function createMockTransactionsDb(initialTransactions = []) {
  const transactions = initialTransactions.map((t) => ({ ...t }));

  return {
    getDb() {
      return {
        collection(name) {
          if (name !== "transactions") {
            throw new Error(`Unexpected collection in transactions test: ${name}`);
          }

          return {
            find(_query = {}, _options = {}) {
              let results = transactions.map((t) => ({ ...t }));

              return {
                sort(sortObj = {}) {
                  const [key, dir] = Object.entries(sortObj)[0] || ["date", -1];
                  results.sort((a, b) => {
                    if (a[key] < b[key]) return dir === -1 ? 1 : -1;
                    if (a[key] > b[key]) return dir === -1 ? -1 : 1;
                    return 0;
                  });
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
        },
      };
    },
  };
}

const sampleTransactions = [
  {
    txId: "tx-1",
    user: "alice",
    date: "2022-01-01T00:00:00.000Z",
    amount: 100.5,
  },
  {
    txId: "tx-2",
    user: "bob",
    date: "2022-02-01T00:00:00.000Z",
    amount: 250.0,
  },
  {
    txId: "tx-3",
    user: "charlie",
    date: "2022-03-01T00:00:00.000Z",
    amount: 75.25,
  },
];

describe("Fastify Route: GET /api/v1/transactions", () => {
  let app;
  let mockDb;

  beforeEach(async () => {
    mockDb = createMockTransactionsDb(sampleTransactions);
    app = await createApp({ db: mockDb });
  });

  it("returns recent transactions sorted chronologically descending by default", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/transactions",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveLength(3);
    expect(body[0].txId).toBe("tx-3");
    expect(body[1].txId).toBe("tx-2");
    expect(body[2].txId).toBe("tx-1");
    expect(body[0]._id).toBeUndefined();
  });

  it("respects the limit query parameter", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/transactions?limit=2",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveLength(2);
    expect(body[0].txId).toBe("tx-3");
    expect(body[1].txId).toBe("tx-2");
  });

  it("returns 400 Bad Request for invalid limit query parameter", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/transactions?limit=invalid",
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns an empty array when no transactions exist", async () => {
    const emptyDb = createMockTransactionsDb([]);
    const emptyApp = await createApp({ db: emptyDb });

    const res = await emptyApp.inject({
      method: "GET",
      url: "/api/v1/transactions",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toEqual([]);
  });
});
