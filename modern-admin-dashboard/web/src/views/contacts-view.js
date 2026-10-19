import { apiClient as defaultApiClient } from "../api/index.js";
import { DataTable } from "../components/data-table.js";

/**
 * Contacts Information View (/contacts)
 * Live directory view for browsing, filtering, and sorting client and institutional contacts.
 */
export class ContactsView {
  /**
   * @param {Object} [options={}]
   * @param {Object} [options.apiClient] - Injectable API client adapter
   */
  constructor(options = {}) {
    this.apiClient = options.apiClient || defaultApiClient;
    this.container = null;
    this.element = null;
    this.dataTable = null;
    this.contacts = [];
    this.isMounted = false;
    this.fetchPromise = null;

    this._handleClick = this._handleClick.bind(this);
  }

  /**
   * Mounts the view into the provided container.
   *
   * @param {HTMLElement} container
   */
  mount(container) {
    if (!container) {
      throw new Error("Target container is required to mount ContactsView");
    }

    this.container = container;
    this.isMounted = true;

    this.element = document.createElement("section");
    this.element.className = "scene-view contacts-scene";
    this.element.setAttribute("aria-labelledby", "contacts-title");

    this.element.innerHTML = `
      <header class="scene-header">
        <nav class="scene-breadcrumbs" aria-label="Breadcrumb">
          <span class="breadcrumb-item">Data Management</span>
          <span class="breadcrumb-separator" aria-hidden="true">/</span>
          <span class="breadcrumb-item active" aria-current="page">Contacts Information</span>
        </nav>
        <h1 id="contacts-title" class="scene-title">Contacts Information</h1>
        <p class="scene-subtitle">External client and institutional contacts directory</p>
      </header>

      <div id="contacts-content-container" class="contacts-content-container"></div>
    `;

    this.container.innerHTML = "";
    this.container.appendChild(this.element);

    this.element.addEventListener("click", this._handleClick);

    this.loadContacts();
  }

  /**
   * Fetches contacts from the backend and initializes the DataTable.
   */
  loadContacts() {
    const contentEl = this.element?.querySelector("#contacts-content-container");
    if (!contentEl) {
      return;
    }

    contentEl.innerHTML = `
      <div class="contacts-status-loading" role="status">
        <span class="spinner font-mono" aria-hidden="true">[PENDING]</span> Loading contacts...
      </div>
    `;

    this.fetchPromise = (async () => {
      try {
        const contacts = await this.apiClient.getContacts();

        if (!this.isMounted || !this.element) {
          return;
        }

        this.contacts = contacts || [];
        contentEl.innerHTML = "";

        const columns = [
          { key: "id", label: "ID", sortable: true, width: "60px" },
          { key: "registrarId", label: "Registrar ID", sortable: true, width: "120px" },
          { key: "name", label: "Name", sortable: true },
          { key: "age", label: "Age", sortable: true, width: "70px" },
          { key: "phone", label: "Phone", sortable: true },
          { key: "email", label: "Email", sortable: true },
          { key: "address", label: "Address", sortable: true },
          { key: "city", label: "City", sortable: true },
          { key: "zipCode", label: "Zip Code", sortable: true, width: "90px" },
        ];

        this.dataTable = new DataTable({
          columns,
          data: this.contacts,
          searchable: true,
          searchPlaceholder: "Search contacts by name, email, city, address, or registrar ID...",
          ariaLabel: "Contacts directory",
        });

        this.dataTable.mount(contentEl);
      } catch (error) {
        if (!this.isMounted || !this.element) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);

        contentEl.innerHTML = `
          <div class="contacts-status-error" role="alert" data-testid="contacts-error">
            <div class="alert-icon font-mono" aria-hidden="true">[WARN]</div>
            <div class="alert-body">
              <h3 class="alert-heading">Unable to Load Contacts</h3>
              <p class="alert-text">${message}</p>
              <button type="button" class="btn-retry" id="retry-contacts-btn">Retry</button>
            </div>
          </div>
        `;
      }
    })();
  }

  /**
   * Handles click events for retry button.
   *
   * @param {Event} event
   */
  _handleClick(event) {
    const target = event.target;
    if (target && target.closest("#retry-contacts-btn")) {
      this.loadContacts();
    }
  }

  /**
   * Cleans up resources on unmount.
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
    this.contacts = [];
  }
}
