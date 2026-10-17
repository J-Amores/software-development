// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TeamView } from "../src/views/team-view.js";
import { createFakeApiClient } from "../src/api/index.js";

const sampleMembers = [
  {
    id: 1,
    name: "Jon Snow",
    email: "jonsnow@gmail.com",
    age: 35,
    phone: "(665)121-5454",
    access: "admin",
  },
  {
    id: 2,
    name: "Cersei Lannister",
    email: "cerseilannister@gmail.com",
    age: 42,
    phone: "(421)314-2288",
    access: "manager",
  },
  {
    id: 3,
    name: "Jaime Lannister",
    email: "jaimelannister@gmail.com",
    age: 45,
    phone: "(422)982-6739",
    access: "user",
  },
];

describe("TeamView Component", () => {
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

  it("renders loading state initially while fetching team members", () => {
    const fakeClient = createFakeApiClient({
      delayMs: 100,
      teamMembers: sampleMembers,
    });

    view = new TeamView({ apiClient: fakeClient });
    view.mount(container);

    const loadingEl = container.querySelector(".team-status-loading");
    expect(loadingEl).not.toBeNull();
    expect(loadingEl.getAttribute("role")).toBe("status");
    expect(loadingEl.textContent).toContain("Loading team members");
  });

  it("mounts scene header, breadcrumbs, and renders table with team members", async () => {
    const fakeClient = createFakeApiClient({
      teamMembers: sampleMembers,
    });

    view = new TeamView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    // Verify Scene Header & Breadcrumbs
    const titleEl = container.querySelector("#team-title");
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toBe("Manage Team");

    const breadcrumbs = container.querySelector(".scene-breadcrumbs");
    expect(breadcrumbs).not.toBeNull();
    expect(breadcrumbs.textContent).toContain("Data Management");
    expect(breadcrumbs.textContent).toContain("Manage Team");

    // Verify Table Rows
    const rows = container.querySelectorAll(".data-table-body .data-table-row");
    expect(rows.length).toBe(3);

    // Verify Columns for First Member
    const firstRow = rows[0];
    const cells = firstRow.querySelectorAll(".data-table-td");
    const cellTexts = Array.from(cells).map((c) => c.textContent.trim());

    expect(cellTexts[0]).toBe("1"); // ID
    expect(cellTexts[1]).toBe("Jon Snow"); // Name
    expect(cellTexts[2]).toBe("35"); // Age
    expect(cellTexts[3]).toBe("(665)121-5454"); // Phone
    expect(cellTexts[4]).toBe("jonsnow@gmail.com"); // Email
  });

  it("renders access level color-coded badges and accessible inline selects", async () => {
    const fakeClient = createFakeApiClient({
      teamMembers: sampleMembers,
    });

    view = new TeamView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    const rows = container.querySelectorAll(".data-table-body .data-table-row");

    // Row 1: Admin
    const badge1 = rows[0].querySelector(".badge-admin");
    expect(badge1).not.toBeNull();
    expect(badge1.textContent.trim().toLowerCase()).toBe("admin");

    const select1 = rows[0].querySelector(".access-select");
    expect(select1).not.toBeNull();
    expect(select1.value).toBe("admin");
    expect(select1.getAttribute("aria-label")).toBe("Change Access Level for Jon Snow");

    // Row 2: Manager
    const badge2 = rows[1].querySelector(".badge-manager");
    expect(badge2).not.toBeNull();
    expect(badge2.textContent.trim().toLowerCase()).toBe("manager");

    const select2 = rows[1].querySelector(".access-select");
    expect(select2.value).toBe("manager");

    // Row 3: User
    const badge3 = rows[2].querySelector(".badge-user");
    expect(badge3).not.toBeNull();
    expect(badge3.textContent.trim().toLowerCase()).toBe("user");

    const select3 = rows[2].querySelector(".access-select");
    expect(select3.value).toBe("user");
  });

  it("updates access level when select changes, calls apiClient.updateTeamMemberAccess, updates badge, and shows success alert", async () => {
    const fakeClient = createFakeApiClient({
      teamMembers: sampleMembers,
    });
    const updateSpy = vi.spyOn(fakeClient, "updateTeamMemberAccess");

    view = new TeamView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    const select = container.querySelector('.access-select[data-member-id="3"]');
    expect(select).not.toBeNull();
    expect(select.value).toBe("user");

    // Change access from "user" to "admin"
    select.value = "admin";
    select.dispatchEvent(new Event("change", { bubbles: true }));

    // Wait for the mutation to finish
    await view.mutationPromise;

    expect(updateSpy).toHaveBeenCalledWith(3, "admin");

    // Verify row badge updated
    const row3 = container.querySelector('.data-table-row[data-row-id="3"]');
    const updatedBadge = row3.querySelector(".badge-admin");
    expect(updatedBadge).not.toBeNull();
    expect(updatedBadge.textContent.trim().toLowerCase()).toBe("admin");

    // Verify success banner with role="status"
    const alertEl = container.querySelector('[data-testid="team-alert-status"]');
    expect(alertEl).not.toBeNull();
    expect(alertEl.getAttribute("role")).toBe("status");
    expect(alertEl.textContent).toContain("Jaime Lannister");
    expect(alertEl.textContent).toContain("admin");
  });

  it("handles access update API failure gracefully, displays error alert, and reverts select value", async () => {
    const fakeClient = createFakeApiClient({
      teamMembers: sampleMembers,
    });
    vi.spyOn(fakeClient, "updateTeamMemberAccess").mockRejectedValue(
      new Error("Database connection timed out"),
    );

    view = new TeamView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    const select = container.querySelector('.access-select[data-member-id="1"]');
    expect(select.value).toBe("admin");

    // Attempt to change access
    select.value = "manager";
    select.dispatchEvent(new Event("change", { bubbles: true }));

    await view.mutationPromise;

    // Verify error banner with role="alert"
    const errorAlert = container.querySelector('[data-testid="team-alert-error"]');
    expect(errorAlert).not.toBeNull();
    expect(errorAlert.getAttribute("role")).toBe("alert");
    expect(errorAlert.textContent).toContain("Failed to update access level for Jon Snow");
    expect(errorAlert.textContent).toContain("Database connection timed out");

    // Verify select was reverted back to original value "admin"
    const revertedSelect = container.querySelector('.access-select[data-member-id="1"]');
    expect(revertedSelect.value).toBe("admin");

    // Verify badge stayed admin
    const badge = container.querySelector('.data-table-row[data-row-id="1"] .badge-admin');
    expect(badge).not.toBeNull();
  });

  it("dismisses alert banner when dismiss button is clicked", async () => {
    const fakeClient = createFakeApiClient({
      teamMembers: sampleMembers,
    });

    view = new TeamView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    const select = container.querySelector('.access-select[data-member-id="2"]');
    select.value = "admin";
    select.dispatchEvent(new Event("change", { bubbles: true }));

    await view.mutationPromise;

    const alertEl = container.querySelector('[data-testid="team-alert-status"]');
    expect(alertEl).not.toBeNull();

    const dismissBtn = alertEl.querySelector(".team-alert-dismiss");
    expect(dismissBtn).not.toBeNull();
    dismissBtn.click();

    expect(container.querySelector('[data-testid="team-alert-status"]')).toBeNull();
  });

  it("displays error state with retry button when initial getTeamMembers fails, and retries on click", async () => {
    let callCount = 0;
    const clientWithRetry = {
      async getTeamMembers() {
        callCount++;
        if (callCount === 1) {
          throw new Error("API unreachable");
        }
        return sampleMembers;
      },
      async updateTeamMemberAccess() {},
    };

    view = new TeamView({ apiClient: clientWithRetry });
    view.mount(container);

    await view.fetchPromise;

    // Verify error state
    const errorEl = container.querySelector('[data-testid="team-error"]');
    expect(errorEl).not.toBeNull();
    expect(errorEl.getAttribute("role")).toBe("alert");
    expect(errorEl.textContent).toContain("API unreachable");

    const retryBtn = container.querySelector("#retry-team-btn");
    expect(retryBtn).not.toBeNull();

    // Click retry
    retryBtn.click();

    await view.fetchPromise;

    expect(callCount).toBe(2);
    expect(container.querySelector('[data-testid="team-error"]')).toBeNull();
    expect(container.querySelectorAll(".data-table-body .data-table-row").length).toBe(3);
  });

  it("cleans up resources and unmounts DOM element cleanly", async () => {
    const fakeClient = createFakeApiClient({
      teamMembers: sampleMembers,
    });
    view = new TeamView({ apiClient: fakeClient });
    view.mount(container);

    await view.fetchPromise;

    expect(container.querySelector(".team-scene")).not.toBeNull();

    view.unmount();
    expect(container.querySelector(".team-scene")).toBeNull();
  });

  it("renders delete button with accessible aria-label for each member row", async () => {
    const fakeClient = createFakeApiClient({
      teamMembers: sampleMembers,
    });
    view = new TeamView({ apiClient: fakeClient });
    view.mount(container);
    await view.fetchPromise;

    const deleteBtns = container.querySelectorAll(".btn-delete-row");
    expect(deleteBtns.length).toBe(3);
    expect(deleteBtns[0].getAttribute("aria-label")).toBe("Delete Team Member Jon Snow");
  });

  it("does not delete team member if confirmation is cancelled", async () => {
    const fakeClient = createFakeApiClient({
      teamMembers: sampleMembers,
    });
    view = new TeamView({ apiClient: fakeClient });
    view.mount(container);
    await view.fetchPromise;

    window.confirm.mockReturnValue(false);
    const deleteSpy = vi.spyOn(fakeClient, "deleteTeamMember");

    const deleteBtn = container.querySelector('.btn-delete-row[data-member-id="1"]');
    deleteBtn.click();

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("Jon Snow"));
    expect(deleteSpy).not.toHaveBeenCalled();

    const rows = container.querySelectorAll(".data-table-body .data-table-row");
    expect(rows.length).toBe(3);
  });

  it("deletes team member upon confirmed prompt, updates table, and shows success alert", async () => {
    const fakeClient = createFakeApiClient({
      teamMembers: sampleMembers,
    });
    view = new TeamView({ apiClient: fakeClient });
    view.mount(container);
    await view.fetchPromise;

    window.confirm.mockReturnValue(true);
    const deleteSpy = vi.spyOn(fakeClient, "deleteTeamMember");

    const deleteBtn = container.querySelector('.btn-delete-row[data-member-id="2"]');
    deleteBtn.click();

    await view.mutationPromise;

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteSpy).toHaveBeenCalledWith(2);

    // Verify row removed from table
    const rows = container.querySelectorAll(".data-table-body .data-table-row");
    expect(rows.length).toBe(2);
    expect(container.querySelector('.data-table-row[data-row-id="2"]')).toBeNull();

    // Verify status banner
    const alertEl = container.querySelector('[data-testid="team-alert-status"]');
    expect(alertEl).not.toBeNull();
    expect(alertEl.getAttribute("role")).toBe("status");
    expect(alertEl.textContent).toContain("Cersei Lannister");
    expect(alertEl.textContent).toContain("deleted");
  });

  it("displays error alert when delete fails on server and retains row", async () => {
    const fakeClient = {
      async getTeamMembers() {
        return sampleMembers;
      },
      async deleteTeamMember() {
        throw new Error("Database timeout on delete");
      },
    };

    view = new TeamView({ apiClient: fakeClient });
    view.mount(container);
    await view.fetchPromise;

    window.confirm.mockReturnValue(true);

    const deleteBtn = container.querySelector('.btn-delete-row[data-member-id="1"]');
    deleteBtn.click();

    await view.mutationPromise;

    // Verify error banner
    const errorAlert = container.querySelector('[data-testid="team-alert-error"]');
    expect(errorAlert).not.toBeNull();
    expect(errorAlert.getAttribute("role")).toBe("alert");
    expect(errorAlert.textContent).toContain("Failed to delete Jon Snow");
    expect(errorAlert.textContent).toContain("Database timeout on delete");

    // Verify row still exists in table
    const rows = container.querySelectorAll(".data-table-body .data-table-row");
    expect(rows.length).toBe(3);
  });
});
