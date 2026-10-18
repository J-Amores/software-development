// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CalendarView } from "../src/views/calendar-view.js";
import { createFakeApiClient } from "../src/api/index.js";

const sampleEvents = [
  {
    id: 1,
    title: "All-Day Operational Review",
    start: "2026-10-01",
    allDay: true,
  },
  {
    id: 2,
    title: "Quarterly Strategic Planning",
    start: "2026-10-07",
    end: "2026-10-09",
    allDay: true,
  },
  {
    id: 3,
    title: "Infrastructure Maintenance Window",
    start: "2026-10-14T02:00:00.000Z",
    end: "2026-10-14T06:00:00.000Z",
    allDay: false,
  },
];

describe("CalendarView Component (/calendar)", () => {
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
    if (container && container.parentNode) {
      container.remove();
    }
  });

  describe("Lifecycle & Rendering", () => {
    it("throws an error when mounted without a container", () => {
      const calendarView = new CalendarView();
      expect(() => calendarView.mount(null)).toThrow(/target container is required/i);
    });

    it("renders the scene breadcrumbs, header, and action button", async () => {
      const fakeClient = createFakeApiClient({ events: sampleEvents });
      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);

      // Breadcrumb & title
      expect(container.querySelector(".scene-breadcrumbs")).not.toBeNull();
      expect(container.querySelector("#calendar-title")?.textContent).toBe("Calendar");
      expect(container.querySelector(".scene-subtitle")?.textContent).toContain(
        "Scheduled milestones",
      );

      // Add Event button
      const addBtn = container.querySelector("[data-testid='add-event-btn']");
      expect(addBtn).not.toBeNull();
      expect(addBtn?.textContent).toContain("+ Add Event");

      // Wait for async loadEvents
      await new Promise((r) => setTimeout(r, 10));

      expect(view.isMounted).toBe(true);
      expect(view.calendarComponent).not.toBeNull();
    });

    it("renders the upcoming events sidebar with sorted events and badge count", async () => {
      const fakeClient = createFakeApiClient({ events: sampleEvents });
      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);

      await new Promise((r) => setTimeout(r, 10));

      const countBadge = container.querySelector("[data-testid='sidebar-event-count']");
      expect(countBadge?.textContent).toBe("3");

      const eventCards = container.querySelectorAll(".calendar-sidebar-event-card");
      expect(eventCards.length).toBe(3);

      // Chronological order: id 1 (2026-10-01), id 2 (2026-10-07), id 3 (2026-10-14)
      expect(eventCards[0].textContent).toContain("All-Day Operational Review");
      expect(eventCards[0].textContent).toContain("(All Day)");
      expect(eventCards[1].textContent).toContain("Quarterly Strategic Planning");
      expect(eventCards[2].textContent).toContain("Infrastructure Maintenance Window");
    });

    it("renders empty state in sidebar when no events are scheduled", async () => {
      const fakeClient = createFakeApiClient({ events: [] });
      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);

      await new Promise((r) => setTimeout(r, 10));

      const countBadge = container.querySelector("[data-testid='sidebar-event-count']");
      expect(countBadge?.textContent).toBe("0");

      const emptyEl = container.querySelector("[data-testid='sidebar-empty']");
      expect(emptyEl).not.toBeNull();
      expect(emptyEl?.textContent).toContain("No upcoming events scheduled");
    });
  });

  describe("Event Creation Modal & Flow", () => {
    it("opens the create modal dialog when clicking '+ Add Event'", async () => {
      const fakeClient = createFakeApiClient({ events: sampleEvents });
      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const dialog = container.querySelector("[data-testid='event-create-dialog']");
      expect(dialog?.hasAttribute("open")).toBe(false);

      const addBtn = container.querySelector("[data-testid='add-event-btn']");
      addBtn?.click();

      expect(dialog?.hasAttribute("open")).toBe(true);
    });

    it("closes the create modal when clicking cancel or dismiss button", async () => {
      const fakeClient = createFakeApiClient({ events: sampleEvents });
      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const dialog = container.querySelector("[data-testid='event-create-dialog']");
      const addBtn = container.querySelector("[data-testid='add-event-btn']");
      addBtn?.click();
      expect(dialog?.hasAttribute("open")).toBe(true);

      const cancelBtn = container.querySelector("[data-testid='cancel-create-btn']");
      cancelBtn?.click();
      expect(dialog?.hasAttribute("open")).toBe(false);

      // Reopen and test dismiss '✕' button
      addBtn?.click();
      expect(dialog?.hasAttribute("open")).toBe(true);

      const dismissBtn = dialog?.querySelector(".calendar-modal-dismiss");
      dismissBtn?.click();
      expect(dialog?.hasAttribute("open")).toBe(false);
    });

    it("submits the create event form, updates sidebar, calendar component, and displays status alert", async () => {
      const fakeClient = createFakeApiClient({ events: [...sampleEvents] });
      const createSpy = vi.spyOn(fakeClient, "createEvent");

      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      // Open modal
      container.querySelector("[data-testid='add-event-btn']")?.click();

      const form = container.querySelector("[data-testid='event-create-form']");
      const titleInput = container.querySelector("[data-testid='event-title-input']");
      const startInput = container.querySelector("[data-testid='event-start-input']");
      const endInput = container.querySelector("[data-testid='event-end-input']");
      const allDayInput = container.querySelector("[data-testid='event-all-day-input']");

      titleInput.value = "Executive Roadmap Review";
      startInput.value = "2026-10-25";
      endInput.value = "2026-10-26";
      allDayInput.checked = true;

      // Submit form
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((r) => setTimeout(r, 20));

      expect(createSpy).toHaveBeenCalledWith({
        title: "Executive Roadmap Review",
        start: "2026-10-25",
        end: "2026-10-26",
        allDay: true,
      });

      // Dialog should be closed
      const dialog = container.querySelector("[data-testid='event-create-dialog']");
      expect(dialog?.hasAttribute("open")).toBe(false);

      // Badge count should increase
      const countBadge = container.querySelector("[data-testid='sidebar-event-count']");
      expect(countBadge?.textContent).toBe("4");

      // Sidebar should display new event card
      expect(container.textContent).toContain("Executive Roadmap Review");

      // Alert should be displayed
      const alert = container.querySelector("[data-testid='calendar-alert-status']");
      expect(alert).not.toBeNull();
      expect(alert?.textContent).toContain("Executive Roadmap Review");
      expect(alert?.textContent).toContain("scheduled successfully");
    });

    it("opens create modal with prefilled date when date selection occurs on calendar", async () => {
      const fakeClient = createFakeApiClient({ events: sampleEvents });
      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      // Trigger calendar component selection callback
      view._handleDateSelect({
        startStr: "2026-11-05",
        endStr: "2026-11-06",
        allDay: true,
      });

      const dialog = container.querySelector("[data-testid='event-create-dialog']");
      expect(dialog?.hasAttribute("open")).toBe(true);

      const startInput = container.querySelector("[data-testid='event-start-input']");
      const endInput = container.querySelector("[data-testid='event-end-input']");
      expect(startInput?.value).toBe("2026-11-05");
      expect(endInput?.value).toBe("2026-11-06");
    });
  });

  describe("Event Deletion Modal & Flow", () => {
    it("opens delete confirmation dialog when clicking the sidebar delete button", async () => {
      const fakeClient = createFakeApiClient({ events: [...sampleEvents] });
      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const deleteBtn = container.querySelector(
        "[data-testid='sidebar-event-1'] [data-action='delete-event']",
      );
      deleteBtn?.click();

      const dialog = container.querySelector("[data-testid='event-delete-dialog']");
      expect(dialog?.hasAttribute("open")).toBe(true);

      const detailsEl = container.querySelector("[data-testid='delete-event-details']");
      expect(detailsEl?.textContent).toContain("All-Day Operational Review");
      expect(detailsEl?.textContent).toContain("2026-10-01");
    });

    it("opens delete confirmation dialog when clicking the sidebar event card", async () => {
      const fakeClient = createFakeApiClient({ events: [...sampleEvents] });
      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const card = container.querySelector("[data-testid='sidebar-event-2']");
      card?.click();

      const dialog = container.querySelector("[data-testid='event-delete-dialog']");
      expect(dialog?.hasAttribute("open")).toBe(true);

      const detailsEl = container.querySelector("[data-testid='delete-event-details']");
      expect(detailsEl?.textContent).toContain("Quarterly Strategic Planning");
    });

    it("cancels deletion when clicking cancel button in delete dialog", async () => {
      const fakeClient = createFakeApiClient({ events: [...sampleEvents] });
      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const card = container.querySelector("[data-testid='sidebar-event-1']");
      card?.click();

      const dialog = container.querySelector("[data-testid='event-delete-dialog']");
      expect(dialog?.hasAttribute("open")).toBe(true);

      const cancelBtn = container.querySelector("[data-testid='cancel-delete-btn']");
      cancelBtn?.click();

      expect(dialog?.hasAttribute("open")).toBe(false);
      expect(view.selectedEventForDeletion).toBeNull();
    });

    it("confirms deletion, removes event from sidebar, updates calendar, and shows alert", async () => {
      const fakeClient = createFakeApiClient({ events: [...sampleEvents] });
      const deleteSpy = vi.spyOn(fakeClient, "deleteEvent");

      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      // Click delete button for event 1
      const deleteBtn = container.querySelector(
        "[data-testid='sidebar-event-1'] [data-action='delete-event']",
      );
      deleteBtn?.click();

      // Click confirm delete button
      const confirmBtn = container.querySelector("[data-testid='confirm-delete-btn']");
      confirmBtn?.click();
      await new Promise((r) => setTimeout(r, 20));

      expect(deleteSpy).toHaveBeenCalledWith(1);

      // Dialog closed
      const dialog = container.querySelector("[data-testid='event-delete-dialog']");
      expect(dialog?.hasAttribute("open")).toBe(false);

      // Event count decreased
      const countBadge = container.querySelector("[data-testid='sidebar-event-count']");
      expect(countBadge?.textContent).toBe("2");

      // Event 1 no longer in sidebar
      expect(container.querySelector("[data-testid='sidebar-event-1']")).toBeNull();

      // Alert shown
      const alert = container.querySelector("[data-testid='calendar-alert-status']");
      expect(alert).not.toBeNull();
      expect(alert?.textContent).toContain("successfully removed");
    });

    it("opens delete dialog when calendar component triggers event click", async () => {
      const fakeClient = createFakeApiClient({ events: sampleEvents });
      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      view._handleEventClick({
        id: 3,
        title: "Infrastructure Maintenance Window",
        start: "2026-10-14",
      });

      const dialog = container.querySelector("[data-testid='event-delete-dialog']");
      expect(dialog?.hasAttribute("open")).toBe(true);

      const detailsEl = container.querySelector("[data-testid='delete-event-details']");
      expect(detailsEl?.textContent).toContain("Infrastructure Maintenance Window");
    });
  });

  describe("Error Handling & Dismissal", () => {
    it("displays error banner when loading events fails", async () => {
      const fakeClient = createFakeApiClient({
        shouldThrow: true,
        errorMessage: "Network connectivity severed",
      });

      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const alert = container.querySelector("[data-testid='calendar-alert-error']");
      expect(alert).not.toBeNull();
      expect(alert?.textContent).toContain("Failed to load calendar events");
      expect(alert?.textContent).toContain("Network connectivity severed");
    });

    it("displays error banner when event creation fails", async () => {
      const fakeClient = createFakeApiClient({ events: [...sampleEvents] });
      vi.spyOn(fakeClient, "createEvent").mockRejectedValue(new Error("Database write locked"));

      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      container.querySelector("[data-testid='add-event-btn']")?.click();
      const form = container.querySelector("[data-testid='event-create-form']");
      container.querySelector("[data-testid='event-title-input']").value = "Critical Bug Fix";
      container.querySelector("[data-testid='event-start-input']").value = "2026-10-18";

      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((r) => setTimeout(r, 20));

      const alert = container.querySelector("[data-testid='calendar-alert-error']");
      expect(alert).not.toBeNull();
      expect(alert?.textContent).toContain("Failed to schedule event");
      expect(alert?.textContent).toContain("Database write locked");
    });

    it("displays error banner when event deletion fails", async () => {
      const fakeClient = createFakeApiClient({ events: [...sampleEvents] });
      vi.spyOn(fakeClient, "deleteEvent").mockRejectedValue(new Error("Permission denied"));

      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const deleteBtn = container.querySelector(
        "[data-testid='sidebar-event-1'] [data-action='delete-event']",
      );
      deleteBtn?.click();

      const confirmBtn = container.querySelector("[data-testid='confirm-delete-btn']");
      confirmBtn?.click();
      await new Promise((r) => setTimeout(r, 20));

      const alert = container.querySelector("[data-testid='calendar-alert-error']");
      expect(alert).not.toBeNull();
      expect(alert?.textContent).toContain("Failed to remove event");
      expect(alert?.textContent).toContain("Permission denied");
    });

    it("dismisses alert banner when clicking alert dismiss button", async () => {
      const fakeClient = createFakeApiClient({
        shouldThrow: true,
        errorMessage: "Temporary glitch",
      });

      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const alert = container.querySelector("[data-testid='calendar-alert-error']");
      expect(alert).not.toBeNull();

      const dismissBtn = alert?.querySelector(".calendar-alert-dismiss");
      dismissBtn?.click();

      expect(container.querySelector("[data-testid='calendar-alert-error']")).toBeNull();
    });
  });

  describe("Unmount & Cleanup", () => {
    it("cleans up child calendar component, DOM elements, and dialogs cleanly", async () => {
      const fakeClient = createFakeApiClient({ events: sampleEvents });
      view = new CalendarView({ apiClient: fakeClient, forceCalendarFallback: true });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      expect(view.isMounted).toBe(true);
      expect(container.children.length).toBeGreaterThan(0);

      view.unmount();

      expect(view.isMounted).toBe(false);
      expect(view.calendarComponent).toBeNull();
      expect(container.innerHTML).toBe("");
    });
  });
});
