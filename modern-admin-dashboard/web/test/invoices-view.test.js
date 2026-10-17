// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { InvoicesView, formatCurrency, formatDate } from "../src/views/invoices-view.js";
import { createFakeApiClient } from "../src/api/index.js";

const sampleInvoices = [
  {
    id: 1,
    name: "Jon Snow",
    email: "jonsnow@gmail.com",
    phone: "(665)121-5454",
    amount: 21.24,
    date: "2022-03-12T00:00:00.000Z",
  },
  {
    id: 2,
    name: "Cersei Lannister",
    email: "cerseilannister@gmail.com",
    phone: "(421)314-2288",
    amount: 1.24,
    date: "2021-06-15T00:00:00.000Z",
  },
  {
    id: 3,
    name: "Jaime Lannister",
    email: "jaimelannister@gmail.com",
    phone: "(422)982-6739",
    amount: 11.24,
    date: "2022-05-02T00:00:00.000Z",
  },
];

describe("InvoicesView Component", () => {
  let container;
  let view;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "test-view-container";
    document.body.appendChild(container);
    window.confirm = vi.fn();
  });

  afterEach(() => {
    if (view) {
      view.unmount();
      view = null;
    }
    container.remove();
    delete window.confirm;
  });

  describe("Utility Formatters", () => {
    it("formatCurrency formats numeric amounts as $xx.xx", () => {
      expect(formatCurrency(21.24)).toBe("$21.24");
      expect(formatCurrency(1.2)).toBe("$1.20");
      expect(formatCurrency(0)).toBe("$0.00");
      expect(formatCurrency("80.55")).toBe("$80.55");
    });

    it("formatDate formats ISO dates to localized format", () => {
      const formatted = formatDate("2022-03-12T00:00:00.000Z");
      expect(formatted).toMatch(/03\/12\/2022/);
      expect(formatDate("")).toBe("");
    });
  });

  it("renders loading state initially while fetching invoices", () => {
    const fakeClient = createFakeApiClient({
      delayMs: 100,
      invoices: sampleInvoices,
    });

    view = new InvoicesView({ apiClient: fakeClient });
    view.mount(container);

    const loadingEl = container.querySelector(".invoices-status-loading");
    expect(loadingEl).not.toBeNull();
    expect(loadingEl.getAttribute("role")).toBe("status");
    expect(loadingEl.textContent).toContain("Loading invoices");
  });

  it("mounts scene header, breadcrumbs, and renders table with formatted currency and dates", async () => {
    const fakeClient = createFakeApiClient({
      invoices: sampleInvoices,
    });

    view = new InvoicesView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    // Verify Scene Header & Breadcrumbs
    const titleEl = container.querySelector("#invoices-title");
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toBe("Invoices Balances");

    const breadcrumbs = container.querySelector(".scene-breadcrumbs");
    expect(breadcrumbs).not.toBeNull();
    expect(breadcrumbs.textContent).toContain("Data Management");
    expect(breadcrumbs.textContent).toContain("Invoices Balances");

    // Verify Table Rows
    const rows = container.querySelectorAll(".data-table-body .data-table-row");
    expect(rows.length).toBe(3);

    // Verify Columns for First Invoice
    const firstRow = rows[0];
    const costCell = firstRow.querySelector(".invoice-cost-cell");
    expect(costCell).not.toBeNull();
    expect(costCell.textContent).toBe("$21.24");
  });

  it("renders individual delete button with accessible aria-label for each row", async () => {
    const fakeClient = createFakeApiClient({
      invoices: sampleInvoices,
    });
    view = new InvoicesView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    const deleteBtns = container.querySelectorAll(".btn-delete-row");
    expect(deleteBtns.length).toBe(3);
    expect(deleteBtns[0].getAttribute("aria-label")).toBe("Delete Invoice 1 for Jon Snow");
  });

  it("does not delete invoice if individual confirmation is cancelled", async () => {
    const fakeClient = createFakeApiClient({
      invoices: sampleInvoices,
    });
    view = new InvoicesView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    window.confirm.mockReturnValue(false);
    const deleteSpy = vi.spyOn(fakeClient, "deleteInvoice");

    const deleteBtn = container.querySelector('.btn-delete-row[data-invoice-id="1"]');
    deleteBtn.click();

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("Invoice #1 for Jon Snow"));
    expect(deleteSpy).not.toHaveBeenCalled();

    const rows = container.querySelectorAll(".data-table-body .data-table-row");
    expect(rows.length).toBe(3);
  });

  it("deletes individual invoice upon confirmed prompt, updates table, and shows success alert", async () => {
    const fakeClient = createFakeApiClient({
      invoices: sampleInvoices,
    });
    view = new InvoicesView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    window.confirm.mockReturnValue(true);
    const deleteSpy = vi.spyOn(fakeClient, "deleteInvoice");

    const deleteBtn = container.querySelector('.btn-delete-row[data-invoice-id="2"]');
    deleteBtn.click();

    await view.mutationPromise;

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteSpy).toHaveBeenCalledWith(2);

    // Verify row removed from table
    const rows = container.querySelectorAll(".data-table-body .data-table-row");
    expect(rows.length).toBe(2);
    expect(container.querySelector('.data-table-row[data-row-id="2"]')).toBeNull();

    // Verify status banner
    const alertEl = container.querySelector('[data-testid="invoices-alert-status"]');
    expect(alertEl).not.toBeNull();
    expect(alertEl.getAttribute("role")).toBe("status");
    expect(alertEl.textContent).toContain("Cersei Lannister");
    expect(alertEl.textContent).toContain("deleted");
  });

  it("displays error alert when individual delete fails on server and retains row", async () => {
    const fakeClient = {
      async getInvoices() {
        return sampleInvoices;
      },
      async deleteInvoice() {
        throw new Error("Database timeout on delete");
      },
    };

    view = new InvoicesView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    window.confirm.mockReturnValue(true);

    const deleteBtn = container.querySelector('.btn-delete-row[data-invoice-id="1"]');
    deleteBtn.click();

    await view.mutationPromise;

    const errorAlert = container.querySelector('[data-testid="invoices-alert-error"]');
    expect(errorAlert).not.toBeNull();
    expect(errorAlert.getAttribute("role")).toBe("alert");
    expect(errorAlert.textContent).toContain("Failed to delete invoice #1");
    expect(errorAlert.textContent).toContain("Database timeout on delete");

    const rows = container.querySelectorAll(".data-table-body .data-table-row");
    expect(rows.length).toBe(3);
  });

  it("tracks row selection with checkboxes and reveals Delete Selected batch button in toolbar", async () => {
    const fakeClient = createFakeApiClient({
      invoices: sampleInvoices,
    });
    view = new InvoicesView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    const batchBtn = container.querySelector("#btn-delete-selected");
    expect(batchBtn).not.toBeNull();
    expect(batchBtn.style.display).toBe("none");

    // Check first row checkbox
    const firstCheckbox = container.querySelector(
      '.data-table-row[data-row-id="1"] .row-select-checkbox',
    );
    expect(firstCheckbox).not.toBeNull();
    firstCheckbox.checked = true;
    firstCheckbox.dispatchEvent(new Event("change", { bubbles: true }));

    // Verify batch button is revealed with count 1
    expect(batchBtn.style.display).toBe("inline-flex");
    expect(batchBtn.textContent).toContain("Delete Selected (1)");

    // Check second row checkbox
    const secondCheckbox = container.querySelector(
      '.data-table-row[data-row-id="2"] .row-select-checkbox',
    );
    secondCheckbox.checked = true;
    secondCheckbox.dispatchEvent(new Event("change", { bubbles: true }));

    expect(batchBtn.textContent).toContain("Delete Selected (2)");

    // Uncheck both
    firstCheckbox.checked = false;
    firstCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
    secondCheckbox.checked = false;
    secondCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
    expect(batchBtn.style.display).toBe("none");
  });

  it("prompts confirmation on batch delete and cancels without deleting when cancelled", async () => {
    const fakeClient = createFakeApiClient({
      invoices: sampleInvoices,
    });
    view = new InvoicesView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    // Select row 1
    const checkbox = container.querySelector(
      '.data-table-row[data-row-id="1"] .row-select-checkbox',
    );
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));

    window.confirm.mockReturnValue(false);
    const deleteSpy = vi.spyOn(fakeClient, "deleteInvoice");

    const batchBtn = container.querySelector("#btn-delete-selected");
    batchBtn.click();

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("delete 1 selected invoice(s)"),
    );
    expect(deleteSpy).not.toHaveBeenCalled();

    const rows = container.querySelectorAll(".data-table-body .data-table-row");
    expect(rows.length).toBe(3);
  });

  it("deletes all selected invoices upon confirmed prompt, clears selection, updates table, and shows success alert", async () => {
    const fakeClient = createFakeApiClient({
      invoices: sampleInvoices,
    });
    view = new InvoicesView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    // Select rows 1 and 3
    const cb1 = container.querySelector('.data-table-row[data-row-id="1"] .row-select-checkbox');
    const cb3 = container.querySelector('.data-table-row[data-row-id="3"] .row-select-checkbox');
    cb1.checked = true;
    cb1.dispatchEvent(new Event("change", { bubbles: true }));
    cb3.checked = true;
    cb3.dispatchEvent(new Event("change", { bubbles: true }));

    window.confirm.mockReturnValue(true);
    const deleteSpy = vi.spyOn(fakeClient, "deleteInvoice");

    const batchBtn = container.querySelector("#btn-delete-selected");
    batchBtn.click();

    await view.mutationPromise;

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteSpy).toHaveBeenCalledWith(1);
    expect(deleteSpy).toHaveBeenCalledWith(3);

    // Verify rows 1 and 3 removed, only row 2 remains
    const rows = container.querySelectorAll(".data-table-body .data-table-row");
    expect(rows.length).toBe(1);
    expect(container.querySelector('.data-table-row[data-row-id="2"]')).not.toBeNull();

    // Verify batch button hidden
    expect(batchBtn.style.display).toBe("none");

    // Verify status banner
    const alertEl = container.querySelector('[data-testid="invoices-alert-status"]');
    expect(alertEl).not.toBeNull();
    expect(alertEl.getAttribute("role")).toBe("status");
    expect(alertEl.textContent).toContain("Successfully deleted");
    expect(alertEl.textContent).toContain("2");
  });

  it("displays error state with retry button when initial getInvoices fails, and retries on click", async () => {
    let callCount = 0;
    const clientWithRetry = {
      async getInvoices() {
        callCount++;
        if (callCount === 1) {
          throw new Error("Invoices API unreachable");
        }
        return sampleInvoices;
      },
      async deleteInvoice() {},
    };

    view = new InvoicesView({ apiClient: clientWithRetry });
    view.mount(container);

    await view.fetchPromise;

    const errorEl = container.querySelector('[data-testid="invoices-error"]');
    expect(errorEl).not.toBeNull();
    expect(errorEl.getAttribute("role")).toBe("alert");
    expect(errorEl.textContent).toContain("Invoices API unreachable");

    const retryBtn = container.querySelector("#retry-invoices-btn");
    expect(retryBtn).not.toBeNull();

    retryBtn.click();
    await view.fetchPromise;

    expect(callCount).toBe(2);
    expect(container.querySelector('[data-testid="invoices-error"]')).toBeNull();
    expect(container.querySelectorAll(".data-table-body .data-table-row").length).toBe(3);
  });

  it("cleans up resources and unmounts cleanly", async () => {
    const fakeClient = createFakeApiClient({
      invoices: sampleInvoices,
    });
    view = new InvoicesView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    expect(container.querySelector(".invoices-scene")).not.toBeNull();

    view.unmount();
    expect(container.querySelector(".invoices-scene")).toBeNull();
  });
});
