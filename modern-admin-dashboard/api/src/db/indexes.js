/**
 * Database index management module.
 * Enforces unique constraints on document identifiers and keys across all collections.
 */

/**
 * Ensures all required unique indexes are established across collections.
 *
 * @param {import('mongodb').Db} db
 * @returns {Promise<string[]>} Array of created index names
 */
export async function ensureIndexes(db) {
  if (!db || typeof db.collection !== "function") {
    throw new Error("Invalid database instance passed to ensureIndexes");
  }

  const results = await Promise.all([
    db
      .collection("members")
      .createIndex({ id: 1 }, { unique: true, name: "idx_members_id_unique" }),
    db
      .collection("contacts")
      .createIndex({ id: 1 }, { unique: true, name: "idx_contacts_id_unique" }),
    db
      .collection("invoices")
      .createIndex({ id: 1 }, { unique: true, name: "idx_invoices_id_unique" }),
    db
      .collection("transactions")
      .createIndex({ txId: 1 }, { unique: true, name: "idx_transactions_txid_unique" }),
    db
      .collection("metrics")
      .createIndex({ metricKey: 1 }, { unique: true, name: "idx_metrics_key_unique" }),
  ]);

  return results;
}
