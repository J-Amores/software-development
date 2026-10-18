/**
 * Operational Report Exporter Module
 * Formats and triggers client-side CSV downloads for administrative auditing.
 */

/**
 * Converts dashboard KPI telemetry and itemized transactions into structured CSV content.
 *
 * @param {Object} summary - Composite dashboard KPI summary
 * @param {Array<Object>} transactions - Itemized recent transactions
 * @returns {string} Formatted CSV document string
 */
export function generateReportCsv(summary = {}, transactions = []) {
  const invoicedTotal = summary.invoicedRevenue?.total ?? 0;
  const invoicedCount = summary.invoicedRevenue?.count ?? 0;
  const txTotal = summary.transactionVolume?.total ?? 0;
  const txCount = summary.transactionVolume?.count ?? 0;
  const contactsCount = summary.activeContacts ?? 0;
  const membersCount = summary.teamMembers ?? 0;
  const timestamp = new Date().toISOString();

  const lines = [
    "=== OPERATIONAL REPORT SUMMARY ===",
    "Metric,Value",
    `Invoiced Revenue Total,$${Number(invoicedTotal).toFixed(2)}`,
    `Invoiced Revenue Document Count,${invoicedCount}`,
    `Transaction Volume Total,$${Number(txTotal).toFixed(2)}`,
    `Transaction Settlement Count,${txCount}`,
    `Active Contacts Count,${contactsCount}`,
    `Team Members Count,${membersCount}`,
    `Report Generation Timestamp,${timestamp}`,
    "",
    "=== ITEMIZED RECENT TRANSACTIONS ===",
    "Transaction ID,User Handle,Settlement Date,Settled Amount",
  ];

  if (Array.isArray(transactions)) {
    for (const tx of transactions) {
      const txId = `"${String(tx.txId || "").replace(/"/g, '""')}"`;
      const user = `"${String(tx.user || "").replace(/"/g, '""')}"`;
      const date = `"${String(tx.date || "").replace(/"/g, '""')}"`;
      const amount = `$${(Number(tx.amount) || 0).toFixed(2)}`;
      lines.push(`${txId},${user},${date},${amount}`);
    }
  }

  return lines.join("\r\n");
}

/**
 * Generates and triggers browser download of operational report CSV.
 *
 * @param {Object} summary
 * @param {Array<Object>} transactions
 * @param {string} [filename]
 * @returns {{ success: boolean, filename: string, content: string }}
 */
export function downloadOperationalReport(summary = {}, transactions = [], filename = null) {
  const content = generateReportCsv(summary, transactions);
  const dateStr = new Date().toISOString().split("T")[0];
  const targetFilename = filename || `admin-operational-report-${dateStr}.csv`;

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
      const url =
        typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
          ? URL.createObjectURL(blob)
          : "blob:mock-url";

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", targetFilename);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.warn("Browser CSV download failed:", err);
    }
  }

  return { success: true, filename: targetFilename, content };
}
