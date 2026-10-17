/**
 * DataTable Component Module
 * Zero-framework, semantic HTML table component with deep encapsulation of
 * sorting, filtering, pagination, and multi-row selection.
 */

export class DataTable {
  /**
   * @param {Object} options
   * @param {Array<{ key: string, label: string, sortable?: boolean, render?: (value: any, row: any) => HTMLElement | string, width?: string }>} options.columns
   * @param {Array<any>} [options.data=[]]
   * @param {boolean} [options.selectable=false]
   * @param {boolean} [options.searchable=true]
   * @param {string} [options.searchPlaceholder="Search records..."]
   * @param {string} [options.emptyMessage="No matching records found."]
   * @param {number} [options.pageSize=10]
   * @param {number[]} [options.pageSizeOptions=[5, 10, 25, 50]]
   * @param {string} [options.rowKey="id"]
   * @param {string} [options.ariaLabel="Data table"]
   * @param {(selectedIds: (string|number)[]) => void} [options.onSelectionChange]
   * @param {HTMLElement | ((container: HTMLElement) => void)} [options.toolbarActions]
   */
  constructor(options = {}) {
    this.columns = options.columns || [];
    this.data = options.data || [];
    this.selectable = Boolean(options.selectable);
    this.searchable = options.searchable !== false;
    this.searchPlaceholder = options.searchPlaceholder || "Search records...";
    this.emptyMessage = options.emptyMessage || "No matching records found.";
    this.pageSize = options.pageSize || 10;
    this.pageSizeOptions = options.pageSizeOptions || [5, 10, 25, 50];
    this.rowKey = options.rowKey || "id";
    this.ariaLabel = options.ariaLabel || "Data table";
    this.onSelectionChange = options.onSelectionChange || null;
    this.toolbarActions = options.toolbarActions || null;

    // Internal state
    this.currentPage = 1;
    this.sortColumn = null;
    this.sortDirection = null; // 'asc' | 'desc' | null
    this.searchQuery = "";
    this.selectedIds = new Set();

    // DOM references
    this.container = null;
    this.element = null;
    this.tbody = null;
    this.thead = null;
    this.searchInput = null;
    this.paginationInfo = null;
    this.paginationPageCurrent = null;
    this.prevBtn = null;
    this.nextBtn = null;
    this.pageSizeSelect = null;
    this.selectAllCheckbox = null;
    this.isMounted = false;

    // Bound listeners for cleanup
    this._handleSearchInput = this._handleSearchInput.bind(this);
    this._handleTableClick = this._handleTableClick.bind(this);
    this._handleTableChange = this._handleTableChange.bind(this);
  }

  /**
   * Mounts the data table into a target DOM container.
   *
   * @param {HTMLElement} container
   */
  mount(container) {
    if (!container) {
      throw new Error("Target container is required to mount DataTable");
    }

    this.container = container;
    this.isMounted = true;

    this.element = document.createElement("div");
    this.element.className = "data-table-container";

    this._buildScaffolding();
    this.container.innerHTML = "";
    this.container.appendChild(this.element);

    this._bindEvents();
    this.render();
  }

  /**
   * Updates data rows or column definitions without unmounting.
   *
   * @param {Object} updates
   * @param {Array<any>} [updates.data]
   * @param {Array<any>} [updates.columns]
   */
  update(updates = {}) {
    if (updates.columns !== undefined) {
      this.columns = updates.columns;
      this._renderHeader();
    }

    if (updates.data !== undefined) {
      this.data = updates.data;
      // Retain only selections that still exist in the updated data
      const currentKeys = new Set(this.data.map((r) => r[this.rowKey]));
      for (const id of this.selectedIds) {
        if (!currentKeys.has(id)) {
          this.selectedIds.delete(id);
        }
      }
    }

    if (this.isMounted) {
      this.render();
    }
  }

  /**
   * Returns an array of selected row identifiers.
   *
   * @returns {(string|number)[]}
   */
  getSelectedIds() {
    return Array.from(this.selectedIds);
  }

  /**
   * Returns an array of full row objects currently selected.
   *
   * @returns {any[]}
   */
  getSelectedRows() {
    const key = this.rowKey;
    return this.data.filter((row) => this.selectedIds.has(row[key]));
  }

  /**
   * Clears all row selections and notifies listeners.
   */
  clearSelection() {
    if (this.selectedIds.size > 0) {
      this.selectedIds.clear();
      if (this.isMounted) {
        this.render();
      }
      this.onSelectionChange?.(this.getSelectedIds());
    }
  }

  /**
   * Unmounts the data table and removes all listeners.
   */
  unmount() {
    this._unbindEvents();
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
    this.isMounted = false;
    this.container = null;
    this.element = null;
    this.tbody = null;
    this.thead = null;
    this.searchInput = null;
    this.paginationInfo = null;
    this.paginationPageCurrent = null;
    this.prevBtn = null;
    this.nextBtn = null;
    this.pageSizeSelect = null;
    this.selectAllCheckbox = null;
  }

  /* --------------------------------------------------------------------------
     DOM Scaffolding & Structural Elements
     -------------------------------------------------------------------------- */

  _buildScaffolding() {
    // Toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "data-table-toolbar";

    if (this.searchable) {
      const searchBox = document.createElement("div");
      searchBox.className = "data-table-search";
      searchBox.innerHTML = `
        <span class="data-table-search-icon" aria-hidden="true">🔍</span>
        <input
          type="search"
          class="data-table-search-input"
          placeholder="${this.searchPlaceholder}"
          aria-label="Filter records"
        />
      `;
      this.searchInput = searchBox.querySelector(".data-table-search-input");
      toolbar.appendChild(searchBox);
    } else {
      toolbar.appendChild(document.createElement("div"));
    }

    const actionsContainer = document.createElement("div");
    actionsContainer.className = "data-table-toolbar-actions";
    actionsContainer.id = "data-table-actions-container";
    if (this.toolbarActions) {
      if (typeof this.toolbarActions === "function") {
        this.toolbarActions(actionsContainer);
      } else if (this.toolbarActions instanceof HTMLElement) {
        actionsContainer.appendChild(this.toolbarActions);
      }
    }
    toolbar.appendChild(actionsContainer);

    // Table & Wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "data-table-wrapper";

    const table = document.createElement("table");
    table.className = "data-table";
    table.setAttribute("role", "grid");
    table.setAttribute("aria-label", this.ariaLabel);

    this.thead = document.createElement("thead");
    this.thead.className = "data-table-head";

    this.tbody = document.createElement("tbody");
    this.tbody.className = "data-table-body";

    table.appendChild(this.thead);
    table.appendChild(this.tbody);
    wrapper.appendChild(table);

    // Pagination
    const pagination = document.createElement("nav");
    pagination.className = "data-table-pagination";
    pagination.setAttribute("aria-label", "Table pagination");

    this.paginationInfo = document.createElement("span");
    this.paginationInfo.className = "data-table-pagination-info";
    this.paginationInfo.setAttribute("role", "status");
    this.paginationInfo.setAttribute("aria-live", "polite");

    const controls = document.createElement("div");
    controls.className = "data-table-pagination-controls";

    const pageSizeWrap = document.createElement("div");
    pageSizeWrap.className = "data-table-page-size-wrap";
    pageSizeWrap.innerHTML = `
      <label for="table-page-size-select">Rows per page:</label>
      <select id="table-page-size-select" class="data-table-page-size-select" aria-label="Rows per page">
        ${this.pageSizeOptions.map((s) => `<option value="${s}" ${this.pageSize === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
    `;
    this.pageSizeSelect = pageSizeWrap.querySelector("select");

    const navButtons = document.createElement("div");
    navButtons.className = "data-table-nav-buttons";
    navButtons.innerHTML = `
      <button type="button" class="pagination-btn prev-btn" aria-label="Previous page">Previous</button>
      <span class="pagination-page-current">Page 1 of 1</span>
      <button type="button" class="pagination-btn next-btn" aria-label="Next page">Next</button>
    `;
    this.prevBtn = navButtons.querySelector(".prev-btn");
    this.nextBtn = navButtons.querySelector(".next-btn");
    this.paginationPageCurrent = navButtons.querySelector(".pagination-page-current");

    controls.appendChild(pageSizeWrap);
    controls.appendChild(navButtons);

    pagination.appendChild(this.paginationInfo);
    pagination.appendChild(controls);

    this.element.appendChild(toolbar);
    this.element.appendChild(wrapper);
    this.element.appendChild(pagination);

    this._renderHeader();
  }

  _renderHeader() {
    this.thead.innerHTML = "";
    const tr = document.createElement("tr");

    if (this.selectable) {
      const thSelect = document.createElement("th");
      thSelect.scope = "col";
      thSelect.className = "data-table-th data-table-th-select";
      thSelect.innerHTML = `
        <input
          type="checkbox"
          class="data-table-checkbox select-all-checkbox"
          aria-label="Select all rows on current page"
        />
      `;
      this.selectAllCheckbox = thSelect.querySelector(".select-all-checkbox");
      tr.appendChild(thSelect);
    }

    for (const col of this.columns) {
      const isSortable = col.sortable !== false;
      const th = document.createElement("th");
      th.scope = "col";
      th.className = `data-table-th ${isSortable ? "sortable" : ""}`;
      th.dataset.columnKey = col.key;
      th.dataset.sortable = String(isSortable);
      th.setAttribute("role", "columnheader");
      th.setAttribute("aria-sort", "none");
      if (col.width) {
        th.style.width = col.width;
      }

      th.innerHTML = `
        <span class="data-table-th-content">
          ${col.label}
          ${isSortable ? `<span class="sort-indicator" aria-hidden="true">⇅</span>` : ""}
        </span>
      `;
      tr.appendChild(th);
    }

    this.thead.appendChild(tr);
  }

  /* --------------------------------------------------------------------------
     Internal Data Processing Pipeline
     -------------------------------------------------------------------------- */

  _getFilteredData() {
    if (!this.searchQuery) {
      return this.data;
    }

    const query = this.searchQuery;
    return this.data.filter((row) => {
      for (const col of this.columns) {
        const val = row[col.key];
        if (val != null) {
          const strVal = String(val).toLowerCase();
          if (strVal.includes(query)) {
            return true;
          }
        }
      }
      return false;
    });
  }

  _getSortedData(filtered) {
    if (!this.sortColumn || !this.sortDirection) {
      return filtered;
    }

    const col = this.sortColumn;
    const dir = this.sortDirection === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      const valA = a[col];
      const valB = b[col];

      if (valA == null && valB == null) return 0;
      if (valA == null) return dir;
      if (valB == null) return -dir;

      // Numeric comparison
      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * dir;
      }

      // Date comparison
      const dateA = Date.parse(valA);
      const dateB = Date.parse(valB);
      if (!isNaN(dateA) && !isNaN(dateB) && typeof valA === "string" && isNaN(valA)) {
        return (dateA - dateB) * dir;
      }

      // String comparison
      return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * dir;
    });
  }

  _getPageData(sorted) {
    const totalCount = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / this.pageSize));

    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const startIdx = totalCount === 0 ? 0 : (this.currentPage - 1) * this.pageSize;
    const endIdx = Math.min(startIdx + this.pageSize, totalCount);
    const pageRows = sorted.slice(startIdx, endIdx);

    return { pageRows, totalPages, totalCount, startIdx, endIdx };
  }

  /* --------------------------------------------------------------------------
     Event Handlers
     -------------------------------------------------------------------------- */

  _bindEvents() {
    if (!this.element) return;
    this.element.addEventListener("input", this._handleSearchInput);
    this.element.addEventListener("click", this._handleTableClick);
    this.element.addEventListener("change", this._handleTableChange);
  }

  _unbindEvents() {
    if (!this.element) return;
    this.element.removeEventListener("input", this._handleSearchInput);
    this.element.removeEventListener("click", this._handleTableClick);
    this.element.removeEventListener("change", this._handleTableChange);
  }

  _handleSearchInput(event) {
    if (event.target && event.target.classList.contains("data-table-search-input")) {
      this.searchQuery = event.target.value.trim().toLowerCase();
      this.currentPage = 1;
      this.render();
    }
  }

  _handleTableClick(event) {
    const target = event.target;

    // Header sort click
    const th = target.closest(".data-table-th.sortable");
    if (th && !target.closest(".data-table-checkbox")) {
      const colKey = th.dataset.columnKey;
      if (this.sortColumn === colKey) {
        this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
      } else {
        this.sortColumn = colKey;
        this.sortDirection = "asc";
      }
      this.render();
      return;
    }

    // Pagination buttons
    const prevBtn = target.closest(".pagination-btn.prev-btn");
    if (prevBtn && !prevBtn.disabled) {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.render();
      }
      return;
    }

    const nextBtn = target.closest(".pagination-btn.next-btn");
    if (nextBtn && !nextBtn.disabled) {
      this.currentPage++;
      this.render();
      return;
    }
  }

  _handleTableChange(event) {
    const target = event.target;

    // Select all checkbox
    if (target.classList.contains("select-all-checkbox")) {
      const sorted = this._getSortedData(this._getFilteredData());
      const { pageRows } = this._getPageData(sorted);
      const isChecked = target.checked;

      for (const row of pageRows) {
        const id = row[this.rowKey];
        if (isChecked) {
          this.selectedIds.add(id);
        } else {
          this.selectedIds.delete(id);
        }
      }

      const rowCheckboxes = this.tbody.querySelectorAll(".row-select-checkbox");
      rowCheckboxes.forEach((cb) => {
        cb.checked = isChecked;
        cb.closest(".data-table-row")?.classList.toggle("selected", isChecked);
      });

      this._updateSelectAllState();
      this.onSelectionChange?.(this.getSelectedIds());
      return;
    }

    // Single row select checkbox
    if (target.classList.contains("row-select-checkbox")) {
      const rowIdStr = target.dataset.rowId;
      const matchedRow = this.data.find((r) => String(r[this.rowKey]) === rowIdStr);
      const actualId = matchedRow ? matchedRow[this.rowKey] : rowIdStr;
      const tr = target.closest(".data-table-row");

      if (target.checked) {
        this.selectedIds.add(actualId);
        tr?.classList.add("selected");
      } else {
        this.selectedIds.delete(actualId);
        tr?.classList.remove("selected");
      }

      this._updateSelectAllState();
      this.onSelectionChange?.(this.getSelectedIds());
      return;
    }

    // Rows per page dropdown
    if (target.classList.contains("data-table-page-size-select")) {
      this.pageSize = Number(target.value) || 10;
      this.currentPage = 1;
      this.render();
    }
  }

  _updateSelectAllState() {
    if (!this.selectAllCheckbox) return;
    const sorted = this._getSortedData(this._getFilteredData());
    const { pageRows } = this._getPageData(sorted);

    if (pageRows.length === 0) {
      this.selectAllCheckbox.checked = false;
      this.selectAllCheckbox.indeterminate = false;
    } else {
      const selectedCount = pageRows.filter((r) => this.selectedIds.has(r[this.rowKey])).length;
      const allSelected = selectedCount === pageRows.length;
      const someSelected = selectedCount > 0 && !allSelected;
      this.selectAllCheckbox.checked = allSelected;
      this.selectAllCheckbox.indeterminate = someSelected;
    }
  }

  /* --------------------------------------------------------------------------
     Rendering
     -------------------------------------------------------------------------- */

  render() {
    if (!this.isMounted || !this.element) return;

    const filtered = this._getFilteredData();
    const sorted = this._getSortedData(filtered);
    const { pageRows, totalPages, totalCount, startIdx, endIdx } = this._getPageData(sorted);

    // 1. Update Sort Attributes on Existing Header Elements
    const ths = this.thead.querySelectorAll(".data-table-th.sortable");
    ths.forEach((th) => {
      const colKey = th.dataset.columnKey;
      const indicator = th.querySelector(".sort-indicator");
      if (this.sortColumn === colKey) {
        const ariaSort = this.sortDirection === "asc" ? "ascending" : "descending";
        th.setAttribute("aria-sort", ariaSort);
        if (indicator) {
          indicator.textContent = this.sortDirection === "asc" ? "▲" : "▼";
          indicator.className = "sort-indicator active";
        }
      } else {
        th.setAttribute("aria-sort", "none");
        if (indicator) {
          indicator.textContent = "⇅";
          indicator.className = "sort-indicator";
        }
      }
    });

    // 2. Update Select-All Checkbox
    this._updateSelectAllState();

    // 3. Render Body Rows
    this.tbody.innerHTML = "";
    const colSpan = this.columns.length + (this.selectable ? 1 : 0);

    if (pageRows.length === 0) {
      const emptyTr = document.createElement("tr");
      emptyTr.className = "data-table-empty-row";
      emptyTr.innerHTML = `
        <td colspan="${colSpan}" class="data-table-empty-cell" role="cell">
          ${this.emptyMessage}
        </td>
      `;
      this.tbody.appendChild(emptyTr);
    } else {
      const fragment = document.createDocumentFragment();

      for (const row of pageRows) {
        const rowId = row[this.rowKey];
        const isSelected = this.selectedIds.has(rowId);

        const tr = document.createElement("tr");
        tr.className = `data-table-row ${isSelected ? "selected" : ""}`;
        tr.dataset.rowId = String(rowId);
        tr.setAttribute("role", "row");

        if (this.selectable) {
          const selectTd = document.createElement("td");
          selectTd.className = "data-table-td data-table-td-select";
          selectTd.setAttribute("role", "gridcell");
          selectTd.innerHTML = `
            <input
              type="checkbox"
              class="data-table-checkbox row-select-checkbox"
              data-row-id="${rowId}"
              aria-label="Select row ${rowId}"
              ${isSelected ? "checked" : ""}
            />
          `;
          tr.appendChild(selectTd);
        }

        for (const col of this.columns) {
          const td = document.createElement("td");
          td.className = "data-table-td";
          td.dataset.columnKey = col.key;
          td.setAttribute("role", "gridcell");

          const val = row[col.key];
          if (typeof col.render === "function") {
            const rendered = col.render(val, row);
            if (rendered instanceof HTMLElement || rendered instanceof Node) {
              td.appendChild(rendered);
            } else {
              td.innerHTML = rendered != null ? String(rendered) : "";
            }
          } else {
            td.textContent = val != null ? String(val) : "";
          }

          tr.appendChild(td);
        }

        fragment.appendChild(tr);
      }

      this.tbody.appendChild(fragment);
    }

    // 4. Update Pagination Elements
    if (this.paginationInfo) {
      this.paginationInfo.textContent =
        totalCount === 0
          ? "Showing 0 records"
          : `Showing ${startIdx + 1}–${endIdx} of ${totalCount} records`;
    }

    if (this.paginationPageCurrent) {
      this.paginationPageCurrent.textContent = `Page ${this.currentPage} of ${totalPages}`;
    }

    if (this.prevBtn) {
      this.prevBtn.disabled = this.currentPage <= 1;
    }

    if (this.nextBtn) {
      this.nextBtn.disabled = this.currentPage >= totalPages;
    }

    if (this.pageSizeSelect && Number(this.pageSizeSelect.value) !== this.pageSize) {
      this.pageSizeSelect.value = String(this.pageSize);
    }
  }
}
