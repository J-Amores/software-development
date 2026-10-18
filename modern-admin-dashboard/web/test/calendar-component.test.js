// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CalendarComponent } from "../src/components/calendar/index.js";

describe("CalendarComponent Deep Module (ADR 0004)", () => {
  let container;

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

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "test-calendar-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.remove();
    }
  });

  describe("Lifecycle & Seam Contract", () => {
    it("throws an error when mounted without a valid container", () => {
      const calendar = new CalendarComponent();
      expect(() => calendar.mount(null)).toThrow(/target container is required/i);
    });

    it("mounts into the container with the standard wrapper element and testid", () => {
      const calendar = new CalendarComponent({ events: sampleEvents });
      calendar.mount(container);

      expect(calendar.isMounted).toBe(true);
      expect(container.querySelector("[data-testid='calendar-component']")).not.toBeNull();
      expect(container.querySelector(".calendar-component-wrapper")).not.toBeNull();

      calendar.unmount();
      expect(calendar.isMounted).toBe(false);
      expect(container.innerHTML).toBe("");
    });

    it("cleans up resources and detaches elements upon unmount", () => {
      const calendar = new CalendarComponent({ events: sampleEvents });
      calendar.mount(container);

      expect(calendar.element).not.toBeNull();
      expect(container.contains(calendar.element)).toBe(true);

      calendar.unmount();
      expect(calendar.element).toBeNull();
      expect(calendar.container).toBeNull();
      expect(calendar.events).toEqual([]);
      expect(container.childNodes.length).toBe(0);
    });
  });

  describe("FullCalendar Engine Integration", () => {
    it("renders the FullCalendar engine and toolbar in the container", () => {
      const calendar = new CalendarComponent({
        events: sampleEvents,
        initialView: "dayGridMonth",
      });
      calendar.mount(container);

      // FullCalendar creates .fc container with toolbar
      const engineEl = container.querySelector(".calendar-engine-container");
      expect(engineEl).not.toBeNull();
      expect(engineEl.classList.contains("fc")).toBe(true);
      expect(engineEl.querySelector(".fc-header-toolbar")).not.toBeNull();

      calendar.unmount();
    });

    it("allows updating events and switching view modes via update()", () => {
      const calendar = new CalendarComponent({ events: sampleEvents });
      calendar.mount(container);

      expect(calendar.getEvents()).toHaveLength(3);

      const updatedEvents = [
        { id: 4, title: "Executive Committee Briefing", start: "2026-10-18", allDay: true },
      ];
      calendar.update({ events: updatedEvents, view: "listMonth" });

      expect(calendar.getEvents()).toHaveLength(1);
      expect(calendar.getEvents()[0].title).toBe("Executive Committee Briefing");

      calendar.unmount();
    });

    it("triggers onSelect and onEventClick callbacks cleanly", () => {
      const onSelect = vi.fn();
      const onEventClick = vi.fn();

      const calendar = new CalendarComponent({
        events: sampleEvents,
        onSelect,
        onEventClick,
      });
      calendar.mount(container);

      // Test programmatic trigger helpers
      calendar.triggerSelect({
        start: new Date("2026-10-15"),
        end: new Date("2026-10-16"),
        allDay: true,
      });
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          allDay: true,
        }),
      );

      calendar.triggerEventClick(1);
      expect(onEventClick).toHaveBeenCalledTimes(1);
      expect(onEventClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          title: "All-Day Operational Review",
        }),
      );

      calendar.unmount();
    });
  });

  describe("Headless Testing Fallback Representation", () => {
    it("renders the fallback UI with title, actions, and event list when forceFallback is enabled", () => {
      const calendar = new CalendarComponent({
        events: sampleEvents,
        forceFallback: true,
      });
      calendar.mount(container);

      expect(calendar.isFallback).toBe(true);
      const fallback = container.querySelector("[data-testid='calendar-fallback']");
      expect(fallback).not.toBeNull();

      const title = container.querySelector("[data-testid='calendar-title']");
      expect(title?.textContent).toContain("Calendar Schedule");

      const eventItems = container.querySelectorAll(".calendar-fallback-event-item");
      expect(eventItems).toHaveLength(3);
      expect(container.querySelector("[data-testid='calendar-event-1']")).not.toBeNull();

      calendar.unmount();
    });

    it("displays an empty state in fallback mode when no events exist", () => {
      const calendar = new CalendarComponent({
        events: [],
        forceFallback: true,
      });
      calendar.mount(container);

      const emptyEl = container.querySelector("[data-testid='calendar-empty']");
      expect(emptyEl).not.toBeNull();
      expect(emptyEl?.textContent).toContain("No events scheduled");

      calendar.unmount();
    });

    it("handles view switching, date selection, and event clicks in fallback mode", () => {
      const onSelect = vi.fn();
      const onEventClick = vi.fn();

      const calendar = new CalendarComponent({
        events: sampleEvents,
        forceFallback: true,
        onSelect,
        onEventClick,
      });
      calendar.mount(container);

      // Click view switch button
      const weekBtn = container.querySelector("button[data-view='timeGridWeek']");
      weekBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(calendar.getView()).toBe("timeGridWeek");

      // Click select date action button
      const selectBtn = container.querySelector("[data-testid='calendar-select-action']");
      selectBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(onSelect).toHaveBeenCalledTimes(1);

      // Click event item
      const eventItem = container.querySelector("[data-testid='calendar-event-2']");
      eventItem?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(onEventClick).toHaveBeenCalledTimes(1);
      expect(onEventClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 2,
          title: "Quarterly Strategic Planning",
        }),
      );

      calendar.unmount();
    });

    it("updates fallback events dynamically via update()", () => {
      const calendar = new CalendarComponent({
        events: sampleEvents,
        forceFallback: true,
      });
      calendar.mount(container);

      expect(container.querySelectorAll(".calendar-fallback-event-item")).toHaveLength(3);

      calendar.update({
        events: [{ id: 99, title: "Special Audit", start: "2026-10-31", allDay: true }],
      });

      const updatedItems = container.querySelectorAll(".calendar-fallback-event-item");
      expect(updatedItems).toHaveLength(1);
      expect(container.querySelector("[data-testid='calendar-event-99']")).not.toBeNull();

      calendar.unmount();
    });
  });
});
