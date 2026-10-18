/**
 * Composite Dashboard Overview Routes (/api/v1/dashboard)
 * Fastify plugin aggregating live collection metrics, recent transactions, and chart payloads.
 */

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} [opts={}]
 */
export async function dashboardRoutes(fastify, opts = {}) {
  const db = opts.db || fastify.db;

  function getRawDb() {
    if (!db) {
      throw new Error("Database adapter is not configured");
    }
    return typeof db.getDb === "function" ? db.getDb() : db;
  }

  // GET /api/v1/dashboard
  fastify.get(
    "/api/v1/dashboard",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              summary: {
                type: "object",
                properties: {
                  invoicedRevenue: {
                    type: "object",
                    properties: {
                      total: { type: "number" },
                      count: { type: "number" },
                    },
                    required: ["total", "count"],
                  },
                  transactionVolume: {
                    type: "object",
                    properties: {
                      total: { type: "number" },
                      count: { type: "number" },
                    },
                    required: ["total", "count"],
                  },
                  activeContacts: { type: "number" },
                  teamMembers: { type: "number" },
                  ratios: {
                    type: "object",
                    properties: {
                      emails: { type: "number" },
                      sales: { type: "number" },
                      clients: { type: "number" },
                      traffic: { type: "number" },
                    },
                  },
                },
                required: [
                  "invoicedRevenue",
                  "transactionVolume",
                  "activeContacts",
                  "teamMembers",
                  "ratios",
                ],
              },
              recentTransactions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    txId: { type: "string" },
                    user: { type: "string" },
                    date: { type: "string" },
                    amount: { type: "number" },
                  },
                  required: ["txId", "user", "date", "amount"],
                },
              },
              charts: {
                type: "object",
                properties: {
                  revenueLine: { type: "array" },
                  salesBar: { type: "array" },
                  geographyTraffic: { type: "array" },
                },
                required: ["revenueLine", "salesBar", "geographyTraffic"],
              },
            },
            required: ["summary", "recentTransactions", "charts"],
          },
        },
      },
    },
    async (_request, _reply) => {
      const rawDb = getRawDb();
      const membersColl = rawDb.collection("members");
      const contactsColl = rawDb.collection("contacts");
      const invoicesColl = rawDb.collection("invoices");
      const transactionsColl = rawDb.collection("transactions");
      const metricsColl = rawDb.collection("metrics");

      // Parallel aggregate calculations
      const [
        teamMembersCount,
        activeContactsCount,
        invoicesList,
        recentTxList,
        metricsList,
        allTxList,
      ] = await Promise.all([
        membersColl.countDocuments(),
        contactsColl.countDocuments(),
        invoicesColl.find().toArray(),
        transactionsColl.find({}).sort({ date: -1 }).limit(10).project({ _id: 0 }).toArray(),
        metricsColl.find({ metricKey: { $in: ["line", "bar", "geography"] } }).toArray(),
        transactionsColl.find({}).toArray(),
      ]);

      // Calculate invoice totals
      const totalInvoiced = invoicesList.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
      const roundedInvoicedTotal = Math.round(totalInvoiced * 100) / 100;

      // Calculate transaction totals from all recorded transactions
      const totalTxAmount = allTxList.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      const roundedTxTotal = Math.round(totalTxAmount * 100) / 100;

      // Extract metrics payloads
      const metricsMap = new Map();
      for (const m of metricsList) {
        metricsMap.set(m.metricKey, m.data);
      }

      return {
        summary: {
          invoicedRevenue: {
            total: roundedInvoicedTotal,
            count: invoicesList.length,
          },
          transactionVolume: {
            total: roundedTxTotal,
            count: allTxList.length,
          },
          activeContacts: activeContactsCount,
          teamMembers: teamMembersCount,
          ratios: {
            emails: 0.75,
            sales: 0.5,
            clients: 0.3,
            traffic: 0.8,
          },
        },
        recentTransactions: recentTxList,
        charts: {
          revenueLine: metricsMap.get("line") || [],
          salesBar: metricsMap.get("bar") || [],
          geographyTraffic: metricsMap.get("geography") || [],
        },
      };
    },
  );
}

export default dashboardRoutes;
