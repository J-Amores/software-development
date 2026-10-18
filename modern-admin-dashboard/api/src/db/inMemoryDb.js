/**
 * In-Memory Database Adapter for offline testing and Playwright E2E suites.
 * Automatically seeds standard mock data collections.
 */

import { seedDatabase } from "./seed.js";

export function createInMemoryDb() {
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

  const rawDb = {
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
        async insertOne(doc) {
          const id = doc.id !== undefined ? doc.id : store.size + 1;
          const stored = { ...doc, id };
          store.set(id, stored);
          return { acknowledged: true, insertedId: id };
        },
        async deleteOne(filter = {}) {
          for (const [docKey, doc] of store.entries()) {
            let match = true;
            for (const [k, v] of Object.entries(filter)) {
              if (doc[k] !== v) {
                match = false;
                break;
              }
            }
            if (match) {
              store.delete(docKey);
              return { acknowledged: true, deletedCount: 1 };
            }
          }
          return { acknowledged: true, deletedCount: 0 };
        },
        async findOne(query = {}) {
          for (const doc of store.values()) {
            let match = true;
            for (const [k, v] of Object.entries(query)) {
              if (doc[k] !== v) {
                match = false;
                break;
              }
            }
            if (match) return { ...doc };
          }
          return null;
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
        find(query = {}) {
          let results = Array.from(store.values());

          if (query?.metricKey?.$in) {
            results = results.filter((d) => query.metricKey.$in.includes(d.metricKey));
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

  return {
    rawDb,
    getDb() {
      return rawDb;
    },
    collection(name) {
      return rawDb.collection(name);
    },
    async connect() {
      await seedDatabase(rawDb);
      const membersColl = rawDb.collection("members");
      if ((await membersColl.countDocuments()) < 10) {
        await membersColl.insertOne({
          id: 10,
          name: "Harvey Roxie",
          email: "harveyroxie@gmail.com",
          age: 65,
          phone: "(444)555-6239",
          access: "admin",
        });
      }
      return rawDb;
    },
    async disconnect() {},
    async ping() {
      return { ok: true, latencyMs: 2 };
    },
  };
}
