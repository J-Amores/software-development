import { apiClient as defaultApiClient } from "../api/index.js";

/**
 * Escapes unsafe characters for HTML rendering.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Curated FAQ View (/faq)
 * Renders verified organizational guidelines and operational answers
 * via accessible semantic HTML <details> and <summary> accordions
 * with real-time text query filtering, auto-expansion, and global toggle control.
 */
export class FaqView {
  /**
   * @param {Object} [options={}]
   * @param {Object} [options.apiClient] - Injectable API client adapter
   */
  constructor(options = {}) {
    this.apiClient = options.apiClient || defaultApiClient;

    this.container = null;
    this.element = null;
    this.faqs = [];
    this.filteredFaqs = [];
    this.searchQuery = "";
    this.isMounted = false;
    this.isLoading = true;
    this.error = null;

    this._handleSearchInput = this._handleSearchInput.bind(this);
    this._handleClick = this._handleClick.bind(this);
    this._handleAccordionToggle = this._handleAccordionToggle.bind(this);
  }

  /**
   * Mounts the view into the provided container.
   *
   * @param {HTMLElement} container
   */
  mount(container) {
    if (!container) {
      throw new Error("Target container is required to mount FaqView");
    }

    this.container = container;
    this.isMounted = true;

    this.element = document.createElement("section");
    this.element.className = "scene-view faq-scene";
    this.element.setAttribute("aria-labelledby", "faq-title");

    this.element.innerHTML = `
      <header class="scene-header">
        <nav class="scene-breadcrumbs" aria-label="Breadcrumb">
          <span class="breadcrumb-item">Pages</span>
          <span class="breadcrumb-separator" aria-hidden="true">/</span>
          <span class="breadcrumb-item active" aria-current="page">FAQ Page</span>
        </nav>
        <h1 id="faq-title" class="scene-title">FAQ Page</h1>
        <p class="scene-subtitle">Common organizational guidelines and procedures</p>
      </header>

      <div id="faq-alert-container" class="faq-alert-container"></div>

      <!-- Controls Toolbar: Search Filter & Expand/Collapse All -->
      <div class="faq-controls-bar">
        <div class="faq-search-wrapper">
          <span class="faq-search-icon" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
          <input
            type="search"
            id="faq-search-input"
            class="faq-search-input"
            placeholder="Search questions or keywords..."
            aria-label="Search FAQ entries"
            data-testid="faq-search-input"
          />
        </div>
        <div class="faq-controls-actions">
          <span id="faq-count-badge" class="faq-count-badge font-mono tabular-nums" data-testid="faq-count-badge">0 questions</span>
          <button
            type="button"
            id="faq-toggle-all-btn"
            class="faq-toggle-all-btn"
            data-action="toggle-all"
            data-testid="faq-toggle-all-btn"
          >
            Expand All
          </button>
        </div>
      </div>

      <!-- Semantic Accordion List -->
      <div id="faq-list-container" class="faq-list" data-testid="faq-list-container">
        <div class="faq-loading" data-testid="faq-loading">Loading organizational FAQ entries...</div>
      </div>
    `;

    this.container.innerHTML = "";
    this.container.appendChild(this.element);

    const searchInput = this.element.querySelector("#faq-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", this._handleSearchInput);
    }

    this.element.addEventListener("click", this._handleClick);

    this.loadFaqs();
  }

  /**
   * Fetches curated FAQs from the API adapter.
   */
  async loadFaqs() {
    this.isLoading = true;
    this.error = null;

    try {
      const faqs = await this.apiClient.getFaqs();

      if (!this.isMounted || !this.element) {
        return;
      }

      this.faqs = faqs || [];
      this.filteredFaqs = [...this.faqs];
      this.isLoading = false;

      this._renderList();
      this._updateToolbar();
    } catch (err) {
      if (!this.isMounted || !this.element) return;
      this.isLoading = false;
      const message = err instanceof Error ? err.message : String(err);
      this.error = message;
      this._showAlert("alert", `Failed to load FAQ entries: ${message}`);
      this._renderList();
    }
  }

  /**
   * Handles user keystrokes in the search filter input.
   * @param {InputEvent} evt
   * @private
   */
  _handleSearchInput(evt) {
    const input = evt.target;
    this.searchQuery = input ? input.value.trim().toLowerCase() : "";

    if (!this.searchQuery) {
      this.filteredFaqs = [...this.faqs];
    } else {
      this.filteredFaqs = this.faqs.filter((faq) => {
        const qMatch = faq.question && faq.question.toLowerCase().includes(this.searchQuery);
        const aMatch = faq.answer && faq.answer.toLowerCase().includes(this.searchQuery);
        const cMatch = faq.category && faq.category.toLowerCase().includes(this.searchQuery);
        return qMatch || aMatch || cMatch;
      });
    }

    this._renderList();
    this._updateToolbar();
  }

  /**
   * Handles button click actions in the view.
   * @param {MouseEvent} evt
   * @private
   */
  _handleClick(evt) {
    const target = evt.target;
    if (!target) return;

    // Expand/Collapse All
    if (target.closest("[data-action='toggle-all']")) {
      this._handleToggleAll();
      return;
    }

    // Dismiss alert banner
    const dismissBtn = target.closest(".faq-alert-dismiss");
    if (dismissBtn) {
      const alertEl = dismissBtn.closest(".faq-alert");
      alertEl?.remove();
      return;
    }
  }

  /**
   * Toggles all visible accordions between expanded and collapsed states.
   * @private
   */
  _handleToggleAll() {
    if (!this.element) return;
    const accordions = Array.from(this.element.querySelectorAll("details.faq-accordion"));
    if (accordions.length === 0) return;

    // Determine target state: if all are open, collapse all; otherwise expand all
    const allOpen = accordions.every((acc) => acc.open);
    const shouldOpen = !allOpen;

    accordions.forEach((acc) => {
      acc.open = shouldOpen;
    });

    this._syncToggleAllButton();
  }

  /**
   * Listens for individual details toggle events to keep toolbar button in sync.
   * @private
   */
  _handleAccordionToggle() {
    this._syncToggleAllButton();
  }

  /**
   * Synchronizes the text label of the Expand/Collapse All button based on current DOM state.
   * @private
   */
  _syncToggleAllButton() {
    const btn = this.element?.querySelector("#faq-toggle-all-btn");
    if (!btn) return;

    const accordions = Array.from(this.element?.querySelectorAll("details.faq-accordion") || []);
    if (accordions.length === 0) {
      btn.textContent = "Expand All";
      btn.disabled = true;
      return;
    }

    btn.disabled = false;
    const allOpen = accordions.every((acc) => acc.open);
    btn.textContent = allOpen ? "Collapse All" : "Expand All";
  }

  /**
   * Updates toolbar count badge and button state.
   * @private
   */
  _updateToolbar() {
    const badge = this.element?.querySelector("#faq-count-badge");
    if (!badge) return;

    if (this.searchQuery) {
      badge.textContent = `${this.filteredFaqs.length} of ${this.faqs.length} questions`;
    } else {
      const count = this.faqs.length;
      badge.textContent = `${count} ${count === 1 ? "question" : "questions"}`;
    }

    this._syncToggleAllButton();
  }

  /**
   * Renders the FAQ items or empty/loading state into the list container.
   * @private
   */
  _renderList() {
    const listContainer = this.element?.querySelector("#faq-list-container");
    if (!listContainer) return;

    listContainer.innerHTML = "";

    if (this.isLoading) {
      listContainer.innerHTML = `
        <div class="faq-loading" data-testid="faq-loading">Loading organizational FAQ entries...</div>
      `;
      return;
    }

    if (this.error) {
      listContainer.innerHTML = `
        <div class="faq-empty-state" data-testid="faq-error">
          <span class="faq-empty-title">Unable to display FAQ entries</span>
          <p class="faq-empty-desc">${escapeHtml(this.error)}</p>
        </div>
      `;
      return;
    }

    if (this.filteredFaqs.length === 0) {
      const emptyDesc = this.searchQuery
        ? `No FAQ entries match "<strong>${escapeHtml(this.searchQuery)}</strong>". Try adjusting your search query.`
        : "No organizational FAQ entries are currently available.";

      listContainer.innerHTML = `
        <div class="faq-empty-state" data-testid="faq-empty">
          <span class="faq-empty-title">No matching questions found</span>
          <p class="faq-empty-desc">${emptyDesc}</p>
        </div>
      `;
      return;
    }

    // When actively searching, auto-expand matching items so answers are immediately visible
    const isSearching = Boolean(this.searchQuery);

    this.filteredFaqs.forEach((faq) => {
      const details = document.createElement("details");
      details.className = "faq-accordion";
      details.dataset.id = String(faq.id);
      details.dataset.testid = `faq-item-${faq.id}`;
      if (isSearching) {
        details.open = true;
      }

      details.innerHTML = `
        <summary class="faq-summary" data-testid="faq-summary-${faq.id}">
          <span class="faq-question">${escapeHtml(faq.question)}</span>
          <div class="faq-summary-meta">
            <span class="faq-category-badge">${escapeHtml(faq.category)}</span>
            <span class="faq-chevron" aria-hidden="true">▾</span>
          </div>
        </summary>
        <div class="faq-content">
          <p class="faq-answer" data-testid="faq-answer-${faq.id}">${escapeHtml(faq.answer)}</p>
        </div>
      `;

      details.addEventListener("toggle", this._handleAccordionToggle);
      listContainer.appendChild(details);
    });
  }

  /**
   * Displays an inline alert banner.
   * @param {"status"|"alert"} type
   * @param {string} messageHtml
   * @private
   */
  _showAlert(type, messageHtml) {
    const alertContainer = this.element?.querySelector("#faq-alert-container");
    if (!alertContainer) return;

    const alertEl = document.createElement("div");
    alertEl.className = "faq-alert faq-alert-danger";
    alertEl.setAttribute("role", type);
    alertEl.dataset.testid = "faq-alert-error";

    alertEl.innerHTML = `
      <div class="faq-alert-body">${messageHtml}</div>
      <button type="button" class="faq-alert-dismiss" aria-label="Dismiss alert">&times;</button>
    `;

    alertContainer.innerHTML = "";
    alertContainer.appendChild(alertEl);
  }

  /**
   * Cleans up all DOM elements and event listeners upon view transition.
   */
  unmount() {
    this.isMounted = false;

    if (this.element) {
      const searchInput = this.element.querySelector("#faq-search-input");
      if (searchInput) {
        searchInput.removeEventListener("input", this._handleSearchInput);
      }

      this.element.removeEventListener("click", this._handleClick);

      const accordions = this.element.querySelectorAll("details.faq-accordion");
      accordions.forEach((acc) => {
        acc.removeEventListener("toggle", this._handleAccordionToggle);
      });

      if (this.element.parentNode) {
        this.element.remove();
      }
    }

    this.container = null;
    this.element = null;
    this.faqs = [];
    this.filteredFaqs = [];
    this.searchQuery = "";
  }
}
