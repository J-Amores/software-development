import { apiClient as defaultApiClient } from "../api/index.js";
import { DataTable } from "../components/data-table.js";

/**
 * Formats a numeric amount to standard currency representation (e.g. $21.24).
 *
 * @param {number|string} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  const num = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  return `$${num.toFixed(2)}`;
}

/**
 * Formats an ISO-8601 date string to standard localized MM/DD/YYYY format.
 *
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Invoices Balances View (/invoices)
 * Live billing and accounts receivable directory with multi-row selection, batch deletion,
 * individual deletion, and currency formatting.
 */
export class InvoicesView {
  /**
   * @param {Object} [options={}]
   * @param {Object} [options.apiClient] - Injectable API client adapter
   */
  constructor(options = {}) {
    this.apiClient = options.apiClient || defaultApiClient;
    this.container = null;
    this.element = null;
    this.dataTable = null;
    this.invoices = [];
    this.selectedIds = [];
    this.deleteSelectedBtn = null;
    this.isMounted = false;
    this.fetchPromise = null;
    this.mutationPromise = null;

    this._handleClick = this._handleClick.bind(this);
  }

  /**
   * Mounts the view into the provided container.
   *
   * @param {HTMLElement} container
   */
  mount(container) {
    if (!container) {
      throw new Error("Target container is required to mount InvoicesView");
    }

    this.container = container;
    this.isMounted = true;

    this.element = document.createElement("section");
    this.element.className = "scene-view invoices-scene";
    this.element.setAttribute("aria-labelledby", "invoices-title");

    this.element.innerHTML = `
      <header class="scene-header">
        <nav class="scene-breadcrumbs" aria-label="Breadcrumb">
          <span class="breadcrumb-item">Data Management</span>
          <span class="breadcrumb-separator" aria-hidden="true">/</span>
          <span class="breadcrumb-item active" aria-current="page">Invoices Balances</span>
        </nav>
        <h1 id="invoices-title" class="scene-title">Invoices Balances</h1>
        <p class="scene-subtitle">Accounts receivable, balances, and billing transactions</p>
      </header>

      <div id="invoices-alert-container" class="invoices-alert-container"></div>
      <div id="invoices-content-container" class="invoices-content-container"></div>
    `;

    this.container.innerHTML = "";
    this.container.appendChild(this.element);

    this.element.addEventListener("click", this._handleClick);

    this.loadInvoices();
  }

  /**
   * Fetches invoices from the backend and initializes the DataTable.
   */
  loadInvoices() {
    const contentEl = this.element?.querySelector("#invoices-content-container");
    if (!contentEl) {
      return;
    }

    contentEl.innerHTML = `
      <div class="invoices-status-loading" role="status">
        <span class="spinner" aria-hidden="true">⏳</span> Loading invoices...
      </div>
    `;

    this.fetchPromise = (async () => {
      try {
        const invoices = await this.apiClient.getInvoices();

        if (!this.isMounted || !this.element) {
          return;
        }

        this.invoices = invoices || [];
        contentEl.innerHTML = "";

        const columns = [
          { key: "id", label: "ID", sortable: true, width: "70px" },
          { key: "name", label: "Name", sortable: true },
          { key: "phone", label: "Phone", sortable: true },
          { key: "email", label: "Email", sortable: true },
          {
            key: "amount",
            label: "Cost",
            sortable: true,
            render: (amount) => {
              const span = document.createElement("span");
              span.className = "invoice-cost-cell";
              span.textContent = formatCurrency(amount);
              return span;
            },
          },
          {
            key: "date",
            label: "Date",
            sortable: true,
            render: (date) => formatDate(date),
          },
          {
            key: "actions",
            label: "Actions",
            sortable: false,
            width: "90px",
            render: (_val, row) => this._renderActionsCell(row),
          },
        ];

        this.dataTable = new DataTable({
          columns,
          data: this.invoices,
          selectable: true,
          rowKey: "id",
          searchable: true,
          searchPlaceholder: "Search invoices by name or email...",
          ariaLabel: "Invoices balances directory",
          toolbarActions: (container) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn-delete-selected";
            btn.id = "btn-delete-selected";
            btn.dataset.testid = "btn-delete-selected";
            btn.style.display = "none";
            btn.innerHTML = `<span aria-hidden="true">🗑️</span> Delete Selected (0)`;
            this.deleteSelectedBtn = btn;
            container.appendChild(btn);
          },
          onSelectionChange: (selectedIds) => {
            this.selectedIds = selectedIds || [];
            if (this.deleteSelectedBtn) {
              if (this.selectedIds.length > 0) {
                this.deleteSelectedBtn.style.display = "inline-flex";
                this.deleteSelectedBtn.innerHTML = `<span aria-hidden="true">🗑️</span> Delete Selected (${this.selectedIds.length})`;
              } else {
                this.deleteSelectedBtn.style.display = "none";
              }
            }
          },
        });

        this.dataTable.mount(contentEl);
      } catch (error) {
        if (!this.isMounted || !this.element) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);

        contentEl.innerHTML = `
          <div class="invoices-status-error" role="alert" data-testid="invoices-error">
            <div class="alert-icon" aria-hidden="true">⚠️</div>
            <div class="alert-body">
              <h3 class="alert-heading">Unable to Load Invoices</h3>
              <p class="alert-text">${message}</p>
              <button type="button" class="btn-retry" id="retry-invoices-btn">Retry</button>
            </div>
          </div>
        `;
      }
    })();
  }

  /**
   * Renders the action buttons cell for an invoice row.
   *
   * @param {Object} row
   * @returns {HTMLElement}
   */
  _renderActionsCell(row) {
    const container = document.createElement("div");
    container.className = "row-actions-cell";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-delete-row";
    deleteBtn.dataset.invoiceId = String(row.id);
    deleteBtn.setAttribute("aria-label", `Delete Invoice ${row.id} for ${row.name}`);
    deleteBtn.title = `Delete Invoice #${row.id}`;
    deleteBtn.innerHTML = `<span aria-hidden="true">🗑️</span>`;

    container.appendChild(deleteBtn);
    return container;
  }

  /**
   * Handles action clicks for dismiss buttons, retry, individual row delete, and batch delete.
   *
   * @param {Event} event
   */
  _handleClick(event) {
    const target = event.target;
    if (target.closest(".invoices-alert-dismiss")) {
      const alertEl = target.closest(".invoices-alert");
      alertEl?.remove();
      return;
    }

    if (target.closest("#retry-invoices-btn")) {
      this.loadInvoices();
      return;
    }

    const deleteBtn = target.closest(".btn-delete-row");
    if (deleteBtn) {
      const invoiceId = Number(deleteBtn.dataset.invoiceId);
      this.handleDelete(invoiceId);
      return;
    }

    const batchDeleteBtn = target.closest(".btn-delete-selected");
    if (batchDeleteBtn) {
      this.handleDeleteSelected();
      return;
    }
  }

  /**
   * Prompts operator confirmation and deletes an individual invoice.
   *
   * @param {number} invoiceId
   */
  handleDelete(invoiceId) {
    const invoice = this.invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;

    const confirmed =
      typeof window.confirm === "function"
        ? window.confirm(
            `Are you sure you want to delete Invoice #${invoice.id} for ${invoice.name}? This action cannot be undone.`,
          )
        : true;

    if (!confirmed) return;

    this.mutationPromise = (async () => {
      try {
        await this.apiClient.deleteInvoice(invoiceId);

        if (!this.isMounted) return;

        this.invoices = this.invoices.filter((i) => i.id !== invoiceId);
        this.dataTable?.update({ data: this.invoices });

        this._showAlert(
          "status",
          `Invoice #<strong>${invoice.id}</strong> for <strong>${invoice.name}</strong> was successfully deleted.`,
        );
      } catch (error) {
        if (!this.isMounted) return;

        const message = error instanceof Error ? error.message : String(error);
        this._showAlert("alert", `Failed to delete invoice #${invoice.id}: ${message}`);
      }
    })();
  }

  /**
   * Prompts operator confirmation and deletes all currently selected invoices in a batch.
   */
  handleDeleteSelected() {
    if (!this.selectedIds || this.selectedIds.length === 0) return;

    const count = this.selectedIds.length;
    const confirmed =
      typeof window.confirm === "function"
        ? window.confirm(
            `Are you sure you want to delete ${count} selected invoice(s)? This action cannot be undone.`,
          )
        : true;

    if (!confirmed) return;

    const idsToDelete = [...this.selectedIds];

    this.mutationPromise = (async () => {
      try {
        await Promise.all(idsToDelete.map((id) => this.apiClient.deleteInvoice(id)));

        if (!this.isMounted) return;

        this.invoices = this.invoices.filter((i) => !idsToDelete.includes(i.id));
        this.dataTable?.clearSelection();
        this.dataTable?.update({ data: this.invoices });

        this._showAlert(
          "status",
          `Successfully deleted <strong>${count}</strong> selected invoice(s).`,
        );
      } catch (error) {
        if (!this.isMounted) return;

        const message = error instanceof Error ? error.message : String(error);
        this._showAlert("alert", `Failed to delete selected invoices: ${message}`);
      }
    })();
  }

  /**
   * Displays an inline status or alert banner.
   *
   * @param {"status"|"alert"} type
   * @param {string} messageHtml
   */
  _showAlert(type, messageHtml) {
    const alertContainer = this.element?.querySelector("#invoices-alert-container");
    if (!alertContainer) return;

    const isStatus = type === "status";
    const alertEl = document.createElement("div");
    alertEl.className = `invoices-alert ${isStatus ? "invoices-alert-success" : "invoices-alert-danger"}`;
    alertEl.setAttribute("role", type);
    alertEl.dataset.testid = isStatus ? "invoices-alert-status" : "invoices-alert-error";

    alertEl.innerHTML = `
      <div class="invoices-alert-body">${messageHtml}</div>
      <button type="button" class="invoices-alert-dismiss" aria-label="${isStatus ? "Dismiss message" : "Dismiss alert"}">✕</button>
    `;

    alertContainer.innerHTML = "";
    alertContainer.appendChild(alertEl);
  }

  /**
   * Unmounts the view and cleans up resources.
   */
  unmount() {
    this.isMounted = false;

    if (this.element) {
      this.element.removeEventListener("click", this._handleClick);
      if (this.element.parentNode) {
        this.element.remove();
      }
    }

    if (this.dataTable) {
      this.dataTable.unmount();
      this.dataTable = null;
    }

    this.container = null;
    this.element = null;
    this.deleteSelectedBtn = null;
    this.invoices = [];
    this.selectedIds = [];
  }
}

export default InvoicesView;
