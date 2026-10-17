import { describe, it, expect } from "vitest";
import { ensureIndexes } from "../src/db/indexes.js";
import { getNextSequence, setSequenceFloor } from "../src/db/counters.js";
import { seedDatabase } from "../src/db/seed.js";

/**
 * Creates an in-memory mock MongoDB Db instance for fast unit test isolation.
 */
function createMockDb() {
  const collections = new Map();
  const indexes = new Map();

  function getCollectionStore(name) {
    if (!collections.has(name)) {
      collections.set(name, new Map());
      indexes.set(name, []);
    }
    return {
      store: collections.get(name),
      idxList: indexes.get(name),
    };
  }

  return {
    _collections: collections,
    _indexes: indexes,
    collection(name) {
      const { store, idxList } = getCollectionStore(name);

      return {
        async createIndex(spec, options = {}) {
          idxList.push({ spec, options });
          return options.name || "index_created";
        },
        async countDocuments() {
          return store.size;
        },
        async bulkWrite(operations) {
          let upsertedCount = 0;
          let modifiedCount = 0;

          for (const op of operations) {
            if (op.updateOne) {
              const { filter, update, upsert } = op.updateOne;
              const key = Object.keys(filter)[0];
              const val = filter[key];

              let existingKey = null;
              for (const [docKey, doc] of store.entries()) {
                if (doc[key] === val) {
                  existingKey = docKey;
                  break;
                }
              }

              if (existingKey) {
                store.set(existingKey, { ...store.get(existingKey), ...update.$set });
                modifiedCount++;
              } else if (upsert) {
                const newId = store.size + 1;
                store.set(newId, { ...update.$set });
                upsertedCount++;
              }
            }
          }

          return { ok: 1, upsertedCount, modifiedCount };
        },
        async findOneAndUpdate(filter, update, options = {}) {
          const id = filter._id;
          let current = store.get(id);

          if (!current && options.upsert) {
            current = { _id: id, seq: 0 };
            store.set(id, current);
          }

          if (current) {
            if (update.$inc) {
              current.seq = (current.seq || 0) + update.$inc.seq;
            }
            if (update.$max) {
              current.seq = Math.max(current.seq || 0, update.$max.seq);
            }
          }

          return current;
        },
        find() {
          return {
            async toArray() {
              return Array.from(store.values());
            },
          };
        },
      };
    },
  };
}

describe("MongoDB Foundation: Indexes, Counters & Idempotent Seeding", () => {
  describe("Index Enforcement (ensureIndexes)", () => {
    it("creates unique indexes on all 5 collections", async () => {
      const mockDb = createMockDb();
      const created = await ensureIndexes(mockDb);

      expect(created).toHaveLength(5);
      expect(mockDb._indexes.get("members")[0].spec).toEqual({ id: 1 });
      expect(mockDb._indexes.get("members")[0].options.unique).toBe(true);
      expect(mockDb._indexes.get("contacts")[0].spec).toEqual({ id: 1 });
      expect(mockDb._indexes.get("invoices")[0].spec).toEqual({ id: 1 });
      expect(mockDb._indexes.get("transactions")[0].spec).toEqual({ txId: 1 });
      expect(mockDb._indexes.get("metrics")[0].spec).toEqual({ metricKey: 1 });
    });

    it("throws an error if an invalid db instance is passed", async () => {
      await expect(ensureIndexes(null)).rejects.toThrow(/invalid database instance/i);
    });
  });

  describe("Atomic Sequence Counters (counters.js)", () => {
    it("generates sequential integer IDs starting from 1", async () => {
      const mockDb = createMockDb();

      const id1 = await getNextSequence(mockDb, "members");
      const id2 = await getNextSequence(mockDb, "members");
      const id3 = await getNextSequence(mockDb, "members");

      expect(id1).toBe(1);
      expect(id2).toBe(2);
      expect(id3).toBe(3);
    });

    it("maintains separate sequence counters for different collections", async () => {
      const mockDb = createMockDb();

      const memberId = await getNextSequence(mockDb, "members");
      const contactId = await getNextSequence(mockDb, "contacts");
      const invoiceId = await getNextSequence(mockDb, "invoices");

      expect(memberId).toBe(1);
      expect(contactId).toBe(1);
      expect(invoiceId).toBe(1);
    });

    it("sets sequence floor and prevents downward regression", async () => {
      const mockDb = createMockDb();

      const floor = await setSequenceFloor(mockDb, "members", 100);
      expect(floor).toBe(100);

      // Attempting to set lower floor maintains higher current value
      const lowerAttempt = await setSequenceFloor(mockDb, "members", 50);
      expect(lowerAttempt).toBe(100);

      // Next sequence continues from floor + 1
      const nextId = await getNextSequence(mockDb, "members");
      expect(nextId).toBe(101);
    });
  });

  describe("Idempotent Database Seeding (seed.js)", () => {
    it("seeds all collections with normalized data models and sets counter floors", async () => {
      const mockDb = createMockDb();
      const summary = await seedDatabase(mockDb);

      expect(summary.membersCount).toBe(9);
      expect(summary.contactsCount).toBe(11);
      expect(summary.invoicesCount).toBe(8);
      expect(summary.transactionsCount).toBe(8);
      expect(summary.metricsCount).toBe(4);

      expect(summary.counters.members).toBe(9);
      expect(summary.counters.contacts).toBe(11);
      expect(summary.counters.invoices).toBe(8);

      // Verify normalization on members
      const members = await mockDb.collection("members").find().toArray();
      expect(members[0].access).toBe("admin"); // lowercase normalization
      expect(typeof members[0].id).toBe("number");

      // Verify normalization on invoices (cost string -> numeric amount, ISO date)
      const invoices = await mockDb.collection("invoices").find().toArray();
      expect(typeof invoices[0].amount).toBe("number");
      expect(invoices[0].amount).toBe(21.24);
      expect(invoices[0].cost).toBeUndefined();
      expect(new Date(invoices[0].date).toISOString()).toBe(invoices[0].date);

      // Verify normalization on transactions
      const transactions = await mockDb.collection("transactions").find().toArray();
      expect(typeof transactions[0].amount).toBe("number");
      expect(typeof transactions[0].txId).toBe("string");
      expect(new Date(transactions[0].date).toISOString()).toBe(transactions[0].date);

      // Verify metrics partitioning by unique metricKey
      const metrics = await mockDb.collection("metrics").find().toArray();
      const keys = metrics.map((m) => m.metricKey).sort();
      expect(keys).toEqual(["bar", "geography", "line", "pie"]);
    });

    it("is strictly idempotent across repeated runs", async () => {
      const mockDb = createMockDb();

      // First run
      const run1 = await seedDatabase(mockDb);
      // Second run immediately after
      const run2 = await seedDatabase(mockDb);

      expect(run2.membersCount).toBe(run1.membersCount);
      expect(run2.contactsCount).toBe(run1.contactsCount);
      expect(run2.invoicesCount).toBe(run1.invoicesCount);
      expect(run2.transactionsCount).toBe(run1.transactionsCount);
      expect(run2.metricsCount).toBe(run1.metricsCount);

      expect(run2.membersCount).toBe(9);
      expect(run2.contactsCount).toBe(11);
      expect(run2.invoicesCount).toBe(8);
      expect(run2.transactionsCount).toBe(8);
      expect(run2.metricsCount).toBe(4);
    });
  });
});
