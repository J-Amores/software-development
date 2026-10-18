import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";

/**
 * In-memory mock database collection for Metrics route testing.
 */
function createMockMetricsDb(initialMetrics = []) {
  const metrics = new Map(initialMetrics.map((m) => [m.metricKey, { ...m }]));

  return {
    getDb() {
      return {
        collection(name) {
          if (name !== "metrics") {
            throw new Error(`Unexpected collection in metrics test: ${name}`);
          }

          return {
            async findOne(query = {}, _options = {}) {
              const doc = metrics.get(query.metricKey);
              if (!doc) return null;
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

const sampleMetrics = [
  {
    metricKey: "bar",
    data: [{ country: "AD", "hot dog": 137, burger: 96 }],
  },
  {
    metricKey: "pie",
    data: [{ id: "hack", label: "hack", value: 239 }],
  },
  {
    metricKey: "line",
    data: [{ id: "japan", color: "#4cceac", data: [{ x: "plane", y: 101 }] }],
  },
  {
    metricKey: "geography",
    data: [{ id: "AFG", value: 520600 }],
  },
];

describe("Fastify Route: GET /api/v1/metrics/:dataset", () => {
  let app;
  let mockDb;

  beforeEach(async () => {
    mockDb = createMockMetricsDb(sampleMetrics);
    app = await createApp({ db: mockDb });
  });

  it("returns 200 and data payload for 'bar' dataset", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/metrics/bar",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.metricKey).toBe("bar");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data[0].country).toBe("AD");
    expect(body._id).toBeUndefined();
  });

  it("returns 200 and data payload for 'pie' dataset", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/metrics/pie",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.metricKey).toBe("pie");
    expect(body.data[0].id).toBe("hack");
  });

  it("returns 200 and data payload for 'line' dataset", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/metrics/line",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.metricKey).toBe("line");
    expect(body.data[0].id).toBe("japan");
  });

  it("returns 200 and data payload for 'geography' dataset", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/metrics/geography",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.metricKey).toBe("geography");
    expect(body.data[0].id).toBe("AFG");
  });

  it("returns 400 Bad Request for unsupported dataset parameter", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/metrics/unsupported-dataset",
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toContain("dataset");
  });

  it("returns 404 Not Found when a valid dataset key is not in database", async () => {
    const emptyDb = createMockMetricsDb([]);
    const emptyApp = await createApp({ db: emptyDb });

    const res = await emptyApp.inject({
      method: "GET",
      url: "/api/v1/metrics/bar",
    });

    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.message).toContain("not found");
  });
});
