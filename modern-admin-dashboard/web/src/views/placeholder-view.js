/**
 * Base view meeting the view lifecycle seam (mount / unmount) for placeholder scenes.
 */
export class PlaceholderView {
  /**
   * @param {Object} options
   * @param {string} options.title - View display title
   * @param {string} options.subtitle - Descriptive subtitle
   * @param {string} options.section - Section hierarchy
   * @param {string} options.domainConcept - Domain description
   */
  constructor({ title, subtitle, section, domainConcept }) {
    this.title = title;
    this.subtitle = subtitle;
    this.section = section;
    this.domainConcept = domainConcept;
    this.container = null;
    this.element = null;
  }

  /**
   * Mounts the view element into the provided container.
   *
   * @param {HTMLElement} container
   */
  mount(container) {
    this.container = container;
    this.element = document.createElement("section");
    this.element.className = "scene-view placeholder-scene";
    this.element.setAttribute("aria-labelledby", "scene-title");

    this.element.innerHTML = `
      <header class="scene-header">
        <nav class="scene-breadcrumbs" aria-label="Breadcrumb">
          <span class="breadcrumb-item">${this.section}</span>
          <span class="breadcrumb-separator" aria-hidden="true">/</span>
          <span class="breadcrumb-item active" aria-current="page">${this.title}</span>
        </nav>
        <h1 id="scene-title" class="scene-title">${this.title}</h1>
        <p class="scene-subtitle">${this.subtitle}</p>
      </header>

      <div class="scene-body">
        <div class="placeholder-card">
          <div class="placeholder-badge">Placeholder Stub</div>
          <p class="placeholder-desc">${this.domainConcept}</p>
          <div class="placeholder-notice">
            Phase 1 Walking Skeleton: Route and shell navigation verified. Full domain scene deferred to subsequent phase.
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = "";
    this.container.appendChild(this.element);
  }

  /**
   * Cleans up view resources on unmount.
   */
  unmount() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
    this.container = null;
    this.element = null;
  }
}
