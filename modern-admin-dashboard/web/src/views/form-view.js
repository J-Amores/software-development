import { apiClient as defaultApiClient } from "../api/index.js";

/**
 * Team Member Provisioning Form View (/form)
 * Zero-framework, semantic HTML form with native Constraint Validation.
 */
export class FormView {
  /**
   * @param {Object} [options={}]
   * @param {Object} [options.apiClient] - Injectable API client adapter
   */
  constructor(options = {}) {
    this.apiClient = options.apiClient || defaultApiClient;
    this.container = null;
    this.element = null;
    this.form = null;
    this.isMounted = false;
    this.submitPromise = null;

    this.handleSubmit = this.handleSubmit.bind(this);
    this._handleInput = this._handleInput.bind(this);
    this._handleClick = this._handleClick.bind(this);
  }

  /**
   * Mounts the view into the provided container.
   *
   * @param {HTMLElement} container
   */
  mount(container) {
    if (!container) {
      throw new Error("Target container is required to mount FormView");
    }

    this.container = container;
    this.isMounted = true;

    this.element = document.createElement("section");
    this.element.className = "scene-view form-scene";
    this.element.setAttribute("aria-labelledby", "form-title");

    this.element.innerHTML = `
      <header class="scene-header">
        <nav class="scene-breadcrumbs" aria-label="Breadcrumb">
          <span class="breadcrumb-item">Pages</span>
          <span class="breadcrumb-separator" aria-hidden="true">/</span>
          <span class="breadcrumb-item active" aria-current="page">Profile Form</span>
        </nav>
        <h1 id="form-title" class="scene-title">Create User</h1>
        <p class="scene-subtitle">Create a New User Profile</p>
      </header>

      <div id="form-alert-container" class="form-alert-container"></div>

      <div class="form-card">
        <form class="provision-form" novalidate aria-labelledby="form-title">
          <div class="form-grid">
            <div class="form-group">
              <label for="member-name" class="form-label">
                Full Name <span class="required-indicator" aria-hidden="true">*</span>
              </label>
              <input
                type="text"
                id="member-name"
                name="name"
                class="form-input"
                placeholder="e.g. John Doe"
                required
                minlength="1"
                aria-describedby="member-name-error"
                aria-invalid="false"
              />
              <span class="field-error-slot" id="member-name-slot"></span>
            </div>

            <div class="form-group">
              <label for="member-email" class="form-label">
                Email Address <span class="required-indicator" aria-hidden="true">*</span>
              </label>
              <input
                type="email"
                id="member-email"
                name="email"
                class="form-input"
                placeholder="e.g. john@example.com"
                required
                aria-describedby="member-email-error"
                aria-invalid="false"
              />
              <span class="field-error-slot" id="member-email-slot"></span>
            </div>

            <div class="form-group">
              <label for="member-age" class="form-label">
                Age <span class="required-indicator" aria-hidden="true">*</span>
              </label>
              <input
                type="number"
                id="member-age"
                name="age"
                class="form-input"
                placeholder="e.g. 30"
                required
                min="1"
                max="120"
                aria-describedby="member-age-error"
                aria-invalid="false"
              />
              <span class="field-error-slot" id="member-age-slot"></span>
            </div>

            <div class="form-group">
              <label for="member-phone" class="form-label">
                Contact Phone <span class="required-indicator" aria-hidden="true">*</span>
              </label>
              <input
                type="tel"
                id="member-phone"
                name="phone"
                class="form-input"
                placeholder="e.g. (555) 123-4567"
                required
                minlength="1"
                aria-describedby="member-phone-error"
                aria-invalid="false"
              />
              <span class="field-error-slot" id="member-phone-slot"></span>
            </div>

            <div class="form-group form-group-full">
              <label for="member-access" class="form-label">
                Access Level <span class="required-indicator" aria-hidden="true">*</span>
              </label>
              <select
                id="member-access"
                name="access"
                class="form-select"
                required
                aria-describedby="member-access-error"
                aria-invalid="false"
              >
                <option value="" disabled selected>Select Access Level...</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
              </select>
              <span class="field-error-slot" id="member-access-slot"></span>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" id="btn-submit-user">
              Create New User
            </button>
          </div>
        </form>
      </div>
    `;

    this.container.innerHTML = "";
    this.container.appendChild(this.element);

    this.form = this.element.querySelector("form.provision-form");
    this.form.addEventListener("submit", this.handleSubmit);
    this.form.addEventListener("input", this._handleInput);
    this.element.addEventListener("click", this._handleClick);
  }

  /**
   * Validates a single field using native HTML5 Constraint Validation APIs.
   *
   * @param {HTMLInputElement|HTMLSelectElement} field
   * @returns {boolean}
   */
  _validateField(field) {
    const name = field.name;
    const slot = this.element?.querySelector(`#member-${name}-slot`);
    if (!slot) return true;

    if (!field.checkValidity()) {
      field.setAttribute("aria-invalid", "true");
      let message = "This field is required.";

      if (field.validity.valueMissing) {
        const labelText = field.labels?.[0]?.textContent?.replace(/\*/g, "").trim();
        message = `${labelText || "This field"} is required.`;
      } else if (field.validity.typeMismatch) {
        message = "Please enter a valid email address.";
      } else if (field.validity.rangeUnderflow || field.validity.rangeOverflow) {
        message = "Age must be between 1 and 120.";
      } else if (field.validity.badInput) {
        message = "Please enter a valid number.";
      }

      slot.innerHTML = `<span class="field-error" id="member-${name}-error" role="alert">${message}</span>`;
      return false;
    } else {
      field.setAttribute("aria-invalid", "false");
      slot.innerHTML = "";
      return true;
    }
  }

  /**
   * Handles realtime input to clear validation errors when corrected.
   *
   * @param {Event} event
   */
  _handleInput(event) {
    const target = event.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "SELECT")) {
      if (target.getAttribute("aria-invalid") === "true") {
        this._validateField(target);
      }
    }
  }

  /**
   * Handles click events for dismiss buttons.
   *
   * @param {Event} event
   */
  _handleClick(event) {
    const target = event.target;
    if (target && target.closest(".form-alert-dismiss")) {
      const alertEl = target.closest(".form-alert");
      alertEl?.remove();
    }
  }

  /**
   * Handles form submission.
   *
   * @param {Event} event
   */
  handleSubmit(event) {
    event.preventDefault();

    const fields = Array.from(this.form.querySelectorAll("input, select"));
    let isValid = true;
    for (const field of fields) {
      const valid = this._validateField(field);
      if (!valid && isValid) {
        field.focus();
        isValid = false;
      }
    }

    if (!isValid) {
      return;
    }

    const formData = new FormData(this.form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      age: Number(formData.get("age")),
      phone: String(formData.get("phone") || "").trim(),
      access: String(formData.get("access") || "").trim(),
    };

    this.submitPromise = (async () => {
      try {
        const result = await this.apiClient.createTeamMember(payload);
        if (!this.isMounted) return;

        this.form.reset();
        fields.forEach((f) => f.setAttribute("aria-invalid", "false"));

        this._showAlert(
          "status",
          `
            <div class="form-alert-content">
              <span class="success-icon" aria-hidden="true">✓</span>
              <span>Successfully provisioned Team Member <strong>${result.name}</strong> with Access Level <strong>${result.access}</strong>.</span>
            </div>
            <a href="/team" class="btn-navigate-team" id="nav-team-link">View in Team Directory →</a>
          `,
        );
      } catch (err) {
        if (!this.isMounted) return;

        const message = err instanceof Error ? err.message : String(err);
        this._showAlert(
          "alert",
          `
            <div class="form-alert-content">
              <span class="alert-icon" aria-hidden="true">⚠️</span>
              <span>Failed to provision Team Member: ${message}</span>
            </div>
          `,
        );
      }
    })();
  }

  /**
   * Displays an inline confirmation or error banner.
   *
   * @param {"status"|"alert"} type
   * @param {string} messageHtml
   */
  _showAlert(type, messageHtml) {
    const alertContainer = this.element?.querySelector("#form-alert-container");
    if (!alertContainer) return;

    const isStatus = type === "status";
    const alertEl = document.createElement("div");
    alertEl.className = `form-alert ${isStatus ? "form-alert-success" : "form-alert-danger"}`;
    alertEl.setAttribute("role", type);
    alertEl.dataset.testid = isStatus ? "form-success" : "form-error";

    alertEl.innerHTML = `
      <div class="form-alert-body">${messageHtml}</div>
      <button type="button" class="form-alert-dismiss" aria-label="${isStatus ? "Dismiss message" : "Dismiss alert"}">✕</button>
    `;

    alertContainer.innerHTML = "";
    alertContainer.appendChild(alertEl);
  }

  /**
   * Cleans up listeners and removes DOM nodes.
   */
  unmount() {
    this.isMounted = false;

    if (this.form) {
      this.form.removeEventListener("submit", this.handleSubmit);
      this.form.removeEventListener("input", this._handleInput);
    }

    if (this.element) {
      this.element.removeEventListener("click", this._handleClick);
      if (this.element.parentNode) {
        this.element.remove();
      }
    }

    this.container = null;
    this.element = null;
    this.form = null;
  }
}
