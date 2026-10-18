import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";

/**
 * In-memory mock database collection for events route testing.
 */
function createMockEventsDb(initialEvents = []) {
  const events = new Map(initialEvents.map((e) => [e.id, { ...e }]));
  const counters = new Map([["events", initialEvents.length]]);

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

          if (name !== "events") {
            throw new Error(`Unexpected collection in events test: ${name}`);
          }

          return {
            async insertOne(doc) {
              events.set(doc.id, { ...doc });
              return { acknowledged: true, insertedId: doc.id };
            },
            find() {
              let results = Array.from(events.values());

              return {
                sort(sortObj = {}) {
                  const [key, dir] = Object.entries(sortObj)[0] || ["start", 1];
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
              const existed = events.has(id);
              events.delete(id);
              return { acknowledged: true, deletedCount: existed ? 1 : 0 };
            },
          };
        },
      };
    },
  };
}

const sampleEvents = [
  {
    id: 1,
    title: "All-Day Operational Review",
    start: "2026-10-01",
    allDay: true,
  },
  {
    id: 2,
    title: "Quarterly Strategic Planning",
    start: "2026-10-07",
    end: "2026-10-09",
    allDay: true,
  },
  {
    id: 3,
    title: "Executive Committee Briefing",
    start: "2026-10-18T14:00:00.000Z",
    end: "2026-10-18T15:30:00.000Z",
    allDay: false,
  },
];

describe("Calendar Events API Routes (/api/v1/events)", () => {
  let app;
  let mockDb;

  beforeEach(async () => {
    mockDb = createMockEventsDb(sampleEvents);
    app = await createApp({ db: mockDb });
  });

  describe("GET /api/v1/events", () => {
    it("returns 200 and all events without MongoDB internal _id", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/events",
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3);

      data.forEach((event) => {
        expect(event).not.toHaveProperty("_id");
        expect(typeof event.id).toBe("number");
        expect(typeof event.title).toBe("string");
        expect(typeof event.start).toBe("string");
        expect(typeof event.allDay).toBe("boolean");
      });
    });

    it("returns events sorted chronologically by start date by default", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/events",
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data[0].id).toBe(1);
      expect(data[1].id).toBe(2);
      expect(data[2].id).toBe(3);
    });

    it("supports custom sort order (descending)", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/events?sort=start&order=desc",
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data[0].id).toBe(3);
      expect(data[2].id).toBe(1);
    });
  });

  describe("POST /api/v1/events", () => {
    it("provisions a new event with atomic sequential integer ID and returns 201", async () => {
      const newEvent = {
        title: "Departmental Budget Audit",
        start: "2026-10-22",
        allDay: true,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/events",
        payload: newEvent,
      });

      expect(response.statusCode).toBe(201);
      const data = response.json();
      expect(data.id).toBe(4); // Sequential ID incremented from floor 3
      expect(data.title).toBe(newEvent.title);
      expect(data.start).toBe(newEvent.start);
      expect(data.allDay).toBe(true);

      // Verify persisted in DB
      const listResponse = await app.inject({
        method: "GET",
        url: "/api/v1/events",
      });
      expect(listResponse.json()).toHaveLength(4);
    });

    it("supports optional end timestamp and multi-day events", async () => {
      const multiDayEvent = {
        title: "Client Partnership Summit",
        start: "2026-10-28",
        end: "2026-10-29",
        allDay: true,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/events",
        payload: multiDayEvent,
      });

      expect(response.statusCode).toBe(201);
      const data = response.json();
      expect(data.end).toBe("2026-10-29");
    });

    it("rejects payload missing title with 400 Bad Request", async () => {
      const invalid = {
        start: "2026-10-22",
        allDay: true,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/events",
        payload: invalid,
      });

      expect(response.statusCode).toBe(400);
      const data = response.json();
      expect(data.error).toBe("Bad Request");
    });

    it("rejects payload missing start date with 400 Bad Request", async () => {
      const invalid = {
        title: "Missing Start Date",
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/events",
        payload: invalid,
      });

      expect(response.statusCode).toBe(400);
      const data = response.json();
      expect(data.error).toBe("Bad Request");
    });
  });

  describe("DELETE /api/v1/events/:id", () => {
    it("deletes an existing event by integer ID and returns 200", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/v1/events/2",
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.success).toBe(true);
      expect(data.id).toBe(2);

      // Verify event is removed
      const listResponse = await app.inject({
        method: "GET",
        url: "/api/v1/events",
      });
      const ids = listResponse.json().map((e) => e.id);
      expect(ids).not.toContain(2);
      expect(ids).toHaveLength(2);
    });

    it("returns 404 when deleting a non-existent event", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/v1/events/9999",
      });

      expect(response.statusCode).toBe(404);
      const data = response.json();
      expect(data.error).toBe("Not Found");
      expect(data.message).toContain("9999 not found");
    });

    it("returns 400 when ID parameter is non-numeric", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/v1/events/abc",
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
