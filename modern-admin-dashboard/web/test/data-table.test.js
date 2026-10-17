// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DataTable } from "../src/components/data-table.js";

describe("DataTable Component Module", () => {
  let container;

  const sampleColumns = [
    { key: "id", label: "ID", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "age", label: "Age", sortable: true },
    { key: "email", label: "Email", sortable: false },
    {
      key: "status",
      label: "Status",
      sortable: false,
      render: (val) => {
        const span = document.createElement("span");
        span.className = `badge badge-${val}`;
        span.textContent = String(val).toUpperCase();
        return span;
      },
    },
  ];

  const sampleData = [
    { id: 1, name: "Alice Adams", age: 30, email: "alice@example.com", status: "active" },
    { id: 2, name: "Bob Brown", age: 45, email: "bob@example.com", status: "inactive" },
    { id: 3, name: "Charlie Clark", age: 22, email: "charlie@example.com", status: "active" },
    { id: 4, name: "David Davis", age: 38, email: "david@example.com", status: "pending" },
    { id: 5, name: "Eve Evans", age: 29, email: "eve@example.com", status: "active" },
    { id: 6, name: "Frank Franklin", age: 52, email: "frank@example.com", status: "inactive" },
    { id: 7, name: "Grace Green", age: 34, email: "grace@example.com", status: "active" },
  ];

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = "";
  });

  describe("Rendering & Semantic HTML", () => {
    it("renders semantic table markup, headers, and rows", () => {
      const table = new DataTable({
        columns: sampleColumns,
        data: sampleData,
        pageSize: 5,
      });

      table.mount(container);

      expect(container.querySelector("table.data-table")).not.toBeNull();
      expect(container.querySelector("thead.data-table-head")).not.toBeNull();
      expect(container.querySelector("tbody.data-table-body")).not.toBeNull();

      // Check header columns
      const ths = container.querySelectorAll("th.data-table-th");
      expect(ths).toHaveLength(5);
      expect(ths[0].textContent).toContain("ID");
      expect(ths[1].textContent).toContain("Name");

      // Check page rows (pageSize is 5)
      const rows = container.querySelectorAll("tbody tr.data-table-row");
      expect(rows).toHaveLength(5);

      // Verify custom DOM renderer on status column
      const badge = rows[0].querySelector(".badge.badge-active");
      expect(badge).not.toBeNull();
      expect(badge.textContent).toBe("ACTIVE");

      table.unmount();
    });

    it("displays empty state when data is empty", () => {
      const table = new DataTable({
        columns: sampleColumns,
        data: [],
        emptyMessage: "No team members found.",
      });

      table.mount(container);

      const emptyCell = container.querySelector(".data-table-empty-cell");
      expect(emptyCell).not.toBeNull();
      expect(emptyCell.textContent.trim()).toBe("No team members found.");

      const info = container.querySelector(".data-table-pagination-info");
      expect(info.textContent.trim()).toBe("Showing 0 records");

      table.unmount();
    });
  });

  describe("Column Sorting", () => {
    it("sorts ascending on first header click and descending on second click", () => {
      const table = new DataTable({
        columns: sampleColumns,
        data: sampleData,
        pageSize: 10,
      });

      table.mount(container);

      const nameTh = container.querySelector('th[data-column-key="name"]');
      expect(nameTh.getAttribute("aria-sort")).toBe("none");

      // 1. Click to sort ascending
      nameTh.click();
      expect(nameTh.getAttribute("aria-sort")).toBe("ascending");
      let firstRowName = container.querySelector("tbody tr:first-child td[data-column-key='name']");
      expect(firstRowName.textContent).toBe("Alice Adams");

      // 2. Click to sort descending
      nameTh.click();
      expect(nameTh.getAttribute("aria-sort")).toBe("descending");
      firstRowName = container.querySelector("tbody tr:first-child td[data-column-key='name']");
      expect(firstRowName.textContent).toBe("Grace Green");

      table.unmount();
    });

    it("correctly sorts numeric columns", () => {
      const table = new DataTable({
        columns: sampleColumns,
        data: sampleData,
        pageSize: 10,
      });

      table.mount(container);

      const ageTh = container.querySelector('th[data-column-key="age"]');
      // Sort numeric ascending: youngest (Charlie Clark, 22) first
      ageTh.click();
      const firstRowAge = container.querySelector("tbody tr:first-child td[data-column-key='age']");
      expect(firstRowAge.textContent).toBe("22");

      // Sort numeric descending: oldest (Frank Franklin, 52) first
      ageTh.click();
      const firstRowAgeDesc = container.querySelector(
        "tbody tr:first-child td[data-column-key='age']",
      );
      expect(firstRowAgeDesc.textContent).toBe("52");

      table.unmount();
    });
  });

  describe("Search Filtering", () => {
    it("filters rows across visible columns in real time", () => {
      const table = new DataTable({
        columns: sampleColumns,
        data: sampleData,
        pageSize: 10,
      });

      table.mount(container);

      const searchInput = container.querySelector(".data-table-search-input");
      expect(searchInput).not.toBeNull();

      // Filter by name "David"
      searchInput.value = "david";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      const rows = container.querySelectorAll("tbody tr.data-table-row");
      expect(rows).toHaveLength(1);
      expect(rows[0].querySelector("td[data-column-key='name']").textContent).toBe("David Davis");

      // Filter by email domain "example.com" (matches all)
      searchInput.value = "example.com";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      expect(container.querySelectorAll("tbody tr.data-table-row")).toHaveLength(7);

      // Search with no matches
      searchInput.value = "nonexistent";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      expect(container.querySelector(".data-table-empty-cell")).not.toBeNull();

      table.unmount();
    });
  });

  describe("Pagination", () => {
    it("pages data correctly and toggles prev/next buttons", () => {
      const table = new DataTable({
        columns: sampleColumns,
        data: sampleData,
        pageSize: 3, // 7 items across 3 pages (3, 3, 1)
      });

      table.mount(container);

      const prevBtn = container.querySelector(".pagination-btn.prev-btn");
      const nextBtn = container.querySelector(".pagination-btn.next-btn");
      const pageInfo = container.querySelector(".data-table-pagination-info");
      const pageCurrent = container.querySelector(".pagination-page-current");

      // Page 1
      expect(pageInfo.textContent).toContain("Showing 1–3 of 7 records");
      expect(pageCurrent.textContent).toContain("Page 1 of 3");
      expect(prevBtn.disabled).toBe(true);
      expect(nextBtn.disabled).toBe(false);

      // Navigate to Page 2
      nextBtn.click();
      expect(pageInfo.textContent).toContain("Showing 4–6 of 7 records");
      expect(pageCurrent.textContent).toContain("Page 2 of 3");
      expect(prevBtn.disabled).toBe(false);
      expect(nextBtn.disabled).toBe(false);

      // Navigate to Page 3
      nextBtn.click();
      expect(pageInfo.textContent).toContain("Showing 7–7 of 7 records");
      expect(pageCurrent.textContent).toContain("Page 3 of 3");
      expect(prevBtn.disabled).toBe(false);
      expect(nextBtn.disabled).toBe(true);

      // Navigate back to Page 2
      prevBtn.click();
      expect(pageCurrent.textContent).toContain("Page 2 of 3");

      table.unmount();
    });

    it("updates page size and resets to page 1", () => {
      const table = new DataTable({
        columns: sampleColumns,
        data: sampleData,
        pageSize: 3,
        pageSizeOptions: [3, 5, 10],
      });

      table.mount(container);

      // Go to page 2 first
      container.querySelector(".pagination-btn.next-btn").click();
      expect(container.querySelector(".pagination-page-current").textContent).toContain(
        "Page 2 of 3",
      );

      // Change page size to 10
      const select = container.querySelector(".data-table-page-size-select");
      select.value = "10";
      select.dispatchEvent(new Event("change", { bubbles: true }));

      expect(container.querySelector(".pagination-page-current").textContent).toContain(
        "Page 1 of 1",
      );
      expect(container.querySelectorAll("tbody tr.data-table-row")).toHaveLength(7);

      table.unmount();
    });
  });

  describe("Row Selection & Batch Actions", () => {
    it("handles individual row selection and triggers onSelectionChange", () => {
      const onSelectionChange = vi.fn();
      const table = new DataTable({
        columns: sampleColumns,
        data: sampleData,
        selectable: true,
        pageSize: 5,
        onSelectionChange,
      });

      table.mount(container);

      // Checkbox column exists in header and rows
      expect(container.querySelector("th.data-table-th-select")).not.toBeNull();
      const rowCheckboxes = container.querySelectorAll(".row-select-checkbox");
      expect(rowCheckboxes).toHaveLength(5);

      // Select row with ID 1
      rowCheckboxes[0].click();
      expect(table.getSelectedIds()).toEqual([1]);
      expect(table.getSelectedRows()).toEqual([sampleData[0]]);
      expect(onSelectionChange).toHaveBeenCalledWith([1]);

      // Row element has .selected class
      const firstRow = container.querySelector("tbody tr.data-table-row");
      expect(firstRow.classList.contains("selected")).toBe(true);

      // Unselect row 1
      rowCheckboxes[0].click();
      expect(table.getSelectedIds()).toEqual([]);
      expect(firstRow.classList.contains("selected")).toBe(false);

      table.unmount();
    });

    it("handles select-all checkbox on current page", () => {
      const onSelectionChange = vi.fn();
      const table = new DataTable({
        columns: sampleColumns,
        data: sampleData,
        selectable: true,
        pageSize: 3,
        onSelectionChange,
      });

      table.mount(container);

      const selectAllCb = container.querySelector(".select-all-checkbox");
      expect(selectAllCb.checked).toBe(false);

      // Click Select All
      selectAllCb.click();
      expect(table.getSelectedIds()).toEqual([1, 2, 3]);

      // Checkbox should be checked
      expect(container.querySelector(".select-all-checkbox").checked).toBe(true);

      // Clear selection method
      table.clearSelection();
      expect(table.getSelectedIds()).toEqual([]);
      expect(container.querySelector(".select-all-checkbox").checked).toBe(false);

      table.unmount();
    });
  });

  describe("Dynamic Updates & Lifecycle", () => {
    it("updates data dynamically and preserves existing valid selections", () => {
      const table = new DataTable({
        columns: sampleColumns,
        data: sampleData,
        selectable: true,
      });

      table.mount(container);

      // Select ID 2 and ID 3
      table.selectedIds.add(2);
      table.selectedIds.add(3);
      table.render();

      expect(table.getSelectedIds()).toEqual([2, 3]);

      // Update data keeping ID 2 but removing ID 3
      const updatedData = [
        sampleData[0], // id: 1
        sampleData[1], // id: 2
        sampleData[3], // id: 4
      ];

      table.update({ data: updatedData });

      expect(table.getSelectedIds()).toEqual([2]);
      expect(container.querySelectorAll("tbody tr.data-table-row")).toHaveLength(3);

      table.unmount();
    });

    it("cleans up DOM on unmount", () => {
      const table = new DataTable({
        columns: sampleColumns,
        data: sampleData,
      });

      table.mount(container);
      expect(container.children.length).toBe(1);

      table.unmount();
      expect(container.children.length).toBe(0);
      expect(table.isMounted).toBe(false);
    });
  });
});
