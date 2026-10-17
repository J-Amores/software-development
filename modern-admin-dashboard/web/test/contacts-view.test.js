// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ContactsView } from "../src/views/contacts-view.js";
import { createFakeApiClient } from "../src/api/index.js";

const sampleContacts = [
  {
    id: 1,
    name: "Jon Snow",
    email: "jonsnow@gmail.com",
    age: 35,
    phone: "(665)121-5454",
    address: "0912 Won Street, Alabama, SY 10001",
    city: "New York",
    zipCode: "10001",
    registrarId: 123512,
  },
  {
    id: 2,
    name: "Cersei Lannister",
    email: "cerseilannister@gmail.com",
    age: 42,
    phone: "(421)314-2288",
    address: "1234 Main Street, New York, NY 10001",
    city: "New York",
    zipCode: "13151",
    registrarId: 123512,
  },
  {
    id: 3,
    name: "Jaime Lannister",
    email: "jaimelannister@gmail.com",
    age: 45,
    phone: "(422)982-6739",
    address: "3333 Want Blvd, Estanza, NAY 42125",
    city: "Estanza",
    zipCode: "42125",
    registrarId: 413251,
  },
];

describe("ContactsView Component", () => {
  let container;
  let view;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "test-view-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (view) {
      view.unmount();
      view = null;
    }
    container.remove();
  });

  it("renders loading state initially while fetching contacts", () => {
    const fakeClient = createFakeApiClient({
      delayMs: 100,
      contacts: sampleContacts,
    });

    view = new ContactsView({ apiClient: fakeClient });
    view.mount(container);

    const loadingEl = container.querySelector(".contacts-status-loading");
    expect(loadingEl).not.toBeNull();
    expect(loadingEl.getAttribute("role")).toBe("status");
    expect(loadingEl.textContent).toContain("Loading contacts");
  });

  it("mounts scene header, breadcrumbs, and renders table with contact records", async () => {
    const fakeClient = createFakeApiClient({
      contacts: sampleContacts,
    });

    view = new ContactsView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    // Verify Scene Header & Breadcrumbs
    const titleEl = container.querySelector("#contacts-title");
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toBe("Contacts Information");

    const breadcrumbs = container.querySelector(".scene-breadcrumbs");
    expect(breadcrumbs).not.toBeNull();
    expect(breadcrumbs.textContent).toContain("Data Management");
    expect(breadcrumbs.textContent).toContain("Contacts Information");

    // Verify Table Rows
    const rows = container.querySelectorAll(".data-table-body .data-table-row");
    expect(rows.length).toBe(3);

    // Verify First Row Values
    const firstRowCells = rows[0].querySelectorAll(".data-table-td");
    const cellTexts = Array.from(firstRowCells).map((c) => c.textContent.trim());

    expect(cellTexts[0]).toBe("1"); // ID
    expect(cellTexts[1]).toBe("123512"); // Registrar ID
    expect(cellTexts[2]).toBe("Jon Snow"); // Name
    expect(cellTexts[3]).toBe("35"); // Age
    expect(cellTexts[4]).toBe("(665)121-5454"); // Phone
    expect(cellTexts[5]).toBe("jonsnow@gmail.com"); // Email
    expect(cellTexts[6]).toBe("0912 Won Street, Alabama, SY 10001"); // Address
    expect(cellTexts[7]).toBe("New York"); // City
    expect(cellTexts[8]).toBe("10001"); // Zip Code
  });

  it("filters contacts via DataTable search input", async () => {
    const fakeClient = createFakeApiClient({
      contacts: sampleContacts,
    });

    view = new ContactsView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    const searchInput = container.querySelector(".data-table-search-input");
    expect(searchInput).not.toBeNull();

    // Type query "estanza"
    searchInput.value = "estanza";
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));

    const rows = container.querySelectorAll(".data-table-body .data-table-row");
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain("Jaime Lannister");
    expect(rows[0].textContent).toContain("Estanza");
  });

  it("sorts contacts when clicking sortable column header", async () => {
    const fakeClient = createFakeApiClient({
      contacts: sampleContacts,
    });

    view = new ContactsView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    const ageHeader = container.querySelector('th[data-column-key="age"]');
    expect(ageHeader).not.toBeNull();

    // Click to sort ascending (35, 42, 45)
    ageHeader.click();
    let rows = container.querySelectorAll(".data-table-body .data-table-row");
    expect(rows[0].textContent).toContain("Jon Snow");

    // Click to sort descending (45, 42, 35)
    ageHeader.click();
    rows = container.querySelectorAll(".data-table-body .data-table-row");
    expect(rows[0].textContent).toContain("Jaime Lannister");
  });

  it("displays error state with retry button when initial getContacts fails, and retries on click", async () => {
    let callCount = 0;
    const clientWithRetry = {
      async getContacts() {
        callCount++;
        if (callCount === 1) {
          throw new Error("Failed to connect to Contacts service");
        }
        return sampleContacts;
      },
    };

    view = new ContactsView({ apiClient: clientWithRetry });
    view.mount(container);

    await view.fetchPromise;

    const errorEl = container.querySelector('[data-testid="contacts-error"]');
    expect(errorEl).not.toBeNull();
    expect(errorEl.getAttribute("role")).toBe("alert");
    expect(errorEl.textContent).toContain("Failed to connect to Contacts service");

    const retryBtn = container.querySelector("#retry-contacts-btn");
    expect(retryBtn).not.toBeNull();
    retryBtn.click();

    await view.fetchPromise;

    expect(callCount).toBe(2);
    expect(container.querySelector('[data-testid="contacts-error"]')).toBeNull();
    expect(container.querySelectorAll(".data-table-body .data-table-row").length).toBe(3);
  });

  it("cleans up resources and unmounts DOM element cleanly", async () => {
    const fakeClient = createFakeApiClient({
      contacts: sampleContacts,
    });
    view = new ContactsView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    expect(container.querySelector(".contacts-scene")).not.toBeNull();

    view.unmount();
    expect(container.querySelector(".contacts-scene")).toBeNull();
  });
});
