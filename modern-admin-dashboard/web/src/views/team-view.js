import { apiClient as defaultApiClient } from "../api/index.js";
import { DataTable } from "../components/data-table.js";

/**
 * Team Directory View (/team)
 * Live operational view for browsing, filtering, and mutating organizational Team Members.
 */
export class TeamView {
  /**
   * @param {Object} [options={}]
   * @param {Object} [options.apiClient] - Injectable API client adapter
   */
  constructor(options = {}) {
    this.apiClient = options.apiClient || defaultApiClient;
    this.container = null;
    this.element = null;
    this.dataTable = null;
    this.teamMembers = [];
    this.isMounted = false;
    this.fetchPromise = null;
    this.mutationPromise = null;

    this._handleChange = this._handleChange.bind(this);
    this._handleClick = this._handleClick.bind(this);
  }

  /**
   * Mounts the view into the provided container.
   *
   * @param {HTMLElement} container
   */
  mount(container) {
    if (!container) {
      throw new Error("Target container is required to mount TeamView");
    }

    this.container = container;
    this.isMounted = true;

    this.element = document.createElement("section");
    this.element.className = "scene-view team-scene";
    this.element.setAttribute("aria-labelledby", "team-title");

    this.element.innerHTML = `
      <header class="scene-header">
        <nav class="scene-breadcrumbs" aria-label="Breadcrumb">
          <span class="breadcrumb-item">Data Management</span>
          <span class="breadcrumb-separator" aria-hidden="true">/</span>
          <span class="breadcrumb-item active" aria-current="page">Manage Team</span>
        </nav>
        <h1 id="team-title" class="scene-title">Manage Team</h1>
        <p class="scene-subtitle">Internal organizational personnel and collaborators</p>
      </header>

      <div id="team-alert-container" class="team-alert-container"></div>
      <div id="team-content-container" class="team-content-container"></div>
    `;

    this.container.innerHTML = "";
    this.container.appendChild(this.element);

    this.element.addEventListener("change", this._handleChange);
    this.element.addEventListener("click", this._handleClick);

    this.loadTeamMembers();
  }

  /**
   * Fetches team members from the backend and initializes the DataTable.
   */
  loadTeamMembers() {
    const contentEl = this.element?.querySelector("#team-content-container");
    if (!contentEl) {
      return;
    }

    contentEl.innerHTML = `
      <div class="team-status-loading" role="status">
        <span class="spinner" aria-hidden="true">⏳</span> Loading team members...
      </div>
    `;

    this.fetchPromise = (async () => {
      try {
        const members = await this.apiClient.getTeamMembers();

        if (!this.isMounted || !this.element) {
          return;
        }

        this.teamMembers = members || [];
        contentEl.innerHTML = "";

        const columns = [
          { key: "id", label: "ID", sortable: true, width: "70px" },
          { key: "name", label: "Name", sortable: true },
          { key: "age", label: "Age", sortable: true, width: "80px" },
          { key: "phone", label: "Phone", sortable: true },
          { key: "email", label: "Email", sortable: true },
          {
            key: "access",
            label: "Access Level",
            sortable: true,
            render: (access, row) => this._renderAccessCell(access, row),
          },
        ];

        this.dataTable = new DataTable({
          columns,
          data: this.teamMembers,
          searchable: true,
          searchPlaceholder: "Search team members by name or email...",
          ariaLabel: "Team members directory",
        });

        this.dataTable.mount(contentEl);
      } catch (error) {
        if (!this.isMounted || !this.element) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);

        contentEl.innerHTML = `
          <div class="team-status-error" role="alert" data-testid="team-error">
            <div class="alert-icon" aria-hidden="true">⚠️</div>
            <div class="alert-body">
              <h3 class="alert-heading">Unable to Load Team Members</h3>
              <p class="alert-text">${message}</p>
              <button type="button" class="btn-retry" id="retry-team-btn">Retry</button>
            </div>
          </div>
        `;
      }
    })();
  }

  /**
   * Renders the custom cell for Access Level containing both badge and inline selector.
   *
   * @param {string} access
   * @param {Object} row
   * @returns {HTMLElement}
   */
  _renderAccessCell(access, row) {
    const container = document.createElement("div");
    container.className = "access-level-cell";

    const badge = document.createElement("span");
    badge.className = `badge badge-${access}`;
    badge.textContent = access;

    const select = document.createElement("select");
    select.className = "access-select";
    select.dataset.memberId = String(row.id);
    select.setAttribute("aria-label", `Change Access Level for ${row.name}`);

    for (const role of ["admin", "manager", "user"]) {
      const opt = document.createElement("option");
      opt.value = role;
      opt.textContent = role.charAt(0).toUpperCase() + role.slice(1);
      if (role === access) {
        opt.selected = true;
      }
      select.appendChild(opt);
    }
    select.value = access;

    container.appendChild(badge);
    container.appendChild(select);
    return container;
  }

  /**
   * Handles inline access level selector changes.
   *
   * @param {Event} event
   */
  _handleChange(event) {
    const target = event.target;
    if (target && target.classList.contains("access-select")) {
      const memberId = Number(target.dataset.memberId);
      const newAccess = target.value;
      this.handleAccessChange(memberId, newAccess, target);
    }
  }

  /**
   * Handles action clicks for dismiss buttons and retry.
   *
   * @param {Event} event
   */
  _handleClick(event) {
    const target = event.target;
    if (target.closest(".team-alert-dismiss")) {
      const alertEl = target.closest(".team-alert");
      alertEl?.remove();
      return;
    }

    if (target.closest("#retry-team-btn")) {
      this.loadTeamMembers();
      return;
    }
  }

  /**
   * Mutates a team member's access level via the API and updates local UI state.
   *
   * @param {number} memberId
   * @param {string} newAccess
   * @param {HTMLSelectElement} selectElement
   */
  handleAccessChange(memberId, newAccess, selectElement) {
    const member = this.teamMembers.find((m) => m.id === memberId);
    if (!member) return;

    const previousAccess = member.access;
    if (newAccess === previousAccess) return;

    this.mutationPromise = (async () => {
      try {
        await this.apiClient.updateTeamMemberAccess(memberId, newAccess);

        if (!this.isMounted) return;

        member.access = newAccess;
        this.dataTable?.update({ data: this.teamMembers });

        this._showAlert(
          "status",
          `Access level for <strong>${member.name}</strong> updated to <strong>${newAccess}</strong>.`,
        );
      } catch (error) {
        if (!this.isMounted) return;

        // Revert select dropdown value
        selectElement.value = previousAccess;

        const message = error instanceof Error ? error.message : String(error);
        this._showAlert("alert", `Failed to update access level for ${member.name}: ${message}`);
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
    const alertContainer = this.element?.querySelector("#team-alert-container");
    if (!alertContainer) return;

    const isStatus = type === "status";
    const alertEl = document.createElement("div");
    alertEl.className = `team-alert ${isStatus ? "team-alert-success" : "team-alert-danger"}`;
    alertEl.setAttribute("role", type);
    alertEl.dataset.testid = isStatus ? "team-alert-status" : "team-alert-error";

    alertEl.innerHTML = `
      <div class="team-alert-body">${messageHtml}</div>
      <button type="button" class="team-alert-dismiss" aria-label="${isStatus ? "Dismiss message" : "Dismiss alert"}">✕</button>
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
      this.element.removeEventListener("change", this._handleChange);
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
    this.teamMembers = [];
  }
}
