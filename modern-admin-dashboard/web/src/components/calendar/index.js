/**
 * Calendar Component Module
 * Zero-framework deep module encapsulating framework-agnostic FullCalendar vanilla engine.
 * Adheres to ADR 0004: callers and tests must never import @fullcalendar/* directly.
 */

import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";

export class CalendarComponent {
  /**
   * @param {Object} [options={}]
   * @param {Array<Object>} [options.events=[]] - Initial calendar events
   * @param {string} [options.initialView="dayGridMonth"] - Initial view mode
   * @param {boolean} [options.selectable=true] - Whether date ranges can be selected
   * @param {boolean} [options.editable=false] - Whether events can be dragged or resized
   * @param {Object} [options.headerToolbar] - FullCalendar toolbar configuration
   * @param {(selection: { start: Date, end: Date, startStr: string, endStr: string, allDay: boolean }) => void} [options.onSelect]
   * @param {(eventInfo: { id: number | string, title: string, start: Date | string, end?: Date | string, allDay: boolean, event: any, el?: HTMLElement }) => void} [options.onEventClick]
   * @param {boolean} [options.forceFallback=false] - Force headless fallback rendering
   */
  constructor(options = {}) {
    this.events = options.events ? [...options.events] : [];
    this.initialView = options.initialView || "dayGridMonth";
    this.selectable = options.selectable !== false;
    this.editable = Boolean(options.editable);
    this.headerToolbar = options.headerToolbar || {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
    };
    this.onSelect = options.onSelect || null;
    this.onEventClick = options.onEventClick || null;
    this.forceFallback = Boolean(options.forceFallback);

    // Internal state
    this.container = null;
    this.element = null;
    this.calendarEl = null;
    this.calendar = null;
    this.isMounted = false;
    this.isFallback = false;
    this.currentView = this.initialView;

    // Bound listeners for fallback
    this._handleFallbackClick = this._handleFallbackClick.bind(this);
  }

  /**
   * Mounts the calendar component into the specified container element.
   *
   * @param {HTMLElement} container
   * @param {Object} [mountOptions={}]
   */
  mount(container, mountOptions = {}) {
    if (!container) {
      throw new Error("Target container is required to mount CalendarComponent");
    }

    if (mountOptions.events) {
      this.events = [...mountOptions.events];
    }
    if (mountOptions.initialView) {
      this.initialView = mountOptions.initialView;
      this.currentView = mountOptions.initialView;
    }
    if (mountOptions.onSelect) {
      this.onSelect = mountOptions.onSelect;
    }
    if (mountOptions.onEventClick) {
      this.onEventClick = mountOptions.onEventClick;
    }

    this.container = container;
    this.isMounted = true;

    this.element = document.createElement("div");
    this.element.className = "calendar-component-wrapper";
    this.element.dataset.testid = "calendar-component";

    // Detect headless test environments or explicit fallback
    const isHeadlessEnv =
      this.forceFallback ||
      (typeof window !== "undefined" &&
        (window.__FORCE_CALENDAR_FALLBACK__ ||
          !window.ResizeObserver ||
          typeof container.getBoundingClientRect !== "function"));

    if (isHeadlessEnv) {
      this._mountFallback();
    } else {
      try {
        this._mountFullCalendar();
      } catch (err) {
        // Safe degrade to fallback if FullCalendar initialization fails
        console.warn("FullCalendar initialization failed, degrading to fallback:", err);
        this._mountFallback();
      }
    }

    this.container.innerHTML = "";
    this.container.appendChild(this.element);
  }

  /**
   * Mounts the native FullCalendar engine.
   * @private
   */
  _mountFullCalendar() {
    this.isFallback = false;
    this.calendarEl = document.createElement("div");
    this.calendarEl.className = "calendar-engine-container";
    this.element.appendChild(this.calendarEl);

    const self = this;
    this.calendar = new Calendar(this.calendarEl, {
      plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
      initialView: this.initialView,
      headerToolbar: this.headerToolbar,
      selectable: this.selectable,
      editable: this.editable,
      dayMaxEvents: true,
      events: this.events,
      select: (selectInfo) => {
        if (typeof self.onSelect === "function") {
          self.onSelect({
            start: selectInfo.start,
            end: selectInfo.end,
            startStr: selectInfo.startStr,
            endStr: selectInfo.endStr,
            allDay: selectInfo.allDay,
          });
        }
      },
      eventClick: (clickInfo) => {
        if (typeof self.onEventClick === "function") {
          const ev = clickInfo.event;
          self.onEventClick({
            id: Number(ev.id) || ev.id,
            title: ev.title,
            start: ev.start,
            end: ev.end,
            allDay: ev.allDay,
            event: ev,
            el: clickInfo.el,
          });
        }
      },
    });

    this.calendar.render();
  }

  /**
   * Mounts the structured headless testing fallback representation.
   * @private
   */
  _mountFallback() {
    this.isFallback = true;
    this.element.innerHTML = "";

    const fallbackEl = document.createElement("div");
    fallbackEl.className = "calendar-fallback";
    fallbackEl.dataset.testid = "calendar-fallback";

    // Toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "calendar-fallback-toolbar";
    toolbar.innerHTML = `
      <div class="calendar-fallback-title" data-testid="calendar-title">Calendar Schedule</div>
      <div class="calendar-fallback-actions">
        <button type="button" class="calendar-fallback-btn ${this.currentView === "dayGridMonth" ? "active" : ""}" data-action="view-month" data-view="dayGridMonth">Month</button>
        <button type="button" class="calendar-fallback-btn ${this.currentView === "timeGridWeek" ? "active" : ""}" data-action="view-week" data-view="timeGridWeek">Week</button>
        <button type="button" class="calendar-fallback-btn ${this.currentView === "timeGridDay" ? "active" : ""}" data-action="view-day" data-view="timeGridDay">Day</button>
        <button type="button" class="calendar-fallback-btn ${this.currentView === "listMonth" ? "active" : ""}" data-action="view-list" data-view="listMonth">List</button>
        <button type="button" class="calendar-fallback-btn" data-action="select-range" data-testid="calendar-select-action">Select Date</button>
      </div>
    `;

    // Events list
    const eventsList = document.createElement("ul");
    eventsList.className = "calendar-fallback-events-list";
    eventsList.dataset.testid = "calendar-fallback-events";

    if (this.events.length === 0) {
      eventsList.innerHTML = `<li class="calendar-fallback-empty" data-testid="calendar-empty">No events scheduled</li>`;
    } else {
      this.events.forEach((event) => {
        const li = document.createElement("li");
        li.className = "calendar-fallback-event-item";
        li.dataset.testid = `calendar-event-${event.id}`;
        li.dataset.eventId = String(event.id);

        const dateLabel = event.allDay ? `${event.start} (All Day)` : `${event.start}`;

        li.innerHTML = `
          <span class="calendar-fallback-event-title">${event.title}</span>
          <span class="calendar-fallback-event-dates">${dateLabel}</span>
        `;
        eventsList.appendChild(li);
      });
    }

    fallbackEl.appendChild(toolbar);
    fallbackEl.appendChild(eventsList);
    this.element.appendChild(fallbackEl);

    fallbackEl.addEventListener("click", this._handleFallbackClick);
  }

  /**
   * Handles click interactions in the fallback representation.
   * @param {MouseEvent} evt
   * @private
   */
  _handleFallbackClick(evt) {
    const target = evt.target;
    if (!target) return;

    // View switch button
    const viewBtn = target.closest("button[data-view]");
    if (viewBtn) {
      const view = viewBtn.dataset.view;
      this.currentView = view;
      this._mountFallback();
      return;
    }

    // Select date trigger button
    const selectBtn = target.closest("button[data-action='select-range']");
    if (selectBtn && typeof this.onSelect === "function") {
      const today = new Date().toISOString().split("T")[0];
      this.onSelect({
        start: new Date(today),
        end: new Date(today),
        startStr: today,
        endStr: today,
        allDay: true,
      });
      return;
    }

    // Event item click
    const eventItem = target.closest(".calendar-fallback-event-item");
    if (eventItem && typeof this.onEventClick === "function") {
      const eventId = eventItem.dataset.eventId;
      const found = this.events.find((e) => String(e.id) === eventId);
      if (found) {
        this.onEventClick({
          id: found.id,
          title: found.title,
          start: found.start,
          end: found.end,
          allDay: found.allDay,
          event: found,
          el: eventItem,
        });
      }
    }
  }

  /**
   * Updates the calendar with a new set of events or view mode.
   *
   * @param {Object} options
   * @param {Array<Object>} [options.events]
   * @param {string} [options.view]
   */
  update(options = {}) {
    if (!this.isMounted) return;

    if (options.events) {
      this.events = [...options.events];
    }
    if (options.view) {
      this.currentView = options.view;
    }

    if (this.isFallback) {
      this._mountFallback();
      return;
    }

    if (this.calendar) {
      if (options.view) {
        this.calendar.changeView(options.view);
      }
      if (options.events) {
        this.calendar.removeAllEvents();
        options.events.forEach((event) => {
          this.calendar.addEvent(event);
        });
      }
    }
  }

  /**
   * Returns a copy of the current events array.
   * @returns {Array<Object>}
   */
  getEvents() {
    return [...this.events];
  }

  /**
   * Returns the currently active view name.
   * @returns {string}
   */
  getView() {
    if (this.calendar && !this.isFallback) {
      return this.calendar.view?.type || this.currentView;
    }
    return this.currentView;
  }

  /**
   * Programmatically simulates date selection for tests or external triggers.
   * @param {Object} selectionRange
   */
  triggerSelect(selectionRange) {
    if (typeof this.onSelect === "function") {
      this.onSelect(selectionRange);
    }
  }

  /**
   * Programmatically simulates event clicking for tests or external triggers.
   * @param {number|string} eventId
   */
  triggerEventClick(eventId) {
    const found = this.events.find((e) => String(e.id) === String(eventId));
    if (found && typeof this.onEventClick === "function") {
      this.onEventClick({
        id: found.id,
        title: found.title,
        start: found.start,
        end: found.end,
        allDay: found.allDay,
        event: found,
        el: this.element?.querySelector(`[data-event-id="${eventId}"]`) || null,
      });
    }
  }

  /**
   * Unmounts the calendar component, destroys engine instances, and cleans up DOM.
   */
  unmount() {
    this.isMounted = false;

    if (this.calendar) {
      this.calendar.destroy();
      this.calendar = null;
    }

    if (this.element) {
      const fallbackEl = this.element.querySelector(".calendar-fallback");
      if (fallbackEl) {
        fallbackEl.removeEventListener("click", this._handleFallbackClick);
      }
      if (this.element.parentNode) {
        this.element.remove();
      }
    }

    this.calendarEl = null;
    this.element = null;
    this.container = null;
    this.events = [];
  }
}
