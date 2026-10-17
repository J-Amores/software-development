import { fileURLToPath } from "node:url";
import { createDatabaseAdapter } from "./../db.js";
import { ensureIndexes } from "./indexes.js";
import { setSequenceFloor } from "./counters.js";
import {
  mockDataTeam,
  mockDataContacts,
  mockDataInvoices,
  mockTransactions,
  mockBarData,
  mockPieData,
  mockLineData,
  mockGeographyData,
} from "../../../data/mockData.js";

/**
 * Normalizes and idempotently seeds the dataset into the given MongoDB database instance.
 *
 * @param {import('mongodb').Db} db
 * @returns {Promise<{
 *   membersCount: number,
 *   contactsCount: number,
 *   invoicesCount: number,
 *   transactionsCount: number,
 *   metricsCount: number,
 *   counters: Record<string, number>
 * }>}
 */
export async function seedDatabase(db) {
  if (!db || typeof db.collection !== "function") {
    throw new Error("Invalid database instance passed to seedDatabase");
  }

  // 1. Ensure indexes
  await ensureIndexes(db);

  // 2. Members (Team)
  const memberOps = mockDataTeam.map((item) => {
    const doc = {
      id: item.id,
      name: item.name,
      email: item.email,
      age: item.age,
      phone: item.phone,
      access: String(item.access).toLowerCase(),
    };
    return {
      updateOne: {
        filter: { id: doc.id },
        update: { $set: doc },
        upsert: true,
      },
    };
  });
  if (memberOps.length > 0) {
    await db.collection("members").bulkWrite(memberOps);
  }

  // 3. Contacts
  const contactOps = mockDataContacts.map((item) => {
    const doc = {
      id: item.id,
      name: item.name,
      email: item.email,
      age: item.age,
      phone: item.phone,
      address: item.address,
      city: item.city,
      zipCode: item.zipCode,
      registrarId: item.registrarId,
    };
    return {
      updateOne: {
        filter: { id: doc.id },
        update: { $set: doc },
        upsert: true,
      },
    };
  });
  if (contactOps.length > 0) {
    await db.collection("contacts").bulkWrite(contactOps);
  }

  // 4. Invoices
  const invoiceOps = mockDataInvoices.map((item) => {
    const doc = {
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      amount: parseFloat(item.cost),
      date: new Date(item.date).toISOString(),
    };
    return {
      updateOne: {
        filter: { id: doc.id },
        update: { $set: doc },
        upsert: true,
      },
    };
  });
  if (invoiceOps.length > 0) {
    await db.collection("invoices").bulkWrite(invoiceOps);
  }

  // 5. Transactions
  const transactionOps = mockTransactions.map((item) => {
    const doc = {
      txId: item.txId,
      user: item.user,
      date: new Date(item.date).toISOString(),
      amount: parseFloat(item.cost),
    };
    return {
      updateOne: {
        filter: { txId: doc.txId },
        update: { $set: doc },
        upsert: true,
      },
    };
  });
  if (transactionOps.length > 0) {
    await db.collection("transactions").bulkWrite(transactionOps);
  }

  // 6. Metrics partitioned by unique metricKey
  const metricDocs = [
    { metricKey: "bar", data: mockBarData },
    { metricKey: "pie", data: mockPieData },
    { metricKey: "line", data: mockLineData },
    { metricKey: "geography", data: mockGeographyData },
  ];
  const metricOps = metricDocs.map((doc) => ({
    updateOne: {
      filter: { metricKey: doc.metricKey },
      update: { $set: doc },
      upsert: true,
    },
  }));
  await db.collection("metrics").bulkWrite(metricOps);

  // 7. Atomic sequence floors
  const maxMemberId = Math.max(...mockDataTeam.map((m) => m.id), 0);
  const maxContactId = Math.max(...mockDataContacts.map((c) => c.id), 0);
  const maxInvoiceId = Math.max(...mockDataInvoices.map((i) => i.id), 0);

  const [membersSeq, contactsSeq, invoicesSeq] = await Promise.all([
    setSequenceFloor(db, "members", maxMemberId),
    setSequenceFloor(db, "contacts", maxContactId),
    setSequenceFloor(db, "invoices", maxInvoiceId),
  ]);

  const [membersCount, contactsCount, invoicesCount, transactionsCount, metricsCount] =
    await Promise.all([
      db.collection("members").countDocuments(),
      db.collection("contacts").countDocuments(),
      db.collection("invoices").countDocuments(),
      db.collection("transactions").countDocuments(),
      db.collection("metrics").countDocuments(),
    ]);

  return {
    membersCount,
    contactsCount,
    invoicesCount,
    transactionsCount,
    metricsCount,
    counters: {
      members: membersSeq,
      contacts: contactsSeq,
      invoices: invoicesSeq,
    },
  };
}

/**
 * Standalone seed runner executing against the configured MONGODB_URI.
 *
 * @param {any} [adapter=null]
 * @returns {Promise<any>}
 */
export async function runSeed(adapter = null) {
  const dbAdapter = adapter || createDatabaseAdapter();
  try {
    console.log(`Connecting to database at ${dbAdapter.uri}...`);
    await dbAdapter.connect();
    const db = dbAdapter.getDb();
    console.log(`Seeding database: ${db.databaseName}...`);

    const summary = await seedDatabase(db);
    console.log("✓ Seeding complete!");
    console.log(
      `  - Members:      ${summary.membersCount} (counter floor: ${summary.counters.members})`,
    );
    console.log(
      `  - Contacts:     ${summary.contactsCount} (counter floor: ${summary.counters.contacts})`,
    );
    console.log(
      `  - Invoices:     ${summary.invoicesCount} (counter floor: ${summary.counters.invoices})`,
    );
    console.log(`  - Transactions: ${summary.transactionsCount}`);
    console.log(`  - Metrics:      ${summary.metricsCount} partitioned keys`);

    return summary;
  } finally {
    await dbAdapter.disconnect();
  }
}

// Auto-run when executed directly via CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runSeed().catch((err) => {
    console.error("Fatal seed error:", err);
    process.exit(1);
  });
}
