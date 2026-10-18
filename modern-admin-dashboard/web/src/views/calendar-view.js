import { apiClient as defaultApiClient } from "../api/index.js";
import { CalendarComponent } from "../components/calendar/index.js";

/**
 * Helper to open HTML <dialog> elements with fallback for test environments.
 * @param {HTMLDialogElement} dialog
 */
function openModal(dialog) {
  if (!dialog) return;
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

/**
 * Helper to close HTML <dialog> elements with fallback for test environments.
 * @param {HTMLDialogElement} dialog
 */
function closeModal(dialog) {
  if (!dialog) return;
  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}

/**
 * Interactive Calendar View (/calendar)
 * Live operational view pairing encapsulated FullCalendar with an Upcoming Events Sidebar
 * and native HTML <dialog> constraint-validated event management modals.
 */
export class CalendarView {
  /**
   * @param {Object} [options={}]
   * @param {Object} [options.apiClient] - Injectable API client adapter
   * @param {boolean} [options.forceCalendarFallback=false] - Force fallback rendering
   */
  constructor(options = {}) {
    this.apiClient = options.apiClient || defaultApiClient;
    this.forceCalendarFallback = Boolean(options.forceCalendarFallback);

    this.container = null;
    this.element = null;
    this.calendarComponent = null;
    this.events = [];
    this.isMounted = false;
    this.selectedEventForDeletion = null;

    this._handleClick = this._handleClick.bind(this);
    this._handleCreateSubmit = this._handleCreateSubmit.bind(this);
    this._handleConfirmDelete = this._handleConfirmDelete.bind(this);
    this._handleDateSelect = this._handleDateSelect.bind(this);
    this._handleEventClick = this._handleEventClick.bind(this);
  }

  /**
   * Mounts the view into the provided container.
   *
   * @param {HTMLElement} container
   */
  mount(container) {
    if (!container) {
      throw new Error("Target container is required to mount CalendarView");
    }

    this.container = container;
    this.isMounted = true;

    this.element = document.createElement("section");
    this.element.className = "scene-view calendar-scene";
    this.element.setAttribute("aria-labelledby", "calendar-title");

    this.element.innerHTML = `
      <header class="scene-header calendar-scene-header-row">
        <div>
          <nav class="scene-breadcrumbs" aria-label="Breadcrumb">
            <span class="breadcrumb-item">Pages</span>
            <span class="breadcrumb-separator" aria-hidden="true">/</span>
            <span class="breadcrumb-item active" aria-current="page">Calendar</span>
          </nav>
          <h1 id="calendar-title" class="scene-title">Calendar</h1>
          <p class="scene-subtitle">Scheduled milestones, appointments, and operations</p>
        </div>
        <div>
          <button type="button" class="btn btn-primary" data-action="open-create-modal" data-testid="add-event-btn" style="background-color: var(--color-primary); color: #ffffff; padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-weight: 500; display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer;">
            + Add Event
          </button>
        </div>
      </header>

      <div id="calendar-alert-container" class="calendar-alert-container"></div>

      <div class="calendar-layout-container">
        <!-- Upcoming Events Sidebar -->
        <aside class="calendar-sidebar" data-testid="calendar-sidebar">
          <div class="calendar-sidebar-header">
            <h2 class="calendar-sidebar-title">Upcoming Events</h2>
            <span class="calendar-badge" id="calendar-event-count" data-testid="sidebar-event-count">0</span>
          </div>
          <ul id="calendar-sidebar-list" class="calendar-sidebar-events-list" data-testid="sidebar-events-list">
            <li class="calendar-sidebar-empty">Loading upcoming events...</li>
          </ul>
        </aside>

        <!-- Calendar Grid -->
        <div class="calendar-grid-container" id="calendar-grid-container" data-testid="calendar-grid-container"></div>
      </div>

      <!-- Create Event Modal Dialog -->
      <dialog id="event-create-dialog" class="calendar-modal-dialog" data-testid="event-create-dialog">
        <header class="calendar-modal-header">
          <h3 class="calendar-modal-title">Schedule Calendar Event</h3>
          <button type="button" class="calendar-modal-dismiss" data-action="close-create-dialog" aria-label="Close dialog">✕</button>
        </header>
        <form id="event-create-form" class="calendar-modal-body" method="dialog" data-testid="event-create-form">
          <div class="calendar-form-group">
            <label for="event-title-input" class="calendar-form-label">Event Title *</label>
            <input type="text" id="event-title-input" name="title" class="calendar-form-input" required minlength="1" placeholder="e.g. Quarterly Planning" data-testid="event-title-input" />
          </div>
          <div class="calendar-form-group">
            <label for="event-start-input" class="calendar-form-label">Start Date *</label>
            <input type="date" id="event-start-input" name="startDate" class="calendar-form-input" required data-testid="event-start-input" />
          </div>
          <div class="calendar-form-group">
            <label for="event-end-input" class="calendar-form-label">End Date (Optional)</label>
            <input type="date" id="event-end-input" name="endDate" class="calendar-form-input" data-testid="event-end-input" />
          </div>
          <label class="calendar-form-checkbox-row">
            <input type="checkbox" id="event-all-day-input" name="allDay" checked data-testid="event-all-day-input" />
            <span>All-day operational window</span>
          </label>
          <footer class="calendar-modal-footer">
            <button type="button" class="btn btn-secondary" data-action="close-create-dialog" data-testid="cancel-create-btn" style="padding: 0.4rem 0.8rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer;">Cancel</button>
            <button type="submit" class="btn btn-primary" data-testid="submit-create-btn" style="background-color: var(--color-primary); color: #ffffff; padding: 0.4rem 0.8rem; border-radius: var(--radius-sm); font-weight: 500; cursor: pointer;">Create Event</button>
          </footer>
        </form>
      </dialog>

      <!-- Delete Confirmation Modal Dialog -->
      <dialog id="event-delete-dialog" class="calendar-modal-dialog" data-testid="event-delete-dialog">
        <header class="calendar-modal-header">
          <h3 class="calendar-modal-title">Confirm Event Removal</h3>
          <button type="button" class="calendar-modal-dismiss" data-action="close-delete-dialog" aria-label="Close dialog">✕</button>
        </header>
        <div class="calendar-modal-body">
          <p style="font-size: 0.875rem; color: var(--text-secondary);">Are you sure you want to remove the scheduled operational event from the active schedule?</p>
          <div id="delete-event-details" class="calendar-delete-details" data-testid="delete-event-details" style="padding: 0.75rem; background-color: var(--bg-secondary); border-radius: var(--radius-sm); border-left: 3px solid var(--color-danger); font-size: 0.875rem; display: flex; flex-direction: column; gap: 0.25rem;"></div>
        </div>
        <footer class="calendar-modal-footer">
          <button type="button" class="btn btn-secondary" data-action="close-delete-dialog" data-testid="cancel-delete-btn" style="padding: 0.4rem 0.8rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer;">Cancel</button>
          <button type="button" class="btn btn-danger" data-action="confirm-delete" data-testid="confirm-delete-btn" style="background-color: var(--color-danger); color: #ffffff; padding: 0.4rem 0.8rem; border-radius: var(--radius-sm); font-weight: 500; cursor: pointer;">Delete Event</button>
        </footer>
      </dialog>
    `;

    this.container.innerHTML = "";
    this.container.appendChild(this.element);

    this.element.addEventListener("click", this._handleClick);

    const createForm = this.element.querySelector("#event-create-form");
    if (createForm) {
      createForm.addEventListener("submit", this._handleCreateSubmit);
    }

    this.loadEvents();
  }

  /**
   * Loads events from the API client and mounts the calendar component and sidebar.
   */
  async loadEvents() {
    try {
      const events = await this.apiClient.getEvents();

      if (!this.isMounted || !this.element) {
        return;
      }

      this.events = events || [];
      this._renderSidebar();

      const gridContainer = this.element.querySelector("#calendar-grid-container");
      if (gridContainer) {
        this.calendarComponent = new CalendarComponent({
          events: this.events,
          onSelect: this._handleDateSelect,
          onEventClick: this._handleEventClick,
          forceFallback: this.forceCalendarFallback,
        });
        this.calendarComponent.mount(gridContainer);
      }
    } catch (err) {
      if (!this.isMounted) return;
      const message = err instanceof Error ? err.message : String(err);
      this._showAlert("alert", `Failed to load calendar events: ${message}`);
    }
  }

  /**
   * Renders the upcoming events in the left-hand sidebar list.
   * @private
   */
  _renderSidebar() {
    const listEl = this.element?.querySelector("#calendar-sidebar-list");
    const countEl = this.element?.querySelector("#calendar-event-count");
    if (!listEl || !countEl) return;

    countEl.textContent = String(this.events.length);
    listEl.innerHTML = "";

    if (this.events.length === 0) {
      listEl.innerHTML = `<li class="calendar-sidebar-empty" data-testid="sidebar-empty">No upcoming events scheduled</li>`;
      return;
    }

    // Sort chronologically by start date
    const sorted = [...this.events].sort((a, b) => {
      if (a.start < b.start) return -1;
      if (a.start > b.start) return 1;
      return 0;
    });

    sorted.forEach((event) => {
      const li = document.createElement("li");
      li.className = "calendar-sidebar-event-card";
      li.dataset.eventId = String(event.id);
      li.dataset.testid = `sidebar-event-${event.id}`;

      let dateText = event.start;
      if (event.start && event.start.includes("T")) {
        dateText = event.start.split("T")[0];
      }
      const dateLabel = event.allDay ? `${dateText} (All Day)` : `${dateText}`;

      li.innerHTML = `
        <div class="calendar-sidebar-card-top">
          <span class="calendar-sidebar-card-title">${event.title}</span>
          <button type="button" class="calendar-event-delete-btn" data-action="delete-event" data-event-id="${event.id}" aria-label="Delete ${event.title}">✕</button>
        </div>
        <span class="calendar-sidebar-card-date">${dateLabel}</span>
      `;

      listEl.appendChild(li);
    });
  }

  /**
   * Handles user clicks within the view.
   * @param {MouseEvent} evt
   * @private
   */
  _handleClick(evt) {
    const target = evt.target;
    if (!target) return;

    // Open create event dialog
    if (target.closest("[data-action='open-create-modal']")) {
      this._openCreateModal();
      return;
    }

    // Dismiss alert banner
    const dismissBtn = target.closest(".calendar-alert-dismiss");
    if (dismissBtn) {
      const alertEl = dismissBtn.closest(".calendar-alert");
      alertEl?.remove();
      return;
    }

    // Close create dialog
    if (target.closest("[data-action='close-create-dialog']")) {
      const dialog = this.element?.querySelector("#event-create-dialog");
      closeModal(dialog);
      return;
    }

    // Close delete dialog
    if (target.closest("[data-action='close-delete-dialog']")) {
      const dialog = this.element?.querySelector("#event-delete-dialog");
      closeModal(dialog);
      this.selectedEventForDeletion = null;
      return;
    }

    // Delete event action from sidebar button or card
    const deleteBtn = target.closest("[data-action='delete-event']");
    if (deleteBtn) {
      evt.stopPropagation();
      const eventId = Number(deleteBtn.dataset.eventId);
      const found = this.events.find((e) => e.id === eventId);
      if (found) {
        this._handleEventClick({ id: found.id, title: found.title, start: found.start });
      }
      return;
    }

    // Clicking sidebar card
    const sidebarCard = target.closest(".calendar-sidebar-event-card");
    if (sidebarCard) {
      const eventId = Number(sidebarCard.dataset.eventId);
      const found = this.events.find((e) => e.id === eventId);
      if (found) {
        this._handleEventClick({ id: found.id, title: found.title, start: found.start });
      }
      return;
    }

    // Confirm deletion in delete dialog
    if (target.closest("[data-action='confirm-delete']")) {
      this._handleConfirmDelete();
      return;
    }
  }

  /**
   * Opens the create event dialog and optionally pre-fills start and end dates.
   * @param {Object} [dateRange={}]
   * @private
   */
  _openCreateModal(dateRange = {}) {
    const dialog = this.element?.querySelector("#event-create-dialog");
    const form = this.element?.querySelector("#event-create-form");
    if (!dialog || !form) return;

    form.reset();

    const titleInput = form.querySelector("#event-title-input");
    const startInput = form.querySelector("#event-start-input");
    const endInput = form.querySelector("#event-end-input");
    const allDayInput = form.querySelector("#event-all-day-input");

    if (dateRange.startStr) {
      startInput.value = dateRange.startStr;
    } else if (dateRange.start instanceof Date) {
      startInput.value = dateRange.start.toISOString().split("T")[0];
    } else {
      startInput.value = new Date().toISOString().split("T")[0];
    }

    if (dateRange.endStr) {
      endInput.value = dateRange.endStr;
    } else if (dateRange.end instanceof Date) {
      endInput.value = dateRange.end.toISOString().split("T")[0];
    }

    if (dateRange.allDay !== undefined) {
      allDayInput.checked = Boolean(dateRange.allDay);
    }

    openModal(dialog);
    titleInput?.focus();
  }

  /**
   * Callback invoked by CalendarComponent when date range is selected on grid.
   * @param {Object} selectionInfo
   * @private
   */
  _handleDateSelect(selectionInfo) {
    this._openCreateModal(selectionInfo);
  }

  /**
   * Callback invoked when an event is clicked on grid or sidebar.
   * @param {Object} clickInfo
   * @private
   */
  _handleEventClick(clickInfo) {
    this.selectedEventForDeletion = clickInfo;
    const dialog = this.element?.querySelector("#event-delete-dialog");
    const detailsEl = this.element?.querySelector("#delete-event-details");

    if (detailsEl) {
      let dateStr = clickInfo.start ? String(clickInfo.start) : "";
      if (dateStr.includes("T")) dateStr = dateStr.split("T")[0];

      detailsEl.innerHTML = `
        <strong>${clickInfo.title}</strong>
        <span style="color: var(--text-muted); font-size: 0.8125rem;">Date: ${dateStr}</span>
      `;
    }

    openModal(dialog);
  }

  /**
   * Handles submission of the event creation form.
   * @param {SubmitEvent} evt
   * @private
   */
  async _handleCreateSubmit(evt) {
    evt.preventDefault();
    const form = evt.target;
    if (!form) return;

    if (!form.checkValidity()) {
      if (typeof form.reportValidity === "function") {
        form.reportValidity();
      }
      return;
    }

    const title = form.querySelector("#event-title-input")?.value?.trim();
    const startDate = form.querySelector("#event-start-input")?.value;
    const endDate = form.querySelector("#event-end-input")?.value;
    const allDay = Boolean(form.querySelector("#event-all-day-input")?.checked);

    if (!title || !startDate) {
      this._showAlert("alert", "Please provide a valid title and start date.");
      return;
    }

    const payload = {
      title,
      start: startDate,
      allDay,
      ...(endDate ? { end: endDate } : {}),
    };

    try {
      const created = await this.apiClient.createEvent(payload);

      if (!this.isMounted) return;

      this.events.push(created);
      this._renderSidebar();

      if (this.calendarComponent) {
        this.calendarComponent.update({ events: this.events });
      }

      const dialog = this.element?.querySelector("#event-create-dialog");
      closeModal(dialog);
      form.reset();

      this._showAlert(
        "status",
        `Calendar Event <strong>${created.title}</strong> scheduled successfully.`,
      );
    } catch (err) {
      if (!this.isMounted) return;
      const message = err instanceof Error ? err.message : String(err);
      this._showAlert("alert", `Failed to schedule event: ${message}`);
    }
  }

  /**
   * Confirms deletion of the selected event.
   * @private
   */
  async _handleConfirmDelete() {
    if (!this.selectedEventForDeletion) return;
    const eventId = Number(this.selectedEventForDeletion.id);

    try {
      await this.apiClient.deleteEvent(eventId);

      if (!this.isMounted) return;

      const deletedTitle = this.selectedEventForDeletion.title;
      this.events = this.events.filter((e) => e.id !== eventId);
      this._renderSidebar();

      if (this.calendarComponent) {
        this.calendarComponent.update({ events: this.events });
      }

      const dialog = this.element?.querySelector("#event-delete-dialog");
      closeModal(dialog);
      this.selectedEventForDeletion = null;

      this._showAlert(
        "status",
        `Calendar Event <strong>${deletedTitle}</strong> successfully removed.`,
      );
    } catch (err) {
      if (!this.isMounted) return;
      const message = err instanceof Error ? err.message : String(err);
      this._showAlert("alert", `Failed to remove event: ${message}`);
    }
  }

  /**
   * Displays an inline status or alert banner.
   *
   * @param {"status"|"alert"} type
   * @param {string} messageHtml
   * @private
   */
  _showAlert(type, messageHtml) {
    const alertContainer = this.element?.querySelector("#calendar-alert-container");
    if (!alertContainer) return;

    const isStatus = type === "status";
    const alertEl = document.createElement("div");
    alertEl.className = `calendar-alert ${isStatus ? "calendar-alert-success" : "calendar-alert-danger"}`;
    alertEl.setAttribute("role", type);
    alertEl.dataset.testid = isStatus ? "calendar-alert-status" : "calendar-alert-error";

    alertEl.innerHTML = `
      <div class="calendar-alert-body">${messageHtml}</div>
      <button type="button" class="calendar-alert-dismiss" aria-label="${isStatus ? "Dismiss message" : "Dismiss alert"}">✕</button>
    `;

    alertContainer.innerHTML = "";
    alertContainer.appendChild(alertEl);
  }

  /**
   * Cleans up all DOM elements, modals, and child calendar components upon view transition.
   */
  unmount() {
    this.isMounted = false;

    // Close any open modals
    const createDialog = this.element?.querySelector("#event-create-dialog");
    const deleteDialog = this.element?.querySelector("#event-delete-dialog");
    closeModal(createDialog);
    closeModal(deleteDialog);

    if (this.calendarComponent) {
      this.calendarComponent.unmount();
      this.calendarComponent = null;
    }

    if (this.element) {
      this.element.removeEventListener("click", this._handleClick);
      const createForm = this.element.querySelector("#event-create-form");
      if (createForm) {
        createForm.removeEventListener("submit", this._handleCreateSubmit);
      }
      if (this.element.parentNode) {
        this.element.remove();
      }
    }

    this.container = null;
    this.element = null;
    this.events = [];
    this.selectedEventForDeletion = null;
  }
}
