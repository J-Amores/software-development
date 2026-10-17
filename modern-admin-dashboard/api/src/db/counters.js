/**
 * Atomic sequence generator module backed by MongoDB findOneAndUpdate.
 * Safe for concurrent requests across multiple container instances.
 */

/**
 * Generates and returns the next sequential integer ID for a given collection.
 *
 * @param {import('mongodb').Db} db
 * @param {string} collectionName
 * @param {number} [increment=1]
 * @returns {Promise<number>}
 */
export async function getNextSequence(db, collectionName, increment = 1) {
  if (!db || typeof db.collection !== "function") {
    throw new Error("Invalid database instance passed to getNextSequence");
  }

  const result = await db
    .collection("counters")
    .findOneAndUpdate(
      { _id: collectionName },
      { $inc: { seq: increment } },
      { upsert: true, returnDocument: "after" },
    );

  return result.seq;
}

/**
 * Initializes or bumps the sequence counter floor for a given collection.
 * Uses $max to ensure a counter is never downgraded below existing record IDs.
 *
 * @param {import('mongodb').Db} db
 * @param {string} collectionName
 * @param {number} floorValue
 * @returns {Promise<number>}
 */
export async function setSequenceFloor(db, collectionName, floorValue) {
  if (!db || typeof db.collection !== "function") {
    throw new Error("Invalid database instance passed to setSequenceFloor");
  }

  const result = await db
    .collection("counters")
    .findOneAndUpdate(
      { _id: collectionName },
      { $max: { seq: floorValue } },
      { upsert: true, returnDocument: "after" },
    );

  return result.seq;
}
